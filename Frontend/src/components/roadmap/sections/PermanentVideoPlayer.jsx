import React from 'react';

const PermanentVideoPlayer = ({ 
  currentVideo, 
  onClose, 
  theme 
}) => {
  // Function to convert YouTube URL to embed URL
  const getEmbedUrl = (url) => {
    if (!url) return '';
    
    // Handle different YouTube URL formats
    let videoId = '';
    
    if (url.includes('youtube.com/watch')) {
      // Regular YouTube URL
      const urlParams = new URLSearchParams(new URL(url).search);
      videoId = urlParams.get('v');
    } else if (url.includes('youtu.be/')) {
      // Short YouTube URL
      videoId = url.split('youtu.be/')[1];
    } else if (url.includes('youtube.com/embed/')) {
      // Already an embed URL
      return url;
    }
    
    return videoId ? `https://www.youtube.com/embed/${videoId}` : '';
  };

  if (!currentVideo) {
    return (
      <div className="h-full flex items-center justify-center rounded-lg" style={{ 
        backgroundColor: theme.cardBg,
        border: `1px solid ${theme.border}`
      }}>
        <p style={{ color: theme.text.secondary }}>Select a video to start learning</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col rounded-lg overflow-hidden" style={{ 
      backgroundColor: theme.cardBg,
      border: `1px solid ${theme.border}`
    }}>
      {/* Video Container with 16:9 Aspect Ratio */}
      <div className="relative w-full" style={{ paddingTop: '56.25%' }}> {/* 56.25% = 9/16 * 100 */}
        <div className="absolute top-0 left-0 w-full h-full">
          <iframe
            src={getEmbedUrl(currentVideo.url)}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
};

export default PermanentVideoPlayer; 