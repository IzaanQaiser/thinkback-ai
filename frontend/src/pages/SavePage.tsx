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
  const [url, setUrl] = useState('');
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
      if (url) {
        // Enrichment pipeline for URL
        const enrichResponse = await fetch('http://localhost:8000/api/enrich-entry', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({ url, user_notes: notes }),
        });
        if (!enrichResponse.ok) throw new Error('Failed to enrich entry');
        const enrichResult = await enrichResponse.json();
        const aiResult = enrichResult.ai;
        const thumbnail = enrichResult.thumbnail;
        let categoryId = null;
        if (aiResult.category) {
          if (aiResult.category.id) {
            categoryId = aiResult.category.id;
          } else if (aiResult.category.name) {
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
            } catch {}
          }
        }
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
      }
      setSaved(true);
      setUrl('');
      setNotes('');
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      alert('Failed to save entry: ' + (error as Error).message);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 text-dark-900 dark:text-white">
      {/* Sticky Header/Navbar */}
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-dark-900/30 backdrop-blur-xl border-b border-dark-200/50 dark:border-dark-800/50">
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
      {/* Main Content - Centered Card */}
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-2 py-8">
        <div className="relative w-full max-w-lg mx-auto">
          <div className="bg-white/90 dark:bg-dark-900/80 shadow-2xl rounded-3xl px-8 py-10 sm:px-12 sm:py-14 border border-dark-200/50 dark:border-dark-800/50 flex flex-col items-center">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-center mb-2" style={{ textShadow: '0 0 35px rgba(14, 165, 233, 0.6)' }}>Save to Vault</h1>
            <p className="text-lg text-dark-500 dark:text-dark-400 text-center mb-8">Add new content to your personal knowledge vault.</p>
            <form onSubmit={handleSubmit} className="w-full flex flex-col gap-6">
              <Input
                label="Paste Link"
                type="url"
                placeholder="https://youtube.com/watch?v=... or https://reddit.com/r/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
                className="w-full"
              />
              <Textarea
                label="Personal Notes (Optional)"
                placeholder="Add your thoughts, tags, or context..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="w-full"
              />
              <Button type="submit" className="w-full py-3 text-lg rounded-full font-semibold flex items-center justify-center gap-2">
                <Save size={20} />
                {saved ? (
                  <span className="flex items-center gap-2 text-green-500"><CheckCircle size={18} /> Saved!</span>
                ) : (
                  'Save to Vault'
                )}
              </Button>
            </form>
            {/* Supported Platforms */}
            <div className="mt-10 flex flex-col items-center w-full">
              <div className="text-sm text-dark-400 dark:text-dark-500 mb-2">Supported platforms</div>
              <div className="flex items-center justify-center gap-6 text-2xl text-dark-400 dark:text-dark-500">
                <FaYoutube />
                <FaTiktok />
                <FaReddit />
                <FaInstagram />
                <FaTwitter />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SavePage;
