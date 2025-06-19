const User = require('../models/User');
const { sendEmail } = require('../config/email');
const { passwordResetTemplate, emailVerificationTemplate } = require('../utils/emailTemplates');
const { validationResult } = require('express-validator');

/**
 * @desc    Forgot password - send OTP to email
 * @route   POST /api/password/forgot
 * @access  Public
 */
exports.forgotPassword = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No user found with that email'
      });
    }

    // Generate OTP
    const otp = user.getResetPasswordOTP();
    await user.save();

    // Create email content
    const emailContent = passwordResetTemplate({
      name: user.name,
      otp
    });

    // Send email
    await sendEmail({
      to: user.email,
      subject: 'Password Reset Request',
      text: emailContent.text,
      html: emailContent.html
    });

    res.status(200).json({
      success: true,
      message: 'Password reset OTP sent to email'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending password reset email',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Verify OTP for password reset
 * @route   POST /api/password/verify-otp
 * @access  Public
 */
exports.verifyOTP = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const { email, otp } = req.body;

    // Find user by email
    const user = await User.findOne({ 
      email,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Password reset OTP is invalid or has expired'
      });
    }

    // Verify OTP
    if (!user.verifyOTP(otp, 'reset')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully'
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying OTP',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Reset password with verified OTP
 * @route   PUT /api/password/reset
 * @access  Public
 */
exports.resetPassword = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const { email, otp, password } = req.body;

    // Find user by email
    const user = await User.findOne({ 
      email,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Password reset OTP is invalid or has expired'
      });
    }

    // Verify OTP
    if (!user.verifyOTP(otp, 'reset')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    // Set new password
    user.password = password;
    
    // Clear reset password fields
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successful'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting password',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Send email verification OTP
 * @route   POST /api/password/verify-email
 * @access  Private
 */
exports.sendVerificationEmail = async (req, res) => {
  try {
    // User is available from auth middleware
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if email is already verified
    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
    }

    // Check if a valid OTP already exists (not expired)
    const now = Date.now();
    
    if (user.otpExpire && user.otpExpire > now) {
      // If user already has a valid OTP, don't send another email
      // Just return success with a message that an OTP already exists
      return res.status(200).json({
        success: true,
        message: 'A valid verification code already exists and has been sent to your email',
        alreadySent: true
      });
    }

    // Generate OTP
    const otp = user.getEmailVerificationOTP();
    await user.save();

    // Create email content
    const emailContent = emailVerificationTemplate({
      name: user.name,
      otp
    });

    // Send email
    await sendEmail({
      to: user.email,
      subject: 'Verify Your Email Address',
      text: emailContent.text,
      html: emailContent.html
    });

    res.status(200).json({
      success: true,
      message: 'Verification OTP sent to email'
    });
  } catch (error) {
    console.error('Send verification email error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending verification email',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Verify email with OTP
 * @route   POST /api/password/verify-email-otp
 * @access  Private
 */
exports.verifyEmail = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const { otp } = req.body;
    
    // User is available from auth middleware
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if email is already verified
    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
    }

    // Check if OTP exists and is not expired
    if (!user.verificationOTP || !user.otpExpire || user.otpExpire < Date.now()) {
      return res.status(400).json({
        success: false,
        message: 'Verification OTP is invalid or has expired'
      });
    }

    // Verify OTP
    if (!user.verifyOTP(otp, 'verification')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    // Mark email as verified
    user.isEmailVerified = true;
    
    // Clear verification fields
    user.verificationOTP = undefined;
    user.otpExpire = undefined;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying email',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}; 