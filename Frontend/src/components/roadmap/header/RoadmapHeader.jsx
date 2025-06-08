import React from 'react';
import { motion } from 'framer-motion';
import { FaFlag, FaMountain } from 'react-icons/fa';

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

const RoadmapHeader = ({ title, description }) => {
  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="max-w-7xl mx-auto px-4 pt-24 pb-16 relative"
    >
      {/* Header Section */}
      <motion.div variants={itemVariants} className="text-center mb-20">
        <div className="relative inline-block">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.3, 0.4, 0.3]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute -inset-4 bg-gradient-to-r from-indigo-200/20 via-purple-200/20 to-pink-200/20 blur-2xl rounded-full"
          />
          <motion.h1 
            className="relative text-6xl font-bold mb-6 font-poppins bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            {title}
          </motion.h1>
        </div>
        <motion.p 
          className="text-xl text-indigo-600/80 mb-12 font-mukta max-w-3xl mx-auto leading-relaxed"
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
            className="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-300 via-purple-300 to-pink-300 transform -translate-x-1/2"
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />
          
          {/* Starting Point */}
          <motion.div 
            className="absolute left-1/2 -translate-x-1/2 -top-4"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 flex items-center justify-center text-white shadow-lg">
              <FaFlag className="text-sm" />
            </div>
          </motion.div>

          {/* End Point */}
          <motion.div 
            className="absolute left-1/2 -translate-x-1/2 -bottom-4"
            initial={{ scale: 0, rotate: 180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 flex items-center justify-center text-white shadow-lg">
              <FaMountain className="text-sm" />
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default RoadmapHeader; 