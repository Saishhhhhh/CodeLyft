import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import Navbar from '../Navbar';
import Footer from '../home/Footer';

/**
 * A reusable layout component for authentication pages
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render inside the layout
 * @param {string} props.title - Main title text
 * @param {string} [props.subtitle] - Optional subtitle text
 * @param {React.ReactNode} [props.errorMessage] - Optional error message component
 * @param {React.ReactNode} [props.successMessage] - Optional success message component
 * @param {string} [props.backgroundType="minimal"] - Background type: "gradient", "dots", "lines", or "minimal"
 */
const AuthLayout = ({ 
  children, 
  title, 
  subtitle,
  errorMessage,
  successMessage,
  backgroundType = "minimal"
}) => {
  const { darkMode } = useTheme();

  // Define colors based on theme
  const colors = {
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
    shadow: darkMode ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.1)', // Shadows
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden flex flex-col transition-colors duration-300" style={{ 
      backgroundColor: colors.background
    }}>
      {/* Navbar */}
      <Navbar />
      
      {/* Background overlay */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute inset-0"
          style={{ 
            backgroundColor: darkMode ? '#4F46E510' : '#4F46E508',
            opacity: 1
          }}
        />
      </div>
      
      {/* Auth container */}
      <div className="flex-1 flex items-center justify-center pt-16 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md px-8 py-10 mx-4 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10"
          style={{ 
            backgroundColor: colors.cardBg,
            borderColor: `${colors.border}40`,
            boxShadow: `0 20px 40px ${colors.shadow}`
          }}
        >
          <div className="text-center mb-8">
            <motion.h1 
              className="text-4xl font-bold mb-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              style={{ color: colors.primary }}
            >
              {title}
            </motion.h1>
            
            {subtitle && (
              <motion.p 
                className="text-lg"
                style={{ color: colors.textMuted }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.8 }}
              >
                {subtitle}
              </motion.p>
            )}
          </div>
          
          {/* Success message */}
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 rounded-lg"
              style={{ 
                backgroundColor: `${colors.secondary}20`,
                border: `1px solid ${colors.secondary}50`,
                color: colors.secondary
              }}
            >
              {successMessage}
            </motion.div>
          )}
          
          {/* Error message */}
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 rounded-lg"
              style={{ 
                backgroundColor: `${colors.tertiary}20`,
                border: `1px solid ${colors.tertiary}50`,
                color: colors.tertiary
              }}
            >
              {errorMessage}
            </motion.div>
          )}
          
          {/* Main content */}
          {children}
        </motion.div>
      </div>

      {/* Footer */}
      <Footer colors={colors} darkMode={darkMode} />
    </div>
  );
};

export default AuthLayout; 