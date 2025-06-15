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
    enum: ['video', 'article', 'course', 'book', 'documentation', 'other'],
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
    type: mongoose.Schema.Types.Mixed,
    get: function(data) {
      // If it's an object with a name property, return just the name
      if (data && typeof data === 'object' && data.name) {
        return data.name;
      }
      return data || '';
    },
    set: function(data) {
      // If it's an object with a name property, store the whole object
      if (data && typeof data === 'object' && data.name) {
        return data;
      }
      return data || '';
    }
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
    default: ''
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
  completedResources: {
    type: Number,
    default: 0
  },
  totalResources: {
    type: Number,
    default: 0
  },
  hasGeneratedResources: {
    type: Boolean,
    default: false
  },
  completedResourceIds: {
    type: [String],
    default: []
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
    default: ''  // Changed from required to default empty string
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
    default: ''  // Changed from required to default empty string
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
    default: ''  // Changed from required to default empty string
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
  isCustom: {
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

// Method to calculate completion percentage based on numerical progress
RoadmapSchema.methods.updateCompletionPercentage = function() {
  if (this.topics.length === 0) return 0;
  
  let totalCompleted = 0;
  let totalResources = 0;
  
  this.topics.forEach(topic => {
    totalCompleted += topic.completedResources;
    totalResources += topic.totalResources;
  });
  
  this.completionPercentage = totalResources > 0 ? Math.round((totalCompleted / totalResources) * 100) : 0;
  return this.completionPercentage;
};

// Pre-save middleware to update totalResources based on resources length
RoadmapSchema.pre('save', function(next) {
  // Update totalResources for each topic if not already set
  if (this.topics && this.topics.length > 0) {
    this.topics.forEach(topic => {
      if (topic.resources && topic.resources.length > 0) {
        // Only update if totalResources is 0 or not set
        if (!topic.totalResources || topic.totalResources === 0) {
          topic.totalResources = topic.resources.length;
          console.log(`Updated totalResources for topic ${topic.title}: ${topic.totalResources}`);
        }
      }
    });
  }
  
  // Same for advanced topics
  if (this.advancedTopics && this.advancedTopics.length > 0) {
    this.advancedTopics.forEach(topic => {
      if (topic.resources && topic.resources.length > 0) {
        if (!topic.totalResources || topic.totalResources === 0) {
          topic.totalResources = topic.resources.length;
        }
      }
    });
  }
  
  next();
});

module.exports = mongoose.model('RoadmapSimplified', RoadmapSchema); 