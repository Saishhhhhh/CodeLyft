import React from 'react';
import { FaSearch, FaTimes } from 'react-icons/fa';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'progress', label: 'Progress' }
];

const TAB_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'regular', label: 'Personalized' },
  { value: 'custom', label: 'Custom' },
  { value: 'resources', label: 'With Resources' }
];

const FilterBar = ({
  searchTerm,
  onSearchChange,
  activeTab,
  onTabChange,
  onSort,
  onClearFilters,
  darkMode
}) => {
  return (
    <div className={`
      p-4 rounded-xl mb-6 border
      ${darkMode 
        ? 'bg-gray-800/50 border-gray-700' 
        : 'bg-white border-gray-200'
      }
    `}>
      {/* Search Bar */}
      <div className="relative mb-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search roadmaps..."
          className={`
            w-full pl-10 pr-4 py-2 rounded-lg
            ${darkMode
              ? 'bg-gray-900 border-gray-700 text-gray-200 placeholder-gray-500'
              : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500'
            }
            border focus:ring-2 focus:ring-indigo-500 focus:border-transparent
            transition-colors duration-200
          `}
        />
        <FaSearch className={`absolute left-3 top-3 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
        {searchTerm && (
          <button
            onClick={() => onSearchChange('')}
            className={`absolute right-3 top-3 ${darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <FaTimes />
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        {/* Tab Filters */}
        <div className="flex flex-wrap gap-2 flex-1">
          {TAB_OPTIONS.map(tab => (
            <button
              key={tab.value}
              onClick={() => onTabChange(tab.value)}
              className={`
                px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-200
                ${activeTab === tab.value
                  ? darkMode
                    ? 'bg-indigo-900/50 text-indigo-400 border border-indigo-500/30'
                    : 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                  : darkMode
                    ? 'text-gray-400 hover:bg-gray-700 border border-gray-700'
                    : 'text-gray-600 hover:bg-gray-100 border border-gray-200'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Sort Dropdown */}
        <select
          onChange={(e) => onSort(e.target.value)}
          className={`
            px-3 py-1 rounded-lg text-sm
            ${darkMode
              ? 'bg-gray-900 border-gray-700 text-gray-300'
              : 'bg-white border-gray-200 text-gray-700'
            }
            border focus:ring-2 focus:ring-indigo-500 focus:border-transparent
            transition-colors duration-200
          `}
        >
          {SORT_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Clear Filters */}
        {(searchTerm || activeTab !== 'all') && (
          <button
            onClick={onClearFilters}
            className={`
              px-3 py-1 rounded-lg text-sm font-medium
              ${darkMode
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }
              transition-colors duration-200
            `}
          >
            Clear Filters
          </button>
        )}
      </div>
    </div>
  );
};

export default FilterBar;
