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
    const { title, description, category, difficulty, topics, advancedTopics, projects } = req.body;
    
    if (!title || !description || !category || !difficulty) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Format topics with proper order if provided
    const formattedTopics = topics && Array.isArray(topics) 
      ? topics.map((topic, index) => ({
          ...topic,
          order: topic.order || index + 1,
          progress: topic.progress || 'not-started',
          // Preserve hasGeneratedResources and resources if they exist
          hasGeneratedResources: topic.hasGeneratedResources || false,
          resources: topic.resources || []
        }))
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
    const { title, description, category, difficulty, isPublic, advancedTopics, projects } = req.body;

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
    const { status } = req.body;
    
    if (!status || !['not-started', 'in-progress', 'completed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid status'
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
        message: 'Not authorized to update progress for this topic'
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
    
    // Update progress
    topic.progress = status;
    
    // Update completion percentage
    roadmap.updateCompletionPercentage();
    
    await roadmap.save();
    
    return res.status(200).json({
      success: true,
      data: {
        roadmap,
        topic
      }
    });
  } catch (error) {
    console.error('Error updating topic progress:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Generate resources for a topic
exports.generateTopicResources = async (req, res) => {
  try {
    const roadmapId = req.params.id;
    const topicId = req.params.topicId;
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
        message: 'Not authorized to generate resources for this topic'
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
    
    // Check if resources already generated
    if (topic.hasGeneratedResources) {
      return res.status(400).json({
        success: false,
        message: 'Resources already generated for this topic'
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
