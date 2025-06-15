import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FaPlus, FaTrash, FaArrowUp, FaArrowDown, FaSave, FaEdit } from 'react-icons/fa';
import { useCustomRoadmap } from '../context/CustomRoadmapContext';
import { useAuth } from '../context/AuthContext';
import { Link, useParams, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { updateCustomRoadmap } from '../services/customRoadmapService';

const CustomRoadmapPage = () => {
  // Get the roadmap ID from URL params and any state passed during navigation
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const passedRoadmap = location.state?.roadmap;

  const { 
    currentRoadmap, 
    createRoadmap,
    addTopic, 
    removeTopic, 
    reorderTopics,
    setCurrentRoadmap,
    saveRoadmap,
    isSaving,
    saveError,
    loadSavedRoadmap,
    savedRoadmaps,
    exportRoadmap,
    resetCurrentRoadmap
  } = useCustomRoadmap();
  
  const { isAuthenticated } = useAuth();
  const [newTopic, setNewTopic] = useState('');
  const [roadmapName, setRoadmapName] = useState('My Custom Roadmap');
  const [roadmapDescription, setRoadmapDescription] = useState('');
  const [isCreatingRoadmap, setIsCreatingRoadmap] = useState(!currentRoadmap);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Use a ref to track if we've already processed the roadmap
  const hasProcessedRoadmap = useRef(false);

  // Load a saved roadmap when ID is provided
  useEffect(() => {
    // Only proceed if we haven't processed a roadmap yet
    if (hasProcessedRoadmap.current) {
      return;
    }
    
    if (id && savedRoadmaps.length > 0) {
      setIsLoading(true);
      // Try to find and load the roadmap
      const roadmap = loadSavedRoadmap(id);
      if (roadmap) {
        hasProcessedRoadmap.current = true;
        setIsCreatingRoadmap(false);
        setIsEditing(true); // Set editing mode for existing roadmaps
        setIsLoading(false);
      } else {
        toast.error(`Couldn't find the roadmap with ID: ${id}`);
        navigate('/custom-roadmap');
      }
    } else if (passedRoadmap && !hasProcessedRoadmap.current) {
      // If a roadmap was passed via state, use it
      console.log("Received roadmap to edit:", passedRoadmap);
      
      // Ensure topics have proper structure with unique IDs
      const formattedRoadmap = {
        ...passedRoadmap,
        // Make sure we're using the right ID format
        id: passedRoadmap._id || passedRoadmap.id || Date.now(),
        // Always set custom flag
        isCustom: true,
        // Ensure topics have proper structure and IDs
        topics: Array.isArray(passedRoadmap.topics) 
          ? passedRoadmap.topics.map((topic, index) => ({
              ...topic,
              // Ensure each topic has an ID that's a number
              id: topic.id || Date.now() + index,
              // Make sure topics have a title property
              title: topic.title || topic.name || `Topic ${index + 1}`,
              // Initialize resources array if needed
              resources: topic.resources || []
            }))
          : []
      };
      
      console.log("Formatted roadmap for editing:", formattedRoadmap);
      setCurrentRoadmap(formattedRoadmap);
      setIsEditing(true); // Set editing mode for passed roadmaps
      hasProcessedRoadmap.current = true;
      setIsCreatingRoadmap(false);
    }
  }, [id, savedRoadmaps, passedRoadmap, loadSavedRoadmap, navigate, setCurrentRoadmap]);

  // Initialize component on mount
  useEffect(() => {
    // If there's no current roadmap and we're not already in creation mode, 
    // set it to creation mode
    if (!currentRoadmap && !isCreatingRoadmap && !id && !passedRoadmap) {
      console.log("Initializing CustomRoadmapPage - setting to creation mode");
      setIsCreatingRoadmap(true);
    }
  }, []);

  // Show toast message when save errors occur
  useEffect(() => {
    if (saveError) {
      toast.error(saveError);
    }
  }, [saveError]);

  // Log when currentRoadmap changes with detailed analysis
  useEffect(() => {
    if (currentRoadmap) {
      console.log("Current roadmap updated:", currentRoadmap);
      
      // Check if topics exist and have proper structure
      if (!Array.isArray(currentRoadmap.topics)) {
        console.warn("WARNING: currentRoadmap.topics is not an array!", currentRoadmap.topics);
        } else {
        console.log(`Roadmap has ${currentRoadmap.topics.length} topics:`);
        currentRoadmap.topics.forEach((topic, index) => {
          console.log(`Topic ${index + 1}:`, {
            id: topic.id,
            title: topic.title,
            hasValidId: topic.id !== undefined && topic.id !== null
          });
        });
      }
      
      // If we have a roadmap but we're in creating state,
      // we need to switch to editing mode
      if (isCreatingRoadmap) {
        console.log("Roadmap created, switching to editing mode");
        setIsCreatingRoadmap(false);
      }
    } else {
      console.log("Current roadmap is null");
      
      // If we don't have a roadmap and we're not in creating state
      // and we don't have id or passedRoadmap, switch to creating mode
      if (!isCreatingRoadmap && !id && !passedRoadmap && !hasProcessedRoadmap.current) {
        console.log("No current roadmap, switching to creation mode");
        setIsCreatingRoadmap(true);
      }
    }
  }, [currentRoadmap, isCreatingRoadmap, id, passedRoadmap]);

  const handleCreateRoadmap = () => {
    if (roadmapName.trim()) {
      console.log("Creating new roadmap:", roadmapName, roadmapDescription);
      
      // Create the roadmap through the context function
      const newRoadmap = createRoadmap(roadmapName, roadmapDescription);
      console.log("New roadmap created:", newRoadmap);
      
      // Set state to editing mode for the new roadmap
      setIsCreatingRoadmap(false);
      hasProcessedRoadmap.current = true;
      
      toast.success("Roadmap created successfully! Add topics to your roadmap.");
    } else {
      toast.error("Please enter a roadmap name");
    }
  };

  const handleAddTopic = () => {
    if (newTopic.trim()) {
      console.log("Adding new topic:", newTopic);
      
      if (!currentRoadmap || !currentRoadmap.topics) {
        console.error("Cannot add topic: currentRoadmap or topics array is missing");
        toast.error("Error adding topic. Please try again.");
      return;
    }

      // Create the topic directly
      const newTopicObject = {
        id: Date.now(),
        title: newTopic,
        resources: []
      };
      
      // Update the current roadmap with the new topic
      const updatedRoadmap = {
        ...currentRoadmap,
        topics: [...currentRoadmap.topics, newTopicObject]
      };
      
      // Update the state directly
      setCurrentRoadmap(updatedRoadmap);
      console.log("Topic added, updated roadmap:", updatedRoadmap);
      
      // Clear input 
      setNewTopic('');
    }
  };

  const handleExport = () => {
    const roadmapJson = exportRoadmap();
    if (roadmapJson) {
      // Create a blob and download link
      const blob = new Blob([roadmapJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentRoadmap.name.replace(/\s+/g, '-').toLowerCase()}-roadmap.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleSaveRoadmap = async () => {
    if (!isAuthenticated) {
      toast.error("Please log in to save your roadmap");
      return;
    }

    if (!currentRoadmap.name) {
      toast.error("Please give your roadmap a name before saving");
      return;
    }

    try {
      console.log("Attempting to save roadmap:", currentRoadmap);
      const savedRoadmap = await saveRoadmap();
      if (savedRoadmap) {
        console.log("Roadmap saved successfully:", savedRoadmap);
        toast.success("Roadmap saved successfully!");
        
        // Navigate to the roadmap with its ID in the URL if it's a new save
        if (id !== savedRoadmap._id) {
          navigate(`/custom-roadmap/${savedRoadmap._id}`);
        }
      }
    } catch (error) {
      console.error("Error saving roadmap:", error);
      toast.error("Failed to save roadmap. Please try again.");
    }
  };

  // Add helper functions to better debug topic operations
  const handleRemoveTopic = (topicId) => {
    console.log("Removing topic with ID:", topicId);
    
    if (!currentRoadmap || !Array.isArray(currentRoadmap.topics)) {
      console.error("Cannot remove topic: currentRoadmap or topics array is missing");
      return;
    }
    
    // Filter out the topic
    const updatedTopics = currentRoadmap.topics.filter(topic => topic.id !== topicId);
    
    // Update the current roadmap
    const updatedRoadmap = {
      ...currentRoadmap,
      topics: updatedTopics
    };
    
    // Update the state directly
    setCurrentRoadmap(updatedRoadmap);
    console.log("Topic removed, updated roadmap:", updatedRoadmap);
  };
  
  const handleReorderTopics = (topicId, direction) => {
    console.log(`Reordering topic ${topicId} ${direction}`);
    
    if (!currentRoadmap || !Array.isArray(currentRoadmap.topics)) {
      console.error("Cannot reorder topics: currentRoadmap or topics array is missing");
      return;
    }
    
    const topics = [...currentRoadmap.topics];
    const currentIndex = topics.findIndex(topic => topic.id === topicId);
    
    if (currentIndex === -1) {
      console.error("Topic not found");
      return;
    }
    
    // Check if we can move in the requested direction
    if (
      (direction === 'up' && currentIndex > 0) ||
      (direction === 'down' && currentIndex < topics.length - 1)
    ) {
      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      
      // Remove the topic from its current position
      const [movedTopic] = topics.splice(currentIndex, 1);
      
      // Insert it at the new position
      topics.splice(newIndex, 0, movedTopic);
      
      // Update the current roadmap with the reordered topics
      const updatedRoadmap = {
        ...currentRoadmap,
        topics
  };

      // Update the state directly
      setCurrentRoadmap(updatedRoadmap);
      console.log("Topics reordered, updated roadmap:", updatedRoadmap);
    }
  };

  // Function to directly update a roadmap (bypassing the context to avoid creating new roadmaps)
  const handleUpdateRoadmap = async () => {
    if (!isAuthenticated) {
      toast.error("Please log in to update your roadmap");
      return;
    }

    if (!currentRoadmap || !currentRoadmap.name) {
      toast.error("Please give your roadmap a name before updating");
      return;
    }
    
    const roadmapId = currentRoadmap._id || id;
    if (!roadmapId) {
      toast.error("Cannot update roadmap: No valid ID found");
      return;
    }

    try {
      setIsUpdating(true);
      console.log(`Updating roadmap with ID ${roadmapId}:`, currentRoadmap);
      toast.loading("Updating your roadmap...");
      
      // Call the service directly to update
      const response = await updateCustomRoadmap(roadmapId, currentRoadmap);
      
      toast.dismiss();
      if (response && response.data) {
        console.log("Roadmap updated successfully:", response.data);
        toast.success("Roadmap updated successfully!");
        
        // Update the current roadmap with the response data
        setCurrentRoadmap(response.data);
      }
    } catch (error) {
      console.error("Error updating roadmap:", error);
      toast.error("Failed to update roadmap. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  // Reset the state when the component unmounts
  useEffect(() => {
    return () => {
      // Only perform cleanup when actually navigating away from the page
      // not during internal state changes
      if (window.location.pathname !== '/custom-roadmap') {
        console.log("Cleaning up CustomRoadmapPage state - navigating away");
        resetCurrentRoadmap();
        hasProcessedRoadmap.current = false;
      }
    };
  }, [resetCurrentRoadmap]);

  // Detect direct navigation to /custom-roadmap with no state
  useEffect(() => {
    // Only reset to creation mode if we're directly navigating to the page
    // with no state and we haven't processed a roadmap yet
    const shouldResetToCreationMode = 
      !id && 
      !passedRoadmap && 
      !hasProcessedRoadmap.current && 
      !isCreatingRoadmap &&
      !currentRoadmap;
      
    if (shouldResetToCreationMode) {
      console.log("Clean navigation to CustomRoadmapPage - resetting to creation mode");
      resetCurrentRoadmap();
      setIsCreatingRoadmap(true);
      setIsEditing(false);
      setIsLoading(false);
    }
  }, [id, passedRoadmap, isCreatingRoadmap, currentRoadmap, resetCurrentRoadmap]);

  // Function to reset everything and start fresh
  const handleStartFresh = () => {
    console.log("Starting fresh - creating new roadmap");
    
    // Reset state directly without navigation
    resetCurrentRoadmap();
    
    // Delay setting creation mode to ensure the resetCurrentRoadmap has taken effect
    setTimeout(() => {
      setIsCreatingRoadmap(true);
      setIsEditing(false);
      hasProcessedRoadmap.current = false;
      setNewTopic('');
      setRoadmapName('My Custom Roadmap');
      setRoadmapDescription('');
    }, 100);
    
    // Show feedback
    toast.success("Ready to create a new roadmap!");
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-xl">Loading roadmap...</p>
        </div>
      </div>
    );
  }

  if (isCreatingRoadmap) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
            Create Custom Roadmap
          </h1>
          
          <div className="p-6 bg-gray-800 rounded-lg shadow-lg">
            <div className="mb-4">
              <label htmlFor="roadmap-name" className="block text-sm font-medium mb-2">
                Roadmap Name
              </label>
              <input
                id="roadmap-name"
                type="text"
                value={roadmapName}
                onChange={(e) => setRoadmapName(e.target.value)}
                placeholder="Enter roadmap name"
                className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            
            <div className="mb-6">
              <label htmlFor="roadmap-description" className="block text-sm font-medium mb-2">
                Description (Optional)
              </label>
              <textarea
                id="roadmap-description"
                value={roadmapDescription}
                onChange={(e) => setRoadmapDescription(e.target.value)}
                placeholder="Enter a description for your roadmap"
                className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[100px]"
              />
            </div>
            
            <button
              onClick={handleCreateRoadmap}
              className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors flex items-center justify-center"
            >
              <FaPlus className="mr-2" /> Create & Continue to Topic Addition
            </button>

            <p className="mt-4 text-sm text-gray-400">
              After creating your roadmap, you'll be able to add topics and organize your learning path.
            </p>
          </div>

          <div className="mt-6 flex justify-center">
            <button
              onClick={() => navigate('/my-roadmaps')}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm"
            >
              Back to My Roadmaps
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-2 text-center bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
          {currentRoadmap?.name || 'Custom Learning Roadmap'}
        </h1>
        
        {currentRoadmap?.description && (
          <p className="text-center text-gray-400 mb-8">
            {currentRoadmap.description}
          </p>
        )}
        
        <div className="mb-10 p-6 bg-gray-800 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">Add New Topic</h2>
          <div className="flex gap-4">
            <input
              type="text"
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              placeholder="Enter a topic (e.g., React Basics, CSS Grid, etc.)"
              className="flex-grow p-3 rounded-lg bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick={handleAddTopic}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg flex items-center gap-2 transition-colors"
            >
              <FaPlus /> Add Topic
            </button>
          </div>
        </div>

        {currentRoadmap?.topics?.length > 0 ? (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold mb-4">Your Custom Roadmap</h2>
            
            {currentRoadmap.topics.map((topic, index) => (
              <motion.div
                key={topic.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-gray-800 rounded-lg shadow-lg overflow-hidden"
              >
                <div className="p-6 flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-medium">
                      {index + 1}. {topic.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleReorderTopics(topic.id, 'up')}
                      disabled={index === 0}
                      className={`p-2 rounded-full ${index === 0 ? 'text-gray-600' : 'hover:bg-gray-700'}`}
                      title="Move up"
                    >
                      <FaArrowUp />
                    </button>
                    <button
                      onClick={() => handleReorderTopics(topic.id, 'down')}
                      disabled={index === currentRoadmap.topics.length - 1}
                      className={`p-2 rounded-full ${index === currentRoadmap.topics.length - 1 ? 'text-gray-600' : 'hover:bg-gray-700'}`}
                      title="Move down"
                    >
                      <FaArrowDown />
                    </button>
                    <button
                      onClick={() => handleRemoveTopic(topic.id)}
                      className="p-2 rounded-full hover:bg-red-700 text-red-500 hover:text-white"
                      title="Remove topic"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center p-12 bg-gray-800 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">Your roadmap is empty</h2>
            <p className="text-gray-400 mb-6">
              Start by adding topics to your custom learning roadmap. 
            </p>
          </div>
        )}

        {currentRoadmap?.topics?.length > 0 && (
          <div className="mt-10 p-6 bg-gray-800 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">Roadmap Options</h2>
            <div className="flex flex-wrap gap-4">
              {isEditing ? (
                <button
                  onClick={handleUpdateRoadmap}
                  disabled={isUpdating}
                  className={`px-6 py-3 rounded-lg flex items-center gap-2 transition-colors ${
                    isAuthenticated 
                      ? 'bg-blue-600 hover:bg-blue-700' 
                      : 'bg-gray-600 cursor-not-allowed'
                  }`}
                  title={isAuthenticated ? 'Update your roadmap' : 'Log in to update roadmaps'}
                >
                  {isUpdating ? (
                    <>
                      <span className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent"></span>
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <FaEdit />
                      <span>Update Roadmap</span>
                    </>
                  )}
                </button>
              ) : (
              <button
                onClick={handleSaveRoadmap}
                disabled={isSaving}
                className={`px-6 py-3 rounded-lg flex items-center gap-2 transition-colors ${
                  isAuthenticated 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-gray-600 cursor-not-allowed'
                }`}
                title={isAuthenticated ? 'Save your roadmap' : 'Log in to save roadmaps'}
              >
                {isSaving ? (
                  <>
                    <span className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent"></span>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <FaSave />
                    <span>Save Roadmap</span>
                  </>
                )}
              </button>
              )}

              <button
                onClick={handleExport}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2 transition-colors"
              >
                Export as JSON
              </button>
              
              <button
                onClick={() => navigate('/my-roadmaps')}
                className="px-6 py-3 bg-gray-600 hover:bg-gray-700 rounded-lg flex items-center gap-2 transition-colors"
              >
                Back to My Roadmaps
              </button>

              {isEditing && (
                <button
                  onClick={handleStartFresh}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <FaPlus className="mr-1" /> Create New Roadmap
                </button>
              )}
              
              {!isAuthenticated && (
                <Link
                  to="/login"
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg flex items-center gap-2 transition-colors"
                >
                  Login to Save
                </Link>
              )}
            </div>

            {!isAuthenticated && (
              <p className="mt-4 text-gray-400 text-sm">
                Note: You need to be logged in to save roadmaps to your account.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomRoadmapPage; 