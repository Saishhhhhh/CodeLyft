/**
 * YouTube URL validation utility functions
 */

/**
 * Check if a URL is a valid YouTube URL and determine its type
 * @param {string} url - The URL to check
 * @returns {Object} - { isValid: boolean, type: string, id: string }
 */
export const parseYouTubeUrl = (url) => {
  if (!url) return { isValid: false };
  
  try {
    // Normalize the URL
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    
    // Check if it's a YouTube domain
    if (!['youtube.com', 'www.youtube.com', 'youtu.be'].includes(hostname)) {
      return { isValid: false };
    }
    
    // Check for YouTube video URL patterns
    if (hostname === 'youtu.be') {
      // Short URL format: youtu.be/VIDEO_ID
      const videoId = urlObj.pathname.substring(1);
      if (videoId) {
        return { isValid: true, type: 'video', id: videoId };
      }
    } else {
      // Standard URL format
      const searchParams = new URLSearchParams(urlObj.search);
      
      // Check for video
      const videoId = searchParams.get('v');
      if (videoId) {
        return { isValid: true, type: 'video', id: videoId };
      }
      
      // Check for playlist
      const playlistId = searchParams.get('list');
      if (playlistId && urlObj.pathname.includes('/playlist')) {
        return { isValid: true, type: 'playlist', id: playlistId };
      }
    }
    
    return { isValid: false };
  } catch (error) {
    // Invalid URL format
    return { isValid: false };
  }
};

/**
 * Check if a YouTube URL points to an existing resource using oEmbed API
 * @param {string} url - The YouTube URL to validate
 * @returns {Promise<Object>} - { exists: boolean, type: string, id: string, title?: string }
 */
export const validateYouTubeUrl = async (url) => {
  const parsedUrl = parseYouTubeUrl(url);
  
  if (!parsedUrl.isValid) {
    return { exists: false, error: 'Invalid YouTube URL format' };
  }
  
  try {
    // For videos, we can use the oEmbed API to check if they exist
    if (parsedUrl.type === 'video') {
      const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
      
      const response = await fetch(oembedUrl);
      
      if (response.ok) {
        const data = await response.json();
        return { 
          exists: true, 
          type: 'video', 
          id: parsedUrl.id,
          title: data.title,
          author: data.author_name
        };
      } else {
        return { 
          exists: false, 
          error: 'This YouTube video could not be found or is private',
          type: 'video',
          id: parsedUrl.id
        };
      }
    } 
    // For playlists, we'll validate using a two-step approach
    else if (parsedUrl.type === 'playlist') {
      // Step 1: Validate the playlist ID format
      // YouTube playlist IDs typically start with PL, UU, FL, or similar and are at least 13 chars long
      const validPrefixes = ['PL', 'UU', 'FL', 'RD', 'OL', 'LL', 'WL'];
      const hasValidPrefix = validPrefixes.some(prefix => parsedUrl.id.startsWith(prefix));
      const hasValidLength = parsedUrl.id.length >= 13; // Most YouTube playlist IDs are at least 13 chars
      
      if (!hasValidPrefix || !hasValidLength) {
        return {
          exists: false,
          error: 'Invalid YouTube playlist ID format',
          type: 'playlist',
          id: parsedUrl.id
        };
      }
      
      // Step 2: Try to validate using the YouTube oEmbed API
      try {
        // Use oEmbed to check if the playlist exists
        const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
        
        const response = await fetch(oembedUrl);
        
        // If we get a successful response, the playlist likely exists
        if (response.ok) {
          const data = await response.json();
          return {
            exists: true,
            type: 'playlist',
            id: parsedUrl.id,
            title: data.title || `Playlist: ${parsedUrl.id}`,
            author: 'YouTube Playlist'
          };
        } else {
          // If oEmbed fails, the playlist likely doesn't exist or is private
          return {
            exists: false,
            error: 'This YouTube playlist could not be found or is private',
            type: 'playlist',
            id: parsedUrl.id
          };
        }
      } catch (error) {
        // If there's an error, the playlist likely doesn't exist
        console.warn("Error validating playlist:", error.message);
        return {
          exists: false,
          error: 'Invalid YouTube playlist',
          type: 'playlist',
          id: parsedUrl.id
        };
      }
    }
    
    return { exists: false, error: 'Unknown YouTube resource type' };
  } catch (error) {
    console.warn("Validation error:", error.message);
    return { 
      exists: false, 
      error: 'Network error while validating URL',
      type: parsedUrl.type,
      id: parsedUrl.id
    };
  }
};

/**
 * Get YouTube thumbnail URL from video ID
 * @param {string} videoId - The YouTube video ID
 * @returns {string} - Thumbnail URL
 */
export const getYouTubeThumbnail = (videoId) => {
  return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
};

/**
 * Format YouTube URL to canonical form
 * @param {string} type - 'video' or 'playlist'
 * @param {string} id - The YouTube video or playlist ID
 * @returns {string} - Canonical YouTube URL
 */
export const formatYouTubeUrl = (type, id) => {
  if (type === 'video') {
    return `https://www.youtube.com/watch?v=${id}`;
  } else if (type === 'playlist') {
    return `https://www.youtube.com/playlist?list=${id}`;
  }
  return '';
}; 