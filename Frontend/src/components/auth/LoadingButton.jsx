import { motion } from 'framer-motion';

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
  return (
    <motion.button
      whileHover={{ scale: disabled || isLoading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`w-full py-3 px-4 rounded-lg font-medium text-white ${
        disabled || isLoading 
          ? 'bg-purple-700 cursor-not-allowed' 
          : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700'
      } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 shadow-lg shadow-purple-500/30 ${className}`}
    >
      {isLoading ? (
        <span className="flex items-center justify-center">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {loadingText}
        </span>
      ) : children || text}
    </motion.button>
  );
};

export default LoadingButton; 