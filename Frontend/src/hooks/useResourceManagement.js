import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { addYouTubeVideos, saveRoadmapWithResources } from '../services/youtubeResourceService';
import { saveRoadmapToJson } from '../services/exportService';

/**
 * Custom hook for managing YouTube resources in roadmaps
 * @returns {Object} Resource management state and functions
 */
const useResourceManagement = () => {
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [currentTopic, setCurrentTopic] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [foundResources, setFoundResources] = useState([]);
  const [showResourceLoadingModal, setShowResourceLoadingModal] = useState(false);
  const navigate = useNavigate();

  // Function to add YouTube videos to the roadmap
  const addYouTubeVideosToRoadmap = async (roadmap, roadmapWithUserResources = null, onSuccess = null) => {
    try {
      // Create callback object for the service function
      const callbacks = {
        setLoadingVideos,
        setError: () => {}, // This will be provided by the component
        setShowResourceLoadingModal,
        setFoundResources,
        setCurrentTopic,
        setProgressPercent,
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
                setShowResourceLoadingModal(false);
                navigate(`/roadmaps/${result.roadmapId}/resources`);
              }, 1500);
            }
          } catch (saveError) {
            console.error('Error saving roadmap:', saveError);
            
            // Save to JSON file as fallback
            saveRoadmapToJson(updatedRoadmap);
            
            // Close modal after a short delay
            setTimeout(() => {
              setShowResourceLoadingModal(false);
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
      setShowResourceLoadingModal(false);
      setLoadingVideos(false);
      // Error will be handled by the component
      throw error;
    }
  };

  return {
    loadingVideos,
    currentTopic,
    progressPercent,
    foundResources,
    showResourceLoadingModal,
    setLoadingVideos,
    setCurrentTopic,
    setProgressPercent,
    setFoundResources,
    setShowResourceLoadingModal,
    addYouTubeVideosToRoadmap
  };
};

export default useResourceManagement; 