# SEN — AI-Powered Collaborative Code Editor

> A real-time collaborative development environment where developers can work together, chat, and generate full-stack code using AI — all in one place.

---

## 🚀 Live Demo

🌐 **Frontend:** [https://sen-px78.onrender.com](https://sen-px78.onrender.com)

---

## 📸 Features at a Glance

- 🔐 **Authentication** — Register & Login with JWT-based sessions
- 💼 **Project Management** — Create projects, invite collaborators
- 💬 **Real-time Collaboration** — Live group chat per project via WebSockets
- 🤖 **AI Code Generation** — Tag `@ai` in chat to generate full MERN project code instantly
- 🗂️ **Virtual File System** — AI-generated code is displayed in a live file explorer
- ▶️ **In-Browser Execution** — Run generated projects directly in the browser using WebContainers
- 🔒 **Secure Logout** — Token blacklisting via Redis prevents JWT reuse after logout

---

## 🧱 Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| **Node.js + Express** | REST API server |
| **Socket.io** | Real-time WebSocket communication |
| **MongoDB + Mongoose** | Database & ODM |
| **Redis (ioredis)** | JWT blacklisting for secure logout |
| **JSON Web Tokens** | Stateless authentication |
| **bcrypt** | Password hashing |
| **Google Gemini AI** | AI code generation (`gemini-2.5-flash`) |
| **express-validator** | Request input validation |
| **morgan** | HTTP request logging |

### Frontend
| Technology | Purpose |
|---|---|
| **React 19 + Vite** | Frontend framework & build tool |
| **React Router DOM** | Client-side routing |
| **Socket.io Client** | Real-time communication with backend |
| **Axios** | HTTP API requests |
| **WebContainers API** | In-browser Node.js runtime |
| **Tailwind CSS** | Utility-first styling |
| **highlight.js** | Syntax highlighting for code blocks |
| **react-markdown** | Render markdown AI responses |
| **Remix Icons** | Icon library |

---

## 📁 Project Structure

```
SEN/
├── backend/
│   ├── app.js                   # Express app config (middlewares + routes)
│   ├── server.js                # HTTP server + Socket.io setup + AI chat handler
│   ├── .env                     # Environment variables (not committed)
│   ├── db/
│   │   └── db.js                # MongoDB connection
│   ├── models/
│   │   ├── user-model.js        # User schema (bcrypt + JWT methods)
│   │   └── project-model.js     # Project schema (users + fileTree)
│   ├── middlewares/
│   │   └── authMiddleware.js    # JWT auth guard + Redis blacklist check
│   ├── routes/
│   │   ├── userRoute.js         # /users/* endpoints
│   │   ├── projectRoute.js      # /projects/* endpoints
│   │   └── aiRoute.js           # /ai/* endpoints
│   ├── controllers/
│   │   ├── user-controller.js   # Auth logic (register, login, logout, profile)
│   │   ├── project-controller.js# Project CRUD logic
│   │   └── ai-controller.js     # AI prompt forwarding
│   └── services/
│       ├── userService.js       # User business logic
│       ├── projectService.js    # Project business logic
│       ├── aiService.js         # Gemini AI integration
│       └── redisService.js      # Redis client
│
└── frontend/
    ├── index.html
    └── src/
        ├── main.jsx             # App entry point
        ├── App.jsx              # Route definitions
        ├── config/
        │   ├── axios.js         # Axios instance with auth headers
        │   ├── socket.js        # Socket.io client config
        │   └── webContainer.js  # WebContainer boot config
        ├── context/             # React context (auth state)
        ├── auth/                # Route protection (PrivateRoute)
        ├── routes/              # Route components
        └── screens/
            ├── Home.jsx         # Dashboard — view & create projects
            ├── Login.jsx        # Login page
            ├── Register.jsx     # Registration page
            └── Project.jsx      # Collaborative editor + AI chat
```

---

## 🔌 API Endpoints

### Auth — `/users`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/users/register` | ❌ | Register a new user |
| `POST` | `/users/login` | ❌ | Login and receive JWT |
| `GET` | `/users/profile` | ✅ | Get logged-in user profile |
| `GET` | `/users/logout` | ✅ | Logout and blacklist token |
| `GET` | `/users/all` | ✅ | Get all users (except self) |

### Projects — `/projects`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/projects/create` | ✅ | Create a new project |
| `GET` | `/projects/all` | ✅ | Get all projects for logged-in user |
| `GET` | `/projects/get-project/:projectId` | ✅ | Get a specific project with populated users |
| `PUT` | `/projects/add-user` | ✅ | Add collaborators to a project |
| `PUT` | `/projects/update-file-tree` | ✅ | Save AI-generated file tree to project |

### AI — `/ai`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/ai/get-result?prompt=...` | ❌ | Generate AI response for a given prompt |

### WebSocket Events
| Event | Direction | Description |
|---|---|---|
| `connection` | Client → Server | Authenticate via JWT + join project room |
| `project-message` | Client → Server | Send a chat message in the project room |
| `project-message` | Server → Client | Receive broadcast messages (including AI responses) |
| `disconnect` | Client → Server | Leave the project room |

> **AI Trigger:** Send a `project-message` containing `@ai <your prompt>` to trigger the Gemini AI to generate code and broadcast the result to the entire room.

---

## ⚙️ Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [MongoDB Atlas](https://www.mongodb.com/atlas) account
- [Redis](https://redis.io/) instance (e.g., [Upstash](https://upstash.com/) or Redis Cloud)
- [Google AI Studio](https://aistudio.google.com/) API Key

---

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/SEN.git
cd SEN
```

---

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file inside `backend/`:

```env
PORT=8080
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
REDIS_HOST=your_redis_host
REDIS_PORT=your_redis_port
REDIS_PASSWORD=your_redis_password
GOOGLE_AI_KEY=your_google_gemini_api_key
```

Start the backend server:

```bash
node server.js
```

The server will run on `http://localhost:8080`.

---

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

Create a `.env` file inside `frontend/`:

```env
VITE_API_URL=http://localhost:8080
```

Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## 🔐 Environment Variables Reference

### Backend (`backend/.env`)

| Variable | Description |
|---|---|
| `PORT` | Port to run the backend server on |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret key for signing JWTs |
| `REDIS_HOST` | Redis server hostname |
| `REDIS_PORT` | Redis server port |
| `REDIS_PASSWORD` | Redis server password |
| `GOOGLE_AI_KEY` | Google Gemini API key |

### Frontend (`frontend/.env`)

| Variable | Description |
|---|---|
| `VITE_API_URL` | Base URL of the backend API |

---

## 🏗️ Architecture Overview

```
┌───────────────────────────────┐
│      React Frontend           │
│  (Vite + Tailwind + Socket)   │
└──────────────┬────────────────┘
               │  HTTP REST + WebSocket
┌──────────────▼────────────────┐
│        Node.js Server         │
│   (Express + Socket.io)       │
│                               │
│  Routes → Middleware → ...    │
│  Controllers → Services       │
└──────┬──────────┬─────────────┘
       │          │
┌──────▼──┐  ┌───▼──────┐  ┌────────────────┐
│ MongoDB │  │  Redis   │  │  Google Gemini │
│ (Data)  │  │ (Tokens) │  │   AI (Gemini)  │
└─────────┘  └──────────┘  └────────────────┘
```

**Request Flow:**
```
Client → Route (Validation) → Auth Middleware → Controller → Service → Model → DB
```

**WebSocket Flow:**
```
Client connects with JWT + projectId
→ Socket middleware validates both
→ User joins project room
→ Messages broadcast to room
→ @ai messages trigger Gemini → response broadcast to room
```

---

## 🤖 How AI Code Generation Works

1. A user types a message containing `@ai` in the project chat, e.g.:
   ```
   @ai create a full-stack todo app
   ```
2. The server strips `@ai` and sends the prompt to **Google Gemini 2.5 Flash**.
3. The AI is configured with a **system instruction** to act as a senior MERN developer and return a strict **JSON file tree** structure.
4. The response is broadcast in real-time to all collaborators in the project room via Socket.io.
5. The frontend parses the JSON and renders the files in a virtual file explorer.
6. Users can run the generated code directly in the browser using the **WebContainers API** (in-browser Node.js runtime).

---

## 🛡️ Security Highlights

- **Password Hashing** — All passwords are hashed using `bcrypt` with a salt factor of 10 before storage.
- **JWT Auth** — Tokens are signed with a secret key and expire after 24 hours.
- **Token Blacklisting** — On logout, tokens are stored in Redis with a 24-hour TTL, preventing reuse even before expiry.
- **Input Validation** — All API inputs are validated using `express-validator` at the route level.
- **`select: false` on passwords** — Mongoose schema ensures passwords are never accidentally returned in queries.

---

## 📦 Dependencies Summary

### Backend
```json
{
  "express": "^5.1.0",
  "socket.io": "^4.8.1",
  "mongoose": "^8.16.4",
  "ioredis": "^5.6.1",
  "jsonwebtoken": "^9.0.2",
  "bcrypt": "^6.0.0",
  "@google/generative-ai": "^0.24.1",
  "express-validator": "^7.2.1",
  "cors": "^2.8.5",
  "morgan": "^1.10.1",
  "cookie-parser": "^1.4.7",
  "dotenv": "^17.2.0"
}
```

### Frontend
```json
{
  "react": "^19.1.0",
  "react-router-dom": "^7.7.0",
  "socket.io-client": "^4.8.1",
  "axios": "^1.11.0",
  "@webcontainer/api": "^1.6.1",
  "tailwindcss": "^3.4.17",
  "highlight.js": "^11.11.1",
  "react-markdown": "^10.1.0",
  "remixicon": "^4.6.0"
}
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **ISC License**.

---

<div align="center">
  <p>Built with ❤️ using the MERN Stack + AI</p>
</div>
