import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FaPlus, FaTrash, FaArrowUp, FaArrowDown, FaSave, FaEdit, FaGripVertical } from 'react-icons/fa';
import { useCustomRoadmap } from '../context/CustomRoadmapContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Link, useParams, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { updateCustomRoadmap } from '../services/customRoadmapService';
import Navbar from '../components/Navbar';
import HeroAnimation from '../components/HeroAnimation';

const CustomRoadmapPage = () => {
  // Get the roadmap ID from URL params and any state passed during navigation
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const passedRoadmap = location.state?.roadmap;
  const { darkMode } = useTheme();

  // Define colors based on theme - Using the provided color palette
  const colors = {
    // Primary and accent colors - Indigo Purple Theme
    primary: darkMode ? '#8B5CF6' : '#7C3AED', // Purple - main brand color
    secondary: darkMode ? '#6366F1' : '#4F46E5', // Indigo - secondary color
    accent: darkMode ? '#A78BFA' : '#8B5CF6', // Light Purple - complementary accent
    
    // Background colors
    background: darkMode ? '#0F172A' : '#F8FAFC', // Dark blue-black / Light slate
    cardBg: darkMode ? '#1E293B' : '#FFFFFF', // Darker background / White
    
    // Text colors
    text: darkMode ? '#F1F5F9' : '#1E293B', // Light Gray / Dark slate
    textMuted: darkMode ? '#CBD5E1' : '#64748B', // Light gray / Medium slate
    
    // UI elements
    border: darkMode ? '#475569' : '#E2E8F0', // Medium-dark gray / Light slate
    codeBg: darkMode ? '#1E293B' : '#F1F5F9', // Dark blue-black / Light slate
    codeText: darkMode ? '#93C5FD' : '#7C3AED', // Light blue / Purple
    shadow: darkMode ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.1)', // Shadows
  };

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
  const [draggedTopicId, setDraggedTopicId] = useState(null);
  const [dragOverTopicId, setDragOverTopicId] = useState(null);
  
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
    if (!roadmapName.trim()) {
      toast.error("Please enter a roadmap name");
      return;
    }
    
    if (!roadmapDescription.trim()) {
      toast.error("Please enter a roadmap description");
      return;
    }
    
    console.log("Creating new roadmap:", roadmapName, roadmapDescription);
    
    // Create the roadmap through the context function
    const newRoadmap = createRoadmap(roadmapName, roadmapDescription);
    console.log("New roadmap created:", newRoadmap);
    
    // Set state to editing mode for the new roadmap
    setIsCreatingRoadmap(false);
    hasProcessedRoadmap.current = true;
    
    toast.success("Roadmap created successfully! Add topics to your roadmap.");
  };

  const handleAddTopic = () => {
    const trimmedTopic = newTopic.trim();
    
    if (trimmedTopic) {
      console.log("Adding new topic:", trimmedTopic);
      
      if (!currentRoadmap || !currentRoadmap.topics) {
        console.error("Cannot add topic: currentRoadmap or topics array is missing");
        toast.error("Error adding topic. Please try again.");
        return;
      }

      // Create the topic directly with trimmed value
      const newTopicObject = {
        id: Date.now(),
        title: trimmedTopic,
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

  const handleSaveRoadmap = async () => {
    if (!isAuthenticated) {
      toast.error("Please log in to save your roadmap");
      return;
    }

    if (!currentRoadmap.name) {
      toast.error("Please give your roadmap a name before saving");
      return;
    }
    
    if (!currentRoadmap.description) {
      toast.error("Please provide a description for your roadmap before saving");
      return;
    }

    try {
      console.log("Attempting to save roadmap:", currentRoadmap);
      const savedRoadmap = await saveRoadmap();
      if (savedRoadmap) {
        console.log("Roadmap saved successfully:", savedRoadmap);
        toast.success("Roadmap saved successfully!");
        
        // Navigate to the roadmap result page with the saved roadmap
        navigate(`/roadmaps/${savedRoadmap._id}/view`, {
          state: { 
            roadmap: savedRoadmap,
            fromSaved: true,
            isCustom: true
          }
        });
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

  // Drag and drop handlers
  const handleDragStart = (e, topicId) => {
    setDraggedTopicId(topicId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', topicId);
  };

  const handleDragOver = (e, topicId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverTopicId(topicId);
  };

  const handleDragLeave = (e) => {
    setDragOverTopicId(null);
  };

  const handleDrop = (e, targetTopicId) => {
    e.preventDefault();
    setDragOverTopicId(null);
    
    if (draggedTopicId === targetTopicId) {
      return;
    }

    if (!currentRoadmap || !Array.isArray(currentRoadmap.topics)) {
      return;
    }

    const topics = [...currentRoadmap.topics];
    const draggedIndex = topics.findIndex(topic => topic.id === draggedTopicId);
    const targetIndex = topics.findIndex(topic => topic.id === targetTopicId);

    if (draggedIndex === -1 || targetIndex === -1) {
      return;
    }

    // Remove the dragged topic from its current position
    const [draggedTopic] = topics.splice(draggedIndex, 1);
    
    // Insert it at the target position
    topics.splice(targetIndex, 0, draggedTopic);

    // Update the current roadmap with the reordered topics
    const updatedRoadmap = {
      ...currentRoadmap,
      topics
    };

    // Update the state directly
    setCurrentRoadmap(updatedRoadmap);
    console.log("Topics reordered via drag and drop, updated roadmap:", updatedRoadmap);
  };

  const handleDragEnd = () => {
    setDraggedTopicId(null);
    setDragOverTopicId(null);
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
    
    if (!currentRoadmap.description) {
      toast.error("Please provide a description for your roadmap before updating");
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

  // Handle placeholder styling for theme changes
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .custom-roadmap-input::placeholder {
        color: ${colors.textMuted} !important;
      }
      .custom-roadmap-textarea::placeholder {
        color: ${colors.textMuted} !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, [colors.textMuted]);

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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen transition-colors duration-300" style={{ backgroundColor: colors.background }}>
        <Navbar />
        <HeroAnimation />
        <div className="pt-16 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 mx-auto mb-4" style={{ borderColor: colors.primary }}></div>
            <p className="text-xl" style={{ color: colors.text }}>Loading roadmap...</p>
          </div>
        </div>
      </div>
    );
  }

  if (isCreatingRoadmap) {
    return (
      <div className="min-h-screen transition-colors duration-300 relative overflow-hidden" style={{ backgroundColor: colors.background }}>
        {/* Background Elements */}
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
          <div 
            className="absolute inset-0"
            style={{ 
              backgroundColor: darkMode ? '#8B5CF610' : '#7C3AED08',
              opacity: 1
            }}
          />
        </div>

        <Navbar />
        <HeroAnimation />
        
        <div className="pt-16 relative z-10">
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="max-w-2xl mx-auto px-4 py-8"
          >
            <motion.div variants={cardVariants}>
              <h1 className="text-2xl md:text-4xl font-bold mb-6 md:mb-8 text-center bg-gradient-to-r from-indigo-400 to-purple-600 bg-clip-text text-transparent">
                Create Custom Roadmap
              </h1>
            </motion.div>
            
            <motion.div 
              variants={cardVariants}
              className="p-4 md:p-8 rounded-xl shadow-2xl"
              style={{ 
                backgroundColor: colors.cardBg,
                border: `1px solid ${colors.border}`,
                boxShadow: `0 20px 25px -5px ${colors.shadow}, 0 10px 10px -5px ${colors.shadow}`
              }}
            >
              <div className="mb-4 md:mb-6">
                <label htmlFor="roadmap-name" className="block text-sm font-medium mb-2 md:mb-3" style={{ color: colors.text }}>
                  Roadmap Name
                </label>
                <input
                  id="roadmap-name"
                  type="text"
                  value={roadmapName}
                  onChange={(e) => setRoadmapName(e.target.value)}
                  placeholder="Enter roadmap name"
                  className="w-full p-3 md:p-4 rounded-lg border focus:outline-none focus:ring-2 transition-all duration-200 custom-roadmap-input"
                  style={{ 
                    backgroundColor: colors.codeBg,
                    borderColor: colors.border,
                    color: colors.text,
                    focusRingColor: colors.primary
                  }}
                />
              </div>
              
              <div className="mb-6 md:mb-8">
                <label htmlFor="roadmap-description" className="block text-sm font-medium mb-2 md:mb-3" style={{ color: colors.text }}>
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="roadmap-description"
                  value={roadmapDescription}
                  onChange={(e) => setRoadmapDescription(e.target.value)}
                  placeholder="Enter a description for your roadmap"
                  required
                  className="w-full p-3 md:p-4 rounded-lg border focus:outline-none focus:ring-2 transition-all duration-200 min-h-[100px] md:min-h-[120px] resize-none custom-roadmap-textarea"
                  style={{ 
                    backgroundColor: colors.codeBg,
                    borderColor: colors.border,
                    color: colors.text,
                    focusRingColor: colors.primary
                  }}
                />
              </div>
              
              <button
                onClick={handleCreateRoadmap}
                className="w-full px-6 md:px-6 py-3 md:py-4 rounded-lg transition-all duration-200 flex items-center justify-center font-medium text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                style={{ 
                  backgroundColor: colors.primary,
                  boxShadow: `0 4px 14px 0 ${colors.primary}40`
                }}
              >
                <FaPlus className="mr-2 md:mr-3 text-base md:text-lg" /> 
                <span className="text-sm md:text-base">Create & Continue to Topic Addition</span>
              </button>

              <p className="mt-4 md:mt-6 text-sm text-center px-2" style={{ color: colors.textMuted }}>
                After creating your roadmap, you'll be able to add topics and organize your learning path.
              </p>
            </motion.div>

            <motion.div variants={cardVariants} className="mt-6 md:mt-8 flex justify-center">
              <button
                onClick={() => navigate('/my-roadmaps')}
                className="px-6 md:px-8 py-3 md:py-3 rounded-lg transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                style={{ 
                  backgroundColor: colors.codeBg,
                  color: colors.text,
                  border: `1px solid ${colors.border}`,
                  boxShadow: `0 4px 14px 0 ${colors.shadow}`
                }}
              >
                <span className="text-sm md:text-base">Back to My Roadmaps</span>
              </button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen transition-colors duration-300 relative overflow-hidden" style={{ backgroundColor: colors.background }}>
      {/* Background Elements */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute inset-0"
          style={{ 
            backgroundColor: darkMode ? '#8B5CF610' : '#7C3AED08',
            opacity: 1
          }}
        />
      </div>

      <Navbar />
      <HeroAnimation />
      
      <div className="pt-16 relative z-10">
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="max-w-6xl mx-auto px-4 py-8"
        >
          <motion.div variants={cardVariants} className="text-center mb-8 md:mb-12">
            <h1 className="text-2xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-indigo-400 to-purple-600 bg-clip-text text-transparent">
              {currentRoadmap?.name || 'Custom Learning Roadmap'}
            </h1>
            
            {currentRoadmap?.description && (
              <p className="text-base md:text-lg px-4" style={{ color: colors.textMuted }}>
                {currentRoadmap.description}
              </p>
            )}
          </motion.div>
          
          <motion.div 
            variants={cardVariants}
            className="mb-8 md:mb-12 p-4 md:p-8 rounded-xl shadow-2xl"
            style={{ 
              backgroundColor: colors.cardBg,
              border: `1px solid ${colors.border}`,
              boxShadow: `0 20px 25px -5px ${colors.shadow}, 0 10px 10px -5px ${colors.shadow}`
            }}
          >
            <h2 className="text-xl md:text-2xl font-semibold mb-4 md:mb-6" style={{ color: colors.text }}>Add New Topic</h2>
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
              <input
                type="text"
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                onBlur={(e) => setNewTopic(e.target.value.trim())}
                placeholder="Enter a topic (e.g., React Basics, CSS Grid, etc.)"
                className="flex-grow p-3 md:p-4 rounded-lg border focus:outline-none focus:ring-2 transition-all duration-200 custom-roadmap-input"
                style={{ 
                  backgroundColor: colors.codeBg,
                  borderColor: colors.border,
                  color: colors.text,
                  focusRingColor: colors.primary
                }}
              />
              <button
                onClick={handleAddTopic}
                className="px-6 md:px-8 py-3 md:py-4 rounded-lg flex items-center justify-center gap-2 md:gap-3 transition-all duration-200 font-medium text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                style={{ 
                  backgroundColor: colors.primary,
                  boxShadow: `0 4px 14px 0 ${colors.primary}40`
                }}
              >
                <FaPlus className="text-base md:text-lg" /> 
                <span className="hidden sm:inline">Add Topic</span>
                <span className="sm:hidden">Add</span>
              </button>
            </div>
          </motion.div>

          {currentRoadmap?.topics?.length > 0 ? (
            <motion.div variants={cardVariants} className="space-y-4 md:space-y-6 mb-8 md:mb-12">
              <h2 className="text-xl md:text-2xl font-semibold mb-4 md:mb-6" style={{ color: colors.text }}>Your Custom Roadmap</h2>
              
              {currentRoadmap.topics.map((topic, index) => (
                <motion.div
                  key={topic.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  draggable
                  onDragStart={(e) => handleDragStart(e, topic.id)}
                  onDragOver={(e) => handleDragOver(e, topic.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, topic.id)}
                  onDragEnd={handleDragEnd}
                  className={`p-4 md:p-6 rounded-xl shadow-lg overflow-hidden transition-all duration-200 hover:shadow-xl transform hover:-translate-y-1 cursor-move ${
                    draggedTopicId === topic.id ? 'opacity-50 scale-95' : ''
                  } ${
                    dragOverTopicId === topic.id && draggedTopicId !== topic.id 
                      ? 'ring-2 ring-purple-400 bg-purple-50 dark:bg-purple-900/20' 
                      : ''
                  }`}
                  style={{ 
                    backgroundColor: colors.cardBg,
                    border: `1px solid ${colors.border}`,
                    boxShadow: `0 10px 15px -3px ${colors.shadow}, 0 4px 6px -2px ${colors.shadow}`
                  }}
                >
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 md:gap-4">
                    <div className="flex items-center gap-3 md:gap-4">
                      <div 
                        className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-bold text-white text-sm md:text-base"
                        style={{ backgroundColor: colors.primary }}
                      >
                        {index + 1}
                      </div>
                      <div className="flex items-center gap-2 md:gap-3">
                        <FaGripVertical 
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors text-sm md:text-base"
                          style={{ color: colors.textMuted }}
                        />
                        <h3 className="text-lg md:text-xl font-medium" style={{ color: colors.text }}>
                          {topic.title}
                        </h3>
                      </div>
                    </div>
                    <div className="flex items-center justify-center sm:justify-end gap-1 md:gap-2">
                      <button
                        onClick={() => handleReorderTopics(topic.id, 'up')}
                        disabled={index === 0}
                        className={`p-2 md:p-3 rounded-full transition-all duration-200 ${
                          index === 0 
                            ? 'opacity-50 cursor-not-allowed' 
                            : 'hover:bg-gray-100 dark:hover:bg-gray-700 transform hover:scale-110'
                        }`}
                        style={{ color: colors.textMuted }}
                        title="Move up"
                      >
                        <FaArrowUp className="text-sm md:text-base" />
                      </button>
                      <button
                        onClick={() => handleReorderTopics(topic.id, 'down')}
                        disabled={index === currentRoadmap.topics.length - 1}
                        className={`p-2 md:p-3 rounded-full transition-all duration-200 ${
                          index === currentRoadmap.topics.length - 1 
                            ? 'opacity-50 cursor-not-allowed' 
                            : 'hover:bg-gray-100 dark:hover:bg-gray-700 transform hover:scale-110'
                        }`}
                        style={{ color: colors.textMuted }}
                        title="Move down"
                      >
                        <FaArrowDown className="text-sm md:text-base" />
                      </button>
                      <button
                        onClick={() => handleRemoveTopic(topic.id)}
                        className="p-2 md:p-3 rounded-full transition-all duration-200 hover:bg-red-100 dark:hover:bg-red-900 transform hover:scale-110"
                        style={{ color: '#EF4444' }}
                        title="Remove topic"
                      >
                        <FaTrash className="text-sm md:text-base" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div 
              variants={cardVariants}
              className="text-center p-12 rounded-xl shadow-2xl mb-12"
              style={{ 
                backgroundColor: colors.cardBg,
                border: `1px solid ${colors.border}`,
                boxShadow: `0 20px 25px -5px ${colors.shadow}, 0 10px 10px -5px ${colors.shadow}`
              }}
            >
              <h2 className="text-2xl font-semibold mb-4" style={{ color: colors.text }}>Your roadmap is empty</h2>
              <p className="text-lg mb-6" style={{ color: colors.textMuted }}>
                Start by adding topics to your custom learning roadmap. 
              </p>
            </motion.div>
          )}

          {currentRoadmap?.topics?.length > 0 && (
            <motion.div variants={cardVariants} className="flex flex-col sm:flex-row flex-wrap gap-3 md:gap-4 justify-center">
              {isEditing ? (
                <button
                  onClick={handleUpdateRoadmap}
                  disabled={isUpdating}
                  className={`px-6 md:px-8 py-3 md:py-4 rounded-lg flex items-center justify-center gap-2 md:gap-3 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 ${
                    isAuthenticated 
                      ? 'text-white' 
                      : 'opacity-50 cursor-not-allowed'
                  }`}
                  style={{ 
                    backgroundColor: isAuthenticated ? colors.primary : colors.codeBg,
                    boxShadow: isAuthenticated ? `0 4px 14px 0 ${colors.primary}40` : `0 4px 14px 0 ${colors.shadow}`
                  }}
                  title={isAuthenticated ? 'Update your roadmap' : 'Log in to update roadmaps'}
                >
                  {isUpdating ? (
                    <>
                      <span className="animate-spin h-4 w-4 md:h-5 md:w-5 border-2 border-white rounded-full border-t-transparent"></span>
                      <span className="text-sm md:text-base">Updating...</span>
                    </>
                  ) : (
                    <>
                      <FaEdit className="text-base md:text-lg" />
                      <span className="text-sm md:text-base">Update Roadmap</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleSaveRoadmap}
                  disabled={isSaving}
                  className={`px-6 md:px-8 py-3 md:py-4 rounded-lg flex items-center justify-center gap-2 md:gap-3 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 ${
                    isAuthenticated 
                      ? 'text-white' 
                      : 'opacity-50 cursor-not-allowed'
                  }`}
                  style={{ 
                    backgroundColor: isAuthenticated ? colors.primary : colors.codeBg,
                    boxShadow: isAuthenticated ? `0 4px 14px 0 ${colors.primary}40` : `0 4px 14px 0 ${colors.shadow}`
                  }}
                  title={isAuthenticated ? 'Save your roadmap' : 'Log in to save roadmaps'}
                >
                  {isSaving ? (
                    <>
                      <span className="animate-spin h-4 w-4 md:h-5 md:w-5 border-2 border-white rounded-full border-t-transparent"></span>
                      <span className="text-sm md:text-base">Saving...</span>
                    </>
                  ) : (
                    <>
                      <FaSave className="text-base md:text-lg" />
                      <span className="text-sm md:text-base">Save Roadmap</span>
                    </>
                  )}
                </button>
              )}

              <button
                onClick={() => navigate('/my-roadmaps')}
                className="px-6 md:px-8 py-3 md:py-4 rounded-lg flex items-center justify-center gap-2 md:gap-3 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                style={{ 
                  backgroundColor: colors.codeBg,
                  color: colors.text,
                  border: `1px solid ${colors.border}`,
                  boxShadow: `0 4px 14px 0 ${colors.shadow}`
                }}
              >
                <span className="text-sm md:text-base">Back to My Roadmaps</span>
              </button>
              
              {!isAuthenticated && (
                <Link
                  to="/login"
                  className="px-6 md:px-8 py-3 md:py-4 rounded-lg flex items-center justify-center gap-2 md:gap-3 transition-all duration-200 font-medium text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  style={{ 
                    backgroundColor: colors.primary,
                    boxShadow: `0 4px 14px 0 ${colors.primary}40`
                  }}
                >
                  <span className="text-sm md:text-base">Login to Save</span>
                </Link>
              )}
            </motion.div>
          )}

          {!isAuthenticated && currentRoadmap?.topics?.length > 0 && (
            <motion.div variants={cardVariants} className="mt-6 text-center">
              <p className="text-sm" style={{ color: colors.textMuted }}>
                Note: You need to be logged in to save roadmaps to your account.
              </p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default CustomRoadmapPage; 