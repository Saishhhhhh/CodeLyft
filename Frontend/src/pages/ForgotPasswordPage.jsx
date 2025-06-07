import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { forgotPassword } from '../services/authService';
import AuthLayout from '../components/auth/AuthLayout';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  
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
            <label htmlFor="email" className="block text-sm font-medium text-gray-300">
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
                className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 bg-gray-700 text-white sm:text-sm"
                placeholder="your@email.com"
              />
            </div>
          </div>
          
          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                isSubmitting ? 'bg-purple-700' : 'bg-purple-600 hover:bg-purple-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500`}
            >
              {isSubmitting ? 'Sending...' : 'Send Reset Code'}
            </button>
          </div>
          
          <div className="text-center">
            <Link to="/login" className="text-sm text-purple-400 hover:text-purple-300">
              Back to login
            </Link>
          </div>
        </form>
      ) : (
        <div className="text-center">
          <div className="mb-4 text-green-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-medium text-white mb-2">Check Your Email</h3>
          <p className="text-gray-300 mb-6">
            We've sent a password reset code to <span className="font-medium">{email}</span>.
            Please check your inbox and follow the instructions to reset your password.
          </p>
          <div className="flex flex-col space-y-4">
            <button
              onClick={handleEnterResetCode}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              Enter Reset Code
            </button>
            <button
              onClick={() => {
                setSuccess(false);
                setEmail('');
              }}
              className="text-sm text-purple-400 hover:text-purple-300"
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