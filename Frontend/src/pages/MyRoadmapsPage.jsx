import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getUserRoadmaps, deleteRoadmap } from '../services/roadmapService';
import { useAuth } from '../context/AuthContext';
import { useCustomRoadmap } from '../context/CustomRoadmapContext';
import Navbar from '../components/Navbar';
import ImportRoadmapModal from '../components/roadmap/ImportRoadmapModal';
import { FaTrash, FaEdit, FaEye, FaPlus, FaRoad, FaYoutube, FaBookOpen, FaChevronRight, FaFileImport, FaTools } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import ChatbotWrapper from '../components/chatbot/ChatbotWrapper';

const MyRoadmapsPage = () => {
  const [roadmaps, setRoadmaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
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
        
        // No need to await this, it will update state when complete
        loadSavedRoadmaps();
        
        setError(null);
      } catch (err) {
        console.error('Error fetching roadmaps:', err);
        setError('Failed to load your roadmaps. Please try again later.');
        setRoadmaps([]); // Set to empty array on error
      } finally {
        setLoading(false);
      }
    };

    fetchRoadmaps();
  }, [isAuthenticated, navigate]);

  const handleDeleteRoadmap = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    
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
    e.preventDefault();
    e.stopPropagation();
    
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

  const handleImportSuccess = (newRoadmap) => {
    setRoadmaps([newRoadmap, ...roadmaps]);
  };

  const difficultyColor = (difficulty) => {
    switch(difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-800';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'Advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter roadmaps based on whether they have generated resources
  const roadmapsWithResources = roadmaps.filter(roadmap => 
    roadmap.topics && roadmap.topics.some(topic => topic.hasGeneratedResources)
  );
  
  const roadmapsWithoutResources = roadmaps.filter(roadmap => 
    !roadmap.topics || !roadmap.topics.some(topic => topic.hasGeneratedResources)
  );
  
  // Filter custom roadmaps based on whether they have video resources
  const customRoadmapsWithResources = savedRoadmaps.filter(roadmap => 
    roadmap.topics && roadmap.topics.some(topic => topic.video)
  );
  
  const customRoadmapsWithoutResources = savedRoadmaps.filter(roadmap => 
    !roadmap.topics || !roadmap.topics.some(topic => topic.video)
  );

  // Show loading state if either regular or custom roadmaps are loading
  const isLoadingAll = loading || isLoadingCustomRoadmaps;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">My Roadmaps</h1>
          <div className="flex space-x-3">
            <button
              onClick={() => setImportModalOpen(true)}
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
            >
              <FaFileImport className="mr-2" /> Import Roadmap
            </button>
            <Link 
              to="/roadmaps/create" 
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <FaPlus className="mr-2" /> Create New Roadmap
            </Link>
          </div>
        </div>

        {isLoadingAll && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded-md mb-6">
            {error}
          </div>
        )}

        {!isLoadingAll && !error && roadmaps.length === 0 && savedRoadmaps.length === 0 && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <FaRoad className="mx-auto text-gray-400 text-5xl mb-4" />
            <h2 className="text-2xl font-semibold text-gray-700 mb-2">You don't have any roadmaps yet</h2>
            <p className="text-gray-500 mb-6">Create your first learning roadmap to organize your educational journey or import an existing one.</p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setImportModalOpen(true)}
                className="inline-flex items-center px-6 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
              >
                <FaFileImport className="mr-2" /> Import a Roadmap
              </button>
              <Link 
                to="/roadmaps/create" 
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <FaPlus className="mr-2" /> Create a Roadmap
              </Link>
              <Link 
                to="/custom-roadmap"
                className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                <FaTools className="mr-2" /> Create Custom Roadmap
              </Link>
            </div>
          </div>
        )}

        {!isLoadingAll && !error && (roadmaps.length > 0 || savedRoadmaps.length > 0) && (
          <div className="space-y-10">
            {/* Add new custom roadmap card - always show this */}
            <div className="mb-8">
              <Link 
                to="/custom-roadmap"
                className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden border-l-4 border-green-500 border-dashed max-w-md mx-auto"
              >
                <div className="p-6 flex flex-col items-center justify-center">
                  <FaPlus className="text-green-500 text-4xl mb-4" />
                  <h3 className="text-lg font-medium text-gray-700 mb-2">Create New Custom Roadmap</h3>
                  <p className="text-gray-500 text-center">Build a personalized roadmap with YouTube resources</p>
                </div>
              </Link>
            </div>

            {/* Section for roadmaps with resources */}
            {(roadmapsWithResources.length > 0 || customRoadmapsWithResources.length > 0) && (
              <div>
                <div className="flex items-center mb-4">
                  <FaYoutube className="text-purple-600 text-xl mr-2" />
                  <h2 className="text-2xl font-bold text-gray-800">Roadmaps with Resources</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Regular roadmaps with resources */}
                  {roadmapsWithResources.map((roadmap) => (
                    <Link 
                      key={roadmap._id} 
                      to={`/roadmaps/${roadmap._id}/resources`}
                      className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden"
                    >
                      <div className="p-6">
                        <div className="flex justify-between items-start">
                          <h2 className="text-xl font-semibold text-gray-800 mb-2">{roadmap.title}</h2>
                          {roadmap.isCustom ? (
                            <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-green-100 text-green-800">
                              Custom
                            </span>
                          ) : (
                            <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${difficultyColor(roadmap.difficulty)}`}>
                              {roadmap.difficulty}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 mb-4 line-clamp-2">{roadmap.description}</p>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">
                            Created: {new Date(roadmap.createdAt).toLocaleDateString()}
                          </span>
                          <div className="flex space-x-2">
                            <button 
                              onClick={(e) => handleDeleteRoadmap(roadmap._id, e)}
                              className="p-2 text-red-600 hover:text-red-800"
                              title="Delete roadmap"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="bg-gray-100 px-6 py-3 flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">{roadmap.category}</span>
                        <div className="flex items-center">
                          {roadmap.completionPercentage > 0 && (
                            <div className="mr-3 text-sm text-blue-600">
                              {roadmap.completionPercentage}% Complete
                            </div>
                          )}
                          <button 
                            className="inline-flex items-center text-sm font-medium text-purple-600 hover:text-purple-800"
                          >
                            View Resources <FaChevronRight className="ml-1" size={12} />
                          </button>
                        </div>
                      </div>
                    </Link>
                  ))}

                  {/* Custom roadmaps with resources */}
                  {customRoadmapsWithResources.map((roadmap) => (
                    <Link 
                      key={roadmap._id || roadmap.id} 
                      to={`/roadmaps/${roadmap._id || roadmap.id}/custom`}
                      className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden"
                    >
                      <div className="p-6">
                        <div className="flex justify-between items-start">
                          <h2 className="text-xl font-semibold text-gray-800 mb-2">{roadmap.name}</h2>
                          <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-green-100 text-green-800">
                            Custom
                          </span>
                        </div>
                        <p className="text-gray-600 mb-4 line-clamp-2">{roadmap.description}</p>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">
                            Topics: {roadmap.topics?.length || 0}
                          </span>
                          <div className="flex space-x-2">
                            <button 
                              onClick={(e) => handleDeleteCustomRoadmap(roadmap._id || roadmap.id, e)}
                              className="p-2 text-red-600 hover:text-red-800"
                              title="Delete custom roadmap"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="bg-gray-100 px-6 py-3 flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">Custom Roadmap</span>
                        <button 
                          className="inline-flex items-center text-sm font-medium text-purple-600 hover:text-purple-800"
                        >
                          View Resources <FaChevronRight className="ml-1" size={12} />
                        </button>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
            
            {/* Section for roadmaps without resources */}
            {(roadmapsWithoutResources.length > 0 || customRoadmapsWithoutResources.length > 0) && (
              <div>
                <div className="flex items-center mb-4">
                  <FaBookOpen className="text-blue-600 text-xl mr-2" />
                  <h2 className="text-2xl font-bold text-gray-800">Roadmaps Without Resources</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Regular roadmaps without resources */}
                  {roadmapsWithoutResources.map((roadmap) => (
                    <Link 
                      key={roadmap._id} 
                      to={`/roadmaps/${roadmap._id}`}
                      className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden"
                    >
                      <div className="p-6">
                        <div className="flex justify-between items-start">
                          <h2 className="text-xl font-semibold text-gray-800 mb-2">{roadmap.title}</h2>
                          {roadmap.isCustom ? (
                            <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-green-100 text-green-800">
                              Custom
                            </span>
                          ) : (
                            <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${difficultyColor(roadmap.difficulty)}`}>
                              {roadmap.difficulty}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 mb-4 line-clamp-2">{roadmap.description}</p>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">
                            Created: {new Date(roadmap.createdAt).toLocaleDateString()}
                          </span>
                          <div className="flex space-x-2">
                            <button 
                              onClick={(e) => handleDeleteRoadmap(roadmap._id, e)}
                              className="p-2 text-red-600 hover:text-red-800"
                              title="Delete roadmap"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="bg-gray-100 px-6 py-3 flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">{roadmap.category}</span>
                        <div className="flex items-center">
                          {roadmap.completionPercentage > 0 && (
                            <div className="mr-3 text-sm text-blue-600">
                              {roadmap.completionPercentage}% Complete
                            </div>
                          )}
                          <button 
                            className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              navigate(`/roadmaps/${roadmap._id}/generate-resources`, { state: { roadmap } });
                            }}
                          >
                            Generate Resources <FaChevronRight className="ml-1" size={12} />
                          </button>
                        </div>
                      </div>
                    </Link>
                  ))}

                  {/* Custom roadmaps without resources */}
                  {customRoadmapsWithoutResources.map((roadmap) => (
                    <Link 
                      key={roadmap._id || roadmap.id} 
                      to={`/roadmaps/${roadmap._id || roadmap.id}/custom`}
                      className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden"
                    >
                      <div className="p-6">
                        <div className="flex justify-between items-start">
                          <h2 className="text-xl font-semibold text-gray-800 mb-2">{roadmap.name}</h2>
                          <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-green-100 text-green-800">
                            Custom
                          </span>
                        </div>
                        <p className="text-gray-600 mb-4 line-clamp-2">{roadmap.description}</p>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">
                            Topics: {roadmap.topics?.length || 0}
                          </span>
                          <div className="flex space-x-2">
                            <button 
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                navigate('/custom-roadmap', { state: { roadmap } });
                              }}
                              className="p-2 text-blue-600 hover:text-blue-800"
                              title="Edit custom roadmap"
                            >
                              <FaEdit />
                            </button>
                            <button 
                              onClick={(e) => handleDeleteCustomRoadmap(roadmap._id || roadmap.id, e)}
                              className="p-2 text-red-600 hover:text-red-800"
                              title="Delete custom roadmap"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="bg-gray-100 px-6 py-3 flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">Custom Roadmap</span>
                        <div className="flex items-center">
                          <button 
                            className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              navigate(`/roadmaps/${roadmap._id || roadmap.id}/custom`, { state: { roadmap } });
                            }}
                          >
                            View Details <FaChevronRight className="ml-1" size={12} />
                          </button>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
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