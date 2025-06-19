import React from 'react';
import { useTheme } from '../../../context/ThemeContext';
import ExpandingTagsAnimation from './ExpandingTagsAnimation';

const TechLoadingAnimation = ({ variant = 'default', message }) => {
  const { darkMode } = useTheme();
  
  // Helper function to get default message based on variant
  function getMessage(variant) {
    switch (variant) {
      case 'resources':
        return 'Fetching learning resources...';
      case 'roadmap':
        return 'Building your tech roadmap...';
      case 'code':
        return 'Generating code examples...';
      default:
        return 'Loading...';
    }
  }

  // Default loading message
  const defaultMessage = getMessage(variant);
  const displayMessage = message || defaultMessage;

  // Use ExpandingTagsAnimation for all variants
  return <ExpandingTagsAnimation message={displayMessage} />;
};

export default TechLoadingAnimation; 