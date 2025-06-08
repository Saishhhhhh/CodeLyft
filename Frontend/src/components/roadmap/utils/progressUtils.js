/**
 * Utility functions for handling progress tracking
 */

/**
 * Calculates the completion percentage
 * @param {number} total - Total number of items
 * @param {number} completed - Number of completed items
 * @returns {number} Completion percentage
 */
export const getCompletionPercentage = (total, completed) => {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
};

/**
 * Counts the number of completed videos in a list
 * @param {Array} videos - Array of video objects
 * @param {Object} completedVideos - Object mapping video IDs to completion status
 * @returns {number} Number of completed videos
 */
export const getCompletedVideosCount = (videos, completedVideos) => {
  if (!videos || !completedVideos) return 0;
  return videos.filter(video => completedVideos[video.id]).length;
};

/**
 * Checks if all videos in the roadmap are completed
 * @param {Object} roadmap - Roadmap object
 * @param {Object} completedVideos - Object mapping video IDs to completion status
 * @returns {boolean} Whether all videos are completed
 */
export const checkAllVideosCompleted = (roadmap, completedVideos) => {
  if (!roadmap || !completedVideos) return false;
  
  let totalVideos = 0;
  let completedCount = 0;

  roadmap.sections.forEach(section => {
    section.topics.forEach(topic => {
      if (topic.video?.videos) {
        topic.video.videos.forEach(video => {
          totalVideos++;
          if (completedVideos[video.id]) {
            completedCount++;
          }
        });
      }
    });
  });

  return totalVideos > 0 && totalVideos === completedCount;
};

/**
 * Groups sections by shared resources
 * @param {Array} sections - Array of section objects
 * @returns {Array} Array of grouped sections
 */
export const groupSectionsBySharedResources = (sections) => {
  // Create a map of resources by URL to identify shared resources
  const resourcesByUrl = new Map();
  
  // First pass: collect all resources by URL
  sections.forEach((section, sectionIndex) => {
    section.topics.forEach(topic => {
      if (topic.video?.videos) {
        topic.video.videos.forEach(video => {
          if (!resourcesByUrl.has(video.url)) {
            resourcesByUrl.set(video.url, []);
          }
          resourcesByUrl.get(video.url).push({
            sectionIndex,
            sectionTitle: section.title,
            topicTitle: topic.title
          });
        });
      }
    });
  });
  
  // Find sections that share resources
  const sectionGroups = [];
  const processedSections = new Set();
  
  sections.forEach((section, sectionIndex) => {
    if (processedSections.has(sectionIndex)) return;
    
    // Find all sections that share resources with this one
    const sharedSections = new Set([sectionIndex]);
    
    section.topics.forEach(topic => {
      if (topic.video?.videos) {
        topic.video.videos.forEach(video => {
          const sharedResources = resourcesByUrl.get(video.url);
          if (sharedResources && sharedResources.length > 1) {
            sharedResources.forEach(resource => {
              if (resource.sectionIndex !== sectionIndex) {
                sharedSections.add(resource.sectionIndex);
              }
            });
          }
        });
      }
    });
    
    // Create a combined section or add as is
    if (sharedSections.size > 1) {
      const sharedSectionsArray = Array.from(sharedSections);
      const combinedSection = {
        title: sharedSectionsArray
          .map(index => sections[index].title)
          .join(' & '),
        technologies: sharedSectionsArray.map(index => ({
          title: sections[index].title,
          description: sections[index].description
        })),
        // Use the first section's topics since they share resources
        topics: sections[sharedSectionsArray[0]].topics.map(topic => {
          // Add sharedWith information to videos if available
          if (topic.video?.videos) {
            const updatedVideos = topic.video.videos.map(video => {
              const sharedResources = resourcesByUrl.get(video.url);
              if (sharedResources && sharedResources.length > 1) {
                return {
                  ...video,
                  sharedWith: sharedResources
                    .filter(r => r.sectionIndex !== sharedSectionsArray[0])
                    .map(r => r.sectionTitle)
                };
              }
              return video;
            });
            
            return {
              ...topic,
              video: {
                ...topic.video,
                videos: updatedVideos
              }
            };
          }
          return topic;
        }),
        originalIndices: sharedSectionsArray
      };
      sectionGroups.push(combinedSection);
      sharedSections.forEach(index => processedSections.add(index));
    } else {
      // Add section as is, but enhance with sharedWith information
      const enhancedSection = {
        ...section,
        technologies: [{
          title: section.title,
          description: section.description
        }],
        topics: section.topics.map(topic => {
          if (topic.video?.videos) {
            const updatedVideos = topic.video.videos.map(video => {
              const sharedResources = resourcesByUrl.get(video.url);
              if (sharedResources && sharedResources.length > 1) {
                return {
                  ...video,
                  sharedWith: sharedResources
                    .filter(r => r.sectionIndex !== sectionIndex)
                    .map(r => r.sectionTitle)
                };
              }
              return video;
            });
            
            return {
              ...topic,
              video: {
                ...topic.video,
                videos: updatedVideos
              }
            };
          }
          return topic;
        }),
        originalIndices: [sectionIndex]
      };
      sectionGroups.push(enhancedSection);
      processedSections.add(sectionIndex);
    }
  });

  return sectionGroups;
}; 