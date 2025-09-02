# Portal de Solicitud de Creación de Usuarios

Este proyecto es una aplicación web full-stack diseñada para gestionar las solicitudes de creación de usuarios en un sistema interno de la empresa. Permite a los usuarios autorizados enviar solicitudes, adjuntar la documentación necesaria y seguir el estado de su petición a través de una interfaz clara y moderna.

## Características Principales

- **Autenticación de Usuarios:** Sistema de inicio de sesión seguro (preparado para LDAP).
- **Gestión de Solicitudes:**
  - Creación de nuevas solicitudes con los campos requeridos (código de cliente, email, etc.).
  - Carga de archivos adjuntos (`.jpg`, `.png`, `.pdf`, `.doc`/`.docx`).
  - Visualización del listado de solicitudes.
  - Edición de solicitudes existentes.
- **Seguimiento de Estado:** Cada solicitud tiene un estado que puede ser `Pendiente`, `Rechazado` o `Completado`.
- **Auditoría:** Se registra quién, cuándo y desde qué dirección IP se crea cada solicitud.
- **Desarrollo Containerizado:** El proyecto completo se puede desplegar y ejecutar fácilmente usando Docker y Docker Compose.

---

## Tecnologías Utilizadas

### Backend

- **Framework:** Django
- **API:** Django Ninja
- **Autenticación:** Preparado para `django-auth-ldap`
- **Servidor:** WSGI
- **Lenguaje:** Python

### Frontend

- **Framework:** Next.js
- **Librería UI:** React
- **Lenguaje:** TypeScript
- **Estilos:** Tailwind CSS
- **Comunicación API:** Fetch API / Axios

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
