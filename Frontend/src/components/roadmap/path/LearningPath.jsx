import React from 'react';
import { motion } from 'framer-motion';
import { FaRocket, FaStar, FaFlag, FaCode, FaPlay, FaMountain } from 'react-icons/fa';

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

const LearningPath = ({ sections, editMode }) => {
  return (
    <motion.div variants={itemVariants} className="mb-12 mt-0">
      <div className="flex items-center justify-center mb-4">
        <motion.div 
          className="w-16 h-16 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg mr-4"
          whileHover={{ rotate: 360 }}
          transition={{ duration: 0.5 }}
        >
          <FaRocket className="text-2xl" />
        </motion.div>
        <motion.h2 
          className="text-4xl font-bold font-poppins text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Learning Journey Path
        </motion.h2>
      </div>

      <div className="relative max-w-4xl mx-auto">
        {/* Vertical Timeline */}
        <motion.div 
          className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-300 via-purple-300 to-pink-300 transform -translate-x-1/2"
        />
        
        {sections.map((section, index) => (
          <motion.div
            key={index}
            variants={itemVariants}
            className={`relative mb-6 ${index % 2 === 0 ? 'md:ml-auto md:mr-[50%] md:pr-6' : 'md:mr-auto md:ml-[50%] md:pl-6'} md:w-[48%]`}
          >
            {/* Timeline Icon */}
            <motion.div 
              className={`absolute top-3 w-7 h-7 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg z-10 ${
                index % 2 === 0 ? 'right-0 translate-x-1/2' : 'left-0 -translate-x-1/2'
              }`}
              whileHover={!editMode ? { scale: 1.2, rotate: 360 } : undefined}
              transition={{ duration: 0.3 }}
            >
              {index === 0 ? (
                <FaCode className="text-xs" />
              ) : index === sections.length - 1 ? (
                <FaMountain className="text-xs" />
              ) : index % 3 === 0 ? (
                <FaRocket className="text-xs" />
              ) : index % 3 === 1 ? (
                <FaStar className="text-xs" />
              ) : (
                <FaFlag className="text-xs" />
              )}
            </motion.div>

            <motion.div
              variants={cardVariants}
              whileHover={!editMode ? "hover" : undefined}
              className={`group relative ${editMode ? 'cursor-default' : ''}`}
            >
              <motion.div 
                className={`absolute -inset-0.5 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 rounded-lg blur opacity-20 ${!editMode ? 'group-hover:opacity-40' : ''} transition duration-300`}
                whileHover={!editMode ? { scale: 1.02 } : undefined}
              />
              <div className={`relative bg-white rounded-lg border ${editMode ? 'border-gray-300' : 'border-indigo-100'} shadow-sm ${!editMode ? 'hover:shadow-md' : ''} transition-all duration-300 overflow-hidden`}>
                {/* Topics Grid */}
                <div className="p-3 bg-gradient-to-br from-indigo-50/50 via-purple-50/50 to-pink-50/50">
                  <div className="grid gap-3">
                    {section.topics?.map((topic, topicIndex) => (
                      <motion.div
                        key={topicIndex}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: topicIndex * 0.1 }}
                        className="group relative"
                      >
                        <div className={`bg-white rounded-lg shadow-sm ${!editMode ? 'hover:shadow-md' : ''} transition-all duration-200 border ${editMode ? 'border-gray-300' : 'border-indigo-100'} overflow-hidden`}>
                          <div className="flex">
                            {/* Number Section */}
                            <div className={`flex-shrink-0 w-24 flex items-center justify-center bg-gradient-to-br ${editMode ? 'from-gray-50 via-gray-50 to-gray-50' : 'from-indigo-50 via-purple-50 to-pink-50'} ${
                              index % 2 === 0 ? 'border-l order-2' : 'border-r'
                            } ${editMode ? 'border-gray-300' : 'border-indigo-100'}`}>
                              <span className={`text-5xl font-bold ${editMode ? 'text-gray-700' : 'text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600'}`}>{index + 1}</span>
                            </div>

                            {/* Content Section */}
                            <div className={`flex-grow p-4 ${index % 2 === 0 ? 'pl-6 pr-6' : 'pr-6 pl-6 order-1'}`}>
                              <div className={`flex items-start justify-between ${index % 2 === 0 ? 'flex-row-reverse' : ''}`}>
                                <div className={`flex-grow ${index % 2 === 0 ? 'text-right pr-2' : ''}`}>
                                  <h4 className={`text-3xl font-bold ${editMode ? 'text-gray-700' : 'text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 group-hover:from-indigo-500 group-hover:via-purple-500 group-hover:to-pink-500'} transition-colors duration-200 mb-2`}>
                                    {topic.title.replace(/^Complete\s+/i, '')}
                                  </h4>
                                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                                    editMode ? 'bg-gray-100 text-gray-700' :
                                    section.difficulty === 'beginner' ? 'bg-gradient-to-r from-emerald-100 to-emerald-50 text-emerald-700' :
                                    section.difficulty === 'intermediate' ? 'bg-gradient-to-r from-amber-100 to-amber-50 text-amber-700' :
                                    'bg-gradient-to-r from-rose-100 to-rose-50 text-rose-700'
                                  }`}>
                                    {section.difficulty}
                                  </span>
                                </div>
                                {topic.video && !editMode && (
                                  <div className={`flex-shrink-0 ${index % 2 === 0 ? 'mr-4' : 'ml-4'}`}>
                                    <a 
                                      href={topic.video.url} 
                                      target="_blank" 
                                      rel="noopener noreferrer" 
                                      className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-700 transition-colors bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 px-3 py-1.5 rounded-md font-medium"
                                    >
                                      <FaPlay className="mr-2 text-xs" />
                                      {topic.video.isPlaylist ? 'Watch Playlist' : 'Watch Video'}
                                    </a>
                                    {topic.video.isPlaylist && (
                                      <span className="block text-xs text-indigo-500 bg-gradient-to-r from-indigo-50 to-purple-50 px-2 py-0.5 rounded-md mt-1 text-center">
                                        {topic.video.videoCount} videos
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        {/* Description Tooltip */}
                        {topic.description && !editMode && (
                          <div className="invisible group-hover:visible absolute left-0 right-0 top-full mt-1 z-50">
                            <div className="bg-white rounded-lg p-4 shadow-lg border border-indigo-100 mx-2">
                              <p className="text-sm text-indigo-600/90 leading-relaxed">
                                {topic.description}
                              </p>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default LearningPath; 