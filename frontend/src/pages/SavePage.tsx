import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, CheckCircle, Link as LinkIcon, FileText, Sun, Moon, Loader2 } from 'lucide-react';
import { FaYoutube, FaTiktok, FaReddit, FaInstagram, FaTwitter } from 'react-icons/fa';
import Logo from '../components/Logo';
import Input from '../components/Input';
import Textarea from '../components/Textarea';
import Button from '../components/Button';
import Kbd from '../components/Kbd';
import { useTheme } from '../contexts/ThemeContext';
import { createEntry, fetchEntry, fetchCategories } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

type SaveStepStatus = 'pending' | 'in_progress' | 'done';

const SAVE_STEPS = [
  'Authentication',
  'Platform Detection',
  'Scraping',
  'AI Pipeline',
  'Classification',
  'Save to Database',
  'Save Process',
];

interface SaveProgressDisplayProps {
  stepStatuses: SaveStepStatus[];
  currentStep: number;
}

const SaveProgressDisplay: React.FC<SaveProgressDisplayProps> = ({ stepStatuses, currentStep }) => {
  // Animated dots for in-progress
  const [dots, setDots] = React.useState('.');
  React.useEffect(() => {
    if (stepStatuses[currentStep] !== 'in_progress') return;
    const interval = setInterval(() => {
      setDots((prev) => (prev.length === 3 ? '.' : prev + '.'));
    }, 400);
    return () => clearInterval(interval);
  }, [stepStatuses, currentStep]);

  return (
    <div className="w-full max-w-lg mx-auto mb-8 bg-white/80 dark:bg-dark-900/70 rounded-2xl shadow p-6 border border-dark-200/40 dark:border-dark-800/40">
      <h2
        className="text-2xl sm:text-3xl font-extrabold text-center mb-2"
        style={{ textShadow: '0 0 35px rgba(14, 165, 233, 0.6)' }}
      >
        Save Progress
      </h2>
      <ol className="space-y-3">
        {SAVE_STEPS.map((step, idx) => {
          const status = stepStatuses[idx];
          return (
            <li key={step} className="flex items-center gap-3 text-base relative">
              <span className="w-6 h-6 flex items-center justify-center relative">
                {status === 'pending' && <Loader2 size={20} className="animate-spin text-primary-500" />}
                {status === 'in_progress' && (
                  <>
                    <Loader2 size={20} className="invisible" />
                    <span className="absolute inset-0 flex items-center justify-center text-primary-500 font-bold font-mono text-lg">{dots}</span>
                  </>
                )}
                {status === 'done' && <CheckCircle size={20} className="text-green-500" />}
              </span>
              <span className={
                status === 'done'
                  ? 'text-green-600 dark:text-green-400'
                  : status === 'in_progress'
                  ? 'text-primary-600 dark:text-primary-400 font-semibold'
                  : 'text-dark-700 dark:text-dark-300'
              }>{step}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
};

const SavePage: React.FC = () => {
  const [url, setUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { currentUser } = useAuth();
  const [stepStatuses, setStepStatuses] = useState<SaveStepStatus[]>(Array(SAVE_STEPS.length).fill('pending'));
  const [currentStep, setCurrentStep] = useState(0);
  const [showProgress, setShowProgress] = useState(false);
  const urlInputRef = useRef<HTMLInputElement>(null);
  const [lastSavedEntry, setLastSavedEntry] = useState<{ title?: string; category?: string; platform?: string; tags?: string[] } | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [categoryMap, setCategoryMap] = useState<{ [id: string]: string }>({});

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

  useEffect(() => {
    if (urlInputRef.current && !showProgress) {
      urlInputRef.current.focus();
      urlInputRef.current.select();
    }
  }, [showProgress]);

  // Helper to advance steps
  const markStep = (idx: number, status: SaveStepStatus) => {
    setStepStatuses((prev) => {
      const next = [...prev];
      next[idx] = status;
      return next;
    });
    setCurrentStep(idx);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowProgress(true);
    setStepStatuses(Array(SAVE_STEPS.length).fill('pending'));
    setCurrentStep(0);
    // 1. Authentication
    markStep(0, 'in_progress');
    if (!currentUser) return;
    setSaved(false);
    setLastSavedEntry(null);
    try {
      const idToken = await currentUser.getIdToken();
      markStep(0, 'done');
      markStep(1, 'in_progress');
      // 2. Platform Detection
      const enrichPromise = fetch('http://localhost:8000/api/enrich-entry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ url, user_notes: notes }),
      });
      markStep(1, 'done');
      markStep(2, 'in_progress');
      const enrichResponse = await enrichPromise;
      markStep(2, 'done');
      markStep(3, 'in_progress');
      // 3. AI Pipeline (enrichment)
      if (!enrichResponse.ok) throw new Error('Failed to enrich entry');
      const enrichResult = await enrichResponse.json();
      markStep(3, 'done');
      markStep(4, 'in_progress');
      // 4. Classification (category assignment)
      let categoryId = null;
      let didCategory = false;
      let categoryName = '';
      if (enrichResult.ai.category) {
        if (enrichResult.ai.category.id) {
          categoryId = enrichResult.ai.category.id;
          categoryName = enrichResult.ai.category.name || '';
        } else if (enrichResult.ai.category.name) {
          didCategory = true;
          categoryName = enrichResult.ai.category.name;
          const categoryResponse = await fetch('http://localhost:8000/api/categories', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${idToken}`,
            },
            body: JSON.stringify({ name: enrichResult.ai.category.name }),
          });
          if (categoryResponse.ok) {
            const newCategory = await categoryResponse.json();
            categoryId = newCategory.id;
          }
        }
      }
      markStep(4, 'done');
      markStep(5, 'in_progress');
      // 5. Save to Database
      const entryData = {
        url,
        notes,
        title: enrichResult.ai.title || '',
        tags: enrichResult.ai.tags || [],
        summary: enrichResult.ai.summary || '',
        category_ids: categoryId ? [categoryId] : [],
        ...(enrichResult.thumbnail ? { thumbnail: enrichResult.thumbnail } : {}),
      };
      const savedEntry = await createEntry(idToken, entryData);
      // Fetch the actual saved entry for accurate info
      let entryForSummary = savedEntry;
      if (!savedEntry.title || !savedEntry.category || !savedEntry.tags) {
        entryForSummary = await fetchEntry(idToken, savedEntry.id);
      }
      // Fetch categories and build categoryMap
      const cats = await fetchCategories(idToken);
      setCategories(cats);
      const map: { [id: string]: string } = {};
      cats.forEach((cat: any) => { map[cat.id] = cat.name; });
      setCategoryMap(map);
      // Resolve category name using category_ids
      let summaryCategory = 'Uncategorized';
      if (entryForSummary.category_ids && entryForSummary.category_ids.length > 0) {
        const catId = entryForSummary.category_ids[0];
        summaryCategory = map[catId] || 'Uncategorized';
      }
      markStep(5, 'done');
      markStep(6, 'in_progress');
      // 6. Save Process
      setSaved(true);
      setLastSavedEntry({
        title: entryForSummary.title,
        category: summaryCategory,
        platform: entryForSummary.platform,
        tags: entryForSummary.tags,
      });
      setUrl('');
      setNotes('');
      markStep(6, 'done');
    } catch (error) {
      console.error('[Save] Error:', error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 text-dark-900 dark:text-white">
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
      {/* Main Content - Centered and Balanced */}
      <div className="flex-1 flex items-start justify-center px-4 py-8">
        <div className="flex flex-col lg:flex-row items-start justify-center gap-10 w-full max-w-5xl">
          {/* Save to Vault Form */}
          <div className="w-full max-w-md bg-white/90 dark:bg-dark-900/80 shadow-2xl rounded-3xl px-8 py-10 border border-dark-200/50 dark:border-dark-800/50 flex flex-col items-center">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-center mb-2" style={{ textShadow: '0 0 35px rgba(14, 165, 233, 0.6)' }}>Save to Vault</h1>
            <p className="text-lg text-dark-500 dark:text-dark-400 text-center mb-8">Add new content to your personal knowledge vault.</p>
            <form onSubmit={handleSubmit} className="w-full flex flex-col gap-6" autoComplete="off">
              <Input
                label="Paste Link"
                type="url"
                placeholder="https://youtube.com/watch?v=... or https://reddit.com/r/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
                className="w-full"
                disabled={showProgress}
                ref={urlInputRef}
              />
              <Textarea
                label="Personal Notes (Optional)"
                placeholder="Add your thoughts, tags, or context..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="w-full"
                disabled={showProgress}
              />
              <Button type="submit" className="w-full py-3 text-lg rounded-full font-semibold flex items-center justify-center gap-2" disabled={showProgress}>
                <Save size={20} />
                Save to Vault
              </Button>
            </form>
            {/* Supported Platforms */}
            <div className="mt-10 flex flex-col items-center w-full">
              <div className="text-sm text-dark-400 dark:text-dark-500 mb-2 tracking-wider uppercase">Supported Platforms</div>
              <div className="flex items-center justify-center gap-6 text-2xl text-dark-400 dark:text-dark-500 mt-4">
                <FaYoutube />
                <FaTiktok />
                <FaReddit />
                <FaInstagram />
                <FaTwitter />
              </div>
            </div>
          </div>
          {/* Save Progress Display - no box styling */}
          <div className="w-full max-w-md flex flex-col items-start">
            <SaveProgressDisplay stepStatuses={stepStatuses} currentStep={currentStep} />
            {saved && (
              <div className="w-full mt-6">
                <div className="flex items-center gap-2 text-green-500 text-base font-semibold animate-fade-in-out mb-2">
                  <CheckCircle size={20} /> Saved!
                </div>
                {lastSavedEntry && (
                  <div className="rounded-2xl bg-green-100/60 dark:bg-green-900/20 border border-green-300/40 dark:border-green-800/40 p-5 mt-2">
                    <div className="font-bold text-lg text-dark-900 dark:text-white mb-1">{lastSavedEntry.title}</div>
                    <div className="text-sm text-dark-700 dark:text-dark-300 mb-1">
                      <span className="font-semibold">Category:</span> {lastSavedEntry.category || 'Uncategorized'}
                    </div>
                    {lastSavedEntry.platform && (
                      <div className="text-sm text-dark-700 dark:text-dark-300 mb-1">
                        <span className="font-semibold">Platform:</span> {lastSavedEntry.platform}
                      </div>
                    )}
                    {lastSavedEntry.tags && lastSavedEntry.tags.length > 0 && (
                      <div className="text-sm text-dark-700 dark:text-dark-300">
                        <span className="font-semibold">Tags:</span> {lastSavedEntry.tags.join(', ')}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SavePage;
