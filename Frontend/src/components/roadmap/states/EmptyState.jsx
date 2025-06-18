import React from 'react';
import { Link } from 'react-router-dom';
import { FaRoad, FaPlus } from 'react-icons/fa';
import { motion } from 'framer-motion';

const EmptyState = ({ onCreateCustom, theme }) => {
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
      <motion.div 
        style={{ 
          background: theme.animationPrimary + '20', // 20% opacity for bg
        }}
        className="mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-6"
        variants={itemVariants}
      >
        <FaRoad style={{ color: theme.animationPrimary }} className="text-3xl" />
      </motion.div>
      
      <motion.h2 
        style={{ color: theme.text }}
        className="text-2xl font-bold mb-3"
        variants={itemVariants}
      >
        No roadmaps yet
      </motion.h2>
      
      <motion.p 
        style={{ color: theme.textMuted }}
        className="mb-8 max-w-md mx-auto"
        variants={itemVariants}
      >
        Start your learning journey by creating a new roadmap.
      </motion.p>
      
      <motion.div 
        className="flex justify-center"
        variants={itemVariants}
      >
        <Link 
          to="/custom-roadmap"
          style={{ 
            background: theme.buttonPrimary,
            color: theme.buttonText
          }}
          className="inline-flex items-center justify-center px-5 py-3 rounded-lg hover:opacity-90 transition-opacity"
          onClick={onCreateCustom}
        >
          <FaPlus className="mr-2" /> Create Custom Roadmap
        </Link>
      </motion.div>
    </motion.div>
  );
};

export default EmptyState; 