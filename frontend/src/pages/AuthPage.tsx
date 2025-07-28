import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import Input from '../components/Input';
import Button from '../components/Button';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { ArrowRight } from 'lucide-react';
import { verifyUserToken } from '../services/api';
import { mapFirebaseAuthError } from '../utils/errors';
import { loginQuotes } from '../data/quotes';
import GoogleIcon from '../components/GoogleIcon';
import GitHubIcon from '../components/GitHubIcon';

const AuthPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, signInWithGoogle, signInWithGitHub, getIdToken } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [quote, setQuote] = useState({ text: "", author: "" });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    document.title = 'thinkback - Login';
    const randomQuote =
      loginQuotes[Math.floor(Math.random() * loginQuotes.length)];
    setQuote(randomQuote);
  }, []);

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithGoogle();
      const idToken = await getIdToken();
      if (!idToken) throw new Error("Could not retrieve ID token from Google Sign-In.");
      await verifyUserToken(idToken);
      navigate('/dashboard');
    } catch (err) {
      const error = err as Error;
      console.error("Google Sign-in failed:", error);
      setError(mapFirebaseAuthError(error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleGitHubSignIn = async () => {
    try {
      await signInWithGitHub();
      navigate('/dashboard');
    } catch (error) {
      setError(mapFirebaseAuthError(error.code));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    setLoading(true);

    try {
      await login(email, password);
      const idToken = await getIdToken();
      if (!idToken) {
        throw new Error('Could not retrieve ID token.');
      }
      await verifyUserToken(idToken);
      navigate('/dashboard');
    } catch (err) {
      const error = err as Error;
      console.error("Login failed:", error);
      setError(mapFirebaseAuthError(error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white dark:bg-dark-950">

      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-dark-100/50 dark:bg-gradient-to-br from-dark-900 via-dark-950 to-dark-900 p-12 flex-col justify-center items-center relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/10 rounded-full blur-3xl animate-pulse-subtle"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse-subtle" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse-subtle" style={{ animationDelay: '2s' }}></div>
        </div>

        <div
          className={`absolute inset-0 bg-[url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2394a3b8' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")] dark:bg-[url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23334155' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")] opacity-50`}
        ></div>

        <div className="relative z-10 text-center max-w-md">
          <Logo size="lg" className="justify-center mb-8 animate-fade-in" />

          <h1 className="text-4xl font-bold text-dark-900 dark:text-white mb-6 animate-slide-up">
            Remember what matters.
          </h1>

          <p className="text-xl text-dark-600 dark:text-dark-300 leading-relaxed animate-slide-up">
            Your personal AI vault for capturing and rediscovering the content that inspires you.
          </p>

          <div className="mt-12 p-6 bg-white/30 dark:bg-dark-800/30 backdrop-blur-xl rounded-2xl border border-dark-200/30 dark:border-dark-700/30 animate-slide-up transform hover:scale-105 transition-all duration-500">
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
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary-500/5 rounded-full blur-2xl animate-pulse-subtle"></div>
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-500/5 rounded-full blur-2xl animate-pulse-subtle" style={{ animationDelay: '1.5s' }}></div>
        </div>

        <div className="w-full max-w-md relative z-10">
          <div className="lg:hidden mb-8 text-center">
            <Logo size="md" className="justify-center" />
          </div>

          <div className="text-center mb-8 animate-slide-up">
            <h2 className="text-3xl font-bold text-dark-900 dark:text-white mb-2">Welcome back</h2>
            <p className="text-dark-600 dark:text-dark-400">Sign in to your account</p>
          </div>

          {error && <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:bg-red-900/30 dark:border-red-700/50 dark:text-red-300 p-3 rounded-lg mb-6 text-center text-sm flex items-center justify-center space-x-2">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <Input
              label="Email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              endIcon={
                <span className="text-xs font-semibold uppercase tracking-wider cursor-pointer">
                  {showPassword ? 'HIDE' : 'VIEW'}
                </span>
              }
              onEndIconClick={() => setShowPassword(!showPassword)}
            />

            <Button type="submit" variant="login" className="w-full !rounded-full transform hover:scale-105 transition-all duration-200" size="lg" disabled={loading}>
              {loading ? 'Logging In...' : 'Log In'}
            </Button>
          </form>

          <div className="relative flex py-8 items-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="flex-grow border-t border-gray-600"></div>
            <span className="flex-shrink mx-4 text-gray-400">OR</span>
            <div className="flex-grow border-t border-gray-600"></div>
          </div>

          <div className="flex flex-col gap-y-3 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <button
              onClick={handleGoogleSignIn}
              className="w-full flex justify-center items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-white/5 dark:hover:bg-white/10 dark:text-white font-bold py-2 px-4 rounded-full focus:outline-none focus:shadow-outline transition-colors duration-200"
            >
              <GoogleIcon />
              Log in with Google
            </button>
            <button
              onClick={handleGitHubSignIn}
              className="w-full flex justify-center items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-white/5 dark:hover:bg-white/10 dark:text-white font-bold py-2 px-4 rounded-full focus:outline-none focus:shadow-outline transition-colors duration-200"
            >
              <GitHubIcon />
              Log in with GitHub
            </button>
          </div>

          <div className="mt-8 text-center animate-slide-up" style={{ animationDelay: '0.4s' }}>
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
