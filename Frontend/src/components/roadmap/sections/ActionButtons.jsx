import React from 'react';
import { FaArrowLeft, FaFileExport, FaSave } from 'react-icons/fa';

const ActionButtons = ({
  onNavigateHome,
  onExportRoadmap,
  onSaveRoadmap,
  isAuthenticated,
  fromSaved,
  hasResources,
  savedToDB,
  savingToDB
}) => {
  return (
    <div className="mt-12 flex justify-center space-x-4">
      <button
        onClick={onNavigateHome}
        className="flex items-center text-gray-700 border-2 border-gray-300 px-6 py-3 rounded-xl font-medium shadow-sm hover:bg-gray-50 transition-colors"
      >
        <FaArrowLeft className="mr-2" /> Go to Home
      </button>
      
      <button
        onClick={onExportRoadmap}
        className="flex items-center px-6 py-3 bg-green-600 text-white rounded-xl font-medium shadow-sm hover:bg-green-700 transition-colors"
      >
        <FaFileExport className="mr-2" /> Export Roadmap
      </button>

      {/* Only show save button for roadmaps without resources or if not already saved */}
      {isAuthenticated && !fromSaved && (!hasResources || !savedToDB) && (
        <button
          onClick={onSaveRoadmap}
          disabled={savingToDB || savedToDB}
          className={`flex items-center px-6 py-3 ${savingToDB || savedToDB ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-xl font-medium shadow-sm transition-colors`}
        >
          <FaSave className="mr-2" /> {savingToDB ? 'Saving...' : savedToDB ? 'Saved' : 'Save to Profile'}
        </button>
      )}
    </div>
  );
};

export default ActionButtons; 