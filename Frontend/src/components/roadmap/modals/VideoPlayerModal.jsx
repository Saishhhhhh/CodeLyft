import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { decodeHTML, formatDuration, getChannelName, decodeUnicode } from '../utils/videoUtils';

/**
 * VideoPlayerModal component for displaying YouTube videos
 * @param {Object} props
 * @param {Object} props.video - Video object to display
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Function to close the modal
 */
const VideoPlayerModal = ({ video, isOpen, onClose }) => {
  if (!isOpen || !video) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="fixed inset-0 flex items-center justify-center z-50 transition-all duration-300 bg-gradient-to-b from-black/95 to-black/90"
        >
          <div className="relative mx-4 w-full max-w-2xl transform transition-all duration-300 ease-out">
            {/* Close Button */}
            <div className="absolute -top-12 right-0 flex items-center space-x-2 z-10">
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white transition-all duration-200 group"
                title="Close"
              >
                <div className="bg-white/10 backdrop-blur-sm rounded-full p-2 group-hover:bg-white/20 transition-all duration-200">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </button>
            </div>

            {/* Video Player */}
            <div className="relative bg-black overflow-hidden shadow-2xl" style={{ paddingTop: '56.25%' }}>
              <div className="absolute inset-0 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 animate-gradient-x opacity-70 hover:opacity-90 transition-opacity duration-300"></div>
              <div className="absolute inset-[2px] bg-black overflow-hidden">
                <iframe
                  key={video.id}
                  className="w-full h-full"
                  src={`https://www.youtube.com/embed/${video.id}?autoplay=1&rel=0&modestbranding=1&playsinline=1&enablejsapi=1`}
                  title={decodeHTML(video.title)}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>

            {/* Video Info */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-3 px-1"
            >
              <h3 className="text-white text-sm font-medium truncate">
                {decodeUnicode(video.title)}
              </h3>
              <div className="flex items-center space-x-3 mt-1">
                <span className="text-xs text-white/60 flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {formatDuration(video.duration)}
                </span>
                <span className="text-xs text-white/60 flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  {decodeHTML(getChannelName(video))}
                </span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default VideoPlayerModal; 