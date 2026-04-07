const Message = require('../models/Message');

exports.getUsers = async (req, res) => {
    try {
        const currentUserId = req.user._id;
        const users = await User.find({ _id: { $ne: currentUserId } }).select('-password');
        
        // Fetch last message for each user
        const usersWithLastMessage = await Promise.all(users.map(async (user) => {
            const lastMessage = await Message.findOne({
                $or: [
                    { senderId: currentUserId, receiverId: user._id },
                    { senderId: user._id, receiverId: currentUserId }
                ]
            }).sort({ createdAt: -1 });

            return {
                ...user._doc,
                lastMessage: lastMessage ? {
                    content: lastMessage.message,
                    image: lastMessage.image,
                    createdAt: lastMessage.createdAt,
                    senderId: lastMessage.senderId,
                    isRead: lastMessage.isRead
                } : null
            };
        }));

        res.json(usersWithLastMessage);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
