import React, { useState, useEffect } from 'react';
import { getTechLogo } from '../../../services/logoService';
import { useTheme } from '../../../context/ThemeContext';

/**
 * TechLogo component - Displays a technology logo with fallback handling
 * 
 * @param {Object} props - Component props
 * @param {string} props.techName - Name of the technology to display logo for
 * @param {string} props.size - Size of the logo (sm, md, lg)
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.showName - Whether to show the technology name alongside the logo
 * @param {string} props.namePosition - Position of the name (right, bottom)
 * @param {Object} props.colorFilter - Custom color filter for secondary logos
 */
const TechLogo = ({ 
  techName, 
  size = 'md', 
  className = '', 
  showName = false,
  namePosition = 'right',
  colorFilter = null
}) => {
  const [logoInfo, setLogoInfo] = useState(null);
  const [error, setError] = useState(false);
  const { darkMode } = useTheme();

  useEffect(() => {
    if (!techName) return;
    
    // Get initial logo information from the service
    const initialLogo = getTechLogo(techName);
    setLogoInfo(initialLogo);
    
    // Listen for logo updates (when async search completes)
    const handleLogoLoaded = (event) => {
      if (event.detail.techName === techName) {
        setLogoInfo(event.detail.logoInfo);
      }
    };
    
    // Add event listener
    window.addEventListener('logo-loaded', handleLogoLoaded);
    
    // Clean up
    return () => {
      window.removeEventListener('logo-loaded', handleLogoLoaded);
    };
  }, [techName]);

  // Handle image loading error
  const handleError = () => {
    setError(true);
  };

  if (!techName || !logoInfo) {
    return (
      <div className={`tech-logo-placeholder ${getSizeClass(size)} ${className} ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
        {techName ? techName.charAt(0).toUpperCase() : '?'}
      </div>
    );
  }

  // If there was an error loading the image, show a fallback
  if (error) {
    return (
      <div className={`tech-logo-placeholder ${getSizeClass(size)} ${className} ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
        {techName.charAt(0).toUpperCase()}
      </div>
    );
  }

  // Determine if we need to apply a color filter (for black SVGs)
  const filterStyle = logoInfo.isSecondary && colorFilter ? {
    filter: typeof colorFilter === 'string' ? colorFilter : 
      'invert(48%) sepia(79%) saturate(2476%) hue-rotate(86deg) brightness(118%) contrast(119%)'
  } : {};
  
  // Apply additional filter for dark mode for better visibility
  if (darkMode && logoInfo.isSecondary) {
    filterStyle.filter = 'brightness(1.2) contrast(1.2)';
  }

  return (
    <div className={`tech-logo-container ${showName ? `with-name name-${namePosition}` : ''} ${className}`}>
      <img
        src={logoInfo.path}
        alt={logoInfo.alt}
        className={`tech-logo ${getSizeClass(size)} ${logoInfo.className || ''}`}
        style={filterStyle}
        onError={handleError}
      />
      
      {showName && (
        <span className={`tech-name ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{techName}</span>
      )}
    </div>
  );
};

// Helper function to get size class
const getSizeClass = (size) => {
  switch (size) {
    case 'xs': return 'w-4 h-4';
    case 'sm': return 'w-6 h-6';
    case 'md': return 'w-8 h-8';
    case 'lg': return 'w-10 h-10';
    case 'xl': return 'w-12 h-12';
    case '2xl': return 'w-16 h-16';
    default: return 'w-8 h-8';
  }
};

export default TechLogo; 