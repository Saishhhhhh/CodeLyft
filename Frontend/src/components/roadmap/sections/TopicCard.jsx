import React from 'react';
import { motion } from 'framer-motion';
import VideoCard from '../common/VideoCard';
import { decodeHTML } from '../utils/videoUtils';

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
  onAddNote
}) => {
  if (!topic) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm overflow-hidden"
    >
      {/* Topic Header */}
      <div className="p-6 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border-b border-gray-100">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {decodeHTML(topic.title)}
        </h3>
        {topic.description && (
          <p className="text-gray-600 text-sm">
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
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default TopicCard; 