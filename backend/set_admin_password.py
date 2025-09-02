from django.contrib.auth import get_user_model
import os

User = get_user_model()

if User.objects.filter(username='admin').exists():
    print('Admin user already exists.')
else:
    password = os.environ.get('DJANGO_SUPERUSER_PASSWORD', 'admin')
    User.objects.create_superuser('admin', 'admin@example.com', password)
    print('Superuser created.')
