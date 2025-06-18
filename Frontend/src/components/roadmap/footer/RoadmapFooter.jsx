import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FaYoutube, FaPenSquare, FaUserPlus } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { useTheme } from '../../../context/ThemeContext';

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: [0.6, -0.05, 0.01, 0.99]
    }
  }
};

const RoadmapFooter = ({ 
  fromSaved = false, 
  isCustom = false, 
  onSave, 
  onAddVideos, 
  loadingVideos, 
  savedToDB, 
  savingToDB, 
  onStartJourney,
  hasResources,
  roadmap 
}) => {
  const navigate = useNavigate();
  const { darkMode } = useTheme();

  return (
    <motion.div 
      variants={itemVariants} 
      className="text-center"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-wrap justify-center gap-6">
        {/* Generate YouTube Resources button - show for all roadmap types */}
        {onAddVideos && (
          <motion.button
            whileHover={{ 
              scale: 1.05, 
              boxShadow: darkMode ? "0 0 30px rgba(239,68,68,0.2)" : "0 0 30px rgba(220,38,38,0.15)",
              transition: { duration: 0.2 }
            }}
            whileTap={{ scale: 0.95 }}
            onClick={onAddVideos}
            disabled={loadingVideos}
            className={`group relative px-8 py-4 rounded-xl font-medium ${
              darkMode 
                ? 'text-red-400 bg-gray-800 border border-red-800 hover:border-red-700' 
                : 'text-red-600 bg-white border border-red-200 hover:border-red-300'
            } transition-all duration-300 overflow-hidden flex items-center`}
          >
            <motion.div 
              className={`absolute inset-0 ${
                darkMode 
                  ? 'bg-gradient-to-r from-red-900/30 via-rose-900/30 to-orange-900/30' 
                  : 'bg-gradient-to-r from-red-50 via-rose-50 to-orange-50'
              } opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
              whileHover={{ scale: 1.1 }}
              transition={{ duration: 0.3 }}
            />
            <FaYoutube className="mr-2 relative" />
            <span className="relative">
              {loadingVideos ? 'Adding Resources...' : 'Add YouTube Resources'}
            </span>
          </motion.button>
        )}

        {/* View Journey button - show only if there are resources to view */}
        {hasResources && onStartJourney && (
          <motion.button
            whileHover={{ 
              scale: 1.05, 
              boxShadow: darkMode ? "0 0 30px rgba(59,130,246,0.2)" : "0 0 30px rgba(59,130,246,0.15)",
              transition: { duration: 0.2 }
            }}
            whileTap={{ scale: 0.95 }}
            onClick={onStartJourney}
            className={`group relative px-8 py-4 rounded-xl font-medium ${
              darkMode 
                ? 'text-blue-400 bg-gray-800 border border-blue-800 hover:border-blue-700' 
                : 'text-blue-600 bg-white border border-blue-200 hover:border-blue-300'
            } transition-all duration-300 overflow-hidden flex items-center`}
          >
            <motion.div 
              className={`absolute inset-0 ${
                darkMode 
                  ? 'bg-gradient-to-r from-blue-900/30 via-cyan-900/30 to-sky-900/30' 
                  : 'bg-gradient-to-r from-blue-50 via-cyan-50 to-sky-50'
              } opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
              whileHover={{ scale: 1.1 }}
              transition={{ duration: 0.3 }}
            />
            <FaPenSquare className="mr-2 relative" />
            <span className="relative">View Learning Journey</span>
          </motion.button>
        )}

        <motion.button
          whileHover={{ 
            scale: 1.05, 
            boxShadow: darkMode ? "0 0 30px rgba(99,102,241,0.2)" : "0 0 30px rgba(99,102,241,0.15)",
            transition: { duration: 0.2 }
          }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/')}
          className={`group relative px-8 py-4 rounded-xl font-medium ${
            darkMode 
              ? 'text-indigo-400 bg-gray-800 border border-indigo-800 hover:border-indigo-700' 
              : 'text-indigo-600 bg-white border border-indigo-200 hover:border-indigo-300'
          } transition-all duration-300 overflow-hidden`}
        >
          <motion.div 
            className={`absolute inset-0 ${
              darkMode 
                ? 'bg-gradient-to-r from-indigo-900/30 via-purple-900/30 to-pink-900/30' 
                : 'bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50'
            } opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.3 }}
          />
          <span className="relative">New Roadmap</span>
        </motion.button>
      </div>
      
      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-6`}>
        Click "Add YouTube Resources" to find the best YouTube videos/playlists for each topic.
        <br />
        You can also add your own YouTube videos/playlists for each topic.
      </p>
    </motion.div>
  );
};

export default RoadmapFooter; 