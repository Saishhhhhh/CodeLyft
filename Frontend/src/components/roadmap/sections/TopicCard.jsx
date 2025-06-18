import React from 'react';
import { motion } from 'framer-motion';
import VideoCard from '../common/VideoCard';
import TechLogo from '../common/TechLogo';
import { decodeHTML } from '../utils/videoUtils';

/**
 * Extract the core technology name from a topic title
 * Removes section numbers and descriptions
 * E.g., "Section 1: Python" -> "Python"
 * @param {string} title - The full topic title
 * @returns {string} - The extracted technology name
 */
const extractTechName = (title) => {
  if (!title) return '';
  
  // Remove "Section X:" pattern
  let cleanTitle = title.replace(/^Section\s+\d+:\s+/i, '');
  
  // If there's a dash or hyphen with description, take only the first part
  if (cleanTitle.includes(' - ')) {
    cleanTitle = cleanTitle.split(' - ')[0];
  }
  
  // If there's any other separator, take the first part
  const separators = [' | ', ': ', ' : '];
  for (const separator of separators) {
    if (cleanTitle.includes(separator)) {
      cleanTitle = cleanTitle.split(separator)[0];
      break;
    }
  }
  
  return cleanTitle.trim();
};

/**
 * TopicCard component for displaying a topic and its videos
 * @param {Object} props
 * @param {Object} props.topic - Topic object
 * @param {Object} props.completedVideos - Object mapping video IDs to completion status
 * @param {Object} props.videoNotes - Object mapping video IDs to notes
 * @param {Function} props.onToggleVideoComplete - Function to toggle video completion
 * @param {Function} props.onPlayVideo - Function to play a video
 * @param {Function} props.onAddNote - Function to add/edit notes
 */
const TopicCard = ({
  topic,
  completedVideos,
  videoNotes,
  onToggleVideoComplete,
  onPlayVideo,
  onAddNote,
  theme = {
    primary: '#4F46E5',  // Default indigo
    accent: '#8B5CF6',   // Default purple
    cardBg: '#FFFFFF',   // Default white
    text: '#111827',     // Default dark gray
    textMuted: '#6B7280' // Default medium gray
  }
}) => {
  if (!topic) return null;
  
  // Extract the core technology name for the logo
  const techName = extractTechName(topic.title);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm overflow-hidden"
      style={{ backgroundColor: theme.cardBg }}
    >
      {/* Topic Header */}
      <div className="p-6 border-b" style={{ 
        borderColor: 'rgba(0,0,0,0.06)',
        background: `linear-gradient(to right, ${theme.primary}10, ${theme.accent}10)`
      }}>
        <div className="flex items-center gap-3 mb-2">
          <TechLogo techName={techName} size="md" />
          <h3 className="text-xl font-semibold text-transparent bg-clip-text" style={{
            backgroundImage: `linear-gradient(to right, ${theme.primary}, ${theme.accent})`
          }}>
            {decodeHTML(topic.title)}
          </h3>
        </div>
        {topic.description && (
          <p className="text-sm" style={{ color: theme.textMuted }}>
            {decodeHTML(topic.description)}
          </p>
        )}
      </div>

      {/* Videos Grid */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {topic.video?.videos?.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              isCompleted={completedVideos[video.id]}
              note={videoNotes[video.id]}
              onToggleComplete={() => onToggleVideoComplete(video.id)}
              onPlay={() => onPlayVideo(video)}
              onAddNote={() => onAddNote(video.id)}
              theme={theme}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default TopicCard; 