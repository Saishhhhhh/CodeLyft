import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FaFileExport, FaYoutube } from 'react-icons/fa';
import { downloadRoadmap } from '../../../services/roadmapService';
import { toast } from 'react-hot-toast';

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

const RoadmapFooter = ({ fromSaved = false, onSave, onAddVideos, loadingVideos, savedToDB, savingToDB, onExport, roadmap }) => {
  const navigate = useNavigate();

  const handleExport = () => {
    if (onExport) {
      onExport();
    } else if (roadmap) {
      try {
        const result = downloadRoadmap(roadmap);
        if (result.success) {
          toast.success('Roadmap exported successfully');
        } else {
          toast.error('Failed to export roadmap');
        }
      } catch (error) {
        console.error('Error exporting roadmap:', error);
        toast.error('Failed to export roadmap');
      }
    }
  };

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
        {/* Generate YouTube Resources button - show whenever onAddVideos is provided */}
        {onAddVideos && (
          <motion.button
            whileHover={{ 
              scale: 1.05, 
              boxShadow: "0 0 30px rgba(220,38,38,0.15)",
              transition: { duration: 0.2 }
            }}
            whileTap={{ scale: 0.95 }}
            onClick={onAddVideos}
            disabled={loadingVideos}
            className="group relative px-8 py-4 rounded-xl font-medium text-red-600 bg-white border border-red-200 hover:border-red-300 transition-all duration-300 overflow-hidden flex items-center"
          >
            <motion.div 
              className="absolute inset-0 bg-gradient-to-r from-red-50 via-rose-50 to-orange-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              whileHover={{ scale: 1.1 }}
              transition={{ duration: 0.3 }}
            />
            <FaYoutube className="mr-2 relative" />
            <span className="relative">
              {loadingVideos ? 'Generating Resources...' : 'Start YouTube Journey'}
            </span>
          </motion.button>
        )}

        <motion.button
          whileHover={{ 
            scale: 1.05, 
            boxShadow: "0 0 30px rgba(99,102,241,0.15)",
            transition: { duration: 0.2 }
          }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/')}
          className="group relative px-8 py-4 rounded-xl font-medium text-indigo-600 bg-white border border-indigo-200 hover:border-indigo-300 transition-all duration-300 overflow-hidden"
        >
          <motion.div 
            className="absolute inset-0 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.3 }}
          />
          <span className="relative">Start New Journey</span>
        </motion.button>

        <motion.button
          whileHover={{ 
            scale: 1.05, 
            boxShadow: "0 0 30px rgba(34,197,94,0.15)",
            transition: { duration: 0.2 }
          }}
          whileTap={{ scale: 0.95 }}
          onClick={handleExport}
          className="group relative px-8 py-4 rounded-xl font-medium text-green-600 bg-white border border-green-200 hover:border-green-300 transition-all duration-300 overflow-hidden flex items-center"
        >
          <motion.div 
            className="absolute inset-0 bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.3 }}
          />
          <FaFileExport className="mr-2 relative" />
          <span className="relative">Export Roadmap</span>
        </motion.button>
      </div>
    </motion.div>
  );
};

export default RoadmapFooter; 