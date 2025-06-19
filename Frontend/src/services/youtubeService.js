const API_URL = import.meta.env.VITE_YOUTUBE_API_URL || 'http://127.0.0.1:8000';
console.log('Using API URL:', API_URL); // Debug log

// OpenRouter API keys for video/content relevance checks
const OPENROUTER_API_KEYS = [
  import.meta.env.VITE_OPENROUTER_API_KEY_1,
  import.meta.env.VITE_OPENROUTER_API_KEY_2,
  import.meta.env.VITE_OPENROUTER_API_KEY_3
];

// Together AI API keys for technology equivalence
const TOGETHER_API_KEYS = [
  import.meta.env.VITE_TOGETHER_API_KEY_1,
  import.meta.env.VITE_TOGETHER_API_KEY_2,
  import.meta.env.VITE_TOGETHER_API_KEY_3,
  import.meta.env.VITE_TOGETHER_API_KEY_4,
];

// Import Together AI library
import Together from "together-ai";

// Import the resource cache service
import { findResourcesForTechnology, cacheResource } from './resourceCache';

let openRouterKeyIndex = 0;
let togetherKeyIndex = 0;

// Track API call timestamps for rate limiting
const API_CALL_TIMESTAMPS = {
  openrouter: [],
  together: []
};

// Rate limiting configuration
const RATE_LIMITS = {
  openrouter: {
    requestsPerMinute: 10,
    windowMs: 60000 // 1 minute in milliseconds
  },
  together: {
    requestsPerMinute: 10,
    windowMs: 60000 // 1 minute in milliseconds
  }
};

/**
 * Check if we've exceeded rate limits for a specific API
 * @param {string} apiType - Either 'openrouter' or 'together'
 * @returns {boolean} - True if rate limit exceeded, false otherwise
 */
const isRateLimited = (apiType) => {
  const now = Date.now();
  const config = RATE_LIMITS[apiType];
  const timestamps = API_CALL_TIMESTAMPS[apiType];
  
  // Remove timestamps older than the window
  const recentTimestamps = timestamps.filter(ts => (now - ts) < config.windowMs);
  API_CALL_TIMESTAMPS[apiType] = recentTimestamps;
  
  // Check if we've exceeded the rate limit
  return recentTimestamps.length >= config.requestsPerMinute;
};

/**
 * Record an API call timestamp for rate limiting
 * @param {string} apiType - Either 'openrouter' or 'together'
 */
const recordApiCall = (apiType) => {
  API_CALL_TIMESTAMPS[apiType].push(Date.now());
};

/**
 * Get the next available OpenRouter API key
 * @returns {string} The next API key to use
 */
const getNextOpenRouterApiKey = () => {
  openRouterKeyIndex = (openRouterKeyIndex + 1) % OPENROUTER_API_KEYS.length;
  return OPENROUTER_API_KEYS[openRouterKeyIndex];
};

/**
 * Get the next available Together AI API key
 * @returns {string} The next API key to use
 */
const getNextTogetherApiKey = () => {
  togetherKeyIndex = (togetherKeyIndex + 1) % TOGETHER_API_KEYS.length;
  return TOGETHER_API_KEYS[togetherKeyIndex];
};

/**
 * Create a new Together AI client with the specified API key
 * @param {string} apiKey - The API key to use
 * @returns {Together} - A new Together AI client
 */
const createTogetherClient = (apiKey) => {
  return new Together({ 
    apiKey,
    retries: 0, // We'll handle retries ourselves
    timeout: 30000 // 30 second timeout
  });
};

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const API_RATE_LIMIT_DELAY = 5000; // 5 seconds
const API_MAX_RETRIES = 3;

// Flag to control whether to use LLMs for relevance checking
// Set to false to avoid excessive API calls during development
// Note: Playlist relevance checking now happens through the backend /find/best-playlist API
const ENABLE_LLM_RELEVANCE = false;

// Track shared resources to avoid redundant searches
const sharedResourcesMap = new Map();
const sharedResourceTopics = new Map(); // New map to track topics for each resource

/**
 * Check if two technology names are equivalent using the sentence-transformers API
 * @param {string} tech1 - First technology name
 * @param {string} tech2 - Second technology name
 * @returns {Promise<boolean>} - Whether the technologies are equivalent
 */
const areTechnologiesEquivalent = async (tech1, tech2) => {
  // Normalize technology names to remove duplicated words
  const normalizedTech1 = normalizeTechName(tech1);
  const normalizedTech2 = normalizeTechName(tech2);
  
  // Quick check for exact matches or simple cases
  if (normalizedTech1.toLowerCase() === normalizedTech2.toLowerCase()) {
    return true;
  }
  
  const TECH_MATCHER_API_URL = import.meta.env.VITE_TECH_MATCHER_API_URL || 'http://localhost:8000';
  let retryCount = 0;
  const maxRetries = 3;
  let backoffDelay = 1000; // Start with 1 second
  
  while (retryCount < maxRetries) {
    try {
      console.log(`Checking if technologies are equivalent: "${normalizedTech1}" and "${normalizedTech2}" (Attempt ${retryCount + 1}/${maxRetries})`);
      
      // Call the tech matcher API
      const response = await fetch(`${TECH_MATCHER_API_URL}/match?tech1=${encodeURIComponent(normalizedTech1)}&tech2=${encodeURIComponent(normalizedTech2)}`);

      if (!response.ok) {
        throw new Error(`API returned status: ${response.status}`);
      }

      const result = await response.json();
      
      console.log(`Technology equivalence result: ${result.areEquivalent ? 'EQUIVALENT' : 'DIFFERENT'} (similarity: ${result.similarity.toFixed(2)})`);
        console.log(`Explanation: ${result.explanation}`);
      
        return result.areEquivalent;
    } catch (error) {
      console.error('Error checking technology equivalence:', error);
      
        retryCount++;
      
      if (retryCount < maxRetries) {
        // Apply exponential backoff
        console.log(`API error. Retrying with backoff (${backoffDelay}ms)...`);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
        backoffDelay *= 2; // Exponential backoff
        continue;
      }
      
      // If all retries fail, use fallback method
      console.log('Using fallback technology matching method');
      return fallbackAreTechnologiesEquivalent(normalizedTech1, normalizedTech2);
    }
  }
  
  return fallbackAreTechnologiesEquivalent(normalizedTech1, normalizedTech2);
};

/**
 * Fallback method to check if two technology names are equivalent
 * @param {string} tech1 - First technology name
 * @param {string} tech2 - Second technology name
 * @returns {boolean} - Whether the technologies are equivalent
 */
const fallbackAreTechnologiesEquivalent = (tech1, tech2) => {
  const normalizeTech = (tech) => {
    return tech.toLowerCase()
      .replace(/\./g, '')
      .replace(/\s+/g, '')
      .replace(/[^a-z0-9]/g, '');
  };
  
  return normalizeTech(tech1) === normalizeTech(tech2);
};

/**
 * Normalize a technology name to remove duplicated words
 * @param {string} tech - The technology name to normalize
 * @returns {string} - The normalized technology name
 */
const normalizeTechName = (tech) => {
  // Remove duplicated words (e.g., "Git Git" -> "Git")
  const words = tech.split(' ');
  const uniqueWords = [...new Set(words)];
  return uniqueWords.join(' ');
};

/**
 * Check if a topic is already covered by a shared resource
 * @param {string} topic - The topic to check
 * @param {Array<string>} roadmapTopics - All topics in the current roadmap
 * @returns {Promise<Object|null>} - The shared resource if found, null otherwise
 */
const getSharedResourceForTopic = async (topic, roadmapTopics = []) => {
  const normalizedTopic = topic.toLowerCase();
  
  // First check for exact matches
  if (sharedResourcesMap.has(normalizedTopic)) {
    const resource = sharedResourcesMap.get(normalizedTopic);
    
    // If we have roadmap topics, verify that all technologies in the shared resource
    // are part of the roadmap
    if (roadmapTopics && roadmapTopics.length > 0) {
      const resourceTopics = getTopicsForResource(resource);
      
      // Convert roadmap topics to lowercase for case-insensitive comparison
      const normalizedRoadmapTopics = roadmapTopics.map(t => t.toLowerCase());
      
      // Check if all resource topics are in the roadmap
      const allTopicsInRoadmap = resourceTopics.every(resourceTopic => {
        // Check for direct match
        if (normalizedRoadmapTopics.includes(resourceTopic)) {
          return true;
        }
        
        // Check for equivalent match
        for (const roadmapTopic of normalizedRoadmapTopics) {
          if (fallbackAreTechnologiesEquivalent(resourceTopic, roadmapTopic)) {
            return true;
          }
        }
        
        return false;
      });
      
      if (!allTopicsInRoadmap) {
        console.log(`Found shared resource for "${topic}" but not all its technologies are in the roadmap. Skipping.`);
        return null;
      }
    }
    
    return resource;
  }
  
  // Then check all existing topics for equivalence
  for (const [existingTopic, resource] of sharedResourcesMap.entries()) {
    if (await areTechnologiesEquivalent(normalizedTopic, existingTopic)) {
      console.log(`Found equivalent technology: "${normalizedTopic}" matches "${existingTopic}"`);
      
      // If we have roadmap topics, verify that all technologies in the shared resource
      // are part of the roadmap
      if (roadmapTopics && roadmapTopics.length > 0) {
        const resourceTopics = getTopicsForResource(resource);
        
        // Convert roadmap topics to lowercase for case-insensitive comparison
        const normalizedRoadmapTopics = roadmapTopics.map(t => t.toLowerCase());
        
        // Check if all resource topics are in the roadmap
        const allTopicsInRoadmap = resourceTopics.every(resourceTopic => {
          // Check for direct match
          if (normalizedRoadmapTopics.includes(resourceTopic)) {
            return true;
          }
          
          // Check for equivalent match
          for (const roadmapTopic of normalizedRoadmapTopics) {
            if (fallbackAreTechnologiesEquivalent(resourceTopic, roadmapTopic)) {
              return true;
            }
          }
          
          return false;
        });
        
        if (!allTopicsInRoadmap) {
          console.log(`Found shared resource for "${topic}" but not all its technologies are in the roadmap. Skipping.`);
          return null;
        }
      }
      
      return resource;
    }
  }
  
  return null;
};

/**
 * Add a shared resource to the tracking map
 * @param {Object} resource - The resource to add
 * @param {Array<string>} topics - The topics this resource covers
 */
const addSharedResource = async (resource, topics) => {
  const normalizedTopics = topics.map(t => t.toLowerCase());
  
  // Add each topic and check for equivalents
  for (const topic of normalizedTopics) {
    // Add the original topic
    sharedResourcesMap.set(topic, resource);
    
    // Check all existing topics for equivalence
    for (const existingTopic of sharedResourcesMap.keys()) {
      if (existingTopic !== topic && await areTechnologiesEquivalent(topic, existingTopic)) {
        console.log(`Found equivalent technology: "${topic}" matches "${existingTopic}"`);
        sharedResourcesMap.set(existingTopic, resource);
      }
    }
  }
  
  // Store all topics for this resource
  const resourceId = resource.url || resource.id;
  if (!sharedResourceTopics.has(resourceId)) {
    sharedResourceTopics.set(resourceId, new Set());
  }
  normalizedTopics.forEach(topic => sharedResourceTopics.get(resourceId).add(topic));
  
  // Update the resource with all matching topics
  resource.matchingTechnologies = Array.from(sharedResourceTopics.get(resourceId));
  
  console.log(`Added shared resource for topics: ${Array.from(sharedResourceTopics.get(resourceId)).join(', ')}`);
};

/**
 * Get all topics covered by a shared resource
 * @param {Object} resource - The resource to get topics for
 * @returns {Array<string>} - Array of topics covered by the resource
 */
const getTopicsForResource = (resource) => {
  const resourceId = resource.url || resource.id;
  return Array.from(sharedResourceTopics.get(resourceId) || []);
};

/**
 * Get details for a specific YouTube video
 * @param {string} videoUrl - The URL of the video
 * @returns {Promise<Object>} - Video details
 */
export const getVideoDetails = async (videoUrl) => {
  try {
    const response = await fetch(`${API_URL}/video/details?url=${encodeURIComponent(videoUrl)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error fetching video details');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching video details:', error);
    throw error;
  }
};

/**
 * Get videos from a YouTube playlist
 * @param {string} playlistUrl - The URL of the playlist
 * @param {number} limit - Maximum number of videos to return (not used in API call)
 * @param {number} maxDetails - Maximum number of videos to get full details for (not used in API call)
 * @returns {Promise<Object>} - Playlist videos
 */
export const getPlaylistVideos = async (playlistUrl, limit = 0, maxDetails = 999) => {
  try {
    // Use parameters that fetch all videos and get details for all of them
    const params = new URLSearchParams({
      url: playlistUrl,
      max_details: maxDetails // Request details for all videos
      // Don't specify limit to get all videos
    });

    console.log(`Fetching playlist videos from: ${API_URL}/playlist/videos?${params}`);

    const response = await fetch(`${API_URL}/playlist/videos?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error fetching playlist videos');
    }

    const playlistData = await response.json();
    
    // Log response to help debug
    console.log(`Received ${playlistData.videos?.length || 0} videos from playlist`);
    
    return playlistData;
  } catch (error) {
    console.error('Error fetching playlist videos:', error);
    throw error;
  }
};

/**
 * Fetch real durations for videos in a playlist
 * @param {Array} videos - Array of video objects
 * @returns {Promise<Array>} - Updated videos with real durations
 */
export const fetchRealDurations = async (videos) => {
  if (!videos || videos.length === 0) return videos;
  
  console.log(`Fetching real durations for ${videos.length} videos`);
  
  // Only process videos that have placeholder durations
  const placeholderDurations = ['0:01', '0:00', '00:01', '00:00', 0, 1];
  const videosToUpdate = videos.filter(video => 
    placeholderDurations.includes(video.duration) || 
    placeholderDurations.includes(video.duration_seconds)
  );
  
  if (videosToUpdate.length === 0) {
    console.log('No videos with placeholder durations found');
    return videos;
  }
  
  console.log(`Found ${videosToUpdate.length} videos with placeholder durations`);
  
  // Process in batches to avoid overloading the API
  const batchSize = 5;
  const updatedVideos = [...videos]; // Create a copy to update
  
  for (let i = 0; i < videosToUpdate.length; i += batchSize) {
    const batch = videosToUpdate.slice(i, i + batchSize);
    const promises = batch.map(video => getVideoDetails(video.url).catch(err => null));
    
    try {
      const results = await Promise.all(promises);
      
      // Update videos with real durations
      results.forEach((result, index) => {
        if (!result) return; // Skip if we couldn't get details
        
        const videoToUpdate = batch[index];
        const videoIndex = updatedVideos.findIndex(v => v.id === videoToUpdate.id);
        
        if (videoIndex !== -1) {
          // Update duration information
          if (result.duration_seconds) {
            updatedVideos[videoIndex].duration_seconds = result.duration_seconds;
            
            // Format duration string
            const minutes = Math.floor(result.duration_seconds / 60);
            const seconds = result.duration_seconds % 60;
            updatedVideos[videoIndex].duration = `${minutes}:${seconds.toString().padStart(2, '0')}`;
          } else if (result.duration_string) {
            updatedVideos[videoIndex].duration = result.duration_string;
          }
          
          console.log(`Updated duration for video: ${videoToUpdate.title} -> ${updatedVideos[videoIndex].duration}`);
        }
      });
    } catch (error) {
      console.error('Error fetching video details batch:', error);
    }
    
    // Add a small delay between batches to avoid rate limiting
    if (i + batchSize < videosToUpdate.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  console.log(`Updated durations for ${videosToUpdate.length} videos`);
  return updatedVideos;
};

/**
 * Search YouTube for videos matching a query
 * @param {string} query - The search query
 * @param {number} limit - Maximum number of results to return
 * @param {Object} options - Additional search options
 * @returns {Promise<Array>} - Array of search results
 */
export const searchYouTube = async (query, limit = 10, options = {}) => {
  try {
    console.log(`Searching YouTube for: "${query}" (limit: ${limit})`);
    
    // Extract options
    const { 
      contentType, 
      minDuration, 
      maxDuration,
      filterTechnology,
      useEmbeddings = true,
      useGroqRelevance = false,
      useBatchRelevance = true  // New option to enable batch relevance checking
    } = options;
    
    // Prepare the API URL with query parameters
    const params = new URLSearchParams({
      query,
      limit
    });
    
    // Add optional parameters if provided
    if (contentType) params.append('content_type', contentType);
    if (minDuration) params.append('min_duration', minDuration);
    if (maxDuration) params.append('max_duration', maxDuration);

    const response = await fetch(`${API_URL}/search/videos?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error searching YouTube');
    }

    const data = await response.json();
    let videos = data.items || data.results || [];
    
    console.log(`Found ${videos.length} videos for query: "${query}"`);
    
    // If we need to filter by technology relevance
    if (filterTechnology) {
      console.log(`Filtering videos by relevance to: ${filterTechnology}`);
      
      // Prepare videos with technology information
      videos = videos.map(video => ({
        ...video,
        topicRelevanceTerm: filterTechnology
      }));
      
      // Use batch processing if enabled
      if (useBatchRelevance && videos.length > 1) {
        console.log(`Using batch relevance checking for ${videos.length} videos`);
        videos = await processBatchVideoRelevance(videos, filterTechnology);
      } 
      // Otherwise process individually
      else {
        console.log('Using individual relevance checking');
        for (const video of videos) {
          let isRelevant = false;
          
          // Check relevance based on the selected method
          if (useGroqRelevance) {
            isRelevant = await checkRelevanceWithGroq(video.title, filterTechnology);
          } else if (useEmbeddings) {
            isRelevant = await checkRelevanceWithEmbeddings(video.title, filterTechnology);
          } else {
            isRelevant = defaultRelevanceCheck(video.title, filterTechnology);
          }
          
          video.isRelevant = isRelevant;
        }
      }
      
      // Filter out non-relevant videos
      const relevantVideos = videos.filter(video => video.isRelevant);
      console.log(`Filtered to ${relevantVideos.length} relevant videos for ${filterTechnology}`);
      
      // If we have enough relevant videos, return only those
      if (relevantVideos.length >= Math.min(5, limit)) {
        return relevantVideos;
      }
      
      // Otherwise, include some non-relevant videos but mark them
      console.log('Not enough relevant videos, including some non-relevant ones');
      return videos;
    }
    
    return videos;
  } catch (error) {
    console.error('Error searching YouTube:', error);
    return [];
  }
};

/**
 * Search YouTube for playlists based on a query
 * @param {string} query - The search query
 * @param {number} limit - Maximum number of results to return (not used in API call)
 * @returns {Promise<Object>} - Search results for playlists
 */
export const searchPlaylists = async (query, limit = 10) => {
  try {
    // Only include the essential query parameter
    const params = new URLSearchParams({
      query
    });

    const response = await fetch(`${API_URL}/search/playlists?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error searching playlists');
    }

    return await response.json();
  } catch (error) {
    console.error('Error searching playlists:', error);
    throw error;
  }
};

/**
 * Rate a video based on multiple criteria with detailed scoring
 * 
 * Video Quality Thresholds:
 * - Exceptional: ≥4.8 points (normalized to ≥8.0/10)
 * - Good: ≥4.0 points (normalized to ≥6.7/10)  
 * - Average: ≥3.0 points (normalized to ≥5.0/10)
 * - Rejected: <3.0 points (normalized to <5.0/10)
 * - Automatic Rejection: Duration <40 minutes
 * 
 * @param {Object} video - The video object to rate
 * @returns {number} - Rating from 0 to 6.0
 */
const rateVideo = async (video) => {
  if (!video) return 0;
  
  console.log(`\n📊 VIDEO SCORING: "${video.title?.substring(0, 50)}..."`);
  let score = 0;
  const currentYear = new Date().getFullYear();
  
  // Extract numbers from formatted strings if needed
  const getNumberFromFormatted = (formatted) => {
    if (typeof formatted === 'number') return formatted;
    if (!formatted) return 0;
    
    // Handle formats like "1.2M", "500K", etc.
    const multipliers = { K: 1000, M: 1000000, B: 1000000000 };
    
    // If it's already a string with a number
    if (typeof formatted === 'string') {
      if (/^\d+$/.test(formatted)) {
        return parseInt(formatted);
      }
      
      for (const [suffix, multiplier] of Object.entries(multipliers)) {
        if (formatted.includes(suffix)) {
          const numberPart = parseFloat(formatted.replace(suffix, ''));
          return numberPart * multiplier;
        }
      }
    }
    
    return 0;
  };
  
  // Get views and likes as numbers
  const views = getNumberFromFormatted(video.views || video.views_formatted);
  const likes = getNumberFromFormatted(video.likes || video.likes_formatted);
  
  console.log(`Views: ${views.toLocaleString()} | Likes: ${likes.toLocaleString()}`);
  
  // Duration in minutes (if available)
  let durationMinutes = 0;
  
  try {
    if (video.duration_seconds) {
      // Direct value in seconds
      durationMinutes = Math.floor(video.duration_seconds / 60);
      console.log(`Duration from seconds: ${durationMinutes} mins (${video.duration_seconds} seconds)`);
    } else if (video.duration) {
      // Parse from duration string
      const durationStr = String(video.duration);
      
      // Try different formats
      if (durationStr.includes(':')) {
        // Format like "15:30" or "1:15:30"
        const durationParts = durationStr.split(':').map(part => parseInt(part) || 0);
        
        if (durationParts.length === 3) {
          // hours:minutes:seconds
          durationMinutes = (durationParts[0] * 60) + durationParts[1];
        } else if (durationParts.length === 2) {
          // minutes:seconds
          durationMinutes = durationParts[0];
        }
        console.log(`Duration from time format: ${durationMinutes} mins (${durationStr})`);
      } else if (!isNaN(durationStr)) {
        // Direct value in minutes
        durationMinutes = parseInt(durationStr);
        console.log(`Duration from numeric string: ${durationMinutes} mins`);
      }
    }
    
    // If we still have zero duration, try to estimate from title
    if (durationMinutes === 0) {
      // Look for duration patterns in the title
      const hourPattern = /(\d+)\s*(?:hours|hour|hr|hrs)/i;
      const minutePattern = /(\d+)\s*(?:minutes|minute|min|mins)/i;
      
      const hourMatch = video.title?.match(hourPattern);
      const minuteMatch = video.title?.match(minutePattern);
      
      if (hourMatch) {
        durationMinutes += parseInt(hourMatch[1]) * 60;
      }
      
      if (minuteMatch) {
        durationMinutes += parseInt(minuteMatch[1]);
      }
      
      if (hourMatch || minuteMatch) {
        console.log(`Estimated duration from title: ${durationMinutes} mins`);
      }
    }
    
    // Special case: handle full courses and oneshots without duration data
    // Many videos don't have duration info in the search results
    if (durationMinutes === 0) {
      const title = video.title?.toLowerCase() || '';
      const isLikelyCourse = (
        title.includes('complete course') || 
        title.includes('full course') || 
        title.includes('oneshot') || 
        title.includes('one shot') ||
        (title.includes('complete') && title.includes('tutorial'))
      );
      
      // For likely full courses, assign a reasonable default duration
      if (isLikelyCourse) {
        durationMinutes = 90; // Assume 1.5 hours for full courses
        console.log(`Assigning default duration for course: ${durationMinutes} mins`);
      } else {
        // For regular tutorials, assign a reasonable default duration
        durationMinutes = 25; // Assume 25 minutes for regular tutorials
        console.log(`Assigning default duration for tutorial: ${durationMinutes} mins`);
      }
    }
  } catch (e) {
    console.log('Error parsing duration:', e);
    // Default fallback duration (don't reject videos due to parsing errors)
    durationMinutes = 30;
  }
  
  // Publish year (if available)
  let publishYear = 0;
  if (video.publish_date) {
    try {
      // Try different formats
      if (typeof video.publish_date === 'string') {
        if (video.publish_date.length === 8) {
          // Format: YYYYMMDD
          publishYear = parseInt(video.publish_date.substring(0, 4));
        } else {
          // Try to parse as date
          publishYear = new Date(video.publish_date).getFullYear();
        }
      }
      console.log(`Published year: ${publishYear}`);
    } catch (e) {
      console.log('Could not parse publish date:', video.publish_date);
    }
  }
  
  // Step 1: Duration Check (Critical filter)
  const isLikelyOneshot = video.title?.toLowerCase().includes('oneshot') || 
                        video.title?.toLowerCase().includes('one shot') ||
                        video.title?.toLowerCase().includes('complete course') ||
                        video.title?.toLowerCase().includes('full course');
                     
  console.log(`Video duration: ${durationMinutes} mins, Oneshot: ${isLikelyOneshot}`);
  
  // Make duration filtering consistent for all videos
  // Apply the same minimum duration requirement for all videos
  if (durationMinutes < 40) {
    // All videos should be at least 40 minutes
    console.log(`❌ REJECTED: Video duration too short (${durationMinutes} mins) - minimum 40 minutes required`);
    return 0;
  }
  
  // Additional points for longer videos - using the same scale for all videos
  let durationBonus = 0;
  if (durationMinutes >= 180) durationBonus = 0.5; // 3+ hours
  else if (durationMinutes >= 90) durationBonus = 0.3; // 1.5+ hours
  
  if (durationBonus > 0) {
    console.log(`✓ Duration bonus: +${durationBonus} points (${durationMinutes} mins)`);
    score += durationBonus;
  }
  
  // Give priority to one-shot/complete course videos
  if (isLikelyOneshot) {
    const oneshotBonus = 0.7;
    console.log(`✓ Oneshot/complete course bonus: +${oneshotBonus} points`);
    score += oneshotBonus;
  }
  
  // Step 2: Engagement & Popularity Score (Out of 6 points total)
  console.log(`\nEngagement & Popularity Scoring:`);
  
  // A. Views (Max 3 Points)
  let viewsScore = 0;
  if (views >= 500000) {
    viewsScore = 3;
  } else if (views >= 250000) {
    viewsScore = 2;
  } else if (views >= 100000) {
    viewsScore = 1;
  }
  
  if (viewsScore > 0) {
    console.log(`✓ Views: +${viewsScore} points (${views.toLocaleString()})`);
    score += viewsScore;
  } else {
    console.log(`✗ Views: +0 points (${views.toLocaleString()} - below 100k threshold)`);
  }
  
  // B. Likes (Max 1.5 Points)
  let likesScore = 0;
  if (likes >= 5000) {
    likesScore = 1.5;
  } else if (likes >= 2000) {
    likesScore = 1;
  } else if (likes >= 1000) {
    likesScore = 0.5;
  }
  
  if (likesScore > 0) {
    console.log(`✓ Likes: +${likesScore} points (${likes.toLocaleString()})`);
    score += likesScore;
  } else {
    console.log(`✗ Likes: +0 points (${likes.toLocaleString()} - below 1k threshold)`);
  }
  
  // C. Like-to-View Ratio (Max 0.5 Points)
  let ratioScore = 0;
  let ratio = 0;
  
  if (views > 0 && likes > 0) {
    ratio = likes / views;
    if (ratio >= 0.04) {
      ratioScore = 0.5;
    } else if (ratio >= 0.02) {
      ratioScore = 0.25;
    }
  }
  
  if (ratioScore > 0) {
    console.log(`✓ Like-to-view ratio: +${ratioScore} points (${(ratio * 100).toFixed(2)}%)`);
    score += ratioScore;
  } else if (views > 0 && likes > 0) {
    console.log(`✗ Like-to-view ratio: +0 points (${(ratio * 100).toFixed(2)}% - below 2% threshold)`);
  } else {
    console.log(`✗ Like-to-view ratio: +0 points (no data available)`);
  }
  
  // D. Recency (Max 1 Point)
  let recencyScore = 0;
  if (publishYear >= 2024) {
    recencyScore = 1;
  } else if (publishYear >= 2022) {
    recencyScore = 0.5;
  }
  
  if (recencyScore > 0) {
    console.log(`✓ Recency: +${recencyScore} points (${publishYear})`);
    score += recencyScore;
  } else if (publishYear > 0) {
    console.log(`✗ Recency: +0 points (${publishYear} - too old)`);
  } else {
    console.log(`✗ Recency: +0 points (publish year unknown)`);
  }
  
  // Cap at maximum score of 6
  const finalScore = Math.min(6, score);
  
  // Define quality categories
  let quality = 'Rejected';
  if (finalScore >= 4.8) {
    quality = 'Exceptional';
    console.log(`\n⭐ EXCEPTIONAL VIDEO: ${finalScore}/6.0 points`);
  } else if (finalScore >= 4.0) {
    quality = 'Good';
    console.log(`\n👍 GOOD VIDEO: ${finalScore}/6.0 points`);
  } else if (finalScore >= 3.0) {
    quality = 'Average';
    console.log(`\n⚠️ AVERAGE VIDEO: ${finalScore}/6.0 points`);
  } else {
    console.log(`\n❌ REJECTED VIDEO: ${finalScore}/6.0 points`);
  }
  
  // For comparison with playlists
  const normalizedScore = (finalScore / 6) * 10;
  console.log(`Normalized score (out of 10): ${normalizedScore.toFixed(1)}/10.0`);
  
  return finalScore;
};

/**
 * Helper function to normalize search terms by removing duplicated words
 * @param {string} searchTerm - The search term to normalize
 * @returns {string} - The normalized search term with duplicates removed
 */
const normalizeSearchTerm = (searchTerm) => {
  if (!searchTerm) return '';
  
  // Split by spaces and filter out duplicates while preserving order
  const words = searchTerm.split(' ');
  const uniqueWords = [];
  const seenWords = new Set();
  
  for (const word of words) {
    const normalizedWord = word.toLowerCase().trim();
    // Skip empty words
    if (!normalizedWord) continue;
    
    // Only add if we haven't seen this word before
    if (!seenWords.has(normalizedWord)) {
      uniqueWords.push(word); // Add the original casing
      seenWords.add(normalizedWord);
    }
  }
  
  return uniqueWords.join(' ');
};

/**
 * Rate a playlist based on optimized selection criteria
 * @param {Object} playlist - The playlist object to rate
 * @returns {Object} - Rating details including score and whether critical criteria passed
 */
const ratePlaylist = async (playlist) => {
  if (!playlist || !playlist.videos || playlist.videos.length === 0) {
    return { score: 0, passedCriticalCriteria: false, reason: 'No videos in playlist' };
  }
  
  let score = 0;
  const currentYear = new Date().getFullYear();
  
  // --- 1. Title Relevance (Critical - Must Pass) ---
  const playlistTitle = playlist.title?.toLowerCase() || '';
  const techName = playlist.topicRelevanceTerm?.toLowerCase() || '';
  
  // Basic relevance check - must contain the tech name
  const isRelevant = playlistTitle.includes(techName) || 
                     (techName === 'javascript' && playlistTitle.includes('js')) ||
                     (techName === 'python' && playlistTitle.includes('py')) ||
                     (techName === 'machine learning' && playlistTitle.includes('ml'));
  
  if (!isRelevant) {
    return { score: 0, passedCriticalCriteria: false, reason: 'Failed title relevance check' };
  }
  
  // --- 2. Video Count & Duration (Must Pass) ---
  // Use total video count from playlist metadata if available
  const totalVideosInPlaylist = playlist.video_count || playlist.videos.length;
  if (totalVideosInPlaylist < 5) {
    return { score: 0, passedCriticalCriteria: false, reason: 'Less than 5 videos' };
  }
  
  // Process available duration data
  let totalDuration = 0;
  let videosWithDuration = 0;
  
  // Process available duration data from sample videos
  for (const video of playlist.videos) {
    // Get duration in minutes
    let durationMinutes = 0;
    if (video.duration_seconds) {
      durationMinutes = Math.floor(video.duration_seconds / 60);
      videosWithDuration++;
    } else if (video.duration) {
      const durationStr = String(video.duration);
      if (durationStr.includes(':')) {
        const durationParts = durationStr.split(':').map(part => parseInt(part) || 0);
        if (durationParts.length === 3) {
          durationMinutes = (durationParts[0] * 60) + durationParts[1];
          videosWithDuration++;
        } else if (durationParts.length === 2) {
          durationMinutes = durationParts[0];
          videosWithDuration++;
        }
      } else if (!isNaN(durationStr)) {
        durationMinutes = parseInt(durationStr);
        videosWithDuration++;
      }
    }
    
    totalDuration += durationMinutes;
  }
  
  // If we have durations for some videos, estimate the total duration for the entire playlist
  let estimatedTotalDuration = totalDuration;
  if (videosWithDuration > 0) {
    const avgDuration = totalDuration / videosWithDuration;
    estimatedTotalDuration = avgDuration * totalVideosInPlaylist;
    console.log(`Estimated total duration: ${Math.round(estimatedTotalDuration)} minutes ` +
                `(avg ${Math.round(avgDuration)} min × ${totalVideosInPlaylist} videos)`);
  }
  
  if (estimatedTotalDuration < 90) {
    return { score: 0, passedCriticalCriteria: false, reason: 'Estimated total duration less than 90 minutes' };
  }
  
  console.log(`✅ Playlist passed critical criteria checks`);
  
  // --- 3. Recency (Max 1.5 Points) ---
  let recentPoints = 0;
  
  // Check if we have publish dates
  if (playlist.videos.some(v => v.publish_date)) {
    const years = playlist.videos
      .filter(v => v.publish_date)
      .map(v => {
        try {
          if (typeof v.publish_date === 'string') {
            // Format: YYYYMMDD
            if (v.publish_date.length === 8) {
              return parseInt(v.publish_date.substring(0, 4));
            } 
            // Format: ISO date or other date string
            else {
              return new Date(v.publish_date).getFullYear();
            }
          }
          return 0;
        } catch (e) {
          return 0;
        }
      })
      .filter(year => year > 0);
    
    if (years.length > 0) {
      // Calculate the "majority" year (most common)
      const yearCounts = {};
      years.forEach(year => {
        yearCounts[year] = (yearCounts[year] || 0) + 1;
      });
      
      let majorityYear = 0;
      let maxCount = 0;
      
      Object.entries(yearCounts).forEach(([year, count]) => {
        if (count > maxCount) {
          maxCount = count;
          majorityYear = parseInt(year);
        }
      });
      
      console.log(`Majority year for videos in playlist: ${majorityYear}`);
      
      // Updated recency scoring (max 1.5 vs old 1.0)
      if (majorityYear >= 2024) {
        recentPoints = 1.5;
      } else if (majorityYear >= 2022) {
        recentPoints = 1.0;
      } else {
        recentPoints = 0.5;
      }
    }
  }
  
  score += recentPoints;
  
  // --- 4. Engagement Estimate (Max 2.5 Points) ---
  // Only look at the first few videos for engagement estimation (5-8 videos)
  const maxSampleSize = Math.min(8, playlist.videos.length);
  console.log(`Estimating engagement from first ${maxSampleSize} videos`);
  
  const sampleVideos = playlist.videos.slice(0, maxSampleSize);
  
  let totalViews = 0;
  let totalLikes = 0;
  
  // Helper function to extract number from formatted string
  const getNumberFromFormatted = (formatted) => {
    if (typeof formatted === 'number') return formatted;
    if (!formatted) return 0;
    
    const multipliers = { K: 1000, M: 1000000, B: 1000000000 };
    
    if (typeof formatted === 'string') {
      if (/^\d+$/.test(formatted)) {
        return parseInt(formatted);
      }
      
      for (const [suffix, multiplier] of Object.entries(multipliers)) {
        if (formatted.includes(suffix)) {
          const numberPart = parseFloat(formatted.replace(suffix, ''));
          return numberPart * multiplier;
        }
      }
    }
    
    return 0;
  };
  
  sampleVideos.forEach(video => {
    // Extract views and likes
    const views = getNumberFromFormatted(video.views || video.views_formatted);
    const likes = getNumberFromFormatted(video.likes || video.likes_formatted);
    
    totalViews += views || 0;
    totalLikes += likes || 0;
    
    console.log(`Video metrics - Title: "${video.title?.substring(0, 30)}...", Views: ${views}, Likes: ${likes}`);
  });
  
  const avgViews = totalViews / sampleVideos.length;
  const avgLikes = totalLikes / sampleVideos.length;
  
  console.log(`Average metrics - Views: ${Math.round(avgViews)}, Likes: ${Math.round(avgLikes)}`);
  
  // Views points (max 2.0 pts) - Updated to match specified criteria
  let viewsPoints = 0;
  if (avgViews >= 100000) {
    viewsPoints = 2.0;
  } else if (avgViews >= 50000) {
    viewsPoints = 1.5;
  } else if (avgViews >= 20000) {
    viewsPoints = 1.0;
  }
  
  score += viewsPoints;
  console.log(`Views points: ${viewsPoints} (${Math.round(avgViews)} avg views)`);
  
  // Like-to-View ratio points (max 0.5 pt) - Updated to match specified criteria
  let ratioPoints = 0;
  if (avgViews > 0) {
    const avgRatio = avgLikes / avgViews;
    if (avgRatio >= 0.04) {  // 4%
      ratioPoints = 0.5;
    } else if (avgRatio >= 0.02) {  // 2%
      ratioPoints = 0.25;
    }
    
    console.log(`Like-to-view ratio: ${(avgRatio * 100).toFixed(2)}%, points: ${ratioPoints}`);
  }
  
  score += ratioPoints;
  
  // --- 5. Structure Clarity (Max 1.0 Point) ---
  let structurePoints = 0;
  
  // Check for structured flow in title
  const structuredFlowTerms = [
    'full series', 'beginner to advanced', 'complete', 'step by step', 
    'from scratch', 'tutorial series', 'crash course', 'bootcamp'
  ];
  
  if (structuredFlowTerms.some(term => playlistTitle.includes(term))) {
    structurePoints += 0.5;
  }
  
  // Check for module/part patterns in title
  const modulePatterns = [
    'module', 'part', 'day', 'session', 'lesson', 'chapter'
  ];
  
  if (modulePatterns.some(pattern => playlistTitle.includes(pattern))) {
    structurePoints += 0.5;
  }
  
  score += structurePoints;
  
  // --- 6. Bonus Label (Max 0.3 Point) ---
  const bonusLabels = [
    'complete course', 'one shot', 'step-by-step', 'from scratch'
  ];
  
  if (bonusLabels.some(label => playlistTitle.includes(label))) {
    score += 0.3;
  }
  
  // Cap score at 6.8 (new max)
  score = Math.min(6.8, score);
  
  // Return final rating with detailed metrics
  return {
    score,
    passedCriticalCriteria: true,
    totalVideos: totalVideosInPlaylist,
    estimatedTotalDuration,
    avgViews,
    avgLikes,
    likeToViewRatio: avgViews > 0 ? (avgLikes / avgViews) : 0,
    recentPoints,
    viewsPoints,
    ratioPoints,
    structurePoints,
    thresholds: {
      exceptional: score >= 8.0,
      good: score >= 7.0,
      average: score >= 5.0
    }
  };
};

/**
 * Quick check if a playlist title is relevant to a topic
 * @param {string} playlistTitle - The playlist title to check
 * @param {string} techName - The technology name to check against
 * @returns {boolean|Promise<boolean>} - Whether the playlist title is relevant
 */

/**
 * Find the best educational playlist for a specific topic using the API endpoint
 * @param {string} topic - The topic to find a playlist for
 * @param {boolean} debug - Whether to enable detailed scoring debug output
 * @returns {Promise<Object>} - The best playlist with scoring details
 */
export const findBestPlaylist = async (topic, debug = false) => {
  try {
    // Format the search query as "complete {topic} course"
    // Check if topic already includes "complete" to avoid duplication
    const hasComplete = topic.toLowerCase().includes('complete');
    const searchQuery = hasComplete ? `${topic} course` : `complete ${topic} course`;
    console.log(`Formatted playlist search query: "${searchQuery}"`);
    
    // Encode the query and prepare params
    const params = new URLSearchParams({
      query: searchQuery,
      debug: debug
    });

    const response = await fetch(`${API_URL}/find/best-playlist?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error finding best playlist');
    }

    const result = await response.json();
    
    // Check if no suitable playlist was found
    if (!result || result.status === "no_suitable_playlist" || !result.playlist) {
      console.log("No suitable playlist found for:", searchQuery);
      return null;
    }
    
    console.log(`Found best playlist for ${searchQuery}: ${result.playlist.title} (Score: ${result.score})`);
    return result;
  } catch (error) {
    console.error('Error finding best playlist:', error);
    return null;
  }
};

/**
 * Find the best video for a given topic
 * @param {string} topic - The topic to find a video for
 * @param {boolean} isAdvancedTopic - Whether this is an advanced topic
 * @param {Array<string>} roadmapTopics - List of all topics from the roadmap
 * @returns {Promise<Object|null>} - Best matching video or null if none found
 */
export const findBestVideoForTopic = async (topic, isAdvancedTopic = false, roadmapTopics = []) => {
  try {
    console.log(`Finding best video for topic: "${topic}"`);
    
    // First check if this topic is already covered by a shared resource
    try {
      const existingSharedResource = await getSharedResourceForTopic(topic, roadmapTopics);
      if (existingSharedResource) {
        console.log(`Topic "${topic}" is already covered by shared resource: ${existingSharedResource.title}`);
        return existingSharedResource;
      }
    } catch (sharedError) {
      console.error('Error checking shared resources:', sharedError);
      // Continue with cache check if shared resource check fails
    }
    
    // Then check if we have cached resources
    try {
      const cachedResult = await findResourcesForTechnology(topic, 1, false, roadmapTopics);
      if (cachedResult.success && cachedResult.data.length > 0) {
        console.log(`Found cached resource for "${topic}"`);
        
        // Format the cached resource to match the expected format
        const resource = cachedResult.data[0];
        
        // Double-check shared resources to ensure compatibility with roadmap topics
        if (resource.isShared && resource.technologies && resource.technologies.length > 0 && 
            roadmapTopics && roadmapTopics.length > 0) {
          
          // Check if all technologies in the shared resource are in the roadmap
          const allTechnologiesInRoadmap = await checkAllResourceTechnologiesInRoadmap(
            resource.technologies, 
            roadmapTopics
          );
          
          if (!allTechnologiesInRoadmap) {
            console.warn(`Rejecting shared cached resource "${resource.title}" because not all its technologies are in the roadmap`);
            
            // If rejected, continue with normal search
            // This effectively skips the cached resource and continues to search YouTube
            return null;
          } else {
            console.log(`Verified shared resource "${resource.title}" has all technologies in roadmap`);
          }
        }
        
        // Process videos to ensure they have proper thumbnails and other required fields
        const processedVideos = resource.videos?.map(video => {
          // Ensure video has a thumbnail
          let thumbnail = '';
          if (video.thumbnail) {
            thumbnail = video.thumbnail;
          } else if (video.id && /^[a-zA-Z0-9_-]{11}$/.test(video.id)) {
            thumbnail = `https://img.youtube.com/vi/${video.id}/mqdefault.jpg`;
          } else {
            thumbnail = 'https://via.placeholder.com/320x180?text=No+Thumbnail';
          }
          
          // Process channel information
          let channelName = "Unknown";
          if (typeof video.channel === 'string') {
            channelName = video.channel;
          } else if (video.channel?.name) {
            channelName = video.channel.name;
          }
          
          return {
            ...video,
            thumbnail,
            channel: channelName,
            duration_string: video.duration_string || video.duration || "Unknown"
          };
        }) || [];
        
        // Extract channel name from metadata or first video
        let channelName = "Unknown";
        if (typeof resource.metadata.channelName === 'string') {
          channelName = resource.metadata.channelName;
        } else if (resource.metadata.channelName?.name) {
          channelName = resource.metadata.channelName.name;
        } else if (processedVideos.length > 0) {
          channelName = processedVideos[0].channel;
        }
        
        const formattedResource = {
          id: resource._id,
          title: resource.title,
          url: resource.url,
          description: resource.description || "",
          type: resource.type,
          isPlaylist: resource.type === 'playlist',
          channel: channelName,
          videoCount: resource.metadata.videoCount || processedVideos.length,
          rating: resource.metadata.rating || "N/A",
          quality: resource.metadata.quality || "Average",
          videos: processedVideos,
          fromCache: true,
          cachedAt: resource.createdAt,
          expiresAt: resource.expiresAt,
          technologies: resource.metadata.technologies || [],
          // Add thumbnail if it's a single video
          ...(resource.type === 'video' && processedVideos.length > 0 ? {
            thumbnail: processedVideos[0].thumbnail,
            duration: parseInt(processedVideos[0].duration) || 0, // Ensure duration is a number
            duration_string: processedVideos[0].duration_string,
            views_formatted: processedVideos[0].views_formatted || "N/A",
            likes_formatted: processedVideos[0].likes_formatted || "N/A"
          } : {})
        };
        
        return formattedResource;
      }
    } catch (cacheError) {
      console.error('Error checking resource cache:', cacheError);
      // Continue with normal search if cache check fails
    }

    // Variables to track the best video
    let highestRatedVideo = null;
    let highestRating = 0;
    let highestDuration = 0;
    
    // Normalize the topic to remove duplicated words
    const normalizedTopic = normalizeSearchTerm(topic);
    console.log(`Original topic: "${topic}" → Normalized: "${normalizedTopic}"`);
    
    // First try to find a suitable playlist using the new API endpoint
    console.log(`Searching for best ${normalizedTopic} playlist using API...`);
    const bestPlaylistResult = await findBestPlaylist(normalizedTopic, false);
    
    // Store playlist info if found
    let playlistScore = 0;
    let bestPlaylist = null;
    
    // Check if we found a playlist and if it meets minimum quality threshold (score ≥ 5.0)
    if (bestPlaylistResult && bestPlaylistResult.playlist && bestPlaylistResult.score >= 5.0) {
      playlistScore = bestPlaylistResult.score;
      console.log(`Found playlist: ${bestPlaylistResult.playlist.title} (Score: ${playlistScore}/10)`);
      
      // Get channel name from the first video if playlist channel is null
      const firstVideo = bestPlaylistResult.playlist.videos?.[0];
      let channelName = "Unknown";
      
      // Try all possible locations for channel name
      if (bestPlaylistResult.playlist.channel) {
        channelName = bestPlaylistResult.playlist.channel;
      } else if (firstVideo) {
        if (typeof firstVideo.channel === 'string') {
          channelName = firstVideo.channel;
        } else if (firstVideo.channel?.name) {
          channelName = firstVideo.channel.name;
        }
      }
      
      console.log("Channel name extraction:", {
        playlistChannel: bestPlaylistResult.playlist.channel,
        firstVideoChannel: firstVideo?.channel,
        extractedChannelName: channelName
      });
      
      // Format the playlist data to match the format expected by the UI
      bestPlaylist = {
        ...bestPlaylistResult.playlist,
        videoCount: bestPlaylistResult.playlist.video_count,
        totalVideoCount: bestPlaylistResult.playlist.video_count,
        channel: channelName, // Use the extracted channel name
        rating: bestPlaylistResult.score?.toFixed(1) || "N/A",
        isPlaylist: true,
        quality: bestPlaylistResult.score >= 8.0 ? 'Exceptional' : 
                bestPlaylistResult.score >= 7.0 ? 'Good' : 'Average',
        videos: bestPlaylistResult.playlist.videos || [],
        technologies: bestPlaylistResult.technologies || []
      };

      // If the playlist is exceptional (≥8.0), return it immediately
      if (playlistScore >= 8.0) {
        console.log(`Found EXCEPTIONAL playlist (${playlistScore}/10), using technologies from relevance check`);
        
        // If this playlist covers multiple topics, add it to shared resources
        if (bestPlaylist.technologies && bestPlaylist.technologies.length > 1) {
          await addSharedResource(bestPlaylist, bestPlaylist.technologies);
        }
        
        // Cache the resource
        try {
          await cacheResource(bestPlaylist, topic);
          console.log(`Cached exceptional playlist for "${topic}"`);
        } catch (cacheError) {
          console.error('Error caching playlist:', cacheError);
        }
        
        return bestPlaylist;
      }
    } else {
      console.log(`No suitable playlist found or score below threshold for "${normalizedTopic}"`);
    }
    
    // Only search for videos if we don't have an exceptional playlist
    if (!bestPlaylist || bestPlaylist.quality !== 'Exceptional') {
      try {
        // Search for single videos as well
        console.log(`Searching for individual videos on: ${normalizedTopic}`);
        
        // Extract just the technology name for search query and relevance checking
        const techName = normalizedTopic
          .replace(/complete\s+/gi, '')
          .replace(/full\s+/gi, '')
          .replace(/tutorial\s*/gi, '')
          .replace(/course\s*/gi, '')
          .replace(/for beginners\s*/gi, '')
          .replace(/oneshot\s*/gi, '')
          .replace(/one shot\s*/gi, '')
          .replace(/masterclass\s*/gi, '')
          .replace(/crash course\s*/gi, '')
          .trim();
        
        console.log(`Technology name for search and relevance checking: "${techName}"`);
        
        // Format the search query with the requested pattern
        const hasCompleteKeyword = normalizedTopic.toLowerCase().includes('complete');
        const minDuration = 40;
        
        // Create multiple search patterns with different queries
        const searchPatterns = [
          // First try the original pattern
          hasCompleteKeyword ? 
            `${normalizedTopic} course full oneshot` : 
            `Complete ${techName} course full oneshot`,
          // Don't try additional patterns (commented out)
          /*
          `${techName} tutorial for beginners`,
          `${techName} crash course`,
          `learn ${techName}`,
          `${techName} full tutorial`,
          // Finally try generic search with just the tech name
          techName
          */
        ];
        
        // Try each search pattern until we find videos
        let searchResult = null;
        for (const pattern of searchPatterns) {
          console.log(`Trying search: "${pattern}"`);
          
          const result = await searchYouTube(
            pattern, 
            8, // Reduced from 10 to 8
            { minDuration: minDuration }
          );
          
          // Handle both direct array returns and nested result objects
          const videos = Array.isArray(result) ? result : (result?.results || result?.items || []);
          
          if (videos.length > 0) {
            console.log(`Found ${videos.length} videos with pattern "${pattern}"`);
            searchResult = { results: videos };
            break;
          } else {
            console.log(`No results found for pattern "${pattern}", trying next...`);
            // Early termination - don't try additional patterns
            console.log(`No videos found for ${normalizedTopic} - early termination without further API calls`);
            break;
          }
        }
        
        // Process videos and run batch relevance check
        if (searchResult?.results?.length > 0) {
          try {
            console.log(`Found ${searchResult.results.length} videos, running batch relevance check...`);
            
            // Extract titles for batch relevance check
            const videoTitles = searchResult.results.map(video => video.title);
            
            // Run batch relevance check using the same technology name as search
            const batchResults = await checkBatchRelevanceWithEmbeddings(videoTitles, techName);
            
            // Create a map of titles to relevance results
            const titleToRelevanceMap = {};
            batchResults.forEach(result => {
              titleToRelevanceMap[result.title] = result;
            });
            
            // Filter videos based on relevance results
            const relevantVideos = searchResult.results.filter(video => {
              const relevanceResult = titleToRelevanceMap[video.title];
              if (!relevanceResult) return false;
              
              // Add relevance data and technologies to video
              video.isRelevant = relevanceResult.isRelevant;
              video.relevanceSimilarity = relevanceResult.similarity;
              video.relevanceExplanation = relevanceResult.explanation;
              video.technologies = relevanceResult.technologies || [];
              
              return relevanceResult.isRelevant;
            });
            
            console.log(`After relevance filtering: ${relevantVideos.length} relevant videos out of ${searchResult.results.length}`);
            
            // If we have relevant videos, fetch details for them
            if (relevantVideos.length > 0) {
            // Maximum number of concurrent requests to avoid overwhelming the API
            const MAX_CONCURRENT_REQUESTS = 5;
              const videosToProcess = [...relevantVideos];
            const processedVideos = [];
            
            // Process videos in batches for parallel fetching
            while (videosToProcess.length > 0) {
              const currentBatch = videosToProcess.splice(0, MAX_CONCURRENT_REQUESTS);
              console.log(`Processing batch of ${currentBatch.length} videos in parallel`);
              
              // Create promises for each video in the current batch
              const batchPromises = currentBatch.map(async (video) => {
              try {
                // Fetch video details including duration
                  console.log(`Fetching details for: ${video.title}`);
                const details = await getVideoDetails(video.url);
                  
                if (details) {
                  // Merge the details with the video object
                  return {
                    ...video,
                    duration: details.duration,
                    duration_seconds: details.duration_seconds,
                    views: details.views,
                    likes: details.likes,
                    channel: details.channel,
                    publish_date: details.publish_date
                  };
                }
                return video;
              } catch (error) {
                console.error(`Error fetching details for video ${video.url}:`, error);
                return video;
              }
            });

              // Wait for all videos in this batch to complete
              const batchResults = await Promise.all(batchPromises);
              processedVideos.push(...batchResults);
              
              // Small delay between batches to avoid overwhelming the API
              if (videosToProcess.length > 0) {
                await new Promise(resolve => setTimeout(resolve, 500));
              }
            }
            
            console.log(`Finished fetching details for ${processedVideos.length} videos`);

            // Rate the videos with complete information
            const ratingPromises = processedVideos.map(async (video) => {
              // Rate the video (using the existing rateVideo function)
                const rating = await rateVideo(video);
              video.rating = rating;
              
              // Get duration in minutes from the fetched details
              let durationMinutes = 0;
              if (video.duration_seconds) {
                durationMinutes = Math.floor(video.duration_seconds / 60);
              } else if (video.duration) {
                const durationStr = String(video.duration);
                if (durationStr.includes(':')) {
                  const durationParts = durationStr.split(':').map(part => parseInt(part) || 0);
                  if (durationParts.length === 3) {
                    durationMinutes = (durationParts[0] * 60) + durationParts[1];
                  } else if (durationParts.length === 2) {
                    durationMinutes = durationParts[0];
                  }
                } else if (!isNaN(durationStr)) {
                  durationMinutes = parseInt(durationStr);
                }
              }
              video.durationMinutes = durationMinutes;
              
              return { video, rating, durationMinutes };
            });
            
            // Wait for all ratings to complete
            const ratingResults = await Promise.all(ratingPromises);
            
            // Find the highest rated video
            for (const { video, rating, durationMinutes } of ratingResults) {
              if (rating > 0) { // Only consider videos that passed the filters
                  console.log(`${video.title} - Rating: ${rating.toFixed(1)}/6 - Duration: ${durationMinutes} minutes - Technologies: ${video.technologies.join(', ')}`);
              
                // Select the video with the highest rating
                if (rating > highestRating || (rating === highestRating && durationMinutes > highestDuration)) {
                  highestRating = rating;
                  highestDuration = durationMinutes;
                  highestRatedVideo = video;
                  }
                }
              }
            }
          } catch (error) {
            console.error('Error processing video details:', error);
          }
        }
      } catch (error) {
        console.error('Error searching for individual videos:', error);
      }
    }
    
    // Continue with final processing
    
    // Only consider videos that meet minimum quality threshold (rating ≥ 3.0, otherwise rejected)
    if (highestRatedVideo && highestRating >= 3.0) {
      console.log(`Best video found: ${highestRatedVideo.title} (Score: ${highestRating}/6)`);
      
      // Add rating and duration to the video object
      highestRatedVideo.videoRating = highestRating.toFixed(1);
      highestRatedVideo.durationMinutes = highestDuration;
      
      // Define video quality based on rating
      let videoQuality = "Rejected";
      if (highestRating >= 4.8) {
        videoQuality = "Exceptional";
        console.log(`📊 VIDEO QUALITY: ⭐ EXCEPTIONAL (${highestRating}/6.0)`);
      } else if (highestRating >= 4.0) {
        videoQuality = "Good";
        console.log(`📊 VIDEO QUALITY: 👍 GOOD (${highestRating}/6.0)`);
      } else if (highestRating >= 3.0) {
        videoQuality = "Average";
        console.log(`📊 VIDEO QUALITY: ⚠️ AVERAGE (${highestRating}/6.0)`);
      }
      
      highestRatedVideo.quality = videoQuality;
      
      // If the video is excellent (≥4.8), return it immediately with its technologies
      if (highestRating >= 4.8) {
        console.log(`Found excellent video (${highestRating}/6), with technologies from relevance check: ${highestRatedVideo.technologies?.join(', ') || 'none'}`);
        
        // If this video covers multiple topics, add it to shared resources
        if (highestRatedVideo.technologies && highestRatedVideo.technologies.length > 1) {
          await addSharedResource(highestRatedVideo, highestRatedVideo.technologies);
        }
        
        // Cache the resource
        try {
          // Use the first extracted technology if available, otherwise fall back to the original topic
          const primaryTechnology = (highestRatedVideo.technologies && highestRatedVideo.technologies.length > 0) 
            ? highestRatedVideo.technologies[0] 
            : topic;
          
          await cacheResource(highestRatedVideo, primaryTechnology);
          console.log(`Cached excellent video for "${primaryTechnology}" (original search: "${topic}")`);
        } catch (cacheError) {
          console.error('Error caching video:', cacheError);
        }
        
        return highestRatedVideo;
      }
      
      // If both playlist and video are found but neither is "excellent",
      // compare them by normalizing the video score to a 10-point scale
      if (bestPlaylist) {
        // Normalize video rating to 10-point scale for fair comparison
        const normalizedVideoScore = (highestRating / 6) * 10;
        console.log(`Comparing: Video (normalized ${normalizedVideoScore.toFixed(1)}/10) vs Playlist (${playlistScore}/10)`);
        
        if (normalizedVideoScore > playlistScore) {
          console.log(`Video is better (${normalizedVideoScore.toFixed(1)} > ${playlistScore})`);
          
          // If this video covers multiple topics, add it to shared resources
          if (highestRatedVideo.technologies && highestRatedVideo.technologies.length > 1) {
            await addSharedResource(highestRatedVideo, highestRatedVideo.technologies);
          }
          
          // Cache the resource
          try {
            // Use the first extracted technology if available, otherwise fall back to the original topic
            const primaryTechnology = (highestRatedVideo.technologies && highestRatedVideo.technologies.length > 0) 
              ? highestRatedVideo.technologies[0] 
              : topic;
            
            await cacheResource(highestRatedVideo, primaryTechnology);
            console.log(`Cached preferred video for "${primaryTechnology}" (original search: "${topic}")`);
          } catch (cacheError) {
            console.error('Error caching video:', cacheError);
          }
          
          return highestRatedVideo;
        } else {
          console.log(`Playlist is better (${playlistScore} > ${normalizedVideoScore.toFixed(1)})`);
          
          // If this playlist covers multiple topics, add it to shared resources
          if (bestPlaylist.technologies && bestPlaylist.technologies.length > 1) {
            await addSharedResource(bestPlaylist, bestPlaylist.technologies);
          }
          
          // Cache the resource
          try {
            // Use the first extracted technology if available, otherwise fall back to the original topic
            const primaryTechnology = (bestPlaylist.technologies && bestPlaylist.technologies.length > 0) 
              ? bestPlaylist.technologies[0] 
              : topic;
            
            await cacheResource(bestPlaylist, primaryTechnology);
            console.log(`Cached preferred playlist for "${primaryTechnology}" (original search: "${topic}")`);
          } catch (cacheError) {
            console.error('Error caching playlist:', cacheError);
          }
          
          return bestPlaylist;
        }
      } else {
        // Only the video was found
        console.log(`Using video (no playlist available)`);
      
      // Cache the resource
      try {
        // Use the first extracted technology if available, otherwise fall back to the original topic
        const primaryTechnology = (highestRatedVideo.technologies && highestRatedVideo.technologies.length > 0) 
          ? highestRatedVideo.technologies[0] 
          : topic;
        
        await cacheResource(highestRatedVideo, primaryTechnology);
        console.log(`Cached video for "${primaryTechnology}" (original search: "${topic}")`);
      } catch (cacheError) {
        console.error('Error caching video:', cacheError);
      }
      
      return highestRatedVideo;
      }
    }
    
    // If a playlist was found but no good video, use the playlist
    if (bestPlaylist) {
      console.log(`Using playlist (no suitable video found)`);
      
      // Cache the resource
      try {
        // Use the first extracted technology if available, otherwise fall back to the original topic
        const primaryTechnology = (bestPlaylist.technologies && bestPlaylist.technologies.length > 0) 
          ? bestPlaylist.technologies[0] 
          : topic;
        
        await cacheResource(bestPlaylist, primaryTechnology);
        console.log(`Cached playlist for "${primaryTechnology}" (original search: "${topic}")`);
      } catch (cacheError) {
        console.error('Error caching playlist:', cacheError);
      }
      
      return bestPlaylist;
    }
    
    // No suitable resources found
    console.log(`No suitable resource found for "${topic}"`);
    return null;
  } catch (error) {
    console.error('Error in findBestVideoForTopic:', error);
    return null;
  }
}

/**
 * Use OpenRouter LLM to check if a video title is relevant to a technology topic
 * @param {string} videoTitle - The title of the video to check
 * @param {string} techName - The technology name to match against
 * @returns {Promise<boolean>} - Whether the video is relevant to the technology
 */
const checkRelevanceWithGroq = async (videoTitle, techName) => {
  let retryCount = 0;
  let currentKey = OPENROUTER_API_KEYS[openRouterKeyIndex];
  let backoffDelay = API_RATE_LIMIT_DELAY;
  
  while (retryCount < API_MAX_RETRIES) {
    try {
      console.log(`Checking relevance: "${videoTitle}" for "${techName}" (Attempt ${retryCount + 1}/${API_MAX_RETRIES})`);
    
      // Check if we're rate limited
      if (isRateLimited('openrouter')) {
        console.log(`Rate limit reached for OpenRouter API. Waiting ${backoffDelay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
        currentKey = getNextOpenRouterApiKey();
        backoffDelay *= 2; // Exponential backoff
        continue;
      }
      
      // Record this API call
      recordApiCall('openrouter');
    
      const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'CodeLyft Learning Platform'
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-3.3-70b-instruct',
          messages: [
            {
              role: 'system',
              content: `You are a technology content relevance checker. Your task is to determine if a YouTube video title is relevant to a specific technology topic.

              Rules:
              1. Focus ONLY on the technology name, not words like "tutorial", "course", "complete", etc.
              2. For programming languages or frameworks (React, JavaScript, etc.), the video must specifically mention the technology
              3. Consider common abbreviations (JS for JavaScript, k8s for Kubernetes) as relevant
              4. Ignore irrelevant modifiers (best, top, crash course, etc.)
              5. Be strict - the video title must clearly be about the technology topic
              
              Respond with a JSON object containing:
              {
                "isRelevant": boolean,
                "explanation": "brief explanation of your decision",
                "confidence": number (0-1)
              }`
            },
            {
              role: 'user',
              content: `Video Title: "${videoTitle}"
              Technology Topic: "${techName}"`
            }
          ],
          temperature: 0.1,
          max_tokens: 150
        })
      });

      if (!response.ok) {
        const status = response.status;
        const errorData = await response.json().catch(() => ({}));
        
        if (status === 429) { // Rate limit
        retryCount++;
          if (retryCount < API_MAX_RETRIES) {
            console.log(`API rate limit reached. Rotating API key and retrying with backoff (${backoffDelay}ms)...`);
            currentKey = getNextOpenRouterApiKey();
            await new Promise(resolve => setTimeout(resolve, backoffDelay));
            backoffDelay *= 2; // Exponential backoff
          continue;
        } else {
            console.log('Max retries reached for API. Using fallback evaluation.');
          return defaultRelevanceCheck(videoTitle, techName);
        }
      }

        console.error(`API error (${status}):`, errorData);
        throw new Error(`Failed to check relevance: ${status} ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      // Clean the response content
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
      
      try {
        const result = JSON.parse(cleanContent);
        console.log(`Relevance result: ${result.isRelevant ? 'RELEVANT' : 'NOT RELEVANT'} (confidence: ${result.confidence})`);
        console.log(`Explanation: ${result.explanation}`);
        return result.isRelevant;
      } catch (parseError) {
        console.error('Failed to parse relevance result:', parseError);
        console.log('Raw content:', content);
        return defaultRelevanceCheck(videoTitle, techName);
      }
    } catch (error) {
      console.error('Error checking relevance:', error);
        retryCount++;
      
      if (retryCount < API_MAX_RETRIES) {
        console.log(`Error occurred. Rotating API key and retrying with backoff (${backoffDelay}ms)...`);
        currentKey = getNextOpenRouterApiKey();
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
        backoffDelay *= 2; // Exponential backoff
        continue;
      }
      
      return defaultRelevanceCheck(videoTitle, techName);
    }
  }
  
  return defaultRelevanceCheck(videoTitle, techName);
};

/**
 * Fallback relevance checking function that uses regex and word matching
 * @param {string} videoTitle - The title of the video to check
 * @param {string} techName - The technology name to match against
 * @returns {boolean} - Whether the video is relevant to the technology
 */
const defaultRelevanceCheck = (videoTitle, techName) => {
  console.log(`Using fallback relevance check for "${videoTitle}" and "${techName}"`);
  
  const titleLower = videoTitle.toLowerCase();
  const techLower = techName.toLowerCase();
  
  // Split technology name into words
  const techWords = techLower.split(' ').filter(word => word.length > 2);
  
  if (techWords.length === 1) {
    // For single word tech names, use word boundary matching
    const techWordRegex = new RegExp(`\\b${techWords[0]}\\b`, 'i');
    return techWordRegex.test(titleLower);
  } else {
    // For multi-word tech names, check if at least half of the words match
    const matchingWords = techWords.filter(word => titleLower.includes(word));
    const minRequiredMatches = Math.ceil(techWords.length / 2);
    return matchingWords.length >= minRequiredMatches;
  }
};

/**
 * Clear all shared resources
 */
export const clearSharedResources = () => {
  sharedResourcesMap.clear();
  sharedResourceTopics.clear();
  console.log('Cleared shared resources tracking');
}; 

/**
 * Check if a video title is relevant to a technology topic using sentence embeddings and semantic similarity
 * @param {string} videoTitle - The title of the video to check
 * @param {string} techName - The technology name to match against
 * @returns {Promise<boolean>} - Whether the video is relevant to the technology
 */
const checkRelevanceWithEmbeddings = async (videoTitle, techName) => {
  try {
    console.log(`Checking relevance with embeddings: "${videoTitle}" for "${techName}"`);
    
    // Call the embedding similarity API endpoint
    const response = await fetch(`${API_URL}/check-relevance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: videoTitle,
        technology: techName
      })
    });
    
    if (!response.ok) {
      console.error(`API error (${response.status}): ${response.statusText}`);
      return defaultRelevanceCheck(videoTitle, techName);
    }
    
    const result = await response.json();
    console.log(`Embedding similarity result: ${result.isRelevant ? 'RELEVANT' : 'NOT RELEVANT'} (similarity: ${result.similarity.toFixed(3)})`);
    console.log(`Explanation: ${result.explanation}`);
    
    return result.isRelevant;
  } catch (error) {
    console.error('Error checking relevance with embeddings:', error);
    return defaultRelevanceCheck(videoTitle, techName);
  }
};

/**
 * Check multiple video titles for relevance to a technology using batch processing
 * @param {Array<string>} videoTitles - Array of video titles to check
 * @param {string} techName - The technology name to match against
 * @returns {Promise<Array<{title: string, isRelevant: boolean, similarity: number, explanation: string}>>} - Results for each title
 */
const checkBatchRelevanceWithEmbeddings = async (videoTitles, techName) => {
  try {
    console.log(`Checking batch relevance for ${videoTitles.length} titles for "${techName}"`);
    
    // Call the batch relevance API endpoint
    const response = await fetch(`${API_URL}/check-batch-relevance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        titles: videoTitles,
        technology: techName
      })
    });
    
    if (!response.ok) {
      console.error(`API error (${response.status}): ${response.statusText}`);
      // Fall back to checking each title individually with the default method
      return videoTitles.map(title => ({
        title,
        isRelevant: defaultRelevanceCheck(title, techName),
        similarity: 0.5,
        explanation: "Fallback method used due to API error"
      }));
    }
    
    const result = await response.json();
    console.log(`Batch relevance check complete. Processed ${result.results.length} titles.`);
    
    return result.results;
  } catch (error) {
    console.error('Error checking batch relevance:', error);
    // Fall back to checking each title individually with the default method
    return videoTitles.map(title => ({
      title,
      isRelevant: defaultRelevanceCheck(title, techName),
      similarity: 0.5,
      explanation: "Fallback method used due to error"
    }));
  }
};

/**
 * Process a batch of videos to check their relevance to a technology
 * @param {Array<Object>} videos - Array of video objects to process
 * @param {string} techName - Technology to check relevance against
 * @returns {Promise<Array<Object>>} - Videos with relevance information added
 */
const processBatchVideoRelevance = async (videos, techName) => {
  if (!videos || videos.length === 0 || !techName) {
    return videos;
  }
  
  try {
    // Extract titles and create a map to match results back to videos
    const titles = videos.map(video => video.title);
    const titleToVideoMap = {};
    videos.forEach(video => {
      titleToVideoMap[video.title] = video;
    });
    
    // Get batch relevance results
    const batchResults = await checkBatchRelevanceWithEmbeddings(titles, techName);
    
    // Apply results to videos
    batchResults.forEach(result => {
      const video = titleToVideoMap[result.title];
      if (video) {
        video.isRelevant = result.isRelevant;
        video.relevanceSimilarity = result.similarity;
        video.relevanceExplanation = result.explanation;
      }
    });
    
    console.log(`Processed relevance for ${batchResults.length} videos in batch mode`);
    return videos;
  } catch (error) {
    console.error('Error in batch video relevance processing:', error);
    
    // Fall back to individual processing
    console.log('Falling back to individual relevance checks');
    for (const video of videos) {
      video.isRelevant = await checkRelevanceWithEmbeddings(video.title, techName);
    }
    
    return videos;
  }
};

/**
 * Check if a playlist title is relevant to a specific technology
 * @param {string} playlistTitle - The playlist title to check
 * @param {string} techName - The technology name to check against
 * @param {boolean} useEmbeddings - Whether to use embedding-based relevance checking
 * @returns {boolean|Promise<boolean>} - Whether the playlist title is relevant
 */
const checkPlaylistTitleRelevance = async (playlistTitle, techName, useEmbeddings = false) => {
  if (!playlistTitle || !techName) return false;
  
  // If embedding-based relevance checking is enabled, use it
  if (useEmbeddings && ENABLE_LLM_RELEVANCE) {
    console.log(`Using embeddings to check playlist relevance: "${playlistTitle}" for "${techName}"`);
    return await checkRelevanceWithEmbeddings(playlistTitle, techName);
  }
  
  // Otherwise fall back to basic pattern matching
  const titleLower = playlistTitle.toLowerCase();
  const techLower = techName.toLowerCase();
  
  // Basic relevance check with common variations
  const isRelevant = titleLower.includes(techLower) || 
    // Node.js variations
    (techLower === 'node.js' && (titleLower.includes('nodejs') || titleLower.includes('node js'))) ||
    // Javascript variations
    (techLower === 'javascript' && titleLower.includes('js')) ||
    // Python variations
    (techLower === 'python' && titleLower.includes('py')) ||
    // Machine learning variations
    (techLower === 'machine learning' && titleLower.includes('ml'));
  
  console.log(`Basic relevance check for playlist: "${playlistTitle}" to "${techName}" - ${isRelevant ? 'PASSED' : 'FAILED'}`);
  return isRelevant;
}; 

/**
 * Check if all technologies in a shared resource are present in the roadmap topics
 * @param {Array<string>} resourceTechnologies - The technologies from the resource
 * @param {Array<string>} roadmapTopics - The topics from the roadmap
 * @returns {Promise<boolean>} - True if all resource technologies are in the roadmap
 */
const checkAllResourceTechnologiesInRoadmap = async (resourceTechnologies, roadmapTopics) => {
  if (!resourceTechnologies || !Array.isArray(resourceTechnologies) || resourceTechnologies.length === 0) {
    return false;
  }
  
  if (!roadmapTopics || !Array.isArray(roadmapTopics) || roadmapTopics.length === 0) {
    return false;
  }
  
  // Normalize roadmap topics for easier comparison
  const normalizedRoadmapTopics = roadmapTopics.map(topic => 
    typeof topic === 'string' ? topic.toLowerCase() : ''
  );
  
  console.log('Checking if resource technologies are in roadmap:', {
    resourceTechs: resourceTechnologies,
    roadmapTopics: normalizedRoadmapTopics
  });
  
  // Check if each technology in the resource is in the roadmap
  for (const resourceTech of resourceTechnologies) {
    let techFound = false;
    
    // First check direct match
    if (normalizedRoadmapTopics.includes(resourceTech.toLowerCase())) {
      techFound = true;
      continue;
    }
    
    // If no direct match, check equivalence with each roadmap topic
    for (const roadmapTopic of normalizedRoadmapTopics) {
      try {
        const isEquivalent = await areTechnologiesEquivalent(resourceTech, roadmapTopic);
        if (isEquivalent) {
          techFound = true;
          break;
        }
      } catch (error) {
        console.error(`Error checking technology equivalence: ${error.message}`);
        // Fallback to simplified comparison
        if (fallbackAreTechnologiesEquivalent(resourceTech, roadmapTopic)) {
          techFound = true;
          break;
        }
      }
    }
    
    // If any technology is not found in the roadmap, return false
    if (!techFound) {
      console.warn(`Resource technology "${resourceTech}" not found in roadmap topics`);
      return false;
    }
  }
  
  // All technologies were found in the roadmap
  return true;
};

/**
 * Get topic resources (compatibility function for the original API)
 */