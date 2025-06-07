const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { sendEmail } = require('../config/email');
const { welcomeEmailTemplate, emailVerificationTemplate } = require('../utils/emailTemplates');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
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

    const { name, email, password } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ 
        success: false, 
        message: 'User already exists with this email' 
      });
    }

    // Create new user
    user = await User.create({
      name,
      email,
      password
    });

    // Generate verification OTP
    const otp = user.getEmailVerificationOTP();
    await user.save();

    // Send welcome email
    try {
      const welcomeContent = welcomeEmailTemplate({
        name: user.name
      });

      await sendEmail({
        to: user.email,
        subject: 'Welcome to MuftCode!',
        text: welcomeContent.text,
        html: welcomeContent.html
      });
    } catch (emailError) {
      console.error('Welcome email error:', emailError);
      // Don't fail registration if email fails
    }

    // Send verification email
    try {
      const verificationContent = emailVerificationTemplate({
        name: user.name,
        otp
      });

      await sendEmail({
        to: user.email,
        subject: 'Verify Your Email Address',
        text: verificationContent.text,
        html: verificationContent.html
      });
    } catch (emailError) {
      console.error('Verification email error:', emailError);
      // Don't fail registration if email fails
    }

    // Establish session for the new user
    if (req.login) {
      req.login(user, function(err) {
        if (err) {
          console.error('Session login error:', err);
        }
      });
    }

    // Generate JWT token
    sendTokenResponse(user, 201, res);
  } catch (error) {
    console.error('Register error:', error);
    
    // Provide more detailed error message
    let errorMessage = 'Server error during registration';
    let statusCode = 500;
    
    // Handle MongoDB validation errors
    if (error.name === 'ValidationError') {
      errorMessage = Object.values(error.errors).map(val => val.message).join(', ');
      statusCode = 400;
    }
    
    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      errorMessage = 'Email already exists';
      statusCode = 400;
    }
    
    res.status(statusCode).json({ 
      success: false, 
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
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

    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Update last login time
    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false });

    // Establish session for the user
    if (req.login) {
      req.login(user, function(err) {
        if (err) {
          console.error('Session login error:', err);
        }
      });
    }

    // Generate JWT token
    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during login',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error retrieving user data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Log user out / clear cookie
// @route   GET /api/auth/logout
// @access  Private
exports.logout = (req, res) => {
  // Clear JWT cookie
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  // Clear passport session if it exists
  if (req.logout) {
    req.logout(function(err) {
      if (err) {
        console.error('Logout error:', err);
      }
    });
  }

  res.status(200).json({
    success: true,
    message: 'User logged out successfully'
  });
};

// @desc    Google OAuth callback
// @route   GET /api/auth/google/callback
// @access  Public
exports.googleCallback = (req, res) => {
  try {
    // User will be available in req.user thanks to passport
    if (!req.user) {
      throw new Error('Authentication failed');
    }

    // Create token
    const token = jwt.sign(
      { id: req.user._id },
      process.env.JWT_SECRET || 'your-jwt-secret-key',
      { expiresIn: process.env.JWT_EXPIRE || '30d' }
    );

    // Cookie options
    const cookieOptions = {
      expires: new Date(
        Date.now() + (process.env.JWT_COOKIE_EXPIRE || 30) * 24 * 60 * 60 * 1000
      ),
      httpOnly: true
    };

    // Set secure flag in production
    if (process.env.NODE_ENV === 'production') {
      cookieOptions.secure = true;
    }

    // Set the token in a cookie
    res.cookie('token', token, cookieOptions);

    // Redirect to frontend with token in URL for client-side storage
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
  } catch (error) {
    console.error('Google callback error:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/login?error=${encodeURIComponent('Authentication failed')}`);
  }
};

// @desc    GitHub OAuth callback
// @route   GET /api/auth/github/callback
// @access  Public
exports.githubCallback = (req, res) => {
  try {
    // User will be available in req.user thanks to passport
    if (!req.user) {
      throw new Error('Authentication failed');
    }

    // Create token
    const token = jwt.sign(
      { id: req.user._id },
      process.env.JWT_SECRET || 'your-jwt-secret-key',
      { expiresIn: process.env.JWT_EXPIRE || '30d' }
    );

    // Cookie options
    const cookieOptions = {
      expires: new Date(
        Date.now() + (process.env.JWT_COOKIE_EXPIRE || 30) * 24 * 60 * 60 * 1000
      ),
      httpOnly: true
    };

    // Set secure flag in production
    if (process.env.NODE_ENV === 'production') {
      cookieOptions.secure = true;
    }

    // Set the token in a cookie
    res.cookie('token', token, cookieOptions);

    // Redirect to frontend with token in URL for client-side storage
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
  } catch (error) {
    console.error('GitHub callback error:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/login?error=${encodeURIComponent('Authentication failed')}`);
  }
};

// Helper function to create and send token response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET || 'your-jwt-secret-key',
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );

  // Cookie options
  const cookieOptions = {
    expires: new Date(
      Date.now() + (process.env.JWT_COOKIE_EXPIRE || 30) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };

  // Set secure flag in production
  if (process.env.NODE_ENV === 'production') {
    cookieOptions.secure = true;
  }

  // Remove password from output
  user.password = undefined;

  res
    .status(statusCode)
    .cookie('token', token, cookieOptions)
    .json({
      success: true,
      token,
      user
    });
}; 