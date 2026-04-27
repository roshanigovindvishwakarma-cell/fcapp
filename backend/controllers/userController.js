const Message = require('../models/Message');
const User = require('../models/User');

exports.getUsers = async (req, res) => {
    try {
        const currentUserId = req.user._id;
        const users = await User.find({ _id: { $ne: currentUserId } }).select('-password');
        
        // Fetch last message for each user
        const usersWithLastMessage = await Promise.all(users.map(async (user) => {
            if (user.isDeleted) return null; // Safety check

            const lastMessage = await Message.findOne({
                $or: [
                    { senderId: currentUserId, receiverId: user._id },
                    { senderId: user._id, receiverId: currentUserId }
                ]
            }).sort({ createdAt: -1 });

            // Check if we are blocked by this user
            const blockedByMe = req.user.blockedUsers.includes(user._id);
            const blockedByThem = user.blockedUsers.includes(currentUserId);

            return {
                ...user._doc,
                blockedByMe,
                blockedByThem,
                lastMessage: lastMessage ? {
                    content: lastMessage.message,
                    image: lastMessage.image,
                    createdAt: lastMessage.createdAt,
                    senderId: lastMessage.senderId,
                    isRead: lastMessage.isRead
                } : null
            };
        }));

        res.json(usersWithLastMessage.filter(Boolean));
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

exports.blockUser = async (req, res) => {
    try {
        const { userId } = req.body;
        const currentUserId = req.user._id;

        if (userId === currentUserId.toString()) {
            return res.status(400).json({ message: 'Cannot block yourself' });
        }

        await User.findByIdAndUpdate(currentUserId, {
            $addToSet: { blockedUsers: userId }
        });

        res.json({ message: 'User blocked' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.unblockUser = async (req, res) => {
    try {
        const { userId } = req.body;
        const currentUserId = req.user._id;

        await User.findByIdAndUpdate(currentUserId, {
            $pull: { blockedUsers: userId }
        });

        res.json({ message: 'User unblocked' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.deleteAccount = async (req, res) => {
    try {
        const userId = req.user._id;
        
        // Soft delete: clear profile but mark as deleted
        await User.findByIdAndUpdate(userId, {
            isDeleted: true,
            name: 'Deleted User',
            email: `deleted_${userId}@fcapp.com`, // Avoid unique collisions
            password: 'deleted_account_lockout',
            profilePic: '',
            status: 'offline'
        });

        // Mask messages (optional, based on requirement)
        await Message.updateMany(
            { senderId: userId },
            { $set: { message: 'Message unavailable (User deleted account)' } }
        );

        res.json({ message: 'Account deleted successfully' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
