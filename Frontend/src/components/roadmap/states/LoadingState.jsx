import React from 'react';
import { motion } from 'framer-motion';

const LoadingState = ({ theme }) => {
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

  const skeletonBg = theme ? (theme.background || '#f3f4f6') : '#f3f4f6';
  const skeletonFg = theme ? (theme.border || '#e5e7eb') : '#e5e7eb';

  return (
    <motion.div 
      style={{
        background: theme?.cardBg,
        borderColor: theme?.border,
        color: theme?.text
      }}
      className="rounded-xl shadow-sm border p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header skeleton */}
      <div className="mb-8">
        <motion.div 
          style={{ background: skeletonFg }}
          className="h-8 w-1/3 rounded-md mb-2"
          variants={pulseAnimation}
          initial="initial"
          animate="animate"
        />
        <motion.div 
          style={{ background: skeletonFg }}
          className="h-4 w-2/3 rounded-md"
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
            style={{ background: skeletonBg }}
            className="p-4 rounded-lg"
            variants={pulseAnimation}
            initial="initial"
            animate="animate"
          >
            <div style={{ background: skeletonFg }} className="h-4 w-2/3 rounded-md mb-3" />
            <div style={{ background: skeletonFg }} className="h-6 w-1/3 rounded-md" />
          </motion.div>
        ))}
      </div>
      
      {/* Actions skeleton */}
      <div className="mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <motion.div 
              key={i}
              style={{ background: skeletonBg }}
              className="h-24 rounded-lg"
              variants={pulseAnimation}
              initial="initial"
              animate="animate"
            />
          ))}
        </div>
      </div>
      
      {/* Filter bar skeleton */}
      <motion.div 
        style={{ background: skeletonBg }}
        className="h-16 rounded-lg mb-8"
        variants={pulseAnimation}
        initial="initial"
        animate="animate"
      />
      
      {/* Roadmap list skeletons */}
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <motion.div 
            key={i}
            style={{ background: skeletonBg }}
            className="h-32 rounded-lg"
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