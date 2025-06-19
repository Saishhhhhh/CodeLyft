const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// Don't suppress console.log in production for debugging
// if (process.env.NODE_ENV === 'production') {
//   console.log = () => {};
// }

const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('./config/passport');
const connectDB = require('./config/db');

// Import routes
const authRoutes = require('./routes/authRoutes');
const passwordRoutes = require('./routes/passwordRoutes');
const roadmapRoutes = require('./routes/roadmapRoutes');
const noteRoutes = require('./routes/noteRoutes');
const resourceRoutes = require('./routes/resourceRoutes');
const customRoadmapRoutes = require('./routes/customRoadmapRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

console.log('Starting server with environment:', process.env.NODE_ENV || 'development');
console.log('Port:', PORT);

// Connect to MongoDB with error handling
connectDB().catch(err => {
  console.error('Failed to connect to MongoDB:', err);
  process.exit(1);
});

// Enable CORS for all routes
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL, 'https://codelyft.vercel.app']
    : ['http://localhost:5173', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true // Allow cookies to be sent with requests
}));

// Apply middleware
app.use(express.json());
app.use(cookieParser());

// Serve static files from the 'public' directory
app.use('/public', express.static(path.join(__dirname, 'public')));

// Configure session with error handling
try {
  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'your-session-secret-key',
      resave: false,
      saveUninitialized: true,
      store: MongoStore.create({
        mongoUrl: process.env.MONGO_URI || 'mongodb://localhost:27017/muftcode',
        collectionName: 'sessions',
        ttl: 24 * 60 * 60, // 1 day in seconds
        autoRemove: 'native',
        touchAfter: 24 * 3600 // time period in seconds
      }),
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 1 day
        sameSite: 'lax'
      }
    })
  );
  console.log('Session middleware configured successfully');
} catch (error) {
  console.error('Error configuring session:', error);
}

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/password', passwordRoutes);
app.use('/api', roadmapRoutes);
app.use('/api', noteRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/custom-roadmaps', customRoadmapRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root route for basic connectivity test
app.get('/', (req, res) => {
  res.status(200).json({ 
    message: 'CodeLyft Backend API',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error occurred:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// Start server with proper error handling
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});

// Handle server errors
server.on('error', (error) => {
  console.error('Server error:', error);
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`);
  }
  process.exit(1);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
}); 