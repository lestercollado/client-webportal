from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
import datetime

from django.db import models
from django.contrib.auth.models import User


class UserRequest(models.Model):
    STATUS_CHOICES = [
        ('Pendiente', 'Pendiente'),
        ('Rechazado', 'Rechazado'),
        ('Completado', 'Completado'),
    ]

    # Datos de la empresa
    company_name = models.CharField(max_length=255, verbose_name="Nombre de la Empresa")
    address = models.TextField(verbose_name="Dirección")
    city = models.CharField(max_length=100, verbose_name="Ciudad")
    state = models.CharField(max_length=100, verbose_name="Provincia/Estado")
    phone = models.CharField(max_length=20, verbose_name="Teléfono")
    email = models.EmailField(verbose_name="Correo Electrónico")
    tax_id = models.CharField(max_length=50, verbose_name="NIT / Registro Fiscal")

    # Datos de contacto principal
    contact_name = models.CharField(max_length=150, verbose_name="Nombre del Contacto")
    contact_position = models.CharField(max_length=100, verbose_name="Cargo del Contacto")
    contact_phone = models.CharField(max_length=20, verbose_name="Teléfono del Contacto")
    contact_email = models.EmailField(verbose_name="Correo Electrónico del Contacto")

    # Código de cliente
    customer_code = models.CharField(max_length=100, blank=True, null=True, unique=True, verbose_name="Código de Cliente")
    customer_role = models.JSONField(default=list, blank=True, null=True, verbose_name="Rol del Cliente")
    note_reject = models.TextField(blank=True, null=True, verbose_name="Notas de Rechazo")
    notes = models.TextField(blank=True, null=True, verbose_name="Notas")

    # Campos de control
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, blank=True, null=True, verbose_name="Estado")
    
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_requests', verbose_name="Creado por")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de Creación")
    created_from_ip = models.GenericIPAddressField(null=True, blank=True, verbose_name="IP de Creación")
    active = models.BooleanField(default=True, verbose_name="Activo")

    # Archivos cargados (guardados en JSON o en relación aparte)
    uploaded_files = models.JSONField(default=list, blank=True, verbose_name="Archivos Subidos")

    def __str__(self):
        return f"Solicitud de {self.company_name} - {self.status}"

    class Meta:
        verbose_name = "Solicitud de Usuario"
        verbose_name_plural = "Solicitudes de Usuario"
        ordering = ['-created_at']


class AuthorizedPerson(models.Model):
    user_request = models.ForeignKey(UserRequest, on_delete=models.CASCADE, related_name="authorized_persons", verbose_name="Solicitud")
    name = models.CharField(max_length=150, verbose_name="Nombre")
    position = models.CharField(max_length=100, verbose_name="Cargo")
    phone = models.CharField(max_length=20, verbose_name="Teléfono")
    email = models.EmailField(blank=True, null=True, verbose_name="Correo Electrónico")
    informational = models.BooleanField(default=False, verbose_name="Acceso Informativo")
    operational = models.BooleanField(default=False, verbose_name="Acceso Operativo")
    associated_with = models.CharField(max_length=100, verbose_name="Asociado a")

    def __str__(self):
        return f"{self.name} ({self.position})"

    class Meta:
        verbose_name = "Persona Autorizada"
        verbose_name_plural = "Personas Autorizadas"


class RequestHistory(models.Model):
    user_request = models.ForeignKey(UserRequest, related_name='history', on_delete=models.CASCADE, verbose_name="Solicitud de Usuario")
    changed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, verbose_name="Modificado por")
    changed_at = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de Modificación")
    changed_from_ip = models.GenericIPAddressField(null=True, blank=True, verbose_name="IP de Modificación")
    action = models.TextField(verbose_name="Acción")

    def __str__(self):
        return f"Historial de la solicitud {self.user_request.id} - {self.changed_at}"

    class Meta:
        verbose_name = "Historial de Solicitud"
        verbose_name_plural = "Historial de Solicitudes"
        ordering = ['-changed_at']

class TwoFactorAuth(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    code = models.CharField(max_length=4)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    def save(self, *args, **kwargs):
        if not self.id:
            self.expires_at = timezone.now() + datetime.timedelta(minutes=10)
        super().save(*args, **kwargs)

    def is_expired(self):
        return timezone.now() > self.expires_at

    def __str__(self):
        return f"2FA for {self.user.username}"