import React from 'react';
import { Link } from 'react-router-dom';
import { FaRoad, FaPlus, FaFileImport } from 'react-icons/fa';
import { motion } from 'framer-motion';

const EmptyState = ({ onImport }) => {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
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
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } }
  };

  return (
    <motion.div
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div 
        className="mx-auto w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-6"
        variants={itemVariants}
      >
        <FaRoad className="text-3xl text-indigo-600 dark:text-indigo-400" />
      </motion.div>
      
      <motion.h2 
        className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3"
        variants={itemVariants}
      >
        No roadmaps yet
      </motion.h2>
      
      <motion.p 
        className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto"
        variants={itemVariants}
      >
        Start your learning journey by creating a new roadmap or importing an existing one.
      </motion.p>
      
      <motion.div 
        className="flex flex-col sm:flex-row gap-4 justify-center"
        variants={itemVariants}
      >
        <Link 
          to="/"
          className="inline-flex items-center justify-center px-5 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <FaPlus className="mr-2" /> Create New Roadmap
        </Link>
        
        <button
          onClick={onImport}
          className="inline-flex items-center justify-center px-5 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
        >
          <FaFileImport className="mr-2" /> Import Roadmap
        </button>
      </motion.div>
    </motion.div>
  );
};

export default EmptyState; 