import axios from 'axios';

// API URL configuration
const API_URL = import.meta.env.VITE_AUTH_API_URL;

// Create axios instance with credentials
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add authorization header to requests if token exists
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Save a custom roadmap to the server
 * @param {Object} roadmapData - The roadmap data to save
 * @returns {Promise<Object>} The saved roadmap data
 */
export const saveCustomRoadmap = async (roadmapData) => {
  try {
    // Make sure we use name consistently across the app
    const formattedRoadmap = {
      ...roadmapData,
      title: roadmapData.title || roadmapData.name, // Ensure title is set
      name: roadmapData.name || roadmapData.title, // Ensure name is set
      clientId: roadmapData.id, // Ensure client ID is passed
      isCustom: true // Always set isCustom flag for custom roadmaps
    };

    const response = await api.post('/custom-roadmaps', formattedRoadmap);
    return response;
  } catch (error) {
    console.error('Error saving custom roadmap:', error);
    
    // Save locally as fallback
    saveCustomRoadmapLocally(roadmapData);
    
    throw error;
  }
};

/**
 * Get all custom roadmaps for the current user
 * @returns {Promise<Array>} Array of custom roadmaps
 */
export const getUserCustomRoadmaps = async () => {
  try {
    const response = await api.get('/custom-roadmaps');
    // Ensure we return data in a consistent format
    if (response && response.data && response.data.data) {
      return { data: response.data.data };
    } else if (response && response.data) {
      return { data: response.data };
    } else {
      console.warn('Unexpected API response format:', response);
      return { data: [] };
    }
  } catch (error) {
    console.error('Error fetching custom roadmaps:', error);
    
    // Return locally saved roadmaps as fallback
    const localRoadmaps = getLocalCustomRoadmaps();
    if (localRoadmaps && localRoadmaps.length > 0) {
      return { data: localRoadmaps, isLocal: true };
    } else {
      return { data: [], isLocal: true };
    }
  }
};

/**
 * Get a specific custom roadmap by ID
 * @param {string} roadmapId - The ID of the roadmap to get
 * @returns {Promise<Object>} The roadmap data
 */
export const getCustomRoadmap = async (roadmapId) => {
  try {
    const response = await api.get(`/custom-roadmaps/${roadmapId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching custom roadmap ${roadmapId}:`, error);
    
    // Check if this is a 404 error (roadmap not found)
    if (error.response && error.response.status === 404) {
      // Throw a more specific error for 404 cases
      throw new Error('Custom roadmap not found');
    }
    
    // Try to find locally saved roadmap
    const localRoadmaps = getLocalCustomRoadmaps();
    const localRoadmap = localRoadmaps.find(r => r.id === roadmapId);
    
    if (localRoadmap) {
      return { data: localRoadmap, isLocal: true };
    }
    
    throw error;
  }
};

/**
 * Update an existing custom roadmap
 * @param {string} roadmapId - The ID of the roadmap to update
 * @param {Object} roadmapData - The updated roadmap data
 * @returns {Promise<Object>} The updated roadmap data
 */
export const updateCustomRoadmap = async (roadmapId, roadmapData) => {
  try {
    // Make sure we use name consistently across the app
    const formattedRoadmap = {
      ...roadmapData,
      title: roadmapData.title || roadmapData.name, // Ensure title is set
      name: roadmapData.name || roadmapData.title, // Ensure name is set
      clientId: roadmapData.id, // Ensure client ID is passed
      isCustom: true // Always set isCustom flag for custom roadmaps
    };

    const response = await api.put(`/custom-roadmaps/${roadmapId}`, formattedRoadmap);
    return response.data;
  } catch (error) {
    console.error(`Error updating custom roadmap ${roadmapId}:`, error);
    
    // Update locally saved roadmap
    updateLocalCustomRoadmap(roadmapId, roadmapData);
    
    throw error;
  }
};

/**
 * Delete a custom roadmap
 * @param {string} roadmapId - The ID of the roadmap to delete
 * @returns {Promise<Object>} The response data
 */
export const deleteCustomRoadmap = async (roadmapId) => {
  try {
    const response = await api.delete(`/custom-roadmaps/${roadmapId}`);
    
    // Also remove from local storage if it exists there
    removeLocalCustomRoadmap(roadmapId);
    
    return response.data;
  } catch (error) {
    console.error(`Error deleting custom roadmap ${roadmapId}:`, error);
    throw error;
  }
};

/**
 * Save a custom roadmap locally (fallback when API fails)
 * @param {Object} roadmapData - The roadmap data to save locally
 */
const saveCustomRoadmapLocally = (roadmapData) => {
  try {
    const savedRoadmaps = getLocalCustomRoadmaps();
    
    // Add metadata for local storage
    const roadmapToSave = {
      ...roadmapData,
      title: roadmapData.title || roadmapData.name, // Ensure title is set
      name: roadmapData.name || roadmapData.title, // Ensure name is set
      id: roadmapData.id || `local-${Date.now()}`,
      savedAt: new Date().toISOString(),
      isLocal: true,
      isCustom: true // Always set isCustom flag for custom roadmaps
    };
    
    // Add to local roadmaps
    savedRoadmaps.push(roadmapToSave);
    localStorage.setItem('customRoadmaps', JSON.stringify(savedRoadmaps));
    
    return roadmapToSave;
  } catch (error) {
    console.error('Error saving roadmap locally:', error);
  }
};

/**
 * Update a locally saved roadmap
 * @param {string} roadmapId - The ID of the roadmap to update
 * @param {Object} roadmapData - The updated roadmap data
 */
const updateLocalCustomRoadmap = (roadmapId, roadmapData) => {
  try {
    const savedRoadmaps = getLocalCustomRoadmaps();
    
    // Update the roadmap
    const updatedRoadmaps = savedRoadmaps.map(roadmap => {
      if (roadmap.id === roadmapId) {
        return {
          ...roadmap,
          ...roadmapData,
          title: roadmapData.title || roadmapData.name, // Ensure title is set
          name: roadmapData.name || roadmapData.title, // Ensure name is set
          updatedAt: new Date().toISOString()
        };
      }
      return roadmap;
    });
    
    localStorage.setItem('customRoadmaps', JSON.stringify(updatedRoadmaps));
  } catch (error) {
    console.error('Error updating roadmap locally:', error);
  }
};

/**
 * Remove a locally saved roadmap
 * @param {string} roadmapId - The ID of the roadmap to remove
 */
const removeLocalCustomRoadmap = (roadmapId) => {
  try {
    const savedRoadmaps = getLocalCustomRoadmaps();
    const updatedRoadmaps = savedRoadmaps.filter(roadmap => roadmap.id !== roadmapId);
    localStorage.setItem('customRoadmaps', JSON.stringify(updatedRoadmaps));
  } catch (error) {
    console.error('Error removing roadmap locally:', error);
  }
};

/**
 * Get all locally saved custom roadmaps
 * @returns {Array} Array of locally saved roadmaps
 */
const getLocalCustomRoadmaps = () => {
  try {
    return JSON.parse(localStorage.getItem('customRoadmaps') || '[]');
  } catch (error) {
    console.error('Error reading local roadmaps:', error);
    return [];
  }
}; 