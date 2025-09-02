from django.contrib import admin
from .models import UserRequest

@admin.register(UserRequest)
class UserRequestAdmin(admin.ModelAdmin):
    list_display = ('customer_code', 'contact_email', 'status', 'created_by', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('customer_code', 'contact_email')
    readonly_fields = ('created_at', 'created_by', 'created_from_ip')

    fieldsets = (
        (None, {
            'fields': ('customer_code', 'contact_email', 'attachment', 'status')
        }),
        ('Audit Information', {
            'fields': ('created_by', 'created_at', 'created_from_ip'),
            'classes': ('collapse',)
        }),
    )
