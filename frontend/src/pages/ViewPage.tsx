import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, ExternalLink, Edit, Trash2, Star, ClipboardCopy, ChevronDown, Check,
  Youtube, Book, Clock, Folder as FolderIcon, Calendar, Sun, Moon, Play
} from 'lucide-react';
import Logo from '../components/Logo';
import Button from '../components/Button';
import Textarea from '../components/Textarea';
import { FaReddit, FaInstagram, FaTwitter, FaTiktok, FaLinkedin, FaYoutube } from 'react-icons/fa';
import Kbd from '../components/Kbd';
import { useTheme } from '../contexts/ThemeContext';
import { fetchEntry, deleteEntry, updateEntry, fetchCategories } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const platformIcons: { [key: string]: React.ElementType } = {
  youtube: FaYoutube,
  reddit: FaReddit,
  instagram: FaInstagram,
  twitter: FaTwitter,
  tiktok: FaTiktok,
  linkedin: FaLinkedin,
};

// Helper to format date as 'June 25th, 2025'
function formatDateWithOrdinal(dateString?: string) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.toLocaleString('default', { month: 'long' });
  const year = date.getFullYear();
  // Ordinal suffix
  const getOrdinal = (n: number) => {
    if (n > 3 && n < 21) return 'th';
    switch (n % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };
  return `${month} ${day}${getOrdinal(day)}, ${year}`;
}

// Helper to format duration as HH:MM:SS or MM:SS
function formatDuration(duration: any) {
  if (!duration) return '—';
  // If string and contains colon, return as-is
  if (typeof duration === 'string' && duration.includes(':')) return duration;
  // If string of digits or number, treat as seconds
  let totalSeconds = typeof duration === 'number' ? duration : parseInt(duration, 10);
  if (isNaN(totalSeconds) || totalSeconds < 0) return '—';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  } else {
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
}

function getPlatformIconAndName(platform?: string) {
  if (!platform) return { icon: null, name: '' };
  const key = platform.toLowerCase();
  let name = '';
  let Icon = null;
  if (key.includes('youtube')) {
    name = 'YouTube';
    Icon = FaYoutube;
  } else if (key.includes('reddit')) {
    name = 'Reddit';
    Icon = FaReddit;
  } else if (key.includes('instagram')) {
    name = 'Instagram';
    Icon = FaInstagram;
  } else if (key.includes('twitter') || key.includes('x.com')) {
    name = 'Twitter';
    Icon = FaTwitter;
  } else if (key.includes('tiktok')) {
    name = 'TikTok';
    Icon = FaTiktok;
  } else if (key.includes('linkedin')) {
    name = 'LinkedIn';
    Icon = FaLinkedin;
  } else {
    name = platform.charAt(0).toUpperCase() + platform.slice(1);
    Icon = null;
  }
  return { icon: Icon, name };
}

const ViewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [entry, setEntry] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [notes, setNotes] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const navigate = useNavigate();
  const [isMac, setIsMac] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [categoryName, setCategoryName] = useState<string>("");

  useEffect(() => {
    setIsMac(/(Mac|iPhone|iPod|iPad)/i.test(navigator.platform));
  }, []);

  useEffect(() => {
    if (!id || !currentUser) return;
    setLoading(true);
    setError(null);
    currentUser.getIdToken().then(token => {
      return fetchEntry(token, id);
    }).then(data => {
      setEntry(data);
      setNotes(data.notes || '');
      setIsFavorited(!!data.favorite);
      setLoading(false);
    }).catch(err => {
      setError('Content not found');
      setLoading(false);
    });
  }, [id, currentUser]);

  useEffect(() => {
    if (entry) {
      document.title = `thinkback.ai - ${entry.title}`;
    } else {
      document.title = 'thinkback.ai - Not Found';
    }
  }, [entry]);

  useEffect(() => {
    if (!currentUser) return;
    currentUser.getIdToken().then(token => {
      fetchCategories(token).then(cats => setCategories(cats));
    });
  }, [currentUser]);

  useEffect(() => {
    if (entry && categories.length > 0 && entry.category_ids && entry.category_ids.length > 0) {
      const cat = categories.find(c => c.id === entry.category_ids[0]);
      setCategoryName(cat ? cat.name : "Unknown");
    }
  }, [entry, categories]);

  const { icon: PlatformIconComponent, name: platformName } = getPlatformIconAndName(entry?.platform);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        navigate('/dashboard');
      }
      const isModifier = /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform) ? e.metaKey : e.ctrlKey;
      if (isModifier && e.key.toLowerCase() === 'o' && entry) {
        e.preventDefault();
        window.open(entry.url, '_blank');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [navigate, entry]);

  const handleFavorite = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.blur();
    if (!entry || !currentUser) return;
    try {
      const token = await currentUser.getIdToken();
      const updated = await updateEntry(token, entry.id, { favorite: !isFavorited });
      setIsFavorited(updated.favorite);
      setEntry((prev: any) => ({ ...prev, favorite: updated.favorite }));
    } catch (err) {
      alert('Failed to update favorite: ' + (err as Error).message);
    }
  };

  const handleCopyLink = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!entry) return;
    e.currentTarget.blur();
    navigator.clipboard.writeText(entry.url);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleSaveNotes = () => {
    // TODO: Implement save notes API call
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!currentUser || !id) return;
    try {
      const token = await currentUser.getIdToken();
      await deleteEntry(token, id);

      // Remove entry from dashboard state if the function exists
      if ((window as any).removeEntryFromState) {
        (window as any).removeEntryFromState(id);
      }

      setShowDeleteConfirm(false);
      navigate('/dashboard');
    } catch (err) {
      alert('Failed to delete entry: ' + (err as Error).message);
      setShowDeleteConfirm(false);
    }
  };

  const handleReflect = () => {
    // In real app, this would open reflection dialog or navigate to reflection page
    console.log('Open reflection');
  };

  const handleResurface = () => {
    // In real app, this would set reminder or add to resurface queue
    console.log('Add to resurface queue');
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-dark-500 dark:text-dark-400">Loading...</div>;
  }

  if (error || !entry) {
    return (
      <div className="min-h-screen bg-white dark:bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 text-dark-900 dark:text-white flex flex-col items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Content not found</h1>
          <p className="text-dark-500 dark:text-dark-400 mb-8">The content you are looking for does not exist or has been moved.</p>
          <Link to="/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 text-dark-900 dark:text-white">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/5 rounded-full blur-3xl animate-pulse-subtle"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl animate-pulse-subtle" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-dark-900/30 backdrop-blur-xl border-b border-dark-200/50 dark:border-dark-800/50">
        <div className="max-w-screen-2xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/dashboard">
              <Logo size="sm" />
            </Link>
            <div className="flex items-center space-x-2 sm:space-x-3">
              <button
                onClick={toggleTheme}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-dark-100/50 dark:bg-dark-800/50 hover:bg-dark-200/60 dark:hover:bg-dark-700/70 transition-colors duration-200"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun size={20} className="text-dark-900 dark:text-white" /> : <Moon size={20} className="text-dark-900 dark:text-white" />}
              </button>
              <a
                href={entry.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 sm:space-x-3 px-4 py-2 rounded-full bg-dark-100/50 dark:bg-dark-800/50 hover:bg-dark-200/60 dark:hover:bg-dark-700/70 transition-colors duration-200 text-dark-800 dark:text-white"
              >
                <ExternalLink size={16} />
                <span className="font-medium text-sm hidden sm:inline">Open Original</span>
                <Kbd className="hidden sm:block">{isMac ? '⌘' : 'Ctrl'}+O</Kbd>
              </a>
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
      <div className="max-w-screen-2xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Title & Description */}
            <div className="bg-dark-100/30 dark:bg-dark-900/40 border border-dark-200/50 dark:border-dark-800/50 rounded-2xl p-6 md:p-8">
              <h1 className="text-3xl sm:text-4xl font-bold text-dark-900 dark:text-white mb-3" style={{ textShadow: '0 0 35px rgba(14, 165, 233, 0.6)' }}>
                {entry?.title}
              </h1>

              {/* AI Summary */}
              {entry?.summary && (
                <div className="mb-6 p-4 bg-primary-50/50 dark:bg-primary-900/20 border border-primary-200/50 dark:border-primary-800/50 rounded-xl">
                  <h3 className="text-sm font-semibold text-primary-700 dark:text-primary-300 mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 bg-primary-500 rounded-full"></span>
                    AI Summary
                  </h3>
                  <p className="text-dark-700 dark:text-dark-200 leading-relaxed">
                    {entry.summary}
                  </p>
                </div>
              )}

              <p className="text-dark-700 dark:text-dark-200 leading-relaxed mb-6">
                {entry?.description}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-3">
                {entry?.tags?.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-4 py-2 rounded-full text-xs font-semibold bg-primary-100/60 dark:bg-dark-800/60 text-primary-800 dark:text-primary-300 border border-primary-200/50 dark:border-dark-700/80 hover:bg-primary-100/80 dark:hover:bg-dark-700/60 transition-colors"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Personal Notes */}
            <div className="bg-dark-100/30 dark:bg-dark-900/40 border border-dark-200/50 dark:border-dark-800/50 rounded-2xl p-6 md:p-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-dark-900 dark:text-white">Personal Notes</h2>
                <Button
                  onClick={() => setIsEditing(!isEditing)}
                  variant="secondary"
                  size="sm"
                  className="!rounded-full flex items-center gap-2"
                >
                  <Edit size={14} />
                  <span>{isEditing ? 'Cancel' : 'Edit'}</span>
                </Button>
              </div>

              {isEditing ? (
                <div className="space-y-4">
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={6}
                    placeholder="Add your thoughts, insights, or reflections..."
                    className="bg-white dark:bg-dark-800/80"
                  />
                  <div className="flex justify-end">
                    <Button onClick={handleSaveNotes}>
                      Save Notes
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="prose dark:prose-invert prose-p:text-dark-700 dark:prose-p:text-dark-200 prose-blockquote:text-dark-600 dark:prose-blockquote:text-dark-300 prose-strong:text-dark-900 dark:prose-strong:text-white text-dark-700 dark:text-dark-200 leading-relaxed whitespace-pre-wrap">
                  {notes || (
                    <p className="text-dark-500 dark:text-dark-400 italic">No personal notes added yet.</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-1 space-y-8">
            <div className="sticky top-32">
              {/* Thumbnail Image */}
              {entry?.thumbnail && entry?.url && (
                <a
                  href={entry.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block mb-3 group"
                >
                  <img
                    src={entry.thumbnail}
                    alt={entry.title || 'Entry thumbnail'}
                    className="w-full rounded-2xl shadow-lg object-cover max-h-64 transition-transform duration-200 group-hover:scale-105 group-hover:shadow-xl"
                  />
                </a>
              )}
              {/* Details */}
              <div className="bg-dark-100/30 dark:bg-dark-900/40 border border-dark-200/50 dark:border-dark-800/50 rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-dark-900 dark:text-white mb-4">Details</h2>
                <ul className="space-y-4 text-sm">
                  <li className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      {PlatformIconComponent
                        ? <PlatformIconComponent size={16} style={platformName === 'YouTube' ? { color: '#fff' } : {}} />
                        : <Play size={16} style={{ color: '#888' }} />
                      }
                      <span className="font-medium text-dark-900 dark:text-white">{platformName}</span>
                    </span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <FolderIcon size={16} />
                      <span className="font-medium text-dark-900 dark:text-white">{categoryName}</span>
                    </span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Calendar size={16} />
                      <span className="font-medium text-dark-900 dark:text-white">{formatDateWithOrdinal(entry?.created_at || entry?.savedDate)}</span>
                    </span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Clock size={16} />
                      <span className="font-medium text-dark-900 dark:text-white">{formatDuration(entry?.duration)}</span>
                    </span>
                  </li>
                </ul>
              </div>

              {/* Actions */}
              <div className="bg-dark-100/30 dark:bg-dark-900/40 border border-dark-200/50 dark:border-dark-800/50 rounded-2xl p-6 mt-4">
                <h2 className="text-lg font-semibold text-dark-900 dark:text-white mb-4">Actions</h2>
                <div className="flex gap-4">
                  <Button onClick={handleFavorite} variant="ghost" className={`flex-1 justify-center flex-col h-20 gap-1 focus:ring-0 ${isFavorited ? 'text-yellow-400' : 'text-inherit'}`}>
                    <Star size={20} className={`${isFavorited ? 'fill-current' : ''}`} />
                    <span className="font-medium text-xs">{isFavorited ? 'Favorited' : 'Favorite'}</span>
                  </Button>
                  <Button onClick={handleCopyLink} variant="ghost" className="flex-1 justify-center flex-col h-20 gap-1 focus:ring-0">
                    {linkCopied ? <Check size={20} className="text-green-500" /> : <ClipboardCopy size={20} />}
                    <span className="font-medium text-xs">{linkCopied ? 'Copied!' : 'Copy Link'}</span>
                  </Button>
                  <Button onClick={() => setShowDeleteConfirm(true)} variant="ghost" className="flex-1 justify-center flex-col h-20 gap-1 focus:ring-0 text-red-500 dark:text-red-500 hover:!bg-red-500/10">
                    <Trash2 size={20} className="text-red-500 dark:text-red-500" />
                    <span className="font-medium text-xs !text-red-500 dark:!text-red-500">Delete</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-dark-200 dark:bg-dark-800 border border-dark-300 dark:border-dark-700 rounded-2xl p-8 max-w-md w-full shadow-2xl m-4">
            <h2 className="text-2xl font-bold text-dark-900 dark:text-white mb-2">Delete Entry?</h2>
            <p className="text-dark-600 dark:text-dark-300 mb-6">Are you sure you want to permanently delete "{entry?.title}"? This action cannot be undone.</p>
            <div className="flex justify-end gap-4">
              <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDelete}>Delete</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewPage;
