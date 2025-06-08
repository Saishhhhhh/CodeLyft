const mongoose = require('mongoose');

const ResourceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  url: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['video', 'playlist', 'article'],
    default: 'video'
  },
  description: {
    type: String,
    default: ''
  },
  thumbnailUrl: {
    type: String,
    default: ''
  },
  source: {
    type: String,
    default: 'YouTube'
  },
  duration: {
    type: Number,
    default: 0
  },
  isRequired: {
    type: Boolean,
    default: true
  }
});

const TopicSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  order: {
    type: Number,
    required: true
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'intermediate'
  },
  progress: {
    type: String,
    enum: ['not-started', 'in-progress', 'completed'],
    default: 'not-started'
  },
  hasGeneratedResources: {
    type: Boolean,
    default: false
  },
  resources: [ResourceSchema]
});

const AdvancedTopicSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  }
});

const ProjectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'intermediate'
  }
});

const RoadmapSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  difficulty: {
    type: String,
    required: true,
    enum: ['Beginner', 'Intermediate', 'Advanced']
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  completionPercentage: {
    type: Number,
    default: 0
  },
  topics: [TopicSchema],
  advancedTopics: [AdvancedTopicSchema],
  projects: [ProjectSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Method to calculate completion percentage
RoadmapSchema.methods.updateCompletionPercentage = function() {
  if (this.topics.length === 0) return 0;
  
  const completed = this.topics.filter(topic => topic.progress === 'completed').length;
  this.completionPercentage = Math.round((completed / this.topics.length) * 100);
  return this.completionPercentage;
};

module.exports = mongoose.model('RoadmapSimplified', RoadmapSchema); 