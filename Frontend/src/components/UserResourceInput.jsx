import React, { useState } from 'react';
import { FaYoutube, FaPlay, FaList, FaInfoCircle, FaCheckCircle, FaArrowLeft, FaTimes } from 'react-icons/fa';
import { useTheme } from '../context/ThemeContext';
import { processUserResource } from '../services/userResourceService';
import { parseYouTubeUrl } from '../utils/youtubeValidator';

/**
 * Component for adding user-provided YouTube resources to roadmaps
 */
const UserResourceInput = ({ onResourceAdded, onClose, onSkip, roadmap, topicTitle, currentTopicIndex, totalTopics }) => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [urlType, setUrlType] = useState(null);
  const { darkMode } = useTheme();
  
  // Define colors based on theme
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
  
  // Get the topic name for display
  const topicName = topicTitle || "this topic";
  
  // Handle URL input change
  const handleUrlChange = (e) => {
    const inputUrl = e.target.value;
    setUrl(inputUrl);
    setError('');
    
    // Check URL type as user types
    if (inputUrl) {
      const parsedUrl = parseYouTubeUrl(inputUrl);
      setUrlType(parsedUrl.isValid ? parsedUrl.type : null);
    } else {
      setUrlType(null);
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!url.trim()) {
      setError('Please enter a YouTube URL');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Process the user-provided URL
      const resource = await processUserResource(url);
      
      // Call the callback with the processed resource
      onResourceAdded(resource);
      
      // Reset form
      setUrl('');
      setUrlType(null);
      
    } catch (error) {
      console.error('Error processing resource:', error);
      setError(error.message || 'Failed to process YouTube URL');
    } finally {
      setLoading(false);
    }
  };

  // Handle skip
  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    } else {
      onClose();
    }
  };
  
  return (
    <div className="rounded-lg border shadow-sm" style={{ 
      backgroundColor: colors.cardBg,
      borderColor: colors.border
    }}>
      {/* Header */}
      <div className="p-6 rounded-t-lg" style={{ backgroundColor: colors.primary }}>
        <div className="text-center">
          <h2 className="text-xl font-bold text-white">
            Add Your YouTube Resource
          </h2>
          <p className="text-white/80 text-sm mt-1">
            Paste a YouTube video or playlist URL for learning
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Description */}
        <div className="space-y-4">
          <p className="text-sm" style={{ color: colors.textMuted }}>
            Paste a YouTube video or playlist URL that you'd like to use for learning this topic. 
            We'll use your selection instead of our Smart recommendations for this topic.
          </p>
        </div>

        {/* What you can add */}
        <div className="p-4 rounded-lg" style={{ backgroundColor: `${colors.primary}10` }}>
          <div className="flex items-start space-x-3">
            <FaInfoCircle style={{ color: colors.primary }} className="mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium mb-2" style={{ color: colors.text }}>What you can add:</p>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <FaPlay style={{ color: colors.primary }} className="text-sm" />
                  <span className="text-sm" style={{ color: colors.textMuted }}>Individual YouTube videos</span>
                </div>
                <div className="flex items-center space-x-2">
                  <FaList style={{ color: colors.primary }} className="text-sm" />
                  <span className="text-sm" style={{ color: colors.textMuted }}>YouTube playlists</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Topic name and progress */}
          <div className="text-center">
            <h3 className="text-lg font-semibold" style={{ color: colors.text }}>
              {topicName}
            </h3>
            <p className="text-sm" style={{ color: colors.textMuted }}>
              Topic {currentTopicIndex + 1} of {totalTopics}
            </p>
          </div>
          
        <div>
            <label className="block text-sm font-medium mb-2" style={{ color: colors.text }}>
              YouTube URL
            </label>
            <div className="relative">
              <div className="flex items-center border-2 rounded-lg overflow-hidden transition-all duration-200" style={{ 
                borderColor: colors.border,
                backgroundColor: colors.cardBg
              }}>
            <input
              type="url"
              value={url}
              onChange={handleUrlChange}
                  placeholder="https://www.youtube.com/watch?v=... or https://www.youtube.com/playlist?list=..."
                  className="flex-grow px-4 py-3 outline-none text-sm"
                  style={{ backgroundColor: 'transparent', color: colors.text }}
              disabled={loading}
            />
            {urlType && (
                  <div className="px-3 py-1 mr-2 text-xs font-medium rounded-full flex items-center"
                    style={{
                      backgroundColor: urlType === 'video' ? `${colors.secondary}20` : `${colors.primary}20`,
                      color: urlType === 'video' ? colors.secondary : colors.primary
                    }}
                  >
                    {urlType === 'video' ? (
                      <>
                        <FaPlay className="mr-1" />
                        Video
                      </>
                    ) : (
                      <>
                        <FaList className="mr-1" />
                        Playlist
                      </>
                    )}
                  </div>
                )}
              </div>
              {error && (
                <p className="text-xs mt-2 flex items-center" style={{ color: colors.secondary }}>
                  <FaInfoCircle className="mr-1" />
                  {error}
                </p>
            )}
            </div>
          </div>
        
          <div className="flex justify-between">
            <button
              type="button"
              onClick={handleSkip}
              className="px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 hover:scale-105 hover:shadow-md"
              style={{
                backgroundColor: colors.cardBg,
                border: `2px solid ${colors.secondary}`,
                color: colors.secondary
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = `${colors.secondary}10`;
                e.target.style.transform = 'scale(1.05)';
                e.target.style.boxShadow = `0 4px 8px ${colors.shadow}`;
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = colors.cardBg;
                e.target.style.transform = 'scale(1)';
                e.target.style.boxShadow = 'none';
              }}
            >
              <FaTimes className="text-sm" />
              <span>Skip this topic</span>
            </button>
            
          <button
            type="submit"
            disabled={loading || !url.trim()}
              className="px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 hover:shadow-lg"
              style={{
                backgroundColor: loading || !url.trim() ? colors.border : colors.primary,
                color: loading || !url.trim() ? colors.textMuted : '#FFFFFF',
                boxShadow: loading || !url.trim() ? 'none' : `0 2px 4px ${colors.shadow}`
              }}
              onMouseEnter={(e) => {
                if (!loading && url.trim()) {
                  e.target.style.transform = 'scale(1.05)';
                  e.target.style.boxShadow = `0 6px 12px ${colors.shadow}`;
                }
              }}
              onMouseLeave={(e) => {
                if (!loading && url.trim()) {
                  e.target.style.transform = 'scale(1)';
                  e.target.style.boxShadow = `0 2px 4px ${colors.shadow}`;
                }
              }}
          >
            {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Processing...</span>
                </>
            ) : (
                <>
                  <FaCheckCircle className="text-sm" />
                  <span>Add Resource</span>
                </>
            )}
          </button>
        </div>
      </form>

        {/* Tip */}
        <div className="p-3 rounded-lg border" style={{ 
          backgroundColor: `${colors.secondary}05`,
          borderColor: `${colors.secondary}30`
        }}>
          <div className="flex items-start space-x-2">
            <FaInfoCircle style={{ color: colors.secondary }} className="mt-0.5 flex-shrink-0 text-xs" />
            <div>
              <p className="text-xs font-medium mb-1" style={{ color: colors.text }}>
                Tip
              </p>
              <p className="text-xs" style={{ color: colors.textMuted }}>
                You can copy URLs directly from YouTube. We support both video URLs (youtube.com/watch?v=...) and playlist URLs (youtube.com/playlist?list=...). If you don't have a specific resource in mind, you can skip this topic and we'll find the best content for you.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserResourceInput; 