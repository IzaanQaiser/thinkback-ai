import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import SignupPage from './pages/SignupPage';
import SavePage from './pages/SavePage';
import DashboardPage from './pages/DashboardPage';
import ViewPage from './pages/ViewPage';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './contexts/AuthContext';
import AccountPage from './pages/AccountPage';

function App() {
  const { currentUser } = useAuth();

  return (
    <Router>
      <div className="min-h-screen bg-dark-950">
        <Routes>
          <Route path="/auth" element={currentUser ? <Navigate to="/dashboard" /> : <AuthPage />} />
          <Route path="/signup" element={currentUser ? <Navigate to="/dashboard" /> : <SignupPage />} />
          <Route path="/" element={<Navigate to={currentUser ? "/dashboard" : "/auth"} replace />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/save" element={<SavePage />} />
            <Route path="/view/:id" element={<ViewPage />} />
            <Route path="/account" element={<AccountPage />} />
          </Route>
        </Routes>
      </div>
    </Router>
  );
}

export default App;
