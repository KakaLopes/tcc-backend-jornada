FROM node:20-alpine

WORKDIR /app

COPY backend/package*.json ./
RUN npm install

COPY backend/. .

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && node index.js"]