const express = require('express');
const router = express.Router();
const { getRiskPrediction, getRiskHistory } = require('../controllers/riskController');
const {
  registerUser,
  verifyEmail,
  resendVerificationCode,
  loginUser,
  googleAuth,
  forgotPassword,
  resetPassword,
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
router.post('/google', googleAuth);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Private routes (require authentication)
router.get('/me', protect, getMe);
router.put('/updatedetails', protect, updateDetails);
router.put('/changepassword', protect, changePassword);
router.get('/predict', getRiskPrediction);
router.get('/history', getRiskHistory);

module.exports = router;
