import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaGoogle, FaGithub } from 'react-icons/fa';

// Import reusable components
import FormInput from '../components/auth/FormInput';
import PasswordInput from '../components/auth/PasswordInput';
import OAuthButton from '../components/auth/OAuthButton';
import AuthLayout from '../components/auth/AuthLayout';
import LoadingButton from '../components/auth/LoadingButton';

// Import auth context
import { useAuth } from '../context/AuthContext';

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
    
    // Clear any previous auth errors
    return () => setError(null);
  }, [location, setError]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage(null);
    
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
      await login({ email, password });
      
      // Redirect to dashboard on success
      navigate('/dashboard');
    } catch (err) {
      // Error is handled in the auth context
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
          icon={<FaGoogle />}
          onClick={() => handleOAuthLogin('Google')}
          disabled={loading}
        />
        
        <OAuthButton 
          provider="GitHub" 
          icon={<FaGithub />}
          onClick={() => handleOAuthLogin('GitHub')}
          disabled={loading}
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