import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save, CheckCircle, Link as LinkIcon, FileText, Loader2, Clipboard } from 'lucide-react';
import { FaYoutube, FaTiktok, FaReddit, FaInstagram, FaTwitter } from 'react-icons/fa';
import Logo from '../components/Logo';
import Input from '../components/Input';
import Textarea from '../components/Textarea';
import Button from '../components/Button';
import Kbd from '../components/Kbd';
import { useTheme } from '../contexts/ThemeContext';
import { createEntry, fetchEntry, fetchCategories, submitAIFeedback } from '../services/api';
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

const MANUAL_SAVE_STEPS = [
  'Authentication',
  'Platform Detection',
  'Platform Scraping',
  'Save to Database',
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

  // Determine which steps to show based on the number of statuses
  const steps = stepStatuses.length === MANUAL_SAVE_STEPS.length ? MANUAL_SAVE_STEPS : SAVE_STEPS;

  return (
    <div className="w-full max-w-lg mx-auto mb-8 bg-white/80 dark:bg-dark-900/70 rounded-2xl shadow p-6 border border-dark-200/40 dark:border-dark-800/40">
      <h2
        className="text-2xl sm:text-3xl font-extrabold text-center mb-2"
        style={{ textShadow: '0 0 35px rgba(14, 165, 233, 0.6)' }}
      >
        Save Progress
      </h2>
      <ol className="space-y-3">
        {steps.map((step, idx) => {
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
  const [saved, setSaved] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { theme } = useTheme();
  const { currentUser } = useAuth();
  const [stepStatuses, setStepStatuses] = useState<SaveStepStatus[]>(Array(SAVE_STEPS.length).fill('pending'));
  const [currentStep, setCurrentStep] = useState(0);
  const [showProgress, setShowProgress] = useState(false);
  const urlInputRef = useRef<HTMLInputElement>(null);
  const [lastSavedEntry, setLastSavedEntry] = useState<{ title?: string; category?: string; platform?: string; tags?: string[]; classificationMethod?: 'ai' | 'manual' } | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [categoryMap, setCategoryMap] = useState<{ [id: string]: string }>({});

  // Classification method state
  const [classificationMethod, setClassificationMethod] = useState<'ai' | 'manual'>('ai');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [newCategoryName, setNewCategoryName] = useState<string>('');

  // AI Feedback state
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState<number>(0);
  const [feedbackNotes, setFeedbackNotes] = useState('');
  const [suggestedCategory, setSuggestedCategory] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    document.title = 'thinkback - Save';
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

  // Handle shared content from URL parameters (PWA share target)
  useEffect(() => {
    const sharedUrl = searchParams.get('url');
    const sharedTitle = searchParams.get('title');
    const sharedText = searchParams.get('text');
    
    if (sharedUrl || sharedTitle || sharedText) {
      // Pre-populate the form with shared content
      if (sharedUrl) setUrl(sharedUrl);
      
      // Show a notification that content was shared
      console.log('Received shared content:', { url: sharedUrl, title: sharedTitle, text: sharedText });
      
      // If this is from a share target, show a success message
      if (sharedUrl || sharedTitle) {
        // You could show a toast notification here
        console.log('Content shared successfully! Ready to save.');
      }
    }
  }, [searchParams]);

  // Also check localStorage for shared content (fallback)
  useEffect(() => {
    try {
      const storedContent = localStorage.getItem('sharedContent');
      if (storedContent) {
        const parsed = JSON.parse(storedContent);
        if (parsed.url && !url) {
          setUrl(parsed.url);
          console.log('Loaded shared content from localStorage:', parsed);
        }
        // Clear the stored content after using it
        localStorage.removeItem('sharedContent');
      }
    } catch (error) {
      console.error('Error loading shared content from localStorage:', error);
    }
  }, [url]);

  useEffect(() => {
    if (urlInputRef.current && !showProgress) {
      urlInputRef.current.focus();
      urlInputRef.current.select();
    }
  }, [showProgress]);

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategoriesData = async () => {
      if (!currentUser) return;
      try {
        const idToken = await currentUser.getIdToken();
        const cats = await fetchCategories(idToken);
        setCategories(cats);
        const map: { [id: string]: string } = {};
        cats.forEach((cat: any) => { map[cat.id] = cat.name; });
        setCategoryMap(map);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };
    fetchCategoriesData();
  }, [currentUser]);

  // Update step statuses when classification method changes
  useEffect(() => {
    if (!showProgress) {
      const steps = classificationMethod === 'manual' ? MANUAL_SAVE_STEPS : SAVE_STEPS;
      setStepStatuses(Array(steps.length).fill('pending'));
      setCurrentStep(0);
    }
  }, [classificationMethod, showProgress]);

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
    
    // Initialize steps based on classification method
    const steps = classificationMethod === 'manual' ? MANUAL_SAVE_STEPS : SAVE_STEPS;
    setStepStatuses(Array(steps.length).fill('pending'));
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
      let enrichResult = null;
      let title = '';
      let tags: string[] = [];
      let thumbnail = '';
      
      if (classificationMethod === 'ai') {
        // Use AI pipeline for enrichment
        const enrichPromise = fetch(`${API_URL}/api/enrich-entry`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({ url }),
        });
        markStep(1, 'done');
        markStep(2, 'in_progress');
        const enrichResponse = await enrichPromise;
        markStep(2, 'done');
        markStep(3, 'in_progress');
        // 3. AI Pipeline (enrichment)
        if (!enrichResponse.ok) throw new Error('Failed to enrich entry');
        enrichResult = await enrichResponse.json();
        title = enrichResult.ai.title || '';
        tags = enrichResult.ai.tags || [];
        thumbnail = enrichResult.thumbnail || '';
        markStep(3, 'done');
        markStep(4, 'in_progress');
        // 4. AI Classification
        let categoryId = null;
        let categoryName = '';
        
        if (enrichResult.ai.category) {
          if (enrichResult.ai.category.id) {
            categoryId = enrichResult.ai.category.id;
            categoryName = enrichResult.ai.category.name || '';
          } else if (enrichResult.ai.category.name) {
            categoryName = enrichResult.ai.category.name;
            const categoryResponse = await fetch(`${API_URL}/api/categories`, {
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
        
        // 5. Save to Database
        const entryData = {
          url,
          title,
          tags,
          category_ids: categoryId ? [categoryId] : [],
          ...(thumbnail ? { thumbnail } : {}),
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
        markStep(4, 'done');
        markStep(5, 'done');
        markStep(6, 'in_progress');
        // 6. Save Process
        setSaved(true);
        setLastSavedEntry({
          title: entryForSummary.title,
          category: summaryCategory,
          platform: entryForSummary.platform,
          tags: entryForSummary.tags,
          classificationMethod: 'ai',
        });
        setUrl('');
        setClassificationMethod('ai');
        setSelectedCategoryId('');
        setNewCategoryName('');
        markStep(6, 'done');
        // Reset progress state to allow new saves
        setShowProgress(false);
        
      } else {
        // Manual classification - simple flow
        markStep(1, 'done');
        markStep(2, 'in_progress');
        // 2. Platform Scraping
        const scrapeResponse = await fetch(`${API_URL}/api/scrape`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({ url }),
        });
        markStep(2, 'done');
        markStep(3, 'in_progress');
        // 3. Save to Database
        let categoryId = null;
        if (selectedCategoryId === 'new' && newCategoryName.trim()) {
          // Create new category
          const categoryResponse = await fetch(`${API_URL}/api/categories`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${idToken}`,
            },
            body: JSON.stringify({ 
              name: newCategoryName.trim(),
              ai_generated: false 
            }),
          });
          if (categoryResponse.ok) {
            const newCategory = await categoryResponse.json();
            categoryId = newCategory.id;
          }
        } else if (selectedCategoryId && selectedCategoryId !== 'new') {
          categoryId = selectedCategoryId;
        }
        
        // Get basic scraped data
        let scrapedData = {};
        let title = '';
        let thumbnail = '';
        if (scrapeResponse.ok) {
          scrapedData = await scrapeResponse.json();
          title = scrapedData.title || '';
          thumbnail = scrapedData.thumbnail || '';
        }
        
        const entryData = {
          url,
          title,
          tags: [], // No AI tags for manual classification
          category_ids: categoryId ? [categoryId] : [],
          ...(thumbnail ? { thumbnail } : {}),
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
        markStep(3, 'done');
        // Save Process
        setSaved(true);
        setLastSavedEntry({
          title: entryForSummary.title,
          category: summaryCategory,
          platform: entryForSummary.platform,
          tags: entryForSummary.tags,
          classificationMethod: 'manual',
        });
        setUrl('');
        setClassificationMethod('ai');
        setSelectedCategoryId('');
        setNewCategoryName('');
        // Reset progress state to allow new saves
        setShowProgress(false);
      }
    } catch (error) {
      console.error('[Save] Error:', error);
      // Reset progress state on error to allow retry
      setShowProgress(false);
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      // Check if clipboard API is available
      if (!navigator.clipboard) {
        console.warn('Clipboard API not available');
        return;
      }
      
      const clipboardText = await navigator.clipboard.readText();
      if (clipboardText) {
        setUrl(clipboardText);
        // Focus the input after pasting
        if (urlInputRef.current) {
          urlInputRef.current.focus();
        }
      }
    } catch (error) {
      console.error('Failed to read clipboard:', error);
      // Fallback: try to use the older clipboard API
      try {
        const textArea = document.createElement('textarea');
        textArea.value = '';
        document.body.appendChild(textArea);
        textArea.focus();
        document.execCommand('paste');
        const clipboardText = textArea.value;
        document.body.removeChild(textArea);
        
        if (clipboardText) {
          setUrl(clipboardText);
          if (urlInputRef.current) {
            urlInputRef.current.focus();
          }
        }
      } catch (fallbackError) {
        console.error('Fallback clipboard method also failed:', fallbackError);
      }
    }
  };

  const handleFeedbackSubmit = async () => {
    if (!currentUser || !lastSavedEntry) return;
    
    try {
      const idToken = await currentUser.getIdToken();
      
      const feedback = {
        entry_id: lastSavedEntry.id,
        original_category: lastSavedEntry.category,
        suggested_category: suggestedCategory || undefined,
        type: 'correction' as const,
        rating: feedbackRating,
        notes: feedbackNotes,
      };
      
      await submitAIFeedback(idToken, feedback);
      
      setFeedbackSubmitted(true);
      setShowFeedbackModal(false);
      
      // Reset feedback form
      setTimeout(() => {
        setFeedbackRating(0);
        setFeedbackNotes('');
        setSuggestedCategory('');
        setFeedbackSubmitted(false);
      }, 2000);
      
    } catch (error) {
      console.error('Failed to submit feedback:', error);
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
                endIcon={<Clipboard size={18} />}
                onEndIconClick={handlePasteFromClipboard}
              />
              {/* Classification Method */}
              <div className="w-full">
                <label className="block text-sm font-medium text-dark-900 dark:text-white mb-3">
                  Classification Method
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <label className={`relative flex items-center justify-center p-4 rounded-2xl border cursor-pointer transition-all duration-300 flex-1 min-h-[60px] ${
                    classificationMethod === 'ai'
                      ? 'border-primary-500 bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/25'
                      : 'border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-800 text-dark-700 dark:text-dark-300 hover:border-primary-400 dark:hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/10'
                  } ${showProgress ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <input
                      type="radio"
                      name="classificationMethod"
                      value="ai"
                      checked={classificationMethod === 'ai'}
                      onChange={(e) => setClassificationMethod(e.target.value as 'ai' | 'manual')}
                      disabled={showProgress}
                      className="sr-only"
                    />
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 flex-shrink-0 ${
                        classificationMethod === 'ai'
                          ? 'border-white bg-white'
                          : 'border-dark-300 dark:border-dark-600'
                      }`}>
                        {classificationMethod === 'ai' && (
                          <div className="w-2.5 h-2.5 bg-primary-500 rounded-full"></div>
                        )}
                      </div>
                      <span className="text-sm font-semibold text-center">AI Classification</span>
                    </div>
                  </label>
                  
                  <label className={`relative flex items-center justify-center p-4 rounded-2xl border cursor-pointer transition-all duration-300 flex-1 min-h-[60px] ${
                    classificationMethod === 'manual'
                      ? 'border-primary-500 bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/25'
                      : 'border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-800 text-dark-700 dark:text-dark-300 hover:border-primary-400 dark:hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/10'
                  } ${showProgress ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <input
                      type="radio"
                      name="classificationMethod"
                      value="manual"
                      checked={classificationMethod === 'manual'}
                      onChange={(e) => setClassificationMethod(e.target.value as 'ai' | 'manual')}
                      disabled={showProgress}
                      className="sr-only"
                    />
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 flex-shrink-0 ${
                        classificationMethod === 'manual'
                          ? 'border-white bg-white'
                          : 'border-dark-300 dark:border-dark-600'
                      }`}>
                        {classificationMethod === 'manual' && (
                          <div className="w-2.5 h-2.5 bg-primary-500 rounded-full"></div>
                        )}
                      </div>
                      <span className="text-sm font-semibold text-center">Manual Selection</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Manual Category Selection */}
              <div 
                className={`w-full overflow-hidden transition-all duration-500 ease-in-out ${
                  classificationMethod === 'manual' 
                    ? 'max-h-96 opacity-100 mt-6' 
                    : 'max-h-0 opacity-0 mt-0'
                }`}
              >
                <div className="w-full space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-900 dark:text-white mb-3">
                      Select Category
                    </label>
                    <div className="relative group">
                      <select
                        value={selectedCategoryId}
                        onChange={(e) => {
                          setSelectedCategoryId(e.target.value);
                          if (e.target.value !== 'new') {
                            setNewCategoryName('');
                          }
                        }}
                        disabled={showProgress}
                        className="w-full px-4 py-3.5 border border-dark-200 dark:border-dark-700 rounded-2xl bg-white dark:bg-dark-800 text-dark-900 dark:text-white focus:outline-none focus:border-primary-400/30 dark:focus:border-primary-400/30 disabled:opacity-50 disabled:cursor-not-allowed appearance-none pr-12 transition-all duration-200 hover:border-primary-300 dark:hover:border-primary-600 group-hover:shadow-md"
                      >
                        <option value="">Choose a category...</option>
                        <option value="new">➕ Create New Category</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                        <svg className="w-5 h-5 text-dark-400 dark:text-dark-500 transition-transform duration-200 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* New Category Input */}
                  <div 
                    className={`w-full overflow-hidden transition-all duration-500 ease-in-out ${
                      selectedCategoryId === 'new' 
                        ? 'max-h-32 opacity-100 mt-4' 
                        : 'max-h-0 opacity-0 mt-0'
                    }`}
                  >
                    <div>
                      <label className="block text-sm font-medium text-dark-900 dark:text-white mb-2">
                        New Category Name
                      </label>
                      <input
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="Enter category name..."
                        disabled={showProgress}
                        className="w-full px-4 py-3.5 border border-dark-200 dark:border-dark-700 rounded-2xl bg-white dark:bg-dark-800 text-dark-900 dark:text-white focus:outline-none focus:border-primary-400/30 dark:focus:border-primary-400/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:border-primary-300 dark:hover:border-primary-600"
                      />
                    </div>
                  </div>
                </div>
              </div>
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
                    <div className="font-bold text-lg text-dark-900 dark:text-white mb-1 line-clamp-2">{lastSavedEntry.title}</div>
                    <div className="text-sm text-dark-700 dark:text-dark-300 mb-1">
                      <span className="font-semibold">Category:</span> {lastSavedEntry.category || 'Uncategorized'}
                    </div>
                    {lastSavedEntry.platform && (
                      <div className="text-sm text-dark-700 dark:text-dark-300 mb-1">
                        <span className="font-semibold">Platform:</span> {lastSavedEntry.platform}
                      </div>
                    )}
                    {lastSavedEntry.tags && lastSavedEntry.tags.length > 0 && (
                      <div className="text-sm text-dark-700 dark:text-dark-300 mb-3">
                        <span className="font-semibold">Tags:</span> {lastSavedEntry.tags.join(', ')}
                      </div>
                    )}
                    
                    {/* AI Feedback Button - Only show for AI classifications */}
                    {lastSavedEntry.classificationMethod === 'ai' && (
                      <div className="mt-4 pt-3 border-t border-green-300/40 dark:border-green-800/40">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          <span className="text-xs text-green-600 dark:text-green-400 font-medium">AI classified as "{lastSavedEntry.category || 'Uncategorized'}"</span>
                        </div>
                        <button
                          onClick={() => setShowFeedbackModal(true)}
                          className="w-full px-3 py-2 bg-green-100/60 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-300/40 dark:border-green-800/40 rounded-lg hover:bg-green-200/80 dark:hover:bg-green-900/40 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                          Help improve AI classification
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">AI Classification Feedback</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Current Category</label>
                <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded">{lastSavedEntry?.category || 'Uncategorized'}</div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Suggested Category (optional)</label>
                <input
                  type="text"
                  value={suggestedCategory}
                  onChange={(e) => setSuggestedCategory(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700"
                  placeholder="What category should this be?"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Rating (1-5)</label>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setFeedbackRating(star)}
                      className={`p-1 rounded ${
                        star <= feedbackRating
                          ? 'text-yellow-500'
                          : 'text-gray-300 dark:text-gray-600'
                      }`}
                    >
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Notes (optional)</label>
                <textarea
                  value={feedbackNotes}
                  onChange={(e) => setFeedbackNotes(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700"
                  rows={3}
                  placeholder="Any additional feedback..."
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowFeedbackModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleFeedbackSubmit}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Submit Feedback
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Success Message */}
      {feedbackSubmitted && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 text-center">
            <div className="text-green-500 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Thank You!</h3>
            <p className="text-gray-600 dark:text-gray-400">Your feedback has been submitted and will help improve our AI classification.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SavePage;
