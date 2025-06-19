import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendVerificationEmail, verifyEmail } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import AuthLayout from '../components/auth/AuthLayout';

const EmailVerificationPage = () => {
  const navigate = useNavigate();
  const { user, loading, isNewlyRegistered } = useAuth();
  const { darkMode } = useTheme();
  const [otp, setOtp] = useState(['', '', '', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(0);
  
  // Define colors based on theme
  const colors = {
    primary: darkMode ? '#4F46E5' : '#4F46E5', // Indigo - main brand color
    background: darkMode ? '#111827' : '#F9F9F9', // Dark Gray / Light Gray
    cardBg: darkMode ? '#1E293B' : '#FFFFFF', // Darker background / White
    inputBg: darkMode ? '#1F2937' : '#F3F4F6', // Dark input / Light input
    inputBorder: darkMode ? '#374151' : '#D1D5DB', // Dark border / Light border
    text: darkMode ? '#F9FAFB' : '#111827', // Light text / Dark text
    textMuted: darkMode ? '#9CA3AF' : '#6B7280', // Muted light text / Muted dark text
  };
  
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
  
  // Send verification email on initial load only if user didn't just register
  useEffect(() => {
    if (user && !user.isEmailVerified && !loading) {
      // If user just registered, they already received the OTP in welcome email
      // so we don't need to send another one
      if (!isNewlyRegistered) {
        handleSendVerificationEmail();
      } else {
        // For newly registered users, just set a countdown to prevent immediate resend
        setCountdown(60);
        console.log('User just registered, not sending another verification email');
      }
    }
  }, [user, loading, isNewlyRegistered]);
  
  const handleSendVerificationEmail = async () => {
    try {
      setIsSending(true);
      setError(null);
      
      const response = await sendVerificationEmail();
      
      // If response indicates an OTP was already sent, just set the countdown
      if (response.alreadySent) {
        console.log('Using existing OTP, not sending new email');
      }
      
      // Set countdown for resend (60 seconds)
      setCountdown(60);
    } catch (err) {
      setError(err.message);
      
      // If the error is about rate limiting, set the countdown accordingly
      if (err.message.includes('wait') || err.message.includes('minute')) {
        setCountdown(60); // Set to 60 seconds if rate limited
      }
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
      <div className="flex items-center justify-center min-h-screen transition-colors duration-300" style={{ backgroundColor: colors.background }}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2" style={{ borderColor: colors.primary }}></div>
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
            <label htmlFor="otp" className="block text-sm font-medium" style={{ color: colors.text }}>
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
                  className="appearance-none w-14 h-14 text-center px-0 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 transition-all duration-200 text-xl font-bold"
                  style={{
                    backgroundColor: colors.inputBg,
                    borderColor: colors.inputBorder,
                    color: colors.text,
                    focusRingColor: colors.primary
                  }}
                  autoFocus={index === 0}
                />
              ))}
            </div>
            <p className="mt-1 text-xs text-center" style={{ color: colors.textMuted }}>
              Enter the 4-digit code sent to your email
            </p>
          </div>
          
          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition-all duration-200 ${
                isSubmitting ? 'opacity-80' : 'hover:opacity-90'
              } focus:outline-none focus:ring-2 focus:ring-offset-2`}
              style={{ 
                backgroundColor: colors.primary,
                boxShadow: `0 4px 6px -1px ${colors.primary}30`
              }}
            >
              {isSubmitting ? 'Verifying...' : 'Verify Email'}
            </button>
          </div>
          
          <div className="text-center">
            <button
              type="button"
              onClick={handleSendVerificationEmail}
              disabled={countdown > 0 || isSending}
              className={`text-sm transition-colors duration-200 ${
                countdown > 0 || isSending ? 'cursor-not-allowed' : 'hover:opacity-80'
              }`}
              style={{ 
                color: countdown > 0 || isSending ? colors.textMuted : colors.primary
              }}
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
          <div className="mb-4" style={{ color: '#10B981' }}> {/* Always green for success */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-medium mb-2" style={{ color: colors.text }}>
            Email Verified Successfully!
          </h3>
          <p className="mb-6" style={{ color: colors.textMuted }}>
            Your email has been verified. You will be redirected to the dashboard shortly.
          </p>
        </div>
      )}
    </AuthLayout>
  );
};

export default EmailVerificationPage; 