import { useState } from 'react';
import logo from '../assets/logo.svg';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="bg-white bg-opacity-90 backdrop-blur-sm py-4 px-6 fixed top-0 left-0 right-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <a href="/" className="flex items-center">
              <img src={logo} alt="MuftCode Logo" className="h-10 w-10 mr-2" />
              <span className="text-2xl font-bold font-poppins" style={{
                background: 'linear-gradient(to right, #F97316, #9333EA)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                Muft<span style={{ color: '#9333EA' }}>Code</span>
              </span>
            </a>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="/about" className="text-gray-700 hover:text-purple-600 transition-colors duration-300 font-mukta">
              About
            </a>
            <a href="/resources" className="text-gray-700 hover:text-purple-600 transition-colors duration-300 font-mukta">
              Resources
            </a>
            <a
              href="/login"
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
            </a>
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
              <a href="/about" className="text-gray-700 hover:text-purple-600 transition-colors duration-300 font-mukta">
                About
              </a>
              <a href="/resources" className="text-gray-700 hover:text-purple-600 transition-colors duration-300 font-mukta">
                Resources
              </a>
              <a
                href="/login"
                className="text-white px-4 py-2 rounded-full text-center font-medium font-mukta"
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
              </a>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar; 