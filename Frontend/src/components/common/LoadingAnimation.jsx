import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import TechLoadingAnimation from '../roadmap/loading/TechLoadingAnimation';

// Main loading animation component with different presets
const LoadingAnimation = ({ 
  type = 'fullscreen', // fullscreen, inline, overlay, minimal
  variant = 'roadmap', // default, resources, roadmap, code
  message,
  size = 'medium', // small, medium, large
  showBackground = true,
  customClass = ''
}) => {
  const { darkMode } = useTheme();
  
  // Define colors based on theme
  const colors = {
    primary: '#4F46E5', // Indigo
    secondary: '#DA2C38', // YouTube Red
    accent: '#8B5CF6', // Purple
    
    background: darkMode ? '#111827' : '#F9F9F9',
    cardBg: darkMode ? '#1E293B' : '#FFFFFF',
    text: darkMode ? '#F9F9F9' : '#111827',
    textMuted: darkMode ? '#94A3B8' : '#6B7280',
    border: darkMode ? '#334155' : '#E5E7EB',
  };

  // Default message based on variant
  const defaultMessage = getDefaultMessage(variant);
  const displayMessage = message || defaultMessage;

  // Get size classes
  const sizeClasses = getSizeClasses(size, type);

  // Render different types of loading animations
  switch (type) {
    case 'fullscreen':
      return (
        <div 
          className={`fixed inset-0 flex flex-col items-center justify-center z-50 ${customClass}`}
          style={{ 
            background: showBackground ? 
              darkMode ? 
                'linear-gradient(to bottom, #111827, #0F172A)' : 
                'linear-gradient(to bottom, #FFF7ED, #FFFFFF)' 
              : 'transparent'
          }}
        >
          {/* Animated background elements */}
          {showBackground && (
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute inset-0 bg-[url('/path-pattern.svg')] opacity-5"></div>
              <motion.div 
                className="absolute inset-0"
                style={{
                  background: `radial-gradient(circle at 50% 50%, ${darkMode ? 'rgba(79, 70, 229, 0.08)' : 'rgba(79, 70, 229, 0.05)'}, transparent 50%)`
                }}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.2, 0.3, 0.2]
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </div>
          )}
          
          <div className={sizeClasses}>
            <TechLoadingAnimation variant={variant} message={displayMessage} />
          </div>
        </div>
      );
      
    case 'overlay':
      return (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className={`absolute inset-0 flex items-center justify-center bg-opacity-75 ${customClass}`}
          style={{ 
            backgroundColor: darkMode ? 'rgba(15, 23, 42, 0.75)' : 'rgba(255, 255, 255, 0.75)',
            backdropFilter: 'blur(4px)',
            zIndex: 40
          }}
        >
          <div className={sizeClasses}>
            <TechLoadingAnimation variant={variant} message={displayMessage} />
          </div>
        </motion.div>
      );
      
    case 'inline':
      return (
        <div className={`flex flex-col items-center justify-center p-6 ${customClass}`}>
          <div className={sizeClasses}>
            <TechLoadingAnimation variant={variant} message={displayMessage} />
          </div>
        </div>
      );
      
    case 'minimal':
      return (
        <div className={`flex items-center justify-center py-2 space-x-2 ${customClass}`}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "linear"
            }}
            className="w-5 h-5"
          >
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path 
                d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2Z" 
                stroke={colors.primary}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray="60 60"
                strokeDashoffset="60"
                style={{ animation: "circular-dash 1.5s ease-in-out infinite" }}
              />
            </svg>
          </motion.div>
          
          {displayMessage && (
            <motion.span 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm font-medium"
              style={{ color: colors.text }}
            >
              {displayMessage}
            </motion.span>
          )}
          
          <style jsx="true">{`
            @keyframes circular-dash {
              0% { stroke-dashoffset: 60; }
              50% { stroke-dashoffset: 0; }
              100% { stroke-dashoffset: -60; }
            }
          `}</style>
        </div>
      );
      
    default:
      return null;
  }
};

// Helper function to get the default message based on variant
function getDefaultMessage(variant) {
  switch (variant) {
    case 'resources':
      return 'Fetching learning resources...';
    case 'roadmap':
      return 'Building your tech roadmap...';
    case 'code':
      return 'Generating code examples...';
    default:
      return 'Loading...';
  }
}

// Helper function to get size classes
function getSizeClasses(size, type) {
  if (type === 'minimal') return '';
  
  switch (size) {
    case 'small':
      return 'w-32 h-32';
    case 'large':
      return 'w-80 h-80';
    case 'medium':
    default:
      return 'w-48 h-48 sm:w-64 sm:h-64';
  }
}

export default LoadingAnimation; 