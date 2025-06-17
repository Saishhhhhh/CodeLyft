import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { forgotPassword } from '../services/authService';
import AuthLayout from '../components/auth/AuthLayout';
import { useTheme } from '../context/ThemeContext';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
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
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      await forgotPassword(email);
      
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEnterResetCode = () => {
    navigate('/reset-password', { state: { email } });
  };
  
  return (
    <AuthLayout
      title="Forgot Password"
      subtitle="Enter your email to receive a password reset code"
      errorMessage={error}
      backgroundType="gradient"
    >
      {!success ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium" style={{ color: colors.text }}>
              Email Address
            </label>
            <div className="mt-1">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm"
                style={{ 
                  borderColor: colors.border,
                  backgroundColor: colors.cardBg,
                  color: colors.text
                }}
                placeholder="your@email.com"
              />
            </div>
          </div>
          
          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2"
              style={{ 
                backgroundColor: isSubmitting ? `${colors.primary}80` : colors.primary,
                color: '#FFFFFF'
              }}
            >
              {isSubmitting ? 'Sending...' : 'Send Reset Code'}
            </button>
          </div>
          
          <div className="text-center">
            <Link to="/login" className="font-medium hover:underline" style={{ color: colors.primary }}>
              Back to login
            </Link>
          </div>
        </form>
      ) : (
        <div className="text-center">
          <div className="mb-4" style={{ color: '#34D399' }}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-medium mb-2" style={{ color: colors.text }}>Check Your Email</h3>
          <p className="mb-6" style={{ color: colors.textMuted }}>
            We've sent a password reset code to <span className="font-medium" style={{ color: colors.text }}>{email}</span>.
            Please check your inbox and follow the instructions to reset your password.
          </p>
          <div className="flex flex-col space-y-4">
            <button
              onClick={handleEnterResetCode}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2"
              style={{ 
                backgroundColor: colors.primary,
                color: '#FFFFFF'
              }}
            >
              Enter Reset Code
            </button>
            <button
              onClick={() => {
                setSuccess(false);
                setEmail('');
              }}
              className="text-sm hover:underline"
              style={{ color: colors.primary }}
            >
              Try with a different email
            </button>
          </div>
        </div>
      )}
    </AuthLayout>
  );
};

export default ForgotPasswordPage; 