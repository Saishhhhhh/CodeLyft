import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import HeroAnimation from '../components/HeroAnimation';
import { generateLearningRoadmap, generateRoadmapWithRetry } from '../services/groqService';
import { findBestVideoForTopic } from '../services/youtubeService';
import { saveGeneratedRoadmap, checkAuth, getRoadmap, downloadRoadmap, saveRoadmapToDatabase } from '../services/roadmapService';
import { saveRoadmapToJson, saveResourcesToJson } from '../services/exportService';
import { addYouTubeVideos, saveRoadmapWithResources, formatRoadmapForApi } from '../services/youtubeResourceService';
import { getCustomRoadmap } from '../services/customRoadmapService';
import { useAuth } from '../context/AuthContext';
import { useCustomRoadmap } from '../context/CustomRoadmapContext';
import { useTheme } from '../context/ThemeContext';
import { motion } from 'framer-motion';
import RoadmapLoadingState from '../components/roadmap/loading/RoadmapLoadingState';
import RoadmapErrorState from '../components/roadmap/error/RoadmapErrorState';
import RoadmapHeader from '../components/roadmap/header/RoadmapHeader';
import LearningPath from '../components/roadmap/sections/LearningPath';
import AdvancedChallenges from '../components/roadmap/sections/AdvancedChallenges';
import PracticeProjects from '../components/roadmap/sections/PracticeProjects';
import RoadmapFooter from '../components/roadmap/footer/RoadmapFooter';
import RoadmapActions from '../components/roadmap/actions/RoadmapActions';
import { toast } from 'react-hot-toast';
import Navbar from '../components/Navbar';
import { FaEdit } from 'react-icons/fa';
import ResourceLoadingModal from '../components/roadmap/modals/ResourceLoadingModal';
import { updateSharedResources } from '../services/resourceCache';
import UserResourceManager from '../components/UserResourceManager';
import useChatbotContext from '../hooks/useChatbotContext';
import ChatbotWrapper from '../components/chatbot/ChatbotWrapper';
import useRoadmapData from '../hooks/useRoadmapData';
import useResourceManagement from '../hooks/useResourceManagement';
import axios from 'axios';

const RoadmapResultPage = ({ fromSaved = false, isCustom = false }) => {
  const [editMode, setEditMode] = useState(false);
  const [showUserResourceManager, setShowUserResourceManager] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { savedRoadmaps } = useCustomRoadmap();
  const { id } = useParams(); // Get roadmap ID from URL for fromSaved mode
  const location = useLocation();
  const { darkMode } = useTheme();
  
  // Define colors based on theme - Using the provided color palette
  const colors = {
    // Primary and accent colors
    primary: darkMode ? '#6366F1' : '#4F46E5', // Indigo - main brand color
    secondary: darkMode ? '#F43F5E' : '#DA2C38', // YouTube Red - accent color
    accent: darkMode ? '#A78BFA' : '#8B5CF6', // Purple - complementary accent
    
    // Background colors
    background: darkMode ? '#0F172A' : '#F9F9F9', // Dark blue-black / Light Gray
    cardBg: darkMode ? '#1E293B' : '#FFFFFF', // Darker background / White
    
    // Text colors
    text: darkMode ? '#F1F5F9' : '#111827', // Light Gray / Dark Gray
    textMuted: darkMode ? '#CBD5E1' : '#6B7280', // Light gray / Medium gray
    
    // UI elements
    border: darkMode ? '#475569' : '#E5E7EB', // Medium-dark gray / Light gray
    codeBg: darkMode ? '#1E293B' : '#F3F4F6', // Dark blue-black / Light gray
    codeText: darkMode ? '#93C5FD' : '#4F46E5', // Light blue / Indigo
    shadow: darkMode ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.1)', // Shadows
  };

  // Use the roadmap data hook
  const {
    roadmap,
    setRoadmap,
    loading,
    error,
    retryCount,
    savedToDB,
    savingToDB,
    setSavedToDB,
    setSavingToDB,
    hasResources,
    saveRoadmap,
    handleRetry,
    isCustom: roadmapIsCustom
  } = useRoadmapData({
    fromSaved,
    isCustom,
    id,
    isAuthenticated
  });
  
  // Log the roadmap data for debugging
  useEffect(() => {
    if (roadmap) {
      console.log('Current roadmap data:', roadmap);
      console.log('Is custom?', roadmapIsCustom);
      console.log('Title displayed:', roadmap.title || roadmap.name);
    }
  }, [roadmap, roadmapIsCustom]);

  // Use the resource management hook
  const {
    loadingVideos,
    currentTopic,
    progressPercent,
    foundResources,
    showResourceLoadingModal,
    setLoadingVideos,
    setCurrentTopic,
    setProgressPercent,
    setFoundResources,
    setShowResourceLoadingModal,
    addYouTubeVideosToRoadmap
  } = useResourceManagement();

  // Update chatbot context with current roadmap data
  const chatbotContextData = useMemo(() => ({
    roadmap: roadmap ? {
      title: roadmap.title,
      description: roadmap.description,
      difficulty: roadmap.difficulty,
      estimatedHours: roadmap.estimatedHours,
      sections: roadmap.sections?.map(section => ({
        title: section.title,
        topics: section.topics?.map(topic => ({
          name: topic.name,
          description: topic.description
        }))
      }))
    } : null,
    topic: currentTopic || null,
    progress: {
      percent: progressPercent,
      hasResources: hasResources
    }
  }), [roadmap, currentTopic, progressPercent, hasResources]);

  useChatbotContext(
    chatbotContextData,
    [chatbotContextData]
  );

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

  const handleStartYouTubeJourney = () => {
    // Show user resource manager first
    setShowUserResourceManager(true);
  };

  const handleUserResourcesComplete = (updatedRoadmap) => {
    // Hide user resource manager
    setShowUserResourceManager(false);
    
    // Update roadmap with user-provided resources
    setRoadmap(updatedRoadmap);
    
    // Start adding YouTube videos for topics without user resources
    try {
      addYouTubeVideosToRoadmap(updatedRoadmap, updatedRoadmap, setRoadmap);
    } catch (error) {
      toast.error('Failed to find YouTube resources. Please try again.');
    }
  };

  const handleUserResourcesCancel = () => {
    // Hide user resource manager
    setShowUserResourceManager(false);
    
    // Start adding YouTube videos for all topics
    try {
      addYouTubeVideosToRoadmap(roadmap, null, setRoadmap);
    } catch (error) {
      toast.error('Failed to find YouTube resources. Please try again.');
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <RoadmapLoadingState />
        <ChatbotWrapper />
      </>
    );
  }

  if (error || !roadmap) {
    return (
      <>
        <Navbar />
        <RoadmapErrorState error={error} onRetry={handleRetry} />
        <ChatbotWrapper />
      </>
    );
  }

  // Show user resource manager if active
  if (showUserResourceManager) {
    return (
      <div className="min-h-screen relative overflow-hidden transition-colors duration-300" style={{ 
        backgroundColor: colors.background 
      }}>
        <Navbar />
        <HeroAnimation />
        <div className="max-w-7xl mx-auto px-4 pt-24 pb-16">
          <UserResourceManager 
            roadmap={roadmap} 
            onComplete={handleUserResourcesComplete} 
            onCancel={handleUserResourcesCancel} 
          />
        </div>
        <ChatbotWrapper />
      </div>
    );
  }

  return (
    <div className="min-h-screen transition-colors duration-300 relative overflow-hidden" style={{ 
      backgroundColor: colors.background 
    }}>
      {/* Background Elements */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Solid background color overlay */}
        <div 
          className="absolute inset-0"
          style={{ 
            backgroundColor: darkMode ? '#4F46E510' : '#4F46E508',
            opacity: 1
          }}
        />
      </div>

      <Navbar />
      <HeroAnimation />
      
      {/* YouTube Resources Loading Modal */}
      <ResourceLoadingModal 
        isOpen={showResourceLoadingModal}
        currentTopic={currentTopic}
        progressPercent={progressPercent}
        foundResources={foundResources}
      />
      
      <div className="pt-16 relative z-10">
        <div className="flex flex-col">
          <RoadmapHeader 
            title={roadmapIsCustom ? (roadmap.name || roadmap.title) : roadmap.title}
            description={roadmap.description}
            fromSaved={fromSaved}
            isCustom={roadmapIsCustom}
            editMode={editMode}
            setEditMode={setEditMode}
            hasResources={hasResources}
            savedToDB={savedToDB}
            savingToDB={savingToDB}
          />
        </div>
  
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="max-w-7xl mx-auto px-4 pt-0 pb-16 relative"
        >
          {/* Main Learning Path */}
          <LearningPath sections={roadmap.sections} editMode={editMode} isCustom={roadmap.isCustom} />

          {/* Advanced Challenges Section */}
          {roadmap.advancedTopics && roadmap.advancedTopics.length > 0 && (
            <AdvancedChallenges 
              challenges={roadmap.advancedTopics}
              editMode={editMode}
            />
          )}

          {/* Practice Projects Section */}
          {roadmap.projects && roadmap.projects.length > 0 && (
            <PracticeProjects 
              projects={roadmap.projects}
              editMode={editMode}
            />
          )}

          {/* Footer Section */}
          <RoadmapFooter 
            fromSaved={fromSaved}
            isCustom={roadmap.isCustom}
            onSave={saveRoadmap}
            onAddVideos={handleStartYouTubeJourney}
            loadingVideos={loadingVideos}
            savedToDB={savedToDB}
            savingToDB={savingToDB}
            roadmap={roadmap}
            hasResources={hasResources}
          />

          {/* Save Button - Only show for roadmaps without resources or if not already saved */}
          <RoadmapActions
            isAuthenticated={isAuthenticated}
            hasResources={hasResources}
            savedToDB={savedToDB}
            savingToDB={savingToDB}
            onSave={saveRoadmap}
            roadmapIsCustom={roadmapIsCustom}
          />
        </motion.div>
      </div>
      <ChatbotWrapper />
    </div>
  );
};

export default RoadmapResultPage; 