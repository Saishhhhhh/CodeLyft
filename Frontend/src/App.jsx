import './App.css'
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import HomePage from './pages/HomePage'
import RoadmapQuestionsPage from './pages/RoadmapQuestionsPage'
import RoadmapResultPage from './pages/RoadmapResultPage'
import RoadmapTestPage from './pages/RoadmapTestPage';
import RoadmapProgressPage from './pages/RoadmapProgressPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import EmailVerificationPage from './pages/EmailVerificationPage';
import Dashboard from './pages/Dashboard';
import NotFoundPage from './pages/NotFoundPage';
import { useAuth } from './context/AuthContext';
import { useEffect } from 'react';

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  
  // Show loading state if authentication is being checked
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }
  
  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  return children;
};

// Public route component (redirect if already authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  
  // Show loading state if authentication is being checked
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }
  
  // Redirect to dashboard if already authenticated
  if (isAuthenticated) {
    // Get the intended destination or default to dashboard
    const from = location.state?.from?.pathname || '/dashboard';
    return <Navigate to={from} replace />;
  }
  
  return children;
};

// OAuth callback handler component
const OAuthCallback = () => {
  const { loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Check if there's an error or token in the URL
    const urlParams = new URLSearchParams(location.search);
    const error = urlParams.get('error');
    const token = urlParams.get('token');
    
    if (error) {
      navigate('/login?error=' + error);
      return;
    }
    
    if (token) {
      // Store the token in localStorage
      localStorage.setItem('token', token);
      
      // Wait a moment to ensure token is stored before redirecting
      setTimeout(() => {
        navigate('/dashboard');
      }, 500);
    } else if (!loading) {
      // If no token and not loading, redirect to login
      navigate('/login');
    }
  }, [loading, location, navigate]);
  
  // Show loading spinner while processing
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mb-4"></div>
      <p className="text-white">Completing authentication...</p>
    </div>
  );
};

function App() {
  return (
    <Routes>
      {/* Public routes (accessible only when not logged in) */}
      <Route 
        path="/login" 
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        } 
      />
      <Route 
        path="/signup" 
        element={
          <PublicRoute>
            <SignupPage />
          </PublicRoute>
        } 
      />
      <Route 
        path="/forgot-password" 
        element={
          <PublicRoute>
            <ForgotPasswordPage />
          </PublicRoute>
        } 
      />
      <Route 
        path="/reset-password" 
        element={
          <PublicRoute>
            <ResetPasswordPage />
          </PublicRoute>
        } 
      />
      
      {/* OAuth callback routes */}
      <Route path="/auth/callback" element={<OAuthCallback />} />
      
      {/* Protected routes (require authentication) */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/verify-email" 
        element={
          <ProtectedRoute>
            <EmailVerificationPage />
          </ProtectedRoute>
        } 
      />
      
      {/* Routes with MainLayout */}
      <Route path="/" element={
        <MainLayout>
          <HomePage />
        </MainLayout>
      } />
      <Route path="/questions" element={
        <MainLayout>
          <RoadmapQuestionsPage />
        </MainLayout>
      } />
      <Route path="/roadmap" element={
        <MainLayout>
          <RoadmapResultPage />
        </MainLayout>
      } />
      <Route path="/test-roadmap" element={
        <MainLayout>
          <RoadmapTestPage />
        </MainLayout>
      } />
      <Route path="/roadmap-progress" element={
        <MainLayout>
          <RoadmapProgressPage />
        </MainLayout>
      } />
      
      {/* 404 Not Found */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App
