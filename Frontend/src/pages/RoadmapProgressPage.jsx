import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import HeroAnimation from '../components/HeroAnimation';
import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';

// Import our components
import SectionHeader from '../components/roadmap/sections/SectionHeader';
import TopicSection from '../components/roadmap/sections/TopicSection';
import VideoPlayerModal from '../components/roadmap/modals/VideoPlayerModal';
import NotesModal from '../components/roadmap/modals/NotesModal';
import CelebrationModal from '../components/roadmap/modals/CelebrationModal';

// Import utility functions
import { triggerCelebration } from '../components/roadmap/utils/celebrationUtils';
import { checkAllVideosCompleted, groupSectionsBySharedResources } from '../components/roadmap/utils/progressUtils';
import { formatDuration, decodeHTML } from '../components/roadmap/utils/videoUtils';

const RoadmapProgressPage = () => {
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
  const navigate = useNavigate();

  useEffect(() => {
    // Load roadmap data from localStorage
    const storedRoadmap = localStorage.getItem('roadmapData');
    if (!storedRoadmap) {
      navigate('/roadmap');
      return;
    }
    setRoadmap(JSON.parse(storedRoadmap));

    // Load progress data from localStorage
    const storedProgress = localStorage.getItem('roadmapProgress');
    if (storedProgress) {
      const { 
        completedVideos: storedCompleted, 
        videoNotes: storedNotes,
        noteTimestamps: storedTimestamps 
      } = JSON.parse(storedProgress);
      setCompletedVideos(storedCompleted || {});
      setVideoNotes(storedNotes || {});
      setNoteTimestamps(storedTimestamps || {});
    }
    setLoading(false);
  }, [navigate]);

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

    return totalVideos > 0 ? Math.round((completedCount / totalVideos) * 100) : 0;
  };

  const getCompletedVideosCount = (section, completedVideos) => {
    if (!section?.topics) return 0;
    
    let completedCount = 0;

    section.topics.forEach(topic => {
      if (topic.video?.videos) {
        topic.video.videos.forEach(video => {
          if (completedVideos[video.id]) {
            completedCount++;
          }
        });
      }
    });

    return completedCount;
  };

  const getTotalVideosCount = (section) => {
    if (!section?.topics) return 0;
    
    let totalCount = 0;

    section.topics.forEach(topic => {
      if (topic.video?.videos) {
        totalCount += topic.video.videos.length;
      }
    });

    return totalCount;
  };

  const openVideoModal = (video) => {
    setCurrentVideo(video);
    setVideoModalOpen(true);
  };

  const closeVideoModal = () => {
    setVideoModalOpen(false);
    setCurrentVideo(null);
  };

  // Add new function to group topics by shared resources
  const groupTopicsBySharedResources = (sections) => {
    const groupedTopics = new Map();
    
    sections.forEach(section => {
      section.topics.forEach(topic => {
        if (topic.video && topic.video.url) {
          const resourceKey = topic.video.url;
          if (!groupedTopics.has(resourceKey)) {
            groupedTopics.set(resourceKey, {
              resource: topic.video,
              topics: []
            });
          }
          groupedTopics.get(resourceKey).topics.push({
            sectionTitle: section.title,
            topicTitle: topic.title,
            topicDescription: topic.description
          });
        }
      });
    });
    
    return groupedTopics;
  };

  // Add function to get ungrouped topics
  const getUngroupedTopics = (sections) => {
    const groupedTopics = groupTopicsBySharedResources(sections);
    const ungroupedTopics = [];
    
    sections.forEach(section => {
      section.topics.forEach(topic => {
        if (!topic.video || !topic.video.url || !groupedTopics.has(topic.video.url)) {
          ungroupedTopics.push({
            sectionTitle: section.title,
            ...topic
          });
        }
      });
    });
    
    return ungroupedTopics;
  };

  // Update the groupSectionsBySharedResources function
  const groupSectionsBySharedResources = (sections) => {
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

  const handlePlaylistClick = (playlistUrl) => {
    if (playlistUrl) {
      window.open(playlistUrl, '_blank');
    }
  };

  // Loading state
  if (loading || !roadmap) {
    return (
      <div className="min-h-screen relative overflow-hidden" style={{ background: 'linear-gradient(to bottom, #FFF7ED, #FFFFFF)' }}>
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
      <HeroAnimation />
      <div className="max-w-5xl mx-auto px-4 pt-24 pb-16">
        <div className="bg-white p-8 rounded-xl shadow-lg">
          {/* Header */}
          <div className="text-center mb-12">
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
                      {section.topics.map((topic, topicIndex) => (
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
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
          </div>

          {/* Action Buttons */}
          <div className="mt-12 flex justify-center">
            <button
              onClick={() => navigate('/roadmap')}
              className="text-gray-700 border-2 border-gray-300 px-6 py-3 rounded-xl font-medium shadow-sm hover:bg-gray-50 transition-colors"
            >
              Back to Roadmap
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <VideoPlayerModal
        video={currentVideo}
        isOpen={videoModalOpen}
        onClose={closeVideoModal}
      />

      <NotesModal
        isOpen={noteModalOpen}
        onClose={closeNoteModal}
        onSave={saveNote}
        onDelete={deleteNote}
        note={currentNote}
        onNoteChange={setCurrentNote}
        videoTitle={currentVideo?.title}
        lastEdited={editingNote ? noteTimestamps[editingNote] : null}
      />

      <CelebrationModal isOpen={showCelebration} />
    </div>
  );
};

export default RoadmapProgressPage; 