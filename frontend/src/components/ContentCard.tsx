import React from 'react';
import { Link } from 'react-router-dom';
import { Folder, ArrowRight, Star } from 'lucide-react';

interface ContentCardProps {
  id: string;
  title: string;
  url: string;
  notes?: string;
  tags?: string[];
  favorite?: boolean;
  createdAt?: string;
  category: string;
}

const ContentCard: React.FC<ContentCardProps> = ({ id, title, url, notes, tags, favorite, createdAt, category }) => {
  return (
    <Link
      to={`/view/${id}`}
      className="block bg-dark-100 dark:bg-dark-800/50 p-5 rounded-xl border border-dark-200/80 dark:border-transparent hover:border-primary-500/30 hover:bg-dark-200/50 dark:hover:bg-dark-800 transition-all duration-200 group"
    >
      <div className="flex flex-col h-full justify-between">
        <div>
          <div className="flex items-start space-x-4">
            <div className="flex-grow">
              <h3 className="font-semibold text-dark-900 dark:text-white mb-1 leading-snug">{title}</h3>
              <p className="text-sm text-dark-600 dark:text-dark-400 line-clamp-2">{notes}</p>
            </div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-dark-200/80 dark:border-dark-700/50 flex justify-between items-center">
          <div className="flex items-center space-x-2 text-xs text-dark-500 dark:text-dark-400">
            <Folder size={14} />
            <span className="font-medium">{category}</span>
            {tags && tags.length > 0 && (
              <span className="ml-2 flex flex-wrap gap-1">
                <span className="px-2 py-0.5 bg-primary-100/60 dark:bg-dark-800/60 text-primary-800 dark:text-primary-300 rounded-full text-xs font-semibold border border-primary-200/50 dark:border-dark-700/80">#{tags[0]}</span>
                {favorite && (
                  <span className="px-2 py-0.5 bg-yellow-50 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-200 rounded-full text-xs font-semibold border border-yellow-400/70 dark:border-yellow-700/80 ml-1">favorite</span>
                )}
              </span>
            )}
            {/* If no tags, show favorite tag alone */}
            {(!tags || tags.length === 0) && favorite && (
              <span className="ml-2 flex flex-wrap gap-1">
                <span className="px-2 py-0.5 bg-yellow-50 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-200 rounded-full text-xs font-semibold border border-yellow-400/70 dark:border-yellow-700/80">favorite</span>
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
