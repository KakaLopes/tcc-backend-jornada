# ⏱ Work Time Management System

A full-stack work time management system developed as a Final Year Project for the Software Engineering course.

This system was designed for cafés and small businesses to help manage:

- Employee attendance
- Clock-in / clock-out
- Leave requests
- Employee management
- Reports and analytics
- Medical certificate uploads
- Administrative approvals

The project includes:

- 📱 Mobile application (React Native + Expo)
- 🌐 REST API backend (Node.js + Express)
- 🗄 MySQL database with Prisma ORM
- ☁ Cloud deployment and file storage

---

# 🚀 Technologies Used

## Frontend (Mobile)

- React Native
- Expo
- Expo Router
- Axios
- AsyncStorage
- JavaScript (ES6+)

## Backend

- Node.js
- Express
- Prisma ORM
- MySQL
- JWT Authentication
- bcrypt
- Cloudinary
- CORS
- dotenv

## Dev Tools

- Git & GitHub
- Thunder Client
- Render
- Aiven MySQL
- VS Code

---

# 🏗 System Architecture

The project follows a client-server architecture.

## Mobile Application

Responsible for:

- User interface
- Authentication
- Work hour registration
- Leave request management
- API communication

## Backend API

Responsible for:

- Authentication
- Business rules
- Database communication
- Reports
- Access control
- File upload handling

## Database

MySQL database managed with Prisma ORM.

---

# 📱 Main Features

## Employee Features

- Secure login with JWT
- Clock-in / Clock-out
- Daily and weekly work tracking
- Leave requests
- Upload medical certificates
- View work history

---

## 👨‍💼 Admin Features

- Manage employees
- Approve/reject leave requests
- Approve/reject time adjustments
- View reports
- Access dashboard
- Generate work reports

---

# 🔐 Authentication

Authentication is implemented using JWT (JSON Web Token).

Protected routes require:

```http
Authorization: Bearer TOKEN
```

---

# 📂 Project Structure

```text
project
│
├── mobile-app
│   ├── app
│   ├── services
│   ├── components
│   └── assets
│
├── backend
│   ├── controllers
│   ├── routes
│   ├── middlewares
│   ├── prisma
│   └── uploads
│
└── README.md
```

---

# 🌐 Live Backend

```text
https://worktime-backend.onrender.com
```

---

# ▶️ Running the Backend

Install dependencies

```bash
npm install
```

Run Prisma

```bash
npx prisma db push
npx prisma generate
```

Start server

```bash
node index.js
```

---

# ▶️ Running the Mobile App

Install dependencies

```bash
npm install
```

Start Expo

```bash
npx expo start
```

Run on:

- Expo Go
- Android Emulator
- Web Browser

---

# ☁ Deployment

## Backend

Hosted on Render.

## Database

Hosted on Aiven MySQL Cloud.

## File Uploads

Managed with Cloudinary.

---

# 📊 Academic Objectives

This project demonstrates practical knowledge in:

- Full-stack development
- REST API architecture
- Authentication and authorization
- Database modeling
- Cloud deployment
- Mobile application development
- File upload handling
- Real-world business systems

---

# 👨‍🎓 Author

Catalina Lopes

Software Engineering – Final Year Project (TCC)

---

# 📚 Academic Purpose

This project was developed for academic purposes as part of the Software Engineering degree program.

It simulates a real-world employee management and work time tracking solution for small businesses.
