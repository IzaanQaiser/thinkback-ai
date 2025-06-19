import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Save, CheckCircle, Link as LinkIcon, FileText } from 'lucide-react';
import Logo from '../components/Logo';
import Input from '../components/Input';
import Textarea from '../components/Textarea';
import Button from '../components/Button';
import Card from '../components/Card';

const SavePage: React.FC = () => {
  const [contentType, setContentType] = useState<'link' | 'text'>('link');
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock save - in real app, this would be API call
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setUrl('');
      setText('');
      setNotes('');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/5 rounded-full blur-3xl animate-pulse-subtle"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl animate-pulse-subtle" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/3 rounded-full blur-3xl animate-pulse-subtle" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Header */}
      <div className="relative z-10 bg-dark-900/30 backdrop-blur-xl border-b border-dark-800/50">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                to="/dashboard"
                className="p-2 hover:bg-dark-800/50 rounded-lg transition-all duration-200 transform hover:scale-110"
              >
                <ArrowLeft size={20} className="text-dark-400" />
              </Link>
              <Logo size="sm" />
            </div>
            <Link
              to="/dashboard"
              className="text-sm text-dark-400 hover:text-dark-200 transition-colors duration-200 hover:underline"
            >
              View Vault
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-2xl mx-auto px-6 py-12">
        <div className="text-center mb-8 animate-slide-up">
          <h1 className="text-3xl font-bold text-white mb-3">Save to Vault</h1>
          <p className="text-dark-400">Capture content that matters to you</p>
        </div>

        <Card className="p-8 animate-slide-up transform hover:scale-[1.01] transition-all duration-300" style={{ animationDelay: '0.2s' }}>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Content Type Toggle */}
            <div className="flex bg-dark-800/30 rounded-xl p-1 border border-dark-700/30 backdrop-blur-sm">
              <button
                type="button"
                onClick={() => setContentType('link')}
                className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 ${
                  contentType === 'link'
                    ? 'bg-primary-600 shadow-lg text-white'
                    : 'text-dark-400 hover:text-dark-200'
                }`}
              >
                <LinkIcon size={18} />
                <span className="font-medium">Link</span>
              </button>
              <button
                type="button"
                onClick={() => setContentType('text')}
                className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 ${
                  contentType === 'text'
                    ? 'bg-primary-600 shadow-lg text-white'
                    : 'text-dark-400 hover:text-dark-200'
                }`}
              >
                <FileText size={18} />
                <span className="font-medium">Text</span>
              </button>
            </div>

            {/* Content Input */}
            {contentType === 'link' ? (
              <Input
                label="Paste Link"
                type="url"
                placeholder="https://youtube.com/watch?v=... or https://reddit.com/r/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
              />
            ) : (
              <Textarea
                label="Your Content"
                placeholder="Paste or type your content here..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={6}
                required
              />
            )}

            {/* Notes */}
            <Textarea
              label="Personal Notes (Optional)"
              placeholder="Add your thoughts, tags, or context..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full flex items-center justify-center space-x-2 transform hover:scale-105 transition-all duration-200"
              size="lg"
              disabled={saved}
            >
              {saved ? (
                <>
                  <CheckCircle size={20} />
                  <span>Saved to Vault!</span>
                </>
              ) : (
                <>
                  <Save size={20} />
                  <span>Save to Vault</span>
                </>
              )}
            </Button>
          </form>

          {/* Success Message */}
          {saved && (
            <div className="mt-6 p-4 bg-green-900/20 border border-green-700/30 rounded-xl animate-slide-up backdrop-blur-sm">
              <div className="flex items-center space-x-2 text-green-400">
                <CheckCircle size={20} />
                <span className="font-medium">Successfully saved to your vault!</span>
              </div>
            </div>
          )}
        </Card>

        {/* Quick Tips */}
        <div className="mt-8 text-center animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <p className="text-sm text-dark-500 mb-2">Supported platforms</p>
          <div className="flex justify-center space-x-4 text-xs text-dark-600">
            <span className="hover:text-dark-400 transition-colors duration-200">YouTube</span>
            <span>•</span>
            <span className="hover:text-dark-400 transition-colors duration-200">TikTok</span>
            <span>•</span>
            <span className="hover:text-dark-400 transition-colors duration-200">Reddit</span>
            <span>•</span>
            <span className="hover:text-dark-400 transition-colors duration-200">Instagram</span>
            <span>•</span>
            <span className="hover:text-dark-400 transition-colors duration-200">Twitter</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SavePage;
