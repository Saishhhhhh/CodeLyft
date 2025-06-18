import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { decodeUnicode, formatDuration } from '../utils/videoUtils';

const TopicSection = ({
  topic,
  completedVideos = {},
  videoNotes = {},
  onToggleComplete,
  onPlayVideo,
  onAddNote,
  theme
}) => {
  if (!topic?.video) return null;

  const videos = topic.video.videos || [];
  const [openMenuIdx, setOpenMenuIdx] = useState(null);
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const menuRefs = useRef([]);

  // Only play video if click is not on menu or menu button
  const handleCardClick = (e, video, idx) => {
    if (
      menuRefs.current[idx] &&
      (menuRefs.current[idx].contains(e.target) || e.target.closest('.topic-menu-btn'))
    ) {
      return;
    }
    onPlayVideo(video);
  };

  // Animation variants for video items - modified to prevent scroll issues
  const videoItemVariants = {
    hidden: { opacity: 0, scale: 0.98 },
    visible: i => ({
      opacity: 1,
      scale: 1,
      transition: {
        delay: i * 0.05, // Reduced delay to minimize animation duration
        duration: 0.25, // Shorter duration
        ease: "easeOut"
      }
    })
  };

  return (
    <div className="w-full overflow-visible">
      {/* Videos List */}
      <div className="w-full overflow-visible">
        {videos.map((video, idx) => {
          const isCompleted = completedVideos[video.id || video._id];
          const menuOpen = openMenuIdx === idx;
          const isHovered = hoveredIdx === idx;
          // Use a subtle accent color with opacity for the border
          const subtleAccent = `${theme.accent}99`; // ~60% opacity
          return (
            <React.Fragment key={video.id || video._id}>
              {idx > 0 && (
                <div 
                  className="mx-1 my-1 opacity-20" 
                  style={{ height: '1px', backgroundColor: theme.border }}
                />
              )}
              <motion.div
                custom={idx}
                initial="hidden"
                animate="visible"
                variants={videoItemVariants}
                whileHover={{ 
                  scale: 1.01, 
                  transition: { duration: 0.2 }
                }}
                className={`w-full flex justify-between items-start py-2 px-2 transition-colors duration-300 cursor-pointer ${isCompleted ? 'border-l-4' : ''}`}
                style={{ 
                  background: isCompleted ? `${theme.accent}10` : isHovered ? `${theme.cardHover}` : 'none',
                  borderLeftColor: isCompleted ? subtleAccent : 'transparent',
                  border: 'none',
                  outline: 'none',
                  borderRadius: '0.375rem',
                  boxShadow: isHovered ? `0 4px 6px -1px ${theme.shadow}` : 'none',
                  willChange: 'transform, opacity',
                  contain: 'layout'
                }}
                onClick={e => handleCardClick(e, video, idx)}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                title={video.title}
                layoutId={`video-${video.id || video._id}`}
              >
                <div className="flex items-start flex-1 min-w-0 pr-2">
                  <motion.div 
                    className="mr-2 mt-1 flex-shrink-0" 
                    whileHover={{ scale: 1.2 }}
                    style={{ color: theme.accent }}
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
                    </svg>
                  </motion.div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm sm:text-base truncate transition-colors duration-300" 
                      style={{ 
                        color: isHovered ? theme.accent : theme.text
                      }}
                    >
                      {video.title}
                    </div>
                    <div className="text-xs flex flex-wrap gap-x-2 mt-0.5" style={{ color: theme.textMuted }}>
                      <span className="whitespace-nowrap">{video.duration ? formatDuration(video.duration) : ''}</span>
                      {video.duration && <span className="hidden sm:inline">&bull;</span>}
                      <span className="truncate">
                        {video.channel || 
                         topic.video?.channel || 
                         video.source || 
                         'YouTube'}
                      </span>
                    </div>
                  </div>
                </div>
                {/* Vertical Three Dots Menu */}
                <div className="relative flex-shrink-0" onClick={e => e.stopPropagation()}>
                  <button
                    className={`topic-menu-btn p-1 rounded-full focus:outline-none transition-colors duration-300 ${menuOpen ? 'z-20 relative' : ''}`}
                    style={{ 
                      backgroundColor: isHovered ? `${theme.accent}20` : 'transparent'
                    }}
                    onClick={() => setOpenMenuIdx(menuOpen ? null : idx)}
                    aria-label="Open actions menu"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke={isHovered ? theme.accent : theme.textMuted} strokeWidth={2}>
                      <circle cx="12" cy="5" r="1.2" />
                      <circle cx="12" cy="12" r="1.2" />
                      <circle cx="12" cy="19" r="1.2" />
                    </svg>
                  </button>
                  <AnimatePresence>
                    {menuOpen && (
                      <motion.div
                        ref={el => (menuRefs.current[idx] = el)}
                        className="absolute right-0 bottom-full z-50 mb-2 w-40 rounded-lg shadow-lg py-1 text-sm"
                        initial={{ opacity: 0, scale: 0.95, y: 5 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 5 }}
                        transition={{ duration: 0.2 }}
                        style={{
                          backgroundColor: theme.cardBg,
                          border: `1px solid ${theme.border}`
                        }}
                      >
                        <motion.button
                          className="w-full text-left px-4 py-2 whitespace-nowrap transition-colors duration-200"
                          whileHover={{ backgroundColor: `${theme.accent}20` }}
                          style={{ color: theme.text }}
                          onClick={e => { e.stopPropagation(); onToggleComplete(video.id || video._id); setOpenMenuIdx(null); }}
                        >
                          {isCompleted ? 'Mark as Incomplete' : 'Mark as Complete'}
                        </motion.button>
                        <motion.button
                          className="w-full text-left px-4 py-2 whitespace-nowrap transition-colors duration-200"
                          whileHover={{ backgroundColor: `${theme.accent}20` }}
                          style={{ color: theme.text }}
                          onClick={e => { e.stopPropagation(); onAddNote(video.id || video._id); setOpenMenuIdx(null); }}
                        >
                          Edit Notes
                        </motion.button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default TopicSection; 