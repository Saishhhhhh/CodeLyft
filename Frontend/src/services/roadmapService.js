import axios from 'axios';

// Force the correct port regardless of environment variable
const API_URL = 'http://localhost:5000/api';

// Create axios instance with credentials
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Track the last save operation to prevent duplicates
let lastSaveTimestamp = 0;
let lastSaveRoadmapTitle = '';
let lastSaveRoadmapId = null;

// Check authentication status
export const checkAuth = async () => {
  try {
    console.log('Checking auth at:', `${API_URL}/auth/check`);
    // Try with the correct API endpoint
    const response = await api.get('/auth/check');
    console.log('Auth check response:', response.data);
    return {
      isAuthenticated: response.data.success,
      user: response.data.user
    };
  } catch (error) {
    console.error('Error checking authentication status:', error);
    // Try to use the context auth instead
    if (localStorage.getItem('token')) {
      console.log('Falling back to token-based auth');
      return {
        isAuthenticated: true,
        user: { _id: 'local-user' }
      };
    }
    return {
      isAuthenticated: false,
      user: null
    };
  }
};

// Process source field to handle objects
const processSourceField = (source) => {
  if (!source) return 'YouTube';
  
  if (typeof source === 'string') {
    return source;
  }
  
  if (typeof source === 'object' && source.name !== undefined) {
    return source.name || 'YouTube';
  }
  
  return 'YouTube';
};

// Process duration to ensure it's stored as a number
const processDuration = (duration) => {
  if (!duration) return 0;
  
  // If it's already a number, return it
  if (typeof duration === 'number') {
    return duration;
  }
  
  // Convert to string to ensure we can work with it
  const durationStr = String(duration).trim();
  
  // If it's a string in format HH:MM:SS or MM:SS
  if (durationStr.includes(':')) {
    const parts = durationStr.split(':');
    if (parts.length === 3) {
      // Handle HH:MM:SS format
      return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
    } else if (parts.length === 2) {
      // Handle MM:SS format
      return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    }
  }
  
  // Try to parse it as a number - ensure we're using a clean string
  const parsed = parseInt(durationStr);
  return isNaN(parsed) ? 0 : parsed;
};

// Save an AI-generated roadmap to the database
export const saveGeneratedRoadmap = async (roadmapData) => {
  try {
    console.log('saveGeneratedRoadmap called with data:', roadmapData);
    
    // Check if this is a forced save with a specific ID
    const forceNewSave = roadmapData._forceNewSave === true;
    const currentTime = Date.now();
    
    // If we have a saved ID and this isn't a forced save, return the existing ID
    if (lastSaveRoadmapId && !forceNewSave && currentTime - lastSaveTimestamp < 30000 && roadmapData.title === lastSaveRoadmapTitle) {
      console.log('Returning existing saved roadmap ID:', lastSaveRoadmapId);
      return {
        success: true,
        message: 'Using existing saved roadmap',
        _id: lastSaveRoadmapId,
        data: { _id: lastSaveRoadmapId, title: roadmapData.title }
      };
    }
    
    // Update the timestamp and title for future checks
    lastSaveTimestamp = currentTime;
    lastSaveRoadmapTitle = roadmapData.title;
    
    // Clear any _forceNewSave flag before saving
    if (roadmapData._forceNewSave) {
      delete roadmapData._forceNewSave;
    }
    
    // Get difficulty from the first section or default to Intermediate
    let difficulty = 'Intermediate';
    
    // Handle both formats - roadmapData might have sections or topics
    const hasTopics = roadmapData.topics && Array.isArray(roadmapData.topics);
    const hasSections = roadmapData.sections && Array.isArray(roadmapData.sections);
    
    // If the roadmap already has topics (in the DB format), use it directly
    if (hasTopics) {
      console.log('Using existing topics format for saving to database');
      
      // Process any complex source fields and ensure duration is a number
      const processedTopics = roadmapData.topics.map(topic => {
        if (topic.resources && Array.isArray(topic.resources)) {
          return {
            ...topic,
            resources: topic.resources.map(resource => ({
              ...resource,
              source: processSourceField(resource.source),
              duration: processDuration(resource.duration)
            })),
            totalResources: topic.resources.length,
            completedResources: topic.completedResources || 0,
            completedResourceIds: topic.completedResourceIds || []
          };
        }
        return {
          ...topic,
          totalResources: 0,
          completedResources: 0,
          completedResourceIds: []
        };
      });
      
      // Format the roadmap to match our backend model
      const formattedRoadmap = {
        title: roadmapData.title,
        description: roadmapData.description,
        category: roadmapData.category || roadmapData.title.split(' ').pop() || 'Web Development',
        difficulty: roadmapData.difficulty || 'Intermediate',
        isCustom: roadmapData.isCustom || false, // Ensure isCustom flag is preserved
        topics: processedTopics,
        advancedTopics: roadmapData.advancedTopics || [],
        projects: roadmapData.projects || []
      };
      
      console.log('Formatted roadmap for API:', formattedRoadmap);
      
      // Get token from localStorage if available
      const token = localStorage.getItem('token');
      
      // Create a properly configured axios instance for this request
      const apiRequest = axios.create({
        baseURL: API_URL,
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          // Include Authorization header only if token exists
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      
      // Determine which endpoint to use based on isCustom flag
      const endpoint = formattedRoadmap.isCustom ? '/custom-roadmaps' : '/roadmaps';
      console.log(`Making API call to: ${API_URL}${endpoint} (isCustom: ${formattedRoadmap.isCustom})`);
      const response = await apiRequest.post(endpoint, formattedRoadmap);
      console.log('API response:', response);
      
      // Save the ID for future reference
      if (response.data && response.data._id) {
        lastSaveRoadmapId = response.data._id;
        console.log('Saved roadmap ID for future reference:', lastSaveRoadmapId);
      }
      
      return response.data;
    }
    // If the roadmap has sections (from the UI format), convert to topics
    else if (hasSections) {
      console.log('Converting sections format to topics format for saving to database');
      
      if (roadmapData.sections.length > 0) {
        const firstDifficulty = roadmapData.sections[0]?.difficulty?.toLowerCase();
        if (firstDifficulty === 'beginner') {
          difficulty = 'Beginner';
        } else if (firstDifficulty === 'advanced') {
          difficulty = 'Advanced';
        }
      }
      
      // Format the AI-generated roadmap to match our backend model
      const formattedRoadmap = {
        title: roadmapData.title,
        description: roadmapData.description,
        category: roadmapData.category || roadmapData.title.split(' ').pop() || 'Web Development',
        difficulty: difficulty,
        isCustom: roadmapData.isCustom || false, // Ensure isCustom flag is preserved
        topics: roadmapData.sections.map((section, index) => {
          // Process resources if they exist
          let resources = [];
          if (section.topics && section.topics[0]?.video?.videos) {
            resources = section.topics[0].video.videos.map(video => {
              // Parse duration using the processDuration utility
              const durationInSeconds = processDuration(video.duration);
              
              // Process the source field
              const source = video.channel ? processSourceField(video.channel) : 'YouTube';
              
              return {
                title: video.title,
                url: video.url,
                type: 'video',
                description: video.description || '',
                thumbnailUrl: video.thumbnail || '',
                source: source,
                duration: durationInSeconds,
                isRequired: true
              };
            });
          }
          
          return {
            title: section.title,
            description: section.description || '',
            order: index + 1,
            difficulty: section.difficulty?.toLowerCase() || 'intermediate',
            resources: resources,
            hasGeneratedResources: resources.length > 0,
            totalResources: resources.length,
            completedResources: 0,
            completedResourceIds: []
          };
        }),
        advancedTopics: [],
        projects: []
      };
      
      console.log('Formatted roadmap for API:', formattedRoadmap);
      
      // Get token from localStorage if available
      const token = localStorage.getItem('token');
      
      // Create a properly configured axios instance for this request
      const apiRequest = axios.create({
        baseURL: API_URL,
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          // Include Authorization header only if token exists
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      
      // Determine which endpoint to use based on isCustom flag
      const endpoint = formattedRoadmap.isCustom ? '/custom-roadmaps' : '/roadmaps';
      console.log(`Making API call to: ${API_URL}${endpoint} (isCustom: ${formattedRoadmap.isCustom})`);
      const response = await apiRequest.post(endpoint, formattedRoadmap);
      console.log('API response:', response);
      
      // Save the ID for future reference
      if (response.data && response.data._id) {
        lastSaveRoadmapId = response.data._id;
        console.log('Saved roadmap ID for future reference:', lastSaveRoadmapId);
      }
      
      return response.data;
    }
    // If neither topics nor sections, save locally
    else {
      console.warn('Roadmap data has neither topics nor sections, saving locally');
      return saveRoadmapLocally(roadmapData);
    }
  } catch (error) {
    console.error('Error saving roadmap:', error);
    // Try to save locally as fallback
    return saveRoadmapLocally(roadmapData);
  }
};

// Save roadmap locally as a fallback
const saveRoadmapLocally = (roadmapData) => {
  try {
    // Save to localStorage
    const savedRoadmaps = JSON.parse(localStorage.getItem('savedRoadmaps') || '[]');
    roadmapData.savedAt = new Date().toISOString();
    roadmapData.id = `local-${Date.now()}`;
    savedRoadmaps.push(roadmapData);
    localStorage.setItem('savedRoadmaps', JSON.stringify(savedRoadmaps));
    console.log('Roadmap saved locally as fallback');
    
    // Also offer download as JSON
    const jsonData = JSON.stringify(roadmapData, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `roadmap_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    return { success: true, message: 'Roadmap saved locally', data: roadmapData };
  } catch (error) {
    console.error('Error saving roadmap locally:', error);
    return { success: false, message: 'Failed to save roadmap locally' };
  }
};

// Get all roadmaps for the current user
export const getUserRoadmaps = async () => {
  try {
    const response = await api.get('/roadmaps');
    return response.data;
  } catch (error) {
    console.error('Error fetching user roadmaps:', error);
    throw error;
  }
};

// Save roadmap progress to localStorage
export const saveRoadmapProgress = (progress) => {
  try {
    localStorage.setItem('roadmapProgress', JSON.stringify(progress));
    return { success: true };
  } catch (error) {
    console.error('Error saving roadmap progress:', error);
    return { success: false, error };
  }
};

// Load roadmap progress from localStorage
export const loadRoadmapProgress = () => {
  try {
    const progress = localStorage.getItem('roadmapProgress');
    return progress ? JSON.parse(progress) : { completedVideos: {}, videoNotes: {} };
  } catch (error) {
    console.error('Error loading roadmap progress:', error);
    return { completedVideos: {}, videoNotes: {} };
  }
};

// Get completed videos from localStorage
export const getCompletedVideos = () => {
  try {
    const progress = localStorage.getItem('roadmapProgress');
    if (!progress) return {};
    const parsedProgress = JSON.parse(progress);
    return parsedProgress.completedVideos || {};
  } catch (error) {
    console.error('Error getting completed videos:', error);
    return {};
  }
};

// Get a single roadmap with topics
export const getRoadmap = async (roadmapId) => {
  try {
    const response = await api.get(`/roadmaps/${roadmapId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching roadmap ${roadmapId}:`, error);
    throw error;
  }
};

// Create a new roadmap
export const createRoadmap = async (roadmapData) => {
  try {
    const response = await api.post('/roadmaps', roadmapData);
    return response.data;
  } catch (error) {
    console.error('Error creating roadmap:', error);
    throw error;
  }
};

// Update a roadmap
export const updateRoadmap = async (roadmapId, roadmapData) => {
  try {
    const response = await api.put(`/roadmaps/${roadmapId}`, roadmapData);
    return response.data;
  } catch (error) {
    console.error(`Error updating roadmap ${roadmapId}:`, error);
    throw error;
  }
};

// Delete a roadmap
export const deleteRoadmap = async (roadmapId) => {
  try {
    const response = await api.delete(`/roadmaps/${roadmapId}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting roadmap ${roadmapId}:`, error);
    throw error;
  }
};

// Add a topic to a roadmap
export const addTopic = async (roadmapId, topicData) => {
  try {
    const response = await api.post(`/roadmaps/${roadmapId}/topics`, topicData);
    return response.data;
  } catch (error) {
    console.error(`Error adding topic to roadmap ${roadmapId}:`, error);
    throw error;
  }
};

// Update topic progress
export const updateTopicProgress = async (roadmapId, topicId, resourceId, isCompleted) => {
  try {
    const response = await api.put(`/roadmaps/${roadmapId}/topics/${topicId}/progress`, { 
      resourceId, 
      isCompleted 
    });
    return response.data;
  } catch (error) {
    console.error(`Error updating progress for topic ${topicId}:`, error);
    throw error;
  }
};

// Generate resources for a topic
export const generateTopicResources = async (roadmapId, topicId) => {
  try {
    const response = await api.post(`/roadmaps/${roadmapId}/topics/${topicId}/resources/generate`);
    return response.data;
  } catch (error) {
    console.error(`Error generating resources for topic ${topicId}:`, error);
    throw error;
  }
};

// No need for separate getRoadmapProgress function since progress is part of the roadmap document now
export const getRoadmapProgress = async (roadmapId) => {
  try {
    // Just get the roadmap - progress is included
    const response = await getRoadmap(roadmapId);
    
    // Extract progress data in a format compatible with the original API
    const roadmap = response.data;
    const totalTopics = roadmap.topics.length;
    const completedTopics = roadmap.topics.filter(t => t.progress === 'completed').length;
    const inProgressTopics = roadmap.topics.filter(t => t.progress === 'in-progress').length;
    const notStartedTopics = totalTopics - completedTopics - inProgressTopics;
    
    return {
      success: true,
      data: {
        totalTopics,
        completedTopics,
        inProgressTopics,
        notStartedTopics,
        completionPercentage: roadmap.completionPercentage
      }
    };
  } catch (error) {
    console.error(`Error fetching roadmap progress ${roadmapId}:`, error);
    throw error;
  }
};

// Get topic resources (compatibility function for the original API)
export const getTopicResources = async (roadmapId, topicId) => {
  try {
    // Get the roadmap
    const response = await getRoadmap(roadmapId);
    
    // Find the topic
    const topic = response.data.topics.find(t => t._id === topicId);
    
    if (!topic) {
      throw new Error('Topic not found');
    }
    
    return {
      success: true,
      data: {
        resources: topic.resources || []
      }
    };
  } catch (error) {
    console.error(`Error fetching resources for topic ${topicId}:`, error);
    throw error;
  }
};

// Import a roadmap from a JSON file
export const importRoadmap = async (roadmapData, includeResources = false) => {
  try {
    // Check if the roadmap has resources
    const hasResources = roadmapData.sections?.some(section => 
      section.resources && section.resources.length > 0
    );
    
    console.log('Roadmap has resources:', hasResources, 'Include resources flag:', includeResources);
    
    // Format the imported roadmap to match our backend model
    const formattedRoadmap = {
      title: roadmapData.title,
      description: roadmapData.description || 'Imported roadmap',
      category: roadmapData.category || roadmapData.title.split(' ').pop() || 'Web Development',
      difficulty: roadmapData.difficulty || 'Intermediate',
      topics: roadmapData.sections?.map((section, index) => {
        // Determine if this section has resources that should be included
        const sectionHasResources = includeResources && section.resources && section.resources.length > 0;
        
        console.log(`Section ${section.title} has resources:`, sectionHasResources, 
                    'Resource count:', section.resources?.length || 0);
        
        return {
          title: section.title,
          description: section.description || 'No description provided',
          order: index + 1,
          difficulty: section.difficulty?.toLowerCase() || 'intermediate',
          progress: 'not-started',
          hasGeneratedResources: sectionHasResources,
          resources: sectionHasResources ? section.resources.map(resource => ({
            title: resource.title,
            url: resource.url,
            type: resource.type || 'video',
            description: resource.description || '',
            thumbnailUrl: resource.thumbnailUrl || '',
            source: resource.source || 'YouTube',
            duration: resource.duration || 0,
            isRequired: resource.isRequired !== false
          })) : []
        };
      }) || [],
      advancedTopics: roadmapData.advancedTopics?.map((topic) => ({
        title: topic.title,
        description: topic.description || 'No description provided'
      })) || [],
      projects: roadmapData.projects?.map((project) => ({
        title: project.title,
        description: project.description || 'No description provided',
        difficulty: project.difficulty?.toLowerCase() || 'intermediate'
      })) || []
    };
    
    // Log the formatted roadmap for debugging
    console.log('Formatted roadmap for import:');
    console.log('- Title:', formattedRoadmap.title);
    console.log('- Topics count:', formattedRoadmap.topics.length);
    formattedRoadmap.topics.forEach((topic, i) => {
      console.log(`- Topic ${i+1}: ${topic.title}`);
      console.log(`  - Has resources: ${topic.hasGeneratedResources}`);
      console.log(`  - Resources count: ${topic.resources.length}`);
    });
    
    // Make the API call to save the roadmap
    const response = await api.post('/roadmaps', formattedRoadmap);
    return response.data;
  } catch (error) {
    console.error('Error importing roadmap:', error);
    throw error;
  }
};

// Download a roadmap as a JSON file
export const downloadRoadmap = (roadmap) => {
  try {
    if (!roadmap) {
      console.error('Error downloading roadmap: Roadmap is undefined');
      return { success: false, error: 'Roadmap is undefined' };
    }

    // Format the roadmap for export
    const exportData = {
      title: roadmap.title || 'Untitled Roadmap',
      description: roadmap.description || '',
      category: roadmap.category || 'General',
      difficulty: roadmap.difficulty || 'Intermediate',
      sections: Array.isArray(roadmap.topics) ? roadmap.topics.map(topic => ({
        title: topic.title || '',
        description: topic.description || '',
        difficulty: topic.difficulty || 'intermediate',
        resources: Array.isArray(topic.resources) ? topic.resources : []
      })) : Array.isArray(roadmap.sections) ? roadmap.sections.map(section => ({
        title: section.title || '',
        description: section.description || '',
        difficulty: section.difficulty || 'intermediate',
        resources: Array.isArray(section.topics) ? section.topics.map(topic => 
          topic.video ? {
            title: topic.video.title || topic.title,
            url: topic.video.url || '',
            type: 'video',
            description: topic.description || '',
            thumbnailUrl: topic.video.videos?.[0]?.thumbnail || '',
            source: topic.video.channel || 'YouTube',
            duration: topic.video.videos?.[0]?.duration || 0,
            isRequired: true
          } : {
            title: topic.title,
            description: topic.description || '',
            type: 'text'
          }
        ) : []
      })) : [],
      advancedTopics: Array.isArray(roadmap.advancedTopics) ? roadmap.advancedTopics : [],
      projects: Array.isArray(roadmap.projects) ? roadmap.projects : [],
      exportedAt: new Date().toISOString()
    };
    
    // Create a JSON string
    const jsonData = JSON.stringify(exportData, null, 2);
    
    // Create a blob and download link
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // Create a sanitized filename
    const filename = (roadmap.title || 'roadmap')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
      
    link.download = `roadmap_${filename}.json`;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    // Log the exported data for debugging
    console.log('Exported roadmap data:', exportData);
    
    return { success: true };
  } catch (error) {
    console.error('Error downloading roadmap:', error);
    return { success: false, error };
  }
};

// Save video notes to the database
export const saveVideoNotes = async (roadmapId, videoId, notes) => {
  try {
    console.log('Saving notes for video', videoId, 'in roadmap', roadmapId);
    
    // Get token from localStorage if available
    const token = localStorage.getItem('token');
    
    // Create a properly configured axios instance for this request
    const apiRequest = axios.create({
      baseURL: API_URL,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
        // Include Authorization header only if token exists
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    });
    
    const response = await apiRequest.post(`/roadmaps/${roadmapId}/notes`, {
      videoId,
      notes,
      timestamp: new Date().toISOString()
    });
    
    return response.data;
  } catch (error) {
    console.error('Error saving video notes:', error);
    // Save locally as fallback
    const videoNotes = JSON.parse(localStorage.getItem('videoNotes') || '{}');
    videoNotes[videoId] = notes;
    localStorage.setItem('videoNotes', JSON.stringify(videoNotes));
    
    throw error;
  }
};

// Get video notes from the database
export const getVideoNotes = async (roadmapId) => {
  try {
    console.log('Getting notes for roadmap', roadmapId);
    
    // Get token from localStorage if available
    const token = localStorage.getItem('token');
    
    // Create a properly configured axios instance for this request
    const apiRequest = axios.create({
      baseURL: API_URL,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
        // Include Authorization header only if token exists
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    });
    
    try {
      const response = await apiRequest.get(`/roadmaps/${roadmapId}/notes`);
      return response.data;
    } catch (apiError) {
      // If the server returns 404, it means the notes endpoint isn't available yet
      // or there are no notes for this roadmap - don't treat as an error
      if (apiError.response && apiError.response.status === 404) {
        console.log('Notes API not available or no notes exist - using local storage instead');
        // Return empty notes object with success status
        const videoNotes = JSON.parse(localStorage.getItem('videoNotes') || '{}');
        return { 
          success: true, 
          data: { 
            notes: videoNotes,
            timestamps: {} 
          } 
        };
      }
      // Rethrow other errors to be caught by outer catch
      throw apiError;
    }
  } catch (error) {
    console.error('Error getting video notes:', error);
    // Return local notes as fallback
    const videoNotes = JSON.parse(localStorage.getItem('videoNotes') || '{}');
    return { success: true, data: { notes: videoNotes } };
  }
};

// Update roadmap progress for a specific topic
export const updateRoadmapProgress = async (roadmapId, progressData) => {
  try {
    const response = await api.put(`/roadmaps/${roadmapId}/progress`, progressData);
    return response;
  } catch (error) {
    console.error('Error updating roadmap progress:', error);
    throw error;
  }
}; 