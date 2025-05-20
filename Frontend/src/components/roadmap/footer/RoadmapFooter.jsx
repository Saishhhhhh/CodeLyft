import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: [0.6, -0.05, 0.01, 0.99]
    }
  }
};

const RoadmapFooter = () => {
  const navigate = useNavigate();

  return (
    <motion.div 
      variants={itemVariants} 
      className="text-center"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-wrap justify-center gap-6">
        <motion.button
          whileHover={{ 
            scale: 1.05, 
            boxShadow: "0 0 30px rgba(99,102,241,0.15)",
            transition: { duration: 0.2 }
          }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/')}
          className="group relative px-8 py-4 rounded-xl font-medium text-indigo-600 bg-white border border-indigo-200 hover:border-indigo-300 transition-all duration-300 overflow-hidden"
        >
          <motion.div 
            className="absolute inset-0 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.3 }}
          />
          <span className="relative">Start New Journey</span>
        </motion.button>
      </div>
    </motion.div>
  );
};

export default RoadmapFooter; 