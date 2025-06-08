import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import HeroAnimation from '../../HeroAnimation';
import { MdRocketLaunch } from 'react-icons/md';

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

const RoadmapErrorState = ({ error, onRetry }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-b from-slate-50 via-purple-50 to-slate-50">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/path-pattern.svg')] opacity-5"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-50/20 to-transparent"></div>
        <motion.div 
          className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.05),transparent_50%)]"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.3, 0.2]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      <HeroAnimation />
      
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="max-w-7xl mx-auto px-4 pt-32 pb-16 relative"
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
              Journey Interrupted
            </motion.h1>
          </div>
          <p className="text-xl text-indigo-600/80 mb-12 font-mukta max-w-3xl mx-auto leading-relaxed">
            {error || 'We encountered an obstacle in creating your learning path. Let\'s try again!'}
          </p>
          
          {/* Hero Buttons */}
          <div className="flex flex-wrap justify-center gap-6 mb-16">
            <motion.button
              whileHover={{ 
                scale: 1.05, 
                boxShadow: "0 0 30px rgba(99,102,241,0.15)",
                transition: { duration: 0.2 }
              }}
              whileTap={{ scale: 0.95 }}
              onClick={onRetry}
              className="group relative px-8 py-4 rounded-xl font-medium text-indigo-600 bg-white border border-indigo-200 hover:border-indigo-300 transition-all duration-300 overflow-hidden"
            >
              <motion.div 
                className="absolute inset-0 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.3 }}
              />
              <span className="relative flex items-center">
                <MdRocketLaunch className="mr-2 text-xl" />
                Restart Journey
              </span>
            </motion.button>
            
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
              <span className="relative">Return to Base</span>
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default RoadmapErrorState; 