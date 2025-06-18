import axios from 'axios';
import { getUserRoadmaps } from './roadmapService';
import { getUserCustomRoadmaps } from './customRoadmapService';

// Force the correct port regardless of environment variable
const API_URL = 'http://localhost:5000/api';

// Create axios instance with credentials
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * Parse duration string to seconds
 * @param {string|number} durationStr - Duration string like "10:30" or "1:23:45" or number in seconds
 * @returns {number} Duration in seconds
 */
const parseDurationToSeconds = (durationStr) => {
  if (!durationStr) return 0;
  
  // If it's already a number, return it (assuming it's already in seconds)
  if (typeof durationStr === 'number') {
    return durationStr;
  }
  
  // If it's not a string, try to convert it
  if (typeof durationStr !== 'string') {
    console.warn('Duration is not a string:', durationStr);
    return 0;
  }
  
  try {
    const parts = durationStr.split(':').map(part => parseInt(part) || 0);
    
    if (parts.length === 2) {
      // Format: MM:SS
      return parts[0] * 60 + parts[1];
    } else if (parts.length === 3) {
      // Format: HH:MM:SS
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    
    return 0;
  } catch (error) {
    console.warn('Error parsing duration:', durationStr, error);
    return 0;
  }
};

/**
 * Format learning time from seconds to readable format
 * @param {number} totalSeconds - Total seconds of learning time
 * @returns {string} Formatted time string
 */
export const formatLearningTime = (totalSeconds) => {
  if (!totalSeconds || totalSeconds === 0) return '0m';
  
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
};

/**
 * Get comprehensive user statistics
 * @returns {Promise<Object>} User statistics object
 */
export const getUserStats = async () => {
  try {
    // Fetch all roadmaps and custom roadmaps
    const [regularRoadmapsResponse, customRoadmapsResponse] = await Promise.all([
      getUserRoadmaps(),
      getUserCustomRoadmaps()
    ]);

    const regularRoadmaps = regularRoadmapsResponse?.data || [];
    const customRoadmaps = customRoadmapsResponse?.data || [];

    // Calculate statistics
    const stats = {
      totalRoadmaps: regularRoadmaps.length + customRoadmaps.length,
      regularRoadmaps: regularRoadmaps.length,
      customRoadmaps: customRoadmaps.length,
      completedRoadmaps: 0,
      totalResources: 0,
      completedVideos: 0,
      totalVideos: 0,
      totalNotes: 0,
      averageCompletion: 0,
      totalTopics: 0,
      completedTopics: 0,
      totalLearningTime: 0
    };

    // Track completed videos to avoid double counting
    const completedVideoIds = new Set();

    // Process regular roadmaps
    regularRoadmaps.forEach(roadmap => {
      // Count completed roadmaps
      if (roadmap.completionPercentage === 100) {
        stats.completedRoadmaps++;
      }

      // Count topics
      if (roadmap.topics) {
        stats.totalTopics += roadmap.topics.length;
        stats.completedTopics += roadmap.topics.filter(topic => 
          topic.progress === 'completed'
        ).length;
      }

      // Count resources and videos
      if (roadmap.topics) {
        roadmap.topics.forEach(topic => {
          if (topic.resources && topic.resources.length > 0) {
            stats.totalResources += topic.resources.length;
            stats.totalVideos += topic.resources.length;
            
            // Calculate total learning time from completed videos
            topic.resources.forEach(resource => {
              if (topic.completedResourceIds && 
                  topic.completedResourceIds.includes(resource._id.toString())) {
                
                // Only count each video once
                if (!completedVideoIds.has(resource._id.toString())) {
                  completedVideoIds.add(resource._id.toString());
                  stats.completedVideos++;
                  
                  // Add video duration to total learning time
                  if (resource.duration_seconds) {
                    console.log('Using duration_seconds:', resource.duration_seconds, typeof resource.duration_seconds);
                    stats.totalLearningTime += parseInt(resource.duration_seconds);
                  } else if (resource.duration) {
                    // Fallback to duration field if duration_seconds doesn't exist
                    console.log('Using duration field:', resource.duration, typeof resource.duration);
                    const timeInSeconds = parseDurationToSeconds(resource.duration);
                    if (timeInSeconds > 0) {
                      stats.totalLearningTime += timeInSeconds;
                    }
                  } else {
                    console.log('No duration data found for resource:', resource);
                  }
                }
              }
            });
          }
        });
      }
    });

    // Process custom roadmaps
    customRoadmaps.forEach(roadmap => {
      if (roadmap.sections) {
        roadmap.sections.forEach(section => {
          if (section.topics) {
            stats.totalTopics += section.topics.length;
            
            section.topics.forEach(topic => {
              if (topic.video?.videos) {
                stats.totalVideos += topic.video.videos.length;
                stats.totalResources += topic.video.videos.length;
                
                // For custom roadmaps, we'll count all videos as completed for now
                // You might want to add a completion tracking system for custom roadmaps
                topic.video.videos.forEach(video => {
                  // Only count each video once
                  const videoId = video.id || video._id || video.url;
                  if (videoId && !completedVideoIds.has(videoId)) {
                    completedVideoIds.add(videoId);
                    stats.completedVideos++;
                    
                    if (video.duration_seconds) {
                      console.log('Custom roadmap - Using duration_seconds:', video.duration_seconds, typeof video.duration_seconds);
                      stats.totalLearningTime += parseInt(video.duration_seconds);
                    } else if (video.duration) {
                      // Fallback to duration field if duration_seconds doesn't exist
                      console.log('Custom roadmap - Using duration field:', video.duration, typeof video.duration);
                      const timeInSeconds = parseDurationToSeconds(video.duration);
                      if (timeInSeconds > 0) {
                        stats.totalLearningTime += timeInSeconds;
                      }
                    } else {
                      console.log('Custom roadmap - No duration data found for video:', video);
                    }
                  }
                });
              }
            });
          }
        });
      }
    });

    // Ensure completion percentage doesn't exceed 100%
    if (stats.totalVideos > 0) {
      const completionPercentage = Math.round((stats.completedVideos / stats.totalVideos) * 100);
      stats.completionPercentage = Math.min(completionPercentage, 100);
    } else {
      stats.completionPercentage = 0;
    }

    // Calculate average completion percentage
    const allRoadmaps = [...regularRoadmaps, ...customRoadmaps];
    if (allRoadmaps.length > 0) {
      const totalCompletion = allRoadmaps.reduce((sum, roadmap) => {
        return sum + (roadmap.completionPercentage || 0);
      }, 0);
      stats.averageCompletion = Math.round(totalCompletion / allRoadmaps.length);
    }

    console.log('User stats calculated:', stats);
    console.log('Completed video IDs:', Array.from(completedVideoIds));
    return stats;
  } catch (error) {
    console.error('Error fetching user stats:', error);
    // Return default stats on error
    return {
      totalRoadmaps: 0,
      regularRoadmaps: 0,
      customRoadmaps: 0,
      completedRoadmaps: 0,
      totalResources: 0,
      completedVideos: 0,
      totalVideos: 0,
      totalNotes: 0,
      averageCompletion: 0,
      totalTopics: 0,
      completedTopics: 0,
      totalLearningTime: 0
    };
  }
}; 