const Message = require('../models/Message');

exports.sendMessage = async (req, res) => {
    try {
        const { receiverId, message, image } = req.body;
        const senderId = req.user._id;

        const newMessage = new Message({
            senderId,
            receiverId,
            message,
            image
        });

        await newMessage.save();
        res.status(201).json(newMessage);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.getMessages = async (req, res) => {
    try {
        const { userId } = req.params;
        const senderId = req.user._id;

        const messages = await Message.find({
            $or: [
                { senderId: senderId, receiverId: userId },
                { senderId: userId, receiverId: senderId }
            ]
        }).sort({ createdAt: 1 });

        res.json(messages);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user._id;

        await Message.updateMany(
            { senderId: userId, receiverId: currentUserId, isRead: false },
            { $set: { isRead: true } }
        );

        res.json({ message: 'Messages marked as read' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
