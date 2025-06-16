import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import HeroAnimation from '../components/HeroAnimation';
import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';
import { 
  FaArrowLeft, FaCalendarAlt, FaCheck, FaPlay, 
  FaBookmark, FaEdit, FaEye, FaFileDownload, FaFileExport, FaSave
} from 'react-icons/fa';
import { 
  saveRoadmapProgress, 
  loadRoadmapProgress, 
  getCompletedVideos,
  getRoadmap,
  downloadRoadmap,
  saveGeneratedRoadmap,
  updateRoadmapProgress
} from '../services/roadmapService';
import { toast } from 'react-hot-toast';
import VideoPlayerModal from '../components/roadmap/modals/VideoPlayerModal';
import NotesModal from '../components/roadmap/modals/NotesModal';
import { decodeUnicode, formatDuration, getChannelName } from '../components/roadmap/utils/videoUtils';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import useChatbotContext from '../hooks/useChatbotContext';
import ChatbotWrapper from '../components/chatbot/ChatbotWrapper';

// Import our components
import SectionHeader from '../components/roadmap/sections/SectionHeader';
import TopicSection from '../components/roadmap/sections/TopicSection';
import CelebrationModal from '../components/roadmap/modals/CelebrationModal';

// Import utility functions
import { triggerCelebration } from '../components/roadmap/utils/celebrationUtils';
import { checkAllVideosCompleted, groupSectionsBySharedResources } from '../components/roadmap/utils/progressUtils';

const RoadmapProgressPage = ({ fromSaved = false }) => {
  const navigate = useNavigate();
  const { id } = useParams(); // Get roadmap ID from URL for fromSaved mode
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
      import('../services/roadmapService').then(({ getVideoNotes }) => {
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
    
    console.log(`Looking for parent topic of video: ${videoId}`);
    let foundTopic = null;
    
    try {
      // First try to find by exact ID match
      for (const section of roadmap.sections) {
        // Check if section has its own _id (might be the topic itself in some structures)
        if (section._id && section.topics && section.topics.length > 0) {
          // Get the first topic in the section (this is how the data is structured)
          const topic = section.topics[0];
          
          if (topic && topic.video?.videos) {
            const matchingVideo = topic.video.videos.find(video => 
              video.id === videoId || 
              video._id === videoId || 
              video.youtubeId === videoId || 
              (video.url && video.url.includes(videoId))
            );
            
            if (matchingVideo) {
              console.log(`Found video in section: ${section.title}, _id: ${section._id}`);
              // Important: Return the section, not the topic, because the section has the MongoDB _id
              foundTopic = section;
              break;
            }
          }
        }
      }
      
      // If no exact match found, try to match by YouTube ID in the URL
      if (!foundTopic && videoId && videoId.length > 8) {
        for (const section of roadmap.sections) {
          if (section._id && section.topics && section.topics.length > 0) {
            const topic = section.topics[0];
            if (topic && topic.video?.videos) {
              for (const video of topic.video.videos) {
                // Extract YouTube ID from URL if present
                if (video.url) {
                  const urlMatch = video.url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
                  const youtubeId = urlMatch ? urlMatch[1] : null;
                  
                  if (youtubeId === videoId) {
                    console.log(`Found video by YouTube ID in URL: ${section.title}, _id: ${section._id}`);
                    foundTopic = section;
                    break;
                  }
                }
              }
              if (foundTopic) break;
            }
          }
        }
      }
      
      // Handle MongoDB ObjectId format (24 hex characters)
      if (!foundTopic && videoId && videoId.length === 24 && /^[0-9a-f]{24}$/i.test(videoId)) {
        for (const section of roadmap.sections) {
          if (section._id && section.topics && section.topics.length > 0) {
            const topic = section.topics[0];
            if (topic && topic.video?.videos) {
              for (const video of topic.video.videos) {
                // Check if any resource has this as _id
                if (video._id === videoId || video.id === videoId) {
                  console.log(`Found video by MongoDB ObjectId: ${section.title}, _id: ${section._id}`);
                  foundTopic = section;
                  break;
                }
              }
              if (foundTopic) break;
            }
          }
        }
      }
      
      // Final check and debug
      if (foundTopic) {
        console.log(`Final found topic: ${foundTopic.title}, _id: ${foundTopic._id}, valid: ${Boolean(foundTopic._id)}`);
        return foundTopic;
      } else {
        // If still no match, log detailed debugging info
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
      }
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
      
      setRoadmap({
        ...roadmap,
        sections: updatedSections
      });
      
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

  const saveNote = () => {
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
          import('../services/roadmapService').then(({ saveVideoNotes }) => {
            saveVideoNotes(id, editingNote, currentNote)
              .then(response => {
                console.log('Note saved to database:', response);
              })
              .catch(error => {
                console.error('Error saving note to database:', error);
                // Note is already saved to localStorage as a fallback
              });
          });
        } catch (error) {
          console.error('Error importing saveVideoNotes:', error);
        }
      }
    }
    closeNoteModal();
  };

  const deleteNote = () => {
    if (editingNote) {
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

  const openVideoModal = (video) => {
    // Make sure we have a valid video object with all required properties
    const processedVideo = {
      ...video,
      // Ensure URL is properly formatted
      url: video.url ? video.url.trim() : video.url,
      // Ensure title exists
      title: video.title || 'Video',
      // Ensure channel exists
      channel: video.channel || 'Unknown'
    };
    
    console.log('Opening video modal with:', processedVideo);
    setCurrentVideo(processedVideo);
    setVideoModalOpen(true);
  };

  const closeVideoModal = () => {
    setVideoModalOpen(false);
    setCurrentVideo(null);
  };

  const handlePlaylistClick = (playlistUrl) => {
    if (playlistUrl) {
      window.open(playlistUrl, '_blank');
    }
  };

  // Add export roadmap function
  const handleExportRoadmap = () => {
    if (!roadmap) return;
    
    try {
      // Format the roadmap data for export in the format expected by downloadRoadmap
      const formattedRoadmap = {
        title: roadmap.title,
        description: roadmap.description,
        category: roadmap.category || 'Web Development',
        difficulty: roadmap.difficulty || 'Intermediate',
        topics: roadmap.sections.map(section => ({
          title: section.title,
          description: section.description,
          resources: section.topics?.[0]?.video?.videos?.map(video => {
            // Parse duration using the formatDuration utility
            let durationInSeconds = 0;
            if (video.duration) {
              if (typeof video.duration === 'string' && video.duration.includes(':')) {
                const parts = video.duration.split(':');
                if (parts.length === 3) {
                  // Handle HH:MM:SS format
                  durationInSeconds = parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
                } else if (parts.length === 2) {
                  // Handle MM:SS format
                  durationInSeconds = parseInt(parts[0]) * 60 + parseInt(parts[1]);
                } else {
                  // Handle single number (seconds)
                  durationInSeconds = parseInt(parts[0]);
                }
              } else if (typeof video.duration === 'number') {
                durationInSeconds = video.duration;
              }
            }
            
            return {
              title: video.title,
              url: video.url,
              type: 'video',
              description: video.description || '',
              thumbnailUrl: video.thumbnail || '',
              source: video.channel || 'YouTube',
              duration: durationInSeconds,
              isRequired: true
            };
          }) || []
        }))
      };
      
      const result = downloadRoadmap(formattedRoadmap);
      if (result.success) {
        toast.success('Roadmap exported successfully');
      } else {
        toast.error('Failed to export roadmap');
      }
    } catch (error) {
      console.error('Error exporting roadmap:', error);
      toast.error('Failed to export roadmap');
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
    if (!roadmap) return;
    
    // Prevent duplicate saves
    if (savedToDB) {
      toast.success('Roadmap already saved to your account');
      return;
    }
    
    if (savingToDB) {
      toast.info('Currently saving roadmap...');
      return;
    }
    
    try {
      setSavingToDB(true);
      
      // Check if user is authenticated
      if (!isAuthenticated) {
        toast.error('Please log in to save your roadmap');
        setSavingToDB(false);
        return;
      }
      
      // Format the roadmap data for saving to the database
      const formattedRoadmap = {
        title: roadmap.title,
        description: roadmap.description,
        category: roadmap.category || 'Web Development',
        difficulty: roadmap.difficulty || 'Intermediate',
        isCustom: true, // Always set isCustom to true for custom roadmaps
        topics: roadmap.sections?.map(section => {
          // Check if this section has video resources
          const hasResources = section.topics?.[0]?.video?.videos && section.topics[0].video.videos.length > 0;
          
          return {
            title: section.title,
            description: section.description,
            hasGeneratedResources: hasResources,
            resources: hasResources ? section.topics[0].video.videos.map(video => {
              // Safely parse duration
              let durationInSeconds = 0;
              if (video.duration) {
                if (typeof video.duration === 'string') {
                  if (video.duration.includes(':')) {
                  const parts = video.duration.split(':');
                  if (parts.length === 3) {
                    // Handle HH:MM:SS format
                    durationInSeconds = parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
                  } else if (parts.length === 2) {
                    // Handle MM:SS format
                    durationInSeconds = parseInt(parts[0]) * 60 + parseInt(parts[1]);
                  } else {
                    // Handle single number (seconds)
                    durationInSeconds = parseInt(parts[0]);
                    }
                  } else {
                    // Handle numeric string without colons (like "15275")
                    durationInSeconds = parseInt(video.duration);
                  }
                } else if (typeof video.duration === 'number') {
                  durationInSeconds = video.duration;
                }
              }
              
              // Log the duration conversion for debugging
              console.log(`Converting duration for ${video.title}: ${video.duration} → ${durationInSeconds}`);
              
              return {
                title: video.title,
                url: video.url,
                type: 'video',
                description: video.description || '',
                thumbnailUrl: video.thumbnail || '',
                source: video.channel || 'YouTube',
                duration: durationInSeconds,
                isRequired: true
              };
            }) : []
          };
        }) || []
      };
      
      console.log('Saving roadmap to database:', formattedRoadmap);
      const response = await saveGeneratedRoadmap(formattedRoadmap);
      console.log('Roadmap saved to database:', response);
      
      toast.success('Roadmap saved to your account');
      setSavedToDB(true);
      setShowSavedBadge(true);
    } catch (error) {
      console.error('Error saving roadmap to database:', error);
      toast.error('Failed to save roadmap to your account');
    } finally {
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
      <div className="min-h-screen relative overflow-hidden" style={{ background: 'linear-gradient(to bottom, #FFF7ED, #FFFFFF)' }}>
        <Navbar />
        <HeroAnimation />
        <div className="max-w-3xl mx-auto px-4 pt-24 pb-16">
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mb-4"></div>
              <p className="text-gray-600 font-mukta">Loading your roadmap...</p>
            </div>
          </div>
        </div>
        <ChatbotWrapper />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'linear-gradient(to bottom, #FFF7ED, #FFFFFF)' }}>
      <Navbar />
      <HeroAnimation />
      <div className="max-w-5xl mx-auto px-4 pt-24 pb-16">
        <div className="bg-white p-8 rounded-xl shadow-lg">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div className="text-center flex-1">
              <h1 className="text-4xl font-bold mb-4 font-poppins" style={{
                background: 'linear-gradient(to right, #EA580C, #9333EA)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                {roadmap.title}
              </h1>
              {showSavedBadge && (
                <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 mb-4">
                  <FaCheck className="mr-1" /> Saved to your profile
                </div>
              )}
              <p className="text-gray-600 max-w-2xl mx-auto font-mukta">{roadmap.description}</p>
            </div>
          </div>

          {/* Saving to DB notification */}
          {(savedToDB || savingToDB) && (
            <div className="mb-8 flex justify-center">
              <div className="w-full max-w-2xl">
                <div className={`flex items-center justify-center ${savingToDB ? 'text-blue-600 bg-blue-50 border-blue-200' : 'text-green-600 bg-green-50 border-green-200'} font-medium p-3 rounded-lg shadow-sm border`}>
                  {savingToDB ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving your roadmap...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Roadmap saved to your account
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Learning Path */}
          <div className="space-y-8">
            {groupSectionsBySharedResources(roadmap.sections).map((section, sectionIndex) => (
                <div key={sectionIndex} className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* Section Header */}
                <SectionHeader
                  title={`Step ${sectionIndex + 1}: ${section.title.replace(/^Complete\s+/i, '')}`}
                  description={section.technologies?.[0]?.description}
                  completedCount={getCompletedVideosCount(section, completedVideos)}
                  totalCount={getTotalVideosCount(section)}
                  completionPercentage={getCompletionPercentage(section, completedVideos)}
                  isExpanded={expandedSections[`section${sectionIndex}`]}
                  onToggle={() => toggleSection(`section${sectionIndex}`)}
                />

                {/* Section Content */}
                  {expandedSections[`section${sectionIndex}`] && (
                  <div className="p-6">
                    {/* Topics */}
                    <div className="space-y-8">
                      {section.topics.map((topic, topicIndex) => {
                        // Process video data to ensure channel info is available
                        if (topic.video && topic.video.videos && topic.video.videos.length > 0) {
                          // Fix channel information for each video
                          topic.video.videos.forEach(video => {
                            if (!video.channel && topic.video.channel) {
                              video.channel = topic.video.channel;
                            } else if (typeof video.channel === 'object' && video.channel?.name) {
                              video.channel = video.channel.name;
                            }
                          });
                          
                          // Set playlist channel if missing
                          if (!topic.video.channel && topic.video.videos[0]?.channel) {
                            if (typeof topic.video.videos[0].channel === 'string') {
                              topic.video.channel = topic.video.videos[0].channel;
                            } else if (topic.video.videos[0]?.channel?.name) {
                              topic.video.channel = topic.video.videos[0].channel.name;
                            }
                          }
                        }
                        
                        return (
                        <TopicSection
                          key={topicIndex}
                          topic={topic}
                          completedVideos={completedVideos}
                          videoNotes={videoNotes}
                          onToggleVideoComplete={toggleVideoCompletion}
                          onPlayVideo={openVideoModal}
                          onAddNote={openNoteModal}
                          onPlaylistClick={handlePlaylistClick}
                        />
                        );
                      })}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
          </div>

          {/* Action Buttons */}
          <div className="mt-12 flex justify-center space-x-4">
            <button
              onClick={() => navigate('/')}
              className="flex items-center text-gray-700 border-2 border-gray-300 px-6 py-3 rounded-xl font-medium shadow-sm hover:bg-gray-50 transition-colors"
            >
              <FaArrowLeft className="mr-2" /> Go to Home
            </button>
            
            <button
              onClick={handleExportRoadmap}
              className="flex items-center px-6 py-3 bg-green-600 text-white rounded-xl font-medium shadow-sm hover:bg-green-700 transition-colors"
            >
              <FaFileExport className="mr-2" /> Export Roadmap
            </button>

            {/* Only show save button for roadmaps without resources or if not already saved */}
            {isAuthenticated && !fromSaved && (!hasResources || !savedToDB) && (
              <button
                onClick={saveRoadmapToDatabase}
                disabled={savingToDB || savedToDB}
                className={`flex items-center px-6 py-3 ${savingToDB || savedToDB ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-xl font-medium shadow-sm transition-colors`}
              >
                <FaSave className="mr-2" /> {savingToDB ? 'Saving...' : savedToDB ? 'Saved' : 'Save to Profile'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {/* Render the VideoPlayerModal only when needed with all required props */}
      {videoModalOpen && currentVideo && (
        <VideoPlayerModal
          video={currentVideo}
          isOpen={true}
          onClose={closeVideoModal}
          onToggleComplete={toggleVideoCompletion}
          isCompleted={currentVideo ? completedVideos[currentVideo.id] : false}
          onAddNote={openNoteModal}
          hasNote={currentVideo ? !!videoNotes[currentVideo.id] : false}
        />
      )}

      {/* Notes Modal */}
      <NotesModal 
        isOpen={noteModalOpen}
        onClose={closeNoteModal}
        onSave={saveNote}
        onDelete={deleteNote}
        note={currentNote}
        onNoteChange={setCurrentNote}
        videoTitle={currentVideo?.title}
        lastEdited={editingNote ? noteTimestamps[editingNote] : null}
      />
      
      {/* Celebration Modal */}
      <CelebrationModal 
        isOpen={showCelebration} 
        onClose={() => setShowCelebration(false)} 
      />
      
      <ChatbotWrapper />
    </div>
  );
};

export default RoadmapProgressPage; 