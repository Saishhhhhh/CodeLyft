import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaYoutube, FaSpinner } from 'react-icons/fa';

const ResourceLoadingModal = ({ 
  isOpen, 
  currentTopic, 
  progressPercent, 
  foundResources 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden"
      >
        <div className="p-6 bg-gradient-to-r from-indigo-600 to-purple-600">
          <div className="flex items-center">
            <FaYoutube className="text-white text-3xl mr-3" />
            <h2 className="text-2xl font-bold text-white">Generating YouTube Resources</h2>
          </div>
          <p className="text-indigo-100 mt-2">
            Finding the best learning resources for your roadmap. This may take a few minutes...
          </p>
        </div>

        <div className="p-6">
          {/* Current topic being processed */}
          <div className="mb-4">
            <div className="flex items-center mb-2">
              <div className="animate-pulse mr-3">
                <FaSpinner className="animate-spin text-indigo-600" />
              </div>
              <span className="font-medium">Currently processing:</span>
            </div>
            <div className="bg-indigo-50 p-3 rounded-lg">
              <p className="text-indigo-800 font-medium">{currentTopic || 'Preparing resources...'}</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mb-6">
            <div className="flex justify-between mb-1">
              <span className="text-sm text-gray-600">Progress</span>
              <span className="text-sm font-medium text-indigo-600">{progressPercent}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <motion.div 
                className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2.5 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Found resources */}
          <div>
            <h3 className="font-medium mb-3">Resources found ({foundResources.length}):</h3>
            <div className="max-h-64 overflow-y-auto pr-2 space-y-3">
              <AnimatePresence>
                {foundResources.map((resource, index) => (
                  <motion.div 
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white border border-gray-200 rounded-lg p-3 flex items-center"
                  >
                    {resource.thumbnail ? (
                      <img 
                        src={resource.thumbnail} 
                        alt={resource.title} 
                        className="w-16 h-12 object-cover rounded mr-3"
                      />
                    ) : (
                      <div className="w-16 h-12 bg-gray-200 rounded flex items-center justify-center mr-3">
                        <FaYoutube className="text-gray-400 text-2xl" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-sm line-clamp-2">{resource.title}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {resource.type === 'playlist' 
                          ? `Playlist • ${resource.videoCount || '?'} videos` 
                          : 'Single video'}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {foundResources.length === 0 && (
                <div className="text-center py-6 text-gray-500">
                  <p>Searching for resources...</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 px-6 py-4 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            This may take a few minutes depending on the number of topics
          </div>
          <div className="flex items-center text-indigo-600">
            <FaSpinner className="animate-spin mr-2" />
            <span className="font-medium">Processing</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ResourceLoadingModal; 