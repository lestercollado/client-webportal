# Usar una imagen oficial de Node.js como imagen base
FROM node:20-alpine

# Crear y establecer el directorio de trabajo
WORKDIR /app

# Copiar package.json y package-lock.json (o yarn.lock)
COPY package*.json ./

# Instalar las dependencias del proyecto
# Si usas npm
RUN npm install
# Si usas yarn
# RUN yarn install

# Copiar el resto del código de la aplicación
COPY . .

# Construir la aplicación de Next.js para producción
RUN npm run build

# Exponer el puerto en el que correrá la aplicación
EXPOSE 3000

# Comando para iniciar la aplicación en modo producción
CMD ["npm", "start"]
