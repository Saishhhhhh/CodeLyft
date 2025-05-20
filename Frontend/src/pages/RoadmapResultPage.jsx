import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import HeroAnimation from '../components/HeroAnimation';
import { generateLearningRoadmap } from '../services/groqService';
import { findBestVideoForTopic } from '../services/youtubeService';
import { motion } from 'framer-motion';
import RoadmapLoadingState from '../components/roadmap/loading/RoadmapLoadingState';
import RoadmapErrorState from '../components/roadmap/error/RoadmapErrorState';
import RoadmapHeader from '../components/roadmap/header/RoadmapHeader';
import LearningPath from '../components/roadmap/path/LearningPath';
import AdvancedChallenges from '../components/roadmap/challenges/AdvancedChallenges';
import PracticeProjects from '../components/roadmap/projects/PracticeProjects';
import RoadmapFooter from '../components/roadmap/footer/RoadmapFooter';

const RoadmapResultPage = () => {
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 5;
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2
      }
    }
  };

  const generateRoadmapWithRetry = async (data, attempt = 1) => {
    try {
      console.log(`Attempt ${attempt} to generate roadmap`);
      const result = await generateLearningRoadmap(data);
      
      if (result === null) {
        throw new Error('Failed to generate roadmap - null result');
      }
      
      return result;
    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error);
      
      if (attempt < MAX_RETRIES) {
        console.log(`Retrying... (${attempt + 1}/${MAX_RETRIES})`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        return generateRoadmapWithRetry(data, attempt + 1);
      }
      
      throw error;
    }
  };

  useEffect(() => {
    const generateRoadmap = async () => {
      try {
        const storedData = localStorage.getItem('roadmapData');
        if (!storedData) {
          navigate('/');
          return;
        }

        const data = JSON.parse(storedData);
        console.log('Roadmap data from localStorage:', data);
        
        const result = await generateRoadmapWithRetry(data);
        console.log('Generated roadmap result:', result);
          setRoadmap(result);
        setError(null);
      } catch (error) {
        console.error('Failed to generate roadmap after all retries:', error);
        setError('We were unable to generate a roadmap after several attempts. Please try again later.');
        localStorage.removeItem('roadmapData');
      } finally {
        setLoading(false);
      }
    };

    generateRoadmap();
  }, [navigate]);

  const saveResourcesToJson = async (roadmapData) => {
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
                channel: video.channel?.name || 'Unknown',
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

  const addYouTubeVideos = async () => {
    try {
      setLoadingVideos(true);
      setError(null);

      const updatedRoadmap = { ...roadmap };
      
      for (let i = 0; i < updatedRoadmap.sections.length; i++) {
        const section = updatedRoadmap.sections[i];
        
        for (let j = 0; j < section.topics.length; j++) {
          const topic = section.topics[j];
          
          if (!topic.video) {
            try {
              const searchQuery = `${section.title} ${topic.title.replace(/^Complete\s+/i, '').replace(/[()]/g, '')}`;
              console.log(`Finding video for: ${searchQuery}`);
              
              const isAdvancedTopic = section.difficulty === 'advanced' || 
                                     section.title.toLowerCase().includes('advanced');
              
              const videoOrPlaylist = await findBestVideoForTopic(searchQuery, isAdvancedTopic);
              
              if (videoOrPlaylist) {
                if (videoOrPlaylist.isPlaylist) {
                  updatedRoadmap.sections[i].topics[j].video = {
                    title: videoOrPlaylist.title,
                    url: videoOrPlaylist.url,
                    channel: videoOrPlaylist.channel?.name || videoOrPlaylist.channel || 'Unknown',
                    videoCount: videoOrPlaylist.videoCount || videoOrPlaylist.video_count || videoOrPlaylist.videos?.length || 0,
                    avgViews: videoOrPlaylist.avgViews,
                    rating: videoOrPlaylist.rating || videoOrPlaylist.score || 'N/A',
                    quality: videoOrPlaylist.quality || videoOrPlaylist.verdict,
                    isPlaylist: true,
                    videos: videoOrPlaylist.videos?.map(video => ({
                      id: video.id,
                      title: video.title,
                      url: video.url,
                      channel: video.channel?.name || video.channel || 'Unknown',
                      duration: video.duration_string || video.duration || 'Unknown',
                      duration_string: video.duration_string || video.duration || 'Unknown',
                      publish_date: video.publish_date || 'Unknown',
                      views: video.views_formatted || 'N/A',
                      likes: video.likes_formatted || 'N/A',
                      thumbnail: `https://img.youtube.com/vi/${video.id}/mqdefault.jpg`
                    })) || [],
                    directViewCount: videoOrPlaylist.directViewCount,
                    directViewCountFormatted: videoOrPlaylist.directViewCountFormatted
                  };
                } else {
                  updatedRoadmap.sections[i].topics[j].video = {
                    title: videoOrPlaylist.title,
                    url: videoOrPlaylist.url,
                    channel: videoOrPlaylist.channel?.name || 'Unknown',
                    views: videoOrPlaylist.views_formatted || 'N/A',
                    likes: videoOrPlaylist.likes_formatted || 'N/A',
                    rating: videoOrPlaylist.videoRating || videoOrPlaylist.rating || 'N/A',
                    fallback: videoOrPlaylist.fallback || false,
                    isPlaylist: false,
                    videos: [{
                      id: videoOrPlaylist.id,
                      title: videoOrPlaylist.title,
                      url: videoOrPlaylist.url,
                      channel: videoOrPlaylist.channel?.name || videoOrPlaylist.channel || 'Unknown',
                      duration: videoOrPlaylist.duration_string || videoOrPlaylist.duration || 'Unknown',
                      duration_string: videoOrPlaylist.duration_string || videoOrPlaylist.duration || 'Unknown',
                      publish_date: videoOrPlaylist.publish_date || 'Unknown',
                      views: videoOrPlaylist.views_formatted || 'N/A',
                      likes: videoOrPlaylist.likes_formatted || 'N/A',
                      thumbnail: `https://img.youtube.com/vi/${videoOrPlaylist.id}/mqdefault.jpg`
                    }]
                  };
                }
                
                console.log(`Added ${videoOrPlaylist.isPlaylist ? 'playlist' : 'video'} for "${searchQuery}": ${videoOrPlaylist.title}`);
              }
              
              await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (error) {
              console.error(`Error finding video for ${searchQuery}:`, error);
            }
          }
        }
      }
      
      setRoadmap(updatedRoadmap);
      localStorage.setItem('roadmapData', JSON.stringify(updatedRoadmap));
      await saveResourcesToJson(updatedRoadmap);
      navigate('/roadmap-progress');
    } catch (error) {
      console.error('Error finding YouTube resources:', error);
      setError('Failed to find YouTube resources. Please try again.');
    } finally {
      setLoadingVideos(false);
    }
  };

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    setRetryCount(prev => prev + 1);
    window.location.reload();
  };

  if (loading) {
    return <RoadmapLoadingState />;
  }

  if (error || !roadmap) {
    return <RoadmapErrorState error={error} onRetry={handleRetry} />;
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-b from-slate-50 via-purple-50 to-slate-50">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/path-pattern.svg')] opacity-5"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-50/20 to-transparent"></div>
        <motion.div 
          className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.05),transparent_50%)]"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.3, 0.2]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      <HeroAnimation />
      
      <RoadmapHeader 
        title={roadmap.title}
        description={roadmap.description}
        onStartJourney={addYouTubeVideos}
        isLoading={loadingVideos}
      />

      <motion.div 
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="max-w-7xl mx-auto px-4 pt-0 pb-16 relative"
      >
        {/* Main Learning Path */}
        <LearningPath sections={roadmap.sections} />

        {/* Advanced Challenges Section */}
        <AdvancedChallenges challenges={roadmap.advancedTopics} />

        {/* Practice Projects Section */}
        <PracticeProjects projects={roadmap.projects} />

        {/* Footer Section */}
        <RoadmapFooter />
      </motion.div>
    </div>
  );
};

export default RoadmapResultPage; 