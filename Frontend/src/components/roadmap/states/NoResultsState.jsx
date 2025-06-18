import React from 'react';
import { FaSearch } from 'react-icons/fa';
import { motion } from 'framer-motion';

const NoResultsState = ({ onClearFilters, theme }) => {
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
      style={{
        background: theme.cardBg,
        borderColor: theme.border,
        color: theme.text
      }}
      className="rounded-xl shadow-sm border p-8 text-center"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div 
        style={{ background: theme.background }}
        className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4"
      >
        <FaSearch style={{ color: theme.textMuted }} className="text-2xl" />
      </div>
      
      <h3 
        style={{ color: theme.text }}
        className="text-xl font-semibold mb-2"
      >
        No matching roadmaps found
      </h3>
      
      <p 
        style={{ color: theme.textMuted }}
        className="mb-6 max-w-md mx-auto"
      >
        We couldn't find any roadmaps matching your current filters. Try adjusting your search criteria or clear all filters.
      </p>
      
      <button
        onClick={onClearFilters}
        style={{ 
          background: theme.background,
          color: theme.text,
          borderColor: theme.border
        }}
        className="inline-flex items-center justify-center px-4 py-2 rounded-lg border hover:opacity-80 transition-opacity"
      >
        Clear All Filters
      </button>
    </motion.div>
  );
};

export default NoResultsState; 