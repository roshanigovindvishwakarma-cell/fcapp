const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const messageRoutes = require('./routes/messageRoutes');
const { socketManager } = require('./sockets/socketManager');

dotenv.config();

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
    "https://fcapp-tawny.vercel.app",
    "https://frontend-five-tau-92.vercel.app",
    "https://frontend-29l3c0m4y-roshanigovindvishwakarma-cells-projects.vercel.app",
    "http://localhost:5173",
    process.env.CLIENT_URL
].filter(Boolean);

function isAllowedOrigin(origin) {
    if (!origin) return true;
    if (allowedOrigins.includes(origin)) return true;
    // Allow Vercel preview + deployment domains for this project/team.
    try {
        const { hostname } = new URL(origin);
        if (hostname.endsWith(".vercel.app")) return true;
    } catch (_) {
        // ignore invalid origins
    }
    return false;
}

const io = new Server(server, {
    cors: {
        origin: (origin, callback) => {
            if (isAllowedOrigin(origin)) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        methods: ["GET", "POST"],
        credentials: true
    }
});

const corsOptions = {
    origin: (origin, callback) => {
        if (isAllowedOrigin(origin)) return callback(null, true);
        return callback(null, false);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json());

// Health Check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        env: process.env.NODE_ENV
    });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);

// Socket.IO
socketManager(io);

// MongoDB Connection
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/chat-app';

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('MongoDB Connected');
        if (process.env.NODE_ENV !== "production") {
            server.listen(PORT, () => {
                console.log(`Server running on port ${PORT}`);
            });
        }
    })
    .catch(err => console.log(err));

module.exports = app;
