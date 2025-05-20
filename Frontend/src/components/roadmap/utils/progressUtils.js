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
  const resourceMap = new Map();
  const sectionGroups = [];
  const processedSections = new Set();

  // First, find all shared resources across sections
  sections.forEach((section, sectionIndex) => {
    section.topics.forEach(topic => {
      if (topic.video && topic.video.url) {
        const resourceKey = topic.video.url;
        if (!resourceMap.has(resourceKey)) {
          resourceMap.set(resourceKey, []);
        }
        resourceMap.get(resourceKey).push(sectionIndex);
      }
    });
  });

  // Group sections that share resources
  sections.forEach((section, sectionIndex) => {
    if (processedSections.has(sectionIndex)) return;

    // Find all sections that share resources with this section
    const sharedSections = new Set([sectionIndex]);
    section.topics.forEach(topic => {
      if (topic.video && topic.video.url) {
        const resourceKey = topic.video.url;
        resourceMap.get(resourceKey)?.forEach(otherIndex => {
          if (otherIndex !== sectionIndex) {
            sharedSections.add(otherIndex);
          }
        });
      }
    });

    // Create a combined section
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
        topics: sections[sharedSectionsArray[0]].topics,
        originalIndices: sharedSectionsArray
      };
      sectionGroups.push(combinedSection);
      sharedSections.forEach(index => processedSections.add(index));
    } else {
      sectionGroups.push({
        ...section,
        technologies: [{
          title: section.title,
          description: section.description
        }],
        originalIndices: [sectionIndex]
      });
      processedSections.add(sectionIndex);
    }
  });

  return sectionGroups;
}; 