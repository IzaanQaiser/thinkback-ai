import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Logo from '../components/Logo';
import Button from '../components/Button';
import { User, LogOut, GitBranch, ChevronLeft } from 'lucide-react';

const AccountPage: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/auth');
    } catch (error) {
      console.error('Failed to log out', error);
      // You could show an error toast here
    }
  };

  // Get version from package.json - Vite exposes this via import.meta.env
  const appVersion = import.meta.env.VITE_APP_VERSION || '0.1.0';

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 text-white">
      {/* Header */}
      <div className="relative z-10 bg-dark-900/30 backdrop-blur-xl border-b border-dark-800/50">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Logo size="sm" />
            <Button
              variant="ghost"
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-2"
            >
              <ChevronLeft size={18} />
              <span>Back to Dashboard</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="animate-slide-up">
          <h1 className="text-4xl font-bold mb-2">Account Settings</h1>
          <p className="text-dark-400 mb-10">Manage your account details and application settings.</p>

          <div className="bg-dark-900/40 border border-dark-800/50 rounded-2xl p-8 space-y-8">
            {/* Profile Section */}
            <div>
              <h2 className="text-xl font-semibold flex items-center space-x-3 mb-4">
                <User size={22} className="text-primary-400" />
                <span>Profile</span>
              </h2>
              <div className="pl-9">
                <p className="text-dark-300">You are logged in as:</p>
                <p className="font-mono text-lg text-white bg-dark-800/50 inline-block px-3 py-1 rounded-md mt-1">
                  {currentUser?.email}
                </p>
              </div>
            </div>

            {/* Actions Section */}
            <div>
               <h2 className="text-xl font-semibold flex items-center space-x-3 mb-4">
                <LogOut size={22} className="text-red-400" />
                <span>Actions</span>
              </h2>
              <div className="pl-9">
                <Button onClick={handleLogout} variant="danger" className="max-w-xs">
                  Log Out
                </Button>
                 <p className="text-dark-400 text-sm mt-2">This will end your current session.</p>
              </div>
            </div>

            {/* About Section */}
            <div>
               <h2 className="text-xl font-semibold flex items-center space-x-3 mb-4">
                <GitBranch size={22} className="text-gray-400" />
                <span>About</span>
              </h2>
              <div className="pl-9">
                <p className="text-dark-300">Current app version:</p>
                <p className="font-mono text-lg text-white">
                  v{appVersion}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AccountPage;
