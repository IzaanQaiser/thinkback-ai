import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Folder, Star, Images, ExternalLink } from 'lucide-react';
import { FaYoutube, FaReddit, FaInstagram, FaTiktok } from 'react-icons/fa';
import { useTheme } from '../contexts/ThemeContext';

interface ContentCardProps {
    id: string;
    title: string;
    url: string;
  notes?: string;
  summary?: string;
  favorite?: boolean;
  createdAt?: string;
    category: string;
  categoryId?: string;
  categories?: { id: string; name: string }[];
  onCategoryChange?: (entryId: string, newCategoryId: string) => void;
  thumbnail?: string;
  platform?: string;
  isCarousel?: boolean;
  carouselCount?: number;
  description?: string;
}

const portraitPlatforms = [
  'YouTube Shorts',
  'Instagram Reel',
  'TikTok Video',
];

const ContentCard: React.FC<ContentCardProps> = ({ id, title, notes, summary, favorite, category, categoryId, categories, onCategoryChange, thumbnail, platform, isCarousel, carouselCount, description, url }) => {
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

  const isPortrait = portraitPlatforms.includes(platform || '');
  // For portrait platforms, use a taller aspect ratio (9/8) but do NOT set minHeight, so the card size stays consistent.
  const portraitAspect = '9/8';
  const landscapeAspect = '16/9';
  // Instagram post aspect ratio (used for cropping TikTok thumbnails to match Instagram post size)
  const instagramPostAspect = '1/1'; // square aspect ratio for Instagram posts

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
        return <span className={baseClass}><svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-blue-700"><rect width="24" height="24" rx="4" fill="currentColor"/><path d="M7.5 9.5V16.5M7.5 7.5V7.51M12 12.5V16.5M12 12.5C12 11.3954 12.8954 10.5 14 10.5C15.1046 10.5 16 11.3954 16 12.5V16.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></span>;
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
    navigate(`/view/${id}`);
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

  return (
    <div
      className="relative block bg-dark-100 dark:bg-dark-800/50 rounded-xl border border-dark-200/80 dark:border-transparent hover:border-primary-500/30 hover:bg-dark-200/50 dark:hover:bg-dark-800 transition-all duration-200 group overflow-hidden min-h-[380px] flex flex-col cursor-pointer"
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
    >
      {/* Thumbnail with overlays */}
      {thumbnail && (
        <div
          className={`relative w-full${platform === 'TikTok Video' ? '' : ''}`}
          style={{
            aspectRatio:
              (platform === 'TikTok Video' || (platform && platform.toLowerCase().includes('instagram')))
                ? instagramPostAspect
                : isPortrait
                ? portraitAspect
                : landscapeAspect,
            ...(platform === 'TikTok Video' ? { maxWidth: '430px', maxHeight: '430px', margin: '0 auto' } : {}),
          }}
        >
          {/* Open Link Icon */}
          {getOpenLinkIcon(url)}
          <img
            src={getProxiedImageUrl(thumbnail, platform)}
            alt={title}
            className={`w-full h-full object-cover${platform === 'TikTok Video' ? ' rounded-b-xl' : ' rounded-t-xl'}`}
            style={{
              display: 'block',
              width: platform === 'TikTok Video' ? '430px' : '100%',
              height: platform === 'TikTok Video' ? '430px' : '100%',
              objectFit: 'cover',
              objectPosition: (platform === 'TikTok Video' || (platform && platform.toLowerCase().includes('instagram'))) ? 'center' : undefined,
              borderRadius: platform === 'TikTok Video' ? '0 0 0.75rem 0.75rem' : '0.75rem',
              padding: undefined,
              margin: undefined,
            }}
            loading="lazy"
          />
          {getPlatformIconOverlay(platform, theme)}
          {getFavoriteIconOverlay(favorite)}
          {getCarouselIndicator()}
        </div>
      )}
      {!thumbnail && (
        <div className="relative w-full bg-dark-200 dark:bg-dark-700 rounded-t-xl flex items-center justify-center" style={{ aspectRatio: isPortrait ? portraitAspect : landscapeAspect }}>
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
          {getPlatformIconOverlay(platform, theme)}
          {getFavoriteIconOverlay(favorite)}
          {getCarouselIndicator()}
        </div>
      )}
      <div className="flex flex-col flex-1 justify-between h-full">
        <div className="flex-1 p-5">
      <div className="flex items-start space-x-4">
            <div className="flex-grow">
              <h3 className="font-semibold text-dark-900 dark:text-white mb-1 leading-snug line-clamp-3">{title}</h3>
              {platform && platform.toLowerCase().includes('instagram') && description && (
                <p className="text-sm text-dark-600 dark:text-dark-400 line-clamp-2 mb-1">
                  {description}
                </p>
              )}
              <p className="text-sm text-dark-600 dark:text-dark-400 line-clamp-2">
                {summary || notes}
              </p>
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
        <div>
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
        </div>
        </div>
      </div>
    </div>
  );
};

export default ContentCard;
