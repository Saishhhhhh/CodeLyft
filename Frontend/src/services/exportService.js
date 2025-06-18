/**
 * Utility functions for exporting roadmaps and resources
 */
import { toast } from 'react-hot-toast';

/**
 * Save roadmap to JSON file as a fallback
 * @param {Object} roadmapData - The roadmap data to save
 */
export const saveRoadmapToJson = (roadmapData) => {
  try {
    const jsonData = JSON.stringify(roadmapData, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `roadmap_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('Roadmap saved to a file on your computer');
    console.log('Roadmap saved to JSON file');
  } catch (error) {
    console.error('Error saving roadmap to JSON file:', error);
    toast.error('Failed to save roadmap to file');
  }
};

/**
 * Save resources data to JSON file
 * @param {Object} roadmapData - The roadmap data containing resources
 */
export const saveResourcesToJson = async (roadmapData) => {
  try {
    const storedProgress = localStorage.getItem('roadmapProgress');
    const progressData = storedProgress ? JSON.parse(storedProgress) : {
      completedVideos: {},
      videoNotes: {}
    };

    const resourcesData = {
      timestamp: new Date().toISOString(),
      roadmapTitle: roadmapData.title,
      roadmapDescription: roadmapData.description,
      progress: {
        completedVideos: progressData.completedVideos || {},
        videoNotes: progressData.videoNotes || {}
      },
      resources: []
    };

    for (const section of roadmapData.sections) {
      for (const topic of section.topics) {
        if (topic.video) {
          const resource = {
            sectionTitle: section.title,
            topicTitle: topic.title,
            topicDescription: topic.description,
            resource: {
              title: topic.video.title,
              url: topic.video.url,
              channel: topic.video.channel,
              type: topic.video.isPlaylist ? 'playlist' : 'video',
              metadata: {
                ...(topic.video.isPlaylist ? {
                  videoCount: topic.video.videoCount,
                  avgViews: topic.video.avgViews,
                  quality: topic.video.quality,
                  rating: topic.video.rating,
                  directViewCount: topic.video.directViewCount,
                  directViewCountFormatted: topic.video.directViewCountFormatted
                } : {
                  views: topic.video.views,
                  likes: topic.video.likes,
                  rating: topic.video.rating,
                  fallback: topic.video.fallback
                })
              }
            }
          };

          if (topic.video.isPlaylist && topic.video.videos) {
            resource.resource.playlistVideos = topic.video.videos.map(video => ({
              id: video.id,
              title: video.title,
              url: video.url,
              channel: video.channel?.name || video.channel || 'Unknown',
              duration: video.duration_string || video.duration || 'Unknown',
              publishDate: video.publish_date || 'Unknown',
              completed: progressData.completedVideos[video.id] || false,
              notes: progressData.videoNotes[video.id] || ''
            }));
          } else if (!topic.video.isPlaylist) {
            resource.resource.completed = progressData.completedVideos[topic.video.id] || false;
            resource.resource.notes = progressData.videoNotes[topic.video.id] || '';
          }

          resourcesData.resources.push(resource);
        }
      }
    }

    const jsonString = JSON.stringify(resourcesData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `youtube_resources_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log('Resources data saved to JSON file');
  } catch (error) {
    console.error('Error saving resources to JSON:', error);
  }
}; 