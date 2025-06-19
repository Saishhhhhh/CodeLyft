import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import TechLoadingAnimation from '../components/roadmap/loading/TechLoadingAnimation';
import LoadingAnimation from '../components/common/LoadingAnimation';
import ExpandingTagsAnimation from '../components/roadmap/loading/ExpandingTagsAnimation';

const LoadingTestPage = () => {
  const { darkMode } = useTheme();
  const [loadingConfig, setLoadingConfig] = useState({
    variant: 'roadmap',
    type: 'inline',
    size: 'medium',
    message: '',
    showBackground: true
  });
  
  // Define colors based on theme
  const colors = {
    // Primary and accent colors
    primary: darkMode ? '#4F46E5' : '#4F46E5', // Indigo - main brand color
    secondary: darkMode ? '#DA2C38' : '#DA2C38', // YouTube Red - accent color
    accent: darkMode ? '#8B5CF6' : '#8B5CF6', // Purple - complementary accent
    
    // Background colors
    background: darkMode ? '#111827' : '#F9F9F9', // Dark Gray / Light Gray
    cardBg: darkMode ? '#1E293B' : '#FFFFFF', // Darker background / White
    
    // Text colors
    text: darkMode ? '#F9F9F9' : '#111827', // Light Gray / Dark Gray
    textMuted: darkMode ? '#94A3B8' : '#6B7280', // Light gray / Medium gray
    
    // UI elements
    border: darkMode ? '#334155' : '#E5E7EB', // Medium-dark gray / Light gray
  };

  const handleConfigChange = (e) => {
    const { name, value, type, checked } = e.target;
    setLoadingConfig(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFullscreenDemo = () => {
    setLoadingConfig(prev => ({
      ...prev,
      type: 'fullscreen'
    }));
    
    // Reset back to inline after 3 seconds
    setTimeout(() => {
      setLoadingConfig(prev => ({
        ...prev,
        type: 'inline'
      }));
    }, 3000);
  };

  return (
    <div 
      className="min-h-screen py-16 px-4"
      style={{ 
        background: darkMode 
          ? `linear-gradient(to bottom, ${colors.background}, #0F172A)` 
          : `linear-gradient(to bottom, #FFF7ED, #FFFFFF)`,
        color: colors.text
      }}
    >
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Loading Animation Test Page</h1>
        
        <div className="bg-opacity-90 rounded-xl p-6 mb-8 border" style={{ 
          backgroundColor: colors.cardBg,
          borderColor: colors.border
        }}>
          <h2 className="text-xl font-semibold mb-4">Configure Loading Animation</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-2">Animation Variant</label>
              <select
                name="variant"
                value={loadingConfig.variant}
                onChange={handleConfigChange}
                className="w-full p-2 rounded-md border"
                style={{ borderColor: colors.border, backgroundColor: colors.cardBg, color: colors.text }}
              >
                <option value="default">Default</option>
                <option value="roadmap">Roadmap</option>
                <option value="resources">Resources</option>
                <option value="code">Code</option>
              </select>
            </div>
            
            <div>
              <label className="block mb-2">Animation Type</label>
              <select
                name="type"
                value={loadingConfig.type}
                onChange={handleConfigChange}
                className="w-full p-2 rounded-md border"
                style={{ borderColor: colors.border, backgroundColor: colors.cardBg, color: colors.text }}
              >
                <option value="inline">Inline</option>
                <option value="fullscreen">Fullscreen</option>
              </select>
            </div>
            
            <div>
              <label className="block mb-2">Size</label>
              <select
                name="size"
                value={loadingConfig.size}
                onChange={handleConfigChange}
                className="w-full p-2 rounded-md border"
                style={{ borderColor: colors.border, backgroundColor: colors.cardBg, color: colors.text }}
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>
            
            <div>
              <label className="block mb-2">Custom Message</label>
              <input
                type="text"
                name="message"
                value={loadingConfig.message}
                onChange={handleConfigChange}
                placeholder="Leave empty for default message"
                className="w-full p-2 rounded-md border"
                style={{ borderColor: colors.border, backgroundColor: colors.cardBg, color: colors.text }}
              />
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="showBackground"
                name="showBackground"
                checked={loadingConfig.showBackground}
                onChange={handleConfigChange}
                className="mr-2"
              />
              <label htmlFor="showBackground">Show Background (Fullscreen only)</label>
            </div>
          </div>
        </div>
        
        <div className="bg-opacity-90 rounded-xl p-6 border" style={{ 
          backgroundColor: colors.cardBg,
          borderColor: colors.border
        }}>
          <h2 className="text-xl font-semibold mb-4">Loading Animation Preview</h2>
          
          {loadingConfig.type === 'inline' && (
            <div className="border rounded-xl p-6" style={{ borderColor: colors.border }}>
              <LoadingAnimation
                type="inline"
                variant={loadingConfig.variant}
                message={loadingConfig.message}
                size={loadingConfig.size}
              />
            </div>
          )}
          
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4" style={{ color: colors.text }}>
              Expanding Tags Animation
            </h2>
            
            <div className="p-4 border rounded-xl" style={{ borderColor: colors.border }}>
              <ExpandingTagsAnimation message="Preparing your coding journey..." />
            </div>
          </div>
        </div>
      </div>
      
      {/* Only show if type is fullscreen */}
      {loadingConfig.type === 'fullscreen' && (
        <LoadingAnimation
          type="fullscreen"
          variant={loadingConfig.variant}
          message={loadingConfig.message}
          size={loadingConfig.size}
          showBackground={loadingConfig.showBackground}
        />
      )}
    </div>
  );
};

export default LoadingTestPage; 