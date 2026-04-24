// agap-backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const {
  registerUser,
  verifyEmail,
  resendVerificationCode,
  loginUser,
  googleAuth,
  forgotPassword,
  resetPassword,
  changePassword,
  deleteAccount,  // ← ADD THIS IMPORT
  getMe,
  updateDetails,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.post('/register', registerUser);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerificationCode);
router.post('/login', loginUser);
router.post('/google', googleAuth);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected routes (require authentication)
router.get('/me', protect, getMe);
router.put('/updatedetails', protect, updateDetails);
router.put('/changepassword', protect, changePassword);
router.delete('/delete-account', protect, deleteAccount);  // ← ADD THIS ROUTE

module.exports = router;
