import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import HeroAnimation from '../components/HeroAnimation';
import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';
import { 
  FaArrowLeft, FaCalendarAlt, FaCheck, FaPlay, 
  FaBookmark, FaEdit, FaEye, FaFileDownload, FaFileExport, FaSave
} from 'react-icons/fa';
import { 
  saveRoadmapProgress, 
  loadRoadmapProgress, 
  getCompletedVideos,
  getRoadmap,
  downloadRoadmap,
  saveGeneratedRoadmap
} from '../services/roadmapService';
import { toast } from 'react-hot-toast';
import VideoPlayerModal from '../components/roadmap/modals/VideoPlayerModal';
import NotesModal from '../components/roadmap/modals/NotesModal';
import { decodeUnicode, formatDuration, getChannelName } from '../components/roadmap/utils/videoUtils';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

// Import our components
import SectionHeader from '../components/roadmap/sections/SectionHeader';
import TopicSection from '../components/roadmap/sections/TopicSection';
import CelebrationModal from '../components/roadmap/modals/CelebrationModal';

// Import utility functions
import { triggerCelebration } from '../components/roadmap/utils/celebrationUtils';
import { checkAllVideosCompleted, groupSectionsBySharedResources } from '../components/roadmap/utils/progressUtils';

const RoadmapProgressPage = ({ fromSaved = false }) => {
  const navigate = useNavigate();
  const { id } = useParams(); // Get roadmap ID from URL for fromSaved mode
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState({});
  const [completedVideos, setCompletedVideos] = useState({});
  const [videoNotes, setVideoNotes] = useState({});
  const [noteTimestamps, setNoteTimestamps] = useState({});
  const [editingNote, setEditingNote] = useState(null);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [currentNote, setCurrentNote] = useState('');
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [error, setError] = useState(null);
  const [savingToDB, setSavingToDB] = useState(false);
  const [savedToDB, setSavedToDB] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const [progressSummary, setProgressSummary] = useState({
    total: 0,
    completed: 0,
    percentage: 0
  });

  // Check if the roadmap has resources
  const hasResources = useMemo(() => {
    if (!roadmap || !roadmap.sections) return false;
    
    return roadmap.sections.some(section => {
      return section.topics?.some(topic => 
        topic.video?.videos && topic.video.videos.length > 0
      );
    });
  }, [roadmap]);

  useEffect(() => {
    if (fromSaved) {
      // Loading an existing roadmap from the database
      const fetchSavedRoadmap = async () => {
        try {
          setLoading(true);
          
          if (!id) {
            setError('Roadmap ID is missing');
            setLoading(false);
            return;
          }
          
          const response = await getRoadmap(id);
          const roadmapData = response.data;
          
          // Check if this roadmap has any topics with resources
          const hasResources = roadmapData.topics.some(topic => 
            topic.hasGeneratedResources && topic.resources && topic.resources.length > 0
          );
          
          if (!hasResources) {
            // Redirect to the view page if no resources available
            navigate(`/roadmaps/${id}/view`);
            return;
          }
          
          // First, create a map of resources by URL to identify shared resources
          const resourcesByUrl = new Map();
          roadmapData.topics.forEach(topic => {
            if (topic.resources && topic.resources.length > 0) {
              topic.resources.forEach(resource => {
                if (!resourcesByUrl.has(resource.url)) {
                  resourcesByUrl.set(resource.url, []);
                }
                resourcesByUrl.get(resource.url).push({
                  topicId: topic._id,
                  topicTitle: topic.title,
                  resource
                });
              });
            }
          });
          
          // Convert to format expected by RoadmapProgressPage
          const formattedRoadmap = {
            title: roadmapData.title,
            description: roadmapData.description,
            sections: roadmapData.topics.map(topic => {
              // Create a topic with videos from resources
              const videos = topic.resources ? topic.resources.map(resource => ({
                id: resource._id || `resource-${Math.random().toString(36).substring(2, 9)}`,
                title: resource.title,
                url: resource.url,
                channel: resource.source || 'YouTube',
                duration: resource.duration ? formatDuration(resource.duration) : 'Unknown',
                description: resource.description || '',
                thumbnail: resource.thumbnailUrl || `https://via.placeholder.com/120x68?text=${encodeURIComponent(resource.title)}`,
                sharedWith: resourcesByUrl.get(resource.url)?.length > 1 ? 
                  resourcesByUrl.get(resource.url)
                    .filter(item => item.topicId !== topic._id)
                    .map(item => item.topicTitle) : 
                  []
              })) : [];
              
              return {
                title: topic.title,
                description: topic.description,
                progress: topic.progress,
                topics: [{
                  title: topic.title,
                  description: topic.description,
                  video: {
                    title: topic.title,
                    isPlaylist: true,
                    videos: videos,
                    url: videos.length > 0 ? videos[0].url : null
                  }
                }]
              };
            })
          };
          
          setRoadmap(formattedRoadmap);
          
          // Load progress data
          const savedProgress = localStorage.getItem('roadmapProgress');
          if (savedProgress) {
            const progressData = JSON.parse(savedProgress);
            setCompletedVideos(progressData.completedVideos || {});
            setVideoNotes(progressData.videoNotes || {});
          }
          
          setLoading(false);
        } catch (error) {
          console.error('Error fetching saved roadmap:', error);
          setError('Failed to load the roadmap with resources. Please try again.');
          setLoading(false);
        }
      };
      
      fetchSavedRoadmap();
    } else {
      // Original code for loading from localStorage
      const loadRoadmap = () => {
        try {
          setLoading(true);
          const storedRoadmap = localStorage.getItem('roadmapData');
          
          if (!storedRoadmap) {
            navigate('/');
            return;
          }
          
          const roadmapData = JSON.parse(storedRoadmap);
          setRoadmap(roadmapData);
          
          // Load progress data
          const savedProgress = localStorage.getItem('roadmapProgress');
          if (savedProgress) {
            const progressData = JSON.parse(savedProgress);
            setCompletedVideos(progressData.completedVideos || {});
            setVideoNotes(progressData.videoNotes || {});
          }
          
          setLoading(false);
        } catch (error) {
          console.error('Error loading roadmap data:', error);
          setError('Failed to load roadmap data. Please try again.');
          setLoading(false);
        }
      };
      
      loadRoadmap();
    }
  }, [navigate, id, fromSaved]);

  useEffect(() => {
    if (fromSaved && id && isAuthenticated) {
      // Load notes from the database for saved roadmaps
      import('../services/roadmapService').then(({ getVideoNotes }) => {
        getVideoNotes(id)
          .then(response => {
            if (response.success && response.data && response.data.notes) {
              console.log('Notes loaded from database:', response.data.notes);
              setVideoNotes(prev => ({
                ...prev,
                ...response.data.notes
              }));
              
              // Set timestamps for all notes
              const timestamps = {};
              Object.keys(response.data.notes).forEach(videoId => {
                timestamps[videoId] = response.data.timestamps?.[videoId] || new Date().toISOString();
              });
              
              setNoteTimestamps(prev => ({
                ...prev,
                ...timestamps
              }));
            }
          })
          .catch(error => {
            console.error('Error loading notes from database:', error);
            // Notes are already loaded from localStorage as a fallback
          });
      });
    }
  }, [fromSaved, id, isAuthenticated]);

  // Save progress to localStorage whenever it changes
  useEffect(() => {
    if (roadmap) {
      localStorage.setItem('roadmapProgress', JSON.stringify({
        completedVideos,
        videoNotes,
        noteTimestamps
      }));
    }
  }, [completedVideos, videoNotes, noteTimestamps, roadmap]);

  // Event handlers
  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const toggleVideoCompletion = (videoId) => {
    setCompletedVideos(prev => {
      const newCompletedVideos = {
      ...prev,
      [videoId]: !prev[videoId]
      };
      
      // Check for completion after state update
      setTimeout(() => {
        const allCompleted = checkAllVideosCompleted(roadmap, newCompletedVideos);
        if (allCompleted && !showCelebration) {
          triggerCelebration(setShowCelebration);
        }
      }, 0);
      
      return newCompletedVideos;
    });
  };

  const openNoteModal = (videoId) => {
    setEditingNote(videoId);
    setCurrentNote(videoNotes[videoId] || '');
    setNoteModalOpen(true);
  };

  const closeNoteModal = () => {
    setNoteModalOpen(false);
    setEditingNote(null);
    setCurrentNote('');
  };

  const saveNote = () => {
    if (editingNote) {
      const timestamp = new Date().toISOString();
      setVideoNotes(prev => ({
        ...prev,
        [editingNote]: currentNote
      }));
      setNoteTimestamps(prev => ({
        ...prev,
        [editingNote]: timestamp
      }));

      // If this is a saved roadmap, also save the note to the database
      if (fromSaved && id) {
        try {
          import('../services/roadmapService').then(({ saveVideoNotes }) => {
            saveVideoNotes(id, editingNote, currentNote)
              .then(response => {
                console.log('Note saved to database:', response);
              })
              .catch(error => {
                console.error('Error saving note to database:', error);
                // Note is already saved to localStorage as a fallback
              });
          });
        } catch (error) {
          console.error('Error importing saveVideoNotes:', error);
        }
      }
    }
    closeNoteModal();
  };

  const deleteNote = () => {
    if (editingNote) {
      setVideoNotes(prev => {
        const newNotes = { ...prev };
        delete newNotes[editingNote];
        return newNotes;
      });
      setNoteTimestamps(prev => {
        const newTimestamps = { ...prev };
        delete newTimestamps[editingNote];
        return newTimestamps;
      });
    }
    closeNoteModal();
  };

  const getCompletionPercentage = (section, completedVideos) => {
    if (!section?.topics) return 0;
    
    let totalVideos = 0;
    let completedCount = 0;
    
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
    
    if (totalVideos === 0) return 0;
    return Math.round((completedCount / totalVideos) * 100);
  };

  const getCompletedVideosCount = (section, completedVideos) => {
    if (!section?.topics) return 0;
    
    let count = 0;
    section.topics.forEach(topic => {
      if (topic.video?.videos) {
        topic.video.videos.forEach(video => {
          if (completedVideos[video.id]) {
            count++;
          }
        });
      }
    });
    
    return count;
  };

  const getTotalVideosCount = (section) => {
    if (!section?.topics) return 0;
    
    let count = 0;
    section.topics.forEach(topic => {
      if (topic.video?.videos) {
        count += topic.video.videos.length;
      }
    });
    
    return count;
  };

  const openVideoModal = (video) => {
    // Make sure we have a valid video object with all required properties
    const processedVideo = {
      ...video,
      // Ensure URL is properly formatted
      url: video.url ? video.url.trim() : video.url,
      // Ensure title exists
      title: video.title || 'Video',
      // Ensure channel exists
      channel: video.channel || 'Unknown'
    };
    
    console.log('Opening video modal with:', processedVideo);
    setCurrentVideo(processedVideo);
    setVideoModalOpen(true);
  };

  const closeVideoModal = () => {
    setVideoModalOpen(false);
    setCurrentVideo(null);
  };

  const handlePlaylistClick = (playlistUrl) => {
    if (playlistUrl) {
      window.open(playlistUrl, '_blank');
    }
  };

  // Add export roadmap function
  const handleExportRoadmap = () => {
    if (!roadmap) return;
    
    try {
      // Format the roadmap data for export in the format expected by downloadRoadmap
      const formattedRoadmap = {
        title: roadmap.title,
        description: roadmap.description,
        category: roadmap.category || 'Web Development',
        difficulty: roadmap.difficulty || 'Intermediate',
        topics: roadmap.sections.map(section => ({
          title: section.title,
          description: section.description,
          resources: section.topics?.[0]?.video?.videos?.map(video => {
            // Parse duration using the formatDuration utility
            let durationInSeconds = 0;
            if (video.duration) {
              if (typeof video.duration === 'string' && video.duration.includes(':')) {
                const parts = video.duration.split(':');
                if (parts.length === 3) {
                  // Handle HH:MM:SS format
                  durationInSeconds = parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
                } else if (parts.length === 2) {
                  // Handle MM:SS format
                  durationInSeconds = parseInt(parts[0]) * 60 + parseInt(parts[1]);
                } else {
                  // Handle single number (seconds)
                  durationInSeconds = parseInt(parts[0]);
                }
              } else if (typeof video.duration === 'number') {
                durationInSeconds = video.duration;
              }
            }
            
            return {
              title: video.title,
              url: video.url,
              type: 'video',
              description: video.description || '',
              thumbnailUrl: video.thumbnail || '',
              source: video.channel || 'YouTube',
              duration: durationInSeconds,
              isRequired: true
            };
          }) || []
        }))
      };
      
      const result = downloadRoadmap(formattedRoadmap);
      if (result.success) {
        toast.success('Roadmap exported successfully');
      } else {
        toast.error('Failed to export roadmap');
      }
    } catch (error) {
      console.error('Error exporting roadmap:', error);
      toast.error('Failed to export roadmap');
    }
  };

  // Auto-save roadmap with resources when component mounts
  useEffect(() => {
    // Only run this once when the component mounts and if not already saved
    if (hasResources && isAuthenticated && !fromSaved && !savedToDB && !savingToDB) {
      console.log('Auto-saving roadmap with resources...');
      saveRoadmapToDatabase();
    }
  }, [hasResources, isAuthenticated, fromSaved, savedToDB, savingToDB]);

  // Add save to database function
  const saveRoadmapToDatabase = async () => {
    if (!roadmap) return;
    
    // Prevent duplicate saves
    if (savedToDB) {
      toast.success('Roadmap already saved to your account');
      return;
    }
    
    if (savingToDB) {
      toast.info('Currently saving roadmap...');
      return;
    }
    
    try {
      setSavingToDB(true);
      
      // Check if user is authenticated
      if (!isAuthenticated) {
        toast.error('Please log in to save your roadmap');
        setSavingToDB(false);
        return;
      }
      
      // Format the roadmap data for saving to the database
      const formattedRoadmap = {
        title: roadmap.title,
        description: roadmap.description,
        category: roadmap.category || 'Web Development',
        difficulty: roadmap.difficulty || 'Intermediate',
        topics: roadmap.sections?.map(section => {
          // Check if this section has video resources
          const hasResources = section.topics?.[0]?.video?.videos && section.topics[0].video.videos.length > 0;
          
          return {
            title: section.title,
            description: section.description,
            hasGeneratedResources: hasResources,
            resources: hasResources ? section.topics[0].video.videos.map(video => {
              // Safely parse duration
              let durationInSeconds = 0;
              if (video.duration) {
                if (typeof video.duration === 'string' && video.duration.includes(':')) {
                  const parts = video.duration.split(':');
                  if (parts.length === 3) {
                    // Handle HH:MM:SS format
                    durationInSeconds = parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
                  } else if (parts.length === 2) {
                    // Handle MM:SS format
                    durationInSeconds = parseInt(parts[0]) * 60 + parseInt(parts[1]);
                  } else {
                    // Handle single number (seconds)
                    durationInSeconds = parseInt(parts[0]);
                  }
                } else if (typeof video.duration === 'number') {
                  durationInSeconds = video.duration;
                }
              }
              
              return {
                title: video.title,
                url: video.url,
                type: 'video',
                description: video.description || '',
                thumbnailUrl: video.thumbnail || '',
                source: video.channel || 'YouTube',
                duration: durationInSeconds,
                isRequired: true
              };
            }) : []
          };
        }) || []
      };
      
      console.log('Saving roadmap to database:', formattedRoadmap);
      const response = await saveGeneratedRoadmap(formattedRoadmap);
      console.log('Roadmap saved to database:', response);
      
      toast.success('Roadmap saved to your account');
      setSavedToDB(true);
    } catch (error) {
      console.error('Error saving roadmap to database:', error);
      toast.error('Failed to save roadmap to your account');
    } finally {
      setSavingToDB(false);
    }
  };

  useEffect(() => {
    if (roadmap && roadmap.sections) {
      // Process all videos to ensure channel info is properly formatted
      const processedRoadmap = {
        ...roadmap,
        sections: roadmap.sections.map(section => {
          if (section.topics) {
            return {
              ...section,
              topics: section.topics.map(topic => {
                if (topic.video && topic.video.videos) {
                  // Process channel information for each video
                  const processedVideos = topic.video.videos.map(video => {
                    // Ensure channel is a string
                    let channel = 'Unknown';
                    if (typeof video.channel === 'string') {
                      channel = video.channel;
                    } else if (video.channel && typeof video.channel === 'object' && video.channel.name) {
                      channel = video.channel.name;
                    }
                    
                    return {
                      ...video,
                      channel
                    };
                  });
                  
                  // Also process the playlist channel
                  let playlistChannel = 'Unknown';
                  if (typeof topic.video.channel === 'string') {
                    playlistChannel = topic.video.channel;
                  } else if (topic.video.channel && typeof topic.video.channel === 'object' && topic.video.channel.name) {
                    playlistChannel = topic.video.channel.name;
                  } else if (processedVideos.length > 0 && processedVideos[0].channel) {
                    playlistChannel = processedVideos[0].channel;
                  }
                  
                  return {
                    ...topic,
                    video: {
                      ...topic.video,
                      channel: playlistChannel,
                      videos: processedVideos
                    }
                  };
                }
                return topic;
              })
            };
          }
          return section;
        })
      };
      
      setRoadmap(processedRoadmap);
    }
  }, [roadmap?.title]); // Only run once when roadmap is first loaded

  // Loading state
  if (loading || !roadmap) {
    return (
      <div className="min-h-screen relative overflow-hidden" style={{ background: 'linear-gradient(to bottom, #FFF7ED, #FFFFFF)' }}>
        <Navbar />
        <HeroAnimation />
        <div className="max-w-3xl mx-auto px-4 pt-24 pb-16">
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mb-4"></div>
              <p className="text-gray-600 font-mukta">Loading your roadmap...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'linear-gradient(to bottom, #FFF7ED, #FFFFFF)' }}>
      <Navbar />
      <HeroAnimation />
      <div className="max-w-5xl mx-auto px-4 pt-24 pb-16">
        <div className="bg-white p-8 rounded-xl shadow-lg">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div className="text-center flex-1">
              <h1 className="text-4xl font-bold mb-4 font-poppins" style={{
                background: 'linear-gradient(to right, #EA580C, #9333EA)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                {roadmap.title}
              </h1>
              <p className="text-xl text-gray-600 mb-4 font-mukta">
                {roadmap.description}
              </p>
            </div>
          </div>

          {/* Saving to DB notification */}
          {(savedToDB || savingToDB) && (
            <div className="mb-8 flex justify-center">
              <div className="w-full max-w-2xl">
                <div className={`flex items-center justify-center ${savingToDB ? 'text-blue-600 bg-blue-50 border-blue-200' : 'text-green-600 bg-green-50 border-green-200'} font-medium p-3 rounded-lg shadow-sm border`}>
                  {savingToDB ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving your roadmap...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Roadmap saved to your account
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Learning Path */}
          <div className="space-y-8">
            {groupSectionsBySharedResources(roadmap.sections).map((section, sectionIndex) => (
                <div key={sectionIndex} className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* Section Header */}
                <SectionHeader
                  title={`Step ${sectionIndex + 1}: ${section.title.replace(/^Complete\s+/i, '')}`}
                  description={section.technologies?.[0]?.description}
                  completedCount={getCompletedVideosCount(section, completedVideos)}
                  totalCount={getTotalVideosCount(section)}
                  completionPercentage={getCompletionPercentage(section, completedVideos)}
                  isExpanded={expandedSections[`section${sectionIndex}`]}
                  onToggle={() => toggleSection(`section${sectionIndex}`)}
                />

                {/* Section Content */}
                  {expandedSections[`section${sectionIndex}`] && (
                  <div className="p-6">
                    {/* Topics */}
                    <div className="space-y-8">
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
                        <TopicSection
                          key={topicIndex}
                          topic={topic}
                          completedVideos={completedVideos}
                          videoNotes={videoNotes}
                          onToggleVideoComplete={toggleVideoCompletion}
                          onPlayVideo={openVideoModal}
                          onAddNote={openNoteModal}
                          onPlaylistClick={handlePlaylistClick}
                        />
                        );
                      })}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
          </div>

          {/* Action Buttons */}
          <div className="mt-12 flex justify-center space-x-4">
            <button
              onClick={() => navigate('/')}
              className="flex items-center text-gray-700 border-2 border-gray-300 px-6 py-3 rounded-xl font-medium shadow-sm hover:bg-gray-50 transition-colors"
            >
              <FaArrowLeft className="mr-2" /> Go to Home
            </button>
            
            <button
              onClick={handleExportRoadmap}
              className="flex items-center px-6 py-3 bg-green-600 text-white rounded-xl font-medium shadow-sm hover:bg-green-700 transition-colors"
            >
              <FaFileExport className="mr-2" /> Export Roadmap
            </button>

            {/* Only show save button for roadmaps without resources or if not already saved */}
            {isAuthenticated && !fromSaved && (!hasResources || !savedToDB) && (
              <button
                onClick={saveRoadmapToDatabase}
                disabled={savingToDB || savedToDB}
                className={`flex items-center px-6 py-3 ${savingToDB || savedToDB ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-xl font-medium shadow-sm transition-colors`}
              >
                <FaSave className="mr-2" /> {savingToDB ? 'Saving...' : savedToDB ? 'Saved' : 'Save to Profile'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {/* Render the VideoPlayerModal only when needed with all required props */}
      {videoModalOpen && currentVideo && (
        <VideoPlayerModal
          video={currentVideo}
          isOpen={true}
          onClose={closeVideoModal}
        />
      )}

      {/* Only render NotesModal when it's open */}
      {noteModalOpen && (
        <NotesModal
          isOpen={true}
          onClose={closeNoteModal}
          onSave={saveNote}
          onDelete={deleteNote}
          note={currentNote}
          onNoteChange={setCurrentNote}
          videoTitle={currentVideo?.title}
          lastEdited={editingNote ? noteTimestamps[editingNote] : null}
        />
      )}

      {/* Only render CelebrationModal when it's open */}
      {showCelebration && <CelebrationModal isOpen={true} />}
    </div>
  );
};

export default RoadmapProgressPage; 