import React from 'react';
import { motion } from 'framer-motion';
import { FaCode } from 'react-icons/fa';

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

const getDifficultyStyle = (difficulty) => {
  switch (difficulty) {
    case 'beginner':
      return 'bg-gradient-to-r from-emerald-100 to-emerald-50 text-emerald-700';
    case 'intermediate':
      return 'bg-gradient-to-r from-amber-100 to-amber-50 text-amber-700';
    default:
      return 'bg-gradient-to-r from-rose-100 to-rose-50 text-rose-700';
  }
};

const PracticeProjects = ({ projects }) => {
  if (!projects || projects.length === 0) {
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
          <FaCode className="text-2xl" />
        </motion.div>
        <motion.h2 
          className="text-4xl font-bold font-poppins text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Practice Projects
        </motion.h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
        {projects.map((project, index) => (
          <motion.div
            key={index}
            variants={cardVariants}
            whileHover="hover"
            className="group relative"
          >
            <motion.div 
              className="absolute -inset-0.5 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-300"
              whileHover={{ scale: 1.02 }}
            />
            <div className="relative bg-white rounded-xl border border-indigo-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
              <div className="p-5">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 group-hover:from-indigo-500 group-hover:via-purple-500 group-hover:to-pink-500 transition-colors duration-200">
                      {project.title}
                    </h3>
                    <span className={`px-3 py-1 rounded-lg text-sm font-medium ${getDifficultyStyle(project.difficulty)}`}>
                      {project.difficulty}
                    </span>
                  </div>
                  {project.description && (
                    <p className="text-sm text-indigo-600/80 leading-relaxed">
                      {project.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default PracticeProjects; 