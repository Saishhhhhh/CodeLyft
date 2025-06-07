import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { verifyOTP, resetPassword } from '../services/authService';
import AuthLayout from '../components/auth/AuthLayout';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    email: '',
    otp: ['', '', '', ''],
    password: '',
    confirmPassword: ''
  });
  const [step, setStep] = useState(1); // 1: Enter OTP, 2: Reset Password
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Create refs for OTP inputs
  const otpRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];
  
  // Check for email in location state (from ForgotPasswordPage)
  useEffect(() => {
    if (location.state?.email) {
      setFormData(prev => ({ ...prev, email: location.state.email }));
    }
  }, [location.state]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleOtpChange = (index, value) => {
    // Only allow numbers
    if (value !== '' && !/^\d$/.test(value)) {
      return;
    }
    
    // Update the OTP array
    const newOtp = [...formData.otp];
    newOtp[index] = value;
    
    setFormData({
      ...formData,
      otp: newOtp
    });
    
    // Auto-focus next input if value is entered
    if (value !== '' && index < 3) {
      otpRefs[index + 1].current.focus();
    }
  };
  
  const handleOtpKeyDown = (index, e) => {
    // Handle backspace - move to previous input if current is empty
    if (e.key === 'Backspace') {
      if (formData.otp[index] === '' && index > 0) {
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
      const newOtp = pastedData.split('');
      setFormData({
        ...formData,
        otp: newOtp
      });
      
      // Focus the last input
      otpRefs[3].current.focus();
    }
  };
  
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };
  
  const validateOTP = () => {
    if (!formData.email) {
      setError('Please enter your email address');
      return false;
    }
    
    if (formData.otp.join('').length !== 4 || !/^\d{4}$/.test(formData.otp.join(''))) {
      setError('Please enter a valid 4-digit OTP');
      return false;
    }
    
    return true;
  };
  
  const validatePassword = () => {
    if (!formData.password) {
      setError('Please enter a password');
      return false;
    }
    
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }
    
    if (!/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])/.test(formData.password)) {
      setError('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');
      return false;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    
    return true;
  };
  
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    
    if (!validateOTP()) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      await verifyOTP({
        email: formData.email,
        otp: formData.otp.join('')
      });
      
      // Move to next step
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (!validatePassword()) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      await resetPassword({
        email: formData.email,
        otp: formData.otp.join(''),
        password: formData.password
      });
      
      // Navigate to login with success message
      navigate('/login', { 
        state: { 
          message: 'Password reset successful. Please login with your new password.' 
        } 
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <AuthLayout
      title={step === 1 ? "Verify Reset Code" : "Reset Password"}
      subtitle={step === 1 ? "Enter the 4-digit code sent to your email" : "Create a new secure password"}
      errorMessage={error}
      backgroundType="gradient"
    >
      {step === 1 ? (
        <form onSubmit={handleVerifyOTP} className="space-y-6">
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
                value={formData.email}
                onChange={handleChange}
                readOnly={!!location.state?.email}
                className={`appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 bg-gray-700 text-white sm:text-sm ${location.state?.email ? 'opacity-75 cursor-not-allowed' : ''}`}
                placeholder="your@email.com"
              />
            </div>
            {location.state?.email && (
              <p className="mt-1 text-xs text-gray-400">
                Email address from previous step (cannot be changed)
              </p>
            )}
          </div>
          
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
                  value={formData.otp[index]}
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
              {isSubmitting ? 'Verifying...' : 'Verify Code'}
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <Link to="/forgot-password" className="text-sm text-purple-400 hover:text-purple-300">
              Didn't receive a code?
            </Link>
            <Link to="/login" className="text-sm text-purple-400 hover:text-purple-300">
              Back to login
            </Link>
          </div>
        </form>
      ) : (
        <form onSubmit={handleResetPassword} className="space-y-6">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300">
              New Password
            </label>
            <div className="mt-1 relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                value={formData.password}
                onChange={handleChange}
                className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 bg-gray-700 text-white sm:text-sm"
                autoFocus
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={togglePasswordVisibility}
              >
                {showPassword ? (
                  <FaEyeSlash className="h-5 w-5 text-gray-400" />
                ) : (
                  <FaEye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-400">
              Password must be at least 8 characters and include uppercase, lowercase, number, and special character.
            </p>
          </div>
          
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300">
              Confirm New Password
            </label>
            <div className="mt-1 relative">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 bg-gray-700 text-white sm:text-sm"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={toggleConfirmPasswordVisibility}
              >
                {showConfirmPassword ? (
                  <FaEyeSlash className="h-5 w-5 text-gray-400" />
                ) : (
                  <FaEye className="h-5 w-5 text-gray-400" />
                )}
              </button>
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
              {isSubmitting ? 'Resetting Password...' : 'Reset Password'}
            </button>
          </div>
          
          <div className="text-center">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-sm text-purple-400 hover:text-purple-300"
            >
              Back to verification
            </button>
          </div>
        </form>
      )}
    </AuthLayout>
  );
};

export default ResetPasswordPage; 