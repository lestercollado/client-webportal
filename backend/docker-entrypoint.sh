#!/bin/sh
set -e

echo "=== Iniciando Entrypoint de Django ==="

# Crear migraciones
echo "Creando migraciones..."
python manage.py makemigrations --noinput
echo "✅ Migraciones creadas"

# Ejecutar migraciones
echo "Ejecutando migraciones..."
python manage.py migrate --noinput
echo "✅ Migraciones completadas"

# Crear superusuario (si no existe)
echo "Intentando crear superusuario..."
if [ -n "$DJANGO_SUPERUSER_USERNAME" ] && [ -n "$DJANGO_SUPERUSER_EMAIL" ] && [ -n "$DJANGO_SUPERUSER_PASSWORD" ]; then
  python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='$DJANGO_SUPERUSER_USERNAME').exists():
    User.objects.create_superuser('$DJANGO_SUPERUSER_USERNAME', '$DJANGO_SUPERUSER_EMAIL', '$DJANGO_SUPERUSER_PASSWORD')
    print('✅ Superusuario creado exitosamente')
else:
    print('✅ Superusuario ya existe')
"
else
  echo "⚠️  Variables de superusuario no configuradas, saltando creación"
fi

# Ejecutar el comando principal (CMD del Dockerfile)
echo "Ejecutando: $@"
exec "$@"