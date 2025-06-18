import React from 'react';
import { Link } from 'react-router-dom';

const Footer = ({ colors, darkMode }) => {
  const currentYear = new Date().getFullYear();
  
  // Create a subtle dot pattern as background
  const dotPattern = {
    backgroundImage: `radial-gradient(${darkMode ? colors.border + '20' : colors.border + '30'} 1px, transparent 1px)`,
    backgroundSize: '20px 20px',
    backgroundPosition: '0 0',
  };
  
  return (
    <footer className="mt-20 py-8 relative z-10" style={{ 
      borderTop: `1px solid ${colors.border}30`,
      backgroundColor: darkMode ? 'rgba(17, 24, 39, 0.95)' : 'rgba(249, 249, 249, 0.4)'
    }}>
      {/* Subtle background effect */}
      <div 
        className="absolute inset-0 z-[-1]" 
        style={{ 
          ...dotPattern,
          background: darkMode ? 
            `linear-gradient(to bottom, rgba(17, 24, 39, 0.95), rgba(17, 24, 39, 0.98))` : 
            `linear-gradient(to bottom, rgba(249, 249, 249, 0.4), rgba(249, 249, 249, 0.8))`,
          opacity: 0.9
        }}
      />
      
      {/* Subtle top shadow */}
      <div 
        className="absolute top-0 left-0 right-0 h-4 z-[-1]" 
        style={{ 
          background: `linear-gradient(to bottom, ${darkMode ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.02)'}, transparent)`,
        }}
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Footer Grid Layout - More subtle with fewer elements */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Logo and description */}
          <div className="col-span-1">
            <div className="flex items-center mb-3">
              <h2 className="text-xl font-bold" style={{ color: colors.text }}>
                Code<span style={{ color: colors.primary }}>Lyft</span>
              </h2>
            </div>
            <p className="text-xs mb-3" style={{ color: colors.textMuted }}>
              Your personalized tech learning journey with curated YouTube resources.
            </p>
            <div className="flex space-x-4">
              {/* Social Media Icons - More subtle */}
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" 
                className="transition-transform hover:scale-110" 
                style={{ color: `${colors.textMuted}80` }}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z" />
                </svg>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" 
                className="transition-transform hover:scale-110" 
                style={{ color: `${colors.textMuted}80` }}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" 
                className="transition-transform hover:scale-110" 
                style={{ color: `${colors.textMuted}80` }}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
            </div>
          </div>
          
          {/* Quick Links - More subtle */}
          <div className="col-span-1">
            <h3 className="text-sm font-medium mb-3" style={{ color: colors.text }}>Quick Links</h3>
            <ul className="space-y-1 text-xs">
              <li>
                <Link to="/" className="hover:underline transition-colors" style={{ color: `${colors.textMuted}90` }}>
                  Home
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:underline transition-colors" style={{ color: `${colors.textMuted}90` }}>
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/my-roadmaps" className="hover:underline transition-colors" style={{ color: `${colors.textMuted}90` }}>
                  My Roadmaps
                </Link>
              </li>
              <li>
                <Link to="/custom-roadmaps" className="hover:underline transition-colors" style={{ color: `${colors.textMuted}90` }}>
                  Custom Roadmaps
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Resources - More subtle */}
          <div className="col-span-1">
            <h3 className="text-sm font-medium mb-3" style={{ color: colors.text }}>Resources</h3>
            <ul className="space-y-1 text-xs">
              <li>
                <Link to="/about" className="hover:underline transition-colors" style={{ color: `${colors.textMuted}90` }}>
                  About
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="hover:underline transition-colors" style={{ color: `${colors.textMuted}90` }}>
                  How it Works
                </Link>
              </li>
              <li>
                <a href="https://github.com/yourusername/codelyft" target="_blank" rel="noopener noreferrer" className="hover:underline transition-colors" style={{ color: `${colors.textMuted}90` }}>
                  GitHub Repository
                </a>
              </li>
              <li>
                <a href="#" className="hover:underline transition-colors" style={{ color: `${colors.textMuted}90` }}>
                  Documentation
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Divider - More subtle */}
        <div className="w-full h-px mb-4" style={{ backgroundColor: `${colors.border}20` }}></div>
        
        {/* Copyright and Legal - More subtle */}
        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-xs mb-2 md:mb-0" style={{ color: `${colors.textMuted}80` }}>
            © {currentYear} CodeLyft. All rights reserved.
          </p>
          <div className="flex space-x-6">
            <a href="#" className="text-xs hover:underline transition-colors" style={{ color: `${colors.textMuted}80` }}>
              Privacy
            </a>
            <a href="#" className="text-xs hover:underline transition-colors" style={{ color: `${colors.textMuted}80` }}>
              Terms
            </a>
            <a href="#" className="text-xs hover:underline transition-colors" style={{ color: `${colors.textMuted}80` }}>
              Cookies
            </a>
          </div>
        </div>
      </div>
      
      {/* Subtle gradient at the bottom */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{ 
          background: `linear-gradient(to right, ${colors.primary}40, ${colors.secondary}40, ${colors.accent}40)`,
          opacity: 0.5
        }}
      ></div>
    </footer>
  );
};

export default Footer; 