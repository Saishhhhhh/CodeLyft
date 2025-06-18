import React from 'react';
import { toast } from 'react-hot-toast';
import { useTheme } from '../../../context/ThemeContext';

/**
 * Component for roadmap action buttons at the bottom of the page
 */
const RoadmapActions = ({
  isAuthenticated,
  hasResources,
  savedToDB,
  savingToDB,
  onSave,
  roadmapIsCustom
}) => {
  const { darkMode } = useTheme();
  
  // Only show save button for authenticated users with roadmaps that don't have resources or aren't saved
  if (!isAuthenticated || (hasResources && savedToDB)) {
    return null;
  }

  return (
    <div className="mt-6 flex justify-center">
      <button
        onClick={onSave}
        disabled={savingToDB || savedToDB}
        className={`flex items-center px-6 py-3 rounded-lg shadow-md ${
          savingToDB || savedToDB 
            ? (darkMode ? 'bg-gray-600' : 'bg-gray-400') 
            : (darkMode ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-blue-600 hover:bg-blue-700')
        } text-white font-medium transition-colors`}
      >
        {savingToDB ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Saving...
          </>
        ) : savedToDB ? (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Saved
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h1a2 2 0 012 2v7a2 2 0 01-2 2H8a2 2 0 01-2-2v-7a2 2 0 012-2h1v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z" />
            </svg>
            Save to Profile
          </>
        )}
      </button>
    </div>
  );
};

export default RoadmapActions; 