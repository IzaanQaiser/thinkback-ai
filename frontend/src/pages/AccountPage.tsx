import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Logo from '../components/Logo';
import Button from '../components/Button';
import { User, LogOut, GitBranch, ChevronLeft, KeyRound, ShieldCheck } from 'lucide-react';
import Input from '../components/Input';
import { changePassword } from '../services/api';
import Kbd from '../components/Kbd';

const AccountPage: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isMac, setIsMac] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    setIsMac(/(Mac|iPhone|iPod|iPad)/i.test(navigator.platform));
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        navigate('/dashboard');
      }

      const isModifier = isMac ? e.metaKey : e.ctrlKey;
      if (isModifier && e.shiftKey && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        handleLogout();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [navigate, isMac]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/auth');
    } catch (error) {
      console.error('Failed to log out', error);
      // You could show an error toast here
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      const idToken = await currentUser?.getIdToken();
      if (!idToken) {
        throw new Error("Could not get user token.");
      }
      const response = await changePassword(idToken, newPassword);
      setSuccess(response.message);
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    }
  };

  // Get version from package.json - Vite exposes this via import.meta.env
  const appVersion = import.meta.env.VITE_APP_VERSION || '0.1.0';

  return (
    <div className="min-h-screen bg-white dark:bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 text-dark-900 dark:text-white">
      {/* Header */}
      <div className="relative z-10 bg-white/80 dark:bg-dark-900/30 backdrop-blur-xl border-b border-dark-200/50 dark:border-dark-800/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Logo size="sm" />
            <Link to="/dashboard" className="flex items-center space-x-3 px-4 py-2 rounded-full bg-dark-100/50 dark:bg-dark-800/50 hover:bg-dark-200/60 dark:hover:bg-dark-700/70 transition-colors duration-200 text-dark-800 dark:text-white">
                <span className="font-medium text-sm">Back to Vault</span>
                <Kbd>esc</Kbd>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div>
          <h1 className="text-5xl font-bold mb-2 text-dark-900 dark:text-white" style={{ textShadow: '0 0 25px rgba(14, 165, 233, 0.5)' }}>Account Settings</h1>
          <p className="text-dark-500 dark:text-dark-400 text-lg mb-10">Manage your account details and application settings.</p>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2">
              {/* Main Settings Box */}
              <div className="bg-dark-100/30 dark:bg-dark-900/40 border border-dark-200/50 dark:border-dark-800/50 rounded-2xl p-8 space-y-8">
                {/* Profile Section */}
                <div>
                  <h2 className="text-xl font-semibold flex items-center space-x-3 mb-4 text-dark-900 dark:text-white">
                    <User size={22} className="text-primary-500 dark:text-primary-400" />
                    <span>Profile</span>
                  </h2>
                  <div className="pl-9">
                    <p className="text-dark-600 dark:text-dark-300">You are logged in as:</p>
                    <p className="font-mono text-lg text-dark-900 dark:text-white bg-dark-200/50 dark:bg-dark-800/50 inline-block px-3 py-1 rounded-md mt-1">
                      {currentUser?.email}
                    </p>
                  </div>
                </div>

                {/* Change Password Section */}
                <div>
                  <h2 className="text-xl font-semibold flex items-center space-x-3 mb-4 text-dark-900 dark:text-white">
                    <KeyRound size={22} className="text-yellow-400" />
                    <span>Change Password</span>
                  </h2>
                  <form onSubmit={handleChangePassword} className="pl-9 space-y-4">
                    <div className="space-y-4 max-w-sm">
                      <Input
                        label="New Password"
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter your new password"
                        required
                        endIcon={
                          <span className="text-xs font-semibold uppercase tracking-wider">
                            {showPassword ? 'Hide' : 'Show'}
                          </span>
                        }
                        onEndIconClick={() => setShowPassword(!showPassword)}
                      />
                      <Input
                        label="Confirm New Password"
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm your new password"
                        required
                        endIcon={
                          <span className="text-xs font-semibold uppercase tracking-wider">
                            {showPassword ? 'Hide' : 'Show'}
                          </span>
                        }
                        onEndIconClick={() => setShowPassword(!showPassword)}
                      />
                    </div>
                    <Button
                      type="submit"
                      variant="primary"
                      className="!w-full max-w-sm !py-3 !text-base !rounded-full"
                    >
                      Save New Password
                    </Button>
                    {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
                    {success && (
                      <div className="flex items-center space-x-2 text-green-400 text-sm mt-2">
                        <ShieldCheck size={16} />
                        <span>{success}</span>
                      </div>
                    )}
                  </form>
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              {/* Sidebar Box */}
              <div className="bg-dark-100/30 dark:bg-dark-900/40 border border-dark-200/50 dark:border-dark-800/50 rounded-2xl p-8 space-y-8">
                {/* Actions Section */}
                <div>
                  <h2 className="text-xl font-semibold flex items-center space-x-3 mb-4 text-dark-900 dark:text-white">
                    <LogOut size={22} className="text-red-400" />
                    <span>Actions</span>
                  </h2>
                  <div className="pl-9 space-y-4">
                    <Button
                      onClick={handleLogout}
                      variant="secondary"
                      className="w-full !rounded-full flex items-center justify-between px-4 py-2 !text-red-500 dark:!text-red-400 bg-red-500/5 hover:!bg-red-500/10 border border-red-500/20 hover:border-red-500/30 dark:bg-dark-800/50 dark:!border-red-500/30 dark:hover:!bg-red-500/10 dark:hover:!border-red-500/50"
                    >
                      <span className="font-medium text-sm">Log Out</span>
                      <Kbd>{isMac ? '⌘' : 'Ctrl'}+Shift+L</Kbd>
                    </Button>
                    <p className="text-dark-500 dark:text-dark-400 text-sm">This will end your current session.</p>
                  </div>
                </div>

                {/* About Section */}
                <div>
                  <h2 className="text-xl font-semibold flex items-center space-x-3 mb-4 text-dark-900 dark:text-white">
                    <GitBranch size={22} className="text-gray-400" />
                    <span>About</span>
                  </h2>
                  <div className="pl-9">
                    <p className="text-dark-600 dark:text-dark-300">Current app version:</p>
                    <p className="font-mono text-lg text-dark-900 dark:text-white">
                      v{appVersion}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AccountPage;
