import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Link } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import { getUserStats, formatLearningTime } from '../services/userStatsService';
import { motion } from 'framer-motion';
import { 
  FaRoad, 
  FaYoutube, 
  FaCheck, 
  FaChartLine, 
  FaFolder, 
  FaBookOpen,
  FaRegStickyNote,
  FaClock
} from 'react-icons/fa';

const Dashboard = () => {
  const { user } = useAuth();
  const { darkMode } = useTheme();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Define colors based on theme
  const colors = {
    primary: darkMode ? '#6366F1' : '#4F46E5', // Indigo - main brand color
    secondary: darkMode ? '#F43F5E' : '#DA2C38', // YouTube Red - accent color
    accent: darkMode ? '#A78BFA' : '#8B5CF6', // Purple - complementary accent
    
    // Background colors
    background: darkMode ? '#0F172A' : '#F9F9F9', // Dark blue-black / Light Gray
    cardBg: darkMode ? '#1E293B' : '#FFFFFF', // Darker background / White
    
    // Text colors
    text: darkMode ? '#F1F5F9' : '#111827', // Light Gray / Dark Gray
    textMuted: darkMode ? '#CBD5E1' : '#6B7280', // Light gray / Medium gray
    
    // UI elements
    border: darkMode ? '#475569' : '#E5E7EB', // Medium-dark gray / Light gray
    shadow: darkMode ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.1)', // Shadows
    
    // Status colors
    success: '#10B981', // Green
    warning: '#F59E0B', // Amber
    info: '#3B82F6', // Blue
    purple: '#8B5CF6', // Purple
  };

  // Fetch user stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const userStats = await getUserStats();
        setStats(userStats);
      } catch (error) {
        console.error('Error fetching user stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

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

  const StatCard = ({ icon: Icon, title, value, color, subtitle = null }) => (
    <motion.div 
      variants={itemVariants}
      whileHover={{ 
        y: -8, 
        scale: 1.02,
        transition: { duration: 0.2 }
      }}
      className="rounded-xl shadow-md overflow-hidden cursor-pointer"
      style={{ 
        backgroundColor: colors.cardBg,
        boxShadow: `0 4px 12px ${colors.shadow}`
      }}
    >
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <motion.div 
              className="p-3 rounded-lg mr-4"
              style={{ backgroundColor: `${color}20` }}
              whileHover={{ 
                scale: 1.1,
                rotate: 5,
                transition: { duration: 0.2 }
              }}
            >
              <Icon style={{ color: color }} className="text-xl" />
            </motion.div>
            <div>
              <h3 className="text-sm font-medium" style={{ color: colors.textMuted }}>
                {title}
              </h3>
              <motion.p 
                className="text-2xl font-bold"
                style={{ color: colors.text }}
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                {value}
              </motion.p>
              {subtitle && (
                <p className="text-xs" style={{ color: colors.textMuted }}>
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <MainLayout>
      <div 
        className="min-h-screen pt-20 pb-12"
        style={{ backgroundColor: colors.background }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Welcome Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl shadow-xl p-6 sm:p-8 mb-8"
            style={{ 
              background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`,
              boxShadow: `0 8px 32px ${colors.shadow}`
            }}
          >
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="md:flex-1 text-center md:text-left">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">
                  Welcome back, {user?.name?.split(' ')[0] || 'there'}!
                </h1>
                <p className="text-white text-opacity-90 mb-6 max-w-xl text-sm sm:text-base">
                  Here's your learning progress overview. Keep up the great work!
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                  <motion.div
                    whileHover={{ 
                      scale: 1.05,
                      transition: { duration: 0.2 }
                    }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link 
                      to="/" 
                      className="inline-flex items-center px-4 sm:px-5 py-2 sm:py-3 bg-white text-purple-700 rounded-lg font-medium shadow hover:bg-gray-50 transition-colors text-sm sm:text-base"
                    >
                      Create New Roadmap
                    </Link>
                  </motion.div>
                  <motion.div
                    whileHover={{ 
                      scale: 1.05,
                      transition: { duration: 0.2 }
                    }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link 
                      to="/my-roadmaps" 
                      className="inline-flex items-center px-4 sm:px-5 py-2 sm:py-3 bg-white text-purple-700 rounded-lg font-medium shadow hover:bg-gray-50 transition-colors text-sm sm:text-base"
                    >
                      View All Roadmaps
                    </Link>
                  </motion.div>
                </div>
              </div>
              <div className="mt-6 md:mt-0 flex-shrink-0 md:ml-16">
                <motion.div 
                  className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-full border-4 border-white border-opacity-30 overflow-hidden"
                  whileHover={{ 
                    scale: 1.1,
                    rotate: 5,
                    transition: { duration: 0.3 }
                  }}
                >
                  <img 
                    src={user?.profilePicture || "https://via.placeholder.com/200?text=Profile"} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                </motion.div>
              </div>
            </div>
          </motion.div>
          
          {/* Loading State */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div 
                className="animate-spin rounded-full h-10 w-10 border-b-2"
                style={{ borderColor: colors.primary }}
              ></div>
            </div>
          ) : (
            /* User Stats Grid */
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"
            >
              <StatCard
                icon={FaRoad}
                title="Total Roadmaps"
                value={stats?.totalRoadmaps || 0}
                color={colors.info}
                subtitle={`${stats?.regularRoadmaps || 0} regular, ${stats?.customRoadmaps || 0} custom`}
              />
              
              <StatCard
                icon={FaCheck}
                title="Completed Roadmaps"
                value={stats?.completedRoadmaps || 0}
                color={colors.success}
                subtitle={`${stats?.averageCompletion || 0}% average completion`}
              />
            </motion.div>
          )}

          {/* Additional Stats Section */}
          {!loading && stats && (
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              {/* Progress Overview */}
              <motion.div 
                variants={itemVariants}
                whileHover={{ 
                  y: -4, 
                  scale: 1.01,
                  transition: { duration: 0.2 }
                }}
                className="rounded-xl shadow-md p-4 sm:p-6 cursor-pointer"
                style={{ 
                  backgroundColor: colors.cardBg,
                  boxShadow: `0 4px 12px ${colors.shadow}`
                }}
              >
                <motion.h3 
                  className="text-base sm:text-lg font-semibold mb-4 sm:mb-6" 
                  style={{ color: colors.text }}
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  Learning Progress
                </motion.h3>
                
                {/* Video Completion Rate */}
                <motion.div 
                  className="mb-4 sm:mb-6"
                  whileHover={{ x: 5 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <div className="flex items-center">
                      <motion.div 
                        className="p-1.5 sm:p-2 rounded-lg mr-2 sm:mr-3"
                        style={{ backgroundColor: `${colors.primary}20` }}
                        whileHover={{ 
                          scale: 1.1,
                          rotate: 5,
                          transition: { duration: 0.2 }
                        }}
                      >
                        <FaCheck style={{ color: colors.primary }} className="text-lg sm:text-xl" />
                      </motion.div>
                      <span className="text-xs sm:text-sm font-medium" style={{ color: colors.textMuted }}>
                        Video Completion Rate
                      </span>
                    </div>
                    <motion.span 
                      className="text-xl sm:text-2xl font-bold" 
                      style={{ color: colors.primary }}
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.2 }}
                    >
                      {stats.completionPercentage || 0}%
                    </motion.span>
                  </div>
                  <div 
                    className="w-full h-2 sm:h-3 rounded-full overflow-hidden"
                    style={{ backgroundColor: `${colors.border}40` }}
                  >
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ 
                        width: `${stats.completionPercentage || 0}%` 
                      }}
                      transition={{ duration: 1, delay: 0.5 }}
                      className="h-2 sm:h-3 rounded-full"
                      style={{ backgroundColor: colors.primary }}
                      whileHover={{ 
                        scaleY: 1.2,
                        transition: { duration: 0.2 }
                      }}
                    />
                  </div>
                </motion.div>
                
                {/* Total Learning Time */}
                <motion.div 
                  className="mb-4 sm:mb-6"
                  whileHover={{ x: 5 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <motion.div 
                        className="p-1.5 sm:p-2 rounded-lg mr-2 sm:mr-3"
                        style={{ backgroundColor: `${colors.accent}20` }}
                        whileHover={{ 
                          scale: 1.1,
                          rotate: 5,
                          transition: { duration: 0.2 }
                        }}
                      >
                        <FaClock style={{ color: colors.accent }} className="text-lg sm:text-xl" />
                      </motion.div>
                      <span className="text-xs sm:text-sm font-medium" style={{ color: colors.textMuted }}>
                        Total Learning Time
                      </span>
                    </div>
                    <motion.span 
                      className="text-xl sm:text-2xl font-bold" 
                      style={{ color: colors.accent }}
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.2 }}
                    >
                      {formatLearningTime(stats.totalLearningTime)}
                    </motion.span>
                  </div>
                </motion.div>
                
                {/* Total Resources */}
                <motion.div 
                  className="mb-4 sm:mb-6"
                  whileHover={{ x: 5 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <motion.div 
                        className="p-1.5 sm:p-2 rounded-lg mr-2 sm:mr-3"
                        style={{ backgroundColor: `${colors.secondary}20` }}
                        whileHover={{ 
                          scale: 1.1,
                          rotate: 5,
                          transition: { duration: 0.2 }
                        }}
                      >
                        <FaYoutube style={{ color: colors.secondary }} className="text-lg sm:text-xl" />
                      </motion.div>
                      <span className="text-xs sm:text-sm font-medium" style={{ color: colors.textMuted }}>
                        Total Resources
                      </span>
                    </div>
                    <div className="text-right">
                      <motion.span 
                        className="text-xl sm:text-2xl font-bold" 
                        style={{ color: colors.secondary }}
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 0.2 }}
                      >
                        {stats.totalResources}
                      </motion.span>
                      <span className="text-xs sm:text-sm ml-1 sm:ml-2" style={{ color: colors.textMuted }}>
                        ({stats.completedVideos} completed)
                      </span>
                    </div>
                  </div>
                </motion.div>
                
                {/* Total Topics */}
                <motion.div 
                  whileHover={{ x: 5 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <motion.div 
                        className="p-1.5 sm:p-2 rounded-lg mr-2 sm:mr-3"
                        style={{ backgroundColor: `${colors.info}20` }}
                        whileHover={{ 
                          scale: 1.1,
                          rotate: 5,
                          transition: { duration: 0.2 }
                        }}
                      >
                        <FaBookOpen style={{ color: colors.info }} className="text-lg sm:text-xl" />
                      </motion.div>
                      <span className="text-xs sm:text-sm font-medium" style={{ color: colors.textMuted }}>
                        Total Topics
                      </span>
                    </div>
                    <motion.span 
                      className="text-xl sm:text-2xl font-bold" 
                      style={{ color: colors.info }}
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.2 }}
                    >
                      {stats.totalTopics}
                    </motion.span>
                  </div>
                </motion.div>
              </motion.div>

              {/* Quick Actions */}
              <motion.div 
                variants={itemVariants}
                whileHover={{ 
                  y: -4, 
                  scale: 1.01,
                  transition: { duration: 0.2 }
                }}
                className="rounded-xl shadow-md p-6 cursor-pointer"
                style={{ 
                  backgroundColor: colors.cardBg,
                  boxShadow: `0 4px 12px ${colors.shadow}`
                }}
              >
                <motion.h3 
                  className="text-lg font-semibold mb-6" 
                  style={{ color: colors.text }}
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  Quick Actions
                </motion.h3>
                <div className="space-y-4">
                  <motion.div
                    whileHover={{ 
                      scale: 1.02,
                      x: 5,
                      transition: { duration: 0.2 }
                    }}
                  >
                    <Link 
                      to="/"
                      className="flex items-center p-4 rounded-xl transition-all duration-200 hover:scale-[1.02] group"
                      style={{ 
                        backgroundColor: `${colors.primary}10`,
                        border: `1px solid ${colors.primary}30`
                      }}
                    >
                      <motion.div 
                        className="p-2 rounded-lg mr-4 group-hover:scale-110 transition-transform duration-200"
                        style={{ backgroundColor: `${colors.primary}20` }}
                        whileHover={{ 
                          scale: 1.1,
                          rotate: 5,
                          transition: { duration: 0.2 }
                        }}
                      >
                        <FaRoad style={{ color: colors.primary }} className="text-lg" />
                      </motion.div>
                      <div className="flex-1">
                        <h4 className="font-semibold" style={{ color: colors.text }}>
                          Create New Learning Roadmap
                        </h4>
                        <p className="text-sm mt-1" style={{ color: colors.textMuted }}>
                          Generate AI-powered learning path
                        </p>
                      </div>
                      <motion.div 
                        className="p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        style={{ backgroundColor: `${colors.primary}20` }}
                        whileHover={{ 
                          scale: 1.1,
                          rotate: 10,
                          transition: { duration: 0.2 }
                        }}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: colors.primary }}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </motion.div>
                    </Link>
                  </motion.div>
                  
                  <motion.div
                    whileHover={{ 
                      scale: 1.02,
                      x: 5,
                      transition: { duration: 0.2 }
                    }}
                  >
                    <Link 
                      to="/custom-roadmap"
                      className="flex items-center p-4 rounded-xl transition-all duration-200 hover:scale-[1.02] group"
                      style={{ 
                        backgroundColor: `${colors.accent}10`,
                        border: `1px solid ${colors.accent}30`
                      }}
                    >
                      <motion.div 
                        className="p-2 rounded-lg mr-4 group-hover:scale-110 transition-transform duration-200"
                        style={{ backgroundColor: `${colors.accent}20` }}
                        whileHover={{ 
                          scale: 1.1,
                          rotate: 5,
                          transition: { duration: 0.2 }
                        }}
                      >
                        <FaFolder style={{ color: colors.accent }} className="text-lg" />
                      </motion.div>
                      <div className="flex-1">
                        <h4 className="font-semibold" style={{ color: colors.text }}>
                          Build Custom Roadmap
                        </h4>
                        <p className="text-sm mt-1" style={{ color: colors.textMuted }}>
                          Create your own learning structure
                        </p>
                      </div>
                      <motion.div 
                        className="p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        style={{ backgroundColor: `${colors.accent}20` }}
                        whileHover={{ 
                          scale: 1.1,
                          rotate: 10,
                          transition: { duration: 0.2 }
                        }}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: colors.accent }}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </motion.div>
                    </Link>
                  </motion.div>
                  
                  <motion.div
                    whileHover={{ 
                      scale: 1.02,
                      x: 5,
                      transition: { duration: 0.2 }
                    }}
                  >
                    <Link 
                      to="/my-roadmaps"
                      className="flex items-center p-4 rounded-xl transition-all duration-200 hover:scale-[1.02] group"
                      style={{ 
                        backgroundColor: `${colors.info}10`,
                        border: `1px solid ${colors.info}30`
                      }}
                    >
                      <motion.div 
                        className="p-2 rounded-lg mr-4 group-hover:scale-110 transition-transform duration-200"
                        style={{ backgroundColor: `${colors.info}20` }}
                        whileHover={{ 
                          scale: 1.1,
                          rotate: 5,
                          transition: { duration: 0.2 }
                        }}
                      >
                        <FaChartLine style={{ color: colors.info }} className="text-lg" />
                      </motion.div>
                      <div className="flex-1">
                        <h4 className="font-semibold" style={{ color: colors.text }}>
                          View All Roadmaps
                        </h4>
                        <p className="text-sm mt-1" style={{ color: colors.textMuted }}>
                          Manage and track your progress
                        </p>
                      </div>
                      <motion.div 
                        className="p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        style={{ backgroundColor: `${colors.info}20` }}
                        whileHover={{ 
                          scale: 1.1,
                          rotate: 10,
                          transition: { duration: 0.2 }
                        }}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: colors.info }}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </motion.div>
                    </Link>
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard; 