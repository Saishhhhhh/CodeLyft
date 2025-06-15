import React from 'react';

/**
 * Component to display a user-provided resource
 */
const UserResourceDisplay = ({ resource, onRemove }) => {
  if (!resource) return null;
  
  const isPlaylist = resource.isPlaylist || (resource.videos && resource.videos.length > 1);
  
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-4">
      <div className="flex items-start">
        {/* Thumbnail */}
        <div className="w-24 h-16 flex-shrink-0 mr-3 overflow-hidden rounded-md">
          <img 
            src={isPlaylist 
              ? (resource.videos?.[0]?.thumbnail || 'https://via.placeholder.com/120x68?text=Playlist')
              : (resource.thumbnail || `https://img.youtube.com/vi/${resource.id}/mqdefault.jpg`)} 
            alt={resource.title}
            className="w-full h-full object-cover"
          />
          {isPlaylist && (
            <div className="absolute top-0 right-0 bg-black bg-opacity-70 text-white text-xs px-1 rounded">
              {resource.videos?.length || resource.videoCount || 0} videos
            </div>
          )}
        </div>
        
        {/* Resource info */}
        <div className="flex-grow">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-medium text-sm line-clamp-2">{resource.title}</h4>
              <p className="text-xs text-gray-600 mt-1">{resource.channel}</p>
              <div className="flex items-center mt-1">
                <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full mr-2">
                  User Added
                </span>
                <span className="text-xs text-gray-500">
                  {isPlaylist ? 'Playlist' : `${resource.duration_string || resource.duration || 'Unknown'}`}
                </span>
              </div>
            </div>
            
            {/* Remove button */}
            {onRemove && (
              <button 
                onClick={() => onRemove(resource)}
                className="text-red-500 hover:text-red-700 text-xs flex items-center"
                title="Remove resource"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Preview link */}
      <div className="mt-3 flex justify-end">
        <a 
          href={resource.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
        >
          View on YouTube
        </a>
      </div>
    </div>
  );
};

export default UserResourceDisplay; 