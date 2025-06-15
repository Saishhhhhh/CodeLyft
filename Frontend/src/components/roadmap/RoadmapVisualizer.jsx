import { useState } from 'react';
import { motion } from 'framer-motion';
import { FaLink, FaPlayCircle, FaList } from 'react-icons/fa';

const RoadmapVisualizer = ({ topics = [] }) => {
  const [hoveredTopic, setHoveredTopic] = useState(null);

  if (!topics.length) {
    return (
      <div className="p-8 bg-gray-800 rounded-lg text-center">
        <p className="text-gray-400">Add topics to visualize your roadmap</p>
      </div>
    );
  }

  // Helper function to render YouTube icon based on resource type
  const renderYouTubeIcon = (resource) => {
    if (!resource) return <FaLink size={12} />;
    
    if (resource.type === 'video') {
      return <FaPlayCircle size={14} className="text-red-500" />;
    } else if (resource.type === 'playlist') {
      return <FaList size={14} className="text-red-500" />;
    }
    
    return <FaLink size={12} />;
  };

  return (
    <div className="p-6 bg-gray-800 rounded-lg">
      <h2 className="text-2xl font-semibold mb-6">Roadmap Visualization</h2>
      
      <div className="relative">
        {/* Connecting line */}
        <div className="absolute left-6 top-8 bottom-8 w-1 bg-purple-500 rounded-full" />
        
        {/* Topics */}
        <div className="space-y-8">
          {topics.map((topic, index) => (
            <motion.div
              key={topic.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="relative"
              onMouseEnter={() => setHoveredTopic(topic.id)}
              onMouseLeave={() => setHoveredTopic(null)}
            >
              {/* Topic node */}
              <div className="flex items-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center z-10 
                  ${hoveredTopic === topic.id 
                    ? 'bg-purple-400 shadow-lg shadow-purple-500/50' 
                    : 'bg-purple-600'}`}
                >
                  <span className="font-bold">{index + 1}</span>
                </div>
                
                <div className={`ml-4 p-4 bg-gray-700 rounded-lg flex-grow 
                  ${hoveredTopic === topic.id ? 'ring-2 ring-purple-400' : ''}`}
                >
                  <h3 className="font-medium text-lg">{topic.title}</h3>
                  {topic.resources.length > 0 && (
                    <div className="mt-2 flex items-center gap-2">
                      {renderYouTubeIcon(topic.resources[0])}
                      <a 
                        href={topic.resources[0].url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 text-sm truncate"
                      >
                        {topic.resources[0].type === 'video' ? 'YouTube Video' : 'YouTube Playlist'}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RoadmapVisualizer; 