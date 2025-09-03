from typing import List, Optional
from ninja import Router, File, UploadedFile, Form
from django.shortcuts import get_object_or_404
from .models import UserRequest, Attachment, TwoFactorAuth, RequestHistory
from .schemas import UserRequestSchema, UserRequestCreateSchema, UserRequestUpdateSchema, StatsOut, UserRequestListSchema
from django.db.models import Count, Q
from ninja_jwt.authentication import JWTAuth
from ninja_jwt.tokens import RefreshToken
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from ninja.schema import Schema
import json
import os
from .tasks import send_2fa_email_task
import random
import string
from django.conf import settings
from datetime import datetime, timezone, timedelta

def get_client_ip(request):
    """A simple utility to get the client's IP address."""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip

# Using a Router is a best practice for app-level APIs.
router = Router()
auth_router = Router()

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
        code = ''.join(random.choices(string.digits, k=4))   
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)        
        two_factor_auth, created = TwoFactorAuth.objects.update_or_create(
            user=user,
            defaults={
                'code': code,
                'expires_at': expires_at,
                'created_at': datetime.now(timezone.utc)  # opcional si quieres actualizar created_at
            }
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
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }
    return {"message": "Code expired or invalid."}


@router.get("/stats/", response=StatsOut)
def get_stats(request):
    """Returns statistics about user requests."""
    stats = UserRequest.objects.filter(active=True).aggregate(
        pending=Count('id', filter=Q(status='Pendiente')),
        completed=Count('id', filter=Q(status='Completado')),
        rejected=Count('id', filter=Q(status='Rechazado')),
        total=Count('id')
    )
    return stats

@router.get("/", response=List[UserRequestListSchema])
def list_requests(
    request,
    status: Optional[str] = None,
    customer_code: Optional[str] = None,
    contact_email: Optional[str] = None
):
    """Lists all active user requests, with optional filters."""
    qs = UserRequest.objects.filter(active=True).prefetch_related('attachments')
    
    if status:
        qs = qs.filter(status=status)
    if customer_code:
        qs = qs.filter(customer_code__icontains=customer_code)
    if contact_email:
        qs = qs.filter(contact_email__icontains=contact_email)
        
    return qs.order_by('-created_at')

@router.get("/{request_id}", response=UserRequestSchema)
def get_request(request, request_id: int):
    """Retrieves a single user request by its ID."""
    user_request = get_object_or_404(
        UserRequest.objects.prefetch_related('attachments', 'history', 'history__changed_by'),
        id=request_id
    )
    return user_request

@router.post("/", response=UserRequestSchema)
def create_request(request, customer_code: str = Form(...), contact_email: str = Form(...), notes: str = Form(None), customer_role: str = Form(...), attachments: List[UploadedFile] = File(...)):
    """Creates a new user request with multiple file attachments."""
    data = {
        "customer_code": customer_code,
        "contact_email": contact_email,
        "notes": notes,
        "customer_role": customer_role,
    }
    user_request = UserRequest.objects.create(
        **data,
        created_by=request.user if request.user.is_authenticated else None,
        created_from_ip=get_client_ip(request)
    )
    
    attached_files_names = []
    for attachment in attachments:
        Attachment.objects.create(
            user_request=user_request,
            file=attachment,
            original_filename=attachment.name
        )
        attached_files_names.append(attachment.name)

    # Log creation in history
    action_log = f"Solicitud creada. Archivos adjuntos: {', '.join(attached_files_names)}"
    RequestHistory.objects.create(
        user_request=user_request,
        changed_by=request.user if request.user.is_authenticated else None,
        changed_from_ip=get_client_ip(request),
        action=action_log
    )
    
    return user_request

@router.put("/{request_id}", response=UserRequestSchema)
def update_request(
    request,
    request_id: int,
    customer_code: str = Form(None),
    contact_email: str = Form(None),
    status: str = Form(None),
    customer_role: str = Form(None),
    notes: str = Form(None),
    attachments: List[UploadedFile] = File(None),
    attachments_to_delete: str = Form(None)  # JSON string of IDs
):
    """Updates an existing user request, including its attachments."""
    user_request = get_object_or_404(UserRequest, id=request_id)
    changes = []
    
    # Track if data other than status has changed
    other_data_changed = False

    # 1. Customer Code
    if customer_code is not None and user_request.customer_code != customer_code:
        changes.append(f"Código de cliente cambiado de '{user_request.customer_code}' a '{customer_code}'.")
        user_request.customer_code = customer_code
        other_data_changed = True

    # 2. Contact Email
    if contact_email is not None and user_request.contact_email != contact_email:
        changes.append(f"Email de contacto cambiado de '{user_request.contact_email}' a '{contact_email}'.")
        user_request.contact_email = contact_email
        other_data_changed = True

    # 3. Notes
    if notes is not None and user_request.notes != notes:
        changes.append("Notas actualizadas.")
        user_request.notes = notes
        other_data_changed = True

    # 4. Delete Attachments
    if attachments_to_delete:
        try:
            delete_ids = json.loads(attachments_to_delete)
            if delete_ids:
                attachments_to_remove = Attachment.objects.filter(id__in=delete_ids, user_request=user_request)
                if attachments_to_remove.exists():
                    deleted_filenames = [att.original_filename or "archivo sin nombre" for att in attachments_to_remove]
                    changes.append(f"Archivos adjuntos eliminados: {', '.join(deleted_filenames)}.")
                    for att in attachments_to_remove:
                        if att.file and os.path.exists(att.file.path):
                            os.remove(att.file.path)
                        att.delete()
                    other_data_changed = True
        except json.JSONDecodeError:
            pass

    # 5. Add New Attachments
    if attachments:
        added_filenames = [att.name for att in attachments]
        changes.append(f"Nuevos archivos adjuntos: {', '.join(added_filenames)}.")
        for attachment_file in attachments:
            Attachment.objects.create(
                user_request=user_request,
                file=attachment_file,
                original_filename=attachment_file.name
            )
        other_data_changed = True

    # 6. Status update logic
    if other_data_changed and user_request.status != 'Pendiente':
        changes.append(f"Estado cambiado de '{user_request.status}' a 'Pendiente' debido a otros cambios.")
        user_request.status = 'Pendiente'
    elif not other_data_changed and status is not None and user_request.status != status:
        changes.append(f"Estado cambiado de '{user_request.status}' a '{status}'.")
        user_request.status = status

    # 7. Save and log history if there are changes
    if changes:
        user_request.save()
        user_request.refresh_from_db()
        
        action_log = " ".join(changes)
        RequestHistory.objects.create(
            user_request=user_request,
            changed_by=request.user if request.user.is_authenticated else None,
            changed_from_ip=get_client_ip(request),
            action=action_log
        )
        
    return user_request

@router.delete("/{request_id}", response={204: None})
def delete_request(request, request_id: int):
    """Soft deletes a user request by setting its active flag to False."""
    user_request = get_object_or_404(UserRequest, id=request_id)
    user_request.active = False
    user_request.save()

    # Log deletion in history
    RequestHistory.objects.create(
        user_request=user_request,
        changed_by=request.user if request.user.is_authenticated else None,
        changed_from_ip=get_client_ip(request),
        action="Solicitud eliminada (marcada como inactiva)."
    )

    return 204, None