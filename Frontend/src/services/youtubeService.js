const API_URL = import.meta.env.VITE_YOUTUBE_API_URL || 'http://127.0.0.1:8000';
console.log('Using API URL:', API_URL); // Debug log
// Replace the single API key with an array of keys
const GROQ_API_KEYS = [
  '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',
  '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',
  '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',
  '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',
  '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',
  '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',
  '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',
  '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'
];

// Import the resource cache service
import { findResourcesForTechnology, cacheResource } from './resourceCache';

let currentKeyIndex = 0;

/**
 * Get the next available Groq API key
 * @returns {string} The next API key to use
 */
const getNextGroqApiKey = () => {
  currentKeyIndex = (currentKeyIndex + 1) % GROQ_API_KEYS.length;
  return GROQ_API_KEYS[currentKeyIndex];
};

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_RATE_LIMIT_DELAY = 5000; // Increase delay to 5 seconds
const GROQ_MAX_RETRIES = 3;

// Flag to control whether to use Groq for relevance checking
// Set to false to avoid excessive API calls during development
// Note: Playlist relevance checking now happens through the backend /find/best-playlist API
const ENABLE_GROQ_RELEVANCE = false;

// Track shared resources to avoid redundant searches
const sharedResourcesMap = new Map();
const sharedResourceTopics = new Map(); // New map to track topics for each resource

/**
 * Use Groq to check if two technology names are equivalent
 * @param {string} tech1 - First technology name
 * @param {string} tech2 - Second technology name
 * @returns {Promise<boolean>} - Whether the technologies are equivalent
 */
const areTechnologiesEquivalent = async (tech1, tech2) => {
  let retryCount = 0;
  let currentKey = GROQ_API_KEYS[currentKeyIndex];
  
  while (retryCount < GROQ_MAX_RETRIES) {
    try {
      console.log(`Checking if technologies are equivalent: "${tech1}" and "${tech2}" (Attempt ${retryCount + 1}/${GROQ_MAX_RETRIES})`);
      
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama3-70b-8192',
          messages: [
            {
              role: 'system',
              content: `You are a technology name matcher. Your task is to determine if two technology names refer to the same technology.

              Rules:
              1. Consider common variations and abbreviations (e.g., "Node.js" = "NodeJS" = "Node JS")
              2. Consider version numbers as part of the name (e.g., "React 18" = "React.js 18")
              3. Ignore case differences
              4. Consider framework/library relationships (e.g., "Express" = "Express.js")
              5. Be strict about different technologies (e.g., "Node.js" ≠ "Deno")
              
              Respond with a JSON object containing:
              {
                "areEquivalent": boolean,
                "explanation": "brief explanation of your decision",
                "confidence": number (0-1)
              }

              IMPORTANT: Return ONLY the JSON object, no markdown formatting or additional text.`
            },
            {
              role: 'user',
              content: `Are these technologies equivalent?
              Technology 1: "${tech1}"
              Technology 2: "${tech2}"`
            }
          ],
          temperature: 0.1,
          max_tokens: 150,
          response_format: { type: "json_object" }
        })
      });

      if (response.status === 429) {
        retryCount++;
        if (retryCount < GROQ_MAX_RETRIES) {
          console.log(`Groq API rate limit reached. Rotating API key and retrying...`);
          currentKey = getNextGroqApiKey();
          await new Promise(resolve => setTimeout(resolve, GROQ_RATE_LIMIT_DELAY));
          continue;
        } else {
          console.log('Max retries reached for Groq API. Using fallback technology matching.');
          return fallbackAreTechnologiesEquivalent(tech1, tech2);
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`Groq API error (${response.status}):`, errorData);
        throw new Error(`Failed to check technology equivalence: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
      
      try {
        const result = JSON.parse(cleanContent);
        console.log(`Technology equivalence result: ${result.areEquivalent ? 'EQUIVALENT' : 'DIFFERENT'} (confidence: ${result.confidence})`);
        console.log(`Explanation: ${result.explanation}`);
        return result.areEquivalent;
      } catch (parseError) {
        console.error('Failed to parse Groq result:', parseError);
        return fallbackAreTechnologiesEquivalent(tech1, tech2);
      }
    } catch (error) {
      console.error('Error checking technology equivalence:', error);
      if (retryCount < GROQ_MAX_RETRIES - 1) {
        retryCount++;
        currentKey = getNextGroqApiKey();
        await new Promise(resolve => setTimeout(resolve, GROQ_RATE_LIMIT_DELAY));
        continue;
      }
      return fallbackAreTechnologiesEquivalent(tech1, tech2);
    }
  }
  
  return fallbackAreTechnologiesEquivalent(tech1, tech2);
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
 * Search YouTube for videos based on a query
 * @param {string} query - The search query
 * @param {number} limit - Maximum number of results to return (not used in API call)
 * @param {Object} options - Additional search options
 * @returns {Promise<Object>} - Search results from YouTube
 */
export const searchYouTube = async (query, limit = 15, options = {}) => {
  try {
    // Build query parameters - only include the query parameter
    const params = new URLSearchParams({
      query
    });

    const url = `${API_URL}/search/videos?${params}`;
    console.log('Making request to:', url); // Debug log

    // Make request to the API
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('Response status:', response.status); // Debug log

    if (!response.ok) {
      const errorData = await response.json();
      console.error(`YouTube search error: ${errorData.error || 'Unknown error'}`);
      // Return a minimal fallback result with the search URL
      return {
        query,
        results: [{
          id: 'fallback',
          title: `Search results for: ${query}`,
          url: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
          channel: { name: 'YouTube Search' },
          fallback: true,
          duration: isOneShot ? '90:00' : '30:00', // Provide a default duration
          // Add these properties for duration estimation
          title: query.includes('complete course') || query.includes('full course') ? 
                `Complete Course: ${query}` : `Tutorial: ${query}`,
          duration_seconds: isOneShot ? 5400 : 1800
        }],
        result_count: 1
      };
    }

    const data = await response.json();
    
    // Check if we received results - if not, create default fallback
    if (!data.results || data.results.length === 0) {
      console.log('No YouTube results returned, creating fallback');
      return {
        query,
        results: [{
          id: 'fallback',
          title: `Search results for: ${query}`,
          url: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
          channel: { name: 'YouTube Search' },
          fallback: true,
          duration: isOneShot ? '90:00' : '30:00', // Provide a default duration
          // Add these properties for duration estimation
          title: query.includes('complete course') || query.includes('full course') ? 
                `Complete Course: ${query}` : `Tutorial: ${query}`,
          duration_seconds: isOneShot ? 5400 : 1800
        }],
        result_count: 1
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error searching YouTube:', error);
    // Return a fallback result on any error
    return {
      query,
      results: [{
        id: 'fallback',
        title: `Search results for: ${query}`,
        url: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
        channel: { name: 'YouTube Search' },
        fallback: true,
        duration: '30:00', // Provide a default duration
        // Add these properties for duration estimation
        title: query.includes('complete course') || query.includes('full course') ? 
              `Complete Course: ${query}` : `Tutorial: ${query}`,
        duration_seconds: query.includes('complete course') || query.includes('full course') ? 5400 : 1800
      }],
      result_count: 1,
      error: error.message
    };
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
 * Rate a YouTube video based on specified criteria
 * Note: This is only used for individual videos now, not playlists
 * @param {Object} video - The video object to rate
 * @param {boolean} useGroqRelevance - Whether to use Groq for relevance checking
 * @returns {number|Promise<number>} - Rating from 0-6 or a Promise resolving to a rating
 */
const rateVideo = async (video, useGroqRelevance = false) => {
  if (!video || video.fallback) return 0;
  
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
    } catch (e) {
      console.log('Could not parse publish date:', video.publish_date);
    }
  }
  
  // Step 1: Title Relevance Check (Critical filter)
  // Check if the video title contains the actual technology name
  if (video.topicRelevanceTerm && video.title) {
    let isRelevant = false;
    
    if (useGroqRelevance) {
      // Use Groq LLM for relevance checking
      isRelevant = await checkRelevanceWithGroq(video.title, video.topicRelevanceTerm);
    } else {
      // Use the default relevance checking method
      isRelevant = defaultRelevanceCheck(video.title, video.topicRelevanceTerm);
    }
    
    if (!isRelevant) {
      console.log(`Rejecting video due to missing tech name in title: "${video.title}" should contain "${video.topicRelevanceTerm}"`);
      return 0;
    }
    
    console.log(`Video title passed ${useGroqRelevance ? 'Groq' : 'default'} relevance check for "${video.topicRelevanceTerm}"`);
  }
  
  // Step 2: Duration Check (Critical filter)
  const isLikelyOneshot = video.title?.toLowerCase().includes('oneshot') || 
                        video.title?.toLowerCase().includes('one shot') ||
                        video.title?.toLowerCase().includes('complete course') ||
                        video.title?.toLowerCase().includes('full course');
                     
  console.log(`Video "${video.title}" - Duration: ${durationMinutes} mins, Oneshot: ${isLikelyOneshot}`);
  
  // Make duration filtering consistent for all videos
  // Apply the same minimum duration requirement for all videos
  if (durationMinutes < 40) {
    // All videos should be at least 40 minutes
    console.log(`Rejecting video due to short duration (${durationMinutes} mins): ${video.title}`);
    return 0;
  }
  
  // Additional points for longer videos - using the same scale for all videos
  let durationBonus = 0;
  if (durationMinutes >= 180) durationBonus = 0.5; // 3+ hours
  else if (durationMinutes >= 90) durationBonus = 0.3; // 1.5+ hours
  
  if (durationBonus > 0) {
    console.log(`Adding duration bonus: +${durationBonus} points`);
    score += durationBonus;
  }
  
  // Give priority to one-shot/complete course videos
  if (isLikelyOneshot) {
    const oneshotBonus = 0.7;
    console.log(`Adding oneshot/complete course bonus: +${oneshotBonus} points`);
    score += oneshotBonus;
  }
  
  // Step 3: Engagement & Popularity Score (Out of 6 points total)
  
  // A. Views (Max 3 Points)
  if (views >= 500000) {
    score += 3;
  } else if (views >= 250000) {
    score += 2;
  } else if (views >= 100000) {
    score += 1;
  }
  
  // B. Likes (Max 1.5 Points)
  if (likes >= 5000) {
    score += 1.5;
  } else if (likes >= 2000) {
    score += 1;
  } else if (likes >= 1000) {
    score += 0.5;
  }
  
  // C. Like-to-View Ratio (Max 0.5 Points)
  if (views > 0 && likes > 0) {
    const ratio = likes / views;
    if (ratio >= 0.04) {
      score += 0.5;
    } else if (ratio >= 0.02) {
      score += 0.25;
    }
  }
  
  // D. Recency (Max 1 Point)
  if (publishYear >= 2024) {
    score += 1;
  } else if (publishYear >= 2022) {
    score += 0.5;
  }
  
  // Return final score (max 6)
  return Math.min(6, score);
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
      average: score >= 6.0
    }
  };
};

/**
 * Quick check if a playlist title is relevant to a topic
 * @param {string} playlistTitle - The playlist title to check
 * @param {string} techName - The technology name to check against
 * @returns {boolean|Promise<boolean>} - Whether the playlist title is relevant
 */
const checkPlaylistTitleRelevance = async (playlistTitle, techName, useGroq = false) => {
  if (!playlistTitle || !techName) return false;
  
  // If Groq relevance checking is enabled, use it
  if (useGroq && ENABLE_GROQ_RELEVANCE) {
    console.log(`Using Groq to check playlist relevance: "${playlistTitle}" for "${techName}"`);
    return await checkRelevanceWithGroq(playlistTitle, techName);
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
    if (result.status === "no_suitable_playlist") {
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
 * Extract technologies from a title using Groq
 * @param {string} title - The title to analyze
 * @param {Array<string>} roadmapTopics - List of topics from the roadmap
 * @returns {Promise<Array<string>>} - List of matching technologies
 */
const extractTechnologiesFromTitle = async (title, roadmapTopics) => {
  let retryCount = 0;
  let currentKey = GROQ_API_KEYS[currentKeyIndex];
  
  while (retryCount < GROQ_MAX_RETRIES) {
    try {
      console.log(`Extracting technologies from title: "${title}" (Attempt ${retryCount + 1}/${GROQ_MAX_RETRIES})`);
      
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama3-70b-8192',
          messages: [
            {
              role: 'system',
              content: `You are a technology content analyzer. Your task is to identify technologies mentioned in a title that match a given list of topics.

              Rules:
              1. Only identify technologies that exactly match or are common variations of the provided topics
              2. Consider common abbreviations (JS for JavaScript, k8s for Kubernetes)
              3. Ignore generic terms like "tutorial", "course", "complete", etc.
              4. Be strict - only match technologies that are clearly mentioned
              
              Respond with a JSON object containing:
              {
                "matchingTechnologies": ["array", "of", "matching", "technologies"],
                "confidence": number (0-1)
              }

              IMPORTANT: Return ONLY the JSON object, no markdown formatting or additional text.`
            },
            {
              role: 'user',
              content: `Title: "${title}"
              Available Topics: ${JSON.stringify(roadmapTopics)}`
            }
          ],
          temperature: 0.1,
          max_tokens: 150,
          response_format: { type: "json_object" }
        })
      });

      if (response.status === 429) {
        retryCount++;
        if (retryCount < GROQ_MAX_RETRIES) {
          console.log(`Groq API rate limit reached. Rotating API key and retrying...`);
          currentKey = getNextGroqApiKey();
          await new Promise(resolve => setTimeout(resolve, GROQ_RATE_LIMIT_DELAY));
          continue;
        } else {
          console.log('Max retries reached for Groq API. Using fallback technology extraction.');
          return fallbackExtractTechnologies(title, roadmapTopics);
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`Groq API error (${response.status}):`, errorData);
        throw new Error(`Failed to extract technologies: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
      
      try {
        const result = JSON.parse(cleanContent);
        console.log(`Extracted technologies: ${result.matchingTechnologies.join(', ')} (confidence: ${result.confidence})`);
        return result.matchingTechnologies;
      } catch (parseError) {
        console.error('Failed to parse Groq result:', parseError);
        return fallbackExtractTechnologies(title, roadmapTopics);
      }
    } catch (error) {
      console.error('Error extracting technologies:', error);
      if (retryCount < GROQ_MAX_RETRIES - 1) {
        retryCount++;
        currentKey = getNextGroqApiKey();
        await new Promise(resolve => setTimeout(resolve, GROQ_RATE_LIMIT_DELAY));
        continue;
      }
      return fallbackExtractTechnologies(title, roadmapTopics);
    }
  }
  
  return fallbackExtractTechnologies(title, roadmapTopics);
};

/**
 * Fallback method to extract technologies from title using basic pattern matching
 * @param {string} title - The title to analyze
 * @param {Array<string>} roadmapTopics - List of topics from the roadmap
 * @returns {Array<string>} - List of matching technologies
 */
const fallbackExtractTechnologies = (title, roadmapTopics) => {
  const titleLower = title.toLowerCase();
  const matchingTechnologies = [];
  
  // Common technology variations mapping
  const techVariations = {
    'javascript': ['js', 'javascript'],
    'node.js': ['nodejs', 'node js', 'node'],
    'express.js': ['expressjs', 'express js', 'express'],
    'mongodb': ['mongo', 'mongo db'],
    'react.js': ['reactjs', 'react js', 'react'],
    'typescript': ['ts', 'typescript'],
    'python': ['py', 'python'],
    'django': ['django'],
    'flask': ['flask'],
    'postgresql': ['postgres', 'postgresql', 'postgres db'],
    'mysql': ['mysql', 'my sql'],
    'redis': ['redis'],
    'docker': ['docker'],
    'kubernetes': ['k8s', 'kubernetes'],
    'aws': ['amazon web services', 'aws'],
    'azure': ['microsoft azure', 'azure'],
    'gcp': ['google cloud', 'google cloud platform', 'gcp']
  };
  
  // Check each topic and its variations
  for (const topic of roadmapTopics) {
    const topicLower = topic.toLowerCase();
    const variations = techVariations[topicLower] || [topicLower];
    
    for (const variation of variations) {
      if (titleLower.includes(variation)) {
        matchingTechnologies.push(topic);
        break;
      }
    }
  }
  
  console.log(`Fallback extracted technologies: ${matchingTechnologies.join(', ')}`);
  return matchingTechnologies;
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
      const cachedResult = await findResourcesForTechnology(topic, 1);
      if (cachedResult.success && cachedResult.data.length > 0) {
        console.log(`Found cached resource for "${topic}"`);
        
        // Format the cached resource to match the expected format
        const resource = cachedResult.data[0];
        
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
          // Add thumbnail if it's a single video
          ...(resource.type === 'video' && processedVideos.length > 0 ? {
            thumbnail: processedVideos[0].thumbnail,
            duration: processedVideos[0].duration,
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
    
    // Extract just the technology name for relevance checking
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
    
    console.log(`Technology name for relevance checking: "${techName}"`);
    
    // First try to find a suitable playlist using the new API endpoint
    console.log(`Searching for best ${normalizedTopic} playlist using API...`);
    const bestPlaylistResult = await findBestPlaylist(normalizedTopic, false);
    
    // Store playlist info if found
    let playlistScore = 0;
    let bestPlaylist = null;
    
    // Check if we found a playlist and if it meets minimum quality threshold (score ≥ 6.0)
    if (bestPlaylistResult && bestPlaylistResult.score >= 6.0) {
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
        videos: bestPlaylistResult.playlist.videos || []
      };

      // If the playlist is exceptional (≥8.0), extract technologies and return it immediately
      if (playlistScore >= 8.0) {
        console.log(`Found EXCEPTIONAL playlist (${playlistScore}/10), extracting technologies...`);
        const matchingTechnologies = await extractTechnologiesFromTitle(
          bestPlaylistResult.playlist.title,
          roadmapTopics
        );
        bestPlaylist.matchingTechnologies = matchingTechnologies.length > 1 ? matchingTechnologies : undefined;
        
        // If this playlist covers multiple topics, add it to shared resources
        if (matchingTechnologies.length > 1) {
          await addSharedResource(bestPlaylist, matchingTechnologies);
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
      console.log(`No suitable playlist found or score below threshold`);
    }
    
    // Only search for videos if we don't have an exceptional playlist
    if (!bestPlaylist || bestPlaylist.quality !== 'Exceptional') {
      try {
        // Search for single videos as well
        console.log(`Searching for individual videos on: ${normalizedTopic}`);
        
        // Format the search query with the requested pattern
        const hasCompleteKeyword = normalizedTopic.toLowerCase().includes('complete');
        const minDuration = 40;
        
        const searchConfig = {
          query: hasCompleteKeyword ? 
            `${normalizedTopic} course full oneshot` : 
            `Complete ${normalizedTopic} course full oneshot`,
          isOneShot: true, 
          minDuration: minDuration,
          relevanceTerm: techName
        };
        
        console.log(`Trying search: "${searchConfig.query}"`);
        
        const searchResult = await searchYouTube(
          searchConfig.query, 
          15, 
          { isOneShot: searchConfig.isOneShot, minDuration: searchConfig.minDuration }
        );
        
        // Rate all videos and find the best match
        if (searchResult?.results?.length > 0) {
          try {
            console.log(`Found ${searchResult.results.length} videos, fetching details in parallel...`);
            
            // Maximum number of concurrent requests to avoid overwhelming the API
            const MAX_CONCURRENT_REQUESTS = 5;
            const videosToProcess = [...searchResult.results];
            const processedVideos = [];
            
            // Process videos in batches for parallel fetching
            while (videosToProcess.length > 0) {
              const currentBatch = videosToProcess.splice(0, MAX_CONCURRENT_REQUESTS);
              console.log(`Processing batch of ${currentBatch.length} videos in parallel`);
              
              // Create promises for each video in the current batch
              const batchPromises = currentBatch.map(async (video) => {
              try {
                // Skip if it's a fallback video
                if (video.fallback) return video;

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
              // Add topic relevance term for title matching
              video.topicRelevanceTerm = searchConfig.relevanceTerm;
              
              // Rate the video (using the existing rateVideo function)
              const rating = await rateVideo(video, false);
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
                console.log(`${searchConfig.isOneShot ? 'OneShot' : 'Regular'} - ${video.title} - Rating: ${rating.toFixed(1)}/6 - Duration: ${durationMinutes} minutes`);
              
                // Select the video with the highest rating
                if (rating > highestRating || (rating === highestRating && durationMinutes > highestDuration)) {
                  highestRating = rating;
                  highestDuration = durationMinutes;
                  highestRatedVideo = video;
                }
              }
            }
          } catch (error) {
            console.error('Error processing video details:', error);
            // Continue with the original search results if there's an error
            for (const video of searchResult.results) {
              // Add topic relevance term for title matching
              video.topicRelevanceTerm = searchConfig.relevanceTerm;
              
              // Rate the video (using the existing rateVideo function)
              const rating = await rateVideo(video, false);
              video.rating = rating;
              
              if (rating > 0) {
                console.log(`Fallback rating for ${video.title} - Rating: ${rating.toFixed(1)}/6`);
                if (rating > highestRating) {
                  highestRating = rating;
                  highestRatedVideo = video;
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('Error searching for videos:', error);
        // Continue with playlist if available
        if (bestPlaylist) {
          return bestPlaylist;
        }
      }
    }
    
    // If we found a video above minimum threshold (rating ≥ 3.0)
    if (highestRatedVideo && highestRating >= 3.0) {
      console.log(`Best video found: ${highestRatedVideo.title} (Score: ${highestRating}/6)`);
      
      // Add rating and duration to the video object
      highestRatedVideo.videoRating = highestRating.toFixed(1);
      highestRatedVideo.durationMinutes = highestDuration;
      
      // If the video is excellent (≥4.5), extract technologies and return it immediately
      if (highestRating >= 4.5) {
        console.log(`Found excellent video (${highestRating}/6), extracting technologies...`);
        const matchingTechnologies = await extractTechnologiesFromTitle(
          highestRatedVideo.title,
          roadmapTopics
        );
        highestRatedVideo.matchingTechnologies = matchingTechnologies.length > 1 ? matchingTechnologies : undefined;
        
        // If this video covers multiple topics, add it to shared resources
        if (matchingTechnologies.length > 1) {
          await addSharedResource(highestRatedVideo, matchingTechnologies);
        }
        
        // Cache the resource
        try {
          await cacheResource(highestRatedVideo, topic);
          console.log(`Cached excellent video for "${topic}"`);
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
        
        // Extract technologies from the better resource
        if (normalizedVideoScore > playlistScore) {
          console.log(`Video is better (${normalizedVideoScore.toFixed(1)} > ${playlistScore}), extracting technologies...`);
          const matchingTechnologies = await extractTechnologiesFromTitle(
            highestRatedVideo.title,
            roadmapTopics
          );
          highestRatedVideo.matchingTechnologies = matchingTechnologies.length > 1 ? matchingTechnologies : undefined;
          
          // If this video covers multiple topics, add it to shared resources
          if (matchingTechnologies.length > 1) {
            await addSharedResource(highestRatedVideo, matchingTechnologies);
          }
          
          // Cache the resource
          try {
            await cacheResource(highestRatedVideo, topic);
            console.log(`Cached video for "${topic}"`);
          } catch (cacheError) {
            console.error('Error caching video:', cacheError);
          }
          
          return highestRatedVideo;
        } else {
          console.log(`Playlist is better (${playlistScore} > ${normalizedVideoScore.toFixed(1)}), extracting technologies...`);
          const matchingTechnologies = await extractTechnologiesFromTitle(
            bestPlaylist.title,
            roadmapTopics
          );
          bestPlaylist.matchingTechnologies = matchingTechnologies.length > 1 ? matchingTechnologies : undefined;
          
          // If this playlist covers multiple topics, add it to shared resources
          if (matchingTechnologies.length > 1) {
            await addSharedResource(bestPlaylist, matchingTechnologies);
          }
          
          // Cache the resource
          try {
            await cacheResource(bestPlaylist, topic);
            console.log(`Cached playlist for "${topic}"`);
          } catch (cacheError) {
            console.error('Error caching playlist:', cacheError);
          }
          
          return bestPlaylist;
        }
      }
      
      // If only video is found and meets minimum threshold, extract technologies and return it
      console.log('Only video found, extracting technologies...');
      const matchingTechnologies = await extractTechnologiesFromTitle(
        highestRatedVideo.title,
        roadmapTopics
      );
      highestRatedVideo.matchingTechnologies = matchingTechnologies.length > 1 ? matchingTechnologies : undefined;
      
      // If this video covers multiple topics, add it to shared resources
      if (matchingTechnologies.length > 1) {
        await addSharedResource(highestRatedVideo, matchingTechnologies);
      }
      
      // Cache the resource
      try {
        await cacheResource(highestRatedVideo, topic);
        console.log(`Cached video for "${topic}"`);
      } catch (cacheError) {
        console.error('Error caching video:', cacheError);
      }
      
      return highestRatedVideo;
    }
    
    // If only playlist is found and meets minimum threshold, extract technologies and return it
    if (bestPlaylist) {
      console.log('Only playlist found, extracting technologies...');
      const matchingTechnologies = await extractTechnologiesFromTitle(
        bestPlaylist.title,
        roadmapTopics
      );
      bestPlaylist.matchingTechnologies = matchingTechnologies.length > 1 ? matchingTechnologies : undefined;
      
      // If this playlist covers multiple topics, add it to shared resources
      if (matchingTechnologies.length > 1) {
        await addSharedResource(bestPlaylist, matchingTechnologies);
      }
      
      // Cache the resource
      try {
        await cacheResource(bestPlaylist, topic);
        console.log(`Cached playlist for "${topic}"`);
      } catch (cacheError) {
        console.error('Error caching playlist:', cacheError);
      }
      
      return bestPlaylist;
    }
    
    // If neither video nor playlist meets minimum thresholds, return a search link
    console.log('No suitable video or playlist found, returning search link');
    return {
      title: `Find tutorials for: ${normalizedTopic}`,
      url: `https://www.youtube.com/results?search_query=${encodeURIComponent(normalizedTopic + ' tutorial')}`,
      channel: { name: 'YouTube Search' },
      views_formatted: 'N/A',
      likes_formatted: 'N/A',
      fallback: true,
      videoRating: '0.0'
    };
  } catch (error) {
    console.error(`Error finding best video for topic "${topic}":`, error);
    
    // Return a fallback search URL on error
    return {
      title: `YouTube tutorial for: ${topic}`,
      url: `https://www.youtube.com/results?search_query=${encodeURIComponent(topic + ' tutorial')}`,
      channel: { name: 'YouTube Search' },
      views_formatted: 'N/A',
      likes_formatted: 'N/A',
      fallback: true,
      videoRating: '0.0'
    };
  }
};

/**
 * Use Groq LLM to check if a video title is relevant to a technology topic
 * @param {string} videoTitle - The title of the video to check
 * @param {string} techName - The technology name to match against
 * @returns {Promise<boolean>} - Whether the video is relevant to the technology
 */
const checkRelevanceWithGroq = async (videoTitle, techName) => {
  let retryCount = 0;
  let currentKey = GROQ_API_KEYS[currentKeyIndex];
  
  while (retryCount < GROQ_MAX_RETRIES) {
    try {
      console.log(`Checking relevance with Groq: "${videoTitle}" for "${techName}" (Attempt ${retryCount + 1}/${GROQ_MAX_RETRIES})`);
    
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama3-70b-8192',
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
              }

              IMPORTANT: Return ONLY the JSON object, no markdown formatting or additional text.`
            },
            {
              role: 'user',
              content: `Video Title: "${videoTitle}"
              Technology Topic: "${techName}"`
            }
          ],
          temperature: 0.1,
          max_tokens: 150,
          response_format: { type: "json_object" }
        })
      });

      if (response.status === 429) { // Rate limit
        retryCount++;
        if (retryCount < GROQ_MAX_RETRIES) {
          console.log(`Groq API rate limit reached. Rotating API key and retrying...`);
          currentKey = getNextGroqApiKey();
          await new Promise(resolve => setTimeout(resolve, GROQ_RATE_LIMIT_DELAY));
          continue;
        } else {
          console.log('Max retries reached for Groq API. Using fallback evaluation.');
          return defaultRelevanceCheck(videoTitle, techName);
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`Groq API error (${response.status}):`, errorData);
        throw new Error(`Failed to check relevance with Groq: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      // Clean the response content
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
      
      try {
        const result = JSON.parse(cleanContent);
        console.log(`Groq relevance result: ${result.isRelevant ? 'RELEVANT' : 'NOT RELEVANT'} (confidence: ${result.confidence})`);
        console.log(`Explanation: ${result.explanation}`);
        return result.isRelevant;
      } catch (parseError) {
        console.error('Failed to parse Groq relevance result:', parseError);
        console.log('Raw content:', content);
        return defaultRelevanceCheck(videoTitle, techName);
      }
    } catch (error) {
      console.error('Error checking relevance with Groq:', error);
      if (retryCount < GROQ_MAX_RETRIES - 1) {
        retryCount++;
        currentKey = getNextGroqApiKey();
        await new Promise(resolve => setTimeout(resolve, GROQ_RATE_LIMIT_DELAY));
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