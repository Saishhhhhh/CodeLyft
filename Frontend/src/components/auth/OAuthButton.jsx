import { motion } from 'framer-motion';

/**
 * A reusable OAuth button component for social login options
 * @param {Object} props - Component props
 * @param {string} props.provider - OAuth provider name (e.g., 'Google', 'GitHub')
 * @param {React.ReactNode} props.icon - Icon component to display
 * @param {function} props.onClick - Click handler function
 * @param {boolean} [props.disabled=false] - Whether the button is disabled
 * @param {string} [props.className] - Additional class names
 */
const OAuthButton = ({
  provider,
  icon,
  onClick,
  disabled = false,
  className = "",
}) => {
  // Determine button style based on provider
  const getButtonStyle = () => {
    switch (provider.toLowerCase()) {
      case 'google':
        return "bg-white text-gray-800 hover:bg-gray-100";
      case 'github':
        return "bg-gray-800 text-white hover:bg-gray-700";
      case 'twitter':
      case 'x':
        return "bg-black text-white hover:bg-gray-900";
      case 'facebook':
        return "bg-blue-600 text-white hover:bg-blue-700";
      case 'apple':
        return "bg-black text-white hover:bg-gray-900";
      default:
        return "bg-gray-700 text-white hover:bg-gray-600";
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-center py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 shadow-md ${getButtonStyle()} ${className}`}
      aria-label={`Sign in with ${provider}`}
    >
      {icon && <span className="mr-2">{icon}</span>}
      <span>{provider}</span>
    </motion.button>
  );
};

export default OAuthButton; 