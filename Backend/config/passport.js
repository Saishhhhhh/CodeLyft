const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const User = require('../models/User');
const crypto = require('crypto');
const { sendEmail } = require('./email');
const { welcomeEmailTemplate } = require('../utils/emailTemplates');

// Local Strategy
passport.use(new LocalStrategy(
  { usernameField: 'email' },
  async (email, password, done) => {
    try {
      // Find user by email
      const user = await User.findOne({ email }).select('+password');
      
      // If user doesn't exist
      if (!user) {
        return done(null, false, { message: 'Invalid email or password' });
      }
      
      // Check if password matches
      const isMatch = await user.matchPassword(password);
      
      if (!isMatch) {
        return done(null, false, { message: 'Invalid email or password' });
      }
      
      // Update last login time
      user.lastLogin = Date.now();
      await user.save({ validateBeforeSave: false });
      
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }
));

// Google OAuth Strategy
passport.use(new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID || 'your-google-client-id',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'your-google-client-secret',
    callbackURL: '/api/auth/google/callback',
    proxy: true
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user already exists
      let user = await User.findOne({ googleId: profile.id });
      
      if (user) {
        // Update last login time
        user.lastLogin = Date.now();
        await user.save({ validateBeforeSave: false });
        return done(null, user);
      }
      
      // Check if user exists with same email
      user = await User.findOne({ email: profile.emails[0].value });
      
      if (user) {
        // Link Google account to existing user
        user.googleId = profile.id;
        user.isEmailVerified = true;
        user.lastLogin = Date.now();
        await user.save({ validateBeforeSave: false });
        return done(null, user);
      }
      
      // Generate a random password for OAuth users
      const randomPassword = crypto.randomBytes(20).toString('hex');
      
      // Create new user
      user = await User.create({
        name: profile.displayName,
        email: profile.emails[0].value,
        googleId: profile.id,
        profilePicture: profile.photos[0].value,
        isEmailVerified: true,
        lastLogin: Date.now(),
        password: randomPassword // Add random password to satisfy validation
      });
      
      // Send welcome email
      try {
        const emailContent = welcomeEmailTemplate({
          name: user.name
        });

        await sendEmail({
          to: user.email,
          subject: 'Welcome to MuftCode!',
          text: emailContent.text,
          html: emailContent.html
        });
      } catch (emailError) {
        console.error('Welcome email error for Google OAuth user:', emailError);
        // Don't fail authentication if email fails
      }
      
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }
));

// GitHub OAuth Strategy
passport.use(new GitHubStrategy(
  {
    clientID: process.env.GITHUB_CLIENT_ID || 'your-github-client-id',
    clientSecret: process.env.GITHUB_CLIENT_SECRET || 'your-github-client-secret',
    callbackURL: '/api/auth/github/callback',
    scope: ['user:email']
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user already exists
      let user = await User.findOne({ githubId: profile.id });
      
      if (user) {
        // Update last login time
        user.lastLogin = Date.now();
        await user.save({ validateBeforeSave: false });
        return done(null, user);
      }
      
      // Get primary email from GitHub
      const primaryEmail = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
      
      if (primaryEmail) {
        // Check if user exists with same email
        user = await User.findOne({ email: primaryEmail });
        
        if (user) {
          // Link GitHub account to existing user
          user.githubId = profile.id;
          user.isEmailVerified = true;
          user.lastLogin = Date.now();
          await user.save({ validateBeforeSave: false });
          return done(null, user);
        }
      }
      
      // Generate a random password for OAuth users
      const randomPassword = crypto.randomBytes(20).toString('hex');
      
      // Create new user
      user = await User.create({
        name: profile.displayName || profile.username,
        email: primaryEmail || `${profile.username}@github.user`,
        githubId: profile.id,
        profilePicture: profile.photos && profile.photos[0] ? profile.photos[0].value : undefined,
        isEmailVerified: !!primaryEmail,
        lastLogin: Date.now(),
        password: randomPassword // Add random password to satisfy validation
      });
      
      // Send welcome email only if we have a valid email
      if (primaryEmail) {
        try {
          const emailContent = welcomeEmailTemplate({
            name: user.name
          });

          await sendEmail({
            to: primaryEmail,
            subject: 'Welcome to MuftCode!',
            text: emailContent.text,
            html: emailContent.html
          });
        } catch (emailError) {
          console.error('Welcome email error for GitHub OAuth user:', emailError);
          // Don't fail authentication if email fails
        }
      }
      
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }
));

// Serialize user into the session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from the session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

module.exports = passport; 