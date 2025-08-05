import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Logo from '../components/Logo';
import Button from '../components/Button';
import Input from '../components/Input';
import Textarea from '../components/Textarea';
import { ArrowLeft, Bug, Lightbulb, Send, CheckCircle } from 'lucide-react';
import Kbd from '../components/Kbd';
import { submitUserFeedback } from '../services/api';

interface FeedbackData {
  type: 'bug' | 'feature';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  userAgent?: string;
  url?: string;
}

const FeedbackPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [feedbackType, setFeedbackType] = useState<'bug' | 'feature'>('bug');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    document.title = 'thinkback - Feedback';
    setIsMac(/(Mac|iPhone|iPod|iPad)/i.test(navigator.platform));
    
    // Check for pending bug report from error fallback
    const pendingBugReport = localStorage.getItem('pendingBugReport');
    if (pendingBugReport) {
      try {
        const bugReport = JSON.parse(pendingBugReport);
        setFeedbackType('bug');
        setTitle(bugReport.title || 'Save Process Error');
        setDescription(bugReport.description || '');
        setPriority(bugReport.priority || 'high');
        
        // Clear the pending bug report
        localStorage.removeItem('pendingBugReport');
      } catch (error) {
        console.error('Failed to parse pending bug report:', error);
        localStorage.removeItem('pendingBugReport');
      }
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        navigate('/dashboard');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!title.trim() || !description.trim()) {
      setError('Please fill in all required fields.');
      setLoading(false);
      return;
    }

    try {
      const idToken = await currentUser?.getIdToken();
      if (!idToken) {
        throw new Error("Could not get user token.");
      }

      const feedbackData: FeedbackData = {
        type: feedbackType,
        title: title.trim(),
        description: description.trim(),
        priority,
        userAgent: navigator.userAgent,
        url: window.location.href
      };

      await submitUserFeedback(idToken, feedbackData);

      setSuccess(true);
      setTitle('');
      setDescription('');
      setPriority('medium');
      
      // Reset success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
        navigate('/dashboard');
      }, 3000);

    } catch (err) {
      const error = err as Error;
      setError(error.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const priorityOptions = [
    { value: 'low', label: 'Low', color: 'text-green-600' },
    { value: 'medium', label: 'Medium', color: 'text-yellow-600' },
    { value: 'high', label: 'High', color: 'text-red-600' }
  ];

  if (success) {
    return (
      <div className="min-h-screen bg-white dark:bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 flex items-center justify-center hide-scrollbar">
        <div className="max-w-md w-full mx-4 text-center">
          <div className="bg-white dark:bg-dark-900 rounded-lg p-8 border border-dark-200 dark:border-dark-700 shadow-lg">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-dark-900 dark:text-gray-100 mb-2">Thank You!</h2>
            <p className="text-dark-600 dark:text-gray-400 mb-4">
              Your {feedbackType === 'bug' ? 'bug report' : 'feature suggestion'} has been submitted successfully.
            </p>
            <p className="text-sm text-dark-500 dark:text-gray-500">
              Redirecting back to dashboard...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 hide-scrollbar">
      {/* Header */}
      <div className="border-b border-dark-200 dark:border-dark-800 bg-white/80 dark:bg-dark-900/30 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <Logo size="sm" />
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center justify-center px-3 py-2 rounded-full bg-dark-100/50 dark:bg-dark-800/50 hover:bg-dark-200/60 dark:hover:bg-dark-700/70 transition-colors duration-200 text-dark-800 dark:text-white"
            title="Back to Dashboard"
          >
            <ArrowLeft size={16} className="text-gray-600 dark:text-white mr-2" />
            <span className="text-sm font-medium">Back to Dashboard</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-dark-900 dark:text-gray-100 mb-2">Help Us Improve</h1>
          <p className="text-dark-600 dark:text-gray-400">
            Report bugs or suggest new features to make thinkback better for everyone.
          </p>
        </div>

        {/* Feedback Type Selection */}
        <div className="bg-white dark:bg-dark-900 rounded-lg p-6 mb-6 border border-dark-200 dark:border-dark-700 shadow-lg">
          <h2 className="text-lg font-semibold text-dark-900 dark:text-gray-100 mb-4">What would you like to share?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => setFeedbackType('bug')}
              className={`p-4 rounded-lg border-2 transition-all ${
                feedbackType === 'bug'
                  ? 'border-red-500 bg-red-500/10 text-red-600 dark:text-red-400'
                  : 'border-dark-300 dark:border-dark-700 bg-dark-50 dark:bg-dark-800 text-dark-700 dark:text-gray-400 hover:border-dark-400 dark:hover:border-dark-600 hover:text-dark-900 dark:hover:text-gray-300'
              }`}
            >
              <Bug className="w-8 h-8 mx-auto mb-2" />
              <div className="font-medium">Report a Bug</div>
              <div className="text-sm opacity-75">Something's not working right</div>
            </button>
            <button
              onClick={() => setFeedbackType('feature')}
              className={`p-4 rounded-lg border-2 transition-all ${
                feedbackType === 'feature'
                  ? 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400'
                  : 'border-dark-300 dark:border-dark-700 bg-dark-50 dark:bg-dark-800 text-dark-700 dark:text-gray-400 hover:border-dark-400 dark:hover:border-dark-600 hover:text-dark-900 dark:hover:text-gray-300'
              }`}
            >
              <Lightbulb className="w-8 h-8 mx-auto mb-2" />
              <div className="font-medium">Suggest a Feature</div>
              <div className="text-sm opacity-75">An idea to make thinkback better</div>
            </button>
          </div>
        </div>

        {/* Feedback Form */}
        <form onSubmit={handleSubmit} className="bg-white dark:bg-dark-900 rounded-lg p-6 border border-dark-200 dark:border-dark-700 shadow-lg">
          <div className="space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-dark-700 dark:text-gray-300 mb-2">
                {feedbackType === 'bug' ? 'Bug Title' : 'Feature Title'} *
              </label>
              <Input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={feedbackType === 'bug' ? 'Brief description of the issue' : 'Brief description of the feature'}
                className="w-full"
                maxLength={100}
              />
            </div>

            {/* Priority (only for bugs) */}
            {feedbackType === 'bug' && (
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-gray-300 mb-2">
                  Priority Level
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {priorityOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setPriority(option.value as 'low' | 'medium' | 'high')}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        priority === option.value
                          ? 'border-current bg-current/10'
                          : 'border-dark-300 dark:border-dark-700 bg-dark-50 dark:bg-dark-800 text-dark-700 dark:text-gray-400 hover:border-dark-400 dark:hover:border-dark-600 hover:text-dark-900 dark:hover:text-gray-300'
                      } ${option.color}`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-dark-700 dark:text-gray-300 mb-2">
                Detailed Description *
              </label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={
                  feedbackType === 'bug'
                    ? 'Please describe what happened, what you expected to happen, and steps to reproduce the issue...'
                    : 'Please describe your feature idea in detail, including how it would benefit users...'
                }
                className="w-full"
                rows={6}
                maxLength={1000}
              />
              <div className="text-xs text-dark-500 dark:text-gray-500 mt-1">
                {description.length}/1000 characters
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading || !title.trim() || !description.trim()}
              className="w-full"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </div>
              ) : (
                <div className="flex items-center">
                  <Send className="w-4 h-4 mr-2" />
                  Submit {feedbackType === 'bug' ? 'Bug Report' : 'Feature Suggestion'}
                </div>
              )}
            </Button>
          </div>
        </form>

        {/* Additional Info */}
        <div className="mt-6 text-center">
          <p className="text-sm text-dark-500 dark:text-gray-500">
            Your feedback helps us improve thinkback for everyone. We'll review your submission and get back to you if needed.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FeedbackPage; 