# Atrium Chat - Professional Real-time Communication

A premium, production-ready real-time chat application built with Node.js, Express, MongoDB Atlas, Socket.IO, and React.

## 🚀 Quick Start (Local)

### 1. Backend Setup
```bash
cd backend
npm install
# Create .env from .env.example
npm run dev
```

### 2. Frontend Setup
```bash
cd frontend
npm install
# Add VITE_BACKEND_URL=http://localhost:5000 to .env
npm run dev
```

---

## 🛠 MongoDB Atlas Setup Steps
1.  **Create Account**: Sign up at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register).
2.  **Create Cluster**: Choose the FREE tier (M0).
3.  **Network Access**: Add IP address `0.0.0.0/0` (Allow all for development).
4.  **Database User**: Create a user with a password.
5.  **Get URI**: Click "Connect" -> "Connect your application" -> Copy the connection string.
6.  **Replace**: Paste into `.env` as `MONGO_URI`.

---

## 🚀 Deployment Guide

### **Important: Socket.IO on Vercel**
Vercel's standard Serverless Functions **do not support Socket.IO** (websockets) because they are ephemeral. To make real-time chat work in production, you should:
-   **Backend**: Deploy to [Railway](https://railway.app), [Render](https://render.com), or [DigitalOcean](https://digitalocean.com).
-   **Frontend**: Can stay on [Vercel](https://vercel.com).

### **Frontend Setup (Vercel)**
1.  **Vercel Dashboard**: Create a new project pointing to your GitHub repo.
2.  **Root Directory**: Set this to `frontend`.
3.  **Environment Variables**: Add:
    -   `VITE_BACKEND_URL`: Your live backend URL (e.g., `https://your-backend.railway.app`)
    -   `VITE_GITHUB_CLIENT_ID`: Your GitHub OAuth Client ID.

### **Backend Setup (Railway/Render)**
1.  **Root Directory**: Set this to `backend`.
2.  **Environment Variables**: Add:
    -   `MONGO_URI`: Your MongoDB Atlas connection string.
    -   `JWT_SECRET`: A long random string.
    -   `CLIENT_URL`: Your live frontend URL (e.g., `https://atrium-chat.vercel.app`)
    -   `GITHUB_CLIENT_ID`: Your GitHub OAuth Client ID.
    -   `GITHUB_CLIENT_SECRET`: Your GitHub OAuth Client Secret.

---

## ✅ Current Project Links (Update these after redeploying)
- **GitHub Repository**: [https://github.com/roshanigovindvishwakarma-cell/fcapp](https://github.com/roshanigovindvishwakarma-cell/fcapp)
- **Frontend Live (Vercel)**: [https://frontend-29l3c0m4y-roshanigovindvishwakarma-cells-projects.vercel.app](https://frontend-29l3c0m4y-roshanigovindvishwakarma-cells-projects.vercel.app)
- **Backend API (Vercel - HTTP ONLY)**: [https://backend-n4f7c410m-roshanigovindvishwakarma-cells-projects.vercel.app](https://backend-n4f7c410m-roshanigovindvishwakarma-cells-projects.vercel.app)

---

## 🛠 Deployment Fix (CRITICAL)
Currently, your Vercel backend is failing to connect because it's using `localhost`. To fix this:
1. **MongoDB Atlas**: Get your connection string (M0 Free Tier).
2. **Vercel Dashboard**: Go to your project `backend-weld-ten-95`.
3. **Environment Variables**: Add:
   - `MONGO_URI`: Your MongoDB Atlas string.
   - `JWT_SECRET`: A long random string.
   - `CLIENT_URL`: `https://frontend-five-tau-92.vercel.app`
4. **Redeploy**: Click "Deploy" to apply the variables.

---

## ⚡ Features
- **JWT Auth**: Secure login/register.
- **Real-time**: Instant messaging via Socket.IO.
- **Online Presence**: Track active users.
- **Typing Indicators**: "User is typing..."
- **Premium UI**: Framer Motion animations and custom emerald theme.
