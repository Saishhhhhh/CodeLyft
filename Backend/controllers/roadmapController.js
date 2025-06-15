const Roadmap = require('../models/Roadmap');

// Get all roadmaps for a user
exports.getUserRoadmaps = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find all roadmaps created by the user
    const roadmaps = await Roadmap.find({ userId }).sort({ createdAt: -1 });
    
    return res.status(200).json({
      success: true,
      count: roadmaps.length,
      data: roadmaps
    });
  } catch (error) {
    console.error('Error fetching user roadmaps:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get a single roadmap with topics
exports.getRoadmap = async (req, res) => {
  try {
    const roadmapId = req.params.id;
    const userId = req.user.id;

    // Find the roadmap
    const roadmap = await Roadmap.findById(roadmapId);
    
    if (!roadmap) {
      return res.status(404).json({
        success: false,
        message: 'Roadmap not found'
      });
    }

    // Check if user owns this roadmap or if it's public
    if (roadmap.userId.toString() !== userId && !roadmap.isPublic) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this roadmap'
      });
    }

    return res.status(200).json({
      success: true,
      data: roadmap
    });
  } catch (error) {
    console.error('Error fetching roadmap:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Create a new roadmap
exports.createRoadmap = async (req, res) => {
  try {
    const { title, description, category, difficulty, topics, advancedTopics, projects, isCustom } = req.body;
    
    if (!title || !description || !category || !difficulty) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Format topics with proper order if provided
    const formattedTopics = topics && Array.isArray(topics) 
      ? topics.map((topic, index) => {
          const resources = topic.resources || [];
          return {
            ...topic,
            order: topic.order || index + 1,
            progress: topic.progress || 'not-started',
            // Preserve hasGeneratedResources and resources if they exist
            hasGeneratedResources: topic.hasGeneratedResources || false,
            resources: resources,
            // Set totalResources based on the number of resources
            totalResources: resources.length,
            completedResources: 0,
            completedResourceIds: []
          };
        })
      : [];

    // Format advanced topics if provided
    const formattedAdvancedTopics = advancedTopics && Array.isArray(advancedTopics)
      ? advancedTopics.map(topic => ({
          title: topic.title,
          description: topic.description || 'No description provided'
        }))
      : [];

    // Format projects if provided
    const formattedProjects = projects && Array.isArray(projects)
      ? projects.map(project => ({
          title: project.title,
          description: project.description || 'No description provided',
          difficulty: project.difficulty?.toLowerCase() || 'intermediate'
        }))
      : [];

    // Create the roadmap
    const roadmap = await Roadmap.create({
      userId: req.user.id,
      title,
      description,
      category,
      difficulty,
      isPublic: false,
      isCustom: isCustom || false,
      topics: formattedTopics,
      advancedTopics: formattedAdvancedTopics,
      projects: formattedProjects
    });

    return res.status(201).json({
      success: true,
      data: roadmap
    });
  } catch (error) {
    console.error('Error creating roadmap:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Update roadmap
exports.updateRoadmap = async (req, res) => {
  try {
    const roadmapId = req.params.id;
    const userId = req.user.id;
    const { title, description, category, difficulty, isPublic, advancedTopics, projects, isCustom } = req.body;

    // Find the roadmap
    let roadmap = await Roadmap.findById(roadmapId);
    
    if (!roadmap) {
      return res.status(404).json({
        success: false,
        message: 'Roadmap not found'
      });
    }

    // Check if user owns this roadmap
    if (roadmap.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this roadmap'
      });
    }

    // Format advanced topics if provided
    const formattedAdvancedTopics = advancedTopics && Array.isArray(advancedTopics)
      ? advancedTopics.map(topic => ({
          title: topic.title,
          description: topic.description || 'No description provided'
        }))
      : roadmap.advancedTopics; // keep existing if not provided

    // Format projects if provided
    const formattedProjects = projects && Array.isArray(projects)
      ? projects.map(project => ({
          title: project.title,
          description: project.description || 'No description provided',
          difficulty: project.difficulty?.toLowerCase() || 'intermediate'
        }))
      : roadmap.projects; // keep existing if not provided

    // Update the roadmap
    roadmap = await Roadmap.findByIdAndUpdate(
      roadmapId,
      { 
        title, 
        description, 
        category, 
        difficulty, 
        isPublic,
        isCustom: typeof isCustom !== 'undefined' ? isCustom : roadmap.isCustom, // Preserve isCustom flag
        advancedTopics: formattedAdvancedTopics,
        projects: formattedProjects
      },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      data: roadmap
    });
  } catch (error) {
    console.error('Error updating roadmap:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Delete roadmap
exports.deleteRoadmap = async (req, res) => {
  try {
    const roadmapId = req.params.id;
    const userId = req.user.id;

    // Find the roadmap
    const roadmap = await Roadmap.findById(roadmapId);
    
    if (!roadmap) {
      return res.status(404).json({
        success: false,
        message: 'Roadmap not found'
      });
    }

    // Check if user owns this roadmap
    if (roadmap.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this roadmap'
      });
    }

    // Delete the roadmap
    await Roadmap.findByIdAndDelete(roadmapId);

    return res.status(200).json({
      success: true,
      message: 'Roadmap deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting roadmap:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Add a topic to a roadmap
exports.addTopic = async (req, res) => {
  try {
    const roadmapId = req.params.id;
    const userId = req.user.id;
    const { title, description } = req.body;
    
    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }
    
    // Find the roadmap
    const roadmap = await Roadmap.findById(roadmapId);
    
    if (!roadmap) {
      return res.status(404).json({
        success: false,
        message: 'Roadmap not found'
      });
    }
    
    // Check if user owns this roadmap
    if (roadmap.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to add topics to this roadmap'
      });
    }
    
    // Create new topic
    const newTopic = {
      title,
      description,
      order: roadmap.topics.length + 1,
      progress: 'not-started',
      hasGeneratedResources: false,
      resources: []
    };
    
    // Add topic to roadmap
    roadmap.topics.push(newTopic);
    await roadmap.save();
    
    return res.status(201).json({
      success: true,
      data: roadmap
    });
  } catch (error) {
    console.error('Error adding topic:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Update topic progress
exports.updateTopicProgress = async (req, res) => {
  try {
    const roadmapId = req.params.id;
    const topicId = req.params.topicId;
    const userId = req.user.id;
    const { resourceId, isCompleted } = req.body;
    
    console.log(`Updating progress: roadmap=${roadmapId}, topic=${topicId}, resource=${resourceId}, completed=${isCompleted}`);
    
    if (!resourceId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a resourceId'
      });
    }
    
    // Find the roadmap
    const roadmap = await Roadmap.findById(roadmapId);
    
    if (!roadmap) {
      console.error(`Roadmap not found: ${roadmapId}`);
      return res.status(404).json({
        success: false,
        message: 'Roadmap not found'
      });
    }
    
    // Check if user owns this roadmap
    if (roadmap.userId.toString() !== userId) {
      console.error(`User ${userId} not authorized for roadmap ${roadmapId}`);
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update progress for this topic'
      });
    }
    
    // Find the topic
    const topic = roadmap.topics.id(topicId);
    
    if (!topic) {
      console.error(`Topic not found: ${topicId} in roadmap ${roadmapId}`);
      console.log('Available topics:', roadmap.topics.map(t => `${t.title} (${t._id})`));
      return res.status(404).json({
        success: false,
        message: 'Topic not found'
      });
    }
    
    console.log(`Found topic: ${topic.title} (${topic._id})`);
    
    // Ensure completedResourceIds array exists
    if (!topic.completedResourceIds) {
      topic.completedResourceIds = [];
    }
    
    // Convert resourceId to string to ensure consistent comparison
    const resourceIdStr = resourceId.toString();
    
    // Update the completedResourceIds array based on completion status
    if (isCompleted) {
      // Add resourceId to completedResourceIds if not already there
      const exists = topic.completedResourceIds.some(id => id.toString() === resourceIdStr);
      if (!exists) {
        topic.completedResourceIds.push(resourceIdStr);
        topic.completedResources += 1;
        console.log(`Added resource ${resourceIdStr} to completed list`);
      } else {
        console.log(`Resource ${resourceIdStr} already in completed list`);
      }
    } else {
      // Remove resourceId from completedResourceIds if it exists
      const index = topic.completedResourceIds.findIndex(id => id.toString() === resourceIdStr);
      if (index !== -1) {
        topic.completedResourceIds.splice(index, 1);
        topic.completedResources = Math.max(0, topic.completedResources - 1);
        console.log(`Removed resource ${resourceIdStr} from completed list`);
      } else {
        console.log(`Resource ${resourceIdStr} not found in completed list`);
      }
    }
    
    // Make sure totalResources is properly set
    if (topic.totalResources === 0 && topic.resources && topic.resources.length > 0) {
      topic.totalResources = topic.resources.length;
      console.log(`Updated totalResources to ${topic.totalResources}`);
    }
    
    // Update completion percentage
    roadmap.updateCompletionPercentage();
    
    await roadmap.save();
    console.log(`Saved roadmap progress: ${topic.completedResources}/${topic.totalResources}`);
    
    return res.status(200).json({
      success: true,
      data: {
        topic: {
          _id: topic._id,
          completedResources: topic.completedResources,
          totalResources: topic.totalResources,
          completedResourceIds: topic.completedResourceIds
        }
      }
    });
  } catch (error) {
    console.error('Error updating topic progress:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Generate resources for a topic
exports.generateTopicResources = async (req, res) => {
  try {
    const { id, topicId } = req.params;
    const userId = req.user.id;

    // Find the roadmap
    const roadmap = await Roadmap.findOne({
      _id: id,
      userId
    });
    
    if (!roadmap) {
      return res.status(404).json({
        success: false,
        message: 'Roadmap not found'
      });
    }

    // Find the topic
    const topic = roadmap.topics.id(topicId);
    
    if (!topic) {
      return res.status(404).json({
        success: false,
        message: 'Topic not found'
      });
    }
    
    // TODO: Here you would integrate with your YouTube API to generate resources
    // For now, let's create some placeholder resources
    
    // Mock resource generation results
    const resourcesData = [
      {
        type: 'video',
        title: `Learn ${topic.title} - Part 1`,
        description: `Introduction to ${topic.title}`,
        url: 'https://www.youtube.com/watch?v=example1',
        thumbnailUrl: 'https://example.com/thumbnail1.jpg',
        source: 'YouTube',
        duration: 1200,
        isRequired: true
      },
      {
        type: 'video',
        title: `Learn ${topic.title} - Part 2`,
        description: `Advanced ${topic.title} concepts`,
        url: 'https://www.youtube.com/watch?v=example2',
        thumbnailUrl: 'https://example.com/thumbnail2.jpg',
        source: 'YouTube',
        duration: 1500,
        isRequired: false
      }
    ];
    
    // Add resources to the topic
    topic.resources = resourcesData;
    topic.hasGeneratedResources = true;
    
    // Set totalResources based on the number of resources
    topic.totalResources = resourcesData.length;
    
    await roadmap.save();
    
    return res.status(200).json({
      success: true,
      message: 'Resources generated successfully',
      data: {
        topic
      }
    });
  } catch (error) {
    console.error('Error generating resources:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Migration function to update existing roadmaps to the new progress format
exports.migrateRoadmapProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find all roadmaps for this user
    const roadmaps = await Roadmap.find({ userId });
    
    let migratedCount = 0;
    
    for (const roadmap of roadmaps) {
      let updated = false;
      
      // Update each topic
      for (const topic of roadmap.topics) {
        // Initialize totalResources if not set
        if (topic.totalResources === 0 && topic.resources && topic.resources.length > 0) {
          topic.totalResources = topic.resources.length;
          updated = true;
        }
        
        // Migrate progress from old format to new format
        if (topic.progress && !topic.completedResourceIds) {
          topic.completedResourceIds = [];
          
          if (topic.progress === 'completed' && topic.resources && topic.resources.length > 0) {
            // If topic was marked as completed, mark all resources as completed
            topic.completedResources = topic.resources.length;
            topic.resources.forEach(resource => {
              const resourceId = resource._id.toString();
              topic.completedResourceIds.push(resourceId);
            });
          } else if (topic.progress === 'in-progress' && topic.resources && topic.resources.length > 0) {
            // If topic was in-progress, mark the first resource as completed
            topic.completedResources = 1;
            topic.completedResourceIds.push(topic.resources[0]._id.toString());
          } else {
            // Not started
            topic.completedResources = 0;
          }
          
          updated = true;
        }
      }
      
      if (updated) {
        // Update completion percentage
        roadmap.updateCompletionPercentage();
        await roadmap.save();
        migratedCount++;
      }
    }
    
    return res.status(200).json({
      success: true,
      message: `Migration completed. Updated ${migratedCount} roadmaps.`
    });
  } catch (error) {
    console.error('Error migrating roadmap progress:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during migration'
    });
  }
};

// Update roadmap progress
exports.updateRoadmapProgress = async (req, res) => {
  try {
    const { roadmapId } = req.params;
    const { topicId, completedResources, totalResources, completedResourceIds } = req.body;
    const userId = req.user.id;

    console.log(`Updating roadmap progress: roadmap=${roadmapId}, topic=${topicId}, completed=${completedResources}/${totalResources}`);
    console.log('Completed resource IDs:', completedResourceIds);

    // Validate input
    if (!roadmapId || !topicId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Roadmap ID and Topic ID are required' 
      });
    }

    // Find the roadmap and ensure it belongs to the user
    const roadmap = await Roadmap.findOne({ 
      _id: roadmapId,
      userId: userId
    });

    if (!roadmap) {
      return res.status(404).json({ 
        success: false, 
        message: 'Roadmap not found or you do not have permission to update it' 
      });
    }

    // Find the topic in the roadmap
    const topicIndex = roadmap.topics.findIndex(
      topic => topic._id.toString() === topicId
    );

    if (topicIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        message: 'Topic not found in this roadmap' 
      });
    }

    // Update the topic's progress
    roadmap.topics[topicIndex].completedResources = completedResources;
    roadmap.topics[topicIndex].totalResources = totalResources || roadmap.topics[topicIndex].resources.length;
    roadmap.topics[topicIndex].completedResourceIds = completedResourceIds || [];

    // Check for shared resources across topics
    if (completedResourceIds && completedResourceIds.length > 0) {
      // Create a map of resource URLs to their IDs for quick lookup
      const resourceUrlMap = new Map();
      
      // First, build a map of all resources across all topics
      roadmap.topics.forEach(topic => {
        if (topic.resources && topic.resources.length > 0) {
          topic.resources.forEach(resource => {
            if (resource.url) {
              if (!resourceUrlMap.has(resource.url)) {
                resourceUrlMap.set(resource.url, []);
              }
              resourceUrlMap.get(resource.url).push({
                topicId: topic._id.toString(),
                resourceId: resource._id.toString()
              });
            }
          });
        }
      });
      
      // Now check if any completed resources are shared with other topics
      completedResourceIds.forEach(resourceId => {
        // Find the resource in the current topic
        const resource = roadmap.topics[topicIndex].resources.find(
          r => r._id.toString() === resourceId
        );
        
        if (resource && resource.url) {
          const sharedResources = resourceUrlMap.get(resource.url) || [];
          
          // Update all topics that share this resource
          sharedResources.forEach(shared => {
            // Skip the current topic as it's already updated
            if (shared.topicId !== topicId) {
              const otherTopicIndex = roadmap.topics.findIndex(
                t => t._id.toString() === shared.topicId
              );
              
              if (otherTopicIndex !== -1) {
                // Add the shared resource ID to the completedResourceIds if not already there
                if (!roadmap.topics[otherTopicIndex].completedResourceIds) {
                  roadmap.topics[otherTopicIndex].completedResourceIds = [];
                }
                
                if (!roadmap.topics[otherTopicIndex].completedResourceIds.includes(shared.resourceId)) {
                  roadmap.topics[otherTopicIndex].completedResourceIds.push(shared.resourceId);
                  
                  // Update the completedResources count
                  roadmap.topics[otherTopicIndex].completedResources = 
                    (roadmap.topics[otherTopicIndex].completedResources || 0) + 1;
                    
                  console.log(`Updated shared resource in topic ${roadmap.topics[otherTopicIndex].title}`);
                }
              }
            }
          });
        }
      });
    }

    // Calculate overall roadmap completion percentage
    let totalTopicResources = 0;
    let totalCompletedResources = 0;

    roadmap.topics.forEach(topic => {
      // Use the new totalResources field if available, otherwise count resources
      const topicTotalResources = topic.totalResources || (topic.resources ? topic.resources.length : 0);
      totalTopicResources += topicTotalResources;
      totalCompletedResources += topic.completedResources || 0;
    });

    // Update the overall completion percentage
    if (totalTopicResources > 0) {
      roadmap.completionPercentage = Math.round((totalCompletedResources / totalTopicResources) * 100);
    } else {
      roadmap.completionPercentage = 0;
    }

    // Save the updated roadmap
    await roadmap.save();

    return res.status(200).json({
      success: true,
      message: 'Progress updated successfully',
      completionPercentage: roadmap.completionPercentage
    });
  } catch (error) {
    console.error('Error updating roadmap progress:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to update progress', 
      error: error.message 
    });
  }
};
