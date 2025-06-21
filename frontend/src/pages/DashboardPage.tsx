import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, User as UserIcon, ChevronRight } from 'lucide-react';
import Logo from '../components/Logo';
import Button from '../components/Button';
import { useAuth } from '../contexts/AuthContext';
import ContentCard from '../components/ContentCard';

// Flatten and sort mock data to simulate a chronological feed
const mockData = [
  { id: '1', title: 'The Science of Building Better Habits', platform: 'youtube', url: 'https://youtube.com/watch?v=example', savedDate: '2024-07-22', notes: 'Excellent breakdown of habit formation psychology', category: 'productivity' },
  { id: '5', title: 'Investment Strategies for Beginners', platform: 'youtube', url: 'https://youtube.com/watch?v=example2', savedDate: '2024-07-22', notes: 'Comprehensive guide to getting started', category: 'finance' },
  { id: '2', title: 'Deep Work: How to Focus in a Distracted World', platform: 'reddit', url: 'https://reddit.com/r/productivity/example', savedDate: '2024-07-21', notes: 'Great discussion on maintaining focus', category: 'productivity' },
  { id: '8', title: 'The Science of Sleep and Recovery', platform: 'youtube', url: 'https://youtube.com/watch?v=example3', savedDate: '2024-07-20', notes: 'Evidence-based approach to better sleep', category: 'health' },
  { id: '12', title: 'The Future of AI and Machine Learning', platform: 'youtube', url: 'https://youtube.com/watch?v=example4', savedDate: '2024-07-18', notes: 'Fascinating predictions about AI development', category: 'tech' },
  { id: '3', title: 'Time Blocking Method for Maximum Productivity', platform: 'instagram', url: 'https://instagram.com/p/example', savedDate: '2024-07-15', notes: 'Visual guide to time management', category: 'productivity' },
  { id: '9', title: 'Mindfulness and Mental Health', platform: 'reddit', url: 'https://reddit.com/r/meditation/example', savedDate: '2024-07-14', notes: 'Community discussion on meditation benefits', category: 'health' },
  { id: '6', title: 'Understanding Cryptocurrency Markets', platform: 'reddit', url: 'https://reddit.com/r/investing/example2', savedDate: '2024-07-12', notes: 'Detailed analysis of crypto market trends', category: 'finance' },
];

// Helper to group items by category
const groupContentByCategory = (items: typeof mockData) => {
  const groups: { [key: string]: typeof mockData } = {};
  items.forEach(item => {
    const key = item.category;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
  });

  // Sort categories for consistent order
  const sortedGroups: { [key:string]: typeof mockData } = {};
  Object.keys(groups).sort().forEach(key => {
    sortedGroups[key] = groups[key];
  });

  return sortedGroups;
};

const DashboardPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredData = mockData.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.notes.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedContent = groupContentByCategory(filteredData);

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 text-white">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-dark-900/30 backdrop-blur-xl border-b border-dark-800/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/dashboard">
              <Logo size="sm" />
            </Link>
            <div className="flex items-center space-x-2">
              <Link to="/save" className="flex items-center space-x-2 px-4 py-2 rounded-full bg-dark-800/50 hover:bg-dark-700/70 transition-colors duration-200">
                <Plus size={18} />
                <span className="font-medium text-sm">Save Content</span>
              </Link>
              <Link to="/account" className="flex items-center space-x-2 pl-3 pr-2 py-2 rounded-full bg-dark-800/50 hover:bg-dark-700/70 transition-colors duration-200">
                <UserIcon size={20} className="text-dark-300" />
                <span className="text-white font-medium text-sm hidden sm:block">{currentUser?.email}</span>
                <ChevronRight size={16} className="text-dark-300" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div>
          {/* Page Header */}
          <div className="mb-10">
            <h1 className="text-5xl font-bold mb-2" style={{ textShadow: '0 0 15px rgba(14, 165, 233, 0.4)' }}>Your Vault</h1>
            <p className="text-dark-400 text-lg">Your saved knowledge, organized by topic.</p>
          </div>

          {/* Search Bar */}
          <div className="mb-12">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-purple-600 rounded-full blur-md opacity-50 group-hover:opacity-75 transition duration-300"></div>
              <div className="relative bg-dark-800/50 border border-dark-700/60 rounded-full shadow-lg">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-dark-400" size={20} />
                <input
                  type="text"
                  placeholder="Search by keyword, topic, or platform..."
                  className="w-full bg-transparent py-3 pl-14 pr-6 text-white placeholder-dark-400 focus:outline-none"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Content Feed */}
          <div className="space-y-16">
            {Object.keys(groupedContent).length > 0 ? (
              Object.entries(groupedContent).map(([category, items]) => (
                <section key={category}>
                  <h2 className="text-2xl font-bold text-white mb-6 capitalize">{category}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {items.map((item) => (
                      <ContentCard key={item.id} item={item} />
                    ))}
                  </div>
                </section>
              ))
            ) : (
              <div className="text-center py-16">
                <p className="text-xl text-dark-400">No results found for "{searchQuery}"</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
