import React from 'react';
import { motion } from 'framer-motion';
import { MdTerrain } from 'react-icons/md';
import { FaUnlock } from 'react-icons/fa';

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

const cardVariants = {
  hidden: { scale: 0.95, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      duration: 0.4,
      ease: "easeOut"
    }
  },
  hover: {
    scale: 1.02,
    transition: {
      duration: 0.2,
      ease: "easeInOut"
    }
  }
};

const AdvancedChallenges = ({ challenges, editMode }) => {
  if (!challenges || challenges.length === 0) {
    return null;
  }

  return (
    <motion.div variants={itemVariants} className="mb-20">
      <div className="flex items-center justify-center mb-10">
        <motion.div 
          className="w-16 h-16 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg mr-4"
          whileHover={{ rotate: 360, scale: 1.1 }}
          transition={{ duration: 0.5 }}
        >
          <MdTerrain className="text-3xl" />
        </motion.div>
        <motion.h2 
          className="text-4xl font-bold font-poppins text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Advanced Challenges
        </motion.h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
        {challenges.map((challenge, index) => (
          <motion.div
            key={index}
            variants={cardVariants}
            whileHover={!editMode ? "hover" : undefined}
            className={`group relative ${editMode ? 'cursor-default' : ''}`}
          >
            <motion.div 
              className={`absolute -inset-0.5 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 rounded-xl blur opacity-20 ${!editMode ? 'group-hover:opacity-40' : ''} transition duration-300`}
              whileHover={!editMode ? { scale: 1.02 } : undefined}
            />
            <div className={`relative bg-white rounded-xl border ${editMode ? 'border-gray-300' : 'border-indigo-100'} shadow-sm ${!editMode ? 'hover:shadow-md' : ''} transition-all duration-300 overflow-hidden`}>
              <div className="p-5">
                <div className="flex items-start space-x-4">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${editMode ? 'from-gray-100 via-gray-100 to-gray-100 text-gray-600' : 'from-indigo-100 via-purple-100 to-pink-100 text-indigo-600'} flex items-center justify-center flex-shrink-0 ${!editMode ? 'group-hover:from-indigo-200 group-hover:via-purple-200 group-hover:to-pink-200' : ''} transition-colors duration-200`}>
                    <FaUnlock className="text-lg" />
                  </div>
                  <div className="flex-grow">
                    <h3 className={`text-xl font-semibold ${editMode ? 'text-gray-700' : 'text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 group-hover:from-indigo-500 group-hover:via-purple-500 group-hover:to-pink-500'} transition-colors duration-200`}>
                      {challenge.title}
                    </h3>
                    {challenge.description && (
                      <p className={`text-sm ${editMode ? 'text-gray-500' : 'text-indigo-600/80'} leading-relaxed mt-2`}>
                        {challenge.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default AdvancedChallenges; 