import React from 'react';
import { Link } from 'react-router-dom';
import { FaPlus, FaPencilAlt, FaLightbulb } from 'react-icons/fa';
import { motion } from 'framer-motion';

const RoadmapActions = ({ onCreateCustom, theme }) => {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.4,
        staggerChildren: 0.15
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: -10, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { 
        duration: 0.4,
        ease: "easeOut"
      }
    }
  };

  return (
    <motion.div 
      className="rounded-2xl border shadow-xl p-8 mb-8"
      style={{
        background: theme.cardBg,
        borderColor: theme.border
      }}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header Section */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2" style={{ color: theme.text }}>
          Start Your Learning Journey
        </h2>
        <p className="text-base" style={{ color: theme.textMuted }}>
          Choose how you want to begin your roadmap adventure
        </p>
      </div>
      
      {/* Action Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Create New Roadmap */}
        <motion.div variants={itemVariants}>
          <Link 
            to="/"
            className="group block"
          >
            <div className="relative overflow-hidden rounded-xl border transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]"
              style={{
                background: theme.cardBg,
                borderColor: theme.border
              }}
            >
              {/* Gradient Overlay on Hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <div className="relative p-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                      <FaPlus className="text-white text-xl" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold mb-2 group-hover:text-indigo-600 transition-colors duration-300" style={{ color: theme.text }}>
                      Create New Roadmap
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: theme.textMuted }}>
                      Start with a pre-built roadmap template designed by experts. Perfect for beginners and structured learners.
                    </p>
                    <div className="mt-4 flex items-center text-sm font-medium text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      Get Started
                      <svg className="ml-2 w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </motion.div>
        
        {/* Create Custom Roadmap */}
        <motion.div variants={itemVariants}>
          <Link 
            to="/custom-roadmap"
            className="group block"
          >
            <div className="relative overflow-hidden rounded-xl border transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]"
              style={{
                background: theme.cardBg,
                borderColor: theme.border
              }}
            >
              {/* Gradient Overlay on Hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <div className="relative p-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                      <FaLightbulb className="text-white text-xl" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold mb-2 group-hover:text-purple-600 transition-colors duration-300" style={{ color: theme.text }}>
                      Create Custom Roadmap
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: theme.textMuted }}>
                      Design your own learning path from scratch. Full control over topics, resources, and progression.
                    </p>
                    <div className="mt-4 flex items-center text-sm font-medium text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      Start Building
                      <svg className="ml-2 w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </motion.div>
      </div>

      {/* Bottom CTA */}
      <motion.div 
        className="mt-8 pt-6 border-t text-center"
        style={{ borderColor: theme.border }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <p className="text-sm" style={{ color: theme.textMuted }}>
          Need help choosing? <span className="font-medium text-indigo-600 cursor-pointer hover:text-indigo-700 transition-colors">Learn more about roadmap types</span>
        </p>
      </motion.div>
    </motion.div>
  );
};

export default RoadmapActions; 