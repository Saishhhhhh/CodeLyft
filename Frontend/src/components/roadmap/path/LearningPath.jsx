import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaRocket, FaPlay } from 'react-icons/fa';
import TechLogo from '../common/TechLogo';
import { decodeHTML } from '../utils/videoUtils';
import { preloadLogos, warmupLogoCache } from '../../../services/logoService';
import { useTheme } from '../../../context/ThemeContext';

/**
 * Extract the core technology name from a topic title
 * Removes section numbers and descriptions
 * E.g., "Section 1: Python" -> "Python"
 * @param {string} title - The full topic title
 * @returns {string} - The extracted technology name
 */
const extractTechName = (title) => {
  if (!title) return '';
  
  // Remove "Section X:" pattern
  let cleanTitle = title.replace(/^Section\s+\d+:\s+/i, '');
  
  // If there's a dash or hyphen with description, take only the first part
  if (cleanTitle.includes(' - ')) {
    cleanTitle = cleanTitle.split(' - ')[0];
  }
  
  // If there's any other separator, take the first part
  const separators = [' | ', ': ', ' : '];
  for (const separator of separators) {
    if (cleanTitle.includes(separator)) {
      cleanTitle = cleanTitle.split(separator)[0];
      break;
    }
  }
  
  return cleanTitle.trim();
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15, // Much faster staggering
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: index => ({
    x: index % 2 === 0 ? -80 : 80,
    opacity: 0,
    rotate: index % 2 === 0 ? -3 : 3,
    scale: 0.98
  }),
  visible: index => ({
    x: 0,
    opacity: 1,
    rotate: 0,
    scale: 1,
    transition: {
      duration: 0.35, // Much faster animation
      delay: index * 0.15, // Minimal delay between items
      ease: "easeOut", // Simpler easing for speed
      opacity: { duration: 0.25 } // Very quick fade in
    }
  })
};

const cardVariants = {
  hidden: { scale: 0.95, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  },
  hover: {
    scale: 1.02,
    boxShadow: "0 10px 25px -5px rgba(79, 70, 229, 0.1), 0 8px 10px -6px rgba(79, 70, 229, 0.1)",
    transition: {
      duration: 0.2,
      ease: "easeInOut"
    }
  }
};

const topicVariants = {
  hidden: { y: 10, opacity: 0, scale: 0.99 },
  visible: index => ({
    y: 0,
    opacity: 1,
    scale: 1,
    transition: {
      delay: 0.05 + (index * 0.04), // Minimal stagger for topics
      duration: 0.25,
      ease: "easeOut"
    }
  })
};

const LearningPath = ({ sections, editMode, isCustom = false }) => {
  const { darkMode } = useTheme();
  
  useEffect(() => {
    // Preload logos for the first few visible sections
    if (sections && sections.length > 0) {
      // Extract tech names from the first 3 sections (or fewer if less are available)
      const visibleSections = sections.slice(0, Math.min(3, sections.length));
      const techNames = visibleSections.flatMap(section => 
        (section.topics || []).map(topic => extractTechName(topic.title))
      ).filter(Boolean);
      
      // Preload these logos immediately
      if (techNames.length > 0) {
        preloadLogos(techNames);
      }
    }
    
    // Warm up the logo cache when the user is idle
    warmupLogoCache();
  }, [sections]);

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="mb-12 mt-0"
    >
      <div className="flex items-center justify-center mb-8">
        <motion.div 
          className="w-16 h-16 rounded-full flex items-center justify-center text-white shadow-lg mr-4"
          style={{
            background: `linear-gradient(to right, ${darkMode ? '#4F46E5' : '#4F46E5'}, ${darkMode ? '#8B5CF6' : '#8B5CF6'})`
          }}
          initial={{ scale: 0.5, rotate: -90 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 15, 
            delay: 0.05 
          }}
          whileHover={{ rotate: 360 }}
        >
          <FaRocket className="text-2xl" />
        </motion.div>
        <motion.h2 
          className="text-4xl font-bold font-poppins text-transparent bg-clip-text leading-normal py-2"
          style={{
            backgroundImage: `linear-gradient(to right, ${darkMode ? '#4F46E5' : '#4F46E5'}, ${darkMode ? '#8B5CF6' : '#8B5CF6'})`,
            paddingBottom: '0.15em' /* Extra padding to prevent descenders (g, y, etc.) from being cut off */
          }}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.4,
            delay: 0.1,
            ease: "easeOut"
          }}
        >
          {isCustom ? "Custom Learning Path" : "Learning Journey Path"}
        </motion.h2>
      </div>

      <div className="relative max-w-4xl mx-auto">
        {/* Vertical Timeline */}
        <motion.div 
          className={`absolute left-1/2 top-0 bottom-0 w-0.5 transform -translate-x-1/2 ${
            darkMode ? 'bg-gradient-to-b from-indigo-500/30 to-purple-500/30' : 
            'bg-gradient-to-b from-indigo-200/70 to-purple-500/30'
          }`}
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "100%", opacity: 1 }}
          transition={{ 
            height: { duration: 0.5, ease: "easeOut" },
            opacity: { duration: 0.3, ease: "easeIn" }
          }}
        />
        
        {sections.map((section, index) => (
          <motion.div
            key={index}
            custom={index}
            initial="hidden"
            animate="visible"
            variants={itemVariants}
            className={`relative mb-16 ${index % 2 === 0 ? 'md:ml-auto md:mr-[50%] md:pr-12' : 'md:mr-auto md:ml-[50%] md:pl-12'} md:w-[45%]`}
          >

 
            <motion.div
              variants={cardVariants}
              whileHover={!editMode ? "hover" : undefined}
              className={`group relative ${editMode ? 'cursor-default' : ''}`}
            >
              <motion.div 
                className={`absolute -inset-0.5 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 rounded-2xl ${
                  darkMode ? 'blur-[3px] opacity-10' : 'blur opacity-20'
                } ${!editMode ? 'group-hover:opacity-40' : ''} transition duration-300`}
                whileHover={!editMode ? { scale: 1.02 } : undefined}
              />
              <div className={`relative rounded-2xl border shadow-md ${!editMode ? 'hover:shadow-lg' : ''} transition-all duration-300 overflow-hidden ${
                darkMode 
                  ? `${editMode ? 'border-gray-600' : 'border-indigo-900'} bg-gray-800` 
                  : `${editMode ? 'border-gray-300' : 'border-indigo-100'} bg-white`
              }`}>
                {/* Step Number Badge */}
                <div className={`absolute top-0 bottom-0 z-10 ${
                  index % 2 === 0 ? 'left-0' : 'right-0'
                }`}>
                  <div className="relative h-full">
                    <div className={`w-16 h-full flex items-center justify-center ${
                      index % 2 === 0 ? 'bg-gradient-to-br from-indigo-600 to-purple-500' : 'bg-gradient-to-br from-purple-500 to-indigo-600'
                    }`}>
                      <span className="text-4xl font-black text-white">{index + 1}</span>
                    </div>
                  </div>
                </div>

                {/* Topics Grid */}
                <div className={`p-4 ${index % 2 === 0 ? 'pl-20' : 'pr-20'} ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                  <div className="grid gap-4">
                    {(section.topics ?? []).map((topic, topicIndex) => {
                      // Extract clean tech name for logo
                      const techName = extractTechName(topic.title);
                      
                      return (
                        <motion.div
                          key={topicIndex}
                          custom={topicIndex}
                          variants={topicVariants}
                          initial="hidden"
                          animate="visible"
                          className="group relative"
                        >
                          <div className={`flex flex-col ${!editMode ? 'hover:shadow-md' : ''} rounded-xl border overflow-hidden transition-all duration-300 ${
                            darkMode 
                              ? 'border-gray-700' 
                              : 'border-indigo-100'
                          }`}>
                            {/* Card Header with Logo */}
                            <div className={`flex items-center p-4 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                              {/* Logo Section - Order based on section index */}
                              <div className={`flex-shrink-0 w-16 h-16 flex items-center justify-center rounded-lg shadow-sm p-2 ${
                                index % 2 === 0 ? 'order-first' : 'order-last ml-4'
                              } ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
                                <TechLogo techName={techName} size="xl" />
                              </div>

                              {/* Title Section */}
                              <div className={`flex-grow ${index % 2 === 0 ? 'ml-4' : 'mr-4'}`}>
                                <h4 className={`text-2xl font-bold ${index % 2 === 1 ? 'text-right' : ''} ${
                                  darkMode ? 'text-indigo-300' : 'text-indigo-700'
                                }`}>
                                  {decodeHTML(topic.title.replace(/^Complete\s+/i, ''))}
                                </h4>
                                <div className={`flex items-center mt-1 ${index % 2 === 1 ? 'justify-end' : ''}`}>
                                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                                    editMode ? (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700') :
                                    section.difficulty === 'beginner' ? (darkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-700') :
                                    section.difficulty === 'intermediate' ? (darkMode ? 'bg-amber-900 text-amber-300' : 'bg-amber-100 text-amber-700') :
                                    (darkMode ? 'bg-rose-900 text-rose-300' : 'bg-rose-100 text-rose-700')
                                  }`}>
                                    {section.difficulty}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          

                        </motion.div>
                      );
                    })}
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