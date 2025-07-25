import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/Button';
import Logo from '../components/Logo';
import { useTheme } from '../contexts/ThemeContext';
import { MailCheck } from 'lucide-react';

const VerifyEmailPage: React.FC = () => {
  const { currentUser, sendVerificationEmail, logout } = useAuth();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { theme } = useTheme();
  const navigate = useNavigate();

  const [hasSent, setHasSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    // If the user's email becomes verified while they are on this page,
    // automatically redirect them to the dashboard.
    if (currentUser && currentUser.emailVerified) {
      navigate('/dashboard');
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  // This effect will run when the user clicks "Send" and will poll for verification.
  useEffect(() => {
    if (!hasSent || !currentUser) return;

    const interval = setInterval(async () => {
      console.log("Checking email verification status...");
      await currentUser.reload();
      // Log the full user object to inspect its properties
      console.log('Current User State:', currentUser);
      if (currentUser.emailVerified) {
        console.log("Email verified! Redirecting...");
        clearInterval(interval);
        navigate('/dashboard');
      }
    }, 2000); // Check every 2 seconds

    // Cleanup function to clear the interval when the component unmounts
    return () => clearInterval(interval);
  }, [hasSent, currentUser, navigate]);

  const handleSendVerification = async () => {
    if (cooldown > 0) return;

    setLoading(true);
    setMessage('');
    setError('');
    try {
      await sendVerificationEmail();
      setMessage('A verification email has been sent. Please check your inbox (and spam folder).');
      setHasSent(true);
      setCooldown(30); // Start 30-second cooldown
    } catch (err) {
      setError('Failed to send verification email. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUpAgain = async () => {
    try {
      await logout();
      navigate('/signup');
    } catch (err) {
      setError('Failed to log out. Please try again.');
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-dark-950 p-4 relative">


      <div className="w-full max-w-md mx-auto text-center bg-white dark:bg-dark-900 p-8 rounded-2xl shadow-lg border border-dark-200 dark:border-dark-700">
        <Logo size="md" className="justify-center mb-6" />

        <div className="flex justify-center items-center w-16 h-16 bg-blue-100 dark:bg-blue-900/50 rounded-full mx-auto mb-6">
          <MailCheck className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        </div>

        <h1 className="text-2xl font-bold text-dark-900 dark:text-white mb-4">Verify Your Email</h1>
        <p className="text-dark-600 dark:text-dark-300 mb-6">
          Thank you for signing up! Click the button below to send a verification link to{' '}
          <strong className="text-dark-800 dark:text-dark-100">{currentUser?.email}</strong>.
        </p>

        {message && <p className="text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 p-3 rounded-lg mb-4">{message}</p>}
        {error && <p className="text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 p-3 rounded-lg mb-4">{error}</p>}

        <Button
          onClick={handleSendVerification}
          disabled={loading || cooldown > 0}
          className="w-full mb-4 !rounded-full"
        >
          {loading
            ? 'Sending...'
            : hasSent
              ? `Resend Email ${cooldown > 0 ? `(${cooldown}s)` : ''}`
              : 'Send Verification Email'
          }
        </Button>

        <p className="text-sm text-dark-500 dark:text-dark-400">
          Wrong email?{' '}
          <button onClick={handleSignUpAgain} className="text-blue-600 hover:underline dark:text-blue-400">
            Sign up again
          </button>
        </p>

        <p className="mt-8 text-xs text-dark-400 dark:text-dark-500">
          Once verified, you can close this tab and log in.
        </p>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
