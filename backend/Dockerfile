# Usar una imagen oficial de Python como imagen base
FROM python:3.11-slim-buster

# Establecer variables de entorno para Python
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Crear y establecer el directorio de trabajo
WORKDIR /app

# Instalar dependencias del sistema operativo si son necesarias
# RUN apt-get update && apt-get install -y ...

# Instalar dependencias de Python
# Copiar primero el archivo de requerimientos para aprovechar el cache de Docker
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el resto del código de la aplicación
COPY . .

# Exponer el puerto en el que correrá la aplicación
EXPOSE 8000

# Comando para correr la aplicación (ejemplo con Django)
# Asegúrate de crear el archivo manage.py en tu proyecto
# CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
