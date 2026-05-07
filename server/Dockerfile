FROM node:18-alpine

WORKDIR /app

# Instalar dependencias necesarias para Prisma y Node
RUN apk add --no-cache openssl

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install
RUN npx prisma generate

COPY . .

RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]
