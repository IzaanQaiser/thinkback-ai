import React from 'react';
import { Link } from 'react-router-dom';
import { Folder, ArrowRight, Star, Images } from 'lucide-react';
import { FaYoutube, FaReddit, FaTwitter, FaInstagram, FaTiktok } from 'react-icons/fa';
import { useTheme } from '../contexts/ThemeContext';

interface ContentCardProps {
    id: string;
    title: string;
    url: string;
  notes?: string;
  summary?: string;
  tags?: string[];
  favorite?: boolean;
  createdAt?: string;
    category: string;
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

const ContentCard: React.FC<ContentCardProps> = ({ id, title, notes, summary, tags, favorite, category, thumbnail, platform, isCarousel, carouselCount, description }) => {
  const { theme } = useTheme();
  const isPortrait = portraitPlatforms.includes(platform || '');
  // For portrait platforms, use a taller aspect ratio (9/12) but do NOT set minHeight, so the card size stays consistent.
  const portraitAspect = '9/8';
  const landscapeAspect = '16/9';

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
        return <span className={baseClass}><FaReddit size={size} className="text-orange-500" /></span>;
      case 'Twitter/X Post':
        return <span className={baseClass}><FaTwitter size={size} className="text-sky-500" /></span>;
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

  return (
    <Link
      to={`/view/${id}`}
      className="relative block bg-dark-100 dark:bg-dark-800/50 rounded-xl border border-dark-200/80 dark:border-transparent hover:border-primary-500/30 hover:bg-dark-200/50 dark:hover:bg-dark-800 transition-all duration-200 group overflow-hidden min-h-[380px] flex flex-col"
    >
      {/* Thumbnail with overlays */}
      {thumbnail && (
        <div className="relative w-full" style={{ aspectRatio: isPortrait ? portraitAspect : landscapeAspect }}>
          <img
            src={getProxiedImageUrl(thumbnail, platform)}
            alt={title}
            className="w-full h-full object-cover rounded-t-xl"
            style={{ display: 'block' }}
            loading="lazy"
          />
          {getPlatformIconOverlay(platform, theme)}
          {getFavoriteIconOverlay(favorite)}
          {getCarouselIndicator()}
        </div>
      )}
      {!thumbnail && (
        <div className="relative w-full bg-dark-200 dark:bg-dark-700 rounded-t-xl flex items-center justify-center" style={{ aspectRatio: isPortrait ? portraitAspect : landscapeAspect }}>
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
        <div className="pt-4 border-t border-dark-200/80 dark:border-dark-700/50 flex justify-between items-center px-5 pb-5">
        <div className="flex items-center space-x-2 text-xs text-dark-500 dark:text-dark-400">
          <Folder size={14} />
            <span className="font-medium">{category}</span>
            {tags && tags.length > 0 && (
              <span className="ml-2 flex flex-wrap gap-1">
                <span className="px-2 py-0.5 bg-primary-100/60 dark:bg-dark-800/60 text-primary-800 dark:text-primary-300 rounded-full text-xs font-semibold border border-primary-200/50 dark:border-dark-700/80">#{tags[0]}</span>
              </span>
            )}
        </div>
        <div className="text-xs font-semibold text-primary-500/80 dark:text-primary-400/80 group-hover:text-primary-500 dark:group-hover:text-primary-400 transition-colors">
          <ArrowRight size={16} className="transform group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ContentCard;
