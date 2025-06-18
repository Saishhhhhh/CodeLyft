import React from 'react';
import { motion } from 'framer-motion';

const LoadingState = () => {
  // Animation variants for skeleton loading
  const pulseAnimation = {
    initial: { opacity: 0.6 },
    animate: {
      opacity: 1,
      transition: {
        repeat: Infinity,
        repeatType: "reverse",
        duration: 1
      }
    }
  };

  return (
    <motion.div 
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header skeleton */}
      <div className="mb-8">
        <motion.div 
          className="h-8 w-1/3 bg-gray-200 dark:bg-gray-700 rounded-md mb-2"
          variants={pulseAnimation}
          initial="initial"
          animate="animate"
        />
        <motion.div 
          className="h-4 w-2/3 bg-gray-200 dark:bg-gray-700 rounded-md"
          variants={pulseAnimation}
          initial="initial"
          animate="animate"
        />
      </div>
      
      {/* Stats skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <motion.div 
            key={i}
            className="bg-gray-100 dark:bg-gray-700/50 p-4 rounded-lg"
            variants={pulseAnimation}
            initial="initial"
            animate="animate"
          >
            <div className="h-4 w-2/3 bg-gray-200 dark:bg-gray-600 rounded-md mb-3" />
            <div className="h-6 w-1/3 bg-gray-200 dark:bg-gray-600 rounded-md" />
          </motion.div>
        ))}
      </div>
      
      {/* Actions skeleton */}
      <div className="mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <motion.div 
              key={i}
              className="h-24 bg-gray-100 dark:bg-gray-700/50 rounded-lg"
              variants={pulseAnimation}
              initial="initial"
              animate="animate"
            />
          ))}
        </div>
      </div>
      
      {/* Filter bar skeleton */}
      <motion.div 
        className="h-16 bg-gray-100 dark:bg-gray-700/50 rounded-lg mb-8"
        variants={pulseAnimation}
        initial="initial"
        animate="animate"
      />
      
      {/* Roadmap list skeletons */}
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <motion.div 
            key={i}
            className="h-32 bg-gray-100 dark:bg-gray-700/50 rounded-lg"
            variants={pulseAnimation}
            initial="initial"
            animate="animate"
            transition={{ 
              delay: i * 0.1,
              repeat: Infinity,
              repeatType: "reverse",
              duration: 1
            }}
          />
        ))}
      </div>
    </motion.div>
  );
};

export default LoadingState; 