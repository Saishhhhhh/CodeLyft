import React, { useState } from 'react';
import { FaYoutube, FaPlus, FaInfoCircle, FaArrowRight, FaUser, FaRobot } from 'react-icons/fa';
import UserResourceInput from './UserResourceInput';
import UserResourceDisplay from './UserResourceDisplay';
import useResourceManagement from '../hooks/useResourceManagement';
import { useTheme } from '../context/ThemeContext';
import { useResourceModal } from '../context/ResourceModalContext';

/**
 * Component for managing user resources for topics before adding YouTube videos
 */
const UserResourceManager = ({ roadmap, onRoadmapUpdate }) => {
  const [showInput, setShowInput] = useState(false);
  const [showMainSection, setShowMainSection] = useState(true);
  const [roadmapWithUserResources, setRoadmapWithUserResources] = useState(null);
  const [currentTopicIndex, setCurrentTopicIndex] = useState(0);
  const [completedTopics, setCompletedTopics] = useState(new Set());
  const [skippedTopics, setSkippedTopics] = useState(new Set());
  const [addedResources, setAddedResources] = useState(new Set());
  const { darkMode } = useTheme();
  const { openModal, updateModalData } = useResourceModal();
  
  // Define colors based on theme
  const colors = {
    primary: darkMode ? '#4F46E5' : '#4F46E5', // Indigo - main brand color
    secondary: darkMode ? '#DA2C38' : '#DA2C38', // YouTube Red - accent color
    accent: darkMode ? '#8B5CF6' : '#8B5CF6', // Purple - complementary accent
    
    // Background colors
    background: darkMode ? '#111827' : '#F9F9F9', // Dark Gray / Light Gray
    cardBg: darkMode ? '#1E293B' : '#FFFFFF', // Darker background / White
    
    // Text colors
    text: darkMode ? '#F9F9F9' : '#111827', // Light Gray / Dark Gray
    textMuted: darkMode ? '#94A3B8' : '#6B7280', // Light gray / Medium gray
    
    // UI elements
    border: darkMode ? '#334155' : '#E5E7EB', // Medium-dark gray / Light gray
    shadow: darkMode ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.1)', // Shadows
  };
  
  const {
    loadingVideos,
    currentTopic,
    progressPercent,
    foundResources,
    estimatedTimeRemaining,
    currentPlaylist,
    currentVideo,
    totalTopics,
    processedTopics,
    addYouTubeVideosToRoadmap,
    resetState
  } = useResourceManagement();

  // Get all topics from the roadmap
  const getAllTopics = () => {
    const currentRoadmap = roadmapWithUserResources || roadmap;
    const topics = [];
    
    if (currentRoadmap?.sections) {
      currentRoadmap.sections.forEach(section => {
        if (section.topics) {
          section.topics.forEach(topic => {
            // Avoid duplication if section title and topic title are the same
            const fullTitle = section.title === topic.title ? 
              topic.title : 
              `${section.title}: ${topic.title}`;
            
            topics.push({
              ...topic,
              sectionTitle: section.title,
              fullTitle: fullTitle
            });
          });
        }
      });
    } else if (currentRoadmap?.topics) {
      currentRoadmap.topics.forEach(topic => {
        topics.push({
          ...topic,
          fullTitle: topic.title
        });
      });
    }
    
    return topics;
  };

  const topics = getAllTopics();
  const currentTopicData = topics[currentTopicIndex];

  const handleAddYouTubeResources = async () => {
    try {
      const targetRoadmap = roadmapWithUserResources || roadmap;
      
      // Calculate total topics that need resources
      let totalTopicsCount = 0;
      targetRoadmap.sections.forEach(section => {
        section.topics.forEach(topic => {
          if (!topic.hasUserResource) {
            totalTopicsCount++;
          }
        });
      });
      
      // Open the global modal
      openModal({
        currentTopic: '',
        progressPercent: 0,
        foundResources: [],
        estimatedTimeRemaining: 'Calculating...',
        currentPlaylist: '',
        currentVideo: '',
        totalTopics: totalTopicsCount,
        processedTopics: 0
      });
      
      await addYouTubeVideosToRoadmap(targetRoadmap, roadmapWithUserResources, (updatedRoadmap) => {
        setRoadmapWithUserResources(updatedRoadmap);
        if (onRoadmapUpdate) {
          onRoadmapUpdate(updatedRoadmap);
        }
      });
    } catch (error) {
      console.error('Error adding YouTube resources:', error);
      // On error, also close the modal
      updateModalData({ 
        isProcessing: false,
        isOpen: false,
        isMinimized: false
      });
      localStorage.removeItem('resourceModalMinimized');
      localStorage.removeItem('resourceModalProcessing');
    }
  };

  const handleCloseModal = () => {
    setShowInput(false);
    setShowMainSection(true);
  };

  const handleResourceAdded = (resource) => {
    // Mark current topic as completed and added resource
    const newCompletedTopics = new Set(completedTopics);
    const newAddedResources = new Set(addedResources);
    newCompletedTopics.add(currentTopicIndex);
    newAddedResources.add(currentTopicIndex);
    setCompletedTopics(newCompletedTopics);
    setAddedResources(newAddedResources);
    
    // Update roadmap with the new resource
    const currentRoadmap = roadmapWithUserResources || roadmap;
    const updatedRoadmap = { ...currentRoadmap };
    
    // Add resource to the current topic
    if (updatedRoadmap.sections) {
      let topicFound = false;
      updatedRoadmap.sections.forEach(section => {
        section.topics.forEach(topic => {
          if (topic.title === currentTopicData.title && section.title === currentTopicData.sectionTitle) {
            // Store the original resource data
            topic.video = resource;
            topic.hasUserResource = true;
            
            // Process duration to ensure it's a number
            let duration = 0;
            if (typeof resource.duration === 'string') {
              if (resource.duration.includes(':')) {
                const parts = resource.duration.split(':').map(part => parseInt(part) || 0);
                if (parts.length === 3) { // HH:MM:SS
                  duration = parts[0] * 3600 + parts[1] * 60 + parts[2];
                } else if (parts.length === 2) { // MM:SS
                  duration = parts[0] * 60 + parts[1];
                }
              } else {
                duration = parseInt(resource.duration) || 0;
              }
            } else if (typeof resource.duration === 'number') {
              duration = resource.duration;
            }
            
            // Format the resource in the API-compatible format based on type
            let formattedResource;
            
            if (resource.isPlaylist) {
              // Calculate total duration of videos in the playlist
              let totalDuration = 0;
              if (resource.videos && resource.videos.length > 0) {
                totalDuration = resource.videos.reduce((total, video) => {
                  let videoDuration = 0;
                  if (video.duration_seconds) {
                    videoDuration = video.duration_seconds;
                  } else if (video.duration && typeof video.duration === 'string' && video.duration.includes(':')) {
                    const parts = video.duration.split(':').map(part => parseInt(part) || 0);
                    if (parts.length === 3) { // HH:MM:SS
                      videoDuration = parts[0] * 3600 + parts[1] * 60 + parts[2];
                    } else if (parts.length === 2) { // MM:SS
                      videoDuration = parts[0] * 60 + parts[1];
                    }
                  }
                  return total + videoDuration;
                }, 0);
              }
              
              // Get thumbnail from first video if available
              const thumbnailUrl = resource.videos && resource.videos.length > 0 && resource.videos[0].id 
                ? `https://img.youtube.com/vi/${resource.videos[0].id}/mqdefault.jpg`
                : (resource.thumbnail || `https://img.youtube.com/vi/${resource.id}/mqdefault.jpg`);
              
              // Instead of adding the playlist as a single resource, add each video as a separate resource
              if (resource.videos && resource.videos.length > 0) {
                // Initialize resources array if it doesn't exist
                if (!topic.resources) {
                  topic.resources = [];
                }
                
                // Add each video as an individual resource
                resource.videos.forEach((video) => {
                  const videoThumbnail = video.thumbnail || 
                    (video.id ? `https://img.youtube.com/vi/${video.id}/mqdefault.jpg` : thumbnailUrl);
                  
                  const videoDuration = video.duration_seconds || 
                    (typeof video.duration === 'string' && video.duration.includes(':') ? 
                      (() => {
                        const parts = video.duration.split(':').map(part => parseInt(part) || 0);
                        if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
                        if (parts.length === 2) return parts[0] * 60 + parts[1];
                        return 0;
                      })() : 
                      (parseInt(video.duration) || 0));
                  
                  const formattedVideo = {
                    title: video.title,
                    url: video.url,
                    type: "video",
                    description: "",
                    thumbnailUrl: videoThumbnail,
                    source: video.channel?.name || video.channel || resource.channel || "Unknown",
                    duration: videoDuration,
                    isRequired: true
                  };
                  
                  topic.resources.push(formattedVideo);
                });
                
                // Update resource counts
                topic.totalResources = topic.resources.length;
                topic.completedResources = 0;
                topic.completedResourceIds = [];
                topic.hasGeneratedResources = true;
                
                console.log(`Added ${resource.videos.length} videos from playlist "${resource.title}" for "${topic.title}"`);
              } else {
                // Fallback if no videos are available - add playlist as a single resource
                // Initialize resources array if it doesn't exist
                if (!topic.resources) {
                  topic.resources = [];
                }
                
                // Format for playlist - use type "video" for backend compatibility
                const formattedResource = {
                  title: resource.title,
                  url: resource.url,
                  type: "video",
                  description: `Playlist with ${resource.videoCount || 0} videos`,
                  thumbnailUrl: thumbnailUrl,
                  source: resource.channel || "Unknown",
                  duration: totalDuration,
                  isRequired: true
                };
                
                // Add the resource to the resources array
                topic.resources.push(formattedResource);
                
                // Update resource counts
                topic.totalResources = topic.resources.length;
                topic.completedResources = 0;
                topic.completedResourceIds = [];
                topic.hasGeneratedResources = true;
                
                console.log(`Added playlist as single resource for "${topic.title}" (no videos available): ${resource.title}`);
              }
            } else {
              // Format for single video
              formattedResource = {
                title: resource.title,
                url: resource.url,
                type: "video",
                description: "",
                thumbnailUrl: resource.thumbnail || `https://img.youtube.com/vi/${resource.id}/mqdefault.jpg`,
                source: resource.channel || "User Provided",
                duration: duration,
                isRequired: true
              };
            }
            
            // Initialize resources array if it doesn't exist
            if (!topic.resources) {
              topic.resources = [];
            }
            
            // Add the resource to the resources array
            topic.resources.push(formattedResource);
            
            // Update resource counts
            topic.totalResources = topic.resources.length;
            topic.completedResources = 0;
            topic.completedResourceIds = [];
            topic.hasGeneratedResources = true;
            
            console.log(`Added user resource for "${topic.title}":`, formattedResource);
            
            topicFound = true;
          }
        });
      });
      
      if (!topicFound) {
        console.error('Topic not found for resource addition');
      }
    } else if (updatedRoadmap.topics) {
      const topic = updatedRoadmap.topics[currentTopicIndex];
      if (topic) {
        // Store the original resource data
        topic.video = resource;
        topic.hasUserResource = true;
        
        // Process duration to ensure it's a number
        let duration = 0;
        if (typeof resource.duration === 'string') {
          if (resource.duration.includes(':')) {
            const parts = resource.duration.split(':').map(part => parseInt(part) || 0);
            if (parts.length === 3) { // HH:MM:SS
              duration = parts[0] * 3600 + parts[1] * 60 + parts[2];
            } else if (parts.length === 2) { // MM:SS
              duration = parts[0] * 60 + parts[1];
            }
          } else {
            duration = parseInt(resource.duration) || 0;
          }
        } else if (typeof resource.duration === 'number') {
          duration = resource.duration;
        }
        
        // Format the resource in the API-compatible format based on type
        if (resource.isPlaylist) {
          // Calculate total duration of videos in the playlist
          let totalDuration = 0;
          if (resource.videos && resource.videos.length > 0) {
            totalDuration = resource.videos.reduce((total, video) => {
              let videoDuration = 0;
              if (video.duration_seconds) {
                videoDuration = video.duration_seconds;
              } else if (video.duration && typeof video.duration === 'string' && video.duration.includes(':')) {
                const parts = video.duration.split(':').map(part => parseInt(part) || 0);
                if (parts.length === 3) { // HH:MM:SS
                  videoDuration = parts[0] * 3600 + parts[1] * 60 + parts[2];
                } else if (parts.length === 2) { // MM:SS
                  videoDuration = parts[0] * 60 + parts[1];
                }
              }
              return total + videoDuration;
            }, 0);
          }
          
          // Get thumbnail from first video if available
          const thumbnailUrl = resource.videos && resource.videos.length > 0 && resource.videos[0].id 
            ? `https://img.youtube.com/vi/${resource.videos[0].id}/mqdefault.jpg`
            : (resource.thumbnail || `https://img.youtube.com/vi/${resource.id}/mqdefault.jpg`);
          
          // Instead of adding the playlist as a single resource, add each video as a separate resource
          if (resource.videos && resource.videos.length > 0) {
            // Initialize resources array if it doesn't exist
            if (!topic.resources) {
              topic.resources = [];
            }
            
            // Add each video as an individual resource
            resource.videos.forEach((video) => {
              const videoThumbnail = video.thumbnail || 
                (video.id ? `https://img.youtube.com/vi/${video.id}/mqdefault.jpg` : thumbnailUrl);
              
              const videoDuration = video.duration_seconds || 
                (typeof video.duration === 'string' && video.duration.includes(':') ? 
                  (() => {
                    const parts = video.duration.split(':').map(part => parseInt(part) || 0);
                    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
                    if (parts.length === 2) return parts[0] * 60 + parts[1];
                    return 0;
                  })() : 
                  (parseInt(video.duration) || 0));
              
              const formattedVideo = {
                title: video.title,
                url: video.url,
                type: "video",
                description: "",
                thumbnailUrl: videoThumbnail,
                source: video.channel?.name || video.channel || resource.channel || "Unknown",
                duration: videoDuration,
                isRequired: true
              };
              
              topic.resources.push(formattedVideo);
            });
            
            // Update resource counts
            topic.totalResources = topic.resources.length;
            topic.completedResources = 0;
            topic.completedResourceIds = [];
            topic.hasGeneratedResources = true;
            
            console.log(`Added ${resource.videos.length} videos from playlist "${resource.title}" for "${topic.title}"`);
          } else {
            // Fallback if no videos are available - add playlist as a single resource
            // Initialize resources array if it doesn't exist
            if (!topic.resources) {
              topic.resources = [];
            }
            
            // Format for playlist - use type "video" for backend compatibility
            const formattedResource = {
              title: resource.title,
              url: resource.url,
              type: "video",
              description: `Playlist with ${resource.videoCount || 0} videos`,
              thumbnailUrl: thumbnailUrl,
              source: resource.channel || "Unknown",
              duration: totalDuration,
              isRequired: true
            };
            
            // Add the resource to the resources array
            topic.resources.push(formattedResource);
            
            // Update resource counts
            topic.totalResources = topic.resources.length;
            topic.completedResources = 0;
            topic.completedResourceIds = [];
            topic.hasGeneratedResources = true;
            
            console.log(`Added playlist as single resource for "${topic.title}" (no videos available): ${resource.title}`);
          }
        } else {
          // Format for single video
          const formattedResource = {
            title: resource.title,
            url: resource.url,
            type: "video",
            description: "",
            thumbnailUrl: resource.thumbnail || `https://img.youtube.com/vi/${resource.id}/mqdefault.jpg`,
            source: resource.channel || "User Provided",
            duration: duration,
            isRequired: true
          };
          
          // Initialize resources array if it doesn't exist
          if (!topic.resources) {
            topic.resources = [];
          }
          
          // Add the resource to the resources array
          topic.resources.push(formattedResource);
          
          // Update resource counts
          topic.totalResources = topic.resources.length;
          topic.completedResources = 0;
          topic.completedResourceIds = [];
          topic.hasGeneratedResources = true;
          
          console.log(`Added user resource for "${topic.title}":`, formattedResource);
        }
      }
    }
    
    setRoadmapWithUserResources(updatedRoadmap);
    
    // Move to next topic or complete
    if (currentTopicIndex < topics.length - 1) {
      setCurrentTopicIndex(currentTopicIndex + 1);
      // Stay in input mode for next topic
    } else {
      // All topics completed, finish the process
      setShowInput(false);
      setShowMainSection(false);
      if (onRoadmapUpdate) {
        onRoadmapUpdate(updatedRoadmap);
      }
    }
  };

  const handleSkipTopic = () => {
    // Mark current topic as completed (skipped)
    const newCompletedTopics = new Set(completedTopics);
    const newSkippedTopics = new Set(skippedTopics);
    newCompletedTopics.add(currentTopicIndex);
    newSkippedTopics.add(currentTopicIndex);
    setCompletedTopics(newCompletedTopics);
    setSkippedTopics(newSkippedTopics);
    
    // Move to next topic or complete
    if (currentTopicIndex < topics.length - 1) {
      setCurrentTopicIndex(currentTopicIndex + 1);
      // Stay in input mode for next topic
    } else {
      // All topics completed, finish the process
      setShowInput(false);
      setShowMainSection(false);
      if (onRoadmapUpdate) {
        onRoadmapUpdate(roadmapWithUserResources || roadmap);
      }
    }
  };

  const handleAddMyOwnResources = () => {
    setShowMainSection(false);
    setShowInput(true);
    setCurrentTopicIndex(0);
    setCompletedTopics(new Set());
    setSkippedTopics(new Set());
    setAddedResources(new Set());
  };
  
  // Show completion state
  if (!showMainSection && !showInput) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="rounded-lg border shadow-sm" style={{ 
          backgroundColor: colors.cardBg,
          borderColor: colors.border
        }}>
          {/* Header */}
          <div className="p-6 rounded-t-lg" style={{ backgroundColor: colors.primary }}>
            <div className="text-center">
              <FaYoutube className="text-white text-3xl mx-auto mb-3" />
              <h2 className="text-xl font-bold text-white">Resources Added Successfully!</h2>
              <p className="text-white/80 text-sm mt-1">
                Your custom resources have been added to the roadmap
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            <div className="text-center">
              <p className="text-sm" style={{ color: colors.textMuted }}>
                You've added resources for {addedResources.size} topics and skipped {skippedTopics.size} topics.
                {topics.length > (addedResources.size + skippedTopics.size) && (
                  <span> AI will find resources for the remaining {topics.length - (addedResources.size + skippedTopics.size)} topics.</span>
                )}
        </p>
            </div>
            
        <div className="flex justify-center">
          <button
                onClick={handleAddYouTubeResources}
                disabled={loadingVideos}
                className="px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: loadingVideos ? colors.border : colors.accent,
                  color: loadingVideos ? colors.textMuted : '#FFFFFF',
                  boxShadow: loadingVideos ? 'none' : `0 2px 4px ${colors.shadow}`
                }}
              >
                <FaRobot className="text-sm" />
                <span>Find AI Resources for Remaining Topics</span>
          </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Show resource input section directly
  if (showInput) {
    // Get the current topic name for display
    let topicName = "this topic";
    
    if (currentTopicData) {
      topicName = currentTopicData.fullTitle || currentTopicData.title;
    }
  
  return (
      <div className="max-w-2xl mx-auto">
        <UserResourceInput
          roadmap={roadmapWithUserResources || roadmap}
          onClose={handleCloseModal}
          onResourceAdded={handleResourceAdded}
          onSkip={handleSkipTopic}
          topicTitle={topicName}
          currentTopicIndex={currentTopicIndex}
          totalTopics={topics.length}
        />
      </div>
    );
  }

  // Show main section
  return (
    <div className="max-w-2xl mx-auto">
      {/* Main Container */}
      <div className="rounded-lg border shadow-sm" style={{ 
        backgroundColor: colors.cardBg,
        borderColor: colors.border
      }}>
        {/* Header */}
        <div className="p-6 rounded-t-lg" style={{ backgroundColor: colors.primary }}>
          <div className="text-center">
            <FaYoutube className="text-white text-3xl mx-auto mb-3" />
            <h2 className="text-xl font-bold text-white">YouTube Learning Resources</h2>
            <p className="text-white/80 text-sm mt-1">
              Add high-quality videos and playlists to enhance your learning experience
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Progress indicator if topics have been completed */}
          {completedTopics.size > 0 && (
            <div className="p-4 rounded-lg" style={{ backgroundColor: `${colors.accent}10` }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: colors.text }}>
                    Progress: {completedTopics.size} of {topics.length} topics completed
                  </p>
                  <p className="text-xs" style={{ color: colors.textMuted }}>
                    {addedResources.size} with custom resources, {skippedTopics.size} skipped
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium" style={{ color: colors.accent }}>
                    {Math.round((completedTopics.size / topics.length) * 100)}%
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Choose Your Option - Simple and clear */}
          <div className="space-y-4">
            <h3 className="font-medium text-lg" style={{ color: colors.text }}>
              Choose Your Option
            </h3>
            <p className="text-sm" style={{ color: colors.textMuted }}>
              You have two options for adding resources to your roadmap:
            </p>
            
            <div className="space-y-4">
        <button
                onClick={handleAddMyOwnResources}
                className="w-full flex items-start space-x-3 p-4 rounded-lg transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] border-2"
                style={{ 
                  backgroundColor: `${colors.primary}10`,
                  borderColor: colors.primary,
                  boxShadow: `0 2px 4px ${colors.shadow}`
                }}
              >
                <div className="p-2 rounded flex-shrink-0" style={{ backgroundColor: colors.primary }}>
                  <FaUser className="text-white text-sm" />
                </div>
                <div className="text-left flex-1">
                  <h4 className="font-medium text-sm" style={{ color: colors.text }}>Custom Resources</h4>
                  <p className="text-sm mt-1" style={{ color: colors.textMuted }}>
                    Add your own YouTube videos or playlists that you know are helpful for certain topics. 
                    These will be prioritized over AI-found resources. You can choose which topics to add custom resources to.
                  </p>
                </div>
                <FaArrowRight className="text-sm flex-shrink-0" style={{ color: colors.primary }} />
        </button>
        
              <div className="text-center text-sm font-medium" style={{ color: colors.textMuted }}>
                or
              </div>
              
          <button
                onClick={handleAddYouTubeResources}
                disabled={loadingVideos}
                className="w-full flex items-start space-x-3 p-4 rounded-lg transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] border-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
                style={{ 
                  backgroundColor: `${colors.accent}10`,
                  borderColor: colors.accent,
                  boxShadow: `0 2px 4px ${colors.shadow}`
                }}
              >
                <div className="p-2 rounded flex-shrink-0" style={{ backgroundColor: colors.accent }}>
                  <FaRobot className="text-white text-sm" />
                </div>
                <div className="text-left flex-1">
                  <h4 className="font-medium text-sm" style={{ color: colors.text }}>AI-Found Resources</h4>
                  <p className="text-sm mt-1" style={{ color: colors.textMuted }}>
                    Let AI automatically find the best videos and playlists for topics 
                    you don't add custom resources to.
                  </p>
                </div>
                <FaArrowRight className="text-sm flex-shrink-0" style={{ color: colors.accent }} />
          </button>
            </div>
          </div>

          {/* Pro Tip - Important information */}
          <div className="p-3 rounded-lg border" style={{ 
            backgroundColor: `${colors.secondary}05`,
            borderColor: `${colors.secondary}30`
          }}>
            <div className="flex items-start space-x-2">
              <FaInfoCircle style={{ color: colors.secondary }} className="mt-0.5 flex-shrink-0 text-xs" />
              <div>
                <p className="text-xs font-medium mb-1" style={{ color: colors.text }}>
                  Pro Tip
                </p>
                <p className="text-xs" style={{ color: colors.textMuted }}>
                  Skip topics you don't want to add resources to manually. AI will automatically find 
                  the best YouTube videos and playlists for those topics instead.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Resource Display */}
        <div className="border-t" style={{ borderColor: colors.border }}>
          <UserResourceDisplay 
            roadmap={roadmapWithUserResources || roadmap}
            onRoadmapUpdate={handleResourceAdded}
          />
        </div>
      </div>
    </div>
  );
};

export default UserResourceManager; 