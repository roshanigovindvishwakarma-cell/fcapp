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

        socket.on('send_message', async (data) => {
            const { senderId, receiverId, message, image, timestamp } = data;
            
            // Check for blocking
            const receiver = await User.findById(receiverId);
            const isBlockedByReceiver = receiver?.blockedUsers.includes(senderId);
            const sender = await User.findById(senderId);
            const isBlockedBySender = sender?.blockedUsers.includes(receiverId);

            if (isBlockedByReceiver || isBlockedBySender) {
                return socket.emit('error', { message: 'Message could not be sent. User is blocked.' });
            }

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
                const senderSocketId = users[senderId];
                if (senderSocketId) {
                    io.to(senderSocketId).emit('message_read', { messageId });
                }
                if (messageId) {
                    await Message.findByIdAndUpdate(messageId, { isRead: true, status: 'seen' });
                }
            } catch (err) {
                console.error("Mark Read Error:", err);
            }
        });

        socket.on('delete_message', (data) => {
            const { messageId, receiverId, type } = data;
            if (type === 'everyone') {
                const receiverSocketId = users[receiverId];
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit('message_deleted', { messageId, type });
                }
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
