# TCC Backend – Sistema de Gestão de Jornada de Trabalho

## 📌 Descrição

Este projeto foi desenvolvido como parte do Trabalho de Conclusão de Curso (TCC) em **Software Engineering**.

O sistema permite o **registro e gerenciamento da jornada de trabalho de usuários**, incluindo:

* registro de entrada (clock-in)
* registro de saída (clock-out)
* histórico de jornadas
* solicitação de ajustes de ponto
* aprovação ou rejeição de ajustes por administradores
* relatórios de horas trabalhadas
* auditoria de ações administrativas

O backend foi desenvolvido utilizando **Node.js**, **Express**, **Prisma ORM** e **MySQL**.

---

# 🚀 Tecnologias Utilizadas

* Node.js
* Express
* Prisma ORM
* MySQL
* JWT (JSON Web Token)
* bcrypt
* Thunder Client (testes de API)
* GitHub (controle de versão)

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

A autenticação é feita utilizando **JWT (JSON Web Token)**.

Após realizar login, o token deve ser enviado no header:

```
Authorization: Bearer TOKEN
```

---

# 👤 Usuários

## Criar usuário

POST `/users`

```
{
 "full_name": "Maria Silva",
 "email": "silva@email.com",
 "password": "123456"
}
```

---

## Login

POST `/login`

```
{
 "email": "silva@email.com",
 "password": "123456"
}
```

---

# ⏱ Gestão de Jornada

## Registrar entrada

POST `/clock-in`

---

## Registrar saída

POST `/clock-out`

---

## Histórico de jornadas

GET `/my-entries`

---

# 📝 Ajustes de ponto

Usuários podem solicitar correção de horários.

## Solicitar ajuste

POST `/adjustments/request`

```
{
 "work_entry_id": "ID_DO_REGISTRO",
 "old_value": "2026-03-10T08:11:00.000Z",
 "new_value": "2026-03-10T08:10:00.000Z",
 "reason": "Esqueci de registrar o ponto"
}
```

---

# 👨‍💼 Funcionalidades do Administrador

## Dashboard

GET `/admin/dashboard`

Mostra resumo do sistema:

* total de usuários
* total de jornadas
* horas trabalhadas
* usuário mais ativo

---

## Aprovar ajuste

POST `/admin/adjustments/:id/approve`

---

## Rejeitar ajuste

POST `/admin/adjustments/:id/reject`

---

# 📊 Relatórios

## Horas trabalhadas hoje

GET `/admin/reports/hours-today`

---

## Horas trabalhadas na semana

GET `/admin/reports/hours-week`

---

## Horas por período

GET `/admin/reports/hours-range`

Exemplo:

```
/admin/reports/hours-range?start=2026-03-01&end=2026-03-10
```

---

# 📈 Estatísticas do sistema

GET `/admin/system-stats`

Retorna:

* total de usuários
* total de jornadas
* total de ajustes
* ajustes pendentes
* total de horas registradas

---

# 🧾 Auditoria

O sistema registra ações administrativas.

GET `/admin/audit-logs`

Exibe:

* ação realizada
* entidade afetada
* usuário responsável
* data da ação

---

# ❤️ Health Check

Verifica se o sistema está funcionando corretamente.

GET `/admin/health`

Resposta:

```
{
 "status": "ok",
 "server": "online",
 "database": "connected"
}
```

---

# ▶️ Como executar o projeto

## 1️⃣ Clonar repositório

```
git clone https://github.com/SEU_USUARIO/tcc-backend-jornada
```

---

## 2️⃣ Instalar dependências

```
npm install
```

---

## 3️⃣ Configurar banco de dados

Criar arquivo `.env`

```
DATABASE_URL="mysql://usuario:senha@localhost:3306/tcc_db"
JWT_SECRET="secret"
```

---

## 4️⃣ Rodar Prisma

```
npx prisma migrate dev
```

---

## 5️⃣ Iniciar servidor

```
node index.js
```

Servidor rodando em:

```
http://localhost:3000
```

---

## Testando a API

As rotas podem ser testadas utilizando:

- Thunder Client
- Postman
- Insomnia

---

## Futuras melhorias

- aplicativo mobile (React Native)
- dashboard web
- exportação de relatórios
- controle de intervalos

# 👨‍🎓 Autor

Projeto desenvolvido por **Catalina Lopes**
Curso: Software Engineering

---

# 📚 Objetivo acadêmico

Este projeto foi desenvolvido para demonstrar conhecimentos em:

* desenvolvimento de APIs REST
* autenticação com JWT
* organização de arquitetura backend
* uso de ORM
* controle de acesso
* auditoria de ações
* versionamento com Git
