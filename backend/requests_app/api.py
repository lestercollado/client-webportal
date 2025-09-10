from typing import List, Optional
from ninja import Router
from django.shortcuts import get_object_or_404
from .models import UserRequest, RequestHistory, AuthorizedPerson, TwoFactorAuth
from .schemas import (
    UserRequestSchema,
    UserRequestCreateSchema,
    UserRequestUpdateSchema,
    StatsOut,
    UserRequestListSchema,
    AuthorizedPersonCreateSchema,
)
from django.db.models import Count, Q
from ninja_jwt.tokens import RefreshToken
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from ninja.schema import Schema
from .tasks import send_2fa_email_task
import random
import string
from datetime import datetime, timezone, timedelta
import requests
import json
from django.utils.dateparse import parse_datetime


def get_client_ip(request):
    """A simple utility to get the client's IP address."""
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        ip = x_forwarded_for.split(",")[0]
    else:
        ip = request.META.get("REMOTE_ADDR")
    return ip


# Routers
router = Router()
auth_router = Router()


# ----------------------------
# Auth with 2FA
# ----------------------------
class LoginSchema(Schema):
    username: str
    password: str


class VerifySchema(Schema):
    username: str
    code: str


@auth_router.post("/login/")
def login(request, payload: LoginSchema):
    user = authenticate(username=payload.username, password=payload.password)
    if user is not None:
        code = "".join(random.choices(string.digits, k=4))
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
        two_factor_auth, created = TwoFactorAuth.objects.update_or_create(
            user=user,
            defaults={
                "code": code,
                "expires_at": expires_at,
                "created_at": datetime.now(timezone.utc),
            },
        )
        send_2fa_email_task.delay(user.id, code)
        return {"message": "2FA code sent to your email."}
    return {"message": "Invalid credentials."}


@auth_router.post("/verify-2fa/")
def verify_2fa(request, payload: VerifySchema):
    user = get_object_or_404(User, username=payload.username)
    two_factor_auth = get_object_or_404(TwoFactorAuth, user=user, code=payload.code)

    if not two_factor_auth.is_expired():
        refresh = RefreshToken.for_user(user)
        return {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
        }
    return {"message": "Code expired or invalid."}


# ----------------------------
# Requests
# ----------------------------
@router.get("/stats/", response=StatsOut)
def get_stats(request):
    """Returns statistics about user requests."""
    stats = UserRequest.objects.filter(active=True).aggregate(
        pending=Count("id", filter=Q(status="Pendiente")),
        completed=Count("id", filter=Q(status="Completado")),
        rejected=Count("id", filter=Q(status="Rechazado")),
        total=Count("id"),
    )
    return stats


import requests
import json
from django.utils.dateparse import parse_datetime

@router.get("/", response=List[UserRequestListSchema])
def list_requests(
    request,
    status: Optional[str] = None,
    company_name: Optional[str] = None,
    email: Optional[str] = None,
    customer_role: Optional[str] = None,
):
    """
    Sincroniza solicitudes desde el endpoint de WordPress
    y devuelve las solicitudes locales filtradas.
    """
    # 1. Fetch data from external WP endpoint
    try:
        response = requests.get("https://www.tcmariel.cu/wp-json/user-record/v1/records", timeout=15)
        response.raise_for_status()
        external_data = response.json()
    except Exception as e:
        print(f"[WARN] No se pudo sincronizar con WP: {e}")
        external_data = []

    # 2. Sync data with local DB
    for record in external_data:
        # Parse uploaded_files (viene como string tipo JSON)
        try:
            uploaded_files = json.loads(record.get("uploaded_files", "[]"))
        except Exception:
            uploaded_files = []

        # Crear o actualizar la solicitud
        obj, created = UserRequest.objects.update_or_create(
            id=int(record["id"]),   # usamos el id del WP como PK local
            defaults={
                "company_name": record.get("company_name", ""),
                "address": record.get("address", ""),
                "city": record.get("city", ""),
                "state": record.get("state", ""),
                "phone": record.get("phone", ""),
                "email": record.get("email", ""),
                "tax_id": record.get("tax_id", ""),
                "contact_name": record.get("contact_name", ""),
                "contact_position": record.get("contact_position", ""),
                "contact_phone": record.get("contact_phone", ""),
                "contact_email": record.get("contact_email", ""),
                "created_from_ip": record.get("ip_address", ""),
                "uploaded_files": uploaded_files,
                "active": True,
                "created_at": parse_datetime(record.get("created_at")),
            },
        )

        # 3. Sync authorized persons
        obj.authorized_persons.all().delete()  # limpiamos antes de volver a cargar
        for person in record.get("authorized_persons", []):
            AuthorizedPerson.objects.create(
                user_request=obj,
                name=person.get("name", ""),
                position=person.get("position", ""),
                phone=person.get("phone", ""),
                email=person.get("email") or None,
                informational=bool(person.get("informational", 0)),
                operational=bool(person.get("operational", 0)),
                associated_with=person.get("associated_with", ""),
            )

    # 4. Query local DB con filtros
    qs = UserRequest.objects.filter(active=True)

    if status:
        qs = qs.filter(status=status)
    if company_name:
        qs = qs.filter(company_name__icontains=company_name)
    if email:
        qs = qs.filter(email__icontains=email)
    if customer_role:
        qs = qs.filter(customer_role__icontains=customer_role)

    return qs.order_by("-created_at")



@router.get("/{request_id}", response=UserRequestSchema)
def get_request(request, request_id: int):
    """Retrieves a single user request by its ID."""
    user_request = get_object_or_404(
        UserRequest.objects.prefetch_related("authorized_persons", "history"),
        id=request_id,
    )
    return user_request


@router.post("/", response=UserRequestSchema)
def create_request(request, payload: UserRequestCreateSchema):
    """Creates a new user request with authorized persons and uploaded files."""
    user_request = UserRequest.objects.create(
        **payload.dict(
            exclude={"authorized_persons"}
        ),  # todos los campos directos de UserRequest
        created_by=request.user if request.user.is_authenticated else None,
        created_from_ip=get_client_ip(request),
    )

    # Save authorized persons if provided
    persons_data = payload.authorized_persons or []
    for person in persons_data:
        AuthorizedPerson.objects.create(user_request=user_request, **person.dict())

    # Log creation
    RequestHistory.objects.create(
        user_request=user_request,
        changed_by=request.user if request.user.is_authenticated else None,
        changed_from_ip=get_client_ip(request),
        action="Solicitud creada.",
    )

    return user_request


@router.put("/{request_id}", response=UserRequestSchema)
def update_request(request, request_id: int, payload: UserRequestUpdateSchema):
    """Updates an existing user request and its authorized persons."""
    user_request = get_object_or_404(UserRequest, id=request_id)
    
    if user_request.status == "Completado":
        return 400, {"message": "Cannot update a completed request."}
        
    changes = []

    # Update simple fields
    for field, value in payload.dict(exclude_unset=True, exclude={"authorized_persons"}).items():
        old_value = getattr(user_request, field)
        if old_value != value:
            setattr(user_request, field, value)
            changes.append(f"{field} cambiado de '{old_value}' a '{value}'.")

    # Handle authorized persons (replace all if provided)
    if payload.authorized_persons is not None:
        user_request.authorized_persons.all().delete()
        for person in payload.authorized_persons:
            AuthorizedPerson.objects.create(user_request=user_request, **person.dict())
        changes.append("Personas autorizadas actualizadas.")

    # Check if customer_code is being updated to a non-empty value
    if "customer_code" in payload.dict(exclude_unset=True) and payload.customer_code:
        if user_request.status != "Completado":
            user_request.status = "Completado"
            changes.append(f"Estado cambiado a '{user_request.status}'.")


    if changes:
        user_request.save()
        action_log = " ".join(changes)
        RequestHistory.objects.create(
            user_request=user_request,
            changed_by=request.user if request.user.is_authenticated else None,
            changed_from_ip=get_client_ip(request),
            action=action_log,
        )

    return user_request


@router.delete("/{request_id}", response={204: None})
def delete_request(request, request_id: int):
    """Soft deletes a user request by setting its active flag to False."""
    user_request = get_object_or_404(UserRequest, id=request_id)
    
    if user_request.status == "Completado":
        return 400, {"message": "Cannot delete a completed request."}
        
    user_request.active = False
    user_request.save()

    RequestHistory.objects.create(
        user_request=user_request,
        changed_by=request.user if request.user.is_authenticated else None,
        changed_from_ip=get_client_ip(request),
        action="Solicitud eliminada (marcada como inactiva).",
    )

    return 204, None


@router.post("/{request_id}/approve", response=UserRequestSchema)
def approve_request(request, request_id: int):
    """Approves a user request by setting its status to 'Completado'."""
    user_request = get_object_or_404(UserRequest, id=request_id)

    if user_request.status == "Completado":
        return 400, {"message": "Request is already completed."}

    user_request.status = "Completado"
    user_request.save()

    RequestHistory.objects.create(
        user_request=user_request,
        changed_by=request.user if request.user.is_authenticated else None,
        changed_from_ip=get_client_ip(request),
        action="Solicitud aprobada y marcada como completada.",
    )

    return user_request


@router.post("/{request_id}/reject", response=UserRequestSchema)
def reject_request(request, request_id: int):
    """Rejects a user request by setting its status to 'Rechazado'."""
    user_request = get_object_or_404(UserRequest, id=request_id)

    if user_request.status in ["Rechazado", "Completado"]:
        return 400, {"message": f"Cannot reject a request with status '{user_request.status}'."}

    user_request.status = "Rechazado"
    user_request.save()

    RequestHistory.objects.create(
        user_request=user_request,
        changed_by=request.user if request.user.is_authenticated else None,
        changed_from_ip=get_client_ip(request),
        action="Solicitud rechazada.",
    )

    return user_request

