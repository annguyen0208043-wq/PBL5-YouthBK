const express = require('express');
const {
  createNotification,
  getMyNotifications,
  markNotificationAsRead,
  getUnreadCount,
  getFacultyTargets,
  getSentNotifications,
  searchRecipients,
} = require('../controllers/notificationController');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/mine', verifyToken, getMyNotifications);
router.get('/unread-count', verifyToken, getUnreadCount);
router.get('/sent', verifyToken, isAdmin, getSentNotifications);
router.get('/faculties', verifyToken, isAdmin, getFacultyTargets);
router.get('/recipients/search', verifyToken, isAdmin, searchRecipients);
router.post('/', verifyToken, isAdmin, createNotification);
router.put('/:notificationId/read', verifyToken, markNotificationAsRead);
router.patch('/:notificationId/read', verifyToken, markNotificationAsRead);

module.exports = router;
