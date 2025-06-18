import React from 'react';
import { motion } from 'framer-motion';
import { FaRoad, FaPencilAlt, FaYoutube } from 'react-icons/fa';

const RoadmapStats = ({ 
  regularCount = 0,
  customCount = 0,
  regularRoadmaps = [],
  customRoadmaps = [],
  darkMode 
}) => {
  // Calculate total roadmaps and roadmaps with resources
  const totalRoadmaps = regularCount + customCount;
  
  const roadmapsWithResources = regularRoadmaps.filter(roadmap => 
    roadmap.topics?.some(topic => topic.hasGeneratedResources)
  ).length + customRoadmaps.filter(roadmap => 
    roadmap.topics?.some(topic => topic.video)
  ).length;

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="mb-8"
    >
      <h2 className={`text-xl font-semibold mb-4`} style={{ color: theme.text }}>
        Your Learning Progress
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {/* Total Roadmaps */}
        <motion.div 
          className="rounded-xl p-4 border"
          style={{
            background: theme.cardBg,
            borderColor: theme.border
          }}
          variants={itemVariants}
        >
          <div className="flex items-center mb-2">
            <FaRoad className="text-indigo-500 mr-2" />
            <span className="text-sm font-medium" style={{ color: theme.textMuted }}>
              Total Roadmaps
            </span>
          </div>
          <p className="text-2xl font-bold text-indigo-500">{totalRoadmaps}</p>
        </motion.div>

        {/* Custom Roadmaps */}
        <motion.div 
          className="rounded-xl p-4 border"
          style={{
            background: theme.cardBg,
            borderColor: theme.border
          }}
          variants={itemVariants}
        >
          <div className="flex items-center mb-2">
            <FaPencilAlt className="text-violet-500 mr-2" />
            <span className="text-sm font-medium" style={{ color: theme.textMuted }}>
              Custom Roadmaps
            </span>
          </div>
          <p className="text-2xl font-bold text-violet-500">{customCount}</p>
        </motion.div>

        {/* With Resources */}
        <motion.div 
          className="rounded-xl p-4 border"
          style={{
            background: theme.cardBg,
            borderColor: theme.border
          }}
          variants={itemVariants}
        >
          <div className="flex items-center mb-2">
            <FaYoutube className="text-green-500 mr-2" />
            <span className="text-sm font-medium" style={{ color: theme.textMuted }}>
              With Resources
            </span>
          </div>
          <p className="text-2xl font-bold text-green-500">{resourceCount}</p>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default RoadmapStats; 