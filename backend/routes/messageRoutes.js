const express = require('express');
const router = express.Router();
const { sendMessage, getMessages, markAsRead, searchMessages, deleteMessage } = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, sendMessage);
router.get('/search', protect, searchMessages);
router.get('/:userId', protect, getMessages);
router.put('/mark-read/:userId', protect, markAsRead);
router.post('/delete', protect, deleteMessage);

module.exports = router;
