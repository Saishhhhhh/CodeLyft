const express = require('express');
const router = express.Router();
const passport = require('passport');
const { 
  register, 
  login, 
  getMe, 
  logout, 
  googleCallback, 
  githubCallback 
} = require('../controllers/authController');
const { registerValidation, loginValidation } = require('../middleware/validators');
const { protect } = require('../middleware/auth');
const { isAuthenticated } = require('../middleware/authMiddleware');

// Register and login routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.get('/me', protect, getMe);
router.get('/logout', protect, logout);

// Google OAuth routes
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get(
  '/google/callback',
  passport.authenticate('google', { 
    failureRedirect: '/login'
  }),
  googleCallback
);

// GitHub OAuth routes
router.get(
  '/github',
  passport.authenticate('github', { scope: ['user:email'] })
);

router.get(
  '/github/callback',
  passport.authenticate('github', { 
    failureRedirect: '/login'
  }),
  githubCallback
);

// Add to the existing routes
router.get('/check', isAuthenticated, (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'User is authenticated',
    user: req.user
  });
});

module.exports = router; 