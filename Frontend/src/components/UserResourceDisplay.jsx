import React from 'react';
import { motion } from 'framer-motion';
import { FaYoutube, FaPlay, FaList, FaExternalLinkAlt, FaTimes, FaCheckCircle } from 'react-icons/fa';
import { useTheme } from '../context/ThemeContext';

/**
 * Component to display a user-provided resource
 */
const UserResourceDisplay = ({ resource, onRemove }) => {
  const { darkMode } = useTheme();
  
  // Define colors based on theme
  const colors = {
    primary: darkMode ? '#6366F1' : '#4F46E5', // Indigo - main brand color
    secondary: darkMode ? '#F43F5E' : '#DA2C38', // YouTube Red - accent color
    accent: darkMode ? '#A78BFA' : '#8B5CF6', // Purple - complementary accent
    
    // Background colors
    background: darkMode ? '#0F172A' : '#F9F9F9', // Dark blue-black / Light Gray
    cardBg: darkMode ? '#1E293B' : '#FFFFFF', // Darker background / White
    
    // Text colors
    text: darkMode ? '#F1F5F9' : '#111827', // Light Gray / Dark Gray
    textMuted: darkMode ? '#CBD5E1' : '#6B7280', // Light gray / Medium gray
    
    // UI elements
    border: darkMode ? '#475569' : '#E5E7EB', // Medium-dark gray / Light gray
    shadow: darkMode ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.1)', // Shadows
  };

  if (!resource) return null;
  
  const isPlaylist = resource.isPlaylist || (resource.videos && resource.videos.length > 1);
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 rounded-xl border shadow-sm"
      style={{ 
        background: `linear-gradient(135deg, ${colors.accent}10, ${colors.primary}10)`,
        borderColor: colors.accent
      }}
    >
      <div className="flex items-start">
        {/* Thumbnail */}
        <div className="relative w-28 h-20 flex-shrink-0 mr-4 overflow-hidden rounded-lg shadow-md">
          <img 
            src={isPlaylist 
              ? (resource.videos?.[0]?.thumbnail || 'https://via.placeholder.com/120x68?text=Playlist')
              : (resource.thumbnail || `https://img.youtube.com/vi/${resource.id}/mqdefault.jpg`)} 
            alt={resource.title}
            className="w-full h-full object-cover"
          />
          {isPlaylist && (
            <div className="absolute top-2 right-2 bg-black bg-opacity-80 text-white text-xs px-2 py-1 rounded-full flex items-center">
              <FaList className="mr-1" />
              {resource.videos?.length || resource.videoCount || 0}
            </div>
          )}
          <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200">
            <FaPlay className="text-white text-xl" />
          </div>
        </div>
        
        {/* Resource info */}
        <div className="flex-grow min-w-0">
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm line-clamp-2 mb-2 leading-tight" style={{ color: colors.text }}>
                {resource.title}
              </h4>
              <p className="text-xs mb-3 flex items-center" style={{ color: colors.textMuted }}>
                <FaYoutube style={{ color: colors.secondary }} className="mr-1" />
                {resource.channel}
              </p>
              <div className="flex items-center space-x-3">
                <span className="text-xs px-3 py-1 rounded-full font-medium flex items-center" style={{ 
                  backgroundColor: `${colors.accent}20`,
                  color: colors.accent
                }}>
                  <FaCheckCircle className="mr-1" />
                  Your Choice
                </span>
                <span className="text-xs flex items-center" style={{ color: colors.textMuted }}>
                  {isPlaylist ? (
                    <>
                      <FaList style={{ color: colors.primary }} className="mr-1" />
                      Playlist
                    </>
                  ) : (
                    <>
                      <FaPlay style={{ color: colors.secondary }} className="mr-1" />
                      {resource.duration_string || resource.duration || 'Unknown'}
                    </>
                  )}
                </span>
              </div>
            </div>
            
            {/* Remove button */}
            {onRemove && (
              <motion.button 
                onClick={() => onRemove(resource)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-2 rounded-full transition-colors duration-200 flex items-center justify-center"
                style={{ 
                  color: colors.secondary,
                  backgroundColor: `${colors.secondary}10`
                }}
                title="Remove resource"
              >
                <FaTimes className="h-4 w-4" />
              </motion.button>
            )}
          </div>
        </div>
      </div>
      
      {/* Preview link */}
      <div className="mt-4 pt-4 flex justify-between items-center" style={{ borderTop: `1px solid ${colors.accent}20` }}>
        <div className="text-xs" style={{ color: colors.textMuted }}>
          This resource will be used instead of AI recommendations
        </div>
        <a 
          href={resource.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-xs font-medium flex items-center transition-colors duration-200"
          style={{ color: colors.primary }}
        >
          <FaExternalLinkAlt className="mr-1" />
          View on YouTube
        </a>
      </div>
    </motion.div>
  );
};

export default UserResourceDisplay; 