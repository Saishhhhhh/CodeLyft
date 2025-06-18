import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaEdit, FaTrash, FaExternalLinkAlt, FaChevronDown } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import Pagination from '../common/Pagination';

const ITEMS_PER_PAGE = 5;

const RoadmapList = ({ 
  regularRoadmaps = [], 
  customRoadmaps = [], 
  onDeleteRegular,
  onDeleteCustom,
  onEditCustom,
  searchTerm,
  activeTab,
  sortMethod,
  darkMode
}) => {
  // State for expanded descriptions
  const [expandedDescriptions, setExpandedDescriptions] = useState(new Set());
  const [regularCurrentPage, setRegularCurrentPage] = useState(1);
  const [customCurrentPage, setCustomCurrentPage] = useState(1);

  // Animation variants
  const listVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        type: "spring",
        stiffness: 100,
        damping: 15
      } 
    }
  };

  // Utility functions
  const toggleDescription = (roadmapId) => {
    setExpandedDescriptions(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(roadmapId)) {
        newExpanded.delete(roadmapId);
      } else {
        newExpanded.add(roadmapId);
      }
      return newExpanded;
    });
  };

  // Get correct URL based on roadmap type
  const getRoadmapUrl = (roadmap, isCustom) => {
    if (isCustom) {
      return `/roadmaps/${roadmap._id || roadmap.id}/resources?isCustom=true`;
    }
    return roadmap.topics?.some(topic => topic.hasGeneratedResources)
      ? `/roadmaps/${roadmap._id}/resources`
      : `/roadmaps/${roadmap._id}/view`;
  };

  // Get completion percentage
  const getCompletionPercentage = (roadmap) => {
    if (!roadmap.completionPercentage && !roadmap.completedResources) return 0;
    if (roadmap.completionPercentage) return roadmap.completionPercentage;
    
    const completed = roadmap.completedResources || 0;
    const total = roadmap.totalResources || 1;
    return Math.round((completed / total) * 100);
  };

  // Check if roadmap has resources
  const hasResources = (roadmap, isCustom) => {
    return isCustom
      ? roadmap.topics?.some(topic => topic.video)
      : roadmap.topics?.some(topic => topic.hasGeneratedResources);
  };

  // Get total topics count
  const getTopicsCount = (roadmap) => {
    return roadmap.topics?.length || 0;
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Sorting function
  const sortRoadmaps = (roadmaps, isCustom = false) => {
    if (!Array.isArray(roadmaps)) return [];
    
    const getRoadmapTitle = (roadmap) => isCustom ? roadmap.name : roadmap.title;
    
    return [...roadmaps].sort((a, b) => {
      switch (sortMethod) {
        case 'name':
          return getRoadmapTitle(a)?.localeCompare(getRoadmapTitle(b));
        case 'nameDesc':
          return getRoadmapTitle(b)?.localeCompare(getRoadmapTitle(a));
        case 'date':
          return new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0);
        case 'dateAsc':
          return new Date(a.updatedAt || a.createdAt || 0) - new Date(b.updatedAt || b.createdAt || 0);
        case 'progress':
          return getCompletionPercentage(b) - getCompletionPercentage(a);
        case 'progressAsc':
          return getCompletionPercentage(a) - getCompletionPercentage(b);
        case 'topics':
          return getTopicsCount(b) - getTopicsCount(a);
        case 'topicsAsc':
          return getTopicsCount(a) - getTopicsCount(b);
        default:
          return 0;
      }
    });
  };

  // Filter and sort roadmaps
  const filteredRegularRoadmaps = sortRoadmaps(
    regularRoadmaps.filter(roadmap => {
      const matchesSearch = !searchTerm || 
        roadmap.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        roadmap.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesTab = activeTab === 'all' || 
        activeTab === 'regular' ||
        (activeTab === 'resources' && hasResources(roadmap, false));
      
      return matchesSearch && matchesTab;
    })
  );

  const filteredCustomRoadmaps = sortRoadmaps(
    customRoadmaps.filter(roadmap => {
      const matchesSearch = !searchTerm || 
        roadmap.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        roadmap.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesTab = activeTab === 'all' || 
        activeTab === 'custom' ||
        (activeTab === 'resources' && hasResources(roadmap, true));
      
      return matchesSearch && matchesTab;
    }),
    true
  );

  // Handle delete with confirmation
  const handleDelete = (roadmap, isCustom, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    const roadmapType = isCustom ? 'custom' : 'personalized';
    const confirmDelete = window.confirm(`Are you sure you want to delete this ${roadmapType} roadmap?`);
    if (confirmDelete) {
      if (isCustom) {
        onDeleteCustom(roadmap._id || roadmap.id);
      } else {
        onDeleteRegular(roadmap._id);
      }
    }
  };

  // Empty state
  if (filteredRegularRoadmaps.length === 0 && filteredCustomRoadmaps.length === 0) {
    return (
      <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        No roadmaps found
      </div>
    );
  }

  const RoadmapCard = ({ roadmap, isCustom }) => {
    const roadmapId = roadmap._id || roadmap.id;
    const roadmapHasResources = hasResources(roadmap, isCustom);
    const completionPercentage = getCompletionPercentage(roadmap);
    const isExpanded = expandedDescriptions.has(roadmapId);
    const topicsCount = getTopicsCount(roadmap);
    
    const handleCardClick = (e) => {
      // Don't navigate if clicking on a button or link
      if (e.target.closest('button') || e.target.closest('a') || e.target.closest('[role="button"]')) {
        return;
      }
      window.location.href = getRoadmapUrl(roadmap, isCustom);
    };
    
    return (
      <motion.div
        variants={itemVariants}
        whileHover={{ 
          scale: 1.01,
          transition: { duration: 0.2 }
        }}
        className={`
          group relative
          ${!isCustom 
            ? darkMode 
              ? 'bg-gradient-to-br from-indigo-900/10 to-sky-900/5 border-indigo-500/20' 
              : 'bg-gradient-to-br from-indigo-50 to-sky-50 border-indigo-200'
            : darkMode
              ? 'bg-gradient-to-br from-violet-900/10 to-purple-900/5 border-purple-500/20'
              : 'bg-gradient-to-br from-violet-50 to-purple-50 border-purple-200'
          }
          rounded-xl border shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300
          hover:border-opacity-80
          ${!isCustom
            ? 'hover:border-indigo-300'
            : 'hover:border-purple-300'
          }
        `}
        onClick={handleCardClick}
      >
        {/* Glow effect on hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className={`absolute inset-0 ${
            !isCustom
              ? darkMode 
                ? 'bg-indigo-500/5' 
                : 'bg-indigo-500/10'
              : darkMode
                ? 'bg-violet-500/5'
                : 'bg-violet-500/10'
          } blur-xl`}></div>
        </div>

        <div className="p-5">
          {/* Header with title and actions */}
          <div className="flex justify-between items-start mb-3">
            <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} group-hover:text-indigo-500 transition-colors duration-200`}>
              {roadmap.title || roadmap.name}
            </h3>
            <div className="flex items-center gap-2">
              {/* View button */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link 
                  to={getRoadmapUrl(roadmap, isCustom)}
                  onClick={(e) => e.stopPropagation()}
                  className={`
                    inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium
                    transition-all duration-200 text-white
                    ${!isCustom
                      ? darkMode 
                        ? 'bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/50 hover:ring-2 hover:ring-indigo-400/50' 
                        : 'bg-indigo-500 hover:bg-indigo-400 shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/50 hover:ring-2 hover:ring-indigo-300/50'
                      : darkMode
                        ? 'bg-violet-600 hover:bg-violet-500 shadow-md shadow-violet-500/20 hover:shadow-violet-500/50 hover:ring-2 hover:ring-violet-400/50'
                        : 'bg-violet-500 hover:bg-violet-400 shadow-md shadow-violet-500/20 hover:shadow-violet-500/50 hover:ring-2 hover:ring-violet-300/50'
                    }
                  `}
                >
                  <span className="relative z-0 flex items-center">
                    View <FaExternalLinkAlt className="ml-1.5 text-xs transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              </motion.div>

              {/* Edit button for custom roadmaps */}
              {isCustom && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onEditCustom(roadmap);
                  }}
                  className={`
                    p-1.5 rounded-lg transition-all duration-200 z-10
                    ${darkMode 
                      ? 'bg-violet-900/20 text-violet-400 hover:bg-violet-900/30' 
                      : 'bg-violet-100 text-violet-600 hover:bg-violet-200'
                    }
                  `}
                  title="Edit roadmap"
                >
                  <FaEdit className="text-lg" />
                </motion.button>
              )}

              {/* Delete button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(roadmap, isCustom);
                }}
                className={`
                  p-1.5 rounded-lg transition-all duration-200 z-10
                  ${darkMode ? 'bg-red-900/20 text-red-400 hover:bg-red-900/30' : 'bg-red-100 text-red-600 hover:bg-red-200'}
                `}
                title="Delete roadmap"
              >
                <FaTrash className="text-lg" />
              </motion.button>
            </div>
          </div>
                
          <div className="flex flex-wrap gap-2 mt-2">
            {/* Type badge */}
            <motion.span 
              whileHover={{ scale: 1.05, rotate: [-1, 1, -1, 0] }}
              className={`
                px-2 py-1 rounded-full text-xs font-medium transition-all duration-200
                ${isCustom 
                  ? darkMode 
                    ? 'bg-violet-900/20 text-violet-400 hover:bg-violet-900/30' 
                    : 'bg-violet-100 text-violet-600 hover:bg-violet-200'
                  : darkMode
                    ? 'bg-indigo-900/20 text-indigo-400 hover:bg-indigo-900/30'
                    : 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'
                }
              `}
            >
              {isCustom ? 'Custom' : 'Standard'}
            </motion.span>
            
            {/* Resources badge */}
            {roadmapHasResources && (
              <motion.span 
                whileHover={{ scale: 1.05, rotate: [-1, 1, -1, 0] }}
                className={`
                  px-2 py-1 rounded-full text-xs font-medium transition-all duration-200
                  ${darkMode 
                    ? 'bg-green-900/20 text-green-400 hover:bg-green-900/30' 
                    : 'bg-green-100 text-green-600 hover:bg-green-200'
                  }
                `}
              >
                With Resources
              </motion.span>
            )}
            
            {/* Topics count badge */}
            <motion.span 
              whileHover={{ scale: 1.05, rotate: [-1, 1, -1, 0] }}
              className={`
                px-2 py-1 rounded-full text-xs font-medium transition-all duration-200
                ${darkMode 
                  ? 'bg-blue-900/20 text-blue-400 hover:bg-blue-900/30' 
                  : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                }
              `}
            >
              {topicsCount} Topics
            </motion.span>
            
            {/* Difficulty badge */}
            {roadmap.difficulty && (
              <motion.span 
                whileHover={{ scale: 1.05, rotate: [-1, 1, -1, 0] }}
                className={`
                  px-2 py-1 rounded-full text-xs font-medium transition-all duration-200
                  ${roadmap.difficulty === 'Beginner'
                    ? darkMode
                      ? 'bg-teal-900/20 text-teal-400 hover:bg-teal-900/30'
                      : 'bg-teal-100 text-teal-600 hover:bg-teal-200'
                    : roadmap.difficulty === 'Intermediate'
                      ? darkMode
                        ? 'bg-yellow-900/20 text-yellow-400 hover:bg-yellow-900/30'
                        : 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'
                      : darkMode
                        ? 'bg-red-900/20 text-red-400 hover:bg-red-900/30'
                        : 'bg-red-100 text-red-600 hover:bg-red-200'
                  }
                `}
              >
                {roadmap.difficulty}
              </motion.span>
            )}
          </div>
            
          {/* Description with expand/collapse */}
          <div className="mt-3">
            <AnimatePresence initial={false}>
              <motion.div
                initial={{ height: "auto" }}
                animate={{ height: "auto" }}
                className={`relative ${!isExpanded && "max-h-[60px] overflow-hidden"}`}
              >
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {roadmap.description || "No description available"}
                </p>
                {!isExpanded && roadmap.description?.length > 150 && (
                  <div className={`absolute bottom-0 left-0 right-0 h-8 ${darkMode ? 'bg-gradient-to-t from-gray-900' : 'bg-gradient-to-t from-white'}`} />
                )}
              </motion.div>
            </AnimatePresence>
            {roadmap.description?.length > 150 && (
              <button
                onClick={() => toggleDescription(roadmapId)}
                className={`
                  mt-1 text-xs font-medium flex items-center gap-1
                  ${darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800'}
                  transition-colors duration-200
                `}
              >
                {isExpanded ? 'Show less' : 'Show more'}
                <motion.span
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <FaChevronDown />
                </motion.span>
              </button>
            )}
          </div>
            
          {/* Progress bar */}
          {roadmapHasResources && (
            <div className="mt-4">
              <div className="flex justify-between text-xs mb-1">
                <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Progress</span>
                <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {completionPercentage}%
                </span>
              </div>
              <div className={`h-2 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${completionPercentage}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className={`h-2 rounded-full bg-gradient-to-r ${
                    !isCustom
                      ? 'from-indigo-500 to-sky-500'
                      : 'from-violet-500 to-purple-500'
                  }`}
                />
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className={`mt-4 text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
            Last updated: {formatDate(roadmap.updatedAt || roadmap.createdAt)}
          </div>
        </div>
      </motion.div>
    );
  };

  // Pagination logic
  const paginateRoadmaps = (roadmaps, currentPage) => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return roadmaps.slice(startIndex, endIndex);
  };

  const regularTotalPages = Math.ceil(filteredRegularRoadmaps.length / ITEMS_PER_PAGE);
  const customTotalPages = Math.ceil(filteredCustomRoadmaps.length / ITEMS_PER_PAGE);

  // Reset pagination when filters change
  React.useEffect(() => {
    setRegularCurrentPage(1);
    setCustomCurrentPage(1);
  }, [searchTerm, activeTab, sortMethod]);

  const paginatedRegularRoadmaps = paginateRoadmaps(filteredRegularRoadmaps, regularCurrentPage);
  const paginatedCustomRoadmaps = paginateRoadmaps(filteredCustomRoadmaps, customCurrentPage);

  return (
    <motion.div
      variants={listVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Regular Roadmaps */}
      {filteredRegularRoadmaps.length > 0 && activeTab !== 'custom' && (
        <div className="space-y-4">
          <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Standard Roadmaps
          </h2>
          {paginatedRegularRoadmaps.map(roadmap => (
            <RoadmapCard 
              key={roadmap._id} 
              roadmap={roadmap} 
              isCustom={false}
            />
          ))}
          {regularTotalPages > 1 && (
            <Pagination
              currentPage={regularCurrentPage}
              totalPages={regularTotalPages}
              onPageChange={setRegularCurrentPage}
              darkMode={darkMode}
            />
          )}
        </div>
      )}

      {/* Custom Roadmaps */}
      {filteredCustomRoadmaps.length > 0 && activeTab !== 'regular' && (
        <div className="space-y-4">
          <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Custom Roadmaps
          </h2>
          {paginatedCustomRoadmaps.map(roadmap => (
            <RoadmapCard 
              key={roadmap._id || roadmap.id} 
              roadmap={roadmap} 
              isCustom={true}
            />
          ))}
          {customTotalPages > 1 && (
            <Pagination
              currentPage={customCurrentPage}
              totalPages={customTotalPages}
              onPageChange={setCustomCurrentPage}
              darkMode={darkMode}
            />
          )}
        </div>
      )}
    </motion.div>
  );
};

export default RoadmapList; 