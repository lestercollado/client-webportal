from ninja import Schema
from datetime import datetime
from typing import Optional, List


# -----------------------------
# Person authorized
# -----------------------------
class AuthorizedPersonSchema(Schema):
    id: int
    name: str
    position: str
    phone: str
    email: Optional[str] = None
    informational: bool
    operational: bool
    associated_with: str


class AuthorizedPersonCreateSchema(Schema):
    name: str
    position: str
    phone: str
    email: Optional[str] = None
    informational: bool = False
    operational: bool = False
    associated_with: str


# -----------------------------
# History
# -----------------------------
class RequestHistorySchema(Schema):
    id: int
    action: str
    changed_at: datetime
    changed_by_username: Optional[str] = None
    changed_from_ip: Optional[str] = None

    @staticmethod
    def resolve_changed_by_username(obj):
        return obj.changed_by.username if obj.changed_by else "System"


# -----------------------------
# User Requests
# -----------------------------
class UserRequestListSchema(Schema):
    id: int
    company_name: str
    address: str
    city: str
    state: str
    phone: str
    email: str
    tax_id: str

    contact_name: str
    contact_position: str
    contact_phone: str
    contact_email: str
    status: str
    created_at: datetime
    created_by_username: Optional[str] = None
    created_from_ip: Optional[str] = None   
    uploaded_files: List[str] = []
    customer_code: Optional[str] = None
    notes: Optional[str] = None

    @staticmethod
    def resolve_created_by_username(obj):
        return obj.created_by.username if obj.created_by else None


class UserRequestSchema(UserRequestListSchema):
    history: List[RequestHistorySchema] = []
    authorized_persons: List[AuthorizedPersonSchema] = []

    @staticmethod
    def resolve_history(obj):
        return obj.history.all()

    @staticmethod
    def resolve_authorized_persons(obj):
        return obj.authorized_persons.all()


# -----------------------------
# Create & Update
# -----------------------------
class UserRequestCreateSchema(Schema):
    company_name: str
    address: str
    city: str
    state: str
    phone: str
    email: str
    tax_id: str

    contact_name: str
    contact_position: str
    contact_phone: str
    contact_email: str
    uploaded_files: Optional[List[str]] = []
    authorized_persons: Optional[List[AuthorizedPersonCreateSchema]] = []


class UserRequestUpdateSchema(Schema):
    company_name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    tax_id: Optional[str] = None

    contact_name: Optional[str] = None
    contact_position: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    created_from_ip: Optional[str] = None   

    customer_role: Optional[str] = None
    customer_code: Optional[str] = None
    status: Optional[str] = None
    uploaded_files: Optional[List[str]] = None
    authorized_persons: Optional[List[AuthorizedPersonCreateSchema]] = None
    notes: Optional[str] = None


# -----------------------------
# Stats
# -----------------------------
class StatsOut(Schema):
    total: int
    pending: int
    completed: int
    rejected: int
