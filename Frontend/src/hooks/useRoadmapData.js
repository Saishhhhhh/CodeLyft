import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateRoadmapWithRetry } from '../services/groqService';
import { getRoadmap } from '../services/roadmapService';
import { getCustomRoadmap } from '../services/customRoadmapService';
import { toast } from 'react-hot-toast';
import { saveRoadmapToDatabase } from '../services/roadmapService';
import { saveRoadmapToJson } from '../services/exportService';

/**
 * Custom hook for fetching and managing roadmap data
 * @param {Object} options Configuration options
 * @returns {Object} Roadmap data and related state
 */
const useRoadmapData = ({
  fromSaved = false,
  isCustom: initialIsCustom = false,
  id = null,
  isAuthenticated = false,
}) => {
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [savedToDB, setSavedToDB] = useState(false);
  const [savingToDB, setSavingToDB] = useState(false);
  const [isCustom, setIsCustom] = useState(initialIsCustom);
  const navigate = useNavigate();

  // Fetch saved roadmap or generate a new one
  useEffect(() => {
    if (fromSaved) {
      // Loading an existing roadmap from the database
      const fetchSavedRoadmap = async () => {
        try {
          setLoading(true);
          // Redirect if not authenticated
          if (!isAuthenticated) {
            navigate('/login');
            return;
          }
          
          if (!id) {
            setError('Roadmap ID is missing');
            setLoading(false);
            return;
          }
          
          let response;
          try {
            if (isCustom) {
              // If it's a custom roadmap, use the custom roadmap service
              console.log('Fetching custom roadmap with ID:', id);
              response = await getCustomRoadmap(id);
            } else {
              // Otherwise use the regular roadmap service
              console.log('Fetching standard roadmap with ID:', id);
              response = await getRoadmap(id);
            }
          } catch (fetchError) {
            console.error(`Error with initial fetch method, trying alternative:`, fetchError);
            // If the first attempt fails, try the other method as fallback
            if (isCustom) {
              console.log('Fallback: Trying to fetch as standard roadmap instead');
              response = await getRoadmap(id);
            } else {
                          console.log('Fallback: Trying to fetch as custom roadmap instead');
            response = await getCustomRoadmap(id);
            // If we successfully fetch with the custom roadmap service, mark it as custom
            if (response && response.data) {
              setIsCustom(true);
              console.log('Setting isCustom to true after successful custom roadmap fetch');
            }
            }
          }
          
          const roadmapData = response.data;
          console.log('Raw roadmap data received:', roadmapData);
          
          // Format the data to match the expected structure for RoadmapResultPage
          const formattedRoadmap = {
            title: isCustom ? roadmapData.name || roadmapData.title : roadmapData.title,
            name: roadmapData.name, // Preserve original name field for custom roadmaps
            description: roadmapData.description,
            sections: roadmapData.topics.map(topic => ({
              title: topic.title,
              description: topic.description || '',
              difficulty: topic.difficulty || (roadmapData.difficulty === 'Beginner' ? 'beginner' : 
                          roadmapData.difficulty === 'Advanced' ? 'advanced' : 'intermediate'),
              topics: [{ 
                title: topic.title, 
                description: topic.description || ''
              }]
            })),
            advancedTopics: roadmapData.advancedTopics || [],
            projects: roadmapData.projects || [],
            isCustom: roadmapData.isCustom || isCustom // Make sure to preserve the isCustom flag
          };
          
          console.log('Formatted roadmap:', formattedRoadmap);
          console.log('Custom roadmap title should be:', isCustom ? roadmapData.name || roadmapData.title : roadmapData.title);
          
          setRoadmap(formattedRoadmap);
          setSavedToDB(true); // This roadmap is already saved
          setLoading(false);
        } catch (error) {
          console.error('Error fetching saved roadmap:', error);
          setError('Failed to load the roadmap. Please try again.');
          setLoading(false);
        }
      };
      
      fetchSavedRoadmap();
    } else {
      // Normal flow - generate roadmap from localStorage data
      const generateRoadmap = async () => {
        try {
          setLoading(true);
          const storedData = localStorage.getItem('roadmapData');
          if (!storedData) {
            navigate('/');
            return;
          }

          const data = JSON.parse(storedData);
          console.log('Roadmap data from localStorage:', data);
          
          const result = await generateRoadmapWithRetry(data);
          console.log('Generated roadmap result:', result);
          
          // Transform the mainPath into sections format that LearningPath component expects
          const transformedResult = {
            ...result,
            sections: result.mainPath.map(item => ({
              title: item.title,
              description: item.description,
              difficulty: item.difficulty,
              topics: [{ title: item.title, description: item.description }]
            })),
            isCustom: result.isCustom || false
          };
          
          // Set the roadmap state
          setRoadmap(transformedResult);
          setError(null);
          setLoading(false);
          
          // Check if the roadmap has resources after setting it
          const hasResourcesInResult = result.sections?.some(section => 
            section.topics?.some(topic => 
              topic.video?.videos && topic.video.videos.length > 0
            )
          );
          
          // Automatically save the roadmap if it has resources and the user is authenticated
          if (hasResourcesInResult && isAuthenticated && !savedToDB && !savingToDB) {
            setTimeout(async () => {
              try {
                setSavingToDB(true);
                const savedResult = await saveRoadmapToDatabase({
                  ...result,
                  isCustom: result.isCustom || isCustom || false
                });
                if (savedResult) {
                  setSavedToDB(true);
                  toast.success('Roadmap saved to your account');
                }
              } catch (error) {
                console.error('Error auto-saving roadmap:', error);
                toast.error(error.message || 'Failed to save roadmap');
                // Save to JSON file as fallback
                saveRoadmapToJson(result);
              } finally {
                setSavingToDB(false);
              }
            }, 1000);
          }
        } catch (error) {
          console.error('Failed to generate roadmap after all retries:', error);
          setError('We were unable to generate a roadmap after several attempts. Please try again later.');
          localStorage.removeItem('roadmapData');
          setLoading(false);
        }
      };
      
      generateRoadmap();
    }
  }, [fromSaved, id, isAuthenticated, navigate, isCustom]);

  // Function to check if the roadmap has resources
  const hasResources = roadmap && roadmap.sections
    ? roadmap.sections.some(section => {
        return section.topics?.some(topic => 
          topic.video?.videos && topic.video.videos.length > 0
        );
      })
    : false;

  // Function to handle saving the roadmap
  const saveRoadmap = async () => {
    try {
      setSavingToDB(true);
      const savedResult = await saveRoadmapToDatabase({
        ...roadmap,
        isCustom: roadmap.isCustom || isCustom || false
      });
      if (savedResult) {
        setSavedToDB(true);
        toast.success('Roadmap saved to your account');
      }
      return savedResult;
    } catch (error) {
      console.error('Error saving roadmap:', error);
      toast.error(error.message || 'Failed to save roadmap');
      // Save to JSON file as fallback
      saveRoadmapToJson(roadmap);
      return null;
    } finally {
      setSavingToDB(false);
    }
  };

  // Function to handle retrying roadmap generation
  const handleRetry = () => {
    setLoading(true);
    setError(null);
    setRetryCount(prev => prev + 1);
    window.location.reload();
  };

  return {
    roadmap,
    setRoadmap,
    loading,
    error,
    retryCount,
    savedToDB,
    savingToDB,
    setSavedToDB,
    setSavingToDB,
    hasResources,
    saveRoadmap,
    handleRetry,
    isCustom,
    setIsCustom
  };
};

export default useRoadmapData; 