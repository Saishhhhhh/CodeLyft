const mongoose = require('mongoose');

const NoteSchema = new mongoose.Schema({
  roadmapId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RoadmapSimplified',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  videoId: {
    type: String,
    required: true
  },
  notes: {
    type: String,
    default: ''
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Compound index to ensure uniqueness per roadmap, user and video
NoteSchema.index({ roadmapId: 1, userId: 1, videoId: 1 }, { unique: true });

module.exports = mongoose.model('Note', NoteSchema); 