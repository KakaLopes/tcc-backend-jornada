# ⏱ Sistema de Gestão de Jornada de Trabalho

Este projeto foi desenvolvido como parte do **Trabalho de Conclusão de Curso (TCC)** do curso de **Software Engineering**.

O sistema permite o registro e gerenciamento da jornada de trabalho de usuários, incluindo controle de ponto, ajustes de jornada, relatórios administrativos e auditoria de ações.

O backend foi desenvolvido utilizando **Node.js**, **Express**, **Prisma ORM** e **MySQL**, seguindo uma arquitetura de **API REST**.

---

# 🚀 Tecnologias Utilizadas

- Node.js
- Express
- Prisma ORM
- MySQL
- JWT (JSON Web Token)
- bcrypt
- Thunder Client
- Git e GitHub
- React Native (Expo)

---

# 🏗 Arquitetura do Sistema

O backend segue uma arquitetura baseada em **API REST**, organizada em camadas:

- Controllers – lógica de negócio
- Routes – definição das rotas
- Middlewares – autenticação
- Prisma ORM – acesso ao banco
- MySQL – armazenamento de dados

A autenticação utiliza **JWT (JSON Web Token)**.

---

# 📂 Estrutura do Projeto

```
backend
│
├── controllers
│   ├── adminController.js
│   ├── authController.js
│   ├── adjustmentController.js
│   ├── reportController.js
│   └── timeEntryController.js
│
├── routes
│   ├── adminRoutes.js
│   ├── reportRoutes.js
│   └── userRoutes.js
│
├── middlewares
│   └── auth.js
│
├── prisma
│   └── schema.prisma
│
├── index.js
└── package.json
```

---

# 🔐 Autenticação

Após login, o token deve ser enviado no header:

```
Authorization: Bearer TOKEN
```

---

# 👤 Usuários

## Criar usuário

POST `/users`

```json
{
 "full_name": "Maria Silva",
 "email": "silva@email.com",
 "password": "123456"
}
```

---

## Login

POST `/login`

```json
{
 "email": "silva@email.com",
 "password": "123456"
}
```

---

# ⏱ Gestão de Jornada

Registrar entrada

```
POST /clock-in
```

Registrar saída

```
POST /clock-out
```

Histórico de jornadas

```
GET /my-entries
```

---

# 📝 Ajustes de ponto

Solicitar ajuste

```
POST /adjustments/request
```

```json
{
 "work_entry_id": "ID_DO_REGISTRO",
 "old_value": "2026-03-10T08:11:00.000Z",
 "new_value": "2026-03-10T08:10:00.000Z",
 "reason": "Esqueci de registrar o ponto"
}
```

---

# 👨‍💼 Funcionalidades do Administrador

Dashboard

```
GET /admin/dashboard
```

Aprovar ajuste

```
POST /admin/adjustments/:id/approve
```

Rejeitar ajuste

```
POST /admin/adjustments/:id/reject
```

---

# 📊 Relatórios

Horas hoje

```
GET /admin/reports/hours-today
```

Horas semana

```
GET /admin/reports/hours-week
```

Horas por período

```
GET /admin/reports/hours-range
```

Exemplo:

```
/admin/reports/hours-range?start=2026-03-01&end=2026-03-10
```

---

# 🧾 Auditoria

```
GET /admin/audit-logs
```

---

# ❤️ Health Check

```
GET /admin/health
```

Resposta:

```json
{
 "status": "ok",
 "server": "online",
 "database": "connected"
}
```

---

# ▶️ Como executar o projeto

Clonar repositório

```
git clone https://github.com/KakaLopes/tcc-backend-jornada
```

Instalar dependências

```
npm install
```

Configurar `.env`

```
DATABASE_URL="mysql://usuario:senha@localhost:3306/tcc_db"
JWT_SECRET="secret"
```

Rodar Prisma

```
npx prisma migrate dev
```

Iniciar servidor

```
node index.js
```

Servidor:

```
http://localhost:3000
```

---

# 📱 Aplicativo Mobile

O projeto possui um aplicativo mobile em **React Native (Expo)** com:

- login
- registro de entrada
- registro de saída
- consulta de horas trabalhadas

O aplicativo consome a API deste backend.

---

# 👨‍🎓 Autor

Catalina Lopes  
Software Engineering – TCC

---

# 📚 Objetivo Acadêmico

Este projeto demonstra conhecimentos em:

- desenvolvimento de APIs REST
- autenticação com JWT
- arquitetura backend
- uso de ORM
- controle de acesso
- auditoria de ações
- versionamento com Git
- versionamento com Git
