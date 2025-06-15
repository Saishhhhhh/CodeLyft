import React, { useState } from 'react';
import { processUserResource } from '../services/userResourceService';
import { parseYouTubeUrl } from '../utils/youtubeValidator';

/**
 * Component for adding user-provided YouTube resources to topics
 */
const UserResourceInput = ({ onResourceAdded, topicTitle }) => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [urlType, setUrlType] = useState(null);
  
  // Handle URL input change
  const handleUrlChange = (e) => {
    const inputUrl = e.target.value;
    setUrl(inputUrl);
    setError('');
    
    // Check URL type as user types
    if (inputUrl) {
      const parsedUrl = parseYouTubeUrl(inputUrl);
      setUrlType(parsedUrl.isValid ? parsedUrl.type : null);
    } else {
      setUrlType(null);
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!url.trim()) {
      setError('Please enter a YouTube URL');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Process the user-provided URL
      const resource = await processUserResource(url);
      
      // Call the callback with the processed resource
      onResourceAdded(resource);
      
      // Reset form
      setUrl('');
      setUrlType(null);
      
    } catch (error) {
      console.error('Error processing resource:', error);
      setError(error.message || 'Failed to process YouTube URL');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-4">
      <h3 className="text-lg font-semibold mb-2">Add Your Own Resource for {topicTitle}</h3>
      <p className="text-sm text-gray-600 mb-3">
        Paste a YouTube video or playlist URL to add your own resource for this topic.
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <div className="flex items-center border rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-orange-500">
            <input
              type="url"
              value={url}
              onChange={handleUrlChange}
              placeholder="Paste YouTube URL here"
              className="flex-grow px-3 py-2 outline-none text-sm"
              disabled={loading}
            />
            {urlType && (
              <span className="px-2 text-xs font-medium bg-gray-100 text-gray-700 py-1 mr-1">
                {urlType === 'video' ? '🎬 Video' : '📑 Playlist'}
              </span>
            )}
          </div>
          {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading || !url.trim()}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              loading || !url.trim()
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-orange-500 text-white hover:bg-orange-600 transition-colors'
            }`}
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : (
              'Add Resource'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserResourceInput; 