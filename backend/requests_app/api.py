from typing import List, Optional
from ninja import Router, File, UploadedFile, Form
from django.shortcuts import get_object_or_404
from .models import UserRequest, Attachment
from .schemas import UserRequestSchema, UserRequestCreateSchema, UserRequestUpdateSchema, StatsOut
from django.db.models import Count, Q
from ninja_jwt.authentication  import JWTAuth
import json
import os

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

@router.get("/stats/", response=StatsOut, auth=JWTAuth())
def get_stats(request):
    """Returns statistics about user requests."""
    stats = UserRequest.objects.filter(active=True).aggregate(
        pending=Count('id', filter=Q(status='Pendiente')),
        completed=Count('id', filter=Q(status='Completado')),
        rejected=Count('id', filter=Q(status='Rechazado')),
        total=Count('id')
    )
    return stats

@router.get("/", response=List[UserRequestSchema], auth=JWTAuth())
def list_requests(
    request,
    status: Optional[str] = None,
    customer_code: Optional[str] = None,
    contact_email: Optional[str] = None
):
    """Lists all active user requests, with optional filters."""
    qs = UserRequest.objects.filter(active=True)
    
    if status:
        qs = qs.filter(status=status)
    if customer_code:
        qs = qs.filter(customer_code__icontains=customer_code)
    if contact_email:
        qs = qs.filter(contact_email__icontains=contact_email)
        
    return qs.order_by('-created_at')

@router.get("/{request_id}", response=UserRequestSchema, auth=JWTAuth())
def get_request(request, request_id: int):
    """Retrieves a single user request by its ID."""
    user_request = get_object_or_404(UserRequest, id=request_id)
    return user_request

@router.post("/", response=UserRequestSchema, auth=JWTAuth())
def create_request(request, customer_code: str = Form(...), contact_email: str = Form(...), attachments: List[UploadedFile] = File(...)):
    """Creates a new user request with multiple file attachments."""
    data = {
        "customer_code": customer_code,
        "contact_email": contact_email,
    }
    user_request = UserRequest.objects.create(
        **data,
        created_by=request.user if request.user.is_authenticated else None,
        created_from_ip=get_client_ip(request)
    )
    for attachment in attachments:
        Attachment.objects.create(
            user_request=user_request,
            file=attachment,
            original_filename=attachment.name
        )
    return user_request

@router.put("/{request_id}", response=UserRequestSchema, auth=JWTAuth())
def update_request(
    request, 
    request_id: int, 
    customer_code: str = Form(None),
    contact_email: str = Form(None),
    status: str = Form(None),
    attachments: List[UploadedFile] = File(None),
    attachments_to_delete: str = Form(None)  # JSON string of IDs
):
    """Updates an existing user request, including its attachments."""
    user_request = get_object_or_404(UserRequest, id=request_id)
    
    # Update text fields if they are provided
    if customer_code is not None:
        user_request.customer_code = customer_code
    if contact_email is not None:
        user_request.contact_email = contact_email
    if status is not None:
        user_request.status = status
        
    # Delete attachments if requested
    if attachments_to_delete:
        try:
            delete_ids = json.loads(attachments_to_delete)
            if delete_ids:
                attachments_to_remove = Attachment.objects.filter(id__in=delete_ids, user_request=user_request)
                for att in attachments_to_remove:
                    if att.file:
                        if os.path.exists(att.file.path):
                            os.remove(att.file.path)
                    att.delete()
        except json.JSONDecodeError:
            # Handle error if the string is not valid JSON
            pass

    # Add new attachments if provided
    if attachments:
        for attachment_file in attachments:
            Attachment.objects.create(
                user_request=user_request,
                file=attachment_file,
                original_filename=attachment_file.name
            )
            
    user_request.save()
    user_request.refresh_from_db()
    return user_request

@router.delete("/{request_id}", response={204: None}, auth=JWTAuth())
def delete_request(request, request_id: int):
    """Soft deletes a user request by setting its active flag to False."""
    user_request = get_object_or_404(UserRequest, id=request_id)
    user_request.active = False
    user_request.save()
    return 204, None
