import React from 'react';
import { motion } from 'framer-motion';
import { FaFlag, FaMountain, FaEdit } from 'react-icons/fa';
import { useTheme } from '../../../context/ThemeContext';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { y: 30, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.6,
      ease: [0.6, -0.05, 0.01, 0.99]
    }
  }
};

/**
 * Enhanced RoadmapHeader component with support for save notifications
 */
const RoadmapHeader = ({ 
  title, 
  description, 
  hasResources, 
  isCustom = false,
  editMode,
  setEditMode,
  savedToDB = false,
  savingToDB = false,
  fromSaved = false
}) => {
  const { darkMode } = useTheme();
  
  // Define colors based on theme
  const colors = {
    primary: darkMode ? '#4F46E5' : '#4F46E5', // Indigo - main brand color
    secondary: darkMode ? '#DA2C38' : '#DA2C38', // YouTube Red - accent color
    accent: darkMode ? '#8B5CF6' : '#8B5CF6', // Purple - complementary accent
  };
  
  return (
    <>
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="max-w-7xl mx-auto px-4 pt-16 relative"
      >
        {/* Custom Roadmap indicator now integrated into the title display */}

        {/* Header Section */}
        <motion.div variants={itemVariants} className="text-center mb-10">
          <div className="relative inline-block">
            <motion.h1 
              className="relative text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-3 font-poppins text-transparent bg-clip-text leading-normal py-2 px-2"
              style={{
                backgroundImage: `linear-gradient(to right, ${colors.primary}, ${colors.accent})`,
                paddingBottom: '0.1em' /* Extra padding to prevent descenders from being cut off */
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              {title}
            </motion.h1>
          </div>
          <motion.p 
            className="text-base sm:text-lg md:text-xl mb-8 md:mb-12 font-mukta max-w-3xl mx-auto leading-relaxed px-2"
            style={{ color: darkMode ? '#94A3B8' : '#6B7280' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            {description}
          </motion.p>

          {/* Journey Path Visualization */}
          <motion.div 
            className="relative w-full max-w-4xl mx-auto mb-20"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <motion.div 
              className="absolute left-1/2 top-0 bottom-0 w-1 transform -translate-x-1/2"
              style={{
                background: `linear-gradient(to bottom, ${colors.primary}, ${colors.accent})`,
              }}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
            />
            
            {/* Starting Point */}
        
          </motion.div>
        </motion.div>
      </motion.div>
      
      {/* Automatic save notification */}
      {(savedToDB || savingToDB) && (
        <div className="px-6 mb-8 flex justify-center">
          <div className="w-full max-w-2xl">
            <div className={`flex items-center justify-center ${
              darkMode 
                ? (savingToDB ? 'text-blue-300 bg-blue-900/30 border-blue-800' : 'text-green-300 bg-green-900/30 border-green-800')
                : (savingToDB ? 'text-blue-600 bg-blue-50 border-blue-200' : 'text-green-600 bg-green-50 border-green-200')
            } font-medium p-3 rounded-lg shadow-sm border`}>
              {savingToDB ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Automatically saving your roadmap...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Roadmap saved to your account
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RoadmapHeader; 