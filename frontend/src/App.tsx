import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import SignupPage from './pages/SignupPage';
import SavePage from './pages/SavePage';
import DashboardPage from './pages/DashboardPage';
import HomePage from './pages/HomePage';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './contexts/AuthContext';
import { SaveNotificationProvider } from './contexts/SaveNotificationContext';
import AccountPage from './pages/AccountPage';
import FeedbackPage from './pages/FeedbackPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import Footer from './components/Footer';
import { verifyUserToken } from './services/api';

const AppContent: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, getIdToken } = useAuth();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform);
      const isModifier = isMac ? e.metaKey : e.ctrlKey;

      if (isModifier && e.key === 'k') {
        e.preventDefault();
        navigate('/dashboard?focus=search');
      }

      if (isModifier && e.key === 'i') {
        e.preventDefault();
        navigate('/save');
      }

      if (isModifier && e.key === 'm') {
        e.preventDefault();
        navigate('/account');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [navigate]);

  // Handle authentication redirect result
  useEffect(() => {
    const handleAuthRedirect = async () => {
      if (currentUser) {
        console.log('🔄 User authenticated, handling redirect...');
        try {
          const idToken = await getIdToken();
          if (idToken) {
            console.log('✅ Got ID token, verifying with backend...');
            await verifyUserToken(idToken);
            console.log('✅ Token verified, checking navigation...');
            
            // Navigate to dashboard if we're on auth pages or if we just completed a redirect
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

    handleAuthRedirect();
  }, [currentUser, getIdToken, navigate]);

  return null;
}

function App() {
  const { currentUser } = useAuth();

  return (
    <Router>
      <AppContent />
      <SaveNotificationProvider>
        <div className="min-h-screen bg-dark-950 flex flex-col">
          <div className="flex-1">
            <Routes>
              <Route path="/auth" element={currentUser ? <Navigate to="/dashboard" /> : <AuthPage />} />
              <Route path="/signup" element={currentUser ? <Navigate to="/dashboard" /> : <SignupPage />} />
              <Route path="/verify-email" element={<VerifyEmailPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/" element={currentUser ? <Navigate to="/dashboard" replace /> : <HomePage />} />
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/save" element={<SavePage />} />
                <Route path="/account" element={<AccountPage />} />
                <Route path="/feedback" element={<FeedbackPage />} />
              </Route>
            </Routes>
          </div>
          {/* Only show Footer for authenticated routes and other pages */}
          {currentUser && <Footer />}
        </div>
      </SaveNotificationProvider>
    </Router>
  );
}

export default App;
