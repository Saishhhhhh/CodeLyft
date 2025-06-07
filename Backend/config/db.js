const mongoose = require('mongoose');

/**
 * Connect to MongoDB database
 */
const connectDB = async () => {
  try {
    // Use MongoDB Atlas or fall back to local MongoDB instance
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/muftcode');

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB; 