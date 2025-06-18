import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserRoadmaps, deleteRoadmap } from '../services/roadmapService';
import { useAuth } from '../context/AuthContext';
import { useCustomRoadmap } from '../context/CustomRoadmapContext';
import Navbar from '../components/Navbar';
import ImportRoadmapModal from '../components/roadmap/ImportRoadmapModal';
import { toast } from 'react-hot-toast';
import ChatbotWrapper from '../components/chatbot/ChatbotWrapper';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { FaRoad, FaPencilAlt, FaYoutube, FaSearch, FaSort } from 'react-icons/fa';

// Import our modular components
import RoadmapList from '../components/roadmap/cards/RoadmapList';
import RoadmapActions from '../components/roadmap/header/RoadmapActions';
import EmptyState from '../components/roadmap/states/EmptyState';
import NoResultsState from '../components/roadmap/states/NoResultsState';
import LoadingState from '../components/roadmap/states/LoadingState';
import FilterBar from '../components/roadmap/cards/FilterBar';

// Modular theme helper (matches HomePage/RoadmapProgressPage)
const useRoadmapTheme = (darkMode = false) => ({
  primary: '#4F46E5',
  secondary: '#DA2C38',
  accent: '#8B5CF6',
  background: darkMode ? '#111827' : '#F9F9F9',
  cardBg: darkMode ? '#1E293B' : '#FFFFFF',
  text: darkMode ? '#F9F9F9' : '#111827',
  textMuted: darkMode ? '#94A3B8' : '#6B7280',
  border: darkMode ? '#334155' : '#E5E7EB',
  codeBg: darkMode ? '#0F172A' : '#F3F4F6',
  codeText: '#4F46E5',
  shadow: darkMode ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.1)',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  progressBg: darkMode ? '#1F2937' : '#F3F4F6',
  progressFill: '#4F46E5',
  progressText: darkMode ? '#F9F9F9' : '#111827',
  buttonPrimary: '#4F46E5',
  buttonSecondary: '#8B5CF6',
  buttonText: '#FFFFFF',
  buttonHover: '#4338CA',
  modalBg: darkMode ? '#1E293B' : '#FFFFFF',
  modalOverlay: darkMode ? 'rgba(0, 0, 0, 0.75)' : 'rgba(0, 0, 0, 0.5)',
  cardBorder: darkMode ? '#334155' : '#E5E7EB',
  cardHover: darkMode ? '#2D3748' : '#F9FAFB',
  animationPrimary: '#4F46E5',
  animationSecondary: '#8B5CF6',
  animationAccent: '#DA2C38',
});

// Animation variants
const pageVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1, 
    transition: {
      when: "beforeChildren",
      staggerChildren: 0.2
    }
  }
};

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

// Main Component
const MyRoadmapsPage = () => {
  const [roadmaps, setRoadmaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [sortMethod, setSortMethod] = useState('newest');
  
  const { isAuthenticated, user } = useAuth();
  const { savedRoadmaps, loadSavedRoadmaps, deleteSavedRoadmap, isLoading: isLoadingCustomRoadmaps } = useCustomRoadmap();
  const { darkMode } = useTheme();
  const theme = useRoadmapTheme(darkMode);
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect if not authenticated
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const fetchRoadmaps = async () => {
      try {
        setLoading(true);
        // Load regular roadmaps
        const response = await getUserRoadmaps();
        if (response && response.data) {
          setRoadmaps(response.data || []);
        } else {
          setRoadmaps([]);
          console.warn('No regular roadmaps data returned');
        }
        
        // Load custom roadmaps
        loadSavedRoadmaps();
        
        setError(null);
      } catch (err) {
        console.error('Error fetching roadmaps:', err);
        setError('Failed to load your roadmaps. Please try again later.');
        setRoadmaps([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRoadmaps();
  }, [isAuthenticated, navigate]);

  const handleDeleteRoadmap = async (id, e) => {
    if (!window.confirm('Are you sure you want to delete this roadmap? This action cannot be undone.')) {
      return;
    }
    
    try {
      await deleteRoadmap(id);
      setRoadmaps(roadmaps.filter(roadmap => roadmap._id !== id));
      toast.success('Roadmap deleted successfully');
    } catch (err) {
      console.error('Error deleting roadmap:', err);
      toast.error('Failed to delete roadmap');
    }
  };

  const handleDeleteCustomRoadmap = async (id, e) => {
    if (!window.confirm('Are you sure you want to delete this custom roadmap? This action cannot be undone.')) {
      return;
    }
    
    try {
      await deleteSavedRoadmap(id);
      toast.success('Custom roadmap deleted successfully');
    } catch (err) {
      console.error('Error deleting custom roadmap:', err);
      toast.error('Failed to delete custom roadmap');
    }
  };

  const handleEditCustomRoadmap = (roadmap) => {
    navigate('/custom-roadmap', { state: { roadmap } });
  };

  const handleImportSuccess = (newRoadmap) => {
    setRoadmaps([newRoadmap, ...roadmaps]);
    toast.success('Roadmap imported successfully');
  };

  // Handle clearing filters
  const handleClearFilters = () => {
    setSearchTerm('');
    setActiveTab('all');
    setSortMethod('newest');
  };

  // Handle sorting and filtering
  const filterAndSortRoadmaps = () => {
    // First filter by search term
    let filteredRegularRoadmaps = [...roadmaps];
    let filteredCustomRoadmaps = [...savedRoadmaps];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filteredRegularRoadmaps = filteredRegularRoadmaps.filter(roadmap => 
        roadmap.title?.toLowerCase().includes(term) || 
        roadmap.description?.toLowerCase().includes(term) ||
        roadmap.category?.toLowerCase().includes(term)
      );
      
      filteredCustomRoadmaps = filteredCustomRoadmaps.filter(roadmap => 
        roadmap.name?.toLowerCase().includes(term) || 
        roadmap.description?.toLowerCase().includes(term)
      );
    }
    
    // Then filter by tab
    if (activeTab === 'regular') {
      filteredCustomRoadmaps = [];
    } else if (activeTab === 'custom') {
      filteredRegularRoadmaps = [];
    } else if (activeTab === 'resources') {
      filteredRegularRoadmaps = filteredRegularRoadmaps.filter(roadmap => 
        roadmap.topics && roadmap.topics.some(topic => topic.hasGeneratedResources)
      );
      filteredCustomRoadmaps = filteredCustomRoadmaps.filter(roadmap => 
        roadmap.topics && roadmap.topics.some(topic => topic.video)
      );
    }
    
    // Sort results
    const sortRoadmaps = (a, b) => {
      const getDate = (roadmap) => {
        const date = roadmap.updatedAt || roadmap.createdAt;
        return date ? new Date(date).getTime() : 0;
      };

      const getProgress = (roadmap) => {
        if (roadmap.completionPercentage !== undefined) {
          return roadmap.completionPercentage;
        }
        if (roadmap.completedResources !== undefined && roadmap.totalResources) {
          return Math.round((roadmap.completedResources / roadmap.totalResources) * 100);
        }
        return 0;
      };

      switch (sortMethod) {
        case 'newest':
          return getDate(b) - getDate(a);
        case 'oldest':
          return getDate(a) - getDate(b);
        case 'progress':
          return getProgress(b) - getProgress(a);
        case 'progressAsc':
          return getProgress(a) - getProgress(b);
        default:
          return 0;
      }
    };
    
    filteredRegularRoadmaps.sort(sortRoadmaps);
    filteredCustomRoadmaps.sort(sortRoadmaps);
    
    return { filteredRegularRoadmaps, filteredCustomRoadmaps };
  };
  
  const { filteredRegularRoadmaps, filteredCustomRoadmaps } = filterAndSortRoadmaps();
  const isLoadingAll = loading || isLoadingCustomRoadmaps;
  const hasRoadmaps = roadmaps.length > 0 || savedRoadmaps.length > 0;
  const hasFilteredResults = filteredRegularRoadmaps.length > 0 || filteredCustomRoadmaps.length > 0;
  
  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <Navbar />
      
      <motion.main
        variants={pageVariants}
        initial="hidden"
        animate="visible"
        className="container mx-auto px-4 py-8 pt-20"
      >
        {/* Page Title */}
        <motion.div
          variants={sectionVariants}
          className="mb-8"
        >
          <h1 className={`text-3xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {user?.name ? `${user.name.split(' ')[0]}'s Roadmaps` : 'My Roadmaps'}
          </h1>
          <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Manage and track your learning journey
          </p>
        </motion.div>

        {/* Header Section */}
        <motion.div variants={sectionVariants} className="mb-8">
          <RoadmapActions
            onCreateCustom={() => navigate('/custom-roadmap')}
            theme={theme}
          />
        </motion.div>

        {/* Combined Filters and Stats Section */}
        <motion.div variants={sectionVariants} className="mb-8">
          <div className="rounded-xl border shadow-lg p-6" style={{ background: theme.cardBg, borderColor: theme.border }}>
            {/* Stats Row */}
            {hasRoadmaps && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {/* Total Roadmaps */}
                <div className="flex items-center p-4 rounded-lg" style={{ background: theme.background }}>
                  <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center mr-4">
                    <FaRoad className="text-white text-xl" />
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: theme.textMuted }}>Total Roadmaps</p>
                    <p className="text-2xl font-bold text-indigo-500">{roadmaps.length + savedRoadmaps.length}</p>
                  </div>
                </div>

                {/* Custom Roadmaps */}
                <div className="flex items-center p-4 rounded-lg" style={{ background: theme.background }}>
                  <div className="w-10 h-10 bg-violet-600 rounded-full flex items-center justify-center mr-4">
                    <FaPencilAlt className="text-white text-xl" />
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: theme.textMuted }}>Custom Roadmaps</p>
                    <p className="text-2xl font-bold text-violet-500">{savedRoadmaps.length}</p>
                  </div>
                </div>

                {/* With Resources */}
                <div className="flex items-center p-4 rounded-lg" style={{ background: theme.background }}>
                  <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center mr-4">
                    <FaYoutube className="text-white text-xl" />
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: theme.textMuted }}>With Resources</p>
                    <p className="text-2xl font-bold text-green-500">
                      {[...roadmaps, ...savedRoadmaps].filter(roadmap => 
                        roadmap.topics?.some(topic => 
                          (topic.hasGeneratedResources && topic.resources?.length > 0) || 
                          (topic.video?.videos?.length > 0)
                        )
                      ).length}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Search and Filters */}
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch style={{ color: theme.textMuted }} />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search roadmaps..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg border"
                  style={{
                    background: theme.background,
                    borderColor: theme.border,
                    color: theme.text
                  }}
                />
              </div>

              {/* Sort Dropdown */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSort style={{ color: theme.textMuted }} />
                </div>
                <select
                  value={sortMethod}
                  onChange={(e) => setSortMethod(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border appearance-none"
                  style={{
                    background: theme.background,
                    borderColor: theme.border,
                    color: theme.text
                  }}
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="progress">Progress</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4" fill="none" stroke={theme.textMuted} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="flex border-b" style={{ borderColor: theme.border }}>
                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-4 py-2 font-medium ${activeTab === 'all' ? 'border-b-2' : ''}`}
                  style={{
                    borderColor: activeTab === 'all' ? theme.primary : 'transparent',
                    color: activeTab === 'all' ? theme.primary : theme.textMuted
                  }}
                >
                  All Roadmaps
                </button>
                <button
                  onClick={() => setActiveTab('regular')}
                  className={`px-4 py-2 font-medium ${activeTab === 'regular' ? 'border-b-2' : ''}`}
                  style={{
                    borderColor: activeTab === 'regular' ? theme.primary : 'transparent',
                    color: activeTab === 'regular' ? theme.primary : theme.textMuted
                  }}
                >
                  Standard
                </button>
                <button
                  onClick={() => setActiveTab('custom')}
                  className={`px-4 py-2 font-medium ${activeTab === 'custom' ? 'border-b-2' : ''}`}
                  style={{
                    borderColor: activeTab === 'custom' ? theme.primary : 'transparent',
                    color: activeTab === 'custom' ? theme.primary : theme.textMuted
                  }}
                >
                  Custom
                </button>
                <button
                  onClick={() => setActiveTab('resources')}
                  className={`px-4 py-2 font-medium ${activeTab === 'resources' ? 'border-b-2' : ''}`}
                  style={{
                    borderColor: activeTab === 'resources' ? theme.primary : 'transparent',
                    color: activeTab === 'resources' ? theme.primary : theme.textMuted
                  }}
                >
                  With Resources
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Content Section */}
        <motion.div variants={sectionVariants}>
          {isLoadingAll ? (
            <LoadingState theme={theme} />
          ) : error ? (
            <div className="text-red-500 text-center py-8">{error}</div>
          ) : !hasRoadmaps ? (
            <EmptyState
              onCreateCustom={() => navigate('/custom-roadmap')}
              theme={theme}
            />
          ) : !hasFilteredResults ? (
            <NoResultsState onClearFilters={handleClearFilters} theme={theme} />
          ) : (
            <RoadmapList
              regularRoadmaps={filteredRegularRoadmaps}
              customRoadmaps={filteredCustomRoadmaps}
              onDeleteRegular={handleDeleteRoadmap}
              onDeleteCustom={handleDeleteCustomRoadmap}
              onEditCustom={handleEditCustomRoadmap}
              searchTerm={searchTerm}
              activeTab={activeTab}
              sortMethod={sortMethod}
              darkMode={darkMode}
            />
          )}
        </motion.div>
      </motion.main>

      {/* Import Modal */}
      <ImportRoadmapModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onSuccess={handleImportSuccess}
        theme={theme}
      />

      {/* Chatbot */}
      <ChatbotWrapper />
    </div>
  );
};

export default MyRoadmapsPage; 