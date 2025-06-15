import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import HeroAnimation from '../components/HeroAnimation';
import { generateLearningRoadmap } from '../services/groqService';
import { findBestVideoForTopic } from '../services/youtubeService';
import { saveGeneratedRoadmap, checkAuth, getRoadmap, downloadRoadmap } from '../services/roadmapService';
import { getCustomRoadmap } from '../services/customRoadmapService';
import { useAuth } from '../context/AuthContext';
import { useCustomRoadmap } from '../context/CustomRoadmapContext';
import { motion } from 'framer-motion';
import RoadmapLoadingState from '../components/roadmap/loading/RoadmapLoadingState';
import RoadmapErrorState from '../components/roadmap/error/RoadmapErrorState';
import RoadmapHeader from '../components/roadmap/header/RoadmapHeader';
import LearningPath from '../components/roadmap/sections/LearningPath';
import AdvancedChallenges from '../components/roadmap/sections/AdvancedChallenges';
import PracticeProjects from '../components/roadmap/sections/PracticeProjects';
import RoadmapFooter from '../components/roadmap/footer/RoadmapFooter';
import { toast } from 'react-hot-toast';
import Navbar from '../components/Navbar';
import { FaFileExport, FaEdit } from 'react-icons/fa';
import ResourceLoadingModal from '../components/roadmap/modals/ResourceLoadingModal';
import { updateSharedResources } from '../services/resourceCache';
import UserResourceManager from '../components/UserResourceManager';
import useChatbotContext from '../hooks/useChatbotContext';
import ChatbotWrapper from '../components/chatbot/ChatbotWrapper';
import axios from 'axios';

const RoadmapResultPage = ({ fromSaved = false, isCustom = false }) => {
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [currentTopic, setCurrentTopic] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [foundResources, setFoundResources] = useState([]);
  const [showResourceLoadingModal, setShowResourceLoadingModal] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [savedToDB, setSavedToDB] = useState(false);
  const [savingToDB, setSavingToDB] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showUserResourceManager, setShowUserResourceManager] = useState(false);
  const MAX_RETRIES = 5;
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { savedRoadmaps } = useCustomRoadmap();
  const { id } = useParams(); // Get roadmap ID from URL for fromSaved mode
  const location = useLocation();

  // Check if the roadmap has resources
  const hasResources = useMemo(() => {
    if (!roadmap || !roadmap.sections) return false;
    
    return roadmap.sections.some(section => {
      return section.topics?.some(topic => 
        topic.video?.videos && topic.video.videos.length > 0
      );
    });
  }, [roadmap]);

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

  const generateRoadmapWithRetry = async (data, attempt = 1) => {
    try {
      console.log(`Attempt ${attempt} to generate roadmap`);
      const result = await generateLearningRoadmap(data);
      
      if (result === null) {
        throw new Error('Failed to generate roadmap - null result');
      }
      
      return result;
    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error);
      
      if (attempt < MAX_RETRIES) {
        console.log(`Retrying... (${attempt + 1}/${MAX_RETRIES})`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        return generateRoadmapWithRetry(data, attempt + 1);
      }
      
      throw error;
    }
  };

  // Function to save roadmap to database
  const saveRoadmapToDatabase = async (roadmapData) => {
    // Prevent duplicate saves
    if (savedToDB) {
      console.log('Roadmap already saved to database, ignoring duplicate save request');
      // No toast needed as this is automatic
      return true;
    }
    
    if (savingToDB) {
      console.log('Currently saving roadmap, ignoring duplicate save request');
      return true;
    }
    
    try {
      setSavingToDB(true);
      
      // Double-check authentication status
      const authStatus = await checkAuth();
      
      if (!authStatus.isAuthenticated) {
        console.warn('Auth check failed: User not authenticated, cannot save roadmap');
        toast.error('Please log in to save your roadmap to your account');
        // Save to JSON file as fallback
        saveRoadmapToJson(roadmapData);
        setSavingToDB(false);
        return false;
      }

      console.log('Auth check passed, user authenticated:', authStatus.isAuthenticated);
      console.log('User ID:', authStatus.user?._id);
      
      // Make sure the isCustom flag is preserved
      const roadmapToSave = {
        ...roadmapData,
        isCustom: roadmapData.isCustom || isCustom || false
      };
      
      // Try to save
      try {
        const savedRoadmap = await saveGeneratedRoadmap(roadmapToSave);
        console.log('Roadmap saved to database:', savedRoadmap);
        
        // Handle the case where our service detected and prevented a duplicate save
        if (savedRoadmap?.data?.duplicate) {
          console.log('Duplicate save was prevented by the service');
          // No toast needed for duplicates in automatic mode
        } else {
          toast.success('Roadmap saved to your account');
        }
        
        setSavedToDB(true);
        setSavingToDB(false);
        return savedRoadmap;
      } catch (innerError) {
        console.error('Inner error saving roadmap:', innerError);
        
        // More specific error handling
        if (innerError.response?.status === 401) {
          toast.error('Authentication expired. Please log in again.');
        } else if (innerError.response?.status === 403) {
          toast.error('Permission denied. You cannot save this roadmap.');
        } else if (innerError.response?.status >= 500) {
          toast.error('Server error. Your roadmap is saved locally instead.');
        } else {
          toast.error('Failed to save to database. Roadmap saved locally as a backup.');
        }
        
        // Save to JSON file as fallback
        saveRoadmapToJson(roadmapData);
        setSavingToDB(false);
        return false;
      }
    } catch (saveError) {
      console.error('Error saving roadmap to database:', saveError);
      console.error('Error response:', saveError.response?.data);
      
      // More specific error handling
      if (saveError.response?.status === 401) {
        toast.error('Authentication error. Please log in again.');
      } else if (saveError.response?.status === 403) {
        toast.error('You do not have permission to save this roadmap.');
      } else {
        toast.error('Unable to save roadmap to your account. Saving to a file instead.');
        // Save to JSON file as fallback
        saveRoadmapToJson(roadmapData);
      }
      
      setSavingToDB(false);
      return false;
    }
  };
  
  // Save roadmap to JSON file as a fallback
  const saveRoadmapToJson = (roadmapData) => {
    try {
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
      
      toast.success('Roadmap saved to a file on your computer');
      console.log('Roadmap saved to JSON file');
    } catch (error) {
      console.error('Error saving roadmap to JSON file:', error);
      toast.error('Failed to save roadmap to file');
    }
  };

  useEffect(() => {
    if (fromSaved) {
      // Loading an existing roadmap from the database
      const fetchSavedRoadmap = async () => {
        try {
          setLoading(true);
          // Redirect if not authenticated
          if (!isAuthenticated) {
            navigate('/login');
            return;
          }
          
          if (!id) {
            setError('Roadmap ID is missing');
            setLoading(false);
            return;
          }
          
          let response;
          try {
            if (isCustom) {
              // If it's a custom roadmap, use the custom roadmap service
              console.log('Fetching custom roadmap with ID:', id);
              response = await getCustomRoadmap(id);
            } else {
              // Otherwise use the regular roadmap service
              console.log('Fetching standard roadmap with ID:', id);
              response = await getRoadmap(id);
            }
          } catch (fetchError) {
            console.error(`Error with initial fetch method, trying alternative:`, fetchError);
            // If the first attempt fails, try the other method as fallback
            if (isCustom) {
              console.log('Fallback: Trying to fetch as standard roadmap instead');
              response = await getRoadmap(id);
            } else {
              console.log('Fallback: Trying to fetch as custom roadmap instead');
              response = await getCustomRoadmap(id);
            }
          }
          
          const roadmapData = response.data;
          console.log('Raw roadmap data received:', roadmapData);
          
          // Format the data to match the expected structure for RoadmapResultPage
          const formattedRoadmap = {
            title: isCustom ? roadmapData.name || roadmapData.title : roadmapData.title,
            description: roadmapData.description,
            sections: roadmapData.topics.map(topic => ({
              title: topic.title,
              description: topic.description,
              difficulty: topic.difficulty || (roadmapData.difficulty === 'Beginner' ? 'beginner' : 
                          roadmapData.difficulty === 'Advanced' ? 'advanced' : 'intermediate'),
              topics: [{ 
                title: topic.title, 
                description: topic.description
              }]
            })),
            advancedTopics: roadmapData.advancedTopics || [],
            projects: roadmapData.projects || [],
            isCustom: roadmapData.isCustom || isCustom // Make sure to preserve the isCustom flag
          };
          
          setRoadmap(formattedRoadmap);
          setSavedToDB(true); // This roadmap is already saved
          setLoading(false);
        } catch (error) {
          console.error('Error fetching saved roadmap:', error);
          setError('Failed to load the roadmap. Please try again.');
          setLoading(false);
        }
      };
      
      fetchSavedRoadmap();
    } else {
      // Normal flow - generate roadmap from localStorage data
      const generateRoadmap = async () => {
        try {
          setLoading(true);
          const storedData = localStorage.getItem('roadmapData');
          if (!storedData) {
            navigate('/');
            return;
          }

          const data = JSON.parse(storedData);
          console.log('Roadmap data from localStorage:', data);
          
          const result = await generateRoadmapWithRetry(data);
          console.log('Generated roadmap result:', result);
          
          // Transform the mainPath into sections format that LearningPath component expects
          const transformedResult = {
            ...result,
            sections: result.mainPath.map(item => ({
              title: item.title,
              description: item.description,
              difficulty: item.difficulty,
              topics: [{ title: item.title, description: item.description }]
            })),
            isCustom: result.isCustom || false
          };
          
          // Set the roadmap state
          setRoadmap(transformedResult);
          setError(null);
          setLoading(false);
          
          // Check if the roadmap has resources after setting it
          const hasResourcesInResult = result.sections?.some(section => 
            section.topics?.some(topic => 
              topic.video?.videos && topic.video.videos.length > 0
            )
          );
          
          // Automatically save the roadmap if it has resources and the user is authenticated
          if (hasResourcesInResult && isAuthenticated && !savedToDB && !savingToDB) {
            setTimeout(() => {
              saveRoadmapToDatabase(result);
            }, 1000);
          }
        } catch (error) {
          console.error('Failed to generate roadmap after all retries:', error);
          setError('We were unable to generate a roadmap after several attempts. Please try again later.');
          localStorage.removeItem('roadmapData');
          setLoading(false);
        }
      };
      
      generateRoadmap();
    }
  }, [fromSaved, id, isAuthenticated, navigate]);

  const saveResourcesToJson = async (roadmapData) => {
    try {
      const storedProgress = localStorage.getItem('roadmapProgress');
      const progressData = storedProgress ? JSON.parse(storedProgress) : {
        completedVideos: {},
        videoNotes: {}
      };

      const resourcesData = {
        timestamp: new Date().toISOString(),
        roadmapTitle: roadmapData.title,
        roadmapDescription: roadmapData.description,
        progress: {
          completedVideos: progressData.completedVideos || {},
          videoNotes: progressData.videoNotes || {}
        },
        resources: []
      };

      for (const section of roadmapData.sections) {
        for (const topic of section.topics) {
          if (topic.video) {
            const resource = {
              sectionTitle: section.title,
              topicTitle: topic.title,
              topicDescription: topic.description,
              resource: {
                title: topic.video.title,
                url: topic.video.url,
                channel: topic.video.channel,
                type: topic.video.isPlaylist ? 'playlist' : 'video',
                metadata: {
                  ...(topic.video.isPlaylist ? {
                    videoCount: topic.video.videoCount,
                    avgViews: topic.video.avgViews,
                    quality: topic.video.quality,
                    rating: topic.video.rating,
                    directViewCount: topic.video.directViewCount,
                    directViewCountFormatted: topic.video.directViewCountFormatted
                  } : {
                    views: topic.video.views,
                    likes: topic.video.likes,
                    rating: topic.video.rating,
                    fallback: topic.video.fallback
                  })
                }
              }
            };

            if (topic.video.isPlaylist && topic.video.videos) {
              resource.resource.playlistVideos = topic.video.videos.map(video => ({
                id: video.id,
                title: video.title,
                url: video.url,
                channel: video.channel?.name || video.channel || 'Unknown',
                duration: video.duration_string || video.duration || 'Unknown',
                publishDate: video.publish_date || 'Unknown',
                completed: progressData.completedVideos[video.id] || false,
                notes: progressData.videoNotes[video.id] || ''
              }));
            } else if (!topic.video.isPlaylist) {
              resource.resource.completed = progressData.completedVideos[topic.video.id] || false;
              resource.resource.notes = progressData.videoNotes[topic.video.id] || '';
            }

            resourcesData.resources.push(resource);
          }
        }
      }

      const jsonString = JSON.stringify(resourcesData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `youtube_resources_${new Date().toISOString().slice(0,10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log('Resources data saved to JSON file');
    } catch (error) {
      console.error('Error saving resources to JSON:', error);
    }
  };

  // Function to handle start YouTube journey button click
  const handleStartYouTubeJourney = () => {
    // Show user resource manager first
    setShowUserResourceManager(true);
  };

  // Function to handle completion of user resource management
  const handleUserResourcesComplete = (updatedRoadmap) => {
    // Hide user resource manager
    setShowUserResourceManager(false);
    
    // Update roadmap with user-provided resources
    setRoadmap(updatedRoadmap);
    
    // Start adding YouTube videos for topics without user resources
    addYouTubeVideos(updatedRoadmap);
  };

  // Function to handle cancellation of user resource management
  const handleUserResourcesCancel = () => {
    // Hide user resource manager
    setShowUserResourceManager(false);
    
    // Start adding YouTube videos for all topics
    addYouTubeVideos();
  };

  // Modified addYouTubeVideos function to handle user-provided resources
  const addYouTubeVideos = async (roadmapWithUserResources = null) => {
    try {
      setLoadingVideos(true);
      setError(null);
      setShowResourceLoadingModal(true);
      setFoundResources([]);
      setProgressPercent(0);

      // Use the roadmap with user resources if provided, otherwise use the current roadmap
      const updatedRoadmap = { ...(roadmapWithUserResources || roadmap) };
      
      // Calculate total topics for progress tracking
      let totalTopics = 0;
      let processedTopics = 0;
      
      updatedRoadmap.sections.forEach(section => {
        section.topics.forEach(topic => {
          // Only count topics that need resources (don't have user-provided resources)
          if (!topic.hasUserResource) {
            totalTopics++;
          }
        });
      });
      
      // Extract all topic titles from the roadmap for checking shared resources
      const allRoadmapTopics = [];
      updatedRoadmap.sections.forEach(section => {
        section.topics.forEach(topic => {
          // Normalize topic title and add to array
          const normalizedTitle = topic.title
            .replace(/^Complete\s+/i, '')
            .replace(/[()]/g, '')
            .split(' ')
            .filter((word, index, arr) => arr.indexOf(word) === index)
            .join(' ');
          
          allRoadmapTopics.push(normalizedTitle);
        });
      });
      
      console.log('All roadmap topics for shared resource checking:', allRoadmapTopics);
      
      for (let i = 0; i < updatedRoadmap.sections.length; i++) {
        const section = updatedRoadmap.sections[i];
        
        for (let j = 0; j < section.topics.length; j++) {
          const topic = section.topics[j];
          
          // Skip topics that already have user-provided resources
          if (topic.hasUserResource) {
            console.log(`Skipping "${topic.title}" - user provided resource`);
            continue;
          }
          
          try {
            // Fix duplicate technology names in search query
            const normalizedTopicTitle = topic.title.replace(/^Complete\s+/i, '').replace(/[()]/g, '');
            
            // Remove duplicate words (e.g., "HTML HTML" -> "HTML")
            const normalizedSectionTitle = section.title.split(' ')
              .filter((word, index, arr) => arr.indexOf(word) === index)
              .join(' ');
            
            const normalizedTopicWords = normalizedTopicTitle.split(' ')
              .filter((word, index, arr) => arr.indexOf(word) === index)
              .join(' ');
              
            const searchQuery = `${normalizedSectionTitle} ${normalizedTopicWords}`;
            console.log(`Finding video for: ${searchQuery}`);
            
            // Update current topic being processed
            setCurrentTopic(`${section.title}: ${topic.title}`);
            
            const isAdvancedTopic = section.difficulty === 'advanced' || 
                                   section.title.toLowerCase().includes('advanced');
            
            const videoOrPlaylist = await findBestVideoForTopic(searchQuery, isAdvancedTopic, allRoadmapTopics);
            
            if (videoOrPlaylist) {
              if (videoOrPlaylist.isPlaylist) {
                updatedRoadmap.sections[i].topics[j].video = {
                  title: videoOrPlaylist.title,
                  url: videoOrPlaylist.url,
                  channel: videoOrPlaylist.channel?.name || videoOrPlaylist.channel || 'Unknown',
                  videoCount: videoOrPlaylist.videoCount || videoOrPlaylist.video_count || videoOrPlaylist.videos?.length || 0,
                  avgViews: videoOrPlaylist.avgViews,
                  rating: videoOrPlaylist.rating || videoOrPlaylist.score || 'N/A',
                  quality: videoOrPlaylist.quality || videoOrPlaylist.verdict,
                  isPlaylist: true,
                  videos: videoOrPlaylist.videos?.map(video => ({
                    id: video.id,
                    title: video.title,
                    url: video.url,
                    channel: video.channel?.name || video.channel || 'Unknown',
                    duration: video.duration_string || video.duration || 'Unknown',
                    duration_string: video.duration_string || video.duration || 'Unknown',
                    publish_date: video.publish_date || 'Unknown',
                    views: video.views_formatted || 'N/A',
                    likes: video.likes_formatted || 'N/A',
                    thumbnail: video.thumbnail || 
                              (video.id && /^[a-zA-Z0-9_-]{11}$/.test(video.id) ? 
                                `https://img.youtube.com/vi/${video.id}/mqdefault.jpg` : 
                                'https://via.placeholder.com/320x180?text=No+Thumbnail')
                  })) || [],
                  directViewCount: videoOrPlaylist.directViewCount,
                  directViewCountFormatted: videoOrPlaylist.directViewCountFormatted
                };
                
                // Add to found resources list for display
                setFoundResources(prev => [...prev, {
                  title: videoOrPlaylist.title,
                  type: 'playlist',
                  videoCount: videoOrPlaylist.videoCount || videoOrPlaylist.video_count || videoOrPlaylist.videos?.length || 0,
                  thumbnail: videoOrPlaylist.videos?.[0]?.thumbnail || 
                            (videoOrPlaylist.videos?.[0]?.id && /^[a-zA-Z0-9_-]{11}$/.test(videoOrPlaylist.videos[0].id) ? 
                              `https://img.youtube.com/vi/${videoOrPlaylist.videos[0].id}/mqdefault.jpg` : 
                              'https://via.placeholder.com/320x180?text=No+Thumbnail')
                }]);
              } else {
                // For individual videos
                console.log(`Added video for "${topic.title}": ${videoOrPlaylist.title}`);
                
                // Format the resource for storage
                topic.video = {
                  id: videoOrPlaylist.id,
                  title: videoOrPlaylist.title,
                  url: videoOrPlaylist.url,
                  channel: videoOrPlaylist.channel?.name || videoOrPlaylist.channel || 'Unknown',
                  duration: videoOrPlaylist.duration_string || videoOrPlaylist.duration || 'Unknown',
                  duration_string: videoOrPlaylist.duration_string || videoOrPlaylist.duration || 'Unknown',
                  publish_date: videoOrPlaylist.publish_date || 'Unknown',
                  views: videoOrPlaylist.views_formatted || 'N/A',
                  likes: videoOrPlaylist.likes_formatted || 'N/A',
                  videos: [{
                    id: videoOrPlaylist.id,
                    title: videoOrPlaylist.title,
                    url: videoOrPlaylist.url,
                    channel: videoOrPlaylist.channel?.name || videoOrPlaylist.channel || 'Unknown',
                    duration: videoOrPlaylist.duration_string || videoOrPlaylist.duration || 'Unknown',
                    duration_string: videoOrPlaylist.duration_string || videoOrPlaylist.duration || 'Unknown',
                    publish_date: videoOrPlaylist.publish_date || 'Unknown',
                    views: videoOrPlaylist.views_formatted || 'N/A',
                    likes: videoOrPlaylist.likes_formatted || 'N/A',
                    thumbnail: videoOrPlaylist.thumbnail || 
                              (videoOrPlaylist.id && /^[a-zA-Z0-9_-]{11}$/.test(videoOrPlaylist.id) ? 
                                `https://img.youtube.com/vi/${videoOrPlaylist.id}/mqdefault.jpg` : 
                                'https://via.placeholder.com/320x180?text=No+Thumbnail')
                  }]
                };
                
                // Add to found resources list for display
                setFoundResources(prev => [...prev, {
                  title: videoOrPlaylist.title,
                  type: 'video',
                  thumbnail: videoOrPlaylist.thumbnail || 
                            (videoOrPlaylist.id && /^[a-zA-Z0-9_-]{11}$/.test(videoOrPlaylist.id) ? 
                              `https://img.youtube.com/vi/${videoOrPlaylist.id}/mqdefault.jpg` : 
                              'https://via.placeholder.com/320x180?text=No+Thumbnail')
                }]);
              }
              
              console.log(`Added ${videoOrPlaylist.isPlaylist ? 'playlist' : 'video'} for "${searchQuery}": ${videoOrPlaylist.title}`);
            }
            
            // Update progress
            processedTopics++;
            setProgressPercent(Math.round((processedTopics / totalTopics) * 100));
            
            await new Promise(resolve => setTimeout(resolve, 1000));
          } catch (error) {
            console.error(`Error finding video for ${topic.title}:`, error);
            
            // Update progress even on error
            processedTopics++;
            setProgressPercent(Math.round((processedTopics / totalTopics) * 100));
          }
        }
      }
      
      // Make sure to preserve the isCustom flag
      updatedRoadmap.isCustom = roadmap.isCustom;
      
      setRoadmap(updatedRoadmap);
      localStorage.setItem('roadmapData', JSON.stringify(updatedRoadmap));
      await saveResourcesToJson(updatedRoadmap);
      
      // Update shared resources after roadmap generation is complete
      try {
        console.log('Analyzing roadmap for shared resources...');
        setCurrentTopic('Analyzing for shared resources across technologies...');
        const result = await updateSharedResources(updatedRoadmap);
        console.log('Shared resources update result:', result);
        if (result.updatedCount > 0) {
          toast.success(`Updated ${result.updatedCount} shared resources`);
        }
      } catch (error) {
        console.error('Error updating shared resources:', error);
        // Non-critical error, don't block the user flow
      }
      
      try {
        // Direct API call to save the roadmap
        console.log('Making direct API call to save roadmap');
        
        // Always use the regular roadmap endpoint for now
        const formattedRoadmap = {
          title: updatedRoadmap.title,
          description: updatedRoadmap.description || '',
          category: updatedRoadmap.category || 'Web Development',
          difficulty: updatedRoadmap.difficulty || 'Intermediate',
          isPublic: false,
          isCustom: false, // Force to false to use regular endpoint
          topics: []
        };
        
        // Convert sections to topics format
        if (updatedRoadmap.sections && updatedRoadmap.sections.length > 0) {
          formattedRoadmap.topics = updatedRoadmap.sections.map((section, index) => {
            // Process resources if they exist
            let resources = [];
            if (section.topics && section.topics[0]?.video?.videos) {
              resources = section.topics[0].video.videos.map(video => {
                return {
                  title: video.title,
                  url: video.url,
                  type: 'video',
                  description: video.description || '',
                  thumbnailUrl: video.thumbnail || '',
                  source: video.channel || 'YouTube',
                  duration: processDuration(video.duration),
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
          });
        }
        
        // Helper function to process duration values
        function processDuration(duration) {
          // If it's already a number, return it
          if (typeof duration === 'number' && !isNaN(duration)) {
            return duration;
          }
          
          // If it's a string with a colon (time format like "5:30")
          if (typeof duration === 'string' && duration.includes(':')) {
            const parts = duration.split(':').map(part => parseInt(part) || 0);
            
            // Handle HH:MM:SS format
            if (parts.length === 3) {
              return (parts[0] * 3600) + (parts[1] * 60) + parts[2];
            }
            
            // Handle MM:SS format
            else if (parts.length === 2) {
              return (parts[0] * 60) + parts[1];
            }
          }
          
          // If it's a numeric string
          if (typeof duration === 'string' && !isNaN(duration)) {
            return parseInt(duration);
          }
          
          // Default to a reasonable duration if we can't parse it
          // This is better than storing 0 or 1 which are clearly wrong
          return 300; // 5 minutes as a reasonable default
        }
        
        // Get token from localStorage
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No auth token found');
        }
        
        // Log the formatted roadmap
        console.log('Formatted roadmap for API:', JSON.stringify(formattedRoadmap, null, 2));
        
        // Create axios instance for direct API call
        const API_URL = 'http://localhost:5000/api';
        // Always use the regular roadmaps endpoint
        const endpoint = '/roadmaps';
        
        console.log(`Making API call to ${API_URL}${endpoint}`);
        
        const response = await axios.post(`${API_URL}${endpoint}`, formattedRoadmap, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('Direct API save response:', response);
        
        // Check for ID in different possible locations in the response
        const roadmapId = response.data?._id || 
                         response.data?.data?._id || 
                         response.data?.roadmap?._id;
        
        if (roadmapId) {
          console.log('Successfully saved roadmap with ID:', roadmapId);
          toast.success('Roadmap saved successfully!');
          
          // Close modal and navigate after a short delay to show 100% completion
          setTimeout(() => {
            setShowResourceLoadingModal(false);
            navigate(`/roadmaps/${roadmapId}/resources`);
          }, 1500);
        } else {
          console.error('No ID found in response:', response.data);
          throw new Error('No ID returned from API');
        }
      } catch (saveError) {
        console.error('Error saving roadmap:', saveError);
        
        // Save to JSON file as fallback
        saveRoadmapToJson(updatedRoadmap);
        
        // Close modal after a short delay
        setTimeout(() => {
          setShowResourceLoadingModal(false);
          toast.error('Could not save to database. Roadmap saved locally.');
        }, 1500);
      }
    } catch (error) {
      console.error('Error finding YouTube resources:', error);
      setError('Failed to find YouTube resources. Please try again.');
      setShowResourceLoadingModal(false);
    } finally {
      setLoadingVideos(false);
    }
  };

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    setRetryCount(prev => prev + 1);
    window.location.reload();
  };

  // Add export roadmap function
  const handleExportRoadmap = () => {
    if (!roadmap) return;
    
    try {
      const result = downloadRoadmap(roadmap);
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
      <div className="min-h-screen relative overflow-hidden" style={{ background: 'linear-gradient(to bottom, #FFF7ED, #FFFFFF)' }}>
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
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-b from-slate-50 via-purple-50 to-slate-50">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/path-pattern.svg')] opacity-5"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-50/20 to-transparent"></div>
        <motion.div 
          className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.05),transparent_50%)]"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.3, 0.2]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
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
      
      <div className="pt-20">
        <div className="flex flex-col">
          <RoadmapHeader 
            title={roadmap.title}
            description={roadmap.description}
            fromSaved={fromSaved}
            isCustom={roadmap.isCustom}
            editMode={editMode}
            setEditMode={setEditMode}
            onExport={handleExportRoadmap}
            hasResources={hasResources}
          />
          
          {/* Edit button for custom roadmaps removed */}
        </div>
  
        {/* Automatic save notification */}
        {(savedToDB || savingToDB) && (
          <div className="px-6 mb-8 flex justify-center">
            <div className="w-full max-w-2xl">
              <div className={`flex items-center justify-center ${savingToDB ? 'text-blue-600 bg-blue-50 border-blue-200' : 'text-green-600 bg-green-50 border-green-200'} font-medium p-3 rounded-lg shadow-sm border`}>
                {savingToDB ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Automatically saving your roadmap...
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
            onSave={() => saveRoadmapToDatabase(roadmap)}
            onAddVideos={handleStartYouTubeJourney}
            loadingVideos={loadingVideos}
            savedToDB={savedToDB}
            savingToDB={savingToDB}
            onExport={handleExportRoadmap}
            roadmap={roadmap}
            hasResources={hasResources}
          />

          {/* Save Button - Only show for roadmaps without resources or if not already saved */}
          {isAuthenticated && (!hasResources || !savedToDB) && (
            <div className="mt-6 flex justify-center">
              <button
                onClick={() => saveRoadmapToDatabase(roadmap)}
                disabled={savingToDB || savedToDB}
                className={`flex items-center px-6 py-3 rounded-lg shadow-md ${
                  savingToDB || savedToDB ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
                } text-white font-medium transition-colors`}
              >
                {savingToDB ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : savedToDB ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Saved
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h1a2 2 0 012 2v7a2 2 0 01-2 2H8a2 2 0 01-2-2v-7a2 2 0 012-2h1v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z" />
                    </svg>
                    Save to Profile
                  </>
                )}
              </button>
            </div>
          )}
        </motion.div>
      </div>
      <ChatbotWrapper />
    </div>
  );
};

export default RoadmapResultPage; 