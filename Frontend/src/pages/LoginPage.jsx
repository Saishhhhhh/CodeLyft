import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaGithub } from 'react-icons/fa';

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

const LoginPage = () => {
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [oauthError, setOauthError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  
  // Get auth context
  const { login, loginWithGoogleOAuth, loginWithGithubOAuth, loading, error, setError } = useAuth();
  
  // Navigation
  const navigate = useNavigate();
  const location = useLocation();

  // Check for error parameter in URL and success message from state
  useEffect(() => {
    // Check for error in URL
    const params = new URLSearchParams(location.search);
    const errorParam = params.get('error');
    
    if (errorParam) {
      setOauthError(decodeURIComponent(errorParam));
    }
    
    // Check for success message in location state (from password reset)
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
    }
  }, [location]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setOauthError(null);
    
    // Validate form
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    try {
      // Call login from auth context
      const response = await login({ email, password });
      
      // Only navigate if login was successful
      if (response && response.success) {
        navigate('/');
      }
    } catch (err) {
      // Set the error message from the caught error
      const errorMessage = err.message || 'Invalid credentials. Please check your email and password.';
      setError(errorMessage);
      console.error('Login error:', err);
    }
  };

  // Handle OAuth login
  const handleOAuthLogin = async (provider) => {
    try {
      if (provider === 'Google') {
        loginWithGoogleOAuth();
      } else if (provider === 'GitHub') {
        loginWithGithubOAuth();
      }
    } catch (err) {
      setError(`Failed to login with ${provider}. Please try again.`);
      console.error(`${provider} login error:`, err);
    }
  };

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in to continue your learning journey"
      errorMessage={error || oauthError}
      successMessage={successMessage}
      backgroundType="gradient"
    >
      {/* Login form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email field */}
        <FormInput
          id="email"
          type="email"
          label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
        />
        
        {/* Password field */}
        <PasswordInput
          id="password"
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        
        {/* Remember me & Forgot password */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={() => setRememberMe(!rememberMe)}
              className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-600 rounded bg-gray-700"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-300">
              Remember me
            </label>
          </div>
          <div className="text-sm">
            <Link to="/forgot-password" className="font-medium text-purple-400 hover:text-purple-300">
              Forgot password?
            </Link>
          </div>
        </div>
        
        {/* Login button */}
        <LoadingButton
          type="submit"
          text="Sign In"
          loadingText="Signing in..."
          isLoading={loading}
        />
      </form>
      
      {/* Divider */}
      <div className="flex items-center my-6">
        <div className="flex-1 border-t border-gray-700"></div>
        <div className="px-4 text-sm text-gray-400">or continue with</div>
        <div className="flex-1 border-t border-gray-700"></div>
      </div>
      
      {/* OAuth buttons */}
      <div className="grid grid-cols-2 gap-4">
        <OAuthButton 
          provider="Google" 
          icon={<GoogleIcon />}
          onClick={() => handleOAuthLogin('Google')}
          disabled={loading}
        />
        
        <OAuthButton 
          provider="GitHub" 
          icon={<FaGithub />}
          onClick={() => {}}
          disabled={true}
        />
      </div>
      
      {/* Sign up link */}
      <div className="mt-8 text-center">
        <p className="text-gray-300">
          Don't have an account?{' '}
          <Link to="/signup" className="font-medium text-purple-400 hover:text-purple-300">
            Sign up
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};

export default LoginPage; 