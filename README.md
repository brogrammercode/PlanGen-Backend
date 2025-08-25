# 📅 PlanGen Backend - Smart Planning & Task Management

[![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)](https://nodejs.org/) 
[![Express](https://img.shields.io/badge/Express.js-Backend-lightgrey.svg)](https://expressjs.com/) 
[![MongoDB](https://img.shields.io/badge/Database-MongoDB-brightgreen.svg)](https://www.mongodb.com/) 
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 🚀 Introduction  

**PlanGen Backend** powers the **PlanGen** application – a smart planner designed to manage projects, tasks, and schedules with **clean APIs and scalable architecture**.  
This service ensures **fast, secure, and reliable** task management for individuals and teams.

✅ REST API for tasks, templates, and planning  
✅ MongoDB integration for persistent storage  
✅ Built with Node.js & Express for scalability  
✅ Authentication & user management ready  

---

## ✨ Features  

- 📌 **Task Management** – Create, update, delete, and track tasks.  
- 🗂️ **Templates** – Reusable task templates for quick planning.  
- ⏰ **Scheduling** – Organize tasks with due dates & deadlines.  
- 🔐 **Authentication** – Secure login & user management.  
- 📊 **Scalable Backend** – Ready for production deployment.  

---

## ⚙️ Tech Stack  

- **Node.js** – Backend runtime  
- **Express.js** – Web framework  
- **MongoDB + Mongoose** – Database & schema modeling  
- **JWT Authentication** – Secure user sessions  
- **GitHub Actions (CI/CD)** – Automated testing & deployment (planned)  

---

## 📂 Project Structure  

```
PlanGen-Backend/
  └─ src/
       ├─ controllers/      # Request handlers
       ├─ models/           # Mongoose schemas
       ├─ routes/           # API routes
       ├─ middlewares/      # Auth & error handling
       └─ app.js            # Main app setup

  ├─ .env.example           # Environment variables
  ├─ package.json           # Dependencies & scripts
  └─ README.md              # Project docs

```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v16 or later)
- **MongoDB** (local or cloud e.g. MongoDB Atlas)
- **npm** or **yarn**

### Installation
```bash
# Clone the repository
git clone https://github.com/brogrammercode/PlanGen-Backend.git
cd PlanGen-Backend

# Install dependencies
npm install
```
## Environment Setup
Create a .env file in the root directory and configure the following:

```
PORT=5000
MONGO_URI=your_mongo_connection_string
JWT_SECRET=your_jwt_secret
```

## Run the server

``` 
npm run dev   # Development (with nodemon)
npm start     # Production
```