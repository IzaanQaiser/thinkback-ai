import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Folder, Star, Images, ExternalLink, Trash2 } from 'lucide-react';
import { FaYoutube, FaReddit, FaInstagram, FaTiktok } from 'react-icons/fa';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

interface ContentCardProps {
    id: string;
    title: string;
    url: string;
  notes?: string;
  favorite?: boolean;
  createdAt?: string;
    category: string;
  categoryId?: string;
  categories?: { id: string; name: string }[];
  onCategoryChange?: (entryId: string, newCategoryId: string) => void;
  onFavoriteToggle?: (entryId: string, newFavoriteState: boolean) => void;
  thumbnail?: string;
  platform?: string;
  isCarousel?: boolean;
  carouselCount?: number;
  expandSummary?: boolean;
  channel?: string;
}

const portraitPlatforms = [
  'YouTube Shorts',
  'Instagram Reel',
  'TikTok Video',
];

const ContentCard: React.FC<ContentCardProps> = ({ id, title, notes, favorite, category, categoryId, categories, onCategoryChange, onFavoriteToggle, thumbnail, platform, isCarousel, carouselCount, url, expandSummary, channel }) => {
  const { theme } = useTheme();
  const [seen, setSeen] = React.useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(`entry-seen-${id}`) === 'true';
    }
    return false;
  });
  const [categoryModalOpen, setCategoryModalOpen] = React.useState(false);
  const [skipNextNavigation, setSkipNextNavigation] = React.useState(false);
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [deleteLoading, setDeleteLoading] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  React.useEffect(() => {
    // Listen for storage events to sync seen state across tabs
    const handler = (e: StorageEvent) => {
      if (e.key === `entry-seen-${id}`) {
        setSeen(e.newValue === 'true');
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [id]);

  function markSeen() {
    setSeen(true);
    localStorage.setItem(`entry-seen-${id}`, 'true');
  }

  // Check if this is a non-landscape portrait that should match YouTube Shorts format
  const isPortrait = portraitPlatforms.includes(platform || '');
  const isYouTubeShorts = platform === 'YouTube Shorts';
  
  // All non-landscape portraits (except YouTube Shorts) should match YouTube Shorts format
  const shouldUseShortsFormat = isPortrait && !isYouTubeShorts;
  
  // For portrait platforms, use a taller aspect ratio (9/8) but do NOT set minHeight, so the card size stays consistent.
  const portraitAspect = '9/8';
  const landscapeAspect = '16/9';
  // Instagram post aspect ratio (used for cropping TikTok thumbnails to match Instagram post size)
  const instagramPostAspect = '1/1'; // square aspect ratio for Instagram posts
  
  // Debug logging
  console.log('ContentCard Debug:', {
    platform,
    isPortrait,
    isYouTubeShorts,
    shouldUseShortsFormat,
    portraitAspect,
    landscapeAspect,
    instagramPostAspect
  });

  function getPlatformIconOverlay(platform?: string, theme?: string) {
    if (!platform) return null;
    const size = 22;
    const baseClass =
      'absolute top-2 left-2 z-10 rounded-full p-1 bg-white/60 dark:bg-dark-900/60 shadow-md flex items-center justify-center';
    switch (platform) {
      case 'YouTube Video':
        return <span className={baseClass}><FaYoutube size={size} className="text-black dark:text-white" /></span>;
      case 'YouTube Shorts':
        return (
          <span className={baseClass}>
            <img
              src={theme === 'dark' ? '/youtube-shorts-logo-clean.png' : '/youtube-shorts-logo-dark-clean.png'}
              alt="YouTube Shorts"
              style={{ width: size, height: size }}
            />
          </span>
        );
      case 'Reddit Post':
        return <span className={baseClass}><FaReddit size={size} className={theme === 'dark' ? 'text-white' : 'text-black'} /></span>;
      case 'Twitter/X Post':
        return (
          <span className={baseClass}>
            <img
              src={theme === 'dark' ? '/x-logo-white.png' : '/x-logo-black.png'}
              alt="X logo"
              style={{ width: size, height: size, borderRadius: '50%' }}
            />
          </span>
        );
      case 'Instagram Reel':
      case 'Instagram Post':
        return <span className={baseClass}><FaInstagram size={size} className={theme === 'dark' ? 'text-white' : 'text-black'} /></span>;
      case 'TikTok Video':
        return <span className={baseClass}><FaTiktok size={size} className="text-black dark:text-white" /></span>;
      case 'LinkedIn Post':
      case 'LinkedIn Job':
        return (
          <span className={baseClass}>
            <img 
              src="/linkedin-video-white.png" 
              alt="LinkedIn" 
              width={size} 
              height={size}
              className="object-contain"
            />
          </span>
        );
      default:
        return null;
    }
  }

  function getFavoriteIconOverlay(favorite?: boolean) {
    if (!favorite) return null;
    const size = 22;
    const baseClass =
      'absolute top-2 right-2 z-10 rounded-full p-1 bg-white/60 dark:bg-dark-900/60 shadow-md flex items-center justify-center';
    const iconClass = theme === 'dark' ? 'text-white' : 'text-black';
    return <span className={baseClass}><Star size={size} className={iconClass} fill={theme === 'dark' ? 'white' : 'black'} /></span>;
  }

  function getCarouselIndicator() {
    if (!isCarousel || !carouselCount) return null;
    const size = 18;
    const baseClass =
      'absolute bottom-2 right-2 z-10 rounded-full p-1 bg-black/60 text-white shadow-md flex items-center justify-center text-xs font-semibold';
    return (
      <span className={baseClass}>
        <Images size={size} className="mr-1" />
        {carouselCount}
      </span>
    );
  }

  function getProxiedImageUrl(url: string, platform?: string) {
    if (!url) return '';
    if (platform && platform.toLowerCase().includes('instagram')) {
      // Remove protocol for images.weserv.nl
      return `https://images.weserv.nl/?url=${encodeURIComponent(url.replace(/^https?:\/\//, ''))}`;
    }
    // For YouTube thumbnails, we can use a proxy to potentially crop letterboxing
    if (platform && (platform.toLowerCase().includes('youtube') || platform.toLowerCase().includes('video'))) {
      // Use images.weserv.nl with cropping parameters to remove letterboxing
      const cleanUrl = url.replace(/^https?:\/\//, '');
      return `https://images.weserv.nl/?url=${encodeURIComponent(cleanUrl)}&w=1280&h=720&fit=cover&output=jpg`;
    }
    // For TikTok and other portrait content, zoom out to show full image
    if (platform && (platform.toLowerCase().includes('tiktok') || platform.toLowerCase().includes('instagram'))) {
      const cleanUrl = url.replace(/^https?:\/\//, '');
      return `https://images.weserv.nl/?url=${encodeURIComponent(cleanUrl)}&w=1080&h=1920&fit=contain&bg=ffffff&output=jpg`;
    }
    return url;
  }

  function getOpenLinkIcon(url?: string) {
    if (!url) return null;
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute top-2 right-2 z-20 p-1 rounded-full transition-colors bg-white/70 dark:bg-dark-900/70 hover:bg-primary-100/90 dark:hover:bg-primary-700/80 shadow-md flex items-center justify-center group/open-link"
        title="Open original link"
        onClick={e => { e.stopPropagation(); markSeen(); }}
        style={{ boxShadow: '0 2px 8px 0 rgba(0,0,0,0.10)' }}
      >
        <ExternalLink size={22} className="text-dark-700 dark:text-dark-100 group-hover/open-link:text-primary-600 dark:group-hover/open-link:text-primary-300 transition-colors" />
      </a>
    );
  }

  function handleCardClick(e: React.MouseEvent) {
    if (categoryModalOpen || skipNextNavigation) {
      setSkipNextNavigation(false);
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    markSeen();
    // Open the original URL instead of navigating to view page
    if (url) {
      window.open(url, '_blank');
    }
  }

  function handleFavoriteToggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (onFavoriteToggle) {
      onFavoriteToggle(id, !favorite);
    }
  }

  function handleCategoryClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setCategoryModalOpen(true);
  }

  function handleCategorySelect(catId: string) {
    if (catId !== categoryId && onCategoryChange) {
      onCategoryChange(id, catId);
    }
    setCategoryModalOpen(false);
    setSkipNextNavigation(true);
  }

  function handleModalClose(e?: React.MouseEvent) {
    if (e) e.stopPropagation();
    setCategoryModalOpen(false);
    setSkipNextNavigation(true);
  }

  async function handleDeleteEntry() {
    if (!currentUser) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      const idToken = await currentUser.getIdToken();
      // @ts-ignore
      const { deleteEntry, cleanupEmptyCategories, fetchCategories } = await import('../services/api');
      await deleteEntry(idToken, id);
      // Remove from dashboard state
      if (typeof window !== 'undefined' && (window as any).removeEntryFromState) {
        (window as any).removeEntryFromState(id);
      }
      // If this was the last entry in its category, trigger cleanup and update categories
      if (categoryId && categories) {
        const entriesInCategory = (window as any).getEntriesByCategoryId
          ? (window as any).getEntriesByCategoryId(categoryId)
          : null;
        if (!entriesInCategory || entriesInCategory.length <= 1) {
          await cleanupEmptyCategories(idToken);
          if ((window as any).setCategoriesFromOutside) {
            const updatedCats = await fetchCategories(idToken);
            (window as any).setCategoriesFromOutside(updatedCats);
          }
        }
      }
      setShowDeleteModal(false);
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete entry.');
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div
      className="relative block bg-dark-100 dark:bg-dark-800/50 rounded-xl border border-dark-200/80 dark:border-transparent hover:border-primary-500/30 hover:bg-dark-200/50 dark:hover:bg-dark-800 transition-all duration-200 group overflow-hidden min-h-[380px] flex flex-col h-full cursor-pointer"
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
    >
      {/* Thumbnail with overlays */}
      {thumbnail && (
        <div
          className={`relative w-full${platform === 'TikTok Video' ? '' : ''}`}
          style={{
            aspectRatio: (() => {
              const ratio = shouldUseShortsFormat
                ? portraitAspect  // Use YouTube Shorts format for all non-landscape portraits except YouTube Shorts
                : (platform === 'TikTok Video' || platform === 'Instagram Post')
                ? instagramPostAspect
                : isPortrait
                ? portraitAspect
                : landscapeAspect;
              console.log('Aspect Ratio Debug:', { platform, ratio, shouldUseShortsFormat });
              return ratio;
            })(),
            maxHeight: '300px',
            ...(platform === 'TikTok Video' ? { margin: '0 auto' } : {}),
            // Add translucent background for portrait content
            backgroundColor: (platform === 'TikTok Video' || platform === 'Instagram Post') ? 
              (theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.1)') : undefined,
          }}
        >
          {/* Open Link Icon */}
          {getOpenLinkIcon(url)}
          <img
            src={getProxiedImageUrl(thumbnail, platform)}
            alt={title}
            className={`w-full h-full${platform === 'TikTok Video' ? ' rounded-b-xl' : ' rounded-t-xl'}`}
            style={{
              display: 'block',
              width: '100%',
              height: '100%',
              objectFit: (platform === 'TikTok Video' || platform === 'Instagram Post') ? 'contain' : 'cover',
              objectPosition: (platform === 'TikTok Video' || (platform && platform.toLowerCase().includes('instagram'))) ? 'center' : 
                (platform && (platform.toLowerCase().includes('youtube') || platform.toLowerCase().includes('video'))) ? 'center' : undefined,
              borderRadius: platform === 'TikTok Video' ? '0 0 0.75rem 0.75rem' : '0.75rem',
              padding: undefined,
              margin: undefined,
              // For YouTube videos, try to crop out letterboxing by focusing on the center
              ...(platform && (platform.toLowerCase().includes('youtube') || platform.toLowerCase().includes('video')) ? {
                objectPosition: 'center',
                objectFit: 'cover',
              } : {}),
            }}
            loading="lazy"
          />
          {getPlatformIconOverlay(platform, theme)}
          {getFavoriteIconOverlay(favorite)}
          {getCarouselIndicator()}
        </div>
      )}
      {!thumbnail && (
        <div className="relative w-full bg-dark-200 dark:bg-dark-700 rounded-t-xl flex items-center justify-center" style={{ aspectRatio: shouldUseShortsFormat ? portraitAspect : (isPortrait ? portraitAspect : landscapeAspect) }}>
          {/* Open Link Icon */}
          {getOpenLinkIcon(url)}
          {/* Reddit watermark overlay */}
          {platform === 'Reddit Post' && (
            <FaReddit
              size={80}
              className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20 ${theme === 'dark' ? 'text-white' : 'text-black'}`}
              style={{ pointerEvents: 'none' }}
            />
          )}
          {/* X logo for Twitter/X Post */}
          {platform === 'Twitter/X Post' && (
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20" style={{ pointerEvents: 'none' }}>
              <img
                src={theme === 'dark' ? '/x-logo-white.png' : '/x-logo-black.png'}
                alt="X logo watermark"
                style={{ width: 80, height: 80 }}
              />
            </span>
          )}
          {/* TikTok logo for TikTok Video */}
          {platform === 'TikTok Video' && (
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20" style={{ pointerEvents: 'none' }}>
              <img
                src={theme === 'dark' ? '/tiktok-logo-white.png' : '/tiktok-logo-black.png'}
                alt="TikTok logo watermark"
                style={{ width: 120, height: 120 }}
              />
            </span>
          )}
          {getPlatformIconOverlay(platform, theme)}
          {getFavoriteIconOverlay(favorite)}
          {getCarouselIndicator()}
        </div>
      )}
      <div className="flex flex-col flex-1 justify-between h-full">
        <div className="flex-1 p-5 flex flex-col">
          <div className="flex items-start space-x-4 h-full">
            <div className="flex-grow flex flex-col flex-1 min-h-0 h-full">
              <h3 className="font-semibold text-dark-900 dark:text-white mb-1 leading-snug line-clamp-2">{title}</h3>
              {/* Display channel name for YouTube videos, TikTok videos, X posts, but NOT Instagram posts */}
              {platform && ((platform.toLowerCase().includes('youtube') || platform.toLowerCase().includes('video')) || platform.toLowerCase().includes('tiktok') || platform.toLowerCase().includes('twitter') || platform.toLowerCase().includes('x')) && channel && (
                <p className="text-sm text-dark-500 dark:text-dark-400 mb-1 font-medium">
                  {channel}
                </p>
              )}

              <div className="flex-1 min-h-0 flex flex-col">
                <p className={`text-sm text-dark-600 dark:text-dark-400 flex-1 min-h-0 ${expandSummary ? '' : 'line-clamp-2'}`}>
                  {notes}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="pt-4 border-t border-dark-200/80 dark:border-dark-700/50 flex justify-between items-center px-5 pb-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center space-x-2 text-xs text-dark-500 dark:text-dark-400 relative">
          <Folder size={14} />
          <span
            className="font-medium cursor-pointer hover:underline transition-transform duration-150 ease-in-out hover:scale-105"
            onClick={handleCategoryClick}
            tabIndex={0}
            title="Change category"
          >
            {category}
          </span>
          {categoryModalOpen && categories && onCategoryChange && (
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 animate-fade-in-fast"
              onClick={handleModalClose}
            >
              <div
                className="bg-white dark:bg-dark-800 rounded-3xl shadow-2xl w-full max-w-md m-4 px-8 pt-8 pb-6 transform animate-slide-up-fast relative flex flex-col items-center"
                onClick={e => e.stopPropagation()}
                style={{ minHeight: '420px' }}
              >
                <button
                  onClick={handleModalClose}
                  className="absolute top-6 right-6 p-2 rounded-full hover:bg-dark-200 dark:hover:bg-dark-700 transition-colors"
                  title="Close"
                >
                  <svg width="28" height="28" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 6L14 14M14 6L6 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                </button>
                <h3 className="text-2xl font-extrabold text-dark-900 dark:text-white mb-8 text-center tracking-tight">Reassign Category</h3>
                <div className="w-full flex-1 flex flex-col justify-center items-center">
                  <div className="w-full max-h-[320px] overflow-y-auto overscroll-contain custom-scrollbar rounded-2xl bg-transparent">
                    <div className="flex flex-col gap-3">
                      {[...categories].sort((a, b) => a.name.localeCompare(b.name)).map(cat => (
                        <button
                          key={cat.id}
                          className={`w-full text-left px-6 pr-6 py-3 rounded-xl transition-transform duration-150 text-lg font-medium focus:outline-none focus:ring-2 focus:ring-primary-400/60 focus:z-10
                            ${cat.id === categoryId
                              ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-200 font-bold shadow-sm'
                              : 'hover:bg-dark-100 dark:hover:bg-dark-700 text-dark-800 dark:text-dark-100'}
                          `}
                          onClick={() => handleCategorySelect(cat.id)}
                          disabled={cat.id === categoryId}
                          style={{ cursor: cat.id === categoryId ? 'default' : 'pointer' }}
                        >
                          {cat.name}
                          {cat.id === categoryId && <span className="ml-3 text-base font-normal opacity-70">(Current)</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          {seen ? (
            <button
              type="button"
              className="uppercase text-xs font-bold text-green-600 dark:text-green-400 tracking-wider cursor-pointer select-none bg-transparent border-none outline-none focus:outline-none p-0 m-0 transition-transform duration-150 ease-in-out hover:scale-110"
              onClick={e => { e.preventDefault(); e.stopPropagation(); setSeen(false); localStorage.setItem(`entry-seen-${id}`, 'false'); }}
              title="Mark as unseen"
              tabIndex={0}
            >
              SEEN
            </button>
          ) : (
            <button
              type="button"
              className="uppercase text-xs font-bold text-dark-400 dark:text-dark-500 tracking-wider cursor-pointer select-none bg-transparent border-none outline-none focus:outline-none p-0 m-0 transition-transform duration-150 ease-in-out hover:scale-110"
              onClick={e => { e.preventDefault(); e.stopPropagation(); setSeen(true); localStorage.setItem(`entry-seen-${id}`, 'true'); }}
              title="Mark as seen"
              tabIndex={0}
            >
              UNSEEN
            </button>
          )}
          {/* Favorite Toggle Button */}
          <button
            className="p-1 rounded-full bg-white/80 dark:bg-dark-900/80 hover:bg-yellow-100 dark:hover:bg-yellow-900/80 transition-colors shadow-md flex items-center justify-center"
            title={favorite ? "Remove from favorites" : "Add to favorites"}
            onClick={handleFavoriteToggle}
            style={{ boxShadow: '0 2px 8px 0 rgba(0,0,0,0.10)' }}
          >
            <Star 
              size={18} 
              className={`${favorite ? 'text-yellow-500 fill-current' : 'text-white'}`} 
            />
          </button>
          {/* Delete Icon Button - now in bottom bar */}
          <button
            className="p-1 rounded-full bg-white/80 dark:bg-dark-900/80 hover:bg-red-100 dark:hover:bg-red-900/80 transition-colors shadow-md flex items-center justify-center"
            title="Delete entry"
            onClick={e => { e.preventDefault(); e.stopPropagation(); setShowDeleteModal(true); }}
            style={{ boxShadow: '0 2px 8px 0 rgba(0,0,0,0.10)' }}
          >
            <Trash2 size={18} className="text-white" />
          </button>
        </div>
        </div>
      </div>
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 animate-fade-in-fast" onClick={() => setShowDeleteModal(false)}>
          <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-2xl w-full max-w-md m-8 p-6 transform animate-slide-up-fast" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-500/10 rounded-full flex items-center justify-center">
                <Trash2 size={24} className="text-red-500" />
              </div>
              <h2 className="text-xl font-bold text-dark-900 dark:text-white">Delete Entry?</h2>
            </div>
            <p className="text-sm text-dark-600 dark:text-dark-300 mb-4">Are you sure you want to permanently delete "{title}"? This action cannot be undone.</p>
            {deleteError && <div className="bg-red-500/10 text-red-500 dark:text-red-400 p-3 rounded-lg text-sm mb-3">{deleteError}</div>}
            <div className="flex justify-end gap-3 mt-6">
              <button
                className="px-4 py-2 rounded-full border border-dark-200 dark:border-dark-700 text-dark-700 dark:text-dark-300 hover:bg-dark-50 dark:hover:bg-dark-700/50 transition-colors"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-60"
                onClick={handleDeleteEntry}
                disabled={deleteLoading}
              >
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentCard;
