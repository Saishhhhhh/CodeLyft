const mongoose = require('mongoose');

// Define the schema for YouTube resources
const resourceSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['video', 'playlist'],
    required: true
  },
  youtubeId: {
    type: String,
    required: true
  },
  author: {
    type: String
  }
}, { _id: false });

// Define the schema for topics
const topicSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  // Resources removed - will be added via YouTube finder
  // This keeps the video field format consistent with AI-generated roadmaps
}, { _id: false });

// Define the custom roadmap schema
const customRoadmapSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  isCustom: {
    type: Boolean,
    default: true // Always true for custom roadmaps
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  topics: [topicSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  clientId: {
    type: String,
    required: true
  }
});

// Create a text index for searching
customRoadmapSchema.index({ name: 'text', description: 'text' });

// Update timestamp before saving
customRoadmapSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const CustomRoadmap = mongoose.model('CustomRoadmap', customRoadmapSchema);

module.exports = CustomRoadmap; 