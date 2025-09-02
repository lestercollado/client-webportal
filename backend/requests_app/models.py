from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
import datetime

class UserRequest(models.Model):
    STATUS_CHOICES = [
        ('Pendiente', 'Pendiente'),
        ('Rechazado', 'Rechazado'),
        ('Completado', 'Completado'),
    ]

    customer_code = models.CharField(max_length=100, verbose_name="Código del Cliente")
    contact_email = models.EmailField(verbose_name="Correo Electrónico de Contacto")
    notes = models.TextField(verbose_name="Notas", blank=True, null=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pendiente', verbose_name="Estado")
    
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_requests', verbose_name="Creado por")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de Creación")
    created_from_ip = models.GenericIPAddressField(null=True, blank=True, verbose_name="IP de Creación")
    active = models.BooleanField(default=True, verbose_name="Activo")

    def __str__(self):
        return f"Solicitud de {self.customer_code} - {self.status}"

    class Meta:
        verbose_name = "Solicitud de Usuario"
        verbose_name_plural = "Solicitudes de Usuario"
        ordering = ['-created_at']

class Attachment(models.Model):
    user_request = models.ForeignKey(UserRequest, related_name='attachments', on_delete=models.CASCADE)
    file = models.FileField(upload_to='attachments/')
    original_filename = models.CharField(max_length=255, null=True, blank=True)

    def __str__(self):
        return f"Adjunto para la solicitud {self.user_request.id}"

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