import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../../context/ThemeContext';

const ExpandingTagsAnimation = ({ message }) => {
  const { darkMode } = useTheme();
  const [dotsState, setDotsState] = useState('none'); // 'none', 'typing', 'full'
  
  // Colors matching the website's heading gradient
  const colors = {
    // From the heading gradient in RoadmapQuestionsPage.jsx
    tagColor: darkMode ? '#4F46E5' : '#4F46E5', // Indigo (--primary from the site)
    dotColor: darkMode ? '#8B5CF6' : '#8B5CF6', // Purple (--accent from the site)
    text: darkMode ? '#F1F5F9' : '#1E293B',
  };

  useEffect(() => {
    // Animation sequence with typewriter effect for dots
    const animate = async () => {
      // Start with no dots
      setDotsState('none');
      await delay(800);
      
      // Start typing animation (faster)
      setDotsState('typing-1');
      await delay(150);
      setDotsState('typing-2');
      await delay(150);
      
      // Show full dots
      setDotsState('full');
      await delay(800);
      
      // Backspace animation (faster)
      setDotsState('typing-2');
      await delay(150);
      setDotsState('typing-1');
      await delay(150);
      setDotsState('none');
      await delay(800);
      
      // Restart sequence
      animate();
    };
    
    animate();
    return () => {};
  }, []);
  
  // Helper for delays
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  
  // Determine what dots to show based on state
  const getDots = () => {
    switch(dotsState) {
      case 'typing-1': return '.';
      case 'typing-2': return '..';
      case 'full': return '..';
      default: return '';
    }
  };
  
  // Whether to show any dots content
  const showDots = dotsState !== 'none';

  // Pop effect during state changes
  const getPopAnimation = () => {
    if (dotsState === 'typing-1' || dotsState === 'typing-2') {
      return { scale: [0.9, 1.1, 1] };
    }
    return { scale: 1 };
  };
  
  return (
    // Completely stripped down to basic structure
    <div className="relative">
      {/* Animation only */}
      <div className="flex justify-center">
        <motion.div 
          className="flex items-center"
          animate={{ 
            y: [0, -2, 0, 2, 0],
          }}
          transition={{
            y: { duration: 6, repeat: Infinity, ease: "easeInOut" }
          }}
        >
          {/* Left angle bracket < */}
          <motion.div
            animate={{ 
              ...getPopAnimation(),
              rotate: [-1, 1, -1],
            }}
            transition={{
              scale: { duration: 0.3, ease: "easeOut" },
              rotate: { duration: 4, repeat: Infinity, ease: "easeInOut" },
            }}
            style={{ 
              color: colors.tagColor,
              fontFamily: 'monospace',
              fontSize: '3.5rem',
              fontWeight: 'bold',
              marginRight: '-0.3rem',
            }}
          >
            &lt;
          </motion.div>
          
          {/* Content between brackets */}
          <div className="flex items-center h-14">
            {/* Dots with typewriter effect */}
            {showDots && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ 
                  opacity: 1,
                  scale: [0.8, 1.2, 1],
                }}
                exit={{ opacity: 0 }}
                transition={{ 
                  opacity: { duration: 0.2 },
                  scale: { duration: 0.3 }
                }}
                style={{ 
                  color: colors.dotColor,
                  fontFamily: 'monospace',
                  fontSize: '2.5rem',
                  fontWeight: 'bold',
                  position: 'relative',
                  top: '-0.2rem',
                }}
              >
                {getDots()}
              </motion.div>
            )}
            
            {/* Forward slash (always visible) */}
            <motion.div
              animate={{ 
                ...getPopAnimation(),
                scale: [0.95, 1.05, 0.95],
              }}
              transition={{ 
                scale: { duration: 0.3, ease: "easeOut" },
              }}
              style={{ 
                color: colors.dotColor,
                fontFamily: 'monospace',
                fontSize: '3.5rem',
                fontWeight: 'bold',
              }}
            >
              /
            </motion.div>
          </div>
          
          {/* Right angle bracket > */}
          <motion.div
            animate={{ 
              ...getPopAnimation(),
              rotate: [1, -1, 1],
            }}
            transition={{
              scale: { duration: 0.3, ease: "easeOut" },
              rotate: { duration: 4, repeat: Infinity, ease: "easeInOut" },
            }}
            style={{ 
              color: colors.tagColor,
              fontFamily: 'monospace',
              fontSize: '3.5rem',
              fontWeight: 'bold',
              marginLeft: '-0.3rem',
            }}
          >
            &gt;
          </motion.div>
        </motion.div>
      </div>
      
      {/* Message text, positioned below using mt (margin-top) */}
      {message && (
        <div className="text-center mt-2">
          <div
            className="inline-block font-medium text-lg font-poppins"
            style={{ 
              background: 'linear-gradient(to right, #4F46E5, #8B5CF6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {message}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpandingTagsAnimation;