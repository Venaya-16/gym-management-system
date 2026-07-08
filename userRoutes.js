const express = require('express');
const router = express.Router();
const { protect, allowRoles } = require('../middleware/auth');
const {
  getMe,
  listUsers,
  adminUpdateUser,
  changeMyPassword,
  adminResetPassword
} = require('../controllers/userController');

router.get('/me', protect, getMe);
router.put('/me/password', protect, changeMyPassword);

router.get('/', protect, allowRoles('admin'), listUsers);
router.put('/:id', protect, allowRoles('admin'), adminUpdateUser);
router.post('/:id/reset-password', protect, allowRoles('admin'), adminResetPassword);

module.exports = router;

