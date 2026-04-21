const express = require('express');
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  updateUserRole,
  updateUserStatus,
  changePassword,
  searchUsers
} = require('../controllers/userController');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

const router = express.Router();

// Get all users (admin only)
router.get('/', verifyToken, isAdmin, getAllUsers);

router.get('/search', verifyToken, isAdmin, searchUsers);

// Get user by ID
router.get('/:userId', verifyToken, getUserById);

// Create new user (admin only)
router.post('/', verifyToken, isAdmin, createUser);

// Update user (admin only)
router.put('/:userId', verifyToken, isAdmin, updateUser);

// Delete user (admin only)
router.delete('/:userId', verifyToken, isAdmin, deleteUser);

// Update user role (admin only)
router.put('/:userId/role', verifyToken, isAdmin, updateUserRole);

// Update user status (admin only)
router.put('/:userId/status', verifyToken, isAdmin, updateUserStatus);

// Change password (user own account or admin)
router.put('/:userId/change-password', verifyToken, changePassword);

module.exports = router;
