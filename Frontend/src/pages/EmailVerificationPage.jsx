import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendVerificationEmail, verifyEmail } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/auth/AuthLayout';

const EmailVerificationPage = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [otp, setOtp] = useState(['', '', '', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(0);
  
  // Create refs for OTP inputs
  const otpRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];
  
  // Redirect if user is not logged in or email is already verified
  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/login');
      } else if (user.isEmailVerified) {
        navigate('/dashboard');
      }
    }
  }, [user, loading, navigate]);
  
  // Handle countdown for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);
  
  // Send verification email on initial load
  useEffect(() => {
    if (user && !user.isEmailVerified && !loading) {
      handleSendVerificationEmail();
    }
  }, [user, loading]);
  
  const handleSendVerificationEmail = async () => {
    try {
      setIsSending(true);
      setError(null);
      
      await sendVerificationEmail();
      
      // Set countdown for resend (60 seconds)
      setCountdown(60);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSending(false);
    }
  };
  
  const handleOtpChange = (index, value) => {
    // Only allow numbers
    if (value !== '' && !/^\d$/.test(value)) {
      return;
    }
    
    // Update the OTP array
    const newOtp = [...otp];
    newOtp[index] = value;
    
    setOtp(newOtp);
    
    // Auto-focus next input if value is entered
    if (value !== '' && index < 3) {
      otpRefs[index + 1].current.focus();
    }
  };
  
  const handleOtpKeyDown = (index, e) => {
    // Handle backspace - move to previous input if current is empty
    if (e.key === 'Backspace') {
      if (otp[index] === '' && index > 0) {
        otpRefs[index - 1].current.focus();
      }
    }
    
    // Handle arrow keys
    if (e.key === 'ArrowLeft' && index > 0) {
      otpRefs[index - 1].current.focus();
    }
    
    if (e.key === 'ArrowRight' && index < 3) {
      otpRefs[index + 1].current.focus();
    }
  };
  
  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    
    // Check if pasted content is 4 digits
    if (/^\d{4}$/.test(pastedData)) {
      setOtp(pastedData.split(''));
      
      // Focus the last input
      otpRefs[3].current.focus();
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const otpString = otp.join('');
    if (otpString.length !== 4 || !/^\d{4}$/.test(otpString)) {
      setError('Please enter a valid 4-digit OTP');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      await verifyEmail(otpString);
      
      setSuccess(true);
      
      // Redirect to dashboard after short delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Show loading state
  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }
  
  return (
    <AuthLayout
      title="Verify Your Email"
      subtitle={`We've sent a verification code to ${user.email}`}
      errorMessage={error}
      backgroundType="gradient"
    >
      {!success ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="otp" className="block text-sm font-medium text-gray-300">
              Verification Code (OTP)
            </label>
            <div className="mt-1 flex justify-center gap-2">
              {[0, 1, 2, 3].map((index) => (
                <input
                  key={index}
                  ref={otpRefs[index]}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={otp[index]}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  onPaste={index === 0 ? handleOtpPaste : undefined}
                  className="appearance-none w-14 h-14 text-center px-0 py-2 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 bg-gray-700 text-white text-xl font-bold"
                  autoFocus={index === 0}
                />
              ))}
            </div>
            <p className="mt-1 text-xs text-gray-400 text-center">
              Enter the 4-digit code sent to your email
            </p>
          </div>
          
          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                isSubmitting ? 'bg-purple-700' : 'bg-purple-600 hover:bg-purple-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500`}
            >
              {isSubmitting ? 'Verifying...' : 'Verify Email'}
            </button>
          </div>
          
          <div className="text-center">
            <button
              type="button"
              onClick={handleSendVerificationEmail}
              disabled={countdown > 0 || isSending}
              className={`text-sm ${
                countdown > 0 || isSending 
                  ? 'text-gray-500 cursor-not-allowed' 
                  : 'text-purple-400 hover:text-purple-300'
              }`}
            >
              {isSending 
                ? 'Sending...' 
                : countdown > 0 
                  ? `Resend code in ${countdown}s` 
                  : 'Resend verification code'}
            </button>
          </div>
        </form>
      ) : (
        <div className="text-center">
          <div className="mb-4 text-green-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-medium text-white mb-2">Email Verified Successfully!</h3>
          <p className="text-gray-300 mb-6">
            Your email has been verified. You will be redirected to the dashboard shortly.
          </p>
        </div>
      )}
    </AuthLayout>
  );
};

export default EmailVerificationPage; 