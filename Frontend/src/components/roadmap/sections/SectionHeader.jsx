import React from 'react';

/**
 * SectionHeader component for displaying a section header with progress information
 * @param {Object} props
 * @param {string} props.title - Section title
 * @param {string} props.description - Section description
 * @param {number} props.completedCount - Number of completed videos
 * @param {number} props.totalCount - Total number of videos
 * @param {number} props.completionPercentage - Percentage of completion
 * @param {boolean} props.isExpanded - Whether the section is expanded
 * @param {Function} props.onToggle - Function to toggle section expansion
 */
const SectionHeader = ({
  title,
  description,
  completedCount,
  totalCount,
  completionPercentage,
  isExpanded,
  onToggle
}) => {
  return (
    <div 
      className="bg-gradient-to-r from-orange-50 to-purple-50 p-4 cursor-pointer hover:bg-gradient-to-r hover:from-orange-100 hover:to-purple-100 transition-colors"
      onClick={onToggle}
    >
      <div className="flex flex-col">
        <div className="flex items-start justify-between mb-2">
          <h2 className="text-xl font-semibold">
            {title}
          </h2>
          <div className="flex items-center space-x-3 mt-1">
            <div className="flex flex-col items-end">
              <span className="text-base text-gray-700">
                {completedCount} / {totalCount}
              </span>
              <span className="text-xs text-gray-600 -mt-0.5">
                {completionPercentage}% Complete
              </span>
            </div>
            <svg 
              className={`w-4 h-4 text-gray-500 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          {description}
        </p>
        {/* Progress Bar - Always visible */}
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-orange-500 to-purple-500 transition-all duration-500"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default SectionHeader; 