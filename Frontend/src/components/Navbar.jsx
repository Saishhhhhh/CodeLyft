import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import logo from '../assets/logo.svg';
import { motion } from 'framer-motion';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const navigate = useNavigate();
  const location = useLocation();
  const profileDropdownRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Determine if we're on auth pages
  const isLoginPage = location.pathname === '/login';
  const isSignupPage = location.pathname === '/signup';
  const isAuthPage = isLoginPage || isSignupPage || 
                     location.pathname === '/forgot-password' || 
                     location.pathname === '/reset-password';
  
  // Determine if we're on the landing page
  const isHomePage = location.pathname === '/';

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };



  // Define colors based on theme
  const colors = {
    primary: darkMode ? '#8B5CF6' : '#4F46E5', // Vibrant purple for dark mode, Indigo for light
    secondary: darkMode ? '#10B981' : '#059669', // Emerald
    accent: darkMode ? '#F59E0B' : '#D97706', // Amber
    
    // Additional accent colors
    tertiary: darkMode ? '#EC4899' : '#DB2777', // Pink
    quaternary: darkMode ? '#3B82F6' : '#2563EB', // Blue
    
    // Background colors
    background: darkMode ? '#0F172A' : '#ffffff', // Deeper blue-black for dark mode
    navBg: darkMode ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)', // Matching the new background
    
    // Text colors
    text: darkMode ? '#F8FAFC' : '#111827', // Brighter white for dark mode
    textMuted: darkMode ? '#94A3B8' : '#6B7280', // Slate 400 for better readability
    
    // UI elements
    border: darkMode ? '#334155' : '#E5E7EB', // Slate 600 for more visible borders
    cardBg: darkMode ? '#1E293B' : '#F9FAFB', // Slate 800 for dark mode
    codeBg: darkMode ? '#0F172A' : '#F3F4F6', // Darker code background
    codeText: darkMode ? '#F59E0B' : '#D97706', // Amber for code text
    shadow: darkMode ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.1)', // Stronger shadows
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 transition-colors duration-300" 
      style={{ 
        backgroundColor: darkMode 
          ? isMobile 
            ? 'rgba(15, 23, 42, 0.8)' 
            : isHomePage ? 'rgba(15, 23, 42, 0.2)' : 'rgba(15, 23, 42, 1)'
          : isMobile 
            ? 'rgba(255, 255, 255, 0.8)' 
            : isHomePage ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 1)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Text */}
          <motion.div 
            className="flex items-center"
            initial={{ opacity: 0, y: -20 }}
            animate={{ 
              opacity: 1, 
              y: 0,
              transition: {
                type: "spring",
                stiffness: 300,
                damping: 15
              }
            }}
          >
            <Link to="/" className="flex items-center group">
              <span className="text-2xl font-bold tracking-tight transition-colors duration-200 group-hover:opacity-80" style={{ color: colors.text }}>
                Code<span style={{ color: colors.primary }}>Lyft</span>
              </span>
            </Link>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {["About", "How it Works"].map((item, index) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, y: -20 }}
                animate={{ 
                  opacity: 1, 
                  y: 0,
                  transition: {
                    type: "spring",
                    stiffness: 300,
                    damping: 15,
                    delay: 0.1 + (index * 0.1)
                  }
                }}
              >
                <Link 
                  to={item === "About" ? "/about" : "/#how-it-works"}
                  className="font-medium relative transition-all duration-200 hover:opacity-80 group"
                  style={{ 
                    color: location.pathname === (item === "About" ? "/about" : "/how-it-works") ? colors.primary : colors.text,
                  }}
                  onClick={(e) => {
                    if (item === "How it Works") {
                      e.preventDefault();
                      if (isHomePage) {
                        const section = document.getElementById('how-it-works');
                        if (section) {
                          section.scrollIntoView({ behavior: 'smooth' });
                        }
                      } else {
                        navigate('/#how-it-works');
                      }
                    }
                  }}
                >
                  {item}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-current transition-all duration-200 group-hover:w-full"></span>
                </Link>
              </motion.div>
            ))}

            {isAuthenticated && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ 
                  opacity: 1, 
                  y: 0,
                  transition: {
                    type: "spring",
                    stiffness: 300,
                    damping: 15,
                    delay: 0.3
                  }
                }}
              >
                <Link 
                  to="/my-roadmaps"
                  className="font-medium relative transition-all duration-200 hover:opacity-80 group"
                  style={{ 
                    color: location.pathname === '/my-roadmaps' ? colors.primary : colors.text,
                  }}
                >
                  My Roadmaps
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-current transition-all duration-200 group-hover:w-full"></span>
                </Link>
              </motion.div>
            )}
            
            {/* Theme Toggle Button */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ 
                opacity: 1, 
                y: 0,
                transition: {
                  type: "spring",
                  stiffness: 300,
                  damping: 15,
                  delay: 0.4
                }
              }}
            >
              <button 
                onClick={toggleDarkMode}
                className="p-2 rounded-full transition-all duration-200 hover:scale-110 focus:outline-none"
                style={{
                  backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                }}
                aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {darkMode ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill={colors.text}>
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill={colors.text}>
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                )}
              </button>
            </motion.div>
            
            {isAuthenticated ? (
              <motion.div 
                className="relative" 
                ref={profileDropdownRef}
                initial={{ opacity: 0, y: -20 }}
                animate={{ 
                  opacity: 1, 
                  y: 0,
                  transition: {
                    type: "spring",
                    stiffness: 300,
                    damping: 15,
                    delay: 0.5
                  }
                }}
              >
                <button 
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center space-x-3 focus:outline-none group transition-all duration-200 hover:opacity-80"
                >
                  <div className="w-9 h-9 rounded-full overflow-hidden transition-transform duration-200 group-hover:scale-105">
                    <img 
                      src={user?.profilePicture || "https://via.placeholder.com/40"} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="font-medium transition-colors duration-200 group-hover:text-opacity-80" style={{ color: colors.text }}>
                    {user?.name?.split(' ')[0] || 'User'}
                  </span>
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform duration-200 ${isProfileOpen ? 'transform rotate-180' : ''}`} viewBox="0 0 20 20" fill={colors.text}>
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                
                {/* Profile Dropdown */}
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 z-10" style={{
                    backgroundColor: colors.background,
                    border: `1px solid ${colors.border}`,
                  }}>
                    <Link 
                      to="/dashboard" 
                      className="block px-4 py-2 text-sm transition-all duration-200 hover:bg-opacity-10 hover:translate-x-1"
                      style={{ 
                        color: colors.text,
                        backgroundColor: location.pathname === '/dashboard' ? `${colors.primary}20` : 'transparent',
                      }}
                    >
                      Dashboard
                    </Link>
                    <Link 
                      to="/my-roadmaps" 
                      className="block px-4 py-2 text-sm transition-all duration-200 hover:bg-opacity-10 hover:translate-x-1"
                      style={{ 
                        color: colors.text,
                        backgroundColor: location.pathname === '/my-roadmaps' ? `${colors.primary}20` : 'transparent',
                      }}
                    >
                      My Roadmaps
                    </Link>
                    {!user?.isEmailVerified && (
                      <Link 
                        to="/verify-email" 
                        className="block px-4 py-2 text-sm transition-all duration-200 hover:bg-opacity-10 hover:translate-x-1"
                        style={{ 
                          color: colors.accent,
                          backgroundColor: location.pathname === '/verify-email' ? `${colors.accent}20` : 'transparent',
                        }}
                      >
                        Verify Email
                      </Link>
                    )}
                    <div className="border-t my-1" style={{ borderColor: colors.border }}></div>
                    <button 
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm transition-all duration-200 hover:bg-opacity-10 hover:translate-x-1"
                      style={{ color: '#EF4444', backgroundColor: 'transparent', hover: { backgroundColor: 'rgba(239, 68, 68, 0.1)' } }}
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div 
                className="flex space-x-4"
                initial={{ opacity: 0, y: -20 }}
                animate={{ 
                  opacity: 1, 
                  y: 0,
                  transition: {
                    type: "spring",
                    stiffness: 300,
                    damping: 15,
                    delay: 0.5
                  }
                }}
              >
                {!isLoginPage && (
                  <Link
                    to="/login"
                    className="corner-fill-btn rounded-md px-5 py-2.5 text-sm font-medium transition-all duration-200 hover:scale-105"
                    style={{
                      border: `1px solid ${colors.primary}`,
                      color: colors.primary,
                      '--btn-bg-color': colors.primary
                    }}
                  >
                    Log in
                  </Link>
                )}
                
                {!isSignupPage && (
                  <Link
                    to="/signup"
                    className="corner-fill-btn rounded-md px-5 py-2.5 text-sm font-medium transition-all duration-200 hover:scale-105"
                    style={{
                      backgroundColor: 'transparent',
                      color: colors.primary,
                      border: `1px solid ${colors.primary}`,
                      '--btn-bg-color': colors.primary
                    }}
                  >
                    Sign up
                  </Link>
                )}
              </motion.div>
            )}
          </div>

          {/* Mobile menu button */}
          <motion.div 
            className="md:hidden flex items-center space-x-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ 
              opacity: 1, 
              y: 0,
              transition: {
                type: "spring",
                stiffness: 300,
                damping: 15,
                delay: 0.6
              }
            }}
          >
            {/* Theme Toggle Button (Mobile) */}
            <button 
              onClick={toggleDarkMode}
              className="p-2 rounded-full transition-all duration-200 hover:scale-110 focus:outline-none"
              style={{
                backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
              }}
              aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {darkMode ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill={colors.text}>
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill={colors.text}>
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>
            
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-md focus:outline-none transition-all duration-200 hover:scale-110"
              style={{
                backgroundColor: isMenuOpen ? colors.primary : 'transparent',
                color: isMenuOpen ? '#ffffff' : colors.text,
              }}
            >
              {isMenuOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </motion.div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-2" style={{
            borderTop: `1px solid ${colors.border}`,
          }}>
            <div className="flex flex-col space-y-1 pb-3">
              <Link 
                to="/about" 
                className="px-4 py-2 rounded-md text-base font-medium relative transition-all duration-200 hover:opacity-80 group"
                style={{ 
                  backgroundColor: location.pathname === '/about' ? `${colors.primary}20` : 'transparent',
                  color: location.pathname === '/about' ? colors.primary : colors.text,
                }}
                onClick={() => setIsMenuOpen(false)}
              >
                About
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-current transition-all duration-200 group-hover:w-full"></span>
              </Link>
              
              <Link 
                to="#how-it-works" 
                className="px-4 py-2 rounded-md text-base font-medium relative transition-all duration-200 hover:opacity-80 group"
                style={{ 
                  backgroundColor: location.pathname === '/how-it-works' ? `${colors.primary}20` : 'transparent',
                  color: location.pathname === '/how-it-works' ? colors.primary : colors.text,
                }}
                onClick={(e) => {
                  e.preventDefault();
                  const element = document.getElementById('how-it-works');
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                  }
                  setIsMenuOpen(false);
                }}
              >
                How it Works
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-current transition-all duration-200 group-hover:w-full"></span>
              </Link>

              {isAuthenticated && (
                <Link 
                  to="/my-roadmaps" 
                  className="px-4 py-2 rounded-md text-base font-medium relative transition-all duration-200 hover:opacity-80 group"
                  style={{ 
                    backgroundColor: location.pathname === '/my-roadmaps' ? `${colors.primary}20` : 'transparent',
                    color: location.pathname === '/my-roadmaps' ? colors.primary : colors.text,
                  }}
                  onClick={() => setIsMenuOpen(false)}
                >
                  My Roadmaps
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-current transition-all duration-200 group-hover:w-full"></span>
                </Link>
              )}
              
              {isAuthenticated ? (
                <>
                  <div className="border-t my-1" style={{ borderColor: colors.border }}></div>
                  <div className="px-4 py-2">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full overflow-hidden transition-transform duration-200 hover:scale-105">
                        <img 
                          src={user?.profilePicture || "https://via.placeholder.com/40"} 
                          alt="Profile" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium" style={{ color: colors.text }}>{user?.name || 'User'}</p>
                        <p className="text-xs" style={{ color: colors.textMuted }}>{user?.email}</p>
                      </div>
                    </div>
                  </div>
                  
                  <Link 
                    to="/dashboard" 
                    className="px-4 py-2 rounded-md text-base font-medium transition-all duration-200 hover:bg-opacity-10 hover:translate-x-1"
                    style={{ 
                      backgroundColor: location.pathname === '/dashboard' ? `${colors.primary}20` : 'transparent',
                      color: location.pathname === '/dashboard' ? colors.primary : colors.text,
                    }}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  
                  {!user?.isEmailVerified && (
                    <Link 
                      to="/verify-email" 
                      className="px-4 py-2 rounded-md text-base font-medium transition-all duration-200 hover:bg-opacity-10 hover:translate-x-1"
                      style={{ 
                        backgroundColor: location.pathname === '/verify-email' ? `${colors.accent}20` : 'transparent',
                        color: colors.accent,
                      }}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Verify Email
                    </Link>
                  )}
                  
                  <div className="border-t my-1" style={{ borderColor: colors.border }}></div>
                  
                  <button 
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="px-4 py-2 rounded-md text-base font-medium text-left w-full transition-all duration-200 hover:bg-opacity-10 hover:translate-x-1"
                    style={{ color: '#EF4444', backgroundColor: 'transparent' }}
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <div className="border-t my-1" style={{ borderColor: colors.border }}></div>
                  <div className="px-4 py-2 flex flex-col space-y-2">
                    {!isLoginPage && (
                      <Link
                        to="/login"
                        className="corner-fill-btn w-full px-4 py-2 rounded-md text-sm font-medium text-center transition-all duration-200 hover:scale-105"
                        style={{
                          color: colors.primary,
                          border: `1px solid ${colors.primary}`,
                          '--btn-bg-color': colors.primary
                        }}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Log in
                      </Link>
                    )}
                    
                    {!isSignupPage && (
                      <Link
                        to="/signup"
                        className="corner-fill-btn w-full px-4 py-2 rounded-md text-sm font-medium text-center transition-all duration-200 hover:scale-105"
                        style={{
                          backgroundColor: 'transparent',
                          color: colors.primary,
                          border: `1px solid ${colors.primary}`,
                          '--btn-bg-color': colors.primary
                        }}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Sign up
                      </Link>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar; 