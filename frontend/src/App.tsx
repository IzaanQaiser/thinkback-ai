import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import SignupPage from './pages/SignupPage';
import SavePage from './pages/SavePage';
import DashboardPage from './pages/DashboardPage';
import ViewPage from './pages/ViewPage';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-dark-950">
        <Routes>
          <Route path="/" element={<Navigate to="/auth" replace />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/save" element={<SavePage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/view/:id" element={<ViewPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
