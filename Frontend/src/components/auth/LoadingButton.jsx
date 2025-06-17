import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';

/**
 * A reusable button component with loading state
 * @param {Object} props - Component props
 * @param {string} props.text - Button text
 * @param {string} [props.loadingText="Loading..."] - Text to show when loading
 * @param {boolean} [props.isLoading=false] - Whether the button is in loading state
 * @param {boolean} [props.disabled=false] - Whether the button is disabled
 * @param {function} [props.onClick] - Click handler function
 * @param {string} [props.type="button"] - Button type (button, submit, reset)
 * @param {string} [props.className] - Additional class names
 * @param {React.ReactNode} [props.children] - Child components
 */
const LoadingButton = ({
  text,
  loadingText = "Loading...",
  isLoading = false,
  disabled = false,
  onClick,
  type = "button",
  className = "",
  children
}) => {
  const { darkMode } = useTheme();

  // Define colors based on theme
  const colors = {
    primary: darkMode ? '#8B5CF6' : '#4F46E5', // Vibrant purple for dark mode, Indigo for light
    secondary: darkMode ? '#10B981' : '#059669', // Emerald
    accent: darkMode ? '#F59E0B' : '#D97706', // Amber
    tertiary: darkMode ? '#EC4899' : '#DB2777', // Pink
    
    // Background colors
    background: darkMode ? '#0F172A' : '#ffffff', // Deeper blue-black for dark mode
    buttonBg: darkMode ? '#8B5CF6' : '#4F46E5', // Full opacity button background
    
    // Text colors
    text: darkMode ? '#F8FAFC' : '#111827', // Brighter white for dark mode
    textMuted: darkMode ? '#94A3B8' : '#6B7280', // Slate 400 for better readability
    
    // UI elements
    border: darkMode ? '#334155' : '#E5E7EB', // Slate 600 for more visible borders
    shadow: darkMode ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.1)', // Stronger shadows
  };

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={isLoading || disabled}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`w-full py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${
        isLoading || disabled ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-lg'
      }`}
      style={{ 
        backgroundColor: colors.buttonBg,
        color: '#FFFFFF',
        boxShadow: `0 4px 6px ${colors.shadow}`,
      }}
    >
      {isLoading ? (
        <div className="flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
          {loadingText}
        </div>
      ) : children || text}
    </motion.button>
  );
};

export default LoadingButton; 