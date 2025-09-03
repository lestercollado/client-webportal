# Portal de Solicitud de Creación de Usuarios

Este proyecto es una aplicación web full-stack diseñada para gestionar las solicitudes de creación de usuarios en un sistema interno de la empresa. Permite a los usuarios autorizados enviar solicitudes, adjuntar la documentación necesaria y seguir el estado de su petición a través de una interfaz clara y moderna.

## Características Principales

- **Autenticación Segura de Dos Factores (2FA):** Sistema de inicio de sesión robusto con usuario/contraseña y un segundo factor de autenticación mediante un código de 4 dígitos enviado al correo electrónico del usuario.
- **Gestión Avanzada de Solicitudes:**
  - **Dashboard Interactivo:** Visualización rápida de estadísticas clave (Total, Pendientes, Completadas, Rechazadas).
  - **Creación de Solicitudes:** Formulario intuitivo para crear nuevas solicitudes con campos para código de cliente, email y notas.
  - **Carga de Múltiples Archivos:** Soporte para adjuntar varios documentos (`.jpg`, `.png`, `.pdf`, `.doc`/`.docx`) en una sola solicitud.
  - **Listado y Filtrado:** Vista de todas las solicitudes con paginación y filtros dinámicos por estado, código de cliente o email.
  - **Flujo de Aprobación:** Los administradores pueden aprobar o rechazar solicitudes con un solo clic.
  - **Modales de Confirmación:** Modales personalizados para acciones críticas como rechazar o eliminar una solicitud, mejorando la experiencia de usuario.
- **Auditoría Completa:**
  - **Historial de Cambios:** Cada solicitud tiene un registro detallado de todas las acciones realizadas sobre ella.
  - **Trazabilidad:** Se guarda quién, cuándo y desde qué dirección IP se creó o modificó una solicitud.
- **Desarrollo y Despliegue Containerizado:** El proyecto está completamente configurado para ejecutarse con Docker y Docker Compose, facilitando la instalación y la portabilidad.

---

## Tecnologías Utilizadas

### Backend

- **Framework:** Django
- **API:** Django Ninja
- **Autenticación:** `django-ninja-jwt` para tokens JWT.
- **Tareas Asíncronas:** Celery con Redis para el envío de correos electrónicos en segundo plano.
- **Base de Datos:** PostgreSQL
- **Lenguaje:** Python

### Frontend

- **Framework:** Next.js
- **Librería UI:** React
- **Lenguaje:** TypeScript
- **Estilos:** Tailwind CSS
- **Gestión de Estado:** React Context API

### Despliegue

- **Containerización:** Docker, Docker Compose

---

## Prerrequisitos

Para ejecutar este proyecto, necesitarás tener instalado:

- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/install/)

---

## Instalación y Puesta en Marcha

Sigue estos pasos para levantar el entorno de desarrollo local:

1.  **Clonar el Repositorio**
    ```bash
    git clone <URL-DEL-REPOSITORIO>
    cd user_request
    ```

2.  **Configurar Variables de Entorno (Opcional)**
    Si es necesario, puedes crear un archivo `.env` en la raíz del proyecto para configurar variables específicas para los contenedores de Docker, como credenciales de base de datos o la `SECRET_KEY` de Django.

3.  **Construir y Levantar los Contenedores**
    Abre una terminal en la raíz del proyecto y ejecuta el siguiente comando:
    ```bash
    docker-compose up --build -d
    ```
    Este comando construirá las imágenes de Docker para el frontend y el backend y las ejecutará en segundo plano.

4.  **Configuración Inicial del Backend (Usuarios de Windows)**
    Si estás en Windows, puedes ejecutar el script `run_backend_setup.bat` para aplicar las migraciones de la base de datos y crear un superusuario inicial en Django.
    ```bash
    run_backend_setup.bat
    ```
    Para otros sistemas operativos, puedes ejecutar los comandos equivalentes:
    ```bash
    docker-compose exec backend python manage.py migrate
    docker-compose exec backend python manage.py createsuperuser
    ```

## Uso

Una vez que los contenedores estén en funcionamiento, podrás acceder a los servicios:

-   **Aplicación Frontend:** [http://localhost:3000](http://localhost:3000)
-   **API del Backend:** [http://localhost:8000/api/](http://localhost:8000/api/)

---

## Estructura del Proyecto

```
.
├── backend/         # Contiene el proyecto Django
│   ├── core/        # Configuración principal de Django
│   ├── requests_app # Aplicación de Django para gestionar las solicitudes
│   ├── Dockerfile   # Definición del contenedor del backend
│   └── ...
├── frontend/        # Contiene el proyecto Next.js
│   ├── src/         # Código fuente de la aplicación React
│   ├── public/      # Archivos estáticos, como el logo
│   ├── Dockerfile   # Definición del contenedor del frontend
│   └── ...
├── docker-compose.yml # Orquesta la ejecución de los servicios
├── run_backend_setup.bat # Script para configuración inicial en Windows
└── README.md        # Este archivo
```

## Para actualizar cambios en el frontend
  - cd frontend
  - npm run build
  - pm2 restart clientes-frontend

## Para actualizar cambios en el backend
  - systemctl restart clientes-backend