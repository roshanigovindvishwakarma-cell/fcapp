const express = require('express');
const router = express.Router();
const { sendMessage, getMessages, markAsRead } = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, sendMessage);
router.get('/:userId', protect, getMessages);
router.put('/mark-read/:userId', protect, markAsRead);

module.exports = router;
