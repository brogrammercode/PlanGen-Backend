# 📅 PlanGen-Backend

> Backend API for **PlanGen** – a MERN-based plan and task generator app.  
> Supports **user authentication (Google Sign-In)**, **plan/template management**, and **progress tracking**.  
> Built with **Node.js, Express, MongoDB, and Mongoose**.

---

## 🚀 Features
- 🔑 **Authentication**
  - Google Sign-In via OAuth2  
  - JWT-based sessions  
- 📂 **Plan & Template Management**
  - Create, update, and delete plans & tasks  
  - Save reusable templates  
- 📊 **Progress Tracking**
  - Track task completion  
  - Measure consistency & achievements  

---

## 🛠️ Tech Stack
- **Backend:** Node.js, Express.js  
- **Database:** MongoDB + Mongoose  
- **Auth:** Google Identity + JWT  
- **Other:** Logger for debugging, Clean architecture  

---

## ⚡ Getting Started

### 1. Clone the repo
```bash
git clone https://github.com/brogrammercoder/PlanGen-Backend.git
cd PlanGen-Backend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Create a `.env` file
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
GOOGLE_CLIENT_ID=your_google_client_id
JWT_SECRET=your_jwt_secret
```

### 4. Run the server
```bash
npm start
```

---

## 📡 API Endpoints

### 🔐 Auth
- `POST /api/auth/google` → Google Sign-In

### 📅 Plans
- `GET /api/plans` → Get all plans  
- `POST /api/plans` → Create new plan  
- `PUT /api/plans/:id` → Update plan  
- `DELETE /api/plans/:id` → Delete plan  

### 📂 Templates
- `GET /api/templates` → Get all templates  
- `POST /api/templates` → Create new template  

---

## 🖼️ Example Google Sign-In Flow
1. User clicks **Sign in with Google** (frontend).  
2. Frontend sends **idToken** → `/api/auth/google`.  
3. Backend verifies with Google → creates/fetches user.  
4. Backend responds with:  
```json
{
  "success": true,
  "message": "Google sign-in successful",
  "token": "jwt_token_here",
  "user": {
    "id": "66d2c0a5f31b...",
    "name": "John Doe",
    "email": "johndoe@gmail.com",
    "username": "johndoe",
    "picture": "https://lh3.googleusercontent.com/a-/AOh14Gj..."
  }
}
```

---

## 🤝 Contributing
1. Fork this repo 🍴  
2. Create your feature branch (`git checkout -b feature/awesome-feature`)  
3. Commit changes (`git commit -m 'Add awesome feature'`)  
4. Push to branch (`git push origin feature/awesome-feature`)  
5. Open a PR 🚀  

---

## 📜 License
This project is licensed under the **MIT License** – free to use & modify.

---

🔥 *Plan smarter. Track better. Achieve more with PlanGen!*  
