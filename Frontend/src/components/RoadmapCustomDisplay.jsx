import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaEdit } from 'react-icons/fa';

/**
 * Component for additional UI elements when displaying a custom roadmap
 * This allows us to extend the RoadmapResultPage without modifying it directly
 */
const RoadmapCustomDisplay = ({ roadmap, roadmapId }) => {
  const navigate = useNavigate();
  
  // Function to handle editing the custom roadmap
  const handleEditCustomRoadmap = () => {
    navigate('/custom-roadmap', { state: { roadmap } });
  };
  
  if (!roadmap?.isCustom) {
    return null;
  }
  
  return (
    <motion.div 
      className="mb-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex justify-end">
        <button
          onClick={handleEditCustomRoadmap}
          className="flex items-center bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
        >
          <FaEdit className="mr-2" /> Edit Roadmap
        </button>
      </div>
    </motion.div>
  );
};

export default RoadmapCustomDisplay; 