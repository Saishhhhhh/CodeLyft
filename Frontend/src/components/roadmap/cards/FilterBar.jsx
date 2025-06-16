import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaSearch, FaSort } from 'react-icons/fa';

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

const FilterBar = ({ searchTerm, onSearchChange, activeTab, onTabChange, onSort }) => {
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  
  return (
    <motion.div
      variants={fadeIn}
      className="bg-white rounded-xl shadow-md p-4 mb-8"
    >
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search input */}
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaSearch className="text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search roadmaps..."
            className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 text-gray-700"
          />
        </div>
        
        {/* Filter tabs */}
        <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => onTabChange('all')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'all' 
                ? 'bg-white text-purple-700 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All
          </button>
          <button
            onClick={() => onTabChange('regular')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'regular' 
                ? 'bg-white text-purple-700 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Regular
          </button>
          <button
            onClick={() => onTabChange('custom')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'custom' 
                ? 'bg-white text-purple-700 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Custom
          </button>
          <button
            onClick={() => onTabChange('resources')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'resources' 
                ? 'bg-white text-purple-700 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            With Resources
          </button>
        </div>
        
        {/* Sort button */}
        <div className="relative">
          <button 
            onClick={() => setSortMenuOpen(!sortMenuOpen)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50"
          >
            <FaSort className="mr-2" /> Sort
          </button>
          
          {sortMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
              <button 
                onClick={() => {
                  onSort('newest');
                  setSortMenuOpen(false);
                }}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Newest First
              </button>
              <button 
                onClick={() => {
                  onSort('oldest');
                  setSortMenuOpen(false);
                }}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Oldest First
              </button>
              <button 
                onClick={() => {
                  onSort('alphabetical');
                  setSortMenuOpen(false);
                }}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Alphabetical
              </button>
              <button 
                onClick={() => {
                  onSort('progress');
                  setSortMenuOpen(false);
                }}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Progress
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default FilterBar;
