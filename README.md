# TCC Backend Jornada de Trabalho

Backend desenvolvido com Node.js, Express, Prisma e autenticação JWT.

## Tecnologias utilizadas

- Node.js
- Express
- Prisma ORM
- JWT Authentication
- PostgreSQL
- Thunder Client

## Funcionalidades

- Criar usuário
- Login com autenticação JWT
- Listar usuários (protegido por token)
- Atualizar usuário
- Remover usuário
- Proteção de rotas com middleware

## Como rodar o projeto

```bash
npm install
npx prisma generate
node index.js
