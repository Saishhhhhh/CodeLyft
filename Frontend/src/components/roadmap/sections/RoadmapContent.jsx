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

  console.log('RoadmapContent render:', { 
    sectionsCount: roadmap.sections.length,
    expandedSections
  });

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

  const handleSectionToggle = (sectionId) => {
    console.log('Section toggle clicked:', sectionId);
    if (onToggleSection) {
      onToggleSection(sectionId);
    }
  };

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden">
      {/* Learning Path */}
      <div className="space-y-8">
        {groupSectionsBySharedResources(roadmap.sections).map((section, sectionIndex) => {
          // Generate a stable section ID using either id, _id, or a fallback
          const sectionId = section.id || section._id || `section-${section.title}`;
          
          console.log(`Section ${sectionIndex}:`, { 
            sectionId, 
            hasId: Boolean(section.id), 
            has_Id: Boolean(section._id),
            title: section.title
          });
          
          const isExpanded = Boolean(expandedSections[sectionId]);
          
          return (
            <motion.div 
              key={sectionId}
              className="rounded-lg overflow-hidden"
              initial="hidden"
              animate="visible"
              variants={sectionVariants}
              transition={{ 
                duration: 0.5,
                delay: sectionIndex * 0.15
              }}
              style={{ 
                border: `1px solid ${theme.border}`,
                backgroundColor: theme.cardBg
              }}
            >
              {/* Section Header */}
              <SectionHeader
                key={`header-${sectionId}`}
                sectionId={sectionId}
                title={section.title.replace(/^Step \d+: /, '')}
                completedCount={getCompletedVideosCount(section, completedVideos)}
                totalCount={getTotalVideosCount(section)}
                completionPercentage={getCompletionPercentage(section, completedVideos)}
                isExpanded={isExpanded}
                onToggle={handleSectionToggle}
                theme={theme}
              />

              {/* Section Content with AnimatePresence for clean mounting/unmounting */}
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div 
                    className="overflow-hidden" 
                    key={`content-${sectionId}`}
                    variants={contentVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    style={{ backgroundColor: theme.cardBg }}
                  >
                    <div className="p-6">
                      {/* Topics - Using CSS grid with defined height to prevent layout shifts */}
                      <div className="grid grid-cols-1 gap-8 overflow-visible">
                        {section.topics?.map((topic, topicIndex) => {
                          // Process video data to ensure channel info is available
                          if (topic.video && topic.video.videos && topic.video.videos.length > 0) {
                            // Log the original channel information for debugging
                            console.log('Video channel info before processing:', {
                              topicChannel: topic.video.channel,
                              videoChannels: topic.video.videos.map(v => ({
                                id: v.id || v._id,
                                title: v.title,
                                channel: v.channel,
                                channelType: typeof v.channel
                              }))
                            });
                            
                            // Get source information from either the video or topic
                            const sourceInfo = topic.video.videos[0]?.source || 'YouTube';
                            
                            // Fix channel information for each video
                            topic.video.videos.forEach(video => {
                              // Check for channel information in different places
                              if (!video.channel) {
                                // Try to get channel from topic
                                if (topic.video.channel) {
                                  video.channel = topic.video.channel;
                                } 
                                // Try to get source as fallback
                                else if (video.source) {
                                  video.channel = video.source;
                                }
                                // Use a reasonable default from source info
                                else {
                                  video.channel = sourceInfo;
                                }
                              } 
                              // Handle object-type channel
                              else if (typeof video.channel === 'object') {
                                if (video.channel?.name) {
                                  video.channel = video.channel.name;
                                } else {
                                  video.channel = sourceInfo;
                                }
                              }
                              
                              // Ensure we never display "Unknown"
                              if (!video.channel || video.channel === 'Unknown') {
                                video.channel = sourceInfo;
                              }
                            });
                            
                            // Set playlist channel if missing
                            if (!topic.video.channel && topic.video.videos[0]?.channel) {
                              topic.video.channel = topic.video.videos[0].channel;
                            }
                            
                            // Log the processed channel information
                            console.log('Video channel info after processing:', {
                              topicChannel: topic.video.channel,
                              videoChannels: topic.video.videos.map(v => v.channel)
                            });
                          }
                          
                          // Generate a stable topic ID
                          const topicId = topic.id || topic._id || `topic-${sectionId}-${topicIndex}`;
                          
                          return (
                            <motion.div
                              key={topicId}
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
                                key={`topic-section-${topicId}`}
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
          );
        })}
      </div>
    </div>
  );
};

export default RoadmapContent; 