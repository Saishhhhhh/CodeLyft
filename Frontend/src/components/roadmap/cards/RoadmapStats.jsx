import React from 'react';
import { motion } from 'framer-motion';
import { FaBookOpen, FaYoutube, FaCheck } from 'react-icons/fa';

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

const RoadmapStats = ({ regular, custom }) => {
  const total = regular.length + custom.length;
  const withResources = regular.filter(r => 
    r.topics?.some(t => t.hasGeneratedResources)
  ).length + custom.filter(r => 
    r.topics?.some(t => t.video)
  ).length;
  
  const completed = regular.filter(r => r.completionPercentage === 100).length;
  
  return (
    <motion.div 
      variants={fadeIn}
      className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
    >
      <div className="bg-white rounded-xl p-5 shadow-md flex items-center space-x-4">
        <div className="bg-blue-100 p-3 rounded-lg">
          <FaBookOpen className="text-blue-600 text-xl" />
        </div>
        <div>
          <p className="text-gray-500 text-sm">Total Roadmaps</p>
          <p className="text-2xl font-bold text-gray-800">{total}</p>
        </div>
      </div>
      
      <div className="bg-white rounded-xl p-5 shadow-md flex items-center space-x-4">
        <div className="bg-purple-100 p-3 rounded-lg">
          <FaYoutube className="text-purple-600 text-xl" />
        </div>
        <div>
          <p className="text-gray-500 text-sm">With Resources</p>
          <p className="text-2xl font-bold text-gray-800">{withResources}</p>
        </div>
      </div>
      
      <div className="bg-white rounded-xl p-5 shadow-md flex items-center space-x-4">
        <div className="bg-green-100 p-3 rounded-lg">
          <FaCheck className="text-green-600 text-xl" />
        </div>
        <div>
          <p className="text-gray-500 text-sm">Completed</p>
          <p className="text-2xl font-bold text-gray-800">{completed}</p>
        </div>
      </div>
    </motion.div>
  );
};

export default RoadmapStats; 