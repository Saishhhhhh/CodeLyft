import { createContext, useContext, useState, useEffect } from 'react';
import { saveCustomRoadmap, getUserCustomRoadmaps, updateCustomRoadmap, deleteCustomRoadmap } from '../services/customRoadmapService';
import { useAuth } from './AuthContext';

const CustomRoadmapContext = createContext();

export const useCustomRoadmap = () => {
  const context = useContext(CustomRoadmapContext);
  if (!context) {
    throw new Error('useCustomRoadmap must be used within a CustomRoadmapProvider');
  }
  return context;
};

export const CustomRoadmapProvider = ({ children }) => {
  const [roadmaps, setRoadmaps] = useState([]);
  const [currentRoadmap, setCurrentRoadmap] = useState(null);
  const [savedRoadmaps, setSavedRoadmaps] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated, user } = useAuth();

  // Load saved custom roadmaps when the component mounts or user auth state changes
  useEffect(() => {
    if (isAuthenticated) {
      loadSavedRoadmaps();
    } else {
      // Clear saved roadmaps if not authenticated
      setSavedRoadmaps([]);
    }
  }, [isAuthenticated]);

  // Load saved roadmaps from the server or localStorage
  const loadSavedRoadmaps = async () => {
    try {
      setIsLoading(true);
      const response = await getUserCustomRoadmaps();
      // Check if we have valid data before updating state
      if (response && response.data) {
        setSavedRoadmaps(response.data);
      } else if (response && response.isLocal) {
        // Handle local data case
        setSavedRoadmaps(response);
      } else {
        // Handle empty response case
        setSavedRoadmaps([]);
        console.warn('No roadmap data returned from API');
      }
    } catch (error) {
      console.error('Failed to load saved roadmaps:', error);
      setSavedRoadmaps([]); // Set to empty array on error
    } finally {
      setIsLoading(false);
    }
  };

  // Add a new roadmap
  const createRoadmap = (name, description = '') => {
    const newRoadmap = {
      id: Date.now(),
      name,
      description,
      topics: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    setRoadmaps([...roadmaps, newRoadmap]);
    setCurrentRoadmap(newRoadmap);
    return newRoadmap;
  };

  // Update an existing roadmap
  const updateRoadmap = (id, updates) => {
    console.log(`Updating roadmap with id ${id}:`, updates);
    
    if (!id) {
      console.error("Cannot update roadmap: Invalid ID");
      return;
    }
    
    try {
      const updatedRoadmaps = roadmaps.map(roadmap => {
        // Match both _id and id fields to handle MongoDB and client-side IDs
        if (roadmap.id === id || roadmap._id === id) {
          console.log("Found roadmap to update:", roadmap);
          
          const updatedRoadmap = {
            ...roadmap,
            ...updates,
            updatedAt: new Date().toISOString(),
          };
          
          console.log("Updated roadmap:", updatedRoadmap);
          
          // Update current roadmap if this is the one being edited
          if (currentRoadmap && (currentRoadmap.id === id || currentRoadmap._id === id)) {
            console.log("This is the current roadmap - updating current state");
            setCurrentRoadmap(updatedRoadmap);
          }
          
          return updatedRoadmap;
        }
        return roadmap;
      });
      
      console.log("Setting updated roadmaps:", updatedRoadmaps);
      setRoadmaps(updatedRoadmaps);
    } catch (error) {
      console.error("Error updating roadmap:", error);
    }
  };

  // Delete a roadmap
  const deleteRoadmap = (id) => {
    setRoadmaps(roadmaps.filter(roadmap => roadmap.id !== id));
    
    if (currentRoadmap?.id === id) {
      setCurrentRoadmap(null);
    }
  };

  // Add a topic to the current roadmap
  const addTopic = (title) => {
    if (!currentRoadmap) {
      console.error("Cannot add topic: No current roadmap");
      return null;
    }
    
    try {
      const newTopic = {
        id: Date.now(),
        title,
        resources: [],
      };
      
      console.log("Adding topic to roadmap:", newTopic);
      
      // Ensure we have a topics array to work with
      const currentTopics = Array.isArray(currentRoadmap.topics) ? currentRoadmap.topics : [];
      const updatedTopics = [...currentTopics, newTopic];
      
      const roadmapId = currentRoadmap.id || currentRoadmap._id;
      console.log(`Updating roadmap ${roadmapId} with new topic`);
      
      // Create a full updated roadmap object
      const updatedRoadmap = {
        ...currentRoadmap,
        topics: updatedTopics
      };
      
      // Set current roadmap directly for immediate UI update
      setCurrentRoadmap(updatedRoadmap);
      
      // Also update the roadmap in the list for persistence
      updateRoadmap(roadmapId, { topics: updatedTopics });
      
      return newTopic;
    } catch (error) {
      console.error("Error adding topic:", error);
      return null;
    }
  };

  // Remove a topic from the current roadmap
  const removeTopic = (topicId) => {
    if (!currentRoadmap) {
      console.error("Cannot remove topic: No current roadmap");
      return;
    }
    
    try {
      console.log(`Removing topic with ID: ${topicId}`);
      
      // Check if we have a topics array
      if (!Array.isArray(currentRoadmap.topics)) {
        console.error("Cannot remove topic: topics is not an array");
        return;
      }
      
      console.log("Original topics:", currentRoadmap.topics);
      
      const updatedTopics = currentRoadmap.topics.filter(
        topic => topic.id !== topicId
      );
      
      console.log("Updated topics:", updatedTopics);
      
      const roadmapId = currentRoadmap.id || currentRoadmap._id;
      console.log(`Updating roadmap ${roadmapId} after removing topic`);
      
      // Create a full updated roadmap object
      const updatedRoadmap = {
        ...currentRoadmap,
        topics: updatedTopics
      };
      
      // Set current roadmap directly for immediate UI update
      setCurrentRoadmap(updatedRoadmap);
      
      // Also update the roadmap in the list for persistence
      updateRoadmap(roadmapId, { topics: updatedTopics });
    } catch (error) {
      console.error("Error removing topic:", error);
    }
  };

  // Update topic order in the current roadmap
  const reorderTopics = (topicId, direction) => {
    if (!currentRoadmap) {
      console.error("Cannot reorder topics: No current roadmap");
      return;
    }
    
    try {
      console.log(`Reordering topic ${topicId} ${direction}`);
      
      // Check if we have a topics array
      if (!Array.isArray(currentRoadmap.topics)) {
        console.error("Cannot reorder topics: topics is not an array");
        return;
      }
      
      const topics = [...currentRoadmap.topics];
      const currentIndex = topics.findIndex(topic => topic.id === topicId);
      
      console.log(`Current index of topic: ${currentIndex}`);
      
      if (currentIndex === -1) {
        console.error(`Topic with ID ${topicId} not found`);
        return;
      }
      
      // Check if we can move in the requested direction
      if (
        (direction === 'up' && currentIndex > 0) ||
        (direction === 'down' && currentIndex < topics.length - 1)
      ) {
        const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        console.log(`Moving topic from index ${currentIndex} to ${newIndex}`);
        
        const [movedTopic] = topics.splice(currentIndex, 1);
        topics.splice(newIndex, 0, movedTopic);
        
        const roadmapId = currentRoadmap.id || currentRoadmap._id;
        console.log(`Updating roadmap ${roadmapId} with reordered topics`);
        
        // Create a full updated roadmap object
        const updatedRoadmap = {
          ...currentRoadmap,
          topics: topics
        };
        
        // Set current roadmap directly for immediate UI update
        setCurrentRoadmap(updatedRoadmap);
        
        // Also update the roadmap in the list for persistence
        updateRoadmap(roadmapId, { topics });
      } else {
        console.warn(`Cannot move topic ${direction} from index ${currentIndex}`);
      }
    } catch (error) {
      console.error("Error reordering topics:", error);
    }
  };

  // Add a resource to a topic
  const addResource = (topicId, resource) => {
    if (!currentRoadmap) return;
    
    const newResource = {
      id: Date.now(),
      ...resource,
    };
    
    // Create a deep copy of the current roadmap
    const updatedRoadmap = JSON.parse(JSON.stringify(currentRoadmap));
    
    // Find the topic and update its resources
    const topicIndex = updatedRoadmap.topics.findIndex(topic => topic.id === topicId);
    if (topicIndex !== -1) {
      updatedRoadmap.topics[topicIndex].resources.push(newResource);
      updatedRoadmap.updatedAt = new Date().toISOString();
      
      // Update both states
      setCurrentRoadmap(updatedRoadmap);
      setRoadmaps(prevRoadmaps => 
        prevRoadmaps.map(roadmap => 
          roadmap.id === currentRoadmap.id ? updatedRoadmap : roadmap
        )
      );
    }
    
    return newResource;
  };

  // Remove a resource from a topic
  const removeResource = (topicId, resourceId) => {
    if (!currentRoadmap) return;
    
    // Create a deep copy of the current roadmap
    const updatedRoadmap = JSON.parse(JSON.stringify(currentRoadmap));
    
    // Find the topic and remove the resource
    const topicIndex = updatedRoadmap.topics.findIndex(topic => topic.id === topicId);
    if (topicIndex !== -1) {
      updatedRoadmap.topics[topicIndex].resources = 
        updatedRoadmap.topics[topicIndex].resources.filter(resource => resource.id !== resourceId);
      updatedRoadmap.updatedAt = new Date().toISOString();
      
      // Update both states
      setCurrentRoadmap(updatedRoadmap);
      setRoadmaps(prevRoadmaps => 
        prevRoadmaps.map(roadmap => 
          roadmap.id === currentRoadmap.id ? updatedRoadmap : roadmap
        )
      );
    }
  };

  // Update a topic's resource
  const updateTopicResource = (topicId, resource) => {
    if (!currentRoadmap) return null;
    
    try {
      const updatedTopics = currentRoadmap.topics.map(topic => {
        if (topic.id === topicId) {
          // Create resources array if it doesn't exist
          const resources = topic.resources || [];
          
          // Check if we're updating an existing resource or adding a new one
          if (resources.length > 0) {
            // Update existing resource
            return {
              ...topic,
              resources: [
                {
                  ...resources[0],
                  ...resource,
                  id: resources[0].id // Preserve the ID
                }
              ]
            };
          } else {
            // Add new resource
            return {
              ...topic,
              resources: [
                {
                  ...resource,
                  id: Date.now() // Generate new ID
                }
              ]
            };
          }
        }
        return topic;
      });
      
      // Update roadmap with new topics
      const updatedRoadmap = {
        ...currentRoadmap,
        topics: updatedTopics,
        updatedAt: new Date().toISOString()
      };
      
      setCurrentRoadmap(updatedRoadmap);
      
      return resource;
    } catch (error) {
      console.error('Error updating topic resource:', error);
      return null;
    }
  };

  // Save the current roadmap to the server
  const saveRoadmap = async () => {
    if (!currentRoadmap) return null;
    if (!isAuthenticated) {
      setSaveError('You must be logged in to save roadmaps');
      return null;
    }
    
    try {
      setIsSaving(true);
      setSaveError(null);
      
      // Check if this roadmap already exists in saved roadmaps (by ID)
      const existingSavedRoadmap = savedRoadmaps.find(r => r.id === currentRoadmap.id);
      
      let response;
      if (existingSavedRoadmap && existingSavedRoadmap._id) {
        // Update existing roadmap
        response = await updateCustomRoadmap(existingSavedRoadmap._id, currentRoadmap);
      } else {
        // Save new roadmap
        response = await saveCustomRoadmap(currentRoadmap);
      }
      
      if (response.data) {
        const savedData = response.data.data || response.data;
        
        // Update saved roadmaps list
        setSavedRoadmaps(prevSaved => {
          const newSaved = [...prevSaved];
          const index = newSaved.findIndex(r => r.id === currentRoadmap.id || r._id === savedData._id);
          
          if (index !== -1) {
            newSaved[index] = savedData;
          } else {
            newSaved.push(savedData);
          }
          
          return newSaved;
        });
        
        // Update current roadmap with server data
        setCurrentRoadmap(savedData);
        
        return savedData;
      }
    } catch (error) {
      console.error('Error saving roadmap:', error);
      setSaveError(error.message || 'Failed to save roadmap');
    } finally {
      setIsSaving(false);
    }
    
    return null;
  };

  // Load a saved roadmap and set it as current
  const loadSavedRoadmap = (roadmapId) => {
    const roadmap = savedRoadmaps.find(r => r.id === roadmapId || r._id === roadmapId);
    
    if (roadmap) {
      setCurrentRoadmap(roadmap);
      return roadmap;
    }
    
    return null;
  };

  // Delete a saved roadmap
  const deleteSavedRoadmap = async (roadmapId) => {
    try {
      await deleteCustomRoadmap(roadmapId);
      
      // Remove from saved roadmaps list
      setSavedRoadmaps(prevSaved => prevSaved.filter(r => r.id !== roadmapId && r._id !== roadmapId));
      
      // If this was the current roadmap, clear it
      if (currentRoadmap && (currentRoadmap.id === roadmapId || currentRoadmap._id === roadmapId)) {
        setCurrentRoadmap(null);
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting saved roadmap:', error);
      return false;
    }
  };

  // Export roadmap as JSON
  const exportRoadmap = (roadmapId = null) => {
    const roadmap = roadmapId 
      ? roadmaps.find(r => r.id === roadmapId) 
      : currentRoadmap;
    
    if (!roadmap) return null;
    
    return JSON.stringify(roadmap, null, 2);
  };

  // Reset current roadmap state (used when navigating away from edit pages)
  const resetCurrentRoadmap = () => {
    console.log("Resetting current roadmap state");
    setCurrentRoadmap(null);
    setSaveError(null);
    setIsSaving(false);
  };

  const value = {
    roadmaps,
    currentRoadmap,
    savedRoadmaps,
    isSaving,
    isLoading,
    saveError,
    setCurrentRoadmap,
    createRoadmap,
    updateRoadmap,
    deleteRoadmap,
    addTopic,
    removeTopic,
    reorderTopics,
    addResource,
    removeResource,
    updateTopicResource,
    exportRoadmap,
    saveRoadmap,
    loadSavedRoadmap,
    loadSavedRoadmaps,
    deleteSavedRoadmap,
    resetCurrentRoadmap,
  };

  return (
    <CustomRoadmapContext.Provider value={value}>
      {children}
    </CustomRoadmapContext.Provider>
  );
};

export default CustomRoadmapContext; 