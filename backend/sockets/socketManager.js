const User = require('../models/User');
const Message = require('../models/Message');

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

        socket.on('mark_read', async (data) => {
            const { messageId, senderId } = data;
            try {
                // Notify the sender that the message was read
                const senderSocketId = users[senderId];
                if (senderSocketId) {
                    io.to(senderSocketId).emit('message_read', { messageId });
                }
                // Update database
                if (messageId) {
                    await Message.findByIdAndUpdate(messageId, { isRead: true });
                }
            } catch (err) {
                console.error("Mark Read Error:", err);
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
