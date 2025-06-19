import { createContext, useContext, useState, useEffect } from 'react';

// Create the theme context
const ThemeContext = createContext();

// Custom hook to use the theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  // Check if user has theme preference stored or prefers dark mode
  const [darkMode, setDarkMode] = useState(() => {
    // Try to get theme from localStorage
    const savedTheme = localStorage.getItem('darkMode');
    if (savedTheme !== null) {
      return savedTheme === 'true';
    }
    // If no saved preference, check system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Track if device is mobile
  const [isMobile, setIsMobile] = useState(false);

  // Check if device is mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check
    checkIfMobile();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkIfMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // Effect to handle theme changes
  useEffect(() => {
    // Save to localStorage
    localStorage.setItem('darkMode', darkMode);

    // Apply dark mode class to the document's root element
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.add('theme-transition');
      // Add a small delay to ensure transitions apply
      setTimeout(() => {
        document.documentElement.classList.remove('theme-transition');
      }, 300);
    } else {
      document.documentElement.classList.add('theme-transition');
      document.documentElement.classList.remove('dark');
      // Add a small delay to ensure transitions apply
      setTimeout(() => {
        document.documentElement.classList.remove('theme-transition');
      }, 300);
    }
  }, [darkMode]);

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode((prevMode) => !prevMode);
  };

  // Provider values
  const value = {
    darkMode,
    toggleDarkMode,
    isMobile
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext; 