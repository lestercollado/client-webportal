from django.contrib import admin
from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
from ninja import NinjaAPI
from ninja_jwt.authentication import JWTAuth
from requests_app.api import router as requests_router, auth_router

api = NinjaAPI()

api.add_router("/requests", requests_router, auth=JWTAuth())
api.add_router("/auth", auth_router)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', api.urls),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)