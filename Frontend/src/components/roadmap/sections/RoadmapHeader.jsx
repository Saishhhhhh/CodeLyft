import React from 'react';
import { FaCheck } from 'react-icons/fa';

const RoadmapHeader = ({ title, description, showSavedBadge, theme }) => {
  return (
    <div className="flex justify-between items-center mb-8">
      <div className="text-center flex-1">
      <h1
          className="text-4xl font-bold mb-4 font-poppins bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] bg-clip-text text-transparent"
          style={{
            '--primary': theme.primary,
            '--accent': theme.accent,
          }}
        >
          {title}
        </h1>
        {showSavedBadge && (
          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 mb-4">
            <FaCheck className="mr-1" /> Saved to your profile
          </div>
        )}
        <p className="text-gray-600 max-w-2xl mx-auto font-mukta" style={{ color: theme.textMuted }}>{description}</p>
      </div>
    </div>
  );
};

export default RoadmapHeader; 