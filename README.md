# ⏱ Work Time Management System

This project was developed as part of a **Final Year Project (TCC)** for the **Software Engineering** course.

The system allows users to register and manage their working hours, including clock-in/out, time adjustments, administrative reports, and action auditing.

The backend was built using **Node.js**, **Express**, **Prisma ORM**, and **MySQL**, following a **REST API architecture**.

---

# 🚀 Technologies Used

- Node.js  
- Express  
- Prisma ORM  
- MySQL  
- JWT (JSON Web Token)  
- bcrypt  
- Thunder Client  
- Git & GitHub  
- React Native (Expo)  

---

# 🏗 System Architecture

The backend follows a **REST API architecture**, organized into layers:

- Controllers – business logic  
- Routes – API endpoints  
- Middlewares – authentication and authorization  
- Prisma ORM – database access  
- MySQL – data storage  

Authentication is handled using **JWT (JSON Web Token)**.

---

# 📂 Project Structure

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

# 🔐 Authentication

After login, the token must be sent in the request header:

```
Authorization: Bearer TOKEN
```

---

# 👤 Users

## Create User

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

# ⏱ Work Time Management

Clock-in

```
POST /clock-in
```

Clock-out

```
POST /clock-out
```

View work history

```
GET /my-entries
```

---

# 📝 Time Adjustments

Request adjustment

```
POST /adjustments/request
```

```json
{
  "work_entry_id": "ENTRY_ID",
  "old_value": "2026-03-10T08:11:00.000Z",
  "new_value": "2026-03-10T08:10:00.000Z",
  "reason": "Forgot to clock in"
}
```

---

# 👨‍💼 Admin Features

Dashboard

```
GET /admin/dashboard
```

Approve adjustment

```
POST /admin/adjustments/:id/approve
```

Reject adjustment

```
POST /admin/adjustments/:id/reject
```

---

# 📊 Reports

Hours today

```
GET /admin/reports/hours-today
```

Weekly hours

```
GET /admin/reports/hours-week
```

Hours by date range

```
GET /admin/reports/hours-range
```

Example:

```
/admin/reports/hours-range?start=2026-03-01&end=2026-03-10
```

---

# 🧾 Audit Logs

```
GET /admin/audit-logs
```

---

# ❤️ Health Check

```
GET /admin/health
```

Response:

```json
{
  "status": "ok",
  "server": "online",
  "database": "connected"
}
```

---

# ▶️ How to Run the Project

Clone the repository

```
git clone https://github.com/KakaLopes/tcc-backend-jornada
```

Install dependencies

```
npm install
```

Configure `.env`

```
DATABASE_URL="mysql://user:password@localhost:3306/tcc_db"
JWT_SECRET="secret"
```

Run Prisma

```
npx prisma migrate dev
```

Start server

```
node index.js
```

Server:

```
http://localhost:3000
```

---

# 🌐 Live Backend

```
https://tcc-backend-jornada-production.up.railway.app
```

---

# 📱 Mobile Application

This project also includes a mobile application built with **React Native (Expo)** featuring:

- Login  
- Clock-in  
- Clock-out  
- Work hours tracking  

The app consumes this backend API.

---

# 👨‍🎓 Author

Catalina Lopes  
Software Engineering – Final Project (TCC)

---

# 📚 Academic Purpose

This project demonstrates knowledge in:

- REST API development  
- JWT authentication  
- Backend architecture  
- ORM usage (Prisma)  
- Access control  
- Audit logging  
- Version control with Git & GitHub
