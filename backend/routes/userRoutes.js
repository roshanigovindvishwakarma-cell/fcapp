const express = require('express');
const router = express.Router();
const { getUsers, updateProfile, blockUser, unblockUser, deleteAccount } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getUsers);
router.put('/update-profile', protect, updateProfile);
router.post('/block', protect, blockUser);
router.post('/unblock', protect, unblockUser);
router.delete('/account', protect, deleteAccount);

module.exports = router;
