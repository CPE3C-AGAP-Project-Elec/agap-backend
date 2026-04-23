const express = require('express');
const router = express.Router();
const {
  registerUser,
  verifyEmail,
  resendVerificationCode,
  loginUser,
  googleAuth,
  getMe,
  updateDetails,
  changePassword,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.post('/register', registerUser);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerificationCode);
router.post('/login', loginUser);
router.post('/google', googleAuth);  // Make sure googleAuth is defined

// Private routes
router.get('/me', protect, getMe);
router.put('/updatedetails', protect, updateDetails);
router.put('/changepassword', protect, changePassword);

module.exports = router;
