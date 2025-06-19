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
import MyRoadmapsPage from './pages/MyRoadmapsPage';
import RoadmapDetailPage from './pages/RoadmapDetailPage';
import CustomRoadmapPage from './pages/CustomRoadmapPage';
import NotFoundPage from './pages/NotFoundPage';
import LoadingTestPage from './pages/LoadingTestPage';
import AboutPage from './pages/AboutPage';
import GlobalResourceModal from './components/GlobalResourceModal';
import { useAuth } from './context/AuthContext';
import { CustomRoadmapProvider } from './context/CustomRoadmapContext';
import { ChatbotProvider } from './context/ChatbotContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { ResourceModalProvider } from './context/ResourceModalContext';
import { useEffect } from 'react';
import { hasPendingPrompt } from './utils/authRedirectUtils';
import LoadingAnimation from './components/common/LoadingAnimation';

// Loading component with enhanced styling
const LoadingScreen = () => {
  return <LoadingAnimation type="fullscreen" variant="default" size="medium" />;
};

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  
  // Show loading state if authentication is being checked
  if (loading) {
    return <LoadingScreen />;
  }
  
  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    // Check if we're trying to access the questions page and if we have a pending prompt
    const redirectState = { from: location };
    
    if (location.pathname === '/questions' && hasPendingPrompt()) {
      redirectState.hasPendingPrompt = true;
    }
    
    return <Navigate to="/login" state={redirectState} replace />;
  }
  
  return children;
};

// Public route component (redirect if already authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  
  // Show loading state if authentication is being checked
  if (loading) {
    return <LoadingScreen />;
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
        // Check if there's a pending prompt to process using the new service
        const hasPending = localStorage.getItem('needsValidation') === 'true' && 
                          !!localStorage.getItem('pendingPromptValidation');
        
        if (hasPending) {
          // Always redirect to home first to ensure proper validation flow
          // The AuthContext will handle validating the prompt and redirecting to questions if valid
          navigate('/');
        } else {
          navigate('/dashboard');
        }
      }, 500);
    } else if (!loading) {
      // If no token and not loading, redirect to login
      navigate('/login');
    }
  }, [loading, location, navigate]);
  
  // Show loading spinner while processing
  return <LoadingAnimation type="fullscreen" variant="default" message="Completing authentication..." />;
};

function App() {
  return (
    <ThemeProvider>
      <ChatbotProvider>
        <CustomRoadmapProvider>
          <ResourceModalProvider>
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
            <Route 
              path="/my-roadmaps" 
              element={
                <ProtectedRoute>
                  <MyRoadmapsPage />
                </ProtectedRoute>
              } 
            />
            
            {/* Custom Roadmap Routes */}
            <Route 
              path="/custom-roadmap" 
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <CustomRoadmapPage />
                  </MainLayout>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/custom-roadmap/:id" 
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <CustomRoadmapPage />
                  </MainLayout>
                </ProtectedRoute>
              } 
            />
            
            {/* Two separate roadmap detail routes */}
            <Route 
              path="/roadmaps/:id/view" 
              element={
                <ProtectedRoute>
                  <RoadmapResultPage fromSaved={true} />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/roadmaps/:id/resources" 
              element={
                <ProtectedRoute>
                  <RoadmapProgressPage fromSaved={true} />
                </ProtectedRoute>
              } 
            />
            
            {/* Legacy route for backward compatibility */}
            <Route 
              path="/roadmaps/:id" 
              element={
                <ProtectedRoute>
                  <RoadmapDetailPage />
                </ProtectedRoute>
              } 
            />
            
            {/* New route for custom roadmaps */}
            <Route 
              path="/roadmaps/:id/custom" 
              element={
                <ProtectedRoute>
                  <RoadmapResultPage fromSaved={true} isCustom={true} />
                </ProtectedRoute>
              } 
            />
            
            {/* Routes with MainLayout */}
            <Route path="/" element={
              <MainLayout>
                <HomePage />
              </MainLayout>
            } />
            <Route path="/about" element={
              <MainLayout>
                <AboutPage />
              </MainLayout>
            } />
            <Route path="/questions" element={
              <ProtectedRoute>
                <MainLayout>
                  <RoadmapQuestionsPage />
                </MainLayout>
              </ProtectedRoute>
            } />
            <Route path="/roadmap" element={
              <ProtectedRoute>
                <MainLayout>
                  <RoadmapResultPage />
                </MainLayout>
              </ProtectedRoute>
            } />
            <Route path="/test-roadmap" element={
              <ProtectedRoute>
                <MainLayout>
                  <RoadmapTestPage />
                </MainLayout>
              </ProtectedRoute>
            } />
            <Route path="/roadmap-progress" element={
              <ProtectedRoute>
                <MainLayout>
                  <RoadmapProgressPage />
                </MainLayout>
              </ProtectedRoute>
            } />
            
            {/* Loading Test Page */}
            <Route path="/loading-test" element={
              <MainLayout>
                <LoadingTestPage />
              </MainLayout>
            } />
            
            {/* 404 Not Found */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
            
            {/* Global Resource Modal */}
            <GlobalResourceModal />
          </ResourceModalProvider>
        </CustomRoadmapProvider>
      </ChatbotProvider>
    </ThemeProvider>
  );
}

export default App;
