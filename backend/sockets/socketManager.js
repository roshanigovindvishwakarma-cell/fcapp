const User = require('../models/User');

const users = {}; // userId: socketId

exports.socketManager = (io) => {
    io.on('connection', (socket) => {
        console.log('A user connected:', socket.id);

        socket.on('join', (userId) => {
            users[userId] = socket.id;
            io.emit('online_users', Object.keys(users));
            console.log(`User ${userId} joined with socket ${socket.id}`);
        });

        socket.on('send_message', (data) => {
            const { senderId, receiverId, message, image, timestamp } = data;
            const receiverSocketId = users[receiverId];
            if (receiverSocketId) {
                io.to(receiverSocketId).emit('receive_message', {
                    senderId,
                    message,
                    image,
                    timestamp
                });
            }
        });

        socket.on('typing', (data) => {
            const { senderId, receiverId } = data;
            const receiverSocketId = users[receiverId];
            if (receiverSocketId) {
                io.to(receiverSocketId).emit('typing', { senderId });
            }
        });

        socket.on('stop_typing', (data) => {
            const { senderId, receiverId } = data;
            const receiverSocketId = users[receiverId];
            if (receiverSocketId) {
                io.to(receiverSocketId).emit('stop_typing', { senderId });
            }
        });

        socket.on('disconnect', () => {
            const userId = Object.keys(users).find(key => users[key] === socket.id);
            if (userId) {
                delete users[userId];
                io.emit('online_users', Object.keys(users));
            }
            console.log('User disconnected:', socket.id);
        });
    });
};
