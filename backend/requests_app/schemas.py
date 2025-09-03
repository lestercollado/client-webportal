from ninja import Schema
from datetime import datetime
from typing import Optional, List

class AttachmentSchema(Schema):
    id: int
    file_url: str
    original_filename: Optional[str] = None

    @staticmethod
    def resolve_file_url(obj):
        if obj.file:
            return obj.file.url
        return None
    
    @staticmethod
    def resolve_original_filename(obj):
        return obj.original_filename

class RequestHistorySchema(Schema):
    id: int
    action: str
    changed_at: datetime
    changed_by_username: Optional[str] = None
    changed_from_ip: Optional[str] = None

    @staticmethod
    def resolve_changed_by_username(obj):
        if obj.changed_by:
            return obj.changed_by.username
        return "System"

class UserRequestSchema(Schema):
    id: int
    customer_code: str
    contact_email: str
    notes: Optional[str] = None
    status: str
    created_at: datetime
    created_by_username: Optional[str] = None
    attachments: List[AttachmentSchema] = []
    history: List[RequestHistorySchema] = []

    @staticmethod
    def resolve_created_by_username(obj):
        if obj.created_by:
            return obj.created_by.username
        return None
    
    @staticmethod
    def resolve_attachments(obj):
        return obj.attachments.all()

    @staticmethod
    def resolve_history(obj):
        return obj.history.all()

class UserRequestCreateSchema(Schema):
    customer_code: str
    contact_email: str
    notes: Optional[str] = None

class UserRequestUpdateSchema(Schema):
    customer_code: Optional[str] = None
    contact_email: Optional[str] = None
    status: Optional[str] = None

class StatsSchema(Schema):
    pending: int
    completed: int
    rejected: int
    total: int

class StatsOut(Schema):
    total: int
    pending: int
    completed: int
    rejected: int
