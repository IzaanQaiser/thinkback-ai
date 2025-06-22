import React from 'react';
import { Link } from 'react-router-dom';
import { Youtube, Rss, Instagram, MessageSquare, Folder, ArrowRight } from 'lucide-react';

const platformIcons: { [key: string]: React.ElementType } = {
  youtube: Youtube,
  reddit: Rss,
  instagram: Instagram,
};

interface ContentCardProps {
  item: {
    id: string;
    title: string;
    platform: string;
    url: string;
    notes: string;
    category: string;
  };
}

const ContentCard: React.FC<ContentCardProps> = ({ item }) => {
  const Icon = platformIcons[item.platform] || MessageSquare;

  return (
    <Link
      to={`/view/${item.id}`}
      className="block bg-dark-100 dark:bg-dark-800/50 p-5 rounded-xl border border-dark-200/80 dark:border-transparent hover:border-primary-500/30 hover:bg-dark-200/50 dark:hover:bg-dark-800 transition-all duration-200 group"
    >
      <div className="flex items-start space-x-4">
        <div className="mt-1">
          <Icon className="w-5 h-5 text-dark-500 dark:text-dark-400 group-hover:text-primary-500 dark:group-hover:text-primary-400 transition-colors" />
        </div>
        <div className="flex-grow">
          <h3 className="font-semibold text-dark-900 dark:text-white mb-1 leading-snug">{item.title}</h3>
          <p className="text-sm text-dark-600 dark:text-dark-400 line-clamp-2">{item.notes}</p>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-dark-200/80 dark:border-dark-700/50 flex justify-between items-center">
        <div className="flex items-center space-x-2 text-xs text-dark-500 dark:text-dark-400">
          <Folder size={14} />
          <span className="font-medium">{item.category}</span>
        </div>
        <div className="text-xs font-semibold text-primary-500/80 dark:text-primary-400/80 group-hover:text-primary-500 dark:group-hover:text-primary-400 transition-colors">
          <ArrowRight size={16} className="transform group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </Link>
  );
};

export default ContentCard;
