import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaGoogle, FaGithub, FaEye, FaEyeSlash } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

// Import reusable components
import FormInput from '../components/auth/FormInput';
import PasswordInput from '../components/auth/PasswordInput';
import OAuthButton from '../components/auth/OAuthButton';
import AuthLayout from '../components/auth/AuthLayout';
import LoadingButton from '../components/auth/LoadingButton';

// Import auth context
import { useAuth } from '../context/AuthContext';

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

const SignupPage = () => {
  const navigate = useNavigate();
  const { register, loginWithGoogleOAuth, loginWithGithubOAuth, error } = useAuth();
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
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error when user types
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
  };
  
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };
  
  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    } else if (!/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])/.test(formData.password)) {
      errors.password = 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character';
    }
    
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    return errors;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const userData = {
        name: formData.name,
        email: formData.email,
        password: formData.password
      };
      
      await register(userData);
      
      // Redirect to home page after successful registration
      navigate('/');
    } catch (err) {
      // Error is handled by AuthContext
      console.error('Registration error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleGoogleLogin = () => {
    loginWithGoogleOAuth();
  };
  
  const handleGithubLogin = () => {
    loginWithGithubOAuth();
  };

  return (
    <AuthLayout
      title="Create an Account"
      subtitle="Join our community and start your coding journey"
      errorMessage={error}
      backgroundType="gradient"
    >
      <div className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium" style={{ color: colors.text }}>
              Full Name
            </label>
            <div className="mt-1">
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                value={formData.name}
                onChange={handleChange}
                className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm`}
                style={{ 
                  borderColor: formErrors.name ? colors.secondary : colors.border,
                  backgroundColor: colors.cardBg,
                  color: colors.text
                }}
                placeholder="John Doe"
              />
              {formErrors.name && (
                <p className="mt-1 text-sm" style={{ color: colors.secondary }}>{formErrors.name}</p>
              )}
            </div>
          </div>
          
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
                value={formData.email}
                onChange={handleChange}
                className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm`}
                style={{ 
                  borderColor: formErrors.email ? colors.secondary : colors.border,
                  backgroundColor: colors.cardBg,
                  color: colors.text
                }}
                placeholder="your@email.com"
              />
              {formErrors.email && (
                <p className="mt-1 text-sm" style={{ color: colors.secondary }}>{formErrors.email}</p>
              )}
            </div>
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium" style={{ color: colors.text }}>
              Password
            </label>
            <div className="mt-1 relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleChange}
                className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm`}
                style={{ 
                  borderColor: formErrors.password ? colors.secondary : colors.border,
                  backgroundColor: colors.cardBg,
                  color: colors.text
                }}
                placeholder="••••••••"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={togglePasswordVisibility}
              >
                {showPassword ? (
                  <FaEyeSlash className="h-5 w-5" style={{ color: colors.textMuted }} />
                ) : (
                  <FaEye className="h-5 w-5" style={{ color: colors.textMuted }} />
                )}
              </button>
              {formErrors.password && (
                <p className="mt-1 text-sm" style={{ color: colors.secondary }}>{formErrors.password}</p>
              )}
            </div>
            <p className="mt-1 text-xs" style={{ color: colors.textMuted }}>
              Must be at least 8 characters and include uppercase, lowercase, number, and special character.
            </p>
          </div>
          
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium" style={{ color: colors.text }}>
              Confirm Password
            </label>
            <div className="mt-1 relative">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm`}
                style={{ 
                  borderColor: formErrors.confirmPassword ? colors.secondary : colors.border,
                  backgroundColor: colors.cardBg,
                  color: colors.text
                }}
                placeholder="••••••••"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={toggleConfirmPasswordVisibility}
              >
                {showConfirmPassword ? (
                  <FaEyeSlash className="h-5 w-5" style={{ color: colors.textMuted }} />
                ) : (
                  <FaEye className="h-5 w-5" style={{ color: colors.textMuted }} />
                )}
              </button>
              {formErrors.confirmPassword && (
                <p className="mt-1 text-sm" style={{ color: colors.secondary }}>{formErrors.confirmPassword}</p>
              )}
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
              {isSubmitting ? 'Creating Account...' : 'Sign Up'}
            </button>
          </div>
        </form>
        
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t" style={{ borderColor: colors.border }}></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2" style={{ backgroundColor: colors.cardBg, color: colors.textMuted }}>
              Or continue with
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <OAuthButton 
            provider="Google" 
            icon={<GoogleIcon />}
            onClick={handleGoogleLogin}
            disabled={isSubmitting}
          />
          
          <OAuthButton 
            provider="GitHub" 
            icon={<FaGithub />}
            onClick={() => {}}
            disabled={true}
          />
        </div>
        
        <div className="text-center">
          <p className="text-sm" style={{ color: colors.textMuted }}>
            Already have an account?{' '}
            <Link to="/login" className="font-medium hover:underline" style={{ color: colors.primary }}>
              Log in
            </Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
};

export default SignupPage; 