# ⏱ Work Time Management System – Backend API

This backend was developed as part of a Final Year Project (TCC) for the Software Engineering course.

The API provides the server-side logic for a complete work time management system designed for cafés and small businesses.

The system supports:

- Authentication
- Employee management
- Clock-in / Clock-out
- Leave requests
- Reports
- Admin permissions
- Medical certificate upload
- Attendance tracking

The backend is deployed online and connected to a cloud MySQL database.

---

# 🚀 Technologies Used

## Backend
- Node.js
- Express.js
- Prisma ORM
- MySQL

## Authentication & Security
- JWT Authentication
- bcrypt
- Middleware Authorization

## Cloud & Infrastructure
- Render (Backend Hosting)
- Aiven MySQL Cloud Database
- Cloudinary (File Upload Storage)

## Development Tools
- Thunder Client
- Git & GitHub
- dotenv
- CORS

---

# 🏗 System Architecture

The backend follows a REST API architecture organized into layers:

- Controllers → Business logic
- Routes → API endpoints
- Middlewares → Authentication & authorization
- Prisma ORM → Database communication
- MySQL → Data persistence

Authentication is handled using JWT tokens.

---

# 📂 Project Structure

```bash
backend
│
├── controllers
│   ├── adminController.js
│   ├── authController.js
│   ├── adjustmentController.js
│   ├── reportController.js
│   ├── timeEntryController.js
│   ├── userController.js
│   └── leaveController.js
│
├── middlewares
│   ├── auth.js
│   └── errorHandler.js
│
├── prisma
│   ├── schema.prisma
│   └── seed.js
│
├── routes
│   ├── adminRoutes.js
│   ├── reportRoutes.js
│   ├── uploadRoutes.js
│   └── userRoutes.js
│
├── services
├── uploads
│
├── index.js
├── package.json
└── .env
```

---

# 🔐 Authentication

After login, the JWT token must be sent in the request header:

```text
Authorization: Bearer TOKEN
```

The system supports:
- Protected routes
- Admin authorization
- Role-based access control

---

# 👤 User Management

## Create Employee

```http
POST /users
```

Example:

```json
{
  "full_name": "Maria Silva",
  "email": "maria@email.com",
  "password": "123456",
  "role": "user"
}
```

---

## Login

```http
POST /login
```

Example:

```json
{
  "email": "admin@email.com",
  "password": "123456"
}
```

---

## Update Employee

```http
PUT /users/:id
```

Supports:
- Employee type
- Payment type
- Active status
- Admin promotion

---

# ⏱ Work Time Management

## Clock In

```http
POST /clock-in
```

## Clock Out

```http
POST /clock-out
```

## Work History

```http
GET /my-entries
```

## Weekly Summary

```http
GET /my-hours-week
```

## Daily Summary

```http
GET /my-hours-today
```

---

# 📝 Time Adjustments

## Request Adjustment

```http
POST /adjustments/request
```

Example:

```json
{
  "work_entry_id": "ENTRY_ID",
  "old_value": "2026-03-10T08:11:00.000Z",
  "new_value": "2026-03-10T08:10:00.000Z",
  "reason": "Forgot to clock in"
}
```

---

# 🏖 Leave Management

## Create Leave Request

```http
POST /leave
```

Supports:
- Vacation
- Sick Leave
- Day Off
- Other leave types

---

## Get My Leave Requests

```http
GET /leave/my
```

---

## Admin – Get All Leave Requests

```http
GET /leaves
```

---

## Approve / Reject Leave

```http
PUT /leave/:id
```

---

# 📎 Medical Certificate Upload

The system supports upload of:
- PDF documents
- Images
- Base64 uploads

## Upload Endpoint

```http
POST /upload/base64
```

Example:

```json
{
  "fileName": "medical.pdf",
  "mimeType": "application/pdf",
  "base64": "BASE64_STRING"
}
```

Files are stored using Cloudinary.

---

# 👨‍💼 Admin Features

Administrators can:

- Manage employees
- Promote users to admin
- Approve/reject leave requests
- View employee records
- Access reports
- Manage attendance
- View uploaded documents

---

# 📊 Reports

## Hours Today

```http
GET /admin/reports/hours-today
```

## Weekly Hours

```http
GET /admin/reports/hours-week
```

## Hours by Date Range

```http
GET /admin/reports/hours-range
```

Example:

```text
/admin/reports/hours-range?start=2026-03-01&end=2026-03-10
```

---

# ❤️ Health Check

```http
GET /
```

Response:

```text
Servidor do TCC está funcionando!
```

---

# 🌐 Live Backend API

Hosted on Render:

```text
https://worktime-backend.onrender.com
```

---

# 🗄 Database

Hosted on:
- Aiven MySQL Cloud Database

Using:
- Prisma ORM
- MySQL

---

# 🌍 Web Support

The backend supports:
- Mobile app requests
- Expo Web
- Browser requests
- CORS configuration

---

# ▶️ How to Run the Project

## Clone repository

```bash
git clone https://github.com/KakaLopes/tcc-backend-jornada
```

---

## Install dependencies

```bash
npm install
```

---

## Configure .env

```env
DATABASE_URL="mysql://user:password@host:port/database"
JWT_SECRET="secret"

CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"
```

---

## Prisma

```bash
npx prisma generate
npx prisma db push
```

---

## Seed Database

```bash
node prisma/seed.js
```

---

## Start Server

```bash
node index.js
```

---

# 🔑 Default Admin

```text
Email: admin@email.com
Password: 123456
```

---

# 📱 Mobile Application

This backend powers a React Native (Expo) mobile application featuring:

- Login
- Employee management
- Clock-in / Clock-out
- Leave management
- Reports
- Admin dashboard
- File upload system

---

# 👨‍🎓 Author

Catalina Lopes  
Bachelor Degree in Software Engineering  
Final Year Project (TCC)

---

# 📚 Academic Purpose

This project demonstrates knowledge in:

- REST API Development
- JWT Authentication
- Backend Architecture
- Prisma ORM
- MySQL Database Management
- Cloud Deployment
- File Upload Handling
- Role-Based Authorization
- Full-Stack Development
- Real-World System Design

---

# 📌 Final Note

This project was developed not only as an academic requirement, but also as a real-world management solution for cafés and small businesses.

It integrates:
- Backend development
- Authentication
- Database modeling
- Cloud deployment
- File handling
- Reporting systems
- Mobile integration

into a complete full-stack management platform.
