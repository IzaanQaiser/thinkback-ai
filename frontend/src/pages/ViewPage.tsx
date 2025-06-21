import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, ExternalLink, Edit, Trash2, Star, ClipboardCopy, ChevronDown, Check,
  Youtube, Book, Clock, Folder as FolderIcon, Calendar
} from 'lucide-react';
import Logo from '../components/Logo';
import Button from '../components/Button';
import Textarea from '../components/Textarea';
import { FaReddit, FaInstagram, FaTwitter } from 'react-icons/fa';
import Kbd from '../components/Kbd';
import { mockData, mockCategories } from '../data/mockData';

const platformIcons: { [key: string]: React.ElementType } = {
  youtube: Youtube,
  reddit: FaReddit,
  instagram: FaInstagram,
  twitter: FaTwitter
};

const ViewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const entry = mockData.find(e => e.id === id);

  const [isEditing, setIsEditing] = useState(false);
  const [notes, setNotes] = useState(entry?.notes || '');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const navigate = useNavigate();
  const [isMac, setIsMac] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const PlatformIcon = entry ? platformIcons[entry.platform as keyof typeof platformIcons] : null;

  useEffect(() => {
    setIsMac(/(Mac|iPhone|iPod|iPad)/i.test(navigator.platform));

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

  const handleCopyLink = () => {
    if (!entry) return;
    navigator.clipboard.writeText(entry.url);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleSaveNotes = () => {
    // In real app, this would be an API call
    setIsEditing(false);
  };

  const handleDelete = () => {
    // In real app, this would be an API call
    console.log('Delete entry');
  };

  const handleReflect = () => {
    // In real app, this would open reflection dialog or navigate to reflection page
    console.log('Open reflection');
  };

  const handleResurface = () => {
    // In real app, this would set reminder or add to resurface queue
    console.log('Add to resurface queue');
  };

  if (!entry) {
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
            <div className="flex items-center space-x-3">
              <a
                href={entry.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-3 px-4 py-2 rounded-full bg-dark-100/50 dark:bg-dark-800/50 hover:bg-dark-200/60 dark:hover:bg-dark-700/70 transition-colors duration-200 text-dark-800 dark:text-white"
              >
                <ExternalLink size={16} />
                <span className="font-medium text-sm">Open Original</span>
                <Kbd>{isMac ? '⌘' : 'Ctrl'}+O</Kbd>
              </a>
              <Link to="/dashboard" className="flex items-center space-x-3 px-4 py-2 rounded-full bg-dark-100/50 dark:bg-dark-800/50 hover:bg-dark-200/60 dark:hover:bg-dark-700/70 transition-colors duration-200 text-dark-800 dark:text-white">
                <ArrowLeft size={16} />
                <span className="font-medium text-sm">Back to Vault</span>
                <Kbd>esc</Kbd>
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
            {/* Media Preview */}
            <div className="aspect-video bg-dark-200 dark:bg-dark-900 rounded-2xl overflow-hidden relative shadow-2xl border border-dark-200/80 dark:border-dark-800/50">
              <img
                src={entry?.thumbnail}
                alt={entry?.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-0 left-0 m-4">
                <div className="bg-black/20 dark:bg-dark-900/50 backdrop-blur-md rounded-full p-2.5 border border-white/20 dark:border-dark-700/50">
                  {PlatformIcon && <PlatformIcon size={20} className="text-white" />}
                </div>
              </div>
              {entry?.duration && (
                <div className="absolute bottom-0 right-0 m-4">
                  <div className="bg-black/20 dark:bg-dark-900/50 text-white text-sm px-3 py-1.5 rounded-full backdrop-blur-md border border-white/20 dark:border-dark-700/50">
                    {entry.duration}
                  </div>
                </div>
              )}
            </div>

            {/* Title & Description */}
            <div className="bg-dark-100/30 dark:bg-dark-900/40 border border-dark-200/50 dark:border-dark-800/50 rounded-2xl p-8">
              <h1 className="text-4xl font-bold text-dark-900 dark:text-white mb-3" style={{ textShadow: '0 0 20px rgba(0, 0, 0, 0.1)' }}>
                {entry?.title}
              </h1>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-6 text-sm text-dark-500 dark:text-dark-300">
                <div className="flex items-center space-x-2">
                  <Book size={14} />
                  <span>{entry?.author}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar size={14} />
                  <span>Saved {entry?.savedDate}</span>
                </div>
              </div>

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
            <div className="bg-dark-100/30 dark:bg-dark-900/40 border border-dark-200/50 dark:border-dark-800/50 rounded-2xl p-8">
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
              {/* Details */}
              <div className="bg-dark-100/30 dark:bg-dark-900/40 border border-dark-200/50 dark:border-dark-800/50 rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-dark-900 dark:text-white mb-4">Details</h2>
                <ul className="space-y-4 text-sm">
                  <li className="flex items-center justify-between">
                    <span className="text-dark-500 dark:text-dark-300 flex items-center gap-2">
                      {PlatformIcon && <PlatformIcon size={16} />}
                      Platform
                    </span>
                    <span className="font-medium text-dark-900 dark:text-white capitalize">{entry?.platform}</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-dark-500 dark:text-dark-300 flex items-center gap-2">
                      <FolderIcon size={16} />
                      Category
                    </span>
                    <span className="font-medium text-dark-900 dark:text-white">{entry?.category}</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-dark-500 dark:text-dark-300 flex items-center gap-2">
                      <Calendar size={16} />
                      Saved
                    </span>
                    <span className="font-medium text-dark-900 dark:text-white">{entry?.savedDate}</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-dark-500 dark:text-dark-300 flex items-center gap-2">
                      <Clock size={16} />
                      Duration
                    </span>
                    <span className="font-medium text-dark-900 dark:text-white">{entry?.duration}</span>
                  </li>
                </ul>
              </div>

              {/* Actions */}
              <div className="bg-dark-100/30 dark:bg-dark-900/40 border border-dark-200/50 dark:border-dark-800/50 rounded-2xl p-6 mt-8">
                <h2 className="text-lg font-semibold text-dark-900 dark:text-white mb-4">Actions</h2>
                <div className="grid grid-cols-2 gap-3">
                  <Button onClick={() => setIsFavorited(!isFavorited)} variant="ghost" className={`w-full justify-center flex-col h-20 gap-1 ${isFavorited ? 'text-yellow-400' : 'text-inherit'}`}>
                    <Star size={20} className={`${isFavorited ? 'fill-current' : ''}`} />
                    <span className="font-medium text-xs">{isFavorited ? 'Favorited' : 'Favorite'}</span>
                  </Button>
                  <Button onClick={handleCopyLink} variant="ghost" className="w-full justify-center flex-col h-20 gap-1">
                    <ClipboardCopy size={20} className="text-blue-400"/>
                    <span className="font-medium text-xs">{linkCopied ? 'Copied!' : 'Copy Link'}</span>
                  </Button>
                </div>

                <div className="!my-4 border-t border-dark-200/80 dark:border-dark-800/50"></div>

                <Button onClick={() => setShowDeleteConfirm(true)} variant="ghost" className="w-full justify-start gap-3 !px-2 !py-3 !text-red-400 hover:!bg-red-500/10">
                  <Trash2 size={18} />
                  <span className="font-medium">Delete</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center">
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
