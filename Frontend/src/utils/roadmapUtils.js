export const groupSectionsBySharedResources = (sections) => {
  if (!sections || !Array.isArray(sections)) return [];
  
  return sections.map(section => {
    // If the section has shared resources, group them
    if (section.sharedResources && section.sharedResources.length > 0) {
      return {
        ...section,
        topics: section.topics.map(topic => ({
          ...topic,
          sharedResources: section.sharedResources
        }))
      };
    }
    return section;
  });
}; 