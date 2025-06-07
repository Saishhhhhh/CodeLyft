const express = require('express');
const router = express.Router();
const {
  forgotPassword,
  verifyOTP,
  resetPassword,
  sendVerificationEmail,
  verifyEmail
} = require('../controllers/passwordController');
const {
  forgotPasswordValidation,
  verifyOTPValidation,
  resetPasswordValidation,
  verifyEmailOTPValidation
} = require('../middleware/validators');
const { protect } = require('../middleware/auth');

// Public routes for password reset
router.post('/forgot', forgotPasswordValidation, forgotPassword);
router.post('/verify-otp', verifyOTPValidation, verifyOTP);
router.put('/reset', resetPasswordValidation, resetPassword);

// Protected routes for email verification
router.post('/verify-email', protect, sendVerificationEmail);
router.post('/verify-email-otp', protect, verifyEmailOTPValidation, verifyEmail);

module.exports = router; 