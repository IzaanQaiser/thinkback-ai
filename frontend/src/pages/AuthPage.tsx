import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { verifyUserToken } from '../services/api';
import { mapFirebaseAuthError } from '../utils/errors';
import { loginQuotes } from '../data/quotes';
import GoogleIcon from '../components/GoogleIcon';
import { Check, ExternalLink } from 'lucide-react';

const AuthPage: React.FC = () => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [agreementsAccepted, setAgreementsAccepted] = useState(false);
  const { signInWithGoogle, getIdToken } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [quote, setQuote] = useState({ text: "", author: "" });

  useEffect(() => {
    document.title = 'thinkback - Login';
    const randomQuote =
      loginQuotes[Math.floor(Math.random() * loginQuotes.length)];
    setQuote(randomQuote);
  }, []);

  const handleGoogleSignIn = async () => {
    setError('');
    
    // Check if agreements are accepted
    if (!agreementsAccepted) {
      setError('Please accept the Privacy Policy and Terms of Service to continue.');
      return;
    }
    
    setLoading(true);
    try {
      await signInWithGoogle();
      // Don't navigate here - the redirect will handle the flow
      // The AuthContext will handle the redirect result and onAuthStateChanged will trigger navigation
    } catch (err) {
      const error = err as Error;
      console.error("Google Sign-in failed:", error);
      setError(mapFirebaseAuthError(error.message));
      setLoading(false);
    }
  };



  return (
    <div className="min-h-screen flex bg-white dark:bg-dark-950">

      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-dark-100/50 dark:bg-gradient-to-br from-dark-900 via-dark-950 to-dark-900 p-12 flex-col justify-center items-center relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
        </div>

        <div
          className={`absolute inset-0 bg-[url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2394a3b8' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")] dark:bg-[url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23334155' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")] opacity-50`}
        ></div>

        <div className="relative z-10 text-center max-w-md">
          <Logo size="lg" className="justify-center mb-8" />

          <h1 className="text-4xl font-bold text-dark-900 dark:text-white mb-6">
            Remember what matters.
          </h1>

          <p className="text-xl text-dark-600 dark:text-dark-300 leading-relaxed">
            Your personal AI vault for capturing and rediscovering the content that inspires you.
          </p>

          <div className="mt-12 p-6 bg-white/30 dark:bg-dark-800/30 backdrop-blur-xl rounded-2xl border border-dark-200/30 dark:border-dark-700/30 transform hover:scale-105 transition-all duration-500">
            <p className="text-dark-700 dark:text-dark-200 italic">
              &ldquo;{quote.text}&rdquo;
            </p>
            <p className="text-sm text-dark-500 dark:text-dark-400 mt-2">&mdash; {quote.author}</p>
          </div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white dark:bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary-500/5 rounded-full blur-2xl"></div>
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-500/5 rounded-full blur-2xl"></div>
        </div>

        <div className="w-full max-w-md relative z-10">
          <div className="lg:hidden mb-8 text-center">
            <Logo size="md" className="justify-center" />
          </div>

          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-dark-900 dark:text-white mb-2">Welcome back</h2>
            <p className="text-dark-600 dark:text-dark-400">Sign in to your account</p>
          </div>

          {error && <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:bg-red-900/30 dark:border-red-700/50 dark:text-red-300 p-3 rounded-lg mb-6 text-center text-sm flex items-center justify-center space-x-2">{error}</div>}

          {/* Combined Privacy Policy and Terms Checkbox */}
          <div className="mb-6 flex justify-center">
            <div className="flex items-start gap-3 max-w-sm">
              <button
                onClick={() => setAgreementsAccepted(!agreementsAccepted)}
                className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                  agreementsAccepted
                    ? 'bg-primary-500 border-primary-500'
                    : 'border-dark-300 dark:border-dark-600 hover:border-primary-400'
                }`}
              >
                {agreementsAccepted && <Check size={12} className="text-white" />}
              </button>
              <div className="flex-1 text-sm text-dark-600 dark:text-dark-400">
                <span>I have read and agree to the </span>
                <Link
                  to="/privacy"
                  state={{ from: '/auth' }}
                  className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium inline-flex items-center gap-1"
                >
                  Privacy Policy
                  <ExternalLink size={12} />
                </Link>
                <span> and </span>
                <Link
                  to="/terms"
                  state={{ from: '/auth' }}
                  className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium inline-flex items-center gap-1"
                >
                  Terms of Service
                  <ExternalLink size={12} />
                </Link>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-y-3">
            <button
              onClick={handleGoogleSignIn}
              className="w-full flex justify-center items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-white/5 dark:hover:bg-white/10 dark:text-white font-bold py-3 px-4 rounded-full focus:outline-none focus:shadow-outline transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading || !agreementsAccepted}
            >
              <GoogleIcon />
              {loading ? 'Signing In...' : 'Sign in with Google'}
            </button>
          </div>

          <div className="mt-8 text-center">
            <p className="text-dark-600 dark:text-dark-400">
              Don't have an account?{' '}
              <Link
                to="/signup"
                className="font-medium text-primary-600 dark:text-primary-400 px-3 py-1 border-2 border-transparent rounded-lg hover:border-primary-400/50 transition-colors duration-300"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
};

export default AuthPage;
