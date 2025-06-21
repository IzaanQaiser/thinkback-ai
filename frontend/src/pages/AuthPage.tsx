import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import Input from '../components/Input';
import Button from '../components/Button';
import { useAuth } from '../contexts/AuthContext';
import { verifyUserToken } from '../services/api';

const AuthPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, getIdToken } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Sign in user with Firebase Auth
      await login(email, password);

      // 2. Get ID token
      const idToken = await getIdToken();
      if (!idToken) {
        throw new Error('Could not retrieve ID token.');
      }

      // 3. Verify token with backend
      const backendResponse = await verifyUserToken(idToken);
      console.log('Backend verification successful:', backendResponse);

      navigate('/dashboard');

    } catch (err: any) {
      console.error("Login failed:", err);
      setError(err.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-dark-900 via-dark-950 to-dark-900 p-12 flex-col justify-center items-center relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/10 rounded-full blur-3xl animate-pulse-subtle"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse-subtle" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse-subtle" style={{ animationDelay: '2s' }}></div>
        </div>

        <div
          className={`absolute inset-0 bg-[url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23334155' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")] opacity-50`}
        ></div>

        <div className="relative z-10 text-center max-w-md">
          <Logo size="lg" className="justify-center mb-8 animate-fade-in" />

          <h1 className="text-4xl font-bold text-white mb-6 animate-slide-up">
            Remember what matters.
          </h1>

          <p className="text-xl text-dark-300 leading-relaxed animate-slide-up">
            Your personal AI vault for capturing and rediscovering the content that inspires you.
          </p>

          <div className="mt-12 p-6 bg-dark-800/30 backdrop-blur-xl rounded-2xl border border-dark-700/30 animate-slide-up transform hover:scale-105 transition-all duration-500">
            <p className="text-dark-200 italic">
              "The best way to find out if you can trust somebody is to trust them."
            </p>
            <p className="text-sm text-dark-400 mt-2">— Ernest Hemingway</p>
          </div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary-500/5 rounded-full blur-2xl animate-pulse-subtle"></div>
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-500/5 rounded-full blur-2xl animate-pulse-subtle" style={{ animationDelay: '1.5s' }}></div>
        </div>

        <div className="w-full max-w-md relative z-10">
          <div className="lg:hidden mb-8 text-center">
            <Logo size="md" className="justify-center" />
          </div>

          <div className="text-center mb-8 animate-slide-up">
            <h2 className="text-3xl font-bold text-white mb-2">Welcome back</h2>
            <p className="text-dark-400">Sign in to your account</p>
          </div>

          {error && <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-3 rounded-md mb-4 text-center animate-fade-in">{error}</div>}

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
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button type="submit" className="w-full transform hover:scale-105 transition-all duration-200" size="lg" disabled={loading}>
              {loading ? 'Logging In...' : 'Log In'}
            </Button>
          </form>

          <div className="mt-8 text-center animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <p className="text-dark-400">
              Don't have an account?{' '}
              <Link
                to="/signup"
                className="text-primary-400 hover:text-primary-300 font-medium transition-colors duration-200 hover:underline"
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
