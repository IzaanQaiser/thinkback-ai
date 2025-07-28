import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import SignupPage from './pages/SignupPage';
import SavePage from './pages/SavePage';
import DashboardPage from './pages/DashboardPage';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './contexts/AuthContext';
import AccountPage from './pages/AccountPage';
import FeedbackPage from './pages/FeedbackPage';
import VerifyEmailPage from './pages/VerifyEmailPage';

const AppContent: React.FC = () => {
  const navigate = useNavigate();

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

  return null;
}

function App() {
  const { currentUser } = useAuth();

  return (
    <Router>
      <AppContent />
      <div className="min-h-screen bg-dark-950">
        <Routes>
          <Route path="/auth" element={currentUser ? <Navigate to="/dashboard" /> : <AuthPage />} />
          <Route path="/signup" element={currentUser ? <Navigate to="/dashboard" /> : <SignupPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/" element={<Navigate to={currentUser ? "/dashboard" : "/auth"} replace />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/save" element={<SavePage />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="/feedback" element={<FeedbackPage />} />
          </Route>
        </Routes>
      </div>
    </Router>
  );
}

export default App;
