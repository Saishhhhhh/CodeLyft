import React from 'react';

const VideoControls = ({
  isCompleted,
  hasNote,
  onToggleComplete,
  onAddNote,
  theme
}) => {
  return (
    <div className="p-4 flex justify-between items-center" style={{ 
      borderTop: `1px solid ${theme.border}`
    }}>
      <div className="flex gap-4">
        <button
          onClick={onToggleComplete}
          className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200"
          style={{ 
            backgroundColor: isCompleted ? theme.accent : 'transparent',
            color: isCompleted ? theme.buttonText : theme.text,
            border: `1px solid ${isCompleted ? theme.accent : theme.border}`,
            transform: 'translateY(0)',
            boxShadow: 'none'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = `0 4px 6px -1px ${theme.shadow}`;
            if (!isCompleted) {
              e.currentTarget.style.backgroundColor = `${theme.accent}20`;
            } else {
              e.currentTarget.style.backgroundColor = theme.buttonHover;
            }
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.backgroundColor = isCompleted ? theme.accent : 'transparent';
          }}
        >
          {isCompleted ? (
            <>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Completed</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Mark as Complete</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default VideoControls; 