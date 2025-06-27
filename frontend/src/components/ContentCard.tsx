import React from 'react';
import { Link } from 'react-router-dom';
import { Folder, ArrowRight, Star } from 'lucide-react';
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
}

function getPlatformIcon(platform?: string) {
  if (!platform) return null;
  const size = 16;
  switch (platform) {
    case 'YouTube Video':
    case 'YouTube Shorts':
      return <FaYoutube size={size} className="text-red-500" title="YouTube" />;
    case 'Reddit Post':
      return <FaReddit size={size} className="text-orange-500" title="Reddit" />;
    case 'Twitter/X Post':
      return <FaTwitter size={size} className="text-sky-500" title="Twitter/X" />;
    case 'Instagram Reel':
    case 'Instagram Post':
      return <FaInstagram size={size} className="text-pink-500" title="Instagram" />;
    case 'TikTok Video':
      return <FaTiktok size={size} className="text-black dark:text-white" title="TikTok" />;
    case 'LinkedIn Post':
    case 'LinkedIn Job':
      return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-blue-700" title="LinkedIn"><rect width="24" height="24" rx="4" fill="currentColor"/><path d="M7.5 9.5V16.5M7.5 7.5V7.51M12 12.5V16.5M12 12.5C12 11.3954 12.8954 10.5 14 10.5C15.1046 10.5 16 11.3954 16 12.5V16.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;
    default:
      return null;
  }
}

const ContentCard: React.FC<ContentCardProps> = ({ id, title, url, notes, summary, tags, favorite, createdAt, category, thumbnail, platform }) => {
  const { theme } = useTheme ? useTheme() : { theme: 'light' };
  function getPlatformIconOverlay(platform?: string) {
    if (!platform) return null;
    const size = 22;
    const baseClass =
      'absolute top-2 left-2 z-10 rounded-full p-1 bg-white/60 dark:bg-dark-900/60 shadow-md flex items-center justify-center';
    const iconClass = theme === 'dark' ? 'text-white' : 'text-black';
    switch (platform) {
      case 'YouTube Video':
      case 'YouTube Shorts':
        return <span className={baseClass}><FaYoutube size={size} className={iconClass} title="YouTube" /></span>;
      case 'Reddit Post':
        return <span className={baseClass}><FaReddit size={size} className={iconClass} title="Reddit" /></span>;
      case 'Twitter/X Post':
        return <span className={baseClass}><FaTwitter size={size} className={iconClass} title="Twitter/X" /></span>;
      case 'Instagram Reel':
      case 'Instagram Post':
        return <span className={baseClass}><FaInstagram size={size} className={iconClass} title="Instagram" /></span>;
      case 'TikTok Video':
        return <span className={baseClass}><FaTiktok size={size} className={iconClass} title="TikTok" /></span>;
      case 'LinkedIn Post':
      case 'LinkedIn Job':
        return <span className={baseClass}><svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={iconClass} title="LinkedIn"><rect width="24" height="24" rx="4" fill="currentColor"/><path d="M7.5 9.5V16.5M7.5 7.5V7.51M12 12.5V16.5M12 12.5C12 11.3954 12.8954 10.5 14 10.5C15.1046 10.5 16 11.3954 16 12.5V16.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></span>;
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
    return <span className={baseClass}><Star size={size} className={iconClass} title="Favorite" fill={theme === 'dark' ? 'white' : 'black'} /></span>;
  }
  return (
    <Link
      to={`/view/${id}`}
      className="relative block bg-dark-100 dark:bg-dark-800/50 rounded-xl border border-dark-200/80 dark:border-transparent hover:border-primary-500/30 hover:bg-dark-200/50 dark:hover:bg-dark-800 transition-all duration-200 group overflow-hidden min-h-[380px] flex flex-col"
    >
      {/* Platform icon overlay */}
      {getPlatformIconOverlay(platform)}
      {/* Favorite star overlay */}
      {getFavoriteIconOverlay(favorite)}
      {thumbnail && (
        <img
          src={thumbnail}
          alt={title}
          className="w-full h-48 object-cover rounded-t-xl"
          style={{ display: 'block' }}
          loading="lazy"
        />
      )}
      <div className="flex flex-col flex-1 justify-between h-full">
        <div className="flex-1 p-5">
      <div className="flex items-start space-x-4">
            <div className="flex-grow">
              <h3 className="font-semibold text-dark-900 dark:text-white mb-1 leading-snug">{title}</h3>
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
