import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaTrash, FaEdit, FaChevronRight, FaYoutube, FaBookOpen } from 'react-icons/fa';

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

const RoadmapCard = ({ roadmap, onDelete, onEdit, type }) => {
  const navigate = useNavigate();
  const isCustom = type === 'custom';
  const hasResources = isCustom 
    ? roadmap.topics?.some(topic => topic.video)
    : roadmap.topics?.some(topic => topic.hasGeneratedResources);
  
  // Get appropriate difficulty color
  const getDifficultyColor = (difficulty) => {
    switch(difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-800 border-green-200';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Advanced': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get percentage completion
  const getPercentage = () => {
    if (!roadmap.completionPercentage && !roadmap.completedResources) return 0;
    if (roadmap.completionPercentage) return Math.min(100, Math.max(0, roadmap.completionPercentage));
    
    // Calculate percentage from completed resources
    const completed = roadmap.completedResources || 0;
    const total = roadmap.totalResources || 1;
    return Math.round((completed / total) * 100);
  };

  // Get progress color based on percentage
  const getProgressColor = (percentage) => {
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 75) return 'bg-blue-500';
    if (percentage >= 50) return 'bg-yellow-500';
    if (percentage >= 25) return 'bg-orange-500';
    return 'bg-purple-500';
  };

  // Get title based on roadmap type
  const title = isCustom ? roadmap.name : roadmap.title;
  const description = roadmap.description || "No description available";
  const id = roadmap._id || roadmap.id;
  const category = roadmap.category || (isCustom ? 'Custom Roadmap' : 'General');
  const difficulty = isCustom ? "Custom" : roadmap.difficulty || 'Intermediate';
  const percentage = getPercentage();
  
  // Handle navigation based on roadmap type and resources
  const handleCardClick = () => {
    if (isCustom) {
      navigate(`/roadmaps/${id}/resources?isCustom=true`);
    } else if (hasResources) {
      navigate(`/roadmaps/${id}/resources`);
    } else {
      navigate(`/roadmaps/${id}/view`);
    }
  };

  return (
    <motion.div 
      variants={fadeIn}
      whileHover={{ y: -5 }}
      className={`bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden
                 ${hasResources ? 'border-l-4 border-purple-500' : ''}`}
    >
      {/* Progress bar (show for all roadmaps with resources) */}
      {hasResources && (
        <div className="relative h-2 bg-gray-100">
          <div 
            className={`absolute top-0 left-0 h-2 transition-all duration-500 ${getProgressColor(percentage)}`}
            style={{ width: `${percentage}%` }}
          />
          {percentage > 0 && (
            <div className="absolute top-0 right-2 text-[10px] font-medium text-gray-600 transform translate-y-[-50%] bg-white px-1 rounded shadow-sm border">
              {percentage}%
            </div>
          )}
        </div>
      )}
      
      <div className="p-6">
        {/* Header with title and badges */}
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-xl font-semibold text-gray-800 line-clamp-1 pr-4">{title}</h3>
          <div className="flex flex-shrink-0 gap-2">
            {isCustom && (
              <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-green-100 text-green-800 border border-green-200">
                Custom
              </span>
            )}
            {!isCustom && (
              <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${getDifficultyColor(difficulty)}`}>
                {difficulty}
              </span>
            )}
            {hasResources && (
              <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                Resources
              </span>
            )}
          </div>
        </div>
        
        {/* Description */}
        <p className="text-gray-600 mb-4 line-clamp-2 text-sm min-h-[40px]">{description}</p>
        
        {/* Bottom info and actions */}
        <div className="flex justify-between items-center">
          <div className="flex items-center text-sm text-gray-500">
            {hasResources ? (
              <span>
                {roadmap.completedResources || 0}/{roadmap.totalResources || 0} Resources
              </span>
            ) : isCustom ? (
              <span>Topics: {roadmap.topics?.length || 0}</span>
            ) : (
              <span>{roadmap.createdAt ? new Date(roadmap.createdAt).toLocaleDateString() : "Recently"}</span>
            )}
          </div>
          
          <div className="flex space-x-2">
            {/* Edit button for custom roadmaps */}
            {isCustom && !hasResources && onEdit && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(roadmap);
                }}
                className="p-2 text-blue-600 hover:text-blue-800 transition-colors"
                title="Edit custom roadmap"
              >
                <FaEdit />
              </button>
            )}
            {/* Delete button */}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onDelete(id, e);
              }}
              className="p-2 text-red-600 hover:text-red-800 transition-colors"
              title={`Delete ${isCustom ? 'custom ' : ''}roadmap`}
            >
              <FaTrash />
            </button>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div 
        className="bg-gray-50 px-6 py-3 flex justify-between items-center cursor-pointer hover:bg-gray-100 transition-colors"
        onClick={handleCardClick}
      >
        <span className="text-sm font-medium text-gray-600">
          {hasResources ? (
            <span className="flex items-center">
              <FaYoutube className="mr-1 text-red-600" /> With Resources
            </span>
          ) : (
            <span className="flex items-center">
              <FaBookOpen className="mr-1 text-blue-600" /> {category}
            </span>
          )}
        </span>
        
        <button className="inline-flex items-center text-sm font-medium text-purple-600 hover:text-purple-800">
          {hasResources ? 'View Resources' : (isCustom ? 'View Details' : 'Generate Resources')} 
          <FaChevronRight className="ml-1" size={12} />
        </button>
      </div>
    </motion.div>
  );
};

export default RoadmapCard;
