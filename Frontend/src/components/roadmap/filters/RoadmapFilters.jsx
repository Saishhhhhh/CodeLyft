import React from 'react';
import { FaSearch, FaSort } from 'react-icons/fa';
import { motion } from 'framer-motion';

const RoadmapFilters = ({ 
  searchTerm, 
  onSearchChange, 
  activeTab, 
  onTabChange, 
  sortMethod,
  onSortChange,
  theme
}) => {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.3 }
    }
  };

  // Tab style helper
  const tabStyle = (active) => ({
    padding: '0.5rem 1rem',
    fontSize: '0.95rem',
    fontWeight: 500,
    borderBottom: active ? `2px solid ${theme.primary}` : '2px solid transparent',
    color: active ? theme.primary : theme.textMuted,
    background: 'none',
    outline: 'none',
    transition: 'color 0.2s, border-color 0.2s',
    cursor: 'pointer',
  });

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      style={{
        background: theme.cardBg,
        border: `1px solid ${theme.border}`,
        borderRadius: '0.75rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        padding: '1rem',
        marginBottom: '1.5rem',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 8 }}>
        {/* Search Bar */}
        <div style={{ flex: 1 }}>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: 12, top: 0, bottom: 0, display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
              <FaSearch style={{ color: theme.textMuted }} />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search roadmaps..."
              style={{
                width: '100%',
                padding: '0.5rem 1rem 0.5rem 2.5rem',
                border: `1px solid ${theme.border}`,
                borderRadius: '0.5rem',
                background: theme.cardBg,
                color: theme.text,
                fontSize: '1rem',
                outline: 'none',
                transition: 'border 0.2s',
              }}
            />
          </div>
        </div>

        {/* Sort Dropdown */}
        <div style={{ minWidth: 180 }}>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: 12, top: 0, bottom: 0, display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
              <FaSort style={{ color: theme.textMuted }} />
            </div>
            <select
              value={sortMethod}
              onChange={(e) => onSortChange(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 1rem 0.5rem 2.5rem',
                border: `1px solid ${theme.border}`,
                borderRadius: '0.5rem',
                background: theme.cardBg,
                color: theme.text,
                fontSize: '1rem',
                outline: 'none',
                appearance: 'none',
                transition: 'border 0.2s',
              }}
            >
              <option value="progress">Progress </option>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
            <div style={{ position: 'absolute', right: 12, top: 0, bottom: 0, display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
              <svg className="h-4 w-4" fill="none" stroke={theme.textMuted} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', marginTop: 8, borderBottom: `1px solid ${theme.border}`, background: theme.cardBg }}>
        <button
          onClick={() => onTabChange('all')}
          style={tabStyle(activeTab === 'all')}
        >
          All Roadmaps
        </button>
        <button
          onClick={() => onTabChange('regular')}
          style={tabStyle(activeTab === 'regular')}
        >
          Standard
        </button>
        <button
          onClick={() => onTabChange('custom')}
          style={tabStyle(activeTab === 'custom')}
        >
          Custom
        </button>
        <button
          onClick={() => onTabChange('resources')}
          style={tabStyle(activeTab === 'resources')}
        >
          With Resources
        </button>
      </div>
    </motion.div>
  );
};

export default RoadmapFilters; 