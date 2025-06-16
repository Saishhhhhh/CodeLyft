import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import { getUserRoadmaps } from '../services/roadmapService';
import { useCustomRoadmap } from '../context/CustomRoadmapContext';
import { motion } from 'framer-motion';
import { FaRoad, FaPlus, FaChevronRight, FaChartLine, FaFolder } from 'react-icons/fa';

const Dashboard = () => {
  const { user } = useAuth();
  const [recentRoadmaps, setRecentRoadmaps] = useState([]);
  const [loadingRoadmaps, setLoadingRoadmaps] = useState(true);
  const { savedRoadmaps } = useCustomRoadmap();
  const navigate = useNavigate();

  // Fetch recent roadmaps
  useEffect(() => {
    const fetchRecentRoadmaps = async () => {
      try {
        setLoadingRoadmaps(true);
        const response = await getUserRoadmaps();
        
        if (response && response.data) {
          // Get most recent 3 roadmaps
          const recentOnes = [...response.data]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 3);
          
          setRecentRoadmaps(recentOnes);
        }
      } catch (error) {
        console.error('Error fetching roadmaps:', error);
      } finally {
        setLoadingRoadmaps(false);
      }
    };

    fetchRecentRoadmaps();
  }, []);

  // Combine regular and custom roadmaps for stats
  const totalRoadmaps = (recentRoadmaps ? recentRoadmaps.length : 0) + (savedRoadmaps ? savedRoadmaps.length : 0);
  const completedRoadmaps = recentRoadmaps.filter(roadmap => 
    roadmap.completionPercentage && roadmap.completionPercentage === 100
  ).length;

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50 pt-20 pb-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Welcome Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl shadow-xl p-8 mb-8"
          >
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="md:flex-1">
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                  Welcome back, {user?.name?.split(' ')[0] || 'there'}!
                </h1>
                <p className="text-purple-100 mb-6 max-w-xl">
                  Continue your learning journey. Track your progress, explore new topics, and achieve your learning goals.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link to="/" className="inline-flex items-center px-5 py-3 bg-white text-purple-700 rounded-lg font-medium shadow hover:bg-gray-50 transition-colors">
                    Create New Roadmap
                  </Link>
                  <Link to="/my-roadmaps" className="inline-flex items-center px-5 py-3 bg-purple-700 bg-opacity-30 text-white rounded-lg font-medium hover:bg-opacity-40 transition-colors">
                    View All Roadmaps
                  </Link>
                </div>
              </div>
              <div className="mt-6 md:mt-0 flex-shrink-0">
                <div className="w-20 h-20 md:w-28 md:h-28 rounded-full border-4 border-purple-300 overflow-hidden">
                  <img 
                    src={user?.profilePicture || "https://via.placeholder.com/200?text=Profile"} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </motion.div>
          
          {/* Quick Stats */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10"
          >
            <motion.div 
              variants={itemVariants}
              className="bg-white rounded-xl shadow p-6 flex items-center"
            >
              <div className="bg-blue-100 p-4 rounded-lg mr-4">
                <FaRoad className="text-blue-600 text-xl" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Total Roadmaps</h3>
                <p className="text-2xl font-bold text-gray-800">{totalRoadmaps}</p>
              </div>
            </motion.div>
            
            <motion.div 
              variants={itemVariants}
              className="bg-white rounded-xl shadow p-6 flex items-center"
            >
              <div className="bg-green-100 p-4 rounded-lg mr-4">
                <FaChartLine className="text-green-600 text-xl" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Completed Roadmaps</h3>
                <p className="text-2xl font-bold text-gray-800">{completedRoadmaps}</p>
              </div>
            </motion.div>
            
            <motion.div 
              variants={itemVariants}
              className="bg-white rounded-xl shadow p-6 flex items-center"
            >
              <div className="bg-purple-100 p-4 rounded-lg mr-4">
                <FaFolder className="text-purple-600 text-xl" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Custom Roadmaps</h3>
                <p className="text-2xl font-bold text-gray-800">{savedRoadmaps?.length || 0}</p>
              </div>
            </motion.div>
          </motion.div>
          
          {/* Recent Roadmaps */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Recent Roadmaps</h2>
              <Link to="/my-roadmaps" className="text-purple-600 hover:text-purple-800 font-medium flex items-center">
                View All <FaChevronRight className="ml-1 text-xs" />
              </Link>
            </div>
            
            {loadingRoadmaps ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
              </div>
            ) : recentRoadmaps.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recentRoadmaps.map((roadmap) => (
                  <motion.div 
                    key={roadmap._id}
                    variants={itemVariants}
                    whileHover={{ y: -5, transition: { duration: 0.2 } }}
                    className="bg-white rounded-xl shadow-md overflow-hidden cursor-pointer"
                    onClick={() => navigate(`/roadmaps/${roadmap._id}/resources`)}
                  >
                    <div className="p-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">{roadmap.title}</h3>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{roadmap.description}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">
                          {new Date(roadmap.createdAt).toLocaleDateString()}
                        </span>
                        {roadmap.completionPercentage > 0 && (
                          <div className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                            {roadmap.completionPercentage}% Complete
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="bg-gray-50 px-6 py-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium text-gray-500">{roadmap.difficulty || 'N/A'}</span>
                        <span className="text-purple-600 text-sm font-medium flex items-center">
                          Continue <FaChevronRight size={10} className="ml-1" />
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <motion.div 
                variants={itemVariants}
                className="bg-white rounded-xl shadow-md p-8 text-center"
              >
                <FaRoad className="mx-auto text-gray-400 text-4xl mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No roadmaps yet</h3>
                <p className="text-gray-500 mb-6">Create your first learning roadmap to start your educational journey</p>
                <Link to="/" className="inline-flex items-center px-5 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors">
                  <FaPlus className="mr-2" /> Create New Roadmap
                </Link>
              </motion.div>
            )}
          </motion.div>
          
          {/* Quick Actions */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <motion.div 
              variants={itemVariants}
              className="bg-white rounded-xl shadow-md overflow-hidden"
            >
              <div className="bg-gradient-to-r from-blue-500 to-cyan-500 h-3"></div>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Create Custom Roadmap</h3>
                <p className="text-gray-600 mb-6">
                  Build a custom roadmap with your own topics and add YouTube resources.
                </p>
                <Link 
                  to="/custom-roadmap" 
                  className="inline-flex items-center px-4 py-2 border border-blue-500 text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors"
                >
                  Get Started <FaChevronRight className="ml-2 text-xs" />
                </Link>
              </div>
            </motion.div>
            
            <motion.div 
              variants={itemVariants}
              className="bg-white rounded-xl shadow-md overflow-hidden"
            >
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-3"></div>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Find Learning Resources</h3>
                <p className="text-gray-600 mb-6">
                  Generate AI-powered resource recommendations for any topic.
                </p>
                <Link 
                  to="/" 
                  className="inline-flex items-center px-4 py-2 border border-green-500 text-green-600 rounded-lg font-medium hover:bg-green-50 transition-colors"
                >
                  Explore Resources <FaChevronRight className="ml-2 text-xs" />
                </Link>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard; 