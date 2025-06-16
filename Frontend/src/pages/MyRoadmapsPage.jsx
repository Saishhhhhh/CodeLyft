import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getUserRoadmaps, deleteRoadmap } from '../services/roadmapService';
import { useAuth } from '../context/AuthContext';
import { useCustomRoadmap } from '../context/CustomRoadmapContext';
import Navbar from '../components/Navbar';
import ImportRoadmapModal from '../components/roadmap/ImportRoadmapModal';
import { FaPlus, FaFileImport, FaSearch } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import ChatbotWrapper from '../components/chatbot/ChatbotWrapper';
import { motion } from 'framer-motion';

// Import modular components
import RoadmapCard from '../components/roadmap/cards/RoadmapCard';
import RoadmapStats from '../components/roadmap/cards/RoadmapStats';
import CreateRoadmapButton from '../components/roadmap/cards/CreateRoadmapButton';
import FilterBar from '../components/roadmap/cards/FilterBar';
import EmptyState from '../components/roadmap/cards/EmptyState';

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
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
      switch (sortMethod) {
        case 'newest':
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        case 'oldest':
          return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        case 'alphabetical':
          return (a.title || a.name || '').localeCompare(b.title || b.name || '');
        case 'progress':
          return (b.completionPercentage || 0) - (a.completionPercentage || 0);
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
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-10 pt-24">
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={{
            visible: {
              transition: {
                staggerChildren: 0.1
              }
            }
          }}
        >
          {/* Page Header */}
          <motion.div 
            variants={fadeIn}
            className="flex flex-col md:flex-row justify-between items-center mb-8"
          >
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">My Roadmaps</h1>
              <p className="text-gray-600">Manage and track your learning journeys</p>
            </div>
            
            <div className="flex space-x-3 mt-4 md:mt-0">
              <button
                onClick={() => setImportModalOpen(true)}
                className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 text-purple-600 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <FaFileImport className="mr-2" /> Import
              </button>
              <Link 
                to="/"
                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <FaPlus className="mr-2" /> Create New
              </Link>
            </div>
          </motion.div>

          {/* Loading State */}
          {isLoadingAll && (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <motion.div 
              variants={fadeIn}
              className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-8"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium">{error}</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Empty State */}
          {!isLoadingAll && !error && !hasRoadmaps && (
            <EmptyState onImport={() => setImportModalOpen(true)} />
          )}

          {/* Content when roadmaps exist */}
          {!isLoadingAll && !error && hasRoadmaps && (
            <>
              {/* Stats Section */}
              <RoadmapStats regular={roadmaps} custom={savedRoadmaps} />
              
              {/* Create Roadmap Banner */}
              <CreateRoadmapButton />
              
              {/* Filter Bar */}
              <FilterBar 
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                onSort={setSortMethod}
              />
              
              {/* No results after filtering */}
              {!hasFilteredResults && (
                <motion.div 
                  variants={fadeIn}
                  className="bg-white rounded-xl shadow-md p-8 text-center"
                >
                  <FaSearch className="mx-auto text-gray-400 text-4xl mb-4" />
                  <h2 className="text-xl font-semibold text-gray-700 mb-2">No matching roadmaps found</h2>
                  <p className="text-gray-500 mb-4">Try adjusting your search or filter criteria</p>
                  <button 
                    onClick={() => {
                      setSearchTerm('');
                      setActiveTab('all');
                    }}
                    className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Clear Filters
                  </button>
                </motion.div>
              )}
              
              {/* Roadmaps Grid */}
              {hasFilteredResults && (
                <motion.div
                  variants={fadeIn}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  {/* Regular Roadmaps */}
                  {filteredRegularRoadmaps.map((roadmap) => (
                    <RoadmapCard 
                      key={roadmap._id}
                      roadmap={roadmap}
                      onDelete={handleDeleteRoadmap}
                      type="regular"
                    />
                  ))}
                  
                  {/* Custom Roadmaps */}
                  {filteredCustomRoadmaps.map((roadmap) => (
                    <RoadmapCard 
                      key={roadmap._id || roadmap.id}
                      roadmap={roadmap}
                      onDelete={handleDeleteCustomRoadmap}
                      onEdit={handleEditCustomRoadmap}
                      type="custom"
                    />
                  ))}
                </motion.div>
              )}
            </>
          )}
        </motion.div>
      </div>
      
      {/* Import Modal */}
      <ImportRoadmapModal 
        isOpen={importModalOpen} 
        onClose={() => setImportModalOpen(false)} 
        onSuccess={handleImportSuccess}
      />
      
      <ChatbotWrapper />
    </div>
  );
};

export default MyRoadmapsPage; 