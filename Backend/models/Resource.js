const mongoose = require('mongoose');

/**
 * Schema for individual videos within a playlist
 */
const VideoSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  url: { type: String, required: true },
  thumbnail: { type: String },
  duration: { type: String },
  publish_date: { type: String },
  views: { type: Number },
  likes: { type: Number },
  views_formatted: { type: String },
  likes_formatted: { type: String },
  channel: { 
    type: mongoose.Schema.Types.Mixed, // Changed from String to Mixed to accept both string and object
    get: function(data) {
      // If it's an object with a name property, return the name
      if (data && typeof data === 'object' && data.name) {
        return data.name;
      }
      // Otherwise return as is
      return data;
    }
  }
}, { _id: false });

/**
 * Schema for YouTube resources (videos or playlists)
 * Resources can be shared (applicable to multiple technologies)
 * or individual (specific to one technology)
 */
const ResourceSchema = new mongoose.Schema({
  url: { 
    type: String, 
    required: true, 
    unique: true 
  },
  title: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String 
  },
  type: { 
    type: String, 
    enum: ['video', 'playlist'], 
    required: true 
  },
  // For shared resources (applicable to multiple technologies)
  technologies: [{ 
    type: String 
  }],
  // For individual resources (specific to one technology)
  technology: { 
    type: String 
  },
  isShared: { 
    type: Boolean, 
    default: false 
  },
  // Resource metadata
  metadata: {
    channelName: { 
      type: mongoose.Schema.Types.Mixed, // Changed from String to Mixed to accept both string and object
      get: function(data) {
        // If it's an object with a name property, return the name
        if (data && typeof data === 'object' && data.name) {
          return data.name;
        }
        // Otherwise return as is
        return data;
      }
    },
    channelUrl: { type: String },
    videoCount: { type: Number },
    viewCount: { type: Number },
    viewCount_formatted: { type: String },
    rating: { type: Number },
    quality: { type: String },
    thumbnail: { type: String }
  },
  // For playlists, store all videos
  videos: [VideoSchema],
  // Cache management
  expiresAt: { 
    type: Date, 
    required: true,
    default: function() {
      // Set default expiration to 7 days from now
      const date = new Date();
      date.setDate(date.getDate() + 7);
      return date;
    }
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Index for efficient querying by technology and expiration
ResourceSchema.index({ technologies: 1, expiresAt: 1 });
ResourceSchema.index({ technology: 1, expiresAt: 1 });
ResourceSchema.index({ isShared: 1 });
ResourceSchema.index({ url: 1 }, { unique: true });

// Set the updatedAt field on save
ResourceSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Create the model
const Resource = mongoose.model('Resource', ResourceSchema);

module.exports = Resource; 