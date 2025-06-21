import React from 'react';
import { Link } from 'react-router-dom';
import { Youtube, MessageCircle, Instagram, Twitter, TrendingUp, Heart, Cpu, DollarSign, ExternalLink } from 'lucide-react';

const platformIcons: { [key: string]: React.ElementType } = {
  youtube: Youtube,
  reddit: MessageCircle,
  instagram: Instagram,
  twitter: Twitter,
};

const categoryIcons: { [key: string]: React.ElementType } = {
  productivity: TrendingUp,
  finance: DollarSign,
  health: Heart,
  tech: Cpu,
};

const categoryColors: { [key: string]: string } = {
    productivity: 'text-blue-400',
    finance: 'text-green-400',
    health: 'text-pink-400',
    tech: 'text-purple-400',
};

type ContentCardProps = {
  item: {
    id: string;
    title: string;
    platform: string;
    url: string;
    notes: string;
    category: string;
  };
};

const ContentCard: React.FC<ContentCardProps> = ({ item }) => {
  const PlatformIcon = platformIcons[item.platform] || ExternalLink;
  const CategoryIcon = categoryIcons[item.category] || TrendingUp;
  const categoryColor = categoryColors[item.category] || 'text-gray-400';

  return (
    <Link to={`/view/${item.id}`} className="block group">
      <div className="bg-dark-800/50 border border-dark-700/60 rounded-xl p-6 h-full flex flex-col transition-all duration-300 group-hover:border-dark-600 group-hover:bg-dark-800/80 group-hover:scale-[1.03] group-hover:shadow-2xl group-hover:shadow-primary-500/5">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <CategoryIcon size={18} className={categoryColor} />
            <span className={`font-semibold text-sm capitalize ${categoryColor}`}>{item.category}</span>
          </div>
          <PlatformIcon size={20} className="text-dark-500 group-hover:text-white transition-colors" />
        </div>

        {/* Content */}
        <div className="flex-grow">
          <h3 className="font-bold text-lg text-white mb-2 line-clamp-2 leading-snug">
            {item.title}
          </h3>
          <p className="text-dark-400 text-sm line-clamp-3 leading-relaxed">
            {item.notes}
          </p>
        </div>

        {/* Footer */}
        <div className="mt-6">
            <div className="text-primary-400/80 group-hover:text-primary-300 flex items-center text-sm font-medium transition-colors">
                <span>View Content</span>
                <ExternalLink size={16} className="ml-2 transform group-hover:translate-x-1 transition-transform" />
            </div>
        </div>
      </div>
    </Link>
  );
};

export default ContentCard;
