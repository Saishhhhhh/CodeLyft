import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getUserRoadmaps, deleteRoadmap } from '../services/roadmapService';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import ImportRoadmapModal from '../components/roadmap/ImportRoadmapModal';
import { FaTrash, FaEdit, FaEye, FaPlus, FaRoad, FaYoutube, FaBookOpen, FaChevronRight, FaFileImport } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const MyRoadmapsPage = () => {
  const [roadmaps, setRoadmaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const { isAuthenticated, user } = useAuth();
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
        const response = await getUserRoadmaps();
        setRoadmaps(response.data || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching roadmaps:', err);
        setError('Failed to load your roadmaps. Please try again later.');
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

        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded-md mb-6">
            {error}
          </div>
        )}

        {!loading && !error && roadmaps.length === 0 && (
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
            </div>
          </div>
        )}

        {!loading && !error && roadmaps.length > 0 && (
          <div className="space-y-10">
            {/* Section for roadmaps with resources */}
            <div>
              <div className="flex items-center mb-4">
                <FaYoutube className="text-purple-600 text-xl mr-2" />
                <h2 className="text-2xl font-bold text-gray-800">Roadmaps with Resources</h2>
              </div>
              
              {roadmapsWithResources.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {roadmapsWithResources.map((roadmap) => (
                    <Link 
                      key={roadmap._id} 
                      to={`/roadmaps/${roadmap._id}/resources`}
                      className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden"
                    >
                      <div className="p-6">
                        <div className="flex justify-between items-start">
                          <h2 className="text-xl font-semibold text-gray-800 mb-2">{roadmap.title}</h2>
                          <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${difficultyColor(roadmap.difficulty)}`}>
                            {roadmap.difficulty}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-4 line-clamp-2">{roadmap.description}</p>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">
                            Created: {new Date(roadmap.createdAt).toLocaleDateString()}
                          </span>
                          <div className="flex space-x-2">
                            <button 
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                navigate(`/roadmaps/${roadmap._id}/edit`, { state: { roadmap } });
                              }}
                              className="p-2 text-blue-600 hover:text-blue-800"
                              title="Edit roadmap"
                            >
                              <FaEdit />
                            </button>
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
                            onClick={(e) => {
                              e.preventDefault();
                              // Navigate to the dedicated resources page
                              navigate(`/roadmaps/${roadmap._id}/resources`);
                            }}
                          >
                            View Resources <FaYoutube className="ml-1" />
                          </button>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow p-6 text-center">
                  <p className="text-gray-500 mb-4">You don't have any roadmaps with resources yet.</p>
                  <p className="text-gray-500 mb-4">Generate resources for your roadmaps by clicking "Start YouTube Journey" on a roadmap.</p>
                </div>
              )}

              {/* Import button at bottom of section */}
              <div className="mt-6 flex justify-center">
                <button
                  onClick={() => setImportModalOpen(true)}
                  className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                >
                  <FaFileImport className="mr-2" /> Import Another Roadmap
                </button>
              </div>
            </div>
            
            {/* Section for roadmaps without resources */}
            <div>
              <div className="flex items-center mb-4">
                <FaBookOpen className="text-blue-600 text-xl mr-2" />
                <h2 className="text-2xl font-bold text-gray-800">Roadmaps without Resources</h2>
              </div>
              
              {roadmapsWithoutResources.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {roadmapsWithoutResources.map((roadmap) => (
                    <Link 
                      key={roadmap._id} 
                      to={`/roadmaps/${roadmap._id}/view`}
                      className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden"
                    >
                      <div className="p-6">
                        <div className="flex justify-between items-start">
                          <h2 className="text-xl font-semibold text-gray-800 mb-2">{roadmap.title}</h2>
                          <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${difficultyColor(roadmap.difficulty)}`}>
                            {roadmap.difficulty}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-4 line-clamp-2">{roadmap.description}</p>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">
                            Created: {new Date(roadmap.createdAt).toLocaleDateString()}
                          </span>
                          <div className="flex space-x-2">
                            <button 
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                navigate(`/roadmaps/${roadmap._id}/edit`, { state: { roadmap } });
                              }}
                              className="p-2 text-blue-600 hover:text-blue-800"
                              title="Edit roadmap"
                            >
                              <FaEdit />
                            </button>
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
                              // Navigate to the dedicated view page
                              navigate(`/roadmaps/${roadmap._id}/view`);
                            }}
                          >
                            View Roadmap <FaChevronRight className="ml-1" />
                          </button>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow p-6 text-center">
                  <p className="text-gray-500">You don't have any roadmaps without resources.</p>
                </div>
              )}

              {/* Import button at bottom of section */}
              <div className="mt-6 flex justify-center">
                <button
                  onClick={() => setImportModalOpen(true)}
                  className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                >
                  <FaFileImport className="mr-2" /> Import Another Roadmap
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Import Roadmap Modal */}
        <ImportRoadmapModal 
          isOpen={importModalOpen}
          onClose={() => setImportModalOpen(false)}
          onSuccess={handleImportSuccess}
        />
      </div>
    </div>
  );
};

export default MyRoadmapsPage; 