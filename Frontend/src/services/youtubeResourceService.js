import { findBestVideoForTopic } from './youtubeService';
import { updateSharedResources } from './resourceCache';
import { toast } from 'react-hot-toast';
import axios from 'axios';

/**
 * Process duration values to ensure consistent format
 * @param {string|number} duration - Duration in various formats
 * @returns {number} Duration in seconds
 */
export const processDuration = (duration) => {
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
  return 300; // 5 minutes as a reasonable default
};

/**
 * Add YouTube videos to a roadmap
 * @param {Object} roadmap - The roadmap to add videos to
 * @param {Object} options - Options for video addition
 * @param {Function} callbacks - Callback functions for progress updates
 * @returns {Promise<Object>} Updated roadmap with videos
 */
export const addYouTubeVideos = async (
  roadmap,
  options = { skipUserProvided: true },
  callbacks = {
    setLoadingVideos: () => {},
    setError: () => {},
    setShowResourceLoadingModal: () => {},
    setFoundResources: () => {},
    setCurrentTopic: () => {},
    setProgressPercent: () => {},
    onComplete: () => {}
  }
) => {
  const { 
    setLoadingVideos, 
    setError, 
    setShowResourceLoadingModal, 
    setFoundResources,
    setCurrentTopic,
    setProgressPercent,
    onComplete
  } = callbacks;

  try {
    // Set initial states
    setLoadingVideos(true);
    setError(null);
    setShowResourceLoadingModal(true);
    setFoundResources([]);
    setProgressPercent(0);

    // Create a copy of the roadmap to modify
    const updatedRoadmap = { ...roadmap };
    
    // Calculate total topics for progress tracking
    let totalTopics = 0;
    let processedTopics = 0;
    
    updatedRoadmap.sections.forEach(section => {
      section.topics.forEach(topic => {
        // Only count topics that need resources (don't have user-provided resources)
        if (!topic.hasUserResource || !options.skipUserProvided) {
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
    
    // Process each section and topic
    for (let i = 0; i < updatedRoadmap.sections.length; i++) {
      const section = updatedRoadmap.sections[i];
      
      for (let j = 0; j < section.topics.length; j++) {
        const topic = section.topics[j];
        
        // Skip topics that already have user-provided resources if specified in options
        if (options.skipUserProvided && topic.hasUserResource) {
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
    
    // Trigger completion callback with the updated roadmap
    if (onComplete) {
      onComplete(updatedRoadmap);
    }
    
    return updatedRoadmap;
  } catch (error) {
    console.error('Error finding YouTube resources:', error);
    setError('Failed to find YouTube resources. Please try again.');
    setShowResourceLoadingModal(false);
    throw error;
  } finally {
    setLoadingVideos(false);
  }
};

/**
 * Format roadmap data for API submission
 * @param {Object} roadmapData - The roadmap data to format
 * @returns {Object} Formatted roadmap data
 */
export const formatRoadmapForApi = (roadmapData) => {
  // Always use the regular roadmap endpoint for now
  const formattedRoadmap = {
    title: roadmapData.title,
    description: roadmapData.description || '',
    category: roadmapData.category || 'Web Development',
    difficulty: roadmapData.difficulty || 'Intermediate',
    isPublic: false,
    isCustom: roadmapData.isCustom || false,
    topics: []
  };
  
  // Convert sections to topics format
  if (roadmapData.sections && roadmapData.sections.length > 0) {
    formattedRoadmap.topics = roadmapData.sections.map((section, index) => {
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
  
  return formattedRoadmap;
};

/**
 * Save roadmap with resources directly to API
 * @param {Object} updatedRoadmap - The roadmap with resources to save
 * @returns {Promise<Object>} Result of the save operation
 */
export const saveRoadmapWithResources = async (updatedRoadmap) => {
  try {
    // Get token from localStorage
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No auth token found');
    }
    
    const formattedRoadmap = formatRoadmapForApi(updatedRoadmap);
    
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
      return {
        success: true,
        message: 'Roadmap saved successfully!',
        roadmapId: roadmapId
      };
    } else {
      console.error('No ID found in response:', response.data);
      throw new Error('No ID returned from API');
    }
  } catch (error) {
    console.error('Error saving roadmap:', error);
    throw error;
  }
}; 