import React from 'react';
import { FaSearch } from 'react-icons/fa';
import { motion } from 'framer-motion';

const NoResultsState = ({ onClearFilters }) => {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.3 }
    }
  };

  return (
    <motion.div
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
        <FaSearch className="text-2xl text-gray-400 dark:text-gray-500" />
      </div>
      
      <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
        No matching roadmaps found
      </h3>
      
      <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
        We couldn't find any roadmaps matching your current filters. Try adjusting your search criteria or clear all filters.
      </p>
      
      <button
        onClick={onClearFilters}
        className="inline-flex items-center justify-center px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
      >
        Clear All Filters
      </button>
    </motion.div>
  );
};

export default NoResultsState; 