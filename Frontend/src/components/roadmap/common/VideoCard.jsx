import React from 'react';
import { motion } from 'framer-motion';
import { decodeHTML, formatDuration, getChannelName, getThumbnailUrl } from '../utils/videoUtils';

/**
 * VideoCard component for displaying video information
 * @param {Object} props
 * @param {Object} props.video - Video object to display
 * @param {boolean} props.isCompleted - Whether the video is completed
 * @param {Function} props.onToggleComplete - Function to toggle video completion
 * @param {Function} props.onPlay - Function to play the video
 * @param {Function} props.onAddNote - Function to add/edit notes
 * @param {string} props.note - Current note for the video
 */
const VideoCard = ({ 
  video, 
  isCompleted, 
  onToggleComplete, 
  onPlay, 
  onAddNote,
  note 
}) => {
  if (!video) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
    >
      {/* Thumbnail Container */}
      <div 
        className="relative cursor-pointer"
        onClick={onPlay}
      >
        <div className="aspect-video bg-gradient-to-r from-gray-100 to-gray-200">
          <img
            src={getThumbnailUrl(video)}
            alt={decodeHTML(video.title)}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
        
        {/* Play Button Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="bg-white/90 rounded-full p-3 transform scale-90 group-hover:scale-100 transition-transform duration-300">
            <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        {/* Duration Badge */}
        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
          {formatDuration(video.duration)}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title and Channel */}
        <div className="space-y-1">
          <h3 
            className="font-medium text-gray-900 line-clamp-2 group-hover:text-indigo-600 transition-colors cursor-pointer"
            onClick={onPlay}
          >
            {decodeHTML(video.title)}
          </h3>
          <p className="text-sm text-gray-500">
            {decodeHTML(getChannelName(video))}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex items-center justify-between">
          {/* Completion Toggle */}
          <button
            onClick={onToggleComplete}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              isCompleted 
                ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <svg 
              className={`w-4 h-4 ${isCompleted ? 'text-green-500' : 'text-gray-400'}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              {isCompleted ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              )}
            </svg>
            <span>{isCompleted ? 'Completed' : 'Mark Complete'}</span>
          </button>

          {/* Notes Button */}
          <button
            onClick={onAddNote}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              note 
                ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <svg 
              className={`w-4 h-4 ${note ? 'text-orange-500' : 'text-gray-400'}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span>{note ? 'Edit Notes' : 'Add Notes'}</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default VideoCard; 