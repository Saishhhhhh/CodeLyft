import { createContext, useState, useEffect, useContext } from 'react';
import { 
  register as registerUser,
  login as loginUser,
  logout as logoutUser,
  getCurrentUser,
  isAuthenticated,
  loginWithGoogle,
  loginWithGithub
} from '../services/authService';
import { 
  hasPendingPrompt, 
  validatePendingPrompt, 
  clearPendingPrompt,
  storePromptForValidation
} from '../utils/authRedirectUtils';

// Create auth context
const AuthContext = createContext();

/**
 * Auth provider component
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingValidation, setPendingValidation] = useState(null);

  // Load user on initial render if token exists or if redirected from OAuth
  useEffect(() => {
    const loadUser = async () => {
      try {
        setLoading(true);
        
        // Check for authentication (token in localStorage or session cookie)
        if (isAuthenticated()) {
          const response = await getCurrentUser();
          if (response.success && response.data) {
            setUser(response.data);
            
            // Check if there's a pending prompt to validate
            if (hasPendingPrompt()) {
              const validationResult = await validatePendingPrompt();
              
              // Store the validation result regardless of whether it's valid or not
              // This allows us to handle both valid and invalid prompts appropriately
              setPendingValidation(validationResult);
              
              // If validation failed, make sure the prompt is preserved
              if (validationResult && !validationResult.isValid && validationResult.prompt) {
                storePromptForValidation(validationResult.prompt);
              }
            }
          } else {
            // Clear invalid token
            localStorage.removeItem('token');
            // Don't clear pending prompt here - we want to preserve it even if auth fails
          }
        }
      } catch (err) {
        console.error('Failed to load user:', err.message);
        // Clear invalid token
        localStorage.removeItem('token');
        // Don't clear pending prompt here
      } finally {
        setLoading(false);
      }
    };

    loadUser();
    
    // Check URL for OAuth error parameters
    const urlParams = new URLSearchParams(window.location.search);
    const oauthError = urlParams.get('error');
    if (oauthError) {
      setError(decodeURIComponent(oauthError));
    }
  }, []);

  /**
   * Register a new user
   */
  const register = async (userData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await registerUser(userData);
      setUser(response.user);
      
      // Redirect to email verification page if user is not verified
      if (response.user && !response.user.isEmailVerified) {
        window.location.href = '/verify-email';
      }
      
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Login a user
   */
  const login = async (credentials) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await loginUser(credentials);
      
      if (response.success && response.user) {
        setUser(response.user);
        
        // Check if there's a pending prompt to validate
        if (hasPendingPrompt()) {
          const validationResult = await validatePendingPrompt();
          setPendingValidation(validationResult);
          
          // If validation failed, make sure the prompt is preserved
          if (validationResult && !validationResult.isValid && validationResult.prompt) {
            storePromptForValidation(validationResult.prompt);
          }
        }
        
        return response;
      } else {
        throw new Error('Login failed. Please check your credentials.');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Logout the current user
   */
  const logout = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await logoutUser();
      setUser(null);
      clearPendingPrompt();
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Initiate Google OAuth login
   */
  const loginWithGoogleOAuth = () => {
    setLoading(true);
    loginWithGoogle();
  };

  /**
   * Initiate GitHub OAuth login
   */
  const loginWithGithubOAuth = () => {
    setLoading(true);
    loginWithGithub();
  };

  /**
   * Clear pending validation state
   */
  const clearPendingValidation = () => {
    setPendingValidation(null);
  };

  // Context value
  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    pendingValidation,
    clearPendingValidation,
    register,
    login,
    logout,
    loginWithGoogleOAuth,
    loginWithGithubOAuth,
    setError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to use auth context
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default AuthContext; 