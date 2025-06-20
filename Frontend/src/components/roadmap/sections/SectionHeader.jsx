import React from 'react';

/**
 * SectionHeader component for displaying a section header with progress information
 * @param {Object} props
 * @param {string} props.sectionId - Unique identifier for the section
 * @param {string} props.title - Section title
 * @param {string} props.description - Section description
 * @param {number} props.completedCount - Number of completed videos
 * @param {number} props.totalCount - Total number of videos
 * @param {number} props.completionPercentage - Percentage of completion
 * @param {boolean} props.isExpanded - Whether the section is expanded
 * @param {Function} props.onToggle - Function to toggle section expansion
 * @param {Object} props.theme - Theme object with color values
 */
const SectionHeader = ({
  sectionId,
  title,
  description,
  completedCount,
  totalCount,
  completionPercentage,
  isExpanded,
  onToggle,
  theme
}) => {
  const handleToggle = (e) => {
    e.preventDefault();
    console.log('Section header clicked with ID:', sectionId);
    if (typeof onToggle === 'function') {
      if (sectionId) {
        console.log('Calling onToggle with sectionId:', sectionId);
        onToggle(sectionId);
      } else {
        console.error('Missing sectionId in SectionHeader');
      }
    } else {
      console.error('Missing onToggle function in SectionHeader');
    }
  };

  return (
    <button 
      className="w-full p-4 cursor-pointer transition-colors text-left"
      style={{
        backgroundColor: theme.cardBg,
        borderBottom: `1px solid ${theme.border}`,
        outline: 'none'
      }}
      onClick={handleToggle}
      aria-expanded={isExpanded}
    >
      <div className="flex flex-col">
        <div className="flex items-start justify-between mb-2">
          <h2 
            className="text-xl font-semibold flex-1 pr-4 text-transparent bg-clip-text" 
            style={{ 
              backgroundImage: `linear-gradient(to right, ${theme.primary}, ${theme.accent})`,
            }}
          >
            {title}
          </h2>
          <div className="flex items-center space-x-3 mt-1 flex-shrink-0">
            <div className="flex flex-col items-end min-w-[80px]">
              <span className="text-base whitespace-nowrap" style={{ color: theme.text }}>
                {completedCount} / {totalCount}
              </span>
              <span className="text-xs -mt-0.5 whitespace-nowrap" style={{ color: theme.textMuted }}>
                {completionPercentage}% Complete
              </span>
            </div>
            <svg 
              className={`w-4 h-4 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke={theme.text}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        {/* Progress Bar - Always visible */}
        <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: theme.progressBg }}>
          <div 
            className="h-full transition-all duration-500"
            style={{ 
              width: `${completionPercentage}%`,
              background: `linear-gradient(to right, ${theme.primary}, ${theme.accent})`,
            }}
          />
        </div>
      </div>
    </button>
  );
};

export default SectionHeader; 