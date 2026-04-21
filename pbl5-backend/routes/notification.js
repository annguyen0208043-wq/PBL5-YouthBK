const express = require('express');
const {
  createNotification,
  getMyNotifications,
  markNotificationAsRead,
  getFacultyTargets,
  getSentNotifications,
  searchRecipients,
} = require('../controllers/notificationController');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/mine', verifyToken, getMyNotifications);
router.get('/sent', verifyToken, isAdmin, getSentNotifications);
router.get('/faculties', verifyToken, isAdmin, getFacultyTargets);
router.get('/recipients/search', verifyToken, isAdmin, searchRecipients);
router.post('/', verifyToken, isAdmin, createNotification);
router.put('/:notificationId/read', verifyToken, markNotificationAsRead);

module.exports = router;
