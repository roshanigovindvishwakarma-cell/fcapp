const Message = require('../models/Message');
const User = require('../models/User');

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

exports.updateProfile = async (req, res) => {
    try {
        const { name, profilePic } = req.body;
        const user = await User.findById(req.user._id);

        if (user) {
            user.name = name || user.name;
            user.profilePic = profilePic || user.profilePic;

            const updatedUser = await user.save();
            res.json({
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                profilePic: updatedUser.profilePic
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
