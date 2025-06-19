import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { addYouTubeVideos, saveRoadmapWithResources } from '../services/youtubeResourceService';
import { saveRoadmapToJson } from '../services/exportService';
import { useResourceModal } from '../context/ResourceModalContext';

/**
 * Custom hook for managing YouTube resources in roadmaps
 * @returns {Object} Resource management state and functions
 */
const useResourceManagement = () => {
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [currentTopic, setCurrentTopic] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [foundResources, setFoundResources] = useState([]);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState('');
  const [currentPlaylist, setCurrentPlaylist] = useState('');
  const [currentVideo, setCurrentVideo] = useState('');
  const [totalTopics, setTotalTopics] = useState(0);
  const [processedTopics, setProcessedTopics] = useState(0);
  const navigate = useNavigate();
  const { updateModalData } = useResourceModal();

  // Function to reset the state
  const resetState = () => {
    setLoadingVideos(false);
    setCurrentTopic('');
    setProgressPercent(0);
    setFoundResources([]);
    setEstimatedTimeRemaining('');
    setCurrentPlaylist('');
    setCurrentVideo('');
    setTotalTopics(0);
    setProcessedTopics(0);
  };

  // Function to add YouTube videos to the roadmap
  const addYouTubeVideosToRoadmap = async (roadmap, roadmapWithUserResources = null, onSuccess = null) => {
    try {
      // Reset state before starting
      resetState();
      // Calculate total topics for time estimation
      const topicsToProcess = roadmapWithUserResources || roadmap;
      let totalTopicsCount = 0;
      topicsToProcess.sections.forEach(section => {
        section.topics.forEach(topic => {
          if (!topic.hasUserResource) {
            totalTopicsCount++;
          }
        });
      });
      setTotalTopics(totalTopicsCount);
      setProcessedTopics(0);
      // Create callback object for the service function
      const callbacks = {
        setLoadingVideos,
        setError: () => {}, // This will be provided by the component
        setShowResourceLoadingModal: () => {}, // Not needed with global modal
        setFoundResources: (resources) => {
          // Handle both function and direct value updates
          if (typeof resources === 'function') {
            const newResources = resources(foundResources);
            setFoundResources(newResources);
            updateModalData({ foundResources: newResources });
          } else {
            setFoundResources(resources);
            updateModalData({ foundResources: resources });
          }
        },
        setCurrentTopic: (topic) => {
          setCurrentTopic(topic);
          updateModalData({ currentTopic: topic });
        },
        setProgressPercent: (percent) => {
          setProgressPercent(percent);
          updateModalData({ progressPercent: percent });
        },
        setEstimatedTimeRemaining: (time) => {
          setEstimatedTimeRemaining(time);
          updateModalData({ estimatedTimeRemaining: time });
        },
        setCurrentPlaylist: (playlist) => {
          setCurrentPlaylist(playlist);
          updateModalData({ currentPlaylist: playlist });
        },
        setCurrentVideo: (video) => {
          setCurrentVideo(video);
          updateModalData({ currentVideo: video });
        },
        setProcessedTopics: (topics) => {
          setProcessedTopics(topics);
          updateModalData({ processedTopics: topics });
        },
        onComplete: async (updatedRoadmap) => {
          // Update the roadmap state via callback
          if (onSuccess) {
            onSuccess(updatedRoadmap);
          }
          // Store in localStorage
          localStorage.setItem('roadmapData', JSON.stringify(updatedRoadmap));
          try {
            // Make a direct API call to save the roadmap
            const result = await saveRoadmapWithResources(updatedRoadmap);
            if (result.success) {
              toast.success('Roadmap saved successfully!');
              // Close modal and navigate after a short delay to show 100% completion
              setTimeout(() => {
                updateModalData({
                  isProcessing: false,
                  isOpen: false,
                  isMinimized: false
                });
                localStorage.removeItem('resourceModalMinimized');
                localStorage.removeItem('resourceModalProcessing');
                navigate(`/roadmaps/${result.roadmapId}/resources`);
              }, 1500);
            }
          } catch (saveError) {
            console.error('Error saving roadmap:', saveError);
            // Save to JSON file as fallback
            saveRoadmapToJson(updatedRoadmap);
            // Close modal after a short delay
            setTimeout(() => {
              updateModalData({
                isProcessing: false,
                isOpen: false,
                isMinimized: false
              });
              localStorage.removeItem('resourceModalMinimized');
              localStorage.removeItem('resourceModalProcessing');
              toast.error('Could not save to database. Roadmap saved locally.');
            }, 1500);
          }
        }
      };
      // Call the service function with the appropriate roadmap and callbacks
      await addYouTubeVideos(
        roadmapWithUserResources || roadmap,
        { skipUserProvided: true },
        callbacks
      );
    } catch (error) {
      console.error('Error in addYouTubeVideosToRoadmap:', error);
      // Handle other errors
      toast.error('Failed to add YouTube resources. Please try again.');
      updateModalData({
        isProcessing: false,
        isOpen: false,
        isMinimized: false
      });
      localStorage.removeItem('resourceModalMinimized');
      localStorage.removeItem('resourceModalProcessing');
      setLoadingVideos(false);
    }
  };

  return {
    loadingVideos,
    currentTopic,
    progressPercent,
    foundResources,
    estimatedTimeRemaining,
    currentPlaylist,
    currentVideo,
    totalTopics,
    processedTopics,
    addYouTubeVideosToRoadmap,
    resetState
  };
};

export default useResourceManagement; 