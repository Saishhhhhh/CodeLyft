import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SectionHeader from './SectionHeader';
import TopicSection from './TopicSection';
import { groupSectionsBySharedResources } from '../utils/progressUtils';

const RoadmapContent = ({
  roadmap,
  expandedSections,
  completedVideos,
  videoNotes,
  onToggleSection,
  onToggleVideoComplete,
  onPlayVideo,
  onAddNote,
  onPlaylistClick,
  getCompletedVideosCount,
  getTotalVideosCount,
  getCompletionPercentage,
  theme
}) => {
  if (!roadmap || !roadmap.sections) {
    return null;
  }

  // Animation variants for sections
  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  // Animation variants for topics within expanded sections - modified to prevent scroll issues
  const topicVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: i => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: i * 0.08, // Slightly faster stagger to reduce overall animation time
        duration: 0.3,
        ease: "easeOut"
      }
    })
  };

  // Animation variants for section content
  const contentVariants = {
    hidden: { opacity: 0, height: 0 },
    visible: { 
      opacity: 1, 
      height: 'auto',
      transition: { 
        duration: 0.4,
        when: "beforeChildren" // Ensures parent container expands before child animations
      }
    },
    exit: {
      opacity: 0,
      height: 0,
      transition: { 
        duration: 0.3 
      }
    }
  };

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden">
      {/* Learning Path */}
      <div className="space-y-8">
        {groupSectionsBySharedResources(roadmap.sections).map((section, sectionIndex) => (
          <motion.div 
            key={section._id} 
            className="rounded-lg overflow-hidden"
            initial="hidden"
            animate="visible"
            variants={sectionVariants}
            transition={{ 
              duration: 0.5,
              delay: sectionIndex * 0.15 // Stagger each section by 0.15s
            }}
            style={{ 
              border: `1px solid ${theme.border}`,
              backgroundColor: theme.cardBg
            }}
          >
            {/* Section Header */}
            <SectionHeader
              title={section.title.replace(/^Step \d+: /, '')}
              completedCount={getCompletedVideosCount(section, completedVideos)}
              totalCount={getTotalVideosCount(section)}
              completionPercentage={getCompletionPercentage(section, completedVideos)}
              isExpanded={expandedSections[section._id]}
              onToggle={() => onToggleSection(section._id)}
              theme={theme}
            />

            {/* Section Content with AnimatePresence for clean mounting/unmounting */}
            <AnimatePresence initial={false}>
              {expandedSections[section._id] && (
                <motion.div 
                  className="overflow-hidden" 
                  key={`content-${section._id}`}
                  variants={contentVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  style={{ backgroundColor: theme.cardBg }}
                >
                  <div className="p-6">
                    {/* Topics - Using CSS grid with defined height to prevent layout shifts */}
                    <div className="grid grid-cols-1 gap-8 overflow-visible">
                      {section.topics.map((topic, topicIndex) => {
                        // Process video data to ensure channel info is available
                        if (topic.video && topic.video.videos && topic.video.videos.length > 0) {
                          // Fix channel information for each video
                          topic.video.videos.forEach(video => {
                            if (!video.channel && topic.video.channel) {
                              video.channel = topic.video.channel;
                            } else if (typeof video.channel === 'object' && video.channel?.name) {
                              video.channel = video.channel.name;
                            }
                          });
                          
                          // Set playlist channel if missing
                          if (!topic.video.channel && topic.video.videos[0]?.channel) {
                            if (typeof topic.video.videos[0].channel === 'string') {
                              topic.video.channel = topic.video.videos[0].channel;
                            } else if (topic.video.videos[0]?.channel?.name) {
                              topic.video.channel = topic.video.videos[0].channel.name;
                            }
                          }
                        }
                        
                        return (
                          <motion.div
                            key={topic._id || `topic-${sectionIndex}-${topicIndex}`}
                            custom={topicIndex}
                            initial="hidden"
                            animate="visible"
                            variants={topicVariants}
                            className="overflow-visible"
                            style={{ 
                              willChange: 'transform, opacity',
                              contain: 'paint'
                            }}
                          >
                            <TopicSection
                              topic={topic}
                              completedVideos={completedVideos}
                              videoNotes={videoNotes}
                              onToggleComplete={onToggleVideoComplete}
                              onPlayVideo={onPlayVideo}
                              onAddNote={onAddNote}
                              onPlaylistClick={onPlaylistClick}
                              theme={theme}
                            />
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default RoadmapContent; 