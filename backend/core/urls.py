from django.contrib import admin
from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
from ninja import NinjaAPI, Schema
from requests_app.api import router as requests_router
from ninja_jwt.authentication import JWTAuth
from ninja_jwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.http import JsonResponse

api = NinjaAPI()

# Esquemas para JWT
class LoginSchema(Schema):
    username: str
    password: str

class RefreshSchema(Schema):
    refresh: str

# Endpoints JWT
@api.post("/token/")
def obtain_token(request, credentials: LoginSchema):
    user = authenticate(username=credentials.username, password=credentials.password)
    if user and user.is_active:
        refresh = RefreshToken.for_user(user)
        return {
            "access": str(refresh.access_token),
            "refresh": str(refresh)
        }
    return JsonResponse(
        {"detail": "Credenciales inválidas"}, 
        status=401
    )

@api.post("/token/refresh/")
def refresh_token(request, refresh_data: RefreshSchema):
    try:
        refresh = RefreshToken(refresh_data.refresh)
        return {"access": str(refresh.access_token)}
    except Exception:
        return {"detail": "Token de refresh inválido"}

api.add_router("/requests", requests_router)

urlpatterns = [
    path('admin/', admin.site.urls),
    # Se incluyen las URLs de la API principal
    path('api/', api.urls),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
