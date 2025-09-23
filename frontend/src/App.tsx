// Import React and necessary hooks
import React, { useEffect } from 'react';
// Import routing components from React Router
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
// Import all the different pages in our app
import AuthPage from './pages/AuthPage';
import SignupPage from './pages/SignupPage';
import SavePage from './pages/SavePage';
import DashboardPage from './pages/DashboardPage';
import HomePage from './pages/HomePage';
import AccountPage from './pages/AccountPage';
import FeedbackPage from './pages/FeedbackPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
// Import components we need
import ProtectedRoute from './components/ProtectedRoute';
import Footer from './components/Footer';
// Import context providers for managing app state
import { useAuth } from './contexts/AuthContext';
import { SaveNotificationProvider } from './contexts/SaveNotificationContext';
// Import API function to verify user tokens
import { verifyUserToken } from './services/api';

// This component handles keyboard shortcuts and authentication logic
const AppContent: React.FC = () => {
  // Get navigation function and user authentication data
  const navigate = useNavigate();
  const { currentUser, getIdToken } = useAuth();

  // Set up keyboard shortcuts for quick navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if user is on Mac (uses Cmd key) or PC (uses Ctrl key)
      const isMac = /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform);
      const isModifier = isMac ? e.metaKey : e.ctrlKey;

      // Cmd/Ctrl + K: Go to dashboard with search focused
      if (isModifier && e.key === 'k') {
        e.preventDefault();
        navigate('/dashboard?focus=search');
      }

      // Cmd/Ctrl + I: Go to save page
      if (isModifier && e.key === 'i') {
        e.preventDefault();
        navigate('/save');
      }

      // Cmd/Ctrl + M: Go to account page
      if (isModifier && e.key === 'm') {
        e.preventDefault();
        navigate('/account');
      }
    };

    // Add the keyboard listener when component mounts
    window.addEventListener('keydown', handleKeyDown);
    // Clean up the listener when component unmounts
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [navigate]);

  // Handle what happens after user logs in (authentication redirect)
  useEffect(() => {
    const handleAuthRedirect = async () => {
      // Only run this if there's a logged-in user
      if (currentUser) {
        console.log('🔄 User authenticated, handling redirect...');
        try {
          // Get the user's authentication token
          const idToken = await getIdToken();
          if (idToken) {
            console.log('✅ Got ID token, verifying with backend...');
            // Send token to backend to verify it's valid
            await verifyUserToken(idToken);
            console.log('✅ Token verified, checking navigation...');
            
            // If user is on login/signup pages, redirect them to dashboard
            const currentPath = window.location.pathname;
            if (currentPath === '/auth' || currentPath === '/signup' || currentPath === '/') {
              console.log(`🔄 Navigating from ${currentPath} to /dashboard`);
              navigate('/dashboard');
            }
          } else {
            console.log('⚠️ No ID token available');
          }
        } catch (error) {
          console.error('❌ Error verifying user token after redirect:', error);
        }
      } else {
        console.log('👤 No current user');
      }
    };

    // Run the authentication check
    handleAuthRedirect();
  }, [currentUser, getIdToken, navigate]);

  // This component doesn't render anything visible - it just handles logic
  return null;
}

// Main App component that sets up routing and layout
function App() {
  // Get the current user's authentication status
  const { currentUser } = useAuth();

  return (
    // Set up React Router for navigation between pages
    <Router>
      {/* Component that handles keyboard shortcuts and auth logic */}
      <AppContent />
      {/* Provider that manages save notifications throughout the app */}
      <SaveNotificationProvider>
        {/* Main app container with dark background and full height */}
        <div className="min-h-screen bg-dark-950 flex flex-col">
          {/* Main content area that takes up available space */}
          <div className="flex-1">
            {/* Define all the routes in our app */}
            <Routes>
              {/* Public routes - redirect to dashboard if user is already logged in */}
              <Route path="/auth" element={currentUser ? <Navigate to="/dashboard" /> : <AuthPage />} />
              <Route path="/signup" element={currentUser ? <Navigate to="/dashboard" /> : <SignupPage />} />
              <Route path="/verify-email" element={<VerifyEmailPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/" element={currentUser ? <Navigate to="/dashboard" replace /> : <HomePage />} />
              
              {/* Protected routes - require user to be logged in */}
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/save" element={<SavePage />} />
                <Route path="/account" element={<AccountPage />} />
                <Route path="/feedback" element={<FeedbackPage />} />
              </Route>
            </Routes>
          </div>
          {/* Show footer only for logged-in users */}
          {currentUser && <Footer />}
        </div>
      </SaveNotificationProvider>
    </Router>
  );
}

// Export the App component as the default export
export default App;
