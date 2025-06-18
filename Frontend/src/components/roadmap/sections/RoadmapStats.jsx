import React from 'react';
import { motion } from 'framer-motion';
import { FaCheckCircle, FaRegClock, FaChartLine, FaBookmark, FaRegStickyNote, FaYoutube } from 'react-icons/fa';

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: i => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.4
    }
  })
};

const RoadmapStats = ({ 
  roadmap, 
  completedVideos, 
  videoNotes, 
  theme
}) => {
  if (!roadmap || !roadmap.sections) return null;
  
  // Calculate total duration of all videos
  const calculateTotalDuration = () => {
    let totalSeconds = 0;
    roadmap.sections.forEach(section => {
      section.topics?.forEach(topic => {
        topic.video?.videos?.forEach(video => {
          if (video.duration_seconds) {
            totalSeconds += parseInt(video.duration_seconds);
          }
        });
      });
    });
    
    // Format duration
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };
  
  // Count sections by progress status
  const getSectionStatusCounts = () => {
    const counts = {
      completed: 0,
      'in-progress': 0,
      'not-started': 0
    };
    
    roadmap.sections.forEach(section => {
      if (section.progress) {
        counts[section.progress] = (counts[section.progress] || 0) + 1;
      } else {
        // Calculate progress if not explicitly set
        const totalVideos = getTotalVideosCount(section);
        const completedCount = getCompletedVideosCount(section);
        
        if (completedCount === 0) {
          counts['not-started']++;
        } else if (completedCount === totalVideos) {
          counts['completed']++;
        } else {
          counts['in-progress']++;
        }
      }
    });
    
    return counts;
  };
  
  // Count total videos in a section
  const getTotalVideosCount = (section) => {
    if (!section?.topics) return 0;
    
    let count = 0;
    section.topics.forEach(topic => {
      if (topic.video?.videos) {
        count += topic.video.videos.length;
      }
    });
    
    return count;
  };
  
  // Count completed videos in a section
  const getCompletedVideosCount = (section) => {
    if (!section?.topics) return 0;
    
    let count = 0;
    section.topics.forEach(topic => {
      if (topic.video?.videos) {
        topic.video.videos.forEach(video => {
          if (completedVideos[video.id] || completedVideos[video._id]) {
            count++;
          }
        });
      }
    });
    
    return count;
  };
  
  // Count total videos with notes
  const getNotesCount = () => {
    return Object.keys(videoNotes || {}).length;
  };
  
  // Get estimated time to complete remaining content
  const getEstimatedTimeRemaining = () => {
    let totalRemainingSeconds = 0;
    roadmap.sections.forEach(section => {
      section.topics?.forEach(topic => {
        topic.video?.videos?.forEach(video => {
          // Only count videos that aren't completed
          if (!completedVideos[video.id] && !completedVideos[video._id]) {
            if (video.duration_seconds) {
              totalRemainingSeconds += parseInt(video.duration_seconds);
            }
          }
        });
      });
    });
    
    // Format duration
    const hours = Math.floor(totalRemainingSeconds / 3600);
    const minutes = Math.floor((totalRemainingSeconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };
  
  // Get section status counts
  const sectionCounts = getSectionStatusCounts();
  
  // Get total videos count
  const totalVideos = roadmap.sections.reduce((total, section) => 
    total + getTotalVideosCount(section), 0);
  
  // Get completed videos count
  const completedCount = Object.keys(completedVideos).length;
  
  // Calculate completion percentage
  const completionPercentage = totalVideos > 0 
    ? Math.round((completedCount / totalVideos) * 100) 
    : 0;
  
  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      className="mt-8 mb-12 p-6 rounded-xl overflow-hidden"
      style={{ 
        backgroundColor: theme.cardBg,
        border: `1px solid ${theme.border}`,
        boxShadow: `0 10px 25px -5px ${theme.shadow}`
      }}
    >
      <motion.h2 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="text-xl font-bold mb-8 flex items-center"
        style={{ color: theme.text }}
      >
        <FaChartLine className="mr-2" style={{ color: theme.accent }} />
        Roadmap Statistics
      </motion.h2>
      
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Overall Progress Card */}
        <motion.div 
          custom={0}
          variants={cardVariants}
          className="p-5 rounded-xl shadow-md"
          style={{ 
            backgroundColor: theme.cardBg,
            boxShadow: `0 4px 12px ${theme.shadow}`
          }}
        >
          <h3 className="text-sm font-medium mb-3" style={{ color: theme.text }}>Overall Progress</h3>
          
          {/* Progress Bar */}
          <div className="w-full h-3 rounded-full mb-3" style={{ backgroundColor: `${theme.progressBg}80` }}>
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${completionPercentage}%` }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
              className="h-3 rounded-full" 
              style={{ 
                backgroundColor: theme.progressFill,
              }}
            ></motion.div>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-xs" style={{ color: theme.textMuted }}>
              {completedCount} of {totalVideos} resources completed
            </span>
            <span className="text-sm font-semibold" style={{ color: theme.text }}>
              {completionPercentage}%
            </span>
          </div>
        </motion.div>
        
        {/* Time Stats Card */}
        <motion.div 
          custom={1}
          variants={cardVariants}
          className="p-5 rounded-xl shadow-md"
          style={{ 
            backgroundColor: theme.cardBg,
            boxShadow: `0 4px 12px ${theme.shadow}`
          }}
        >
          <h3 className="text-sm font-medium mb-3" style={{ color: theme.text }}>Time Statistics</h3>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs flex items-center" style={{ color: theme.textMuted }}>
                <FaRegClock className="mr-1" /> Total Content Duration
              </span>
              <span className="text-sm font-semibold" style={{ color: theme.text }}>
                {calculateTotalDuration()}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-xs flex items-center" style={{ color: theme.textMuted }}>
                <FaRegClock className="mr-1" /> Remaining Time
              </span>
              <span className="text-sm font-semibold" style={{ color: theme.text }}>
                {getEstimatedTimeRemaining()}
              </span>
            </div>
          </div>
        </motion.div>
        
        {/* Sections Status Card */}
        <motion.div 
          custom={2}
          variants={cardVariants}
          className="p-5 rounded-xl shadow-md"
          style={{ 
            backgroundColor: theme.cardBg,
            boxShadow: `0 4px 12px ${theme.shadow}`
          }}
        >
          <h3 className="text-sm font-medium mb-3" style={{ color: theme.text }}>Section Status</h3>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs flex items-center" style={{ color: theme.success }}>
                <FaCheckCircle className="mr-1" /> Completed
              </span>
              <span className="text-sm font-semibold" style={{ color: theme.text }}>
                {sectionCounts.completed}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-xs flex items-center" style={{ color: theme.warning }}>
                <FaChartLine className="mr-1" /> In Progress
              </span>
              <span className="text-sm font-semibold" style={{ color: theme.text }}>
                {sectionCounts['in-progress']}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-xs flex items-center" style={{ color: theme.textMuted }}>
                <FaBookmark className="mr-1" /> Not Started
              </span>
              <span className="text-sm font-semibold" style={{ color: theme.text }}>
                {sectionCounts['not-started']}
              </span>
            </div>
          </div>
        </motion.div>
      </div>
      
      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Resources Stats */}
        <motion.div 
          custom={3}
          variants={cardVariants}
          className="p-5 rounded-xl shadow-md flex items-center justify-between"
          style={{ 
            backgroundColor: theme.cardBg,
            boxShadow: `0 4px 12px ${theme.shadow}`
          }}
        >
          <div className="flex items-center">
            <div className="mr-3 p-3 rounded-lg" style={{ backgroundColor: `${theme.accent}20` }}>
              <FaYoutube style={{ color: theme.accent }} />
            </div>
            <div>
              <h4 className="text-xs font-medium" style={{ color: theme.textMuted }}>Total Resources</h4>
              <p className="text-2xl font-bold" style={{ color: theme.text }}>{totalVideos}</p>
            </div>
          </div>
          <div className="text-xs px-2 py-1 rounded-lg" style={{ 
            backgroundColor: `${theme.accent}20`,
            color: theme.accent
          }}>
            YouTube
          </div>
        </motion.div>
        
        {/* Notes Stats */}
        <motion.div 
          custom={4}
          variants={cardVariants}
          className="p-5 rounded-xl shadow-md flex items-center justify-between"
          style={{ 
            backgroundColor: theme.cardBg,
            boxShadow: `0 4px 12px ${theme.shadow}`
          }}
        >
          <div className="flex items-center">
            <div className="mr-3 p-3 rounded-lg" style={{ backgroundColor: `${theme.secondary}20` }}>
              <FaRegStickyNote style={{ color: theme.secondary }} />
            </div>
            <div>
              <h4 className="text-xs font-medium" style={{ color: theme.textMuted }}>Notes Created</h4>
              <p className="text-2xl font-bold" style={{ color: theme.text }}>{getNotesCount()}</p>
            </div>
          </div>
          <div className="text-xs px-2 py-1 rounded-lg" style={{ 
            backgroundColor: `${theme.secondary}20`,
            color: theme.secondary
          }}>
            {Math.round((getNotesCount() / totalVideos) * 100)}% Coverage
          </div>
        </motion.div>
        
        {/* Completion Stats */}
        <motion.div 
          custom={5}
          variants={cardVariants}
          className="p-5 rounded-xl shadow-md flex items-center justify-between"
          style={{ 
            backgroundColor: theme.cardBg,
            boxShadow: `0 4px 12px ${theme.shadow}`
          }}
        >
          <div className="flex items-center">
            <div className="mr-3 p-3 rounded-lg" style={{ backgroundColor: `${theme.success}20` }}>
              <FaCheckCircle style={{ color: theme.success }} />
            </div>
            <div>
              <h4 className="text-xs font-medium" style={{ color: theme.textMuted }}>Completed</h4>
              <p className="text-2xl font-bold" style={{ color: theme.text }}>{completedCount}</p>
            </div>
          </div>
          <div className="text-xs px-2 py-1 rounded-lg" style={{ 
            backgroundColor: `${theme.success}20`,
            color: theme.success
          }}>
            {completionPercentage}% Done
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default RoadmapStats;
