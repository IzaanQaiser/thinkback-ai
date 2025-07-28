import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Logo from '../components/Logo';
import Button from '../components/Button';
import { User, LogOut, GitBranch, ArrowLeft, KeyRound, ShieldCheck, Trash2 } from 'lucide-react';
import Input from '../components/Input';
import { changePassword } from '../services/api';
import Kbd from '../components/Kbd';
import { useTheme } from '../contexts/ThemeContext';
import DeleteAccountModal from '../components/DeleteAccountModal';
import { mapFirebaseAuthError } from '../utils/errors';
import GoogleIcon from '../components/GoogleIcon';
import GitHubIcon from '../components/GitHubIcon';

const AccountPage: React.FC = () => {
  const { currentUser, logout, deleteAccount } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isMac, setIsMac] = useState(false);

  const providerId = currentUser?.providerData[0]?.providerId || 'password';

  useEffect(() => {
    document.title = 'thinkback - Account';
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
      console.error("Failed to log out", error);
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

    setLoading(true);
    try {
      const idToken = await currentUser?.getIdToken();
      if (!idToken) {
        throw new Error("Could not get user token.");
      }
      const response = await changePassword(idToken, newPassword);
      setSuccess(response.message);
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async (password: string) => {
    setDeleteError(null);
    setLoading(true);
    try {
      await deleteAccount(password);
      setIsDeleteModalOpen(false);
      navigate('/auth');
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'code' in err) {
        setDeleteError(mapFirebaseAuthError((err as {code: string}).code));
      } else if (err instanceof Error) {
        setDeleteError(err.message);
      } else {
        setDeleteError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Get version from package.json - Vite exposes this via import.meta.env
  const appVersion = import.meta.env.VITE_APP_VERSION || '0.1.0';

  return (
    <>
    <div className="min-h-screen bg-white dark:bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 text-dark-900 dark:text-white">
      {/* Header */}
        <div className="sticky top-0 z-30 bg-white/80 dark:bg-dark-900/30 backdrop-blur-xl border-b border-dark-200/50 dark:border-dark-800/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Logo size="sm" />
            <div className="flex items-center space-x-2">
              <Link to="/dashboard" className="flex items-center space-x-2 sm:space-x-3 px-4 py-2 rounded-full bg-dark-100/50 dark:bg-dark-800/50 hover:bg-dark-200/60 dark:hover:bg-dark-700/70 transition-colors duration-200 text-dark-800 dark:text-white">
                <ArrowLeft size={16} className="sm:hidden" />
                <span className="font-medium text-sm hidden sm:inline">Back to Vault</span>
                <Kbd className="hidden sm:block">esc</Kbd>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-10 sm:py-12">
        <div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2 text-dark-900 dark:text-white" style={{ textShadow: '0 0 35px rgba(14, 165, 233, 0.6)' }}>Account Settings</h1>
          <p className="text-base sm:text-lg text-dark-500 dark:text-dark-400 mb-8 sm:mb-10">Manage your account details and application settings.</p>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            <div className="lg:col-span-2">
              {/* Main Settings Box */}
              <div className="bg-dark-100/30 dark:bg-dark-900/40 border border-dark-200/50 dark:border-dark-800/50 rounded-2xl p-6 sm:p-8 space-y-8">
                {/* Profile Section */}
                <div>
                  <h2 className="text-xl font-semibold flex items-center space-x-3 mb-4 text-dark-900 dark:text-white">
                    <User size={22} className="text-primary-500 dark:text-primary-400" />
                    <span>Profile</span>
                  </h2>
                  <div className="pl-0 sm:pl-9">
                    <p className="text-dark-600 dark:text-dark-300">You are logged in as:</p>
                    <p className="font-mono text-base sm:text-lg text-dark-900 dark:text-white bg-dark-200/50 dark:bg-dark-800/50 inline-block px-3 py-1 rounded-md mt-1 break-all">
                      {currentUser?.email}
                    </p>
                      {providerId !== 'password' && (
                        <div className="flex items-center gap-2 mt-3 text-sm text-dark-500 dark:text-dark-400">
                          {providerId === 'google.com' && <GoogleIcon className="w-4 h-4" />}
                          {providerId === 'github.com' && <GitHubIcon className="w-4 h-4" />}
                          <span>
                            Signed in with {providerId === 'google.com' ? 'Google' : 'GitHub'}
                          </span>
                        </div>
                      )}
                  </div>
                </div>

                {/* Change Password Section */}
                  {providerId === 'password' && (
                <div>
                  <h2 className="text-xl font-semibold flex items-center space-x-3 mb-4 text-dark-900 dark:text-white">
                        <KeyRound size={22} className="text-primary-500 dark:text-primary-400" />
                    <span>Change Password</span>
                  </h2>
                  <form onSubmit={handleChangePassword} className="pl-0 sm:pl-9 space-y-4">
                    <div className="space-y-4 max-w-sm">
                      <Input
                        label="New Password"
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="New password"
                        required
                        endIcon={
                          <span className="text-xs font-semibold uppercase tracking-wider">
                            {showPassword ? 'Hide' : 'Show'}
                          </span>
                        }
                        onEndIconClick={() => setShowPassword(!showPassword)}
                      />
                      <Input
                        label="Confirm Password"
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm New password"
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
                          disabled={loading}
                    >
                          {loading ? 'Saving...' : 'Save New Password'}
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
                  )}
              </div>
            </div>

            <div className="lg:col-span-1">
              {/* Sidebar Box */}
              <div className="bg-dark-100/30 dark:bg-dark-900/40 border border-dark-200/50 dark:border-dark-800/50 rounded-2xl p-6 sm:p-8 space-y-8">
                {/* Actions Section */}
                <div>
                  <h2 className="text-xl font-semibold flex items-center space-x-3 mb-4 text-dark-900 dark:text-white">
                    <LogOut size={22} className="text-red-400" />
                    <span>Log Out</span>
                  </h2>
                  <div className="pl-0 sm:pl-9 space-y-4">
                    <div className="flex items-center justify-between">
                      <Button
                        onClick={handleLogout}
                        variant="secondary"
                        className="!text-red-500 dark:!text-red-400 bg-red-500/5 hover:!bg-red-500/10 border border-red-500/20 hover:border-red-500/30 dark:bg-dark-800/50 dark:!border-red-500/30 dark:hover:!bg-red-500/10 dark:hover:!border-red-500/50"
                      >
                        <span className="font-medium text-sm">Log Out</span>
                      </Button>
                       <Kbd className="hidden sm:block">{isMac ? '⌘' : 'Ctrl'}+Shift+L</Kbd>
                    </div>
                    <p className="text-dark-500 dark:text-dark-400 text-sm">This will end your current session.</p>
                  </div>
                </div>

                  {/* Danger Zone Section */}
                  <div>
                    <h2 className="text-xl font-semibold flex items-center space-x-3 mb-4 text-dark-900 dark:text-white">
                      <Trash2 size={22} className="text-red-400" />
                      <span>Delete Account</span>
                    </h2>
                    <div className="pl-0 sm:pl-9 space-y-4">
                       <Button
                          onClick={() => setIsDeleteModalOpen(true)}
                          variant="secondary"
                          className="!text-red-500 dark:!text-red-400 bg-red-500/5 hover:!bg-red-500/10 border border-red-500/20 hover:border-red-500/30 dark:bg-dark-800/50 dark:!border-red-500/30 dark:hover:!bg-red-500/10 dark:hover:!border-red-500/50"
                        >
                          <span className="font-medium text-sm">Delete Account</span>
                        </Button>
                      <p className="text-dark-500 dark:text-dark-400 text-sm">Permanently delete your account and all associated data. This action cannot be undone.</p>
                    </div>
                  </div>

                {/* About Section */}
                <div>
                  <h2 className="text-xl font-semibold flex items-center space-x-3 mb-4 text-dark-900 dark:text-white">
                    <GitBranch size={22} className="text-gray-400" />
                    <span>About</span>
                  </h2>
                  <div className="pl-0 sm:pl-9">
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

      <DeleteAccountModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        error={deleteError}
        loading={loading}
        providerId={providerId}
      />
    </>
  );
};

export default AccountPage;
