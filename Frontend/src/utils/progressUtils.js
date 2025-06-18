// Save roadmap progress to localStorage
export const saveRoadmapProgress = ({ roadmapId, topicId, videoId, isCompleted }) => {
  try {
    // Get existing progress from localStorage
    const existingProgress = JSON.parse(localStorage.getItem('roadmapProgress') || '{}');
    
    // Initialize roadmap progress if it doesn't exist
    if (!existingProgress[roadmapId]) {
      existingProgress[roadmapId] = {
        topics: {},
        lastUpdated: new Date().toISOString()
      };
    }
    
    // Initialize topic progress if it doesn't exist
    if (!existingProgress[roadmapId].topics[topicId]) {
      existingProgress[roadmapId].topics[topicId] = {
        completedVideos: {},
        lastUpdated: new Date().toISOString()
      };
    }
    
    // Update video completion status
    existingProgress[roadmapId].topics[topicId].completedVideos[videoId] = isCompleted;
    existingProgress[roadmapId].topics[topicId].lastUpdated = new Date().toISOString();
    existingProgress[roadmapId].lastUpdated = new Date().toISOString();
    
    // Save back to localStorage
    localStorage.setItem('roadmapProgress', JSON.stringify(existingProgress));
    
    return true;
  } catch (error) {
    console.error('Error saving roadmap progress:', error);
    return false;
  }
};

// Load roadmap progress from localStorage
export const loadRoadmapProgress = (roadmapId) => {
  try {
    const progress = JSON.parse(localStorage.getItem('roadmapProgress') || '{}');
    return progress[roadmapId] || null;
  } catch (error) {
    console.error('Error loading roadmap progress:', error);
    return null;
  }
}; 