import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import HeroAnimation from '../components/HeroAnimation';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaArrowLeft, FaCalendarAlt, FaCheck, FaPlay, 
  FaBookmark, FaEdit, FaEye, FaFileDownload, FaFileExport, FaSave,
  FaComments, FaList, FaMarkdown, FaExpand
} from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { 
  saveRoadmapProgress, 
  loadRoadmapProgress, 
  getCompletedVideos,
  getRoadmap,
  downloadRoadmap,
  saveGeneratedRoadmap,
  updateRoadmapProgress,
  getVideoNotes,
  saveVideoNotes,
  deleteVideoNote
} from '../services/roadmapService';
import { toast } from 'react-hot-toast';
import VideoPlayerModal from '../components/roadmap/modals/VideoPlayerModal';
import NotesModal from '../components/roadmap/modals/NotesModal';
import { decodeUnicode, formatDuration, getChannelName } from '../components/roadmap/utils/videoUtils';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/home/Footer';
import useChatbotContext from '../hooks/useChatbotContext';
import ChatbotWrapper from '../components/chatbot/ChatbotWrapper';
import LoadingState from '../components/roadmap/sections/LoadingState';
import RoadmapHeader from '../components/roadmap/sections/RoadmapHeader';
import SavingNotification from '../components/roadmap/sections/SavingNotification';
import ActionButtons from '../components/roadmap/sections/ActionButtons';
import SectionHeader from '../components/roadmap/sections/SectionHeader';
import TopicSection from '../components/roadmap/sections/TopicSection';
import CelebrationModal from '../components/roadmap/modals/CelebrationModal';
import { triggerCelebration } from '../components/roadmap/utils/celebrationUtils';
import { checkAllVideosCompleted, groupSectionsBySharedResources } from '../components/roadmap/utils/progressUtils';
import { useTheme } from '../context/ThemeContext';
import PermanentVideoPlayer from '../components/roadmap/sections/PermanentVideoPlayer';
import RoadmapContent from '../components/roadmap/sections/RoadmapContent';
import VideoControls from '../components/roadmap/sections/VideoControls';
import RoadmapChatbot from '../components/roadmap/sections/RoadmapChatbot';
import RoadmapStats from '../components/roadmap/sections/RoadmapStats';

// Theme configuration
const useRoadmapTheme = (darkMode = false) => {
  return {
    // Primary and accent colors - Exactly matching HomePage
    primary: darkMode ? '#4F46E5' : '#4F46E5', // Indigo - main brand color
    secondary: darkMode ? '#DA2C38' : '#DA2C38', // YouTube Red - accent color
    accent: darkMode ? '#8B5CF6' : '#8B5CF6', // Purple - complementary accent
    
    // Background colors - Exactly matching HomePage
    background: darkMode ? '#111827' : '#F9F9F9', // Dark Gray / Light Gray
    cardBg: darkMode ? '#1E293B' : '#FFFFFF', // Darker background / White
    
    // Text colors - Exactly matching HomePage
    text: darkMode ? '#F9F9F9' : '#111827', // Light Gray / Dark Gray
    textMuted: darkMode ? '#94A3B8' : '#6B7280', // Light gray / Medium gray
    
    // UI elements - Exactly matching HomePage
    border: darkMode ? '#334155' : '#E5E7EB', // Medium-dark gray / Light gray
    codeBg: darkMode ? '#0F172A' : '#F3F4F6', // Dark blue-black / Light gray
    codeText: darkMode ? '#4F46E5' : '#4F46E5', // Indigo for consistency
    shadow: darkMode ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.1)', // Shadows
    
    // Status colors
    success: '#10B981', // Green
    warning: '#F59E0B', // Amber
    error: '#EF4444', // Red
    info: '#3B82F6', // Blue
    
    // Progress colors
    progressBg: darkMode ? '#1F2937' : '#F3F4F6',
    progressFill: '#4F46E5',
    progressText: darkMode ? '#F9F9F9' : '#111827',
    
    // Button colors
    buttonPrimary: '#4F46E5',
    buttonSecondary: '#8B5CF6',
    buttonText: '#FFFFFF',
    buttonHover: darkMode ? '#4338CA' : '#4338CA',
    
    // Modal colors
    modalBg: darkMode ? '#1E293B' : '#FFFFFF',
    modalOverlay: darkMode ? 'rgba(0, 0, 0, 0.75)' : 'rgba(0, 0, 0, 0.5)',
    
    // Card colors
    cardBorder: darkMode ? '#334155' : '#E5E7EB',
    cardHover: darkMode ? '#2D3748' : '#F9FAFB',
    
    // Animation colors
    animationPrimary: '#4F46E5',
    animationSecondary: '#8B5CF6',
    animationAccent: '#DA2C38'
  };
};

const RoadmapProgressPage = ({ fromSaved = false }) => {
  const navigate = useNavigate();
  const { id } = useParams(); // Get roadmap ID from URL for fromSaved mode
  const { darkMode } = useTheme(); // Add this line to get darkMode from ThemeContext
  const theme = useRoadmapTheme(darkMode); // Add this line to use the theme
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState({});
  const [completedVideos, setCompletedVideos] = useState({});
  const [videoNotes, setVideoNotes] = useState({});
  const [noteTimestamps, setNoteTimestamps] = useState({});
  const [editingNote, setEditingNote] = useState(null);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [currentNote, setCurrentNote] = useState('');
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [error, setError] = useState(null);
  const [savingToDB, setSavingToDB] = useState(false);
  const [savedToDB, setSavedToDB] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const [progressSummary, setProgressSummary] = useState({
    total: 0,
    completed: 0,
    percentage: 0
  });
  const [showSavedBadge, setShowSavedBadge] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [rightPanelView, setRightPanelView] = useState('content'); // 'content' or 'chatbot'
  const [showNotePreview, setShowNotePreview] = useState(false); // Toggle for markdown preview in quick notes

  // Check if the roadmap has resources
  const hasResources = useMemo(() => {
    if (!roadmap || !roadmap.sections) return false;
    
    return roadmap.sections.some(section => {
      return section.topics?.some(topic => 
        topic.video?.videos && topic.video.videos.length > 0
      );
    });
  }, [roadmap]);

  // Update chatbot context with current roadmap progress data
  const chatbotContextData = useMemo(() => ({
    roadmap: roadmap ? {
      title: roadmap.title,
      description: roadmap.description,
      isCustom: roadmap.isCustom || false
    } : null,
    topic: currentVideo ? {
      title: currentVideo.title,
      url: currentVideo.url,
      channel: currentVideo.channel
    } : null,
    progress: {
      percentage: progressSummary.percentage,
      completed: progressSummary.completed,
      total: progressSummary.total,
      hasResources: hasResources,
      completedVideos: Object.keys(completedVideos).length
    }
  }), [roadmap, currentVideo, progressSummary, completedVideos, hasResources]);

  useChatbotContext(
    chatbotContextData,
    [chatbotContextData]
  );

  useEffect(() => {
    if (fromSaved) {
      // Loading an existing roadmap from the database
      const fetchSavedRoadmap = async () => {
        try {
          setLoading(true);
          
          if (!id) {
            setError('Roadmap ID is missing');
            setLoading(false);
            return;
          }
          
          // Check for isCustom parameter in URL
          const urlParams = new URLSearchParams(window.location.search);
          const isCustom = urlParams.get('isCustom') === 'true';
          
          let response;
          try {
            // Use the regular roadmap service
            console.log('Fetching roadmap with ID:', id);
            response = await getRoadmap(id);
          } catch (fetchError) {
            console.error(`Error fetching roadmap:`, fetchError);
            setError('Failed to load the roadmap. Please try again.');
            setLoading(false);
            return;
          }
          
          const roadmapData = response.data;
          
          console.log('Roadmap data from server:', roadmapData);
          
          // Check if this roadmap has any topics with resources
          const hasResources = roadmapData.topics.some(topic => 
            topic.hasGeneratedResources && topic.resources && topic.resources.length > 0
          );
          
          if (!hasResources) {
            // Redirect to the view page if no resources available
            navigate(`/roadmaps/${id}/view`);
            return;
          }
          
          // First, create a map of resources by URL to identify shared resources
          const resourcesByUrl = new Map();
          roadmapData.topics.forEach(topic => {
            if (topic.resources && topic.resources.length > 0) {
              // Ensure totalResources is set correctly
              if (!topic.totalResources || topic.totalResources === 0) {
                topic.totalResources = topic.resources.length;
                console.log(`Setting totalResources for topic ${topic.title} to ${topic.resources.length}`);
              }
              
              topic.resources.forEach(resource => {
                if (!resourcesByUrl.has(resource.url)) {
                  resourcesByUrl.set(resource.url, []);
                }
                resourcesByUrl.get(resource.url).push({
                  topicId: topic._id,
                  topicTitle: topic.title,
                  resource
                });
              });
            }
          });
          
          // Convert to format expected by RoadmapProgressPage
          const formattedRoadmap = {
            title: roadmapData.title,
            description: roadmapData.description,
            isCustom: roadmapData.isCustom || false, // Preserve isCustom flag
            sections: roadmapData.topics.map(topic => {
              // Create a topic with videos from resources
              const videos = topic.resources ? topic.resources.map(resource => {
                // Use the MongoDB _id directly for the resource ID
                const resourceId = resource._id || 
                  `resource-${topic._id}-${resource.url.replace(/[^a-zA-Z0-9]/g, '-').substring(0, 20)}`;
                
                // Ensure duration is properly formatted
                let formattedDuration = 'Unknown';
                if (resource.duration) {
                  if (typeof resource.duration === 'number') {
                    const hours = Math.floor(resource.duration / 3600);
                    const minutes = Math.floor((resource.duration % 3600) / 60);
                    const seconds = resource.duration % 60;
                    
                    if (hours > 0) {
                      formattedDuration = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                    } else {
                      formattedDuration = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                    }
                  } else if (typeof resource.duration === 'string') {
                    formattedDuration = resource.duration;
                  }
                }
                
                return {
                  id: resourceId,
                  _id: resourceId, // Add _id field to match MongoDB structure
                title: resource.title,
                url: resource.url,
                channel: resource.source || 'YouTube',
                  duration: formattedDuration,
                  duration_seconds: resource.duration || 0,
                description: resource.description || '',
                thumbnail: resource.thumbnailUrl || `https://via.placeholder.com/120x68?text=${encodeURIComponent(resource.title)}`,
                sharedWith: resourcesByUrl.get(resource.url)?.length > 1 ? 
                  resourcesByUrl.get(resource.url)
                    .filter(item => item.topicId !== topic._id)
                    .map(item => item.topicTitle) : 
                  []
                };
              }) : [];
              
              return {
                title: topic.title,
                description: topic.description,
                progress: topic.completedResources > 0 ? 
                  (topic.completedResources === topic.totalResources ? 'completed' : 'in-progress') : 
                  'not-started',
                _id: topic._id,
                topics: [{
                  title: topic.title,
                  description: topic.description,
                  _id: topic._id, // Make sure _id is correctly passed
                  video: {
                    title: videos.length > 0 ? videos[0].title : topic.title,
                    isPlaylist: true,
                    videos: videos,
                    url: videos.length > 0 ? videos[0].url : null
                  }
                }]
              };
            })
          };
          
          console.log('Formatted roadmap for frontend:', formattedRoadmap);
          
          setRoadmap(formattedRoadmap);
          
          // Initialize progress tracking
          if (roadmapData.topics && roadmapData.topics.length > 0) {
            // Create completed videos map based on completedResourceIds
            const completedVideosFromServer = {};
            
            roadmapData.topics.forEach(topic => {
              if (topic.completedResourceIds && topic.completedResourceIds.length > 0) {
                // Mark each completed resource as completed
                topic.completedResourceIds.forEach(resourceId => {
                  completedVideosFromServer[resourceId] = true;
                });
              }
            });
            
            console.log('Initialized video completion from server:', completedVideosFromServer);
            setCompletedVideos(completedVideosFromServer);
          } else {
            // No topics with resources
            setCompletedVideos({});
          }
          
          setLoading(false);
        } catch (error) {
          console.error('Error fetching saved roadmap:', error);
          setError('Failed to load the roadmap with resources. Please try again.');
          setLoading(false);
        }
      };
      
      fetchSavedRoadmap();
    } else {
      // Original code for loading from localStorage
      const loadRoadmap = () => {
        try {
          // Get roadmap data from localStorage
          const roadmapData = JSON.parse(localStorage.getItem('roadmapData'));
          
          if (!roadmapData) {
            setError('No roadmap data found');
            setLoading(false);
            return;
          }
          
          console.log('Loaded roadmap data:', roadmapData);
          
          // Ensure the isCustom flag is preserved
          if (roadmapData.isCustom === undefined && fromSaved && isCustom) {
            roadmapData.isCustom = true;
          }
          
          // Always set the roadmap data first to ensure UI is responsive
          setRoadmap(roadmapData);
          setLoading(false);
          
          // Then try to save to database in the background if authenticated
          if (isAuthenticated && user) {
            console.log('Auto-saving roadmap with resources...');
            saveRoadmapToDatabase()
              .then(savedResult => {
                if (savedResult && savedResult._id) {
                  console.log('Roadmap saved successfully, redirecting...');
                  // Redirect to the roadmap resources page with the ID to load from database
                  navigate(`/roadmaps/${savedResult._id}/resources${roadmapData.isCustom ? '?isCustom=true' : ''}`);
                }
              })
              .catch(saveError => {
                console.error('Error saving roadmap to database:', saveError);
                // Already showing the roadmap, so no further action needed
              });
          }
        } catch (error) {
          console.error('Error loading roadmap:', error);
          setError('Failed to load roadmap data');
          setLoading(false);
        }
      };
      
      loadRoadmap();
    }
  }, [navigate, id, fromSaved]);

  useEffect(() => {
    if (fromSaved && id && isAuthenticated) {
      // Load notes from the database for saved roadmaps
        getVideoNotes(id)
          .then(response => {
            if (response.success && response.data && response.data.notes) {
              console.log('Notes loaded from database:', response.data.notes);
              setVideoNotes(prev => ({
                ...prev,
                ...response.data.notes
              }));
              
              // Set timestamps for all notes
              const timestamps = {};
              Object.keys(response.data.notes).forEach(videoId => {
                timestamps[videoId] = response.data.timestamps?.[videoId] || new Date().toISOString();
              });
              
              setNoteTimestamps(prev => ({
                ...prev,
                ...timestamps
              }));
            }
          })
          .catch(error => {
            console.error('Error loading notes from database:', error);
            // Notes are already loaded from localStorage as a fallback
      });
    }
  }, [fromSaved, id, isAuthenticated]);

  // Save notes to localStorage whenever they change
  useEffect(() => {
    if (roadmap && videoNotes) {
      localStorage.setItem('videoNotes', JSON.stringify(videoNotes));
    }
  }, [videoNotes, roadmap]);

  // Event handlers
  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  // Map a video ID to its parent topic
  const findVideoParentTopic = (videoId) => {
    if (!roadmap || !roadmap.sections) {
      console.error('No roadmap or sections available');
      return null;
    }
    
    if (!videoId) {
      console.error('No video ID provided');
      return null;
    }

    console.log(`Looking for parent topic of video ID: ${videoId}`);
    let foundTopic = null;
    
    try {
      // First try to find by exact ID match
      for (const section of roadmap.sections) {
        if (!section.topics || !section.topics.length) continue;
        
          const topic = section.topics[0];
        if (!topic || !topic.video?.videos) continue;
        
        const matchingVideo = topic.video.videos.find(video => {
          // Check all possible ID fields
          return video.id === videoId || 
              video._id === videoId || 
                 (video.url && video.url.includes(videoId));
        });
            
            if (matchingVideo) {
          console.log(`Found video in section: ${section.title}`);
              foundTopic = section;
              break;
        }
      }
      
      if (foundTopic) {
        console.log(`Found topic: ${foundTopic.title}`);
        return foundTopic;
      }
      
      // If no match found, log available videos for debugging
        console.warn(`No parent topic found for video ID: ${videoId}`);
        console.log('Available videos:');
        roadmap.sections.forEach((section, sIndex) => {
          if (section.topics && section.topics.length > 0) {
            const topic = section.topics[0];
            if (topic && topic.video?.videos) {
              topic.video.videos.forEach((video, vIndex) => {
                console.log(`Section ${sIndex}, Video ${vIndex}: id=${video.id}, _id=${video._id}, url=${video.url}`);
              });
            }
          }
        });
        
        return null;
    } catch (error) {
      console.error('Error in findVideoParentTopic:', error);
      return null;
    }
  };
  
  // Remove the old calculateTopicProgress function since we're not using it anymore
  // Instead, add a function to get the topic progress as a fraction
  const getTopicProgress = (topic) => {
    if (!topic || !topic._id) return { completed: 0, total: 0 };
    
    // Find the original topic in the roadmap data to get the accurate counts
    const originalTopic = roadmap?.sections?.flatMap(section => 
      section.topics || []
    ).find(t => t._id === topic._id);
    
    if (!originalTopic) return { completed: 0, total: 0 };
    
    // Count completed videos
    let completed = 0;
    let total = 0;
    
    if (topic.video?.videos) {
      total = topic.video.videos.length;
      completed = topic.video.videos.filter(video => completedVideos[video.id]).length;
    }
    
    return { completed, total };
  };

  // Add useEffect to handle initial video loading
  useEffect(() => {
    if (roadmap?.sections?.length > 0 && !currentVideo) {  // Only set if no current video
      const firstSection = roadmap.sections[0];
      if (firstSection?.topics?.length > 0) {
        const firstTopic = firstSection.topics[0];
        if (firstTopic?.video?.videos?.length > 0) {
          const firstVideo = firstTopic.video.videos[0];
          setCurrentVideo(firstVideo);
        }
      }
    }
  }, [roadmap, currentVideo]); // Add currentVideo to dependencies

  // Toggle video completion status
  const toggleVideoCompletion = async (videoId) => {
    try {
      // Find the parent topic for this video
      const parentTopic = findVideoParentTopic(videoId);
      console.log(`Toggle completion for video: ${videoId}`);
      console.log(`Parent topic: ${parentTopic ? parentTopic.title : 'Not found'} (${parentTopic?._id})`);
      
      if (!parentTopic || !parentTopic._id) {
        console.error(`Could not find parent topic for video: ${videoId}`);
        toast.error('Error updating progress: Could not find the associated topic');
        return;
      }
      
      // Toggle completion status
      const newCompletedVideos = { ...completedVideos };
      
      if (newCompletedVideos[videoId]) {
        delete newCompletedVideos[videoId];
        // Show notification for unmarking a video as completed
        toast.success('Video marked as not completed', {
          icon: '❌',
          duration: 3000
        });
      } else {
        newCompletedVideos[videoId] = true;
        // Show notification for marking a video as completed
        toast.success('Video marked as completed', {
          icon: '✅',
          duration: 3000
        });
      }
      
      setCompletedVideos(newCompletedVideos);
      
      // Count completed videos for this topic
      const topicId = parentTopic._id;
      const topic = roadmap.sections.find(section => section._id === topicId);
      
      if (!topic || !topic.topics || !topic.topics[0] || !topic.topics[0].video || !topic.topics[0].video.videos) {
        console.error('Invalid topic structure');
        return;
      }
      
      const allTopicVideos = topic.topics[0].video.videos;
      const totalVideos = allTopicVideos.length;
      let completedCount = 0;
      
      // Count how many videos in this topic are marked as completed
      allTopicVideos.forEach(video => {
        if (newCompletedVideos[video.id] || newCompletedVideos[video._id]) {
          completedCount++;
        }
      });
      
      console.log(`Topic ${topic.title}: ${completedCount}/${totalVideos} videos completed`);
      
      // Update topic progress status
      const newProgress = completedCount === 0 ? 'not-started' : 
                          completedCount === totalVideos ? 'completed' : 'in-progress';
      
      // Update roadmap state with new progress
      const updatedSections = roadmap.sections.map(section => {
        if (section._id === topicId) {
          return {
            ...section,
            progress: newProgress
          };
        }
        return section;
      });
      
      // Update roadmap without triggering the initial video useEffect
      setRoadmap(prevRoadmap => ({
        ...prevRoadmap,
        sections: updatedSections
      }));
      
      // Save to server
      const completedResourceIds = Object.keys(newCompletedVideos).filter(id => newCompletedVideos[id]);
      
      // Format data for the API
      const updateData = {
        topicId: topicId,
        completedResources: completedCount,
        totalResources: totalVideos,
        completedResourceIds: completedResourceIds
      };
      
      console.log('Sending progress update to server:', updateData);
      
      try {
        // Call API to update progress
        const response = await updateRoadmapProgress(id, updateData);
        
        if (response.status === 200) {
          // Success, but don't show toast for every update
          console.log('Progress updated successfully');
        } else {
          console.error('Error updating progress:', response);
          toast.error('Failed to save your progress');
        }
      } catch (apiError) {
        console.error('API error updating progress:', apiError);
        
        // If the API call fails but we're in a newly created roadmap scenario,
        // save the progress locally until the next successful API call
        if (fromSaved) {
          console.log('Saving progress locally as fallback');
          saveRoadmapProgress({
            roadmapId: id,
            topicId: topicId,
            videoId: videoId,
            isCompleted: newCompletedVideos[videoId] || false
          });
        }
        
        toast.error('Failed to save progress to server. Changes saved locally.');
      }
    } catch (error) {
      console.error('Error toggling video completion:', error);
      toast.error('Failed to update progress');
    }
  };

  const openNoteModal = (videoId) => {
    setEditingNote(videoId);
    setCurrentNote(videoNotes[videoId] || '');
    setNoteModalOpen(true);
  };

  const closeNoteModal = () => {
    setNoteModalOpen(false);
    setEditingNote(null);
    setCurrentNote('');
  };

  const saveNote = async () => {
    if (editingNote) {
      const timestamp = new Date().toISOString();
      setVideoNotes(prev => ({
        ...prev,
        [editingNote]: currentNote
      }));
      setNoteTimestamps(prev => ({
        ...prev,
        [editingNote]: timestamp
      }));

      // If this is a saved roadmap, also save the note to the database
      if (fromSaved && id) {
        try {
          const response = await saveVideoNotes(id, editingNote, currentNote);
          if (response.success) {
                console.log('Note saved to database:', response);
            toast.success('Note saved successfully');
          } else {
            console.error('Error saving note to database:', response);
            toast.error('Failed to save note to database');
          }
        } catch (error) {
          console.error('Error importing saveVideoNotes:', error);
          toast.error('Failed to save note to database');
        }
      }
    }
    closeNoteModal();
  };

  const deleteNote = async () => {
    if (editingNote) {
      // Update local state
      setVideoNotes(prev => {
        const newNotes = { ...prev };
        delete newNotes[editingNote];
        return newNotes;
      });
      setNoteTimestamps(prev => {
        const newTimestamps = { ...prev };
        delete newTimestamps[editingNote];
        return newTimestamps;
      });

      // If this is a saved roadmap, also delete the note from the database
      if (fromSaved && id) {
        try {
          const response = await deleteVideoNote(id, editingNote);
          if (response.success) {
            console.log('Note deleted from database:', response);
            toast.success('Note deleted successfully');
          } else {
            console.error('Error deleting note from database:', response);
            toast.error('Failed to delete note from database');
          }
        } catch (error) {
          console.error('Error importing deleteVideoNote:', error);
          toast.error('Failed to delete note from database');
        }
      }
    }
    closeNoteModal();
  };

  const getCompletionPercentage = (section, completedVideos) => {
    if (!section?.topics) return 0;
    
    let totalVideos = 0;
    let completedCount = 0;
    
    section.topics.forEach(topic => {
      if (topic.video?.videos) {
        topic.video.videos.forEach(video => {
          totalVideos++;
          if (completedVideos[video.id]) {
            completedCount++;
          }
        });
      }
    });
    
    if (totalVideos === 0) return 0;
    return Math.round((completedCount / totalVideos) * 100);
  };

  const getCompletedVideosCount = (section, completedVideos) => {
    if (!section?.topics) return 0;
    
    let count = 0;
    section.topics.forEach(topic => {
      if (topic.video?.videos) {
        topic.video.videos.forEach(video => {
          if (completedVideos[video.id]) {
            count++;
          }
        });
      }
    });
    
    return count;
  };

  const getTotalVideosCount = (section) => {
    if (!section?.topics) return 0;
    
    let count = 0;
    section.topics.forEach(topic => {
      if (topic.video?.videos) {
        count += topic.video.videos.length;
      }
    });
    
    return count;
  };

  // Update video handling functions
  const handlePlayVideo = (video) => {
    setCurrentVideo(video);
    // Remove modal-related state
    setVideoModalOpen(false);
  };

  const handleCloseVideo = () => {
    setCurrentVideo(null);
  };

  const handlePlaylistClick = (playlistUrl) => {
    if (playlistUrl) {
      window.open(playlistUrl, '_blank');
    }
  };

  // Auto-save roadmap with resources when component mounts
  useEffect(() => {
    // Only run this once when the component mounts and if not already saved
    if (hasResources && isAuthenticated && !fromSaved && !savedToDB && !savingToDB) {
      console.log('Auto-saving roadmap with resources...');
      saveRoadmapToDatabase();
    }
    
    // Show saved badge if from a saved roadmap
    if (fromSaved) {
      setShowSavedBadge(true);
    }
  }, [hasResources, isAuthenticated, fromSaved, savedToDB, savingToDB]);

  // Add save to database function
  const saveRoadmapToDatabase = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    try {
      setIsSaving(true);
      setSavingToDB(true);
      setSavedToDB(false);

      const roadmapData = {
        title: roadmap.title,
        description: roadmap.description,
        category: roadmap.category,
        sections: roadmap.sections,
        completedVideos: completedVideos,
        videoNotes: videoNotes
      };

      await roadmapService.saveRoadmap(roadmapData);
      
      setSavedToDB(true);
      setShowSavedBadge(true);
      setTimeout(() => setShowSavedBadge(false), 3000);
    } catch (error) {
      console.error('Error saving roadmap:', error);
      toast.error('Failed to save roadmap');
    } finally {
      setIsSaving(false);
      setSavingToDB(false);
    }
  };

  useEffect(() => {
    if (roadmap && roadmap.sections) {
      // Process all videos to ensure channel info is properly formatted
      const processedRoadmap = {
        ...roadmap,
        sections: roadmap.sections.map(section => {
          if (section.topics) {
            return {
              ...section,
              topics: section.topics.map(topic => {
                if (topic.video && topic.video.videos) {
                  // Process channel information for each video
                  const processedVideos = topic.video.videos.map(video => {
                    // Ensure channel is a string
                    let channel = 'Unknown';
                    if (typeof video.channel === 'string') {
                      channel = video.channel;
                    } else if (video.channel && typeof video.channel === 'object' && video.channel.name) {
                      channel = video.channel.name;
                    }
                    
                    return {
                      ...video,
                      channel
                    };
                  });
                  
                  // Also process the playlist channel
                  let playlistChannel = 'Unknown';
                  if (typeof topic.video.channel === 'string') {
                    playlistChannel = topic.video.channel;
                  } else if (topic.video.channel && typeof topic.video.channel === 'object' && topic.video.channel.name) {
                    playlistChannel = topic.video.channel.name;
                  } else if (processedVideos.length > 0 && processedVideos[0].channel) {
                    playlistChannel = processedVideos[0].channel;
                  }
                  
                  return {
                    ...topic,
                    video: {
                      ...topic.video,
                      channel: playlistChannel,
                      videos: processedVideos
                    }
                  };
                }
                return topic;
              })
            };
          }
          return section;
        })
      };
      
      setRoadmap(processedRoadmap);
    }
  }, [roadmap?.title]); // Only run once when roadmap is first loaded

  // Loading state
  if (loading || !roadmap) {
    return (
      <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ 
        backgroundColor: theme.background
      }}>
        <Navbar />
        <HeroAnimation />
        <main className="flex-1">
          <div className="max-w-3xl mx-auto px-4 pt-24 pb-24">
            <div className="p-8 rounded-xl" style={{ 
              backgroundColor: theme.cardBg,
              border: `1px solid ${theme.border}`,
              boxShadow: `0 4px 6px -1px ${theme.shadow}`
            }}>
              <LoadingState />
            </div>
          </div>
        </main>
        {/* Keep the global chatbot for general questions, but position it differently */}
        <div className="fixed bottom-6 left-6 z-50">
        <ChatbotWrapper />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: theme.background }}>
      <Navbar />
      <main className="flex-1 pt-16 pb-6">
          {/* Header */}
        <div className="container mx-auto px-4 py-6">
          <RoadmapHeader
            title={roadmap?.title}
            description={roadmap?.description}
            isSaving={isSaving}
            showSavedBadge={showSavedBadge}
            theme={theme}
          />
                </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 xl:pb-24 xxl:pb-5">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left Side - Video Player */}
            <div className="w-full lg:w-2/3 xl:w-2/3 flex-shrink-0 lg:sticky lg:top-6" style={{ maxHeight: 'calc(100vh - 16rem)' }}>
              <div className="w-full" style={{ aspectRatio: '16/9' }}>
                <PermanentVideoPlayer
                  currentVideo={currentVideo}
                  onClose={handleCloseVideo}
                  theme={theme}
                />
            </div>
              {/* Video Controls */}
              <div className="mt-2 flex items-center gap-3">
                <VideoControls
                  isCompleted={currentVideo ? completedVideos[currentVideo.id] : false}
                  hasNote={currentVideo ? !!videoNotes[currentVideo.id] : false}
                  onToggleComplete={() => currentVideo && toggleVideoCompletion(currentVideo.id || currentVideo._id)}
                  onAddNote={() => currentVideo && openNoteModal(currentVideo.id || currentVideo._id)}
                  theme={theme}
                />
                
                {/* Notes Button */}
                {currentVideo && (
                  <button
                    className="px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200"
                    style={{
                      backgroundColor: theme.buttonSecondary,
                      color: theme.buttonText,
                      border: `1px solid ${theme.buttonSecondary}`,
                      fontSize: '0.875rem',
                      fontWeight: 'medium',
                      transform: 'translateY(0)',
                      boxShadow: 'none'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = `0 4px 6px -1px ${theme.shadow}`;
                      e.currentTarget.style.backgroundColor = theme.buttonHover;
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.backgroundColor = theme.buttonSecondary;
                    }}
                    onClick={() => {
                      const videoId = currentVideo.id || currentVideo._id;
                      if (videoId) {
                        openNoteModal(videoId);
                      }
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span>
                      {videoNotes[currentVideo.id || currentVideo._id] ? 'Edit Notes' : 'Add Notes'}
                    </span>
                    {videoNotes[currentVideo.id || currentVideo._id] && (
                      <span className="ml-1 w-2 h-2 rounded-full" style={{ backgroundColor: theme.success }}></span>
                    )}
                  </button>
                )}
              </div>

              {/* Removed Talk to Your Roadmap - now in right panel */}
            </div>

            {/* Right Side - Content/Chatbot */}
            <div className="w-full lg:w-1/3 xl:w-1/3 flex-shrink overflow-hidden flex flex-col mt-6 lg:mt-0" style={{ 
              maxHeight: { lg: '80vh' },
              maxWidth: '100%'
            }}>
              {/* Toggle Buttons with Animated Slider */}
              <div className="flex mb-3 border rounded-lg overflow-hidden relative" style={{ 
                borderColor: theme.border,
                position: 'relative'
              }}>
                {/* Animated Background Indicator */}
                <motion.div 
                  className="absolute top-0 bottom-0 rounded-md z-0"
                  initial={false}
                  animate={{ 
                    x: rightPanelView === 'content' ? 0 : '100%',
                    width: rightPanelView === 'content' ? '50%' : '50%'
                  }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 300, 
                    damping: 30,
                    duration: 0.3
                  }}
                  style={{ 
                    background: `linear-gradient(to right, ${theme.accent}, ${theme.accent}E6)`,
                    transformOrigin: rightPanelView === 'content' ? 'left center' : 'right center'
                  }}
                />
                
                <button 
                  className={`flex-1 py-2 px-4 flex items-center justify-center gap-2 transition-all duration-200 z-10 relative ${rightPanelView === 'content' ? 'scale-105' : 'scale-100'}`}
                  style={{ 
                    color: rightPanelView === 'content' ? theme.buttonText : theme.text
                  }}
                  onClick={() => setRightPanelView('content')}
                >
                  <motion.div
                    animate={{ 
                      rotate: rightPanelView === 'content' ? 0 : -10,
                      scale: rightPanelView === 'content' ? 1.1 : 1
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                  >
                    <FaList />
                  </motion.div>
                  <span>Content</span>
                </button>
                
                <button 
                  className={`flex-1 py-2 px-4 flex items-center justify-center gap-2 transition-all duration-200 z-10 relative ${rightPanelView === 'chatbot' ? 'scale-105' : 'scale-100'}`}
                  style={{ 
                    color: rightPanelView === 'chatbot' ? theme.buttonText : theme.text
                  }}
                  onClick={() => setRightPanelView('chatbot')}
                >
                  <motion.div
                    animate={{ 
                      rotate: rightPanelView === 'chatbot' ? 0 : 10,
                      scale: rightPanelView === 'chatbot' ? 1.1 : 1
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                  >
                    <FaComments />
                  </motion.div>
                  <span>Talk to Your Roadmap</span>
                </button>
              </div>
              
              <div className="h-full pr-1 custom-scrollbar overflow-y-auto flex-1 overflow-x-hidden" style={{ 
                scrollbarWidth: 'thin',
                msOverflowStyle: 'auto',
                overscrollBehavior: 'contain',
                contain: 'paint layout',
                maxHeight: '500px',
                height: 'auto'
              }}>
                <style>
                  {`
                    .custom-scrollbar::-webkit-scrollbar {
                      width: 2px;
                      background: transparent;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb {
                      background: ${theme.accent}20;
                      border-radius: 10px;
                      transition: background 0.3s ease;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                      background: ${theme.accent}60;
                    }
                    .custom-scrollbar::-webkit-scrollbar-track {
                      background: transparent;
                      margin: 6px 0;
                    }
                  `}
                </style>
                
                {/* Use AnimatePresence for smooth transitions between views */}
                <AnimatePresence mode="wait" initial={false}>
                  {/* Roadmap Content View */}
                  {rightPanelView === 'content' && (
                    <motion.div 
                      key="content"
                      className="content-scroll pb-8 overflow-hidden"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <RoadmapContent
                        roadmap={roadmap}
                        expandedSections={expandedSections}
                        completedVideos={completedVideos}
                        videoNotes={videoNotes}
                        onToggleSection={toggleSection}
                        onToggleVideoComplete={toggleVideoCompletion}
                        onPlayVideo={handlePlayVideo}
                        onAddNote={openNoteModal}
                        onPlaylistClick={handlePlaylistClick}
                        getCompletedVideosCount={getCompletedVideosCount}
                        getTotalVideosCount={getTotalVideosCount}
                        getCompletionPercentage={getCompletionPercentage}
                        theme={theme}
                      />
                    </motion.div>
                  )}
                
                  {/* Chatbot View */}
                  {rightPanelView === 'chatbot' && (
                    <motion.div 
                      key="chatbot"
                      className="h-full flex flex-col"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <RoadmapChatbot
                        roadmap={roadmap}
                        currentVideo={currentVideo}
                        theme={theme}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
          </div>
        </div>
      </div>

      {/* Modals */}
        <NotesModal
        isOpen={noteModalOpen}
          onClose={closeNoteModal}
          onSave={saveNote}
          onDelete={deleteNote}
          note={currentNote}
          onNoteChange={setCurrentNote}
          videoTitle={currentVideo?.title}
          lastEdited={editingNote ? noteTimestamps[editingNote] : null}
          theme={theme}
        />
      
      {/* Celebration Modal */}
      <CelebrationModal 
        isOpen={showCelebration} 
        onClose={() => setShowCelebration(false)} 
          theme={theme}
      />
      
      {/* Roadmap Statistics */}
      <div className="container mx-auto px-4 pt-10 xl:pt-24 xxl:pt-1">
        <RoadmapStats 
          roadmap={roadmap}
          completedVideos={completedVideos}
          videoNotes={videoNotes}
          theme={theme}
        />
      </div>
      
      {/* Footer */}
      <div className="mt-16">
        <Footer colors={theme} darkMode={darkMode} />
      </div>
      </main>
      
      {/* Keep the global chatbot for general questions, but position it differently */}
      <div className="fixed bottom-6 left-6 z-50">
      <ChatbotWrapper />
      </div>

      {/* Markdown styling */}
      <style>
        {`
          .markdown-content h1, 
          .markdown-content h2, 
          .markdown-content h3, 
          .markdown-content h4, 
          .markdown-content h5, 
          .markdown-content h6 {
            font-weight: 600;
            margin-top: 1em;
            margin-bottom: 0.5em;
          }
          
          .markdown-content h1 { font-size: 1.5em; }
          .markdown-content h2 { font-size: 1.3em; }
          .markdown-content h3 { font-size: 1.2em; }
          .markdown-content h4 { font-size: 1.1em; }
          
          .markdown-content p {
            margin-bottom: 0.75em;
          }
          
          .markdown-content ul, 
          .markdown-content ol {
            margin-left: 1.5em;
            margin-bottom: 0.75em;
          }
          
          .markdown-content ul {
            list-style-type: disc;
          }
          
          .markdown-content ol {
            list-style-type: decimal;
          }
          
          .markdown-content li {
            margin-bottom: 0.25em;
          }
          
          .markdown-content a {
            color: ${theme.accent};
            text-decoration: underline;
          }
          
          .markdown-content blockquote {
            border-left: 3px solid ${theme.accent};
            padding-left: 1em;
            margin-left: 0;
            margin-right: 0;
            font-style: italic;
          }
          
          .markdown-content pre {
            margin-bottom: 0.75em;
            border-radius: 4px;
            overflow: auto;
          }
          
          .markdown-content code {
            font-family: monospace;
            background-color: ${theme.codeBg};
            padding: 0.1em 0.3em;
            border-radius: 3px;
            font-size: 0.9em;
          }
          
          .markdown-content pre code {
            background-color: transparent;
            padding: 0;
          }
          
          .markdown-content table {
            border-collapse: collapse;
            width: 100%;
            margin-bottom: 1em;
          }
          
          .markdown-content th, 
          .markdown-content td {
            border: 1px solid ${theme.border};
            padding: 0.5em;
          }
          
          .markdown-content th {
            background-color: ${theme.codeBg};
          }
          
          .markdown-content img {
            max-width: 100%;
            border-radius: 4px;
          }
          
          .markdown-content hr {
            border: none;
            border-top: 1px solid ${theme.border};
            margin: 1em 0;
          }
          
          .markdown-content strong {
            font-weight: 600;
          }
          
          .markdown-content em {
            font-style: italic;
          }
        `}
      </style>
    </div>
  );
};

export default RoadmapProgressPage; 