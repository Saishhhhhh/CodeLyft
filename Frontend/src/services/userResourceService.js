import { parseYouTubeUrl, validateYouTubeUrl } from '../utils/youtubeValidator';
import { getVideoDetails, getPlaylistVideos } from './youtubeService';

/**
 * Process a user-provided YouTube URL and get its details
 * @param {string} url - The YouTube URL provided by the user
 * @returns {Promise<Object>} - The processed resource with all necessary details
 */
export const processUserResource = async (url) => {
  try {
    // First validate the URL format
    const parsedUrl = parseYouTubeUrl(url);
    
    if (!parsedUrl.isValid) {
      throw new Error('Invalid YouTube URL format');
    }
    
    // Validate that the video/playlist exists
    const validationResult = await validateYouTubeUrl(url);
    
    if (!validationResult.exists) {
      throw new Error(validationResult.error || 'This YouTube resource could not be found or is private');
    }
    
    // Process based on resource type
    if (parsedUrl.type === 'video') {
      // Get video details from API
      const videoDetails = await getVideoDetails(url);
      
      return {
        type: 'video',
        id: parsedUrl.id,
        title: videoDetails.title,
        url: url,
        channel: videoDetails.channel?.name || videoDetails.channel || 'Unknown',
        duration: videoDetails.duration_string || videoDetails.duration || 'Unknown',
        duration_string: videoDetails.duration_string || videoDetails.duration || 'Unknown',
        publish_date: videoDetails.publish_date || 'Unknown',
        views: videoDetails.views_formatted || 'N/A',
        likes: videoDetails.likes_formatted || 'N/A',
        thumbnail: videoDetails.thumbnail || 
                 `https://img.youtube.com/vi/${parsedUrl.id}/mqdefault.jpg`,
        isUserProvided: true // Flag to identify user-provided resources
      };
    } else if (parsedUrl.type === 'playlist') {
      // Get playlist videos from API
      const playlistData = await getPlaylistVideos(url);
      
      // Format the playlist with its videos
      return {
        type: 'playlist',
        id: parsedUrl.id,
        title: playlistData.title || validationResult.title || `Playlist: ${parsedUrl.id}`,
        url: url,
        channel: playlistData.channel?.name || playlistData.channel || 'Unknown',
        videoCount: playlistData.videos?.length || 0,
        isPlaylist: true,
        videos: playlistData.videos?.map(video => ({
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
                   (video.id ? `https://img.youtube.com/vi/${video.id}/mqdefault.jpg` : 
                   'https://via.placeholder.com/320x180?text=No+Thumbnail')
        })) || [],
        isUserProvided: true // Flag to identify user-provided resources
      };
    }
    
    throw new Error('Unsupported YouTube resource type');
  } catch (error) {
    console.error('Error processing user resource:', error);
    throw error;
  }
};

/**
 * Format a resource for storage in the roadmap
 * @param {Object} resource - The processed resource
 * @returns {Object} - The formatted resource ready for storage
 */
export const formatResourceForStorage = (resource) => {
  if (resource.isPlaylist) {
    // Format playlist
    return {
      title: resource.title,
      url: resource.url,
      channel: resource.channel,
      videoCount: resource.videoCount || resource.videos?.length || 0,
      isPlaylist: true,
      videos: resource.videos,
      isUserProvided: true
    };
  } else {
    // Format single video
    return {
      id: resource.id,
      title: resource.title,
      url: resource.url,
      channel: resource.channel,
      duration: resource.duration,
      duration_string: resource.duration_string,
      videos: [{
        id: resource.id,
        title: resource.title,
        url: resource.url,
        channel: resource.channel,
        duration: resource.duration,
        duration_string: resource.duration_string,
        thumbnail: resource.thumbnail,
        isUserProvided: true
      }],
      isUserProvided: true
    };
  }
}; 