from typing import List, Optional
from ninja import Router
from django.shortcuts import get_object_or_404
import oracledb
from django.conf import settings
from .models import UserRequest, RequestHistory, AuthorizedPerson, TwoFactorAuth
from .schemas import (
    UserRequestSchema,
    UserRequestCreateSchema,
    UserRequestUpdateSchema,
    StatsOut,
    UserRequestListSchema,
    AuthorizedPersonCreateSchema,
    MessageOut,
    ApproveRequestSchema,
)
from django.db.models import Count, Q
from django.db import IntegrityError
from ninja_jwt.tokens import RefreshToken
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from ninja.schema import Schema
from .tasks import send_2fa_email_task
import random
import uuid
import string
import hashlib
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


def generate_user_cod(contact_name: str) -> str:
    parts = contact_name.split()
    if not parts:
        return ""

    first_name = parts[0]
    last_name_initials = ""
    if len(parts) > 1:
        for part in parts[1:]:
            if part: # Ensure part is not empty
                last_name_initials += part[0]

    return (first_name + last_name_initials).upper()


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
        # Para buscar en un JSONField que contiene una lista de strings
        # customer_role aquí es el valor del filtro, que debería ser un solo rol
        qs = qs.filter(customer_role__contains=[customer_role])

    # Asegurarse de que customer_role sea una lista para cada objeto antes de devolverlo
    # Convertir el queryset a una lista para poder modificar los objetos
    result_list = list(qs.order_by("-created_at"))
    for req in result_list:
        if req.customer_role is None:
            req.customer_role = []
    return result_list



@router.get("/{request_id}", response=UserRequestSchema)
def get_request(request, request_id: int):
    """Retrieves a single user request by its ID."""
    user_request = get_object_or_404(
        UserRequest.objects.prefetch_related("authorized_persons", "history"),
        id=request_id,
    )
    # Asegurarse de que customer_role sea una lista, incluso si es None en la DB
    if user_request.customer_role is None:
        user_request.customer_role = []
    return user_request


@router.post("/", response={200: UserRequestSchema, 400: MessageOut})
def create_request(request, payload: UserRequestCreateSchema):
    """Creates a new user request with authorized persons and uploaded files."""
    try:
        user_request = UserRequest.objects.create(
            **payload.dict(
                exclude={"authorized_persons"}
            ),
            created_by=request.user if request.user.is_authenticated else None,
            created_from_ip=get_client_ip(request),
        )
    except IntegrityError:
        return 400, {"message": "Ya existe una solicitud con este código de cliente."}

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


@router.put("/{request_id}", response={200: UserRequestSchema, 400: MessageOut})
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

    # Handle customer_role explicitly
    if "customer_role" in payload.dict(exclude_unset=True):
        new_customer_role = payload.customer_role if payload.customer_role is not None else []
        if user_request.customer_role != new_customer_role:
            user_request.customer_role = new_customer_role
            changes.append(f"customer_role cambiado de '{user_request.customer_role}' a '{new_customer_role}'.")

    connection = None
    cursor = None
    try:
        oracle_user = settings.ORACLE_DB_USER
        oracle_password = settings.ORACLE_DB_PASSWORD
        oracle_host = settings.ORACLE_DB_HOST
        oracle_port = settings.ORACLE_DB_PORT
        oracle_service_name = settings.ORACLE_DB_SERVICE_NAME

        dsn = f"{oracle_host}:{oracle_port}/{oracle_service_name}"
        oracledb.init_oracle_client()
        connection = oracledb.connect(user=oracle_user, password=oracle_password, dsn=dsn)
        cursor = connection.cursor()
        
        print("222222222",user_request)
        print("44444",user_request.customer_role)
        # Insert each authorized person into Oracle DB
        if user_request.customer_code: # Only proceed if customer_code is available
            insert_sql = """
            INSERT INTO CM_WEB.WEB_USER (
                USER_COD, USER_NAM, COMPANY_COD, TELEPHONE, USER_PWD, EMAIL, ADDRESS, REC_TIM, REC_NAM
            ) VALUES (
                :user_cod, :user_nam, :company_cod, :telephone, :user_pwd, :email, :address, :rec_tim, :rec_nam
            )
            """
            for person in user_request.authorized_persons.all():
                generated_user_cod = generate_user_cod(person.name)
                try:
                    cursor.execute(insert_sql, {
                        'user_cod': generated_user_cod,
                        'user_nam': person.name,
                        'company_cod': user_request.customer_code,
                        'telephone': person.phone,
                        'user_pwd': hashlib.md5(''.join(random.choices(string.ascii_letters + string.digits, k=10)).encode()).hexdigest(), # Generate a random password for each user and hash it with MD5
                        'email': person.email,
                        'address': user_request.address,
                        'rec_tim': user_request.created_at,
                        'rec_nam': 'SYSTEM WEB'
                    })
                    print(f"Successfully inserted authorized person {person.name} for request {user_request.id} into Oracle DB.")

                    # Insert into RE_USER_ROLE for each customer_role
                    if user_request.customer_role:
                        insert_role_sql = """
                        INSERT INTO CM_WEB.RE_USER_ROLE (ID, USER_COD, ROLE_COD) VALUES (:id, :user_cod, :role_cod)
                        """
                        for role in user_request.customer_role:
                            try:
                                cursor.execute(insert_role_sql, {
                                    'id': str(uuid.uuid4()),
                                    'user_cod': generated_user_cod,
                                    'role_cod': role
                                })
                                print(f"Successfully inserted role {role} for user {generated_user_cod} into RE_USER_ROLE.")
                            except oracledb.Error as e:
                                error_obj, = e.args
                                print(f"Error inserting role {role} for user {generated_user_cod} into RE_USER_ROLE: {error_obj.message}")
                    else:
                        print(f"No customer roles found for request {user_request.id}, skipping RE_USER_ROLE insertion for user {generated_user_cod}.")
                except oracledb.Error as e:
                    error_obj, = e.args
                    print(f"Error inserting authorized person {person.name} into Oracle DB: {error_obj.message}")
            connection.commit()
            print(11111100000000)
            print(f"All authorized persons for request {user_request.id} processed for Oracle DB.")
        else:
            print("customer_code is empty, skipping Oracle insertion for authorized persons.")

    except oracledb.Error as e:
        error_obj, = e.args
        print(f"Error inserting into Oracle DB: {error_obj.message}")
        # Optionally, you might want to revert the Django save or log this error more formally
        # For now, we'll just print and continue, but in a real app, this needs careful handling.
    except Exception as e:
        print(f"An unexpected error occurred during Oracle insertion: {e}")
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()

    if changes:
        try:
            user_request.save()
        except IntegrityError:
            return 400, {"message": "Ya existe una solicitud con este código de cliente."}
        action_log = " ".join(changes)
        RequestHistory.objects.create(
            user_request=user_request,
            changed_by=request.user if request.user.is_authenticated else None,
            changed_from_ip=get_client_ip(request),
            action=action_log,
        )

    return user_request


# @router.delete("/{request_id}", response={204: None, 400: MessageOut})
# def delete_request(request, request_id: int):
#     """Soft deletes a user request by setting its active flag to False."""
#     user_request = get_object_or_404(UserRequest, id=request_id)
    
#     if user_request.status == "Completado":
#         return 400, {"message": "Cannot delete a completed request."}
        
#     user_request.active = False
#     user_request.save()

#     RequestHistory.objects.create(
#         user_request=user_request,
#         changed_by=request.user if request.user.is_authenticated else None,
#         changed_from_ip=get_client_ip(request),
#         action="Solicitud eliminada (marcada como inactiva).",
#     )

#     return 204, None


# @router.post("/{request_id}/approve", response={200: UserRequestSchema, 400: MessageOut})
# def approve_request(request, request_id: int, payload: ApproveRequestSchema):
#     """Approves a user request by setting its status to 'Completado'."""
#     user_request = get_object_or_404(UserRequest, id=request_id)

#     if user_request.status == "Completado":
#         return 400, {"message": "Request is already completed."}

#     user_request.status = "Completado"
#     user_request.customer_role = payload.customer_role if payload.customer_role is not None else []
#     user_request.customer_code = payload.customer_code
#     user_request.save()

#     RequestHistory.objects.create(
#         user_request=user_request,
#         changed_by=request.user if request.user.is_authenticated else None,
#         changed_from_ip=get_client_ip(request),
#         action=f"Solicitud aprobada y marcada como completada. Roles asignados: {user_request.customer_role}",
#     )

#     return user_request


# @router.post("/{request_id}/reject", response={200: UserRequestSchema, 400: MessageOut})
# def reject_request(request, request_id: int):
#     """Rejects a user request by setting its status to 'Rechazado'."""
#     user_request = get_object_or_404(UserRequest, id=request_id)

#     if user_request.status in ["Rechazado", "Completado"]:
#         return 400, {"message": f"Cannot reject a request with status '{user_request.status}'."}

#     user_request.status = "Rechazado"
#     user_request.save()

#     RequestHistory.objects.create(
#         user_request=user_request,
#         changed_by=request.user if request.user.is_authenticated else None,
#         changed_from_ip=get_client_ip(request),
#         action="Solicitud rechazada.",
#     )

#     return user_request

