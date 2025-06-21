import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Plus, Search, User as UserIcon, Sun, Moon, Zap, Clock, Star, LayoutGrid, Folder, Check, X, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import Logo from '../components/Logo';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import ContentCard from '../components/ContentCard';
import Kbd from '../components/Kbd';
import { mockData } from '../data/mockData';

const smartSuggestions = [
  { title: "Feeling unproductive? You saved this a month ago.", icon: Clock, item: mockData[2] },
  { title: "For your morning routine.", icon: Sun, item: mockData[0] },
  { title: "Ready to wind down?", icon: Moon, item: mockData[7] },
  { title: "A spark of inspiration for today.", icon: Zap, item: mockData[4] },
];

const categoryIcons: { [key: string]: React.ElementType } = {
  Productivity: Zap,
  Finance: Folder,
  Health: Moon,
  Tech: Star
};

// --- Helper Functions ---
const groupContentByCategory = (items: typeof mockData) => {
  const groups: { [key: string]: typeof mockData } = { All: items };
  items.forEach(item => {
    const key = item.category;
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  });
  return groups;
};

const DashboardPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [ghostSuggestion, setGhostSuggestion] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const location = useLocation();
  const [isMac, setIsMac] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('For You');

  // State for categories and creation flow
  const allContentGrouped = groupContentByCategory(mockData);
  const initialCategories = ['For You', 'All', ...Object.keys(allContentGrouped).filter(c => c !== 'All').sort()];
  const [categories, setCategories] = useState<string[]>(initialCategories);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // State for category context menu
  const [openMenuCategory, setOpenMenuCategory] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  // --- Effects ---
  useEffect(() => { setIsMac(/(Mac|iPhone|iPod|iPad)/i.test(navigator.platform)); }, []);
  useEffect(() => { if (location.search.includes('focus=search')) searchInputRef.current?.focus(); }, [location]);
  useEffect(() => {
    if (searchQuery) {
      const topSuggestion = mockData
        .map(item => item.title)
        .find(title => title.toLowerCase().startsWith(searchQuery.toLowerCase()) && title.toLowerCase() !== searchQuery.toLowerCase());
      setGhostSuggestion(topSuggestion || '');
    } else {
      setGhostSuggestion('');
    }
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuCategory(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- Handlers ---
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Tab' || e.key === 'ArrowRight' || e.key === 'Enter') && ghostSuggestion) {
      e.preventDefault();
      setSearchQuery(ghostSuggestion);
      setGhostSuggestion('');
    }
  };

  const handleAddNewCategory = () => {
    const trimmedName = newCategoryName.trim();
    if (trimmedName && !categories.find(c => c.toLowerCase() === trimmedName.toLowerCase())) {
      const mainCategories = [...categories.filter(c => c !== 'For You' && c !== 'All'), trimmedName].sort();
      setCategories(['For You', 'All', ...mainCategories]);
      setSelectedCategory(trimmedName);
      setNewCategoryName('');
      setIsCreatingCategory(false);
    }
  };

  const handleMenuClick = (e: React.MouseEvent, category: string) => {
    e.stopPropagation();
    setOpenMenuCategory(openMenuCategory === category ? null : category);
  };

  const handleRename = (category: string) => {
    setEditingCategory(category);
    setEditingCategoryName(category);
    setOpenMenuCategory(null);
  };

  const handleSaveRename = (oldName: string) => {
    const newName = editingCategoryName.trim();
    if (newName && newName !== oldName && !categories.find(c => c.toLowerCase() === newName.toLowerCase())) {
      setCategories(prev => {
        const newCategories = prev.map(c => c === oldName ? newName : c);
        const mainCategories = newCategories.filter(c => c !== 'For You' && c !== 'All').sort();
        return ['For You', 'All', ...mainCategories];
      });
      if (selectedCategory === oldName) {
        setSelectedCategory(newName);
      }
    }
    setEditingCategory(null);
    setEditingCategoryName('');
  };

  const handleDelete = (categoryToDelete: string) => {
    setOpenMenuCategory(null);
    if (window.confirm(`Are you sure you want to delete the "${categoryToDelete}" category?`)) {
      setCategories(prev => prev.filter(c => c !== categoryToDelete));
      if (selectedCategory === categoryToDelete) {
        setSelectedCategory('All');
      }
    }
  };

  const filteredData = mockData.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.notes.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedContent = groupContentByCategory(filteredData);
  const contentToDisplay = selectedCategory === 'All' ? filteredData : groupedContent[selectedCategory] || [];

  return (
    <div className="min-h-screen bg-white dark:bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 text-dark-900 dark:text-white">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-dark-900/30 backdrop-blur-xl border-b border-dark-200/50 dark:border-dark-800/50">
        <div className="max-w-screen-2xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/dashboard"><Logo size="sm" /></Link>
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleTheme}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-dark-100/50 dark:bg-dark-800/50 hover:bg-dark-200/60 dark:hover:bg-dark-700/70 transition-colors duration-200"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-primary-400" />}
              </button>
              <Link to="/save" className="flex items-center space-x-3 px-4 py-2 rounded-full bg-dark-100/50 dark:bg-dark-800/50 hover:bg-dark-200/60 dark:hover:bg-dark-700/70 transition-colors duration-200 text-dark-800 dark:text-white">
                <Plus size={16} /><span className="font-medium text-sm">Save</span><Kbd>{isMac ? '⌘' : 'Ctrl'}+I</Kbd>
              </Link>
              <Link to="/account" className="flex items-center space-x-3 px-4 py-2 rounded-full bg-dark-100/50 dark:bg-dark-800/50 hover:bg-dark-200/60 dark:hover:bg-dark-700/70 transition-colors duration-200">
                <UserIcon size={20} className="text-dark-400 dark:text-dark-300" /><span className="text-dark-800 dark:text-white font-medium text-sm hidden sm:block">{currentUser?.email}</span><Kbd>{isMac ? '⌘' : 'Ctrl'}+M</Kbd>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-screen-2xl mx-auto px-6 py-10">
        {/* Search Header */}
        <div className="mb-8">
          <div className="relative">
            <div className="relative bg-dark-100/50 dark:bg-dark-800/50 border border-dark-200/80 dark:border-dark-700/60 rounded-full shadow-lg flex items-center pr-4">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-dark-500 dark:text-dark-400" size={20} />
              <div className="relative w-full">
                <input ref={searchInputRef} type="text" placeholder="Search your vault..." className="w-full bg-transparent py-3 pl-14 pr-16 text-dark-900 dark:text-white placeholder-dark-500 dark:placeholder-dark-400 focus:outline-none relative z-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={handleKeyDown} autoComplete="off" />
                <div className="absolute inset-y-0 left-0 w-full py-3 pl-14 pr-16 text-dark-400 dark:text-dark-500 pointer-events-none">
                  {ghostSuggestion && (<span><span className="opacity-0">{searchQuery}</span><span>{ghostSuggestion.substring(searchQuery.length)}</span></span>)}
                </div>
              </div>
              <Kbd>{isMac ? '⌘' : 'Ctrl'}+K</Kbd>
            </div>
          </div>
        </div>

        {/* Two-column Layout */}
        <div className="flex space-x-8">
          {/* Left Sidebar */}
          <aside className="w-1/4 xl:w-1/5">
            <div className="sticky top-32">
              <h2 className="text-xs text-dark-500 dark:text-dark-400 font-semibold uppercase tracking-wider mb-3 px-3">Categories</h2>
              <nav className="flex flex-col space-y-1">
                {categories.map(category => {
                  const isActive = selectedCategory === category;
                  const isSpecialCategory = category === 'For You' || category === 'All';
                  const isEditing = editingCategory === category;
                  const Icon = category === 'For You' ? Star : category === 'All' ? LayoutGrid : categoryIcons[category] || Folder;

                  return (
                    <div key={category} className="relative px-3">
                      <button
                        onClick={() => !isEditing && setSelectedCategory(category)}
                        className={`relative flex items-center w-full h-9 rounded-full px-4 transition-colors duration-200 ${isActive ? 'bg-primary-500/10 text-primary-500 dark:text-primary-400' : 'text-dark-600 dark:text-dark-200 hover:bg-dark-100/60 dark:hover:bg-dark-800/60 hover:text-dark-900 dark:hover:text-white'} ${isEditing ? 'bg-dark-200/60 dark:bg-dark-800/60' : ''}`}
                      >
                        <div className="flex items-center space-x-3 text-left w-full">
                          <Icon size={18} className={`flex-shrink-0 ${isActive ? 'text-primary-500 dark:text-primary-400' : 'text-dark-400 dark:text-dark-400'}`} />
                          {isEditing ? (
                             <input
                              type="text"
                              value={editingCategoryName}
                              onChange={(e) => setEditingCategoryName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveRename(category);
                                if (e.key === 'Escape') setEditingCategory(null);
                              }}
                              onBlur={() => handleSaveRename(category)}
                              className="w-full bg-transparent text-sm font-medium focus:outline-none"
                              autoFocus
                            />
                          ) : (
                            <span className="font-medium text-sm flex-grow truncate">{category}</span>
                          )}
                        </div>

                        {!isSpecialCategory && !isEditing && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <button onClick={(e) => handleMenuClick(e, category)} className="p-1 text-dark-500 dark:text-dark-400 hover:text-dark-900 dark:hover:text-white transition-colors">
                              <MoreHorizontal size={16} />
                            </button>
                          </div>
                        )}
                      </button>

                      {openMenuCategory === category && (
                        <div
                          ref={menuRef}
                          className="absolute left-full top-1/2 -translate-y-1/2 ml-2 w-36 bg-dark-100/80 dark:bg-dark-800/80 backdrop-blur-lg border border-dark-200/80 dark:border-dark-700 rounded-xl shadow-lg z-20 p-1"
                        >
                          <button
                            onClick={() => handleRename(category)}
                            className="flex items-center gap-2 w-full text-left p-2 rounded-md text-sm text-dark-600 dark:text-dark-200 hover:text-dark-900 dark:hover:text-white hover:bg-dark-200/70 dark:hover:bg-dark-700 transition-colors"
                          >
                            <Edit size={14} className="text-dark-400" />
                            <span>Rename</span>
                          </button>
                          <button
                            onClick={() => handleDelete(category)}
                            className="flex items-center gap-2 w-full text-left p-2 rounded-md text-sm text-red-500 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={14} />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* New Category Input */}
                <div className="mt-1 px-3">
                  {isCreatingCategory ? (
                    <div className="flex items-center space-x-2 h-9">
                      <input
                        type="text"
                        placeholder="New category..."
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleAddNewCategory() }}
                        className="w-full h-full bg-dark-100 dark:bg-dark-800 text-sm px-4 rounded-full focus:outline-none focus:ring-1 focus:ring-primary-500 transition"
                        autoFocus
                        onBlur={() => { if(!newCategoryName) setIsCreatingCategory(false); }}
                      />
                      <button onClick={handleAddNewCategory} className="p-2 text-primary-500 dark:text-primary-400 hover:text-dark-900 dark:hover:text-white rounded-full hover:bg-dark-200/70 dark:hover:bg-dark-700 transition-colors">
                        <Check size={18} />
                      </button>
                      <button onClick={() => setIsCreatingCategory(false)} className="p-2 text-dark-500 dark:text-dark-400 hover:text-dark-900 dark:hover:text-white rounded-full hover:bg-dark-200/70 dark:hover:bg-dark-700 transition-colors">
                        <X size={18} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsCreatingCategory(true)}
                      className="flex items-center w-full h-9 px-4 rounded-full text-dark-600 dark:text-dark-300 hover:bg-dark-100/60 dark:hover:bg-dark-800/60 hover:text-dark-900 dark:hover:text-white transition-colors duration-200"
                    >
                      <div className="flex items-center space-x-3">
                        <Plus size={18} className="text-dark-400" />
                        <span className="font-medium text-sm">New Category</span>
                      </div>
                    </button>
                  )}
                </div>
              </nav>
            </div>
          </aside>

          {/* Right Content */}
          <main className="w-3/4 xl:w-4/5">
            {selectedCategory === 'For You' ? (
              <div>
                <h2 className="text-2xl font-bold text-dark-900 dark:text-white mb-6">For You</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                  {smartSuggestions.map((suggestion, index) => {
                    const Icon = suggestion.icon;
                    return (
                      <Link to={`/view/${suggestion.item.id}`} key={index} className="bg-dark-100/50 dark:bg-dark-800/50 p-4 rounded-xl flex items-center space-x-4 hover:bg-dark-200/60 dark:hover:bg-dark-700/70 transition-colors duration-200">
                        <Icon className="text-primary-500 dark:text-primary-400 flex-shrink-0" size={20} />
                        <div className="overflow-hidden">
                          <p className="text-sm text-dark-900 dark:text-white truncate">{suggestion.title}</p>
                          <p className="text-xs text-dark-500 dark:text-dark-400 truncate">{suggestion.item.title}</p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
                <div className="border-b border-dark-200 dark:border-dark-800 my-8"></div>
                <h2 className="text-2xl font-bold text-dark-900 dark:text-white mb-6">All Content</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredData.map(item => <ContentCard key={item.id} item={item} />)}
                </div>
              </div>
            ) : (
              <div>
                <h2 className="text-2xl font-bold text-dark-900 dark:text-white mb-6 capitalize">{selectedCategory}</h2>
                {contentToDisplay.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {contentToDisplay.map(item => <ContentCard key={item.id} item={item} />)}
                  </div>
                ) : (
                  <div className="text-center py-16 w-full flex flex-col items-center justify-center space-y-4">
                    {searchQuery ? (
                      <p className="text-xl text-dark-500 dark:text-dark-400">No results found for "{searchQuery}" in this category.</p>
                    ) : (
                      <>
                        <Folder size={48} className="text-dark-300 dark:text-dark-600" />
                        <h3 className="text-xl font-semibold text-dark-600 dark:text-dark-300">This category is empty.</h3>
                        <p className="text-dark-500 dark:text-dark-400 max-w-sm">There's no content here yet. Save something new to see it appear.</p>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
