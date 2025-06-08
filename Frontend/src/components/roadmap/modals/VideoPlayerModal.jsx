import React, { useEffect, useRef, useState } from 'react';
import { formatDuration } from '../utils/videoUtils';
import { extractYouTubeVideoId, createYouTubeEmbedUrl } from '../utils/youtubePlayer';

/**
 * VideoPlayerModal component with improved URL handling for database-retrieved videos
 */
const VideoPlayerModal = ({ video, isOpen, onClose }) => {
  const iframeRef = useRef(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [videoId, setVideoId] = useState('');
  const [embedUrl, setEmbedUrl] = useState('');
  const [errorDetails, setErrorDetails] = useState('');
  
  // Process the video object to extract necessary information
  useEffect(() => {
    if (!video) return;
    
    try {
      // Debug the video object
      console.log('Processing video object:', JSON.stringify(video, null, 2));
      
      // Get video URL from various possible locations in the object
      let videoUrl = '';
      if (typeof video === 'string') {
        videoUrl = video;
      } else if (video.url) {
        videoUrl = video.url;
      } else if (video.id && typeof video.id === 'string' && video.id.length === 11) {
        videoUrl = video.id; // Direct video ID
      }
      
      console.log('Extracted video URL:', videoUrl);
      
      // Extract the video ID
      const extractedId = extractYouTubeVideoId(videoUrl);
      console.log('Extracted video ID:', extractedId);
      
      if (!extractedId) {
        console.error('Could not extract YouTube video ID from:', videoUrl);
        setError(true);
        setErrorDetails(`Could not extract YouTube video ID from URL: ${videoUrl}`);
        return;
      }
      
      setVideoId(extractedId);
      
      // Create the embed URL
      const url = createYouTubeEmbedUrl(extractedId, {
        autoplay: true,
        origin: window.location.origin
      });
      
      console.log('Created embed URL:', url);
      setEmbedUrl(url);
    } catch (err) {
      console.error('Error processing video object:', err);
      setError(true);
      setErrorDetails(`Error processing video: ${err.message}`);
    }
  }, [video]);
  
  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setError(false);
      setErrorDetails('');
    }
  }, [isOpen]);
  
  // Handle iframe load/error events
  const handleIframeLoad = () => {
    console.log('YouTube iframe loaded successfully');
    setLoading(false);
  };
  
  const handleIframeError = (e) => {
    console.error('YouTube iframe error:', e);
    setError(true);
    setLoading(false);
    setErrorDetails('Failed to load the YouTube player. This may be due to network issues or the video being unavailable.');
  };
  
  // Retry loading the video with a simpler URL
  const handleRetry = () => {
    setError(false);
    setLoading(true);
    setErrorDetails('');
    
    if (iframeRef.current && videoId) {
      // Try a simpler URL as fallback
      const fallbackUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
      console.log('Retrying with fallback URL:', fallbackUrl);
      iframeRef.current.src = fallbackUrl;
    }
  };
  
  // Open video directly on YouTube
  const openOnYouTube = () => {
    if (videoId) {
      const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
      window.open(youtubeUrl, '_blank');
    }
  };
  
  // Format channel name
  const getChannelName = () => {
    if (!video) return 'Unknown';
    
    if (typeof video.channel === 'string') {
      return video.channel;
    } else if (video.channel?.name) {
      return video.channel.name;
    } else {
      return 'Unknown';
    }
  };
  
  // If modal is not open, don't render anything
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/80">
      <div className="relative w-full max-w-3xl mx-4">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white hover:text-gray-300"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Video Player */}
        <div className="relative bg-black" style={{ paddingTop: '56.25%' }}>
          <div className="absolute inset-0">
            {!videoId && !error && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                <p className="text-white">Processing video information...</p>
              </div>
            )}
            
            {videoId && embedUrl && !error && (
              <iframe
                ref={iframeRef}
                className="w-full h-full"
                src={embedUrl}
                title={video?.title || 'YouTube video'}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                onLoad={handleIframeLoad}
                onError={handleIframeError}
              />
            )}
            
            {/* Loading indicator */}
            {loading && videoId && !error && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="w-12 h-12 border-4 border-t-orange-500 border-gray-300 rounded-full animate-spin"></div>
              </div>
            )}
            
            {/* Error message */}
            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="text-white text-center p-4 max-w-md">
                  <p className="mb-2 text-xl font-bold">Failed to load video</p>
                  <p className="mb-4 text-sm text-gray-300">
                    {errorDetails || 'The video may be unavailable or there might be a connection issue.'}
                  </p>
                  <div className="flex flex-col sm:flex-row justify-center gap-3">
                    {videoId && (
                      <button
                        onClick={openOnYouTube}
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                      >
                        Watch on YouTube
                      </button>
                    )}
                    <button
                      onClick={handleRetry}
                      className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Video Info */}
        {video && (
          <div className="mt-3 text-white">
            <h3 className="text-lg font-medium">{video.title || 'Untitled Video'}</h3>
            <div className="flex flex-wrap mt-1 text-sm text-gray-300">
              <span className="mr-4">Duration: {formatDuration(video.duration || '0:00')}</span>
              <span>Channel: {getChannelName()}</span>
              {videoId && (
                <span className="ml-auto">
                  <button 
                    onClick={openOnYouTube}
                    className="text-blue-400 hover:text-blue-300 underline"
                  >
                    Open on YouTube
                  </button>
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoPlayerModal; 