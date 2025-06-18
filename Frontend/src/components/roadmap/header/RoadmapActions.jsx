import React from 'react';
import { Link } from 'react-router-dom';
import { FaPlus, FaPencilAlt } from 'react-icons/fa';
import { motion } from 'framer-motion';

const RoadmapActions = ({ onCreateCustom, theme }) => {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.4,
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  return (
    <motion.div 
      className="rounded-xl border shadow-lg p-6 mb-6"
      style={{
        background: theme.cardBg,
        borderColor: theme.border
      }}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <h2 className="text-lg font-semibold mb-4" style={{ color: theme.text }}>
        Create New Roadmap
      </h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Create New Roadmap */}
        <motion.div variants={itemVariants}>
          <Link 
            to="/"
            className="flex flex-col items-center p-4 rounded-xl transition-all border hover:shadow-md group"
            style={{
              background: theme.cardBg,
              borderColor: theme.border
            }}
          >
            <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center mb-3">
              <FaPlus className="text-white text-xl" />
            </div>
            <h3 className="font-medium" style={{ color: theme.text }}>
              Create New
            </h3>
            <p className="text-xs mt-1 text-center" style={{ color: theme.textMuted }}>
              Start with a standard roadmap
            </p>
          </Link>
        </motion.div>
        
        {/* Create Custom Roadmap */}
        <motion.div variants={itemVariants}>
          <Link 
            to="/custom-roadmap"
            className="flex flex-col items-center p-4 rounded-xl transition-all border hover:shadow-md group"
            style={{
              background: theme.cardBg,
              borderColor: theme.border
            }}
          >
            <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mb-3">
              <FaPencilAlt className="text-white text-xl" />
            </div>
            <h3 className="font-medium" style={{ color: theme.text }}>
              Create Custom
            </h3>
            <p className="text-xs mt-1 text-center" style={{ color: theme.textMuted }}>
              Build your own learning path
            </p>
          </Link>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default RoadmapActions; 