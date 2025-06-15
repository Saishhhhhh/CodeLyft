const CustomRoadmap = require('../models/CustomRoadmap');

/**
 * Get all custom roadmaps for a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with custom roadmaps or error
 */
exports.getUserCustomRoadmaps = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const customRoadmaps = await CustomRoadmap.find({ userId })
      .sort({ updatedAt: -1 });
    
    return res.status(200).json({
      success: true,
      data: customRoadmaps
    });
  } catch (error) {
    console.error('Error fetching custom roadmaps:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve custom roadmaps',
      error: error.message
    });
  }
};

/**
 * Get a specific custom roadmap by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with the custom roadmap or error
 */
exports.getCustomRoadmap = async (req, res) => {
  try {
    const roadmapId = req.params.id;
    const userId = req.user._id;
    
    const customRoadmap = await CustomRoadmap.findOne({
      _id: roadmapId,
      userId
    });
    
    if (!customRoadmap) {
      return res.status(404).json({
        success: false,
        message: 'Custom roadmap not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: customRoadmap
    });
  } catch (error) {
    console.error('Error fetching custom roadmap:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve custom roadmap',
      error: error.message
    });
  }
};

/**
 * Create a new custom roadmap
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with the created roadmap or error
 */
exports.createCustomRoadmap = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Extract roadmap data from request body
    const { name, description, topics, id: clientId, isCustom } = req.body;
    
    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Roadmap name is required'
      });
    }
    
    if (!clientId) {
      return res.status(400).json({
        success: false,
        message: 'Client ID is required'
      });
    }
    
    // Create new custom roadmap
    const customRoadmap = new CustomRoadmap({
      name,
      description,
      userId,
      topics: topics || [],
      clientId,
      isCustom: isCustom !== undefined ? isCustom : true // Default to true if not provided
    });
    
    // Save the roadmap
    await customRoadmap.save();
    
    return res.status(201).json({
      success: true,
      message: 'Custom roadmap created successfully',
      data: customRoadmap
    });
  } catch (error) {
    console.error('Error creating custom roadmap:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Failed to create custom roadmap',
      error: error.message
    });
  }
};

/**
 * Update an existing custom roadmap
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with the updated roadmap or error
 */
exports.updateCustomRoadmap = async (req, res) => {
  try {
    const roadmapId = req.params.id;
    const userId = req.user._id;
    
    // Find the roadmap
    const customRoadmap = await CustomRoadmap.findOne({
      _id: roadmapId,
      userId
    });
    
    if (!customRoadmap) {
      return res.status(404).json({
        success: false,
        message: 'Custom roadmap not found'
      });
    }
    
    // Extract the update data
    const { name, description, topics, isCustom } = req.body;
    
    // Update the fields
    if (name) customRoadmap.name = name;
    if (description !== undefined) customRoadmap.description = description;
    if (topics) customRoadmap.topics = topics;
    if (isCustom !== undefined) customRoadmap.isCustom = isCustom;
    
    // Save the updates
    await customRoadmap.save();
    
    return res.status(200).json({
      success: true,
      message: 'Custom roadmap updated successfully',
      data: customRoadmap
    });
  } catch (error) {
    console.error('Error updating custom roadmap:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Failed to update custom roadmap',
      error: error.message
    });
  }
};

/**
 * Delete a custom roadmap
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with success or error
 */
exports.deleteCustomRoadmap = async (req, res) => {
  try {
    const roadmapId = req.params.id;
    const userId = req.user._id;
    
    // Find and delete the roadmap
    const result = await CustomRoadmap.findOneAndDelete({
      _id: roadmapId,
      userId
    });
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Custom roadmap not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Custom roadmap deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting custom roadmap:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Failed to delete custom roadmap',
      error: error.message
    });
  }
}; 