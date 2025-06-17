import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { validateAndGenerateQuestions } from '../../services/groqService';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';

const HeroSection = ({ colors, darkMode }) => {
  const [prompt, setPrompt] = useState('');
  const [error, setError] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const inputRef = React.useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  // Update placeholder color when theme changes
  React.useEffect(() => {
    if (inputRef.current) {
      const style = document.createElement('style');
      style.textContent = `
        #prompt::placeholder {
          color: ${colors.textMuted} !important;
          opacity: 0.7;
        }
      `;
      document.head.appendChild(style);
      
      return () => {
        document.head.removeChild(style);
      };
    }
  }, [colors.textMuted, darkMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!prompt.trim()) return;
    
    // Check if user is authenticated
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    // Proceed with roadmap generation if logged in
    setError(null);
    setIsValidating(true);

    try {
      const result = await validateAndGenerateQuestions(prompt);
      
      if (!result.validation.isValid) {
        setError({
          message: result.validation.reason,
          example: result.validation.example
        });
        setIsValidating(false);
        return;
      }

      localStorage.setItem('learningTopic', result.validation.extractedTopic);
      localStorage.setItem('preGeneratedQuestions', JSON.stringify(result.questions));
      
      navigate('/questions');
    } catch (error) {
      setError({
        message: 'Failed to validate your input. Please try again.',
        example: 'Try entering a specific technology like "React" or "Python"'
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleGenerateClick = (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    
    // Check if user is authenticated
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    // If authenticated, submit the form to validate
    handleSubmit(e);
  };

  return (
    <div className="w-full min-h-[90vh] flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-8 sm:py-16 lg:py-0 mt-16 sm:mt-16">
      <div className="max-w-5xl mx-auto text-center">
        <motion.h1 
          className="text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight mb-6 sm:mb-8 leading-tight"
          style={{ color: colors.text }}
        >
          <div className="flex flex-wrap justify-center gap-x-2">
            {["Your", "Personalized"].map((word, index) => (
              <motion.span
                key={word}
                className="block"
                initial={{ opacity: 0, y: 20 }}
                animate={{ 
                  opacity: 1, 
                  y: 0,
                  transition: {
                    type: "spring",
                    stiffness: 300,
                    damping: 15,
                    delay: 0.1 + (index * 0.1)
                  }
                }}
              >
                {word}
              </motion.span>
            ))}
          </div>
          <div className="flex flex-wrap justify-center gap-x-2 mt-1 sm:mt-2">
            {["Tech", "Learning", "Journey"].map((word, index) => (
              <motion.span
                key={word}
                className="inline-block gradient-text"
                style={{ 
                  color: 'transparent',
                  backgroundImage: `linear-gradient(to right, ${colors.primary}, ${colors.tertiary || colors.accent})`,
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  position: 'relative',
                  zIndex: 1
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ 
                  opacity: 1, 
                  y: 0,
                  transition: {
                    type: "spring",
                    stiffness: 300,
                    damping: 15,
                    delay: 0.3 + (index * 0.1)
                  }
                }}
              >
                {word}
              </motion.span>
            ))}
          </div>
        </motion.h1>
        
        {/* Subtitle */}
        <motion.p 
          className="text-base sm:text-lg md:text-xl mb-6 sm:mb-8 max-w-2xl mx-auto"
          style={{ color: colors.text }}
          initial={{ opacity: 0, y: -20 }}
          animate={{ 
            opacity: 1, 
            y: 0,
            transition: {
              type: "spring",
              stiffness: 300,
              damping: 15,
              delay: 0.8
            }
          }}
        >
          Generate personalized roadmaps with curated YouTube resources for any tech skill
        </motion.p>

        {/* Input prompt indicator */}
        <motion.div 
          className="relative mb-6 sm:mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ 
            opacity: 1, 
            y: 0,
            transition: {
              type: "spring",
              stiffness: 300,
              damping: 15,
              delay: 0.9
            }
          }}
        >
          <div className="flex items-center justify-center space-x-2">
            <div className="h-0.5 w-8 sm:w-12 bg-gradient-to-r from-transparent via-gray-400 dark:via-gray-600 to-transparent"></div>
            <span className="text-xs sm:text-sm font-medium" style={{ color: colors.textMuted }}>
              Enter what you want to learn
            </span>
            <div className="h-0.5 w-8 sm:w-12 bg-gradient-to-r from-transparent via-gray-400 dark:via-gray-600 to-transparent"></div>
          </div>
        </motion.div>

        {/* Prompt Input */}
        <div className="max-w-2xl mx-auto mb-8 sm:mb-12 relative">
          <form onSubmit={handleSubmit} className="flex flex-col items-center">
            <div className="w-full relative mb-4">
              <div 
                className="absolute inset-0 rounded-full"
                style={{ 
                  background: `linear-gradient(to right, ${colors.primary}30, ${colors.tertiary || colors.accent}30)`,
                  transform: 'scale(1.02)',
                  filter: 'blur(4px)',
                  zIndex: -1
                }}
              ></div>
              <input
                id="prompt"
                ref={inputRef}
                type="text"
                name="prompt"
                className="w-full px-4 sm:px-6 py-3 sm:py-5 text-base sm:text-lg rounded-full border-2 focus:ring-2 focus:ring-opacity-50 pr-24 sm:pr-28"
                style={{ 
                  backgroundColor: darkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)',
                  color: colors.text,
                  boxShadow: `0 4px 12px ${colors.shadow}`,
                  outline: 'none',
                  transition: 'all 0.3s ease',
                  borderColor: `${colors.primary}40`,
                  focusRing: colors.primary
                }}
                placeholder="I want to learn full stack development..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={isValidating}
              />
              
              <button
                className={`absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 inline-flex items-center justify-center px-2 sm:px-3 py-1.5 sm:py-2 rounded-full text-sm sm:text-base font-medium transition-all duration-300 ${(!prompt || isValidating) ? 'opacity-70 cursor-not-allowed' : 'group-hover:pl-4 group-hover:pr-5'}`}
                style={{
                  background: `linear-gradient(135deg, ${colors.primary}, ${colors.tertiary || colors.accent})`,
                  color: '#ffffff',
                  boxShadow: `0 2px 8px ${colors.primary}40`
                }}
                onClick={handleGenerateClick}
                disabled={!prompt || isValidating}
              >
                {isValidating ? (
                  <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <div className="group flex items-center">
                    <div className="relative w-4 h-4 sm:w-5 sm:h-5 mr-1">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white transition-all duration-300 group-hover:w-0 group-hover:h-0"></div>
                      </div>
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <div className="absolute inset-0 rounded-full bg-white transform scale-0 group-hover:scale-100 transition-transform duration-300"></div>
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          className="h-4 w-4 sm:h-5 sm:w-5 absolute inset-0 transform scale-0 group-hover:scale-100 transition-transform duration-300" 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke={colors.primary}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </div>
                    </div>
                    <span className="hidden sm:inline">Generate</span>
                  </div>
                )}
              </button>
            </div>
            
            {error && (
              <div className="mt-2 text-sm" style={{ color: colors.secondary }}>
                {error.message}
              </div>
            )}
          </form>
          
          {/* Subtle decorative elements */}
          <div 
            className="absolute -bottom-10 -right-10 w-32 h-32 rounded-full hidden sm:block" 
            style={{ 
              background: `radial-gradient(circle, ${colors.accent}15 0%, ${colors.accent}03 50%, transparent 70%)`,
              filter: 'blur(25px)',
              zIndex: -1
            }}
          ></div>
          <div 
            className="absolute -top-10 -left-10 w-32 h-32 rounded-full hidden sm:block" 
            style={{ 
              background: `radial-gradient(circle, ${colors.primary}15 0%, ${colors.primary}03 50%, transparent 70%)`,
              filter: 'blur(25px)',
              zIndex: -1
            }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;