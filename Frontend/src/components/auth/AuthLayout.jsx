import { motion } from 'framer-motion';
import ParticleBackground from './ParticleBackground';
import Navbar from '../Navbar';

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
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 to-indigo-950 overflow-hidden relative">
      {/* Navbar */}
      <Navbar />
      
      {/* Subtle background */}
      <ParticleBackground 
        type={backgroundType}
        primaryColor="#8B5CF6"
        secondaryColor="#EC4899"
        density={10}
      />
      
      {/* Auth container */}
      <div className="flex items-center justify-center min-h-screen pt-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md px-8 py-10 mx-4 backdrop-blur-xl bg-white/10 rounded-2xl shadow-2xl border border-white/10"
        >
          <div className="text-center mb-8">
            <motion.h1 
              className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              {title}
            </motion.h1>
            
            {subtitle && (
              <motion.p 
                className="mt-2 text-gray-300"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.8 }}
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
              className="mb-4 p-3 bg-green-500/20 border border-green-500/50 text-green-200 text-sm rounded-lg"
            >
              {successMessage}
            </motion.div>
          )}
          
          {/* Error message */}
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-red-500/20 border border-red-500/50 text-red-200 text-sm rounded-lg"
            >
              {errorMessage}
            </motion.div>
          )}
          
          {/* Main content */}
          {children}
        </motion.div>
      </div>
    </div>
  );
};

export default AuthLayout; 