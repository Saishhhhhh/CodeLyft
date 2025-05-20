/**
 * Utility functions for handling video-related operations
 */

/**
 * Formats a duration value into a readable string (HH:MM:SS or MM:SS)
 * @param {string|number} duration - Duration in seconds or string format
 * @returns {string} Formatted duration string
 */
export const formatDuration = (duration) => {
  // Handle null or undefined
  if (!duration) return '0:00';

  // If duration is already a string in HH:MM:SS or MM:SS format
  if (typeof duration === 'string') {
    // Remove any non-numeric characters except colons
    const cleanDuration = duration.replace(/[^0-9:]/g, '');
    
    // Handle MM:SS format
    if (cleanDuration.match(/^\d+:\d{2}$/)) {
      const [minutes, seconds] = cleanDuration.split(':').map(Number);
      if (minutes >= 60) {
        // Convert to HH:MM:SS if minutes >= 60
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${hours}:${remainingMinutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      }
      return cleanDuration;
    }
    
    // Handle HH:MM:SS format
    if (cleanDuration.match(/^\d+:\d{2}:\d{2}$/)) {
      const [hours, minutes, seconds] = cleanDuration.split(':').map(Number);
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    // Handle duration in seconds (numeric string)
    if (!isNaN(duration)) {
      const totalSeconds = parseInt(duration);
      return formatDuration(totalSeconds);
    }
  }

  // If duration is a number (in seconds)
  if (typeof duration === 'number') {
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const seconds = Math.floor(duration % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  // Fallback for invalid duration
  return '0:00';
};

/**
 * Decodes HTML entities in a string
 * @param {string} html - String containing HTML entities
 * @returns {string} Decoded string
 */
export const decodeHTML = (html) => {
  if (!html) return '';
  try {
    // First try using the browser's built-in decoder
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    let decoded = txt.value;
    
    // If that didn't work, try manual replacement of common entities
    if (decoded === html) {
      decoded = html
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ')
        // Handle Unicode escape sequences
        .replace(/\\u([0-9a-fA-F]{4})/g, (_, code) => 
          String.fromCharCode(parseInt(code, 16))
        );
    }
    
    return decoded;
  } catch (e) {
    console.error('Error decoding HTML:', e);
    return html;
  }
};

/**
 * Decodes Unicode escape sequences in text
 * @param {string} text - Text containing Unicode escape sequences
 * @returns {string} Decoded text
 */
export const decodeUnicode = (text) => {
  if (!text) return '';
  return text.replace(/\\u([0-9a-fA-F]{4})/g, (_, code) => 
    String.fromCharCode(parseInt(code, 16))
  );
};

/**
 * Gets the channel name from a video object
 * @param {Object} video - Video object
 * @returns {string} Channel name
 */
export const getChannelName = (video) => {
  if (!video) return 'Unknown Channel';
  
  if (typeof video.channel === 'string') {
    return video.channel;
  }
  
  return video.channel?.name || 
         video.videos?.[0]?.channel?.name || 
         'Unknown Channel';
};

/**
 * Gets the thumbnail URL for a video
 * @param {Object} video - Video object
 * @returns {string} Thumbnail URL
 */
export const getThumbnailUrl = (video) => {
  if (!video) return '';
  
  return video.thumbnail || 
         `https://img.youtube.com/vi/${video.id}/mqdefault.jpg`;
};

/**
 * Groups topics by shared video resources
 * @param {Array} sections - Array of section objects
 * @returns {Map} Map of resource URLs to topic groups
 */
export const groupTopicsBySharedResources = (sections) => {
  const groupedTopics = new Map();
  
  sections.forEach(section => {
    section.topics.forEach(topic => {
      if (topic.video && topic.video.url) {
        const resourceKey = topic.video.url;
        if (!groupedTopics.has(resourceKey)) {
          groupedTopics.set(resourceKey, {
            resource: topic.video,
            topics: []
          });
        }
        groupedTopics.get(resourceKey).topics.push({
          sectionTitle: section.title,
          topicTitle: topic.title,
          topicDescription: topic.description
        });
      }
    });
  });
  
  return groupedTopics;
};

/**
 * Gets topics that don't share resources with others
 * @param {Array} sections - Array of section objects
 * @returns {Array} Array of ungrouped topics
 */
export const getUngroupedTopics = (sections) => {
  const groupedTopics = groupTopicsBySharedResources(sections);
  const ungroupedTopics = [];
  
  sections.forEach(section => {
    section.topics.forEach(topic => {
      if (!topic.video || !topic.video.url || !groupedTopics.has(topic.video.url)) {
        ungroupedTopics.push({
          sectionTitle: section.title,
          ...topic
        });
      }
    });
  });
  
  return ungroupedTopics;
}; 