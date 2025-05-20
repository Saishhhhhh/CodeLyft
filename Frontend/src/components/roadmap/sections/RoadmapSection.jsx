import React from 'react';
import { motion } from 'framer-motion';
import TopicCard from './TopicCard';
import { decodeHTML } from '../utils/videoUtils';
import { getCompletionPercentage } from '../utils/progressUtils';

/**
 * RoadmapSection component for displaying a section of the roadmap
 * @param {Object} props
 * @param {Object} props.section - Section object
 * @param {Object} props.completedVideos - Object mapping video IDs to completion status
 * @param {Object} props.videoNotes - Object mapping video IDs to notes
 * @param {Function} props.onToggleVideoComplete - Function to toggle video completion
 * @param {Function} props.onPlayVideo - Function to play a video
 * @param {Function} props.onAddNote - Function to add/edit notes
 */
const RoadmapSection = ({
  section,
  completedVideos,
  videoNotes,
  onToggleVideoComplete,
  onPlayVideo,
  onAddNote
}) => {
  if (!section) return null;

  // Calculate section progress
  const totalVideos = section.topics.reduce((total, topic) => {
    return total + (topic.video?.videos?.length || 0);
  }, 0);

  const completedVideosCount = section.topics.reduce((count, topic) => {
    return count + (topic.video?.videos?.filter(video => completedVideos[video.id])?.length || 0);
  }, 0);

  const progressPercentage = getCompletionPercentage(totalVideos, completedVideosCount);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            {decodeHTML(section.title)}
          </h2>
          {section.description && (
            <p className="mt-1 text-gray-600">
              {decodeHTML(section.description)}
            </p>
          )}
        </div>

        {/* Progress Bar */}
        <div className="flex items-center space-x-4">
          <div className="flex-1 w-48">
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
              />
            </div>
          </div>
          <span className="text-sm font-medium text-gray-600">
            {progressPercentage}%
          </span>
        </div>
      </div>

      {/* Topics */}
      <div className="space-y-6">
        {section.topics.map((topic, index) => (
          <TopicCard
            key={topic.title + index}
            topic={topic}
            completedVideos={completedVideos}
            videoNotes={videoNotes}
            onToggleVideoComplete={onToggleVideoComplete}
            onPlayVideo={onPlayVideo}
            onAddNote={onAddNote}
          />
        ))}
      </div>
    </motion.div>
  );
};

export default RoadmapSection; 