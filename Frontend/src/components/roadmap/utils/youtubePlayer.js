/**
 * YouTube Player Utility Functions
 * Robust version that handles various URL formats and edge cases
 */

/**
 * Extract YouTube video ID from various URL formats
 * @param {string} url - YouTube URL in various formats
 * @returns {string} - YouTube video ID or empty string if not found
 */
export function extractYouTubeVideoId(url) {
  if (!url) return '';
  
  // Handle URL objects or stringified objects
  if (typeof url === 'object') {
    url = url.toString();
  }
  
  // Clean the URL - remove any whitespace, quotes, etc.
  url = url.trim().replace(/^["']|["']$/g, '');
  
  // For youtube.com/watch URLs
  if (url.includes('youtube.com/watch')) {
    try {
      // Handle URLs with or without protocol
      const fullUrl = url.includes('http') ? url : `https://${url}`;
      const urlObj = new URL(fullUrl);
      return urlObj.searchParams.get('v') || '';
    } catch (e) {
      // Fallback for malformed URLs
      const match = url.match(/[?&]v=([^&#]*)/);
      return match ? match[1] : '';
    }
  }
  
  // For youtu.be URLs
  if (url.includes('youtu.be/')) {
    try {
      const parts = url.split('youtu.be/');
      if (parts.length > 1) {
        return parts[1].split(/[?&#]/)[0] || '';
      }
    } catch (e) {
      console.error('Error parsing YouTube URL:', e);
    }
  }
  
  // For embed URLs
  if (url.includes('youtube.com/embed/')) {
    try {
      const parts = url.split('youtube.com/embed/');
      if (parts.length > 1) {
        return parts[1].split(/[?&#]/)[0] || '';
      }
    } catch (e) {
      console.error('Error parsing YouTube URL:', e);
    }
  }
  
  // For video IDs directly
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
    return url;
  }
  
  return '';
}

/**
 * Create a YouTube embed URL with proper parameters
 * @param {string} videoId - YouTube video ID
 * @param {Object} options - Options for the embed URL
 * @returns {string} - Properly formatted YouTube embed URL
 */
export function createYouTubeEmbedUrl(videoId, options = {}) {
  if (!videoId) return '';
  
  const {
    autoplay = true,
    controls = true,
    showInfo = true,
    rel = false,
    origin = window.location.origin
  } = options;
  
  const params = new URLSearchParams();
  
  if (autoplay) params.append('autoplay', '1');
  if (!controls) params.append('controls', '0');
  if (!showInfo) params.append('showinfo', '0');
  if (!rel) params.append('rel', '0');
  
  // Always add these parameters for better cross-origin handling
  params.append('enablejsapi', '1');
  params.append('widgetid', '1');
  
  // Add origin parameter safely
  if (origin) {
    try {
      // Ensure origin is properly encoded
      params.append('origin', encodeURIComponent(origin));
    } catch (e) {
      console.error('Error encoding origin:', e);
    }
  }
  
  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
} 