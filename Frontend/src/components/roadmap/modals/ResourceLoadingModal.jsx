import React, { useState, useEffect } from 'react';
import { FaYoutube, FaPlay, FaList, FaClock, FaCheckCircle, FaSpinner, FaInfoCircle } from 'react-icons/fa';
import { useTheme } from '../../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';

const ResourceLoadingModal = ({ 
  isOpen, 
  onClose,
  currentTopic = '', 
  progressPercent = 0, 
  foundResources = [],
  estimatedTimeRemaining = '',
  currentPlaylist = '',
  currentVideo = '',
  totalTopics = 0,
  processedTopics = 0
}) => {
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const [playlistTitleIndex, setPlaylistTitleIndex] = useState(0);
  const [videoTitleIndex, setVideoTitleIndex] = useState(0);
  
  // Define colors based on theme - matching other components
  const colors = {
    primary: darkMode ? '#4F46E5' : '#4F46E5', // Indigo - main brand color
    secondary: darkMode ? '#DA2C38' : '#DA2C38', // YouTube Red - accent color
    accent: darkMode ? '#8B5CF6' : '#8B5CF6', // Purple - complementary accent
    
    // Background colors
    background: darkMode ? '#111827' : '#F9F9F9', // Dark Gray / Light Gray
    cardBg: darkMode ? '#1E293B' : '#FFFFFF', // Darker background / White
    
    // Text colors
    text: darkMode ? '#F9F9F9' : '#111827', // Light Gray / Dark Gray
    textMuted: darkMode ? '#94A3B8' : '#6B7280', // Light gray / Medium gray
    
    // UI elements
    border: darkMode ? '#334155' : '#E5E7EB', // Medium-dark gray / Light gray
    shadow: darkMode ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.1)', // Shadows
  };

  // Animate playlist titles
  useEffect(() => {
    if (currentPlaylist && currentPlaylist.includes('Evaluating:')) {
      const interval = setInterval(() => {
        setPlaylistTitleIndex(prev => (prev + 1) % 6); // Cycle through 6 titles
      }, 2000); // Change every 2 seconds
      
      return () => clearInterval(interval);
    }
  }, [currentPlaylist]);

  // Animate video titles when evaluating videos
  useEffect(() => {
    if (currentVideo && currentVideo.includes('Evaluating:')) {
      const interval = setInterval(() => {
        setVideoTitleIndex(prev => (prev + 1) % 5); // Cycle through 5 video titles
      }, 1500); // Change every 1.5 seconds
      
      return () => clearInterval(interval);
    }
  }, [currentVideo]);

  // Get animated playlist title
  const getAnimatedPlaylistTitle = () => {
    if (!currentPlaylist || !currentPlaylist.includes('Evaluating:')) {
      return currentPlaylist;
    }
    
    const baseTitle = currentPlaylist.replace('Evaluating: ', '');
    const technology = baseTitle.split(' ')[0]; // Extract technology name
    
    const playlistTitles = [
      `Complete ${technology} Course 2025`,
      `${technology} Full Course for Beginners`,
      `${technology} Tutorial for Beginners`,
      `${technology} Masterclass - From Beginner to Advanced`,
      `${technology} Complete Tutorial`,
      `${technology} Fundamentals for Beginners`
    ];
    
    return `Evaluating: ${playlistTitles[playlistTitleIndex]}`;
  };

  // Get animated video title
  const getAnimatedVideoTitle = () => {
    if (!currentVideo || !currentVideo.includes('Evaluating:')) {
      return currentVideo;
    }
    
    const baseTitle = currentVideo.replace('Evaluating: ', '');
    const technology = baseTitle.split(' ')[0]; // Extract technology name
    
    const videoTitles = [
      `${technology} Tutorial for Beginners`,
      `Learn ${technology} Step by Step`,
      `${technology} Complete Guide`,
      `${technology} Crash Course`,
      `${technology} Full Tutorial`
    ];
    
    return `Evaluating: ${videoTitles[videoTitleIndex]}`;
  };

  // Format duration properly
  const formatDuration = (duration) => {
    if (!duration) return 'Unknown';
    
    // If it's already formatted (like "5:30"), return as is
    if (typeof duration === 'string' && duration.includes(':')) {
      return duration;
    }
    
    // If it's a number (seconds), convert to MM:SS format
    if (typeof duration === 'number' || !isNaN(duration)) {
      const seconds = parseInt(duration);
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    return duration;
  };

  if (!isOpen) return null;

  // Full modal state
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: `${colors.shadow}` }}>
      <div className="rounded-lg shadow-xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col" style={{ 
        backgroundColor: colors.cardBg,
        boxShadow: `0 20px 25px -5px ${colors.shadow}, 0 10px 10px -5px ${colors.shadow}`
      }}>
        {/* Header */}
        <div className="p-6 rounded-t-lg flex-shrink-0" style={{ backgroundColor: colors.primary }}>
          <div className="flex items-center space-x-3 min-w-0">
            <FaYoutube className="text-white text-2xl" />
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-white truncate">AI Resource Discovery</h2>
              <p className="text-white/80 text-sm truncate">Finding the best videos for your roadmap</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Progress Section */}
          <div className="space-y-4">
            {/* Progress Bar and Topic Count */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium" style={{ color: colors.text }}>
                  {processedTopics + 1} of {totalTopics} topics
                </span>
              </div>
              <span className="text-xs font-medium" style={{ color: colors.textMuted }}>
                {progressPercent}%
              </span>
            </div>
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-4">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%`, backgroundColor: colors.accent }}
              />
            </div>

            {/* Current Activity - Merged Topic and Playlist/Video Processing */}
            {(currentTopic || currentPlaylist || currentVideo) && (
              <div className="p-4 rounded-lg" style={{ backgroundColor: `${colors.primary}10` }}>
                <div className="flex items-center space-x-3 mb-3">
                  <FaSpinner className="animate-spin text-base" style={{ color: colors.primary }} />
                  <span className="text-base font-medium" style={{ color: colors.text }}>
                    {currentPlaylist ? 'Evaluating Playlists' : currentVideo ? 'Evaluating Videos' : 'Processing Topic'}
                  </span>
                </div>
                
                {/* Topic being processed */}
                {currentTopic && (
                  <p className="text-base mb-2" style={{ color: colors.textMuted }}>
                    <strong>Topic:</strong> {currentTopic.replace(/([^:]+):\s*\1/, '$1')}
                  </p>
                )}
                
                {/* Playlist or Video being evaluated */}
                {(currentPlaylist || currentVideo) && (
                  <p className="text-base transition-all duration-500" style={{ color: colors.textMuted }}>
                    <strong>Currently:</strong> {currentPlaylist ? getAnimatedPlaylistTitle() : getAnimatedVideoTitle()}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Found Resources */}
          {foundResources && Array.isArray(foundResources) && foundResources.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <FaCheckCircle className="text-base" style={{ color: colors.accent }} />
                <h3 className="font-medium text-base" style={{ color: colors.text }}>
                  Resources Found ({foundResources.length})
                </h3>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-3 pr-2">
                {foundResources.map((resource, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 hover:scale-[1.02]"
                    style={{ 
                      backgroundColor: `${colors.primary}05`,
                      border: `1px solid ${colors.border}`
                    }}
                  >
                    <div className="w-12 h-8 rounded overflow-hidden flex-shrink-0 shadow-sm">
                      {resource.thumbnail && (
                        <img 
                          src={resource.thumbnail} 
                          alt={resource.title} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      )}
                      <div className="w-full h-full flex items-center justify-center hidden" style={{ backgroundColor: colors.border }}>
                        <FaYoutube className="text-xs" style={{ color: colors.textMuted }} />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-medium line-clamp-2" style={{ color: colors.text }}>
                        {resource.title}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium" style={{
                          backgroundColor: resource.type === 'playlist' ? `${colors.accent}20` : `${colors.secondary}20`,
                          color: resource.type === 'playlist' ? colors.accent : colors.secondary
                        }}>
                          {resource.type === 'playlist' ? (
                            <>
                              <FaList className="mr-1 text-xs" />
                              Playlist
                            </>
                          ) : (
                            <>
                              <FaPlay className="mr-1 text-xs" />
                              Video
                            </>
                          )}
                        </span>
                        {resource.videoCount && (
                          <span className="text-sm" style={{ color: colors.textMuted }}>
                            {resource.videoCount} videos
                          </span>
                        )}
                        {resource.duration && (
                          <span className="text-sm" style={{ color: colors.textMuted }}>
                            {formatDuration(resource.duration)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Info Section - Made Smaller */}
          <div className="p-3 rounded-lg border" style={{ 
            backgroundColor: `${colors.secondary}05`,
            borderColor: `${colors.secondary}30`
          }}>
            <div className="flex items-start space-x-2">
              <FaInfoCircle className="text-sm mt-0.5 flex-shrink-0" style={{ color: colors.secondary }} />
              <div className="flex-1">
                <p className="text-sm" style={{ color: colors.textMuted }}>
                  Searching through thousands of YouTube videos and playlists to find the best resources for your roadmap.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 flex justify-center items-center flex-shrink-0 border-t" style={{ borderColor: colors.border }}>
          <div className="text-base" style={{ color: colors.textMuted }}>
            Please wait while we find the best resources for your roadmap
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourceLoadingModal; 
