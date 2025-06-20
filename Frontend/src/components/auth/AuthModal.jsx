import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { storePromptForValidation } from '../../utils/authRedirectUtils';
import GoogleButton from './GoogleButton';

const AuthModal = ({ isOpen, onClose, prompt }) => {
  const navigate = useNavigate();
  const { loginWithGoogleOAuth, loginWithGithubOAuth } = useAuth();

  if (!isOpen) return null;

  const handleGoogleLogin = () => {
    // Store prompt for validation after login
    storePromptForValidation(prompt);
    loginWithGoogleOAuth();
  };

  const handleGithubLogin = () => {
    // Store prompt for validation after login
    storePromptForValidation(prompt);
    loginWithGithubOAuth();
  };

  const handleEmailLogin = () => {
    // Store prompt for validation after login
    storePromptForValidation(prompt);
    navigate('/login');
  };

  const handleEmailSignup = () => {
    // Store prompt for validation after login
    storePromptForValidation(prompt);
    navigate('/signup');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div 
        className="relative w-full max-w-md p-6 mx-4 rounded-lg shadow-xl"
        style={{ 
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)'
        }}
      >
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Modal content */}
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-6">CodeLyft</h2>
          
          <p className="mb-8 text-gray-700">
            To use CodeLyft you must log into an existing account or
            create one using one of the options below
          </p>
          
          {/* Google login button */}
          <GoogleButton onClick={handleGoogleLogin} className="mb-4" />
          
          {/* GitHub login button */}
          <button 
            onClick={handleGithubLogin}
            className="w-full mb-4 flex items-center justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-not-allowed opacity-60 pointer-events-none"
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z" />
            </svg>
            Sign in with GitHub
          </button>
          
          {/* Email login button */}
          <button 
            onClick={handleEmailLogin}
            className="w-full mb-4 flex items-center justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Sign In with Email and Password
          </button>
          
          {/* Sign up option */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">Don't have an account?</p>
            <button 
              onClick={handleEmailSignup}
              className="mt-2 text-blue-600 hover:text-blue-800 font-medium"
            >
              Sign up
            </button>
          </div>
          
          <p className="mt-8 text-xs text-gray-500">
            By using CodeLyft, you agree to the collection of usage
            data for analytics.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthModal; 