import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, CheckCircle, Link as LinkIcon, FileText, Sun, Moon } from 'lucide-react';
import { FaYoutube, FaTiktok, FaReddit, FaInstagram, FaTwitter } from 'react-icons/fa';
import Logo from '../components/Logo';
import Input from '../components/Input';
import Textarea from '../components/Textarea';
import Button from '../components/Button';
import Kbd from '../components/Kbd';
import { useTheme } from '../contexts/ThemeContext';
import { createEntry } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const SavePage: React.FC = () => {
  const [contentType, setContentType] = useState<'link' | 'text'>('link');
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { currentUser } = useAuth();

  useEffect(() => {
    document.title = 'thinkback.ai - Save';
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
    if (!currentUser) return;
    setSaved(false);

    try {
      const idToken = await currentUser.getIdToken();

      if (contentType === 'link' && url) {
        // For links: Run full enrichment pipeline
        console.log('Running enrichment pipeline for URL:', url);

        // Step 1: Call enrichment endpoint
        const enrichResponse = await fetch('http://localhost:8000/api/enrich-entry', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({ url, user_notes: notes }),
        });

        if (!enrichResponse.ok) {
          throw new Error('Failed to enrich entry');
        }

        const enrichResult = await enrichResponse.json();
        console.log('AI Enrichment Result:', enrichResult);
        const aiResult = enrichResult.ai;
        const thumbnail = enrichResult.thumbnail;

        // Step 2: Handle category assignment
        let categoryId = null;
        if (aiResult.category) {
          if (aiResult.category.id) {
            // AI returned an existing category ID
            categoryId = aiResult.category.id;
          } else if (aiResult.category.name) {
            // AI suggested a new category name, we need to create it
            try {
              const categoryResponse = await fetch('http://localhost:8000/api/categories', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${idToken}`,
                },
                body: JSON.stringify({ name: aiResult.category.name }),
              });

              if (categoryResponse.ok) {
                const newCategory = await categoryResponse.json();
                categoryId = newCategory.id;
              }
            } catch (categoryError) {
              console.error('Failed to create category:', categoryError);
              // Continue without category assignment
            }
          }
        }

        // Step 3: Save enriched entry to database
        const entryData = {
          url,
          notes,
          title: aiResult.title || '',
          tags: aiResult.tags || [],
          summary: aiResult.summary || '',
          category_ids: categoryId ? [categoryId] : [],
          ...(thumbnail ? { thumbnail } : {}),
        };

        await createEntry(idToken, entryData);
      } else {
        // For text: Save as basic entry
        const entryData = contentType === 'link'
          ? { url, notes }
          : { url: '', notes: text + (notes ? `\n${notes}` : '') };
        await createEntry(idToken, entryData);
      }

    setSaved(true);
      setUrl('');
      setText('');
      setNotes('');
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save entry: ' + (error as Error).message);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 relative overflow-hidden text-dark-900 dark:text-white">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/5 rounded-full blur-3xl animate-pulse-subtle"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl animate-pulse-subtle" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/3 rounded-full blur-3xl animate-pulse-subtle" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Header */}
      <div className="relative z-10 bg-white/80 dark:bg-dark-900/30 backdrop-blur-xl border-b border-dark-200/50 dark:border-dark-800/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Logo size="sm" />
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleTheme}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-dark-100/50 dark:bg-dark-800/50 hover:bg-dark-200/60 dark:hover:bg-dark-700/70 transition-colors duration-200"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun size={20} className="text-dark-900 dark:text-white" /> : <Moon size={20} className="text-dark-900 dark:text-white" />}
              </button>
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
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-dark-900 dark:text-white mb-2" style={{ textShadow: '0 0 35px rgba(14, 165, 233, 0.6)' }}>Save to Vault</h1>
          <p className="text-base sm:text-lg text-dark-500 dark:text-dark-400 mb-6">Add new content to your personal knowledge vault.</p>

          <form onSubmit={handleSubmit} className="bg-dark-100/30 dark:bg-dark-900/40 border border-dark-200/50 dark:border-dark-800/50 rounded-2xl p-6 sm:p-8 space-y-6">
            {/* Content Type Toggle */}
            <div className="flex bg-dark-200/50 dark:bg-dark-800/60 rounded-full p-1 border border-dark-300/60 dark:border-dark-700/60">
              <button
                type="button"
                onClick={() => setContentType('link')}
                className={`flex-1 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-full transition-all duration-300 transform hover:opacity-90 ${
                  contentType === 'link'
                    ? 'bg-primary-500 dark:bg-primary-600 shadow-md text-white'
                    : 'text-dark-600 dark:text-dark-300 hover:text-dark-900 dark:hover:text-white'
                }`}
              >
                <LinkIcon size={16} />
                <span className="font-medium text-sm">Link</span>
              </button>
              <button
                type="button"
                onClick={() => setContentType('text')}
                className={`flex-1 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-full transition-all duration-300 transform hover:opacity-90 ${
                  contentType === 'text'
                    ? 'bg-primary-500 dark:bg-primary-600 shadow-md text-white'
                    : 'text-dark-600 dark:text-dark-300 hover:text-dark-900 dark:hover:text-white'
                }`}
              >
                <FileText size={16} />
                <span className="font-medium text-sm">Text</span>
              </button>
            </div>

            {/* Content Input */}
            {contentType === 'link' ? (
              <div>
                <Input
                  label="Paste Link"
                  type="url"
                  placeholder="https://youtube.com/watch?v=... or https://reddit.com/r/..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                  className="w-full"
                />
              </div>
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
              size="lg"
              disabled={saved}
              className="w-full !py-3 !text-base"
              variant={saved ? 'secondary' : 'primary'}
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
            <div className="mt-6 p-4 bg-green-500/10 dark:bg-green-900/20 border border-green-500/20 dark:border-green-700/30 rounded-xl backdrop-blur-sm">
              <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
                <CheckCircle size={20} />
                <span className="font-medium">Successfully saved to your vault!</span>
              </div>
            </div>
          )}
        </div>

        {/* Quick Tips */}
        {contentType === 'link' && (
          <div className="mt-8 text-center">
            <p className="text-sm text-dark-500 dark:text-dark-400 font-medium mb-4">Supported platforms</p>
            <div className="flex justify-center items-center gap-x-4 gap-y-2 flex-wrap">
              {[
                { Icon: FaYoutube, name: 'YouTube' },
                { Icon: FaTiktok, name: 'TikTok' },
                { Icon: FaReddit, name: 'Reddit' },
                { Icon: FaInstagram, name: 'Instagram' },
                { Icon: FaTwitter, name: 'Twitter' },
              ].map(({ Icon, name }) => (
                <div
                  key={name}
                  className="group flex flex-col items-center gap-2 cursor-pointer"
                >
                  <div className="flex items-center justify-center w-12 h-12 bg-dark-100/50 dark:bg-dark-800/60 rounded-full border border-dark-200/80 dark:border-dark-700/60 group-hover:bg-dark-200/70 dark:group-hover:bg-dark-700/80 group-hover:border-dark-300 dark:group-hover:border-dark-600 transition-all duration-300">
                    <Icon className="w-6 h-6 text-dark-800 dark:text-white transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default SavePage;
