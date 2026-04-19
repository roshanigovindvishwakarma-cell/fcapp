const Message = require('../models/Message');
const cloudinary = require('../config/cloudinary');

exports.sendMessage = async (req, res) => {
    try {
        const { receiverId, message, image } = req.body;
        const senderId = req.user._id;

        let imageUrl = image;
        
        // If image is a base64 string, upload to Cloudinary
        if (image && image.startsWith('data:image')) {
            try {
                const uploadResponse = await cloudinary.uploader.upload(image, {
                    folder: 'atrium_chat',
                });
                imageUrl = uploadResponse.secure_url;
            } catch (err) {
                console.error('Cloudinary upload error:', err);
                // Fallback to base64 if upload fails (not ideal but keeps it working)
            }
        }

        const newMessage = new Message({
            senderId,
            receiverId,
            message,
            image: imageUrl
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

exports.searchMessages = async (req, res) => {
    try {
        const { query } = req.query;
        const currentUserId = req.user._id;

        if (!query) return res.json([]);

        const messages = await Message.find({
            $and: [
                {
                    $or: [
                        { senderId: currentUserId },
                        { receiverId: currentUserId }
                    ]
                },
                { message: { $regex: query, $options: 'i' } }
            ]
        }).populate('senderId', 'name profilePic').sort({ createdAt: -1 });

        res.json(messages);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
