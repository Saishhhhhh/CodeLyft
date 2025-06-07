import React from 'react';
import VideoCard from '../common/VideoCard';
import { decodeUnicode, formatDuration } from '../utils/videoUtils';

/**
 * TopicSection component for displaying a topic and its videos
 * @param {Object} props
 * @param {Object} props.topic - Topic object containing video information
 * @param {Object} props.completedVideos - Object mapping video IDs to completion status
 * @param {Object} props.videoNotes - Object mapping video IDs to notes
 * @param {Object} props.noteTimestamps - Object mapping video IDs to note timestamps
 * @param {Function} props.onToggleVideoComplete - Function to toggle video completion
 * @param {Function} props.onPlayVideo - Function to play a video
 * @param {Function} props.onAddNote - Function to add/edit notes
 * @param {Function} props.onPlaylistClick - Function to handle playlist navigation
 */
const TopicSection = ({
  topic,
  completedVideos,
  videoNotes,
  noteTimestamps,
  onToggleVideoComplete,
  onPlayVideo,
  onAddNote,
  onPlaylistClick
}) => {
  if (!topic?.video) return null;

  // Check if this is a playlist (has multiple videos)
  const isPlaylist = topic.video.videos && topic.video.videos.length > 1;
  const videoCount = topic.video.videos?.length || 0;
  const firstVideo = topic.video.videos?.[0];

  const handleThumbnailClick = (e) => {
    e.preventDefault();
    if (topic.video.url) {
      onPlaylistClick(topic.video.url);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            {decodeUnicode(topic.video.title)}
          </h3>
          <div className="flex items-center space-x-2 text-gray-600">
            <span>By: {
              // Try all possible locations for channel name
              topic.video.channel || 
              (typeof topic.video.videos?.[0]?.channel === 'string' ? topic.video.videos[0].channel : 
               topic.video.videos?.[0]?.channel?.name) || 
              "Unknown"
            }</span>
            {isPlaylist && (
              <span 
                className="text-sm px-2 py-0.5 rounded-full font-medium text-white"
                style={{
                  background: 'linear-gradient(to right, #EA580C, #9333EA)',
                }}
              >
                {videoCount} {videoCount === 1 ? 'video' : 'videos'}
              </span>
            )}
          </div>
        </div>
        {/* Only show thumbnail for playlists with reduced size and make it clickable */}
        {isPlaylist && firstVideo?.thumbnail && (
          <div 
            className="ml-6 flex-shrink-0 cursor-pointer group"
            onClick={handleThumbnailClick}
            title="Open playlist"
          >
            <div className="relative">
              <img 
                src={firstVideo.thumbnail} 
                alt={topic.video.title}
                className="w-48 h-27 object-cover rounded-lg shadow-md transition-transform group-hover:scale-105"
              />
              {/* Play button overlay */}
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                <div className="bg-white/90 rounded-full p-2 transform scale-90 group-hover:scale-100 transition-transform">
                  <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Videos Grid */}
      {topic.video.videos && (
        <div className="space-y-4">
          {topic.video.videos.map((video) => (
            <div key={video.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start space-x-6">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={completedVideos[video.id] || false}
                      onChange={() => onToggleVideoComplete(video.id)}
                      className="peer h-6 w-6 cursor-pointer appearance-none rounded-md border-2 border-gray-300 transition-all checked:border-orange-500 checked:bg-orange-500 hover:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                    />
                    <svg
                      className="pointer-events-none absolute left-1 top-1 h-4 w-4 opacity-0 transition-opacity peer-checked:opacity-100"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <div className="flex-grow">
                    <div className="flex items-start space-x-6">
                      <div 
                        onClick={() => onPlayVideo(video)}
                        className="relative group flex-shrink-0 cursor-pointer"
                      >
                        <img 
                          src={video.thumbnail} 
                          alt={video.title}
                          className="w-48 h-27 rounded-lg shadow-sm transition-transform group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                          <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                          </svg>
                        </div>
                      </div>
                      <div className="flex-grow">
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">
                          {decodeUnicode(video.title)}
                        </h4>
                        <div className="flex items-center space-x-6 text-sm text-gray-600 mb-4">
                          <span className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {formatDuration(video.duration)}
                          </span>
                          <span className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            {video.channel}
                          </span>
                        </div>
                        <button
                          onClick={() => onAddNote(video.id)}
                          className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          <span className="font-medium">{videoNotes[video.id] ? 'Edit Notes' : 'Add Notes'}</span>
                        </button>
                      </div>
                    </div>

                    {videoNotes[video.id] && (
                      <div className="mt-4 p-4 bg-orange-50 rounded-lg border border-orange-100">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            <span className="text-sm font-medium text-orange-700">Notes</span>
                          </div>
                          {noteTimestamps[video.id] && (
                            <span className="text-xs text-orange-600">
                              Last edited: {formatDate(noteTimestamps[video.id])}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                          {videoNotes[video.id]}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TopicSection; 