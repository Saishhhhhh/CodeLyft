const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false // Don't return password in queries by default
  },
  profilePicture: {
    type: String,
    default: 'default-avatar.png'
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  googleId: {
    type: String
  },
  githubId: {
    type: String
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  // OTP for verification
  verificationOTP: String,
  otpExpire: Date,
  // Email verification token
  emailVerificationToken: String,
  emailTokenExpire: Date
}, {
  timestamps: true
});

// Encrypt password using bcrypt
UserSchema.pre('save', async function(next) {
  // Only run this if password was modified
  if (!this.isModified('password')) {
    return next();
  }

  // Hash the password
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash OTP
UserSchema.methods.getResetPasswordOTP = function() {
  // Generate OTP - 4 digit number
  const otp = Math.floor(1000 + Math.random() * 9000).toString();
  
  // Hash OTP and set to resetPasswordToken
  this.resetPasswordToken = bcrypt.hashSync(otp, 10);
  
  // Set expire - 10 minutes
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
  
  return otp;
};

// Generate email verification OTP
UserSchema.methods.getEmailVerificationOTP = function() {
  // Generate OTP - 4 digit number
  const otp = Math.floor(1000 + Math.random() * 9000).toString();
  
  // Hash OTP and set to verificationOTP
  this.verificationOTP = bcrypt.hashSync(otp, 10);
  
  // Set expire - 10 minutes
  this.otpExpire = Date.now() + 10 * 60 * 1000;
  
  return otp;
};

// Verify OTP
UserSchema.methods.verifyOTP = function(enteredOTP, type = 'reset') {
  const hashedOTP = type === 'reset' ? this.resetPasswordToken : this.verificationOTP;
  const expireTime = type === 'reset' ? this.resetPasswordExpire : this.otpExpire;
  
  // Check if OTP is valid and not expired
  if (!hashedOTP || !expireTime || expireTime < Date.now()) {
    return false;
  }
  
  // Compare OTP
  return bcrypt.compareSync(enteredOTP, hashedOTP);
};

module.exports = mongoose.model('User', UserSchema); 