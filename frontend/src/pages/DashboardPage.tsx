import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ChevronDown, ChevronRight, Calendar, ExternalLink, Youtube, MessageCircle, Instagram, Twitter, TrendingUp, Heart, Cpu, DollarSign } from 'lucide-react';
import Logo from '../components/Logo';
import Button from '../components/Button';
import Card from '../components/Card';

// Mock data organized by categories
const mockData = {
  productivity: [
    {
      id: '1',
      title: 'The Science of Building Better Habits',
      platform: 'youtube',
      url: 'https://youtube.com/watch?v=example',
      savedDate: '2024-01-15',
      notes: 'Excellent breakdown of habit formation psychology'
    },
    {
      id: '2',
      title: 'Deep Work: How to Focus in a Distracted World',
      platform: 'reddit',
      url: 'https://reddit.com/r/productivity/example',
      savedDate: '2024-01-14',
      notes: 'Great discussion on maintaining focus'
    },
    {
      id: '3',
      title: 'Time Blocking Method for Maximum Productivity',
      platform: 'instagram',
      url: 'https://instagram.com/p/example',
      savedDate: '2024-01-13',
      notes: 'Visual guide to time management'
    },
    {
      id: '4',
      title: 'Morning Routine of Successful Entrepreneurs',
      platform: 'twitter',
      url: 'https://twitter.com/example/status/123',
      savedDate: '2024-01-12',
      notes: 'Inspiring thread about morning habits'
    }
  ],
  finance: [
    {
      id: '5',
      title: 'Investment Strategies for Beginners',
      platform: 'youtube',
      url: 'https://youtube.com/watch?v=example2',
      savedDate: '2024-01-11',
      notes: 'Comprehensive guide to getting started with investing'
    },
    {
      id: '6',
      title: 'Understanding Cryptocurrency Markets',
      platform: 'reddit',
      url: 'https://reddit.com/r/investing/example2',
      savedDate: '2024-01-10',
      notes: 'Detailed analysis of crypto market trends'
    },
    {
      id: '7',
      title: 'Personal Finance Tips for 2024',
      platform: 'instagram',
      url: 'https://instagram.com/p/example2',
      savedDate: '2024-01-09',
      notes: 'Practical budgeting and saving strategies'
    }
  ],
  health: [
    {
      id: '8',
      title: 'The Science of Sleep and Recovery',
      platform: 'youtube',
      url: 'https://youtube.com/watch?v=example3',
      savedDate: '2024-01-08',
      notes: 'Evidence-based approach to better sleep'
    },
    {
      id: '9',
      title: 'Mindfulness and Mental Health',
      platform: 'reddit',
      url: 'https://reddit.com/r/meditation/example',
      savedDate: '2024-01-07',
      notes: 'Community discussion on meditation benefits'
    },
    {
      id: '10',
      title: 'Nutrition Myths Debunked',
      platform: 'twitter',
      url: 'https://twitter.com/example2/status/456',
      savedDate: '2024-01-06',
      notes: 'Science-backed nutrition facts'
    },
    {
      id: '11',
      title: 'Home Workout Routines That Actually Work',
      platform: 'instagram',
      url: 'https://instagram.com/p/example3',
      savedDate: '2024-01-05',
      notes: 'Effective exercises for small spaces'
    }
  ],
  tech: [
    {
      id: '12',
      title: 'The Future of AI and Machine Learning',
      platform: 'youtube',
      url: 'https://youtube.com/watch?v=example4',
      savedDate: '2024-01-04',
      notes: 'Fascinating predictions about AI development'
    },
    {
      id: '13',
      title: 'Web3 and Decentralized Internet',
      platform: 'reddit',
      url: 'https://reddit.com/r/technology/example',
      savedDate: '2024-01-03',
      notes: 'Technical discussion on blockchain applications'
    },
    {
      id: '14',
      title: 'Cybersecurity Best Practices for 2024',
      platform: 'twitter',
      url: 'https://twitter.com/example3/status/789',
      savedDate: '2024-01-02',
      notes: 'Essential security tips for individuals'
    }
  ]
};

const platformIcons = {
  youtube: Youtube,
  reddit: MessageCircle,
  instagram: Instagram,
  twitter: Twitter
};

const platformColors = {
  youtube: 'bg-red-600',
  reddit: 'bg-orange-600',
  instagram: 'bg-pink-600',
  twitter: 'bg-blue-600'
};

const categoryIcons = {
  productivity: TrendingUp,
  finance: DollarSign,
  health: Heart,
  tech: Cpu
};

const categoryColors = {
  productivity: 'from-blue-600 to-blue-700',
  finance: 'from-green-600 to-green-700',
  health: 'from-pink-600 to-pink-700',
  tech: 'from-purple-600 to-purple-700'
};

const DashboardPage: React.FC = () => {
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/5 rounded-full blur-3xl animate-pulse-subtle"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl animate-pulse-subtle" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/3 rounded-full blur-3xl animate-pulse-subtle" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Header */}
      <div className="relative z-10 bg-dark-900/30 backdrop-blur-xl border-b border-dark-800/50">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Logo size="sm" />
            <Link to="/save">
              <Button className="flex items-center space-x-2 transform hover:scale-105 transition-all duration-200">
                <Plus size={18} />
                <span>Save Content</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-8">
        {/* Categories */}
        <div className="space-y-6">
          {Object.entries(mockData).map(([category, entries], index) => {
            const isExpanded = expandedCategories.includes(category);
            const CategoryIcon = categoryIcons[category as keyof typeof categoryIcons];
            const gradientClass = categoryColors[category as keyof typeof categoryColors];

            return (
              <div
                key={category}
                className="animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full flex items-center justify-between p-6 bg-dark-900/40 backdrop-blur-xl rounded-2xl border border-dark-800/30 hover:border-dark-700/50 hover:bg-dark-900/60 transition-all duration-500 group transform hover:scale-[1.02] hover:shadow-2xl"
                >
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-r ${gradientClass} shadow-lg transform group-hover:scale-110 transition-transform duration-300`}>
                      <CategoryIcon size={24} className="text-white" />
                    </div>
                    <div className="text-left">
                      <h2 className="text-2xl font-bold text-white capitalize group-hover:text-gray-100 transition-colors duration-300">
                        {category}
                      </h2>
                      <p className="text-dark-400 group-hover:text-dark-300 transition-colors duration-300">
                        {entries.length} item{entries.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className="transform group-hover:scale-110 transition-transform duration-300">
                      {isExpanded ? (
                        <ChevronDown size={24} className="text-dark-400 group-hover:text-dark-200 transition-colors duration-200" />
                      ) : (
                        <ChevronRight size={24} className="text-dark-400 group-hover:text-dark-200 transition-colors duration-200" />
                      )}
                    </div>
                  </div>
                </button>

                {/* Category Content */}
                {isExpanded && (
                  <div className="mt-4 space-y-3 animate-slide-down">
                    {entries.map((entry, entryIndex) => {
                      const PlatformIcon = platformIcons[entry.platform as keyof typeof platformIcons];
                      const platformColor = platformColors[entry.platform as keyof typeof platformColors];

                      return (
                        <div
                          key={entry.id}
                          className="animate-slide-up"
                          style={{ animationDelay: `${entryIndex * 0.05}s` }}
                        >
                          <Card hover className="overflow-hidden transform hover:scale-[1.01] transition-all duration-300">
                            <div className="flex items-center p-6">
                              {/* Platform Icon */}
                              <div className={`flex-shrink-0 w-16 h-16 ${platformColor} rounded-xl flex items-center justify-center mr-6 shadow-lg transform hover:scale-110 hover:rotate-3 transition-all duration-300`}>
                                <PlatformIcon size={28} className="text-white" />
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-white text-lg mb-2 line-clamp-1 hover:text-gray-100 transition-colors duration-200">
                                  {entry.title}
                                </h3>

                                <p className="text-sm text-dark-400 mb-3 line-clamp-2 hover:text-dark-300 transition-colors duration-200">
                                  {entry.notes}
                                </p>

                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2 text-xs text-dark-500">
                                    <Calendar size={14} />
                                    <span>{entry.savedDate}</span>
                                  </div>

                                  <Link
                                    to={`/view/${entry.id}`}
                                    className="inline-flex items-center text-sm font-medium text-primary-400 hover:text-primary-300 transition-all duration-200 transform hover:scale-105"
                                  >
                                    Open
                                    <ExternalLink size={14} className="ml-1 transform group-hover:translate-x-1 transition-transform duration-200" />
                                  </Link>
                                </div>
                              </div>
                            </div>
                          </Card>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
