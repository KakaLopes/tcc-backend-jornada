# ⏱ Work Time Management System

This backend was developed as part of a Final Year Project for the Software Engineering course.

It provides the server-side logic for a work time management system designed for cafés and small businesses. The API supports authentication, employee management, clock-in/clock-out registration, leave requests, adjustments, reports, and document upload for sick leave requests.

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
- Cloudinary  
- dotenv  
- CORS  

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
│   ├── timeEntryController.js
│   └── leaveController.js
│
├── routes
│   ├── adminRoutes.js
│   ├── reportRoutes.js
│   ├── userRoutes.js
│   └── uploadRoutes.js
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

# 🏖 Leave Requests

Create leave request

```
POST /leave
```

```json
{
  "leave_type": "sick_leave",
  "start_date": "2026-04-10",
  "end_date": "2026-04-12",
  "reason": "Medical appointment",
  "attachment_name": "medical.pdf",
  "attachment_url": "https://cloudinary-url",
  "attachment_type": "application/pdf"
}
```

Get my leave requests

```
GET /leave/my
```

Admin – get all leave requests

```
GET /leaves
```

Update leave status (approve/reject)

```
PUT /leave/:id
```

---

# 📎 File Upload (Medical Certificates)

Upload file (Base64)

```
POST /upload/base64
```

```json
{
  "fileName": "medical.pdf",
  "mimeType": "application/pdf",
  "base64": "BASE64_STRING"
}
```

Response:

```json
{
  "url": "https://cloudinary-url",
  "original_name": "medical.pdf",
  "type": "application/pdf"
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

Approve / Reject leave

```
PUT /leave/:id
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

CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"
```

Run Prisma

```
npx prisma db push
npx prisma generate
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
- Leave requests with document upload  
- Admin approval system  

The app consumes this backend API.

---

# 👨‍🎓 Author

Catalina Lopes  
Software Engineering – Final Project 

---

# 📚 Academic Purpose

This project demonstrates knowledge in:

- REST API development  
- JWT authentication  
- Backend architecture  
- ORM usage (Prisma)  
- Access control  
- File upload and cloud storage  
- Audit logging  
- Version control with Git & GitHub

--- 

📌 Final Note

This project was built not only as an academic requirement, but also as a practical solution for real-world business needs. It reflects the integration of backend development, authentication, database modeling, reporting logic, and cloud file handling in a complete management system.
