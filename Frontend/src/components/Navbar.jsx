import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.svg';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const navigate = useNavigate();
  const profileDropdownRef = useRef(null);

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

  return (
    <nav className="bg-white bg-opacity-90 backdrop-blur-sm py-4 px-6 fixed top-0 left-0 right-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <img src={logo} alt="MuftCode Logo" className="h-10 w-10 mr-2" />
              <span className="text-2xl font-bold font-poppins" style={{
                background: 'linear-gradient(to right, #F97316, #9333EA)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                Muft<span style={{ color: '#9333EA' }}>Code</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/about" className="text-gray-700 hover:text-purple-600 transition-colors duration-300 font-mukta">
              About
            </Link>
            <Link to="/resources" className="text-gray-700 hover:text-purple-600 transition-colors duration-300 font-mukta">
              Resources
            </Link>
            <Link to="/custom-roadmap" className="text-gray-700 hover:text-purple-600 transition-colors duration-300 font-mukta">
              Custom Roadmap
            </Link>
            
            {isAuthenticated ? (
              <div className="relative" ref={profileDropdownRef}>
                <button 
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center space-x-2 focus:outline-none"
                >
                  <img 
                    src={user?.profilePicture || "https://via.placeholder.com/40"} 
                    alt="Profile" 
                    className="w-10 h-10 rounded-full object-cover border-2 border-purple-500"
                  />
                  <span className="text-gray-700 font-medium">{user?.name?.split(' ')[0] || 'User'}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-gray-500 transition-transform ${isProfileOpen ? 'transform rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                
                {/* Profile Dropdown */}
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200">
                    <Link to="/dashboard" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      Dashboard
                    </Link>
                    <Link to="/my-roadmaps" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      My Roadmaps
                    </Link>
                    <Link to="/custom-roadmap" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      Custom Roadmap
                    </Link>
                    <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      Profile Settings
                    </Link>
                    {!user?.isEmailVerified && (
                      <Link to="/verify-email" className="block px-4 py-2 text-sm text-orange-600 hover:bg-gray-100">
                        Verify Email
                      </Link>
                    )}
                    <button 
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="font-medium text-white px-5 py-2 rounded-full shadow-md font-mukta"
                style={{
                  background: 'linear-gradient(to right, #F97316, #9333EA)',
                  transition: 'all 0.3s ease',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(to right, #EA580C, #7E22CE)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(to right, #F97316, #9333EA)';
                }}
              >
                Login
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 focus:outline-none"
            >
              {isMenuOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 bg-white p-4 rounded-lg shadow-lg">
            <div className="flex flex-col space-y-4">
              <Link to="/about" className="text-gray-700 hover:text-purple-600 transition-colors duration-300 font-mukta">
                About
              </Link>
              <Link to="/resources" className="text-gray-700 hover:text-purple-600 transition-colors duration-300 font-mukta">
                Resources
              </Link>
              <Link to="/custom-roadmap" className="text-gray-700 hover:text-purple-600 transition-colors duration-300 font-mukta">
                Custom Roadmap
              </Link>
              
              {isAuthenticated ? (
                <>
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex items-center mb-4">
                      <img 
                        src={user?.profilePicture || "https://via.placeholder.com/40"} 
                        alt="Profile" 
                        className="w-10 h-10 rounded-full object-cover border-2 border-purple-500 mr-3"
                      />
                      <div>
                        <p className="text-gray-700 font-medium">{user?.name || 'User'}</p>
                        <p className="text-gray-500 text-sm">{user?.email}</p>
                      </div>
                    </div>
                    
                    <Link to="/dashboard" className="block py-2 text-gray-700 hover:text-purple-600">
                      Dashboard
                    </Link>
                    <Link to="/my-roadmaps" className="block py-2 text-gray-700 hover:text-purple-600">
                      My Roadmaps
                    </Link>
                    <Link to="/profile" className="block py-2 text-gray-700 hover:text-purple-600">
                      Profile Settings
                    </Link>
                    {!user?.isEmailVerified && (
                      <Link to="/verify-email" className="block py-2 text-orange-600 hover:text-orange-700">
                        Verify Email
                      </Link>
                    )}
                    <button 
                      onClick={handleLogout}
                      className="block w-full text-left py-2 text-red-600 hover:text-red-700"
                    >
                      Sign Out
                    </button>
                  </div>
                </>
              ) : (
                <Link
                  to="/login"
                  className="text-white px-4 py-2 rounded-full text-center font-medium font-mukta"
                  style={{
                    background: 'linear-gradient(to right, #F97316, #9333EA)',
                    transition: 'all 0.3s ease',
                  }}
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar; 