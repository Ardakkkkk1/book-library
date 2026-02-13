const express = require('express');
const {
  register,
  login,
  logout,
  me,
  listUsers
} = require('../controllers/authController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', me);
router.get('/users', requireAuth, requireRole('admin'), listUsers);

module.exports = router;
