/**
 * Script to update totalResources for all existing roadmaps
 * Run with: node scripts/updateTotalResources.js
 */

const mongoose = require('mongoose');
const Roadmap = require('../models/Roadmap');

// Get MongoDB URI from environment or use default
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/muftcode';

// Connect to MongoDB
mongoose.connect(mongoURI)
  .then(() => console.log('MongoDB connected for updating totalResources'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

async function updateTotalResources() {
  try {
    console.log('Starting update of totalResources for all roadmaps...');
    
    // Get all roadmaps
    const roadmaps = await Roadmap.find({});
    console.log(`Found ${roadmaps.length} roadmaps to update`);
    
    let updatedCount = 0;
    
    // Process each roadmap
    for (const roadmap of roadmaps) {
      let roadmapUpdated = false;
      
      // Update topics
      if (roadmap.topics && roadmap.topics.length > 0) {
        roadmap.topics.forEach(topic => {
          if (topic.resources && topic.resources.length > 0) {
            if (!topic.totalResources || topic.totalResources === 0) {
              topic.totalResources = topic.resources.length;
              roadmapUpdated = true;
              console.log(`Roadmap ${roadmap._id}: Updated topic ${topic.title} with ${topic.totalResources} resources`);
            }
          }
        });
      }
      
      // Update advanced topics
      if (roadmap.advancedTopics && roadmap.advancedTopics.length > 0) {
        roadmap.advancedTopics.forEach(topic => {
          if (topic.resources && topic.resources.length > 0) {
            if (!topic.totalResources || topic.totalResources === 0) {
              topic.totalResources = topic.resources.length;
              roadmapUpdated = true;
              console.log(`Roadmap ${roadmap._id}: Updated advanced topic ${topic.title} with ${topic.totalResources} resources`);
            }
          }
        });
      }
      
      // Save if updated
      if (roadmapUpdated) {
        await roadmap.save();
        updatedCount++;
      }
    }
    
    console.log(`Update completed. Updated ${updatedCount} roadmaps.`);
    
  } catch (error) {
    console.error('Error updating totalResources:', error);
  } finally {
    // Close the MongoDB connection
    mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the update function
updateTotalResources(); 