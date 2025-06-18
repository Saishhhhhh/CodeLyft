import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { updateRoadmapProgress } from '../services/roadmapService';
import { saveRoadmapProgress } from '../utils/progressUtils';

export const useVideoProcessing = (roadmap, fromSaved, id) => {
  const [completedVideos, setCompletedVideos] = useState({});
  const [videoNotes, setVideoNotes] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);

  const processVideoData = useCallback((topic) => {
    if (!topic || !topic.video || !topic.video.videos) return topic;
    
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
    
    return topic;
  }, []);

  const findVideoParentTopic = useCallback((videoId) => {
    if (!roadmap || !roadmap.sections) {
      console.error('No roadmap or sections available');
      return null;
    }
    
    console.log(`Looking for parent topic of video: ${videoId}`);
    let foundTopic = null;
    
    try {
      // First try to find by exact ID match
      for (const section of roadmap.sections) {
        if (section.topics) {
          for (const topic of section.topics) {
            if (topic.video?.videos) {
              const video = topic.video.videos.find(v => 
                v.id === videoId || 
                v._id === videoId || 
                (v.url && v.url.includes(videoId))
              );
              if (video) {
                foundTopic = topic;
                break;
              }
            }
          }
        }
        if (foundTopic) break;
      }
      
      // If no exact match found, try to match by YouTube ID in the URL
      if (!foundTopic && videoId && videoId.length > 8) {
        for (const section of roadmap.sections) {
          if (section.topics) {
            for (const topic of section.topics) {
              if (topic.video?.videos) {
                for (const video of topic.video.videos) {
                  // Extract YouTube ID from URL if present
                  if (video.url) {
                    const urlMatch = video.url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
                    const youtubeId = urlMatch ? urlMatch[1] : null;
                    
                    if (youtubeId === videoId) {
                      foundTopic = topic;
                      break;
                    }
                  }
                }
                if (foundTopic) break;
              }
            }
          }
          if (foundTopic) break;
        }
      }
      
      // Handle MongoDB ObjectId format (24 hex characters)
      if (!foundTopic && videoId && videoId.length === 24 && /^[0-9a-f]{24}$/i.test(videoId)) {
        for (const section of roadmap.sections) {
          if (section.topics) {
            for (const topic of section.topics) {
              if (topic.video?.videos) {
                for (const video of topic.video.videos) {
                  // Check if any resource has this as _id
                  if (video._id === videoId || video.id === videoId) {
                    foundTopic = topic;
                    break;
                  }
                }
                if (foundTopic) break;
              }
            }
          }
          if (foundTopic) break;
        }
      }
      
      // Final check and debug
      if (foundTopic) {
        console.log(`Found topic: ${foundTopic.title}, _id: ${foundTopic._id}`);
        return foundTopic;
      } else {
        console.warn(`No parent topic found for video ID: ${videoId}`);
        return null;
      }
    } catch (error) {
      console.error('Error in findVideoParentTopic:', error);
      return null;
    }
  }, [roadmap]);

  const toggleVideoCompletion = useCallback(async (videoId) => {
    if (!roadmap || !roadmap.sections) {
      console.error('Cannot toggle video completion: Roadmap not loaded');
      toast.error('Please wait for the roadmap to load');
      return;
    }

    setIsProcessing(true);
    try {
      // Find the parent topic for this video
      const parentTopic = findVideoParentTopic(videoId);
      console.log(`Toggle completion for video: ${videoId}`);
      console.log(`Parent topic: ${parentTopic ? parentTopic.title : 'Not found'} (${parentTopic?._id})`);
      
      if (!parentTopic || !parentTopic._id) {
        console.error(`Could not find parent topic for video: ${videoId}`);
        toast.error('Error updating progress: Could not find the associated topic');
        return;
      }
      
      // Toggle completion status
      const newCompletedVideos = { ...completedVideos };
      
      if (newCompletedVideos[videoId]) {
        delete newCompletedVideos[videoId];
        // Show notification for unmarking a video as completed
        toast.success('Video marked as not completed', {
          icon: '❌',
          duration: 3000
        });
      } else {
        newCompletedVideos[videoId] = true;
        // Show notification for marking a video as completed
        toast.success('Video marked as completed', {
          icon: '✅',
          duration: 3000
        });
      }
      
      setCompletedVideos(newCompletedVideos);
      
      // Count completed videos for this topic
      const topicId = parentTopic._id;
      const topic = roadmap.sections.find(section => section._id === topicId);
      
      if (!topic || !topic.topics || !topic.topics[0] || !topic.topics[0].video || !topic.topics[0].video.videos) {
        console.error('Invalid topic structure');
        return;
      }
      
      const allTopicVideos = topic.topics[0].video.videos;
      const totalVideos = allTopicVideos.length;
      let completedCount = 0;
      
      // Count how many videos in this topic are marked as completed
      allTopicVideos.forEach(video => {
        if (newCompletedVideos[video.id] || newCompletedVideos[video._id]) {
          completedCount++;
        }
      });
      
      console.log(`Topic ${topic.title}: ${completedCount}/${totalVideos} videos completed`);
      
      // Update topic progress status
      const newProgress = completedCount === 0 ? 'not-started' : 
                          completedCount === totalVideos ? 'completed' : 'in-progress';
      
      // Update roadmap state with new progress
      const updatedSections = roadmap.sections.map(section => {
        if (section._id === topicId) {
          return {
            ...section,
            progress: newProgress
          };
        }
        return section;
      });
      
      // Save to server
      const completedResourceIds = Object.keys(newCompletedVideos).filter(id => newCompletedVideos[id]);
      
      // Format data for the API
      const updateData = {
        topicId: topicId,
        completedResources: completedCount,
        totalResources: totalVideos,
        completedResourceIds: completedResourceIds
      };
      
      console.log('Sending progress update to server:', updateData);
      
      try {
        // Call API to update progress
        const response = await updateRoadmapProgress(id, updateData);
        
        if (response.status === 200) {
          // Success, but don't show toast for every update
          console.log('Progress updated successfully');
        } else {
          console.error('Error updating progress:', response);
          toast.error('Failed to save your progress');
        }
      } catch (apiError) {
        console.error('API error updating progress:', apiError);
        
        // If the API call fails but we're in a newly created roadmap scenario,
        // save the progress locally until the next successful API call
        if (fromSaved) {
          console.log('Saving progress locally as fallback');
          saveRoadmapProgress({
            roadmapId: id,
            topicId: topicId,
            videoId: videoId,
            isCompleted: newCompletedVideos[videoId] || false
          });
        }
        
        toast.error('Failed to save progress to server. Changes saved locally.');
      }
    } catch (error) {
      console.error('Error toggling video completion:', error);
      toast.error('Failed to update progress');
    } finally {
      setIsProcessing(false);
    }
  }, [completedVideos, roadmap, fromSaved, id, findVideoParentTopic]);

  const saveNote = useCallback((videoId, note) => {
    if (!roadmap || !roadmap.sections) {
      console.error('Cannot save note: Roadmap not loaded');
      toast.error('Please wait for the roadmap to load');
      return;
    }

    setIsProcessing(true);
    try {
      setVideoNotes(prev => ({
        ...prev,
        [videoId]: note
      }));

      // If this is a saved roadmap, also save the note to the database
      if (fromSaved && id) {
        import('../services/roadmapService').then(({ saveVideoNotes }) => {
          saveVideoNotes(id, videoId, note)
            .then(response => {
              console.log('Note saved to database:', response);
            })
            .catch(error => {
              console.error('Error saving note to database:', error);
              // Note is already saved to localStorage as a fallback
            })
            .finally(() => {
              setIsProcessing(false);
            });
        });
      } else {
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('Error importing saveVideoNotes:', error);
      setIsProcessing(false);
    }
  }, [fromSaved, id, roadmap]);

  const deleteNote = useCallback((videoId) => {
    if (!roadmap || !roadmap.sections) {
      console.error('Cannot delete note: Roadmap not loaded');
      toast.error('Please wait for the roadmap to load');
      return;
    }

    setVideoNotes(prev => {
      const newNotes = { ...prev };
      delete newNotes[videoId];
      return newNotes;
    });
  }, [roadmap]);

  const getCompletedVideosCount = useCallback((section, completedVideos) => {
    return section.topics.reduce((count, topic) => {
      if (topic.video && topic.video.videos) {
        return count + topic.video.videos.filter(video => completedVideos[video.id]).length;
      }
      return count;
    }, 0);
  }, []);

  const getTotalVideosCount = useCallback((section) => {
    return section.topics.reduce((count, topic) => {
      if (topic.video && topic.video.videos) {
        return count + topic.video.videos.length;
      }
      return count;
    }, 0);
  }, []);

  const getCompletionPercentage = useCallback((section, completedVideos) => {
    const total = getTotalVideosCount(section);
    if (total === 0) return 0;
    return Math.round((getCompletedVideosCount(section, completedVideos) / total) * 100);
  }, [getCompletedVideosCount, getTotalVideosCount]);

  return {
    completedVideos,
    videoNotes,
    processVideoData,
    toggleVideoCompletion,
    saveNote,
    deleteNote,
    getCompletedVideosCount,
    getTotalVideosCount,
    getCompletionPercentage,
    setCompletedVideos,
    setVideoNotes,
    isProcessing
  };
}; 