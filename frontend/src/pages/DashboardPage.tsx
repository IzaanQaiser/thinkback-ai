import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Plus, Search, User as UserIcon, Sun, Moon, Check, Pencil, ExternalLink, Trash2, X, Folder } from 'lucide-react';
import Logo from '../components/Logo';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import ContentCard from '../components/ContentCard';
import Kbd from '../components/Kbd';
import { fetchEntries, fetchCategories, updateCategory, deleteCategory, updateEntry, createCategory, deleteEntry } from '../services/api';

const protectedCategories = ['Recent', 'All', 'Favorites'];

interface Entry {
  id: string;
  url: string;
  title: string;
  notes?: string;
  summary?: string;
  tags?: string[];
  favorite?: boolean;
  created_at?: string;
  collection_ids?: string[];
  category_ids?: string[];
  thumbnail?: string;
  platform?: string;
}

interface Category {
  id: string;
  name: string;
  ai_generated?: boolean;
}

const DashboardPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [committedSearchQuery, setCommittedSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const [isMac, setIsMac] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(sessionStorage.getItem('lastSelectedCategory') || 'Recent');
  const [isCategoryEditMode, setIsCategoryEditMode] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryMap, setCategoryMap] = useState<{ [id: string]: string }>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [addCategoryLoading, setAddCategoryLoading] = useState(false);
  const [isQuickAccessEditMode, setIsQuickAccessEditMode] = useState(false);
  const [quickAccessVisibility, setQuickAccessVisibility] = useState(() => {
    const stored = localStorage.getItem('quickAccessVisibility');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        // fallback to default if parse fails
      }
    }
    return { Recent: true, All: true, Favorites: true };
  });
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedEntryIds, setSelectedEntryIds] = useState<string[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);

  useEffect(() => { setIsMac(/(Mac|iPhone|iPod|iPad)/i.test(navigator.platform)); }, []);
  useEffect(() => { if (location.search.includes('focus=search')) searchInputRef.current?.focus(); }, [location]);
  useEffect(() => {
    document.title = 'thinkback.ai - Dashboard';
    sessionStorage.setItem('lastSelectedCategory', selectedCategory);
  }, [selectedCategory]);

  useEffect(() => {
    const loadEntries = async () => {
      if (!currentUser) return;
      setLoading(true);
      try {
        const idToken = await currentUser.getIdToken();
        const data = await fetchEntries(idToken);
        setEntries(data);
      } catch (error) {
        alert('Failed to load entries: ' + (error as Error).message);
      } finally {
        setLoading(false);
      }
    };
    loadEntries();
  }, [currentUser]);

  // Refresh entries when returning to dashboard
  useEffect(() => {
    const handleFocus = () => {
      if (currentUser) {
        const loadEntries = async () => {
          try {
            const idToken = await currentUser.getIdToken();
            const data = await fetchEntries(idToken);
            setEntries(data);
          } catch (error) {
            console.error('Failed to refresh entries:', error);
          }
        };
        loadEntries();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [currentUser]);

  useEffect(() => {
    const loadCategories = async () => {
      if (!currentUser) return;
      try {
        const idToken = await currentUser.getIdToken();
        const cats = await fetchCategories(idToken);
        setCategories(cats);
        const map: { [id: string]: string } = {};
        cats.forEach((cat: Category) => { map[cat.id] = cat.name; });
        setCategoryMap(map);
      } catch (error) {
        // fallback to protectedCategories if error
        setCategories(protectedCategories.map((name) => ({ id: name, name })));
      }
    };
    loadCategories();
  }, [currentUser]);

  // Main dashboard results use committedSearchQuery
  const filteredData = entries.filter(item =>
    item.title && item.title.toLowerCase().includes(committedSearchQuery.toLowerCase())
  );

  // Get suggestions for autosuggest dropdown
  const getSuggestions = () => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase();
    return entries
      .filter(item =>
        item.title && item.title.toLowerCase().includes(query) ||
        item.notes && item.notes.toLowerCase().includes(query) ||
        item.tags && item.tags.some(tag => tag.toLowerCase().includes(query))
      )
      .slice(0, 5); // Limit to 5 suggestions
  };

  const suggestions = getSuggestions();

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node) &&
          searchInputRef.current && !searchInputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showSuggestions || suggestions.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedSuggestionIndex(prev =>
            prev < suggestions.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedSuggestionIndex(prev =>
            prev > 0 ? prev - 1 : suggestions.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedSuggestionIndex >= 0 && selectedSuggestionIndex < suggestions.length) {
            handleSuggestionClick(suggestions[selectedSuggestionIndex]);
          }
          break;
        case 'Escape':
          setShowSuggestions(false);
          setSelectedSuggestionIndex(-1);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showSuggestions, suggestions, selectedSuggestionIndex]);

  const sidebarCategories: Category[] = [
    ...protectedCategories.map((name) => ({ id: name, name, ai_generated: false })),
    ...categories.filter((cat: Category) => !protectedCategories.includes(cat.name) && cat.name.trim().toLowerCase() !== 'uncategorized'),
  ];

  let mainHeading = '';
  let entriesToShow: Entry[] = [];
  if (selectedCategory === 'Favorites') {
    mainHeading = 'Favorites';
    entriesToShow = filteredData.filter((item) => item.favorite);
  } else if (selectedCategory === 'Recent') {
    mainHeading = 'Recent';
    const now = new Date();
    entriesToShow = filteredData.filter((item) => {
      if (!item.created_at) return false;
      const createdAt = new Date(item.created_at);
      const diffMs = now.getTime() - createdAt.getTime();
      return diffMs <= 24 * 60 * 60 * 1000; // 24 hours
    });
  } else if (protectedCategories.includes(selectedCategory)) {
    mainHeading = selectedCategory;
    entriesToShow = filteredData;
  } else {
    const cat = categories.find((c: Category) => c.id === selectedCategory);
    mainHeading = cat ? cat.name : '';
    entriesToShow = filteredData.filter((item) => item.category_ids && item.category_ids.includes(selectedCategory));
  }

  const ensureUncategorized = async () => {
    let uncategorized = categories.find((cat: Category) => cat.name.trim().toLowerCase() === 'uncategorized');
    if (!uncategorized && currentUser) {
      const idToken = await currentUser.getIdToken();
      // Create 'Uncategorized' category
      await updateCategory(idToken, '', 'Uncategorized'); // backend will create if not exists
      const cats = await fetchCategories(idToken);
      uncategorized = cats.find((cat: Category) => cat.name.trim().toLowerCase() === 'uncategorized');
      setCategories(cats);
    }
    return uncategorized?.id;
  };

  // Update committedSearchQuery only on search submit
  const handleSearchInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setCommittedSearchQuery(searchQuery);
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowSuggestions(value.length > 0);
    setSelectedSuggestionIndex(-1);
  };

  const handleSuggestionClick = (entry: Entry) => {
    setSearchQuery('');
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
    navigate(`/view/${entry.id}`);
  };

  const handleDeleteCategory = async (category: Category) => {
    if (!currentUser) return;

    try {
      const idToken = await currentUser.getIdToken();
      const deleteResult = await deleteCategory(idToken, category.id);

      // Get the count of deleted entries from the response
      const deletedEntriesCount = deleteResult.deleted_entries_count || 0;

      // Optimistically remove deleted categories from state
      setCategories(prev => prev.filter(cat => !selectedCategoryIds.includes(cat.id)));
      setCategoryMap(prev => {
        const newMap = { ...prev };
        selectedCategoryIds.forEach(id => { delete newMap[id]; });
        return newMap;
      });
      // Remove affected entries from local state (do NOT call deleteEntry)
      setEntries(prev => prev.filter(entry =>
        !entry.category_ids || !entry.category_ids.some(catId => selectedCategoryIds.includes(catId))
      ));
      setSelectedCategoryIds([]);
      // Optionally, still re-fetch from backend for consistency
      const cats = await fetchCategories(idToken);
      setCategories(cats);
      const map: { [id: string]: string } = {};
      cats.forEach((cat: Category) => { map[cat.id] = cat.name; });
      setCategoryMap(map);
      const data = await fetchEntries(idToken);
      setEntries(data);

      // If the deleted category was selected, switch to 'Recent'
      if (selectedCategory === category.id) {
        setSelectedCategory('Recent');
      }

      // Turn off edit mode after successful deletion
      setIsCategoryEditMode(false);

      setShowDeleteConfirm(false);
      setCategoryToDelete(null);
    } catch (error) {
      alert('Failed to delete category: ' + (error as Error).message);
    }
  };

  const confirmDeleteCategory = (category: Category) => {
    setCategoryToDelete(category);
    setShowDeleteConfirm(true);
  };

  // Function to remove a specific entry from local state
  const removeEntryFromState = (entryId: string) => {
    setEntries(prevEntries => prevEntries.filter(entry => entry.id !== entryId));
  };

  // Expose the function globally so other components can use it
  useEffect(() => {
    (window as unknown as { removeEntryFromState: (entryId: string) => void }).removeEntryFromState = removeEntryFromState;
    return () => {
      delete (window as unknown as { removeEntryFromState?: (entryId: string) => void }).removeEntryFromState;
    };
  }, []);

  // Save new category helper
  const saveNewCategory = async () => {
    if (!currentUser || !newCategoryName.trim()) return;
    if (addCategoryLoading) return;
    setAddCategoryLoading(true);
    const idToken = await currentUser.getIdToken();
    try {
      // 1. Create the new category
      const newCat = await createCategory(idToken, newCategoryName.trim());
      const newCatId = newCat.id;
      // 2. For each selected entry, update its category to the new category
      await Promise.all(selectedEntryIds.map(entryId =>
        updateEntry(idToken, entryId, { category_ids: [newCatId] })
      ));
      setNewCategoryName('');
      setShowCategoryModal(false);
      setSelectedEntryIds([]);
      // Refresh categories and entries
      const cats = await fetchCategories(idToken);
      setCategories(cats);
      const map: { [id: string]: string } = {};
      cats.forEach((cat: Category) => { map[cat.id] = cat.name; });
      setCategoryMap(map);
      const data = await fetchEntries(idToken);
      setEntries(data);
    } catch (err) {
      console.error('Failed to add category or update entries:', err);
    } finally {
      setAddCategoryLoading(false);
    }
  };

  // Add effect to auto-switch selection when entering Quick Access edit mode
  useEffect(() => {
    if (isQuickAccessEditMode) {
      // If selection is not a user/AI category, move to first user/AI category
      const userCategoryIds = sidebarCategories.slice(3).map(c => c.id);
      if (!userCategoryIds.includes(selectedCategory)) {
        const firstUserCategory = sidebarCategories.slice(3)[0];
        if (firstUserCategory) {
          setSelectedCategory(firstUserCategory.id);
        }
      }
    }
  }, [isQuickAccessEditMode, selectedCategory, sidebarCategories]);

  useEffect(() => {
    if (isCategoryEditMode) {
      // If selection is not a visible Quick Access category, move to first visible Quick Access
      const visibleQuickAccess = protectedCategories.filter(cat => quickAccessVisibility[cat as 'Recent' | 'All' | 'Favorites']);
      if (!visibleQuickAccess.includes(selectedCategory)) {
        const firstVisibleQuickAccess = visibleQuickAccess[0];
        if (firstVisibleQuickAccess) {
          setSelectedCategory(firstVisibleQuickAccess);
        }
      }
    }
  }, [isCategoryEditMode, selectedCategory, quickAccessVisibility]);

  useEffect(() => {
    localStorage.setItem('quickAccessVisibility', JSON.stringify(quickAccessVisibility));
  }, [quickAccessVisibility]);

  useEffect(() => {
    if (showCategoryModal) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [showCategoryModal]);

  return (
    <div className="min-h-screen bg-white dark:bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 text-dark-900 dark:text-white">
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
                {theme === 'dark' ? <Sun size={20} className="text-dark-900 dark:text-white" /> : <Moon size={20} className="text-dark-900 dark:text-white" />}
              </button>
              <Link to="/save" className="flex items-center space-x-2 sm:space-x-3 px-4 py-2 rounded-full bg-dark-100/50 dark:bg-dark-800/50 hover:bg-dark-200/60 dark:hover:bg-dark-700/70 transition-colors duration-200 text-dark-800 dark:text-white">
                <Plus size={16} /><span className="font-medium text-sm hidden sm:inline">Save</span>
                <Kbd className="hidden sm:block">{isMac ? '⌘' : 'Ctrl'}+I</Kbd>
              </Link>
              <Link to="/account" className="flex items-center space-x-2 sm:space-x-3 px-4 py-2 rounded-full bg-dark-100/50 dark:bg-dark-800/50 hover:bg-dark-200/60 dark:hover:bg-dark-700/70 transition-colors duration-200">
                <UserIcon size={20} className="text-dark-900 dark:text-white" /><span className="text-dark-800 dark:text-white font-medium text-sm hidden sm:block">{currentUser?.email}</span>
                <Kbd className="hidden sm:block">{isMac ? '⌘' : 'Ctrl'}+M</Kbd>
              </Link>
              {process.env.NODE_ENV === 'development' && (
                <button
                  onClick={() => {
                    if (currentUser) {
                      currentUser.getIdToken().then(token => {
                        console.log('Your Firebase ID token:', token);
                      });
                    } else {
                      console.log('No user is logged in.');
                    }
                  }}
                  className="ml-2 px-3 py-2 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 text-xs font-semibold"
                >
                  Show My ID Token
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-screen-2xl mx-auto px-6 py-10">
        <div className="mb-8">
          <div className="relative">
            <div className="relative bg-dark-100/50 dark:bg-dark-800/50 border border-dark-200/80 dark:border-dark-700/60 rounded-full shadow-lg flex items-center pr-4">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-dark-500 dark:text-dark-400" size={20} />
              <div className="relative w-full">
                <input ref={searchInputRef} type="text" placeholder="Search your vault..." className="w-full bg-transparent py-3 pl-14 pr-16 text-dark-900 dark:text-white placeholder-dark-500 dark:placeholder-dark-400 focus:outline-none relative z-10" value={searchQuery} onChange={handleSearchChange} autoComplete="off" onKeyDown={handleSearchInputKeyDown} />
              </div>
              <Kbd className="hidden sm:block">{isMac ? '⌘' : 'Ctrl'}+K</Kbd>
            </div>

            {/* Search Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div
                ref={suggestionsRef}
                className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-dark-800 border border-dark-200/80 dark:border-dark-700/60 rounded-xl shadow-xl z-50 max-h-80 overflow-y-auto"
              >
                {suggestions.map((entry, index) => {
                  let categoryName = 'Unknown';
                  if (entry.category_ids && entry.category_ids.length > 0 && categoryMap) {
                    const catId = entry.category_ids[0];
                    categoryName = categoryMap[catId] || 'Unknown';
                  }

                  return (
                    <button
                      key={entry.id}
                      onClick={() => handleSuggestionClick(entry)}
                      className={`w-full p-4 text-left hover:bg-dark-50 dark:hover:bg-dark-700/50 transition-colors border-b border-dark-100/50 dark:border-dark-700/30 last:border-b-0 ${selectedSuggestionIndex === index ? 'bg-primary-500/10 text-primary-500 dark:text-primary-400' : ''}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-dark-900 dark:text-white truncate mb-1">
                            {entry.title || 'Untitled'}
                          </h4>
                          {entry.summary && (
                            <p className="text-sm text-dark-600 dark:text-dark-300 line-clamp-2 mb-2">
                              {entry.summary}
                            </p>
                          )}
                          <div className="flex items-center gap-3 text-xs text-dark-500 dark:text-dark-400">
                            <span className="bg-dark-100 dark:bg-dark-700 px-2 py-1 rounded-full">
                              {categoryName}
                            </span>
                            {entry.tags && entry.tags.length > 0 && (
                              <span className="truncate">
                                {entry.tags.slice(0, 2).join(', ')}
                                {entry.tags.length > 2 && '...'}
                              </span>
                            )}
                          </div>
                        </div>
                        <ExternalLink size={16} className="text-dark-400 dark:text-dark-500 ml-2 flex-shrink-0" />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row lg:space-x-8 min-h-screen h-screen">
          <aside className="w-full lg:w-1/4 xl:w-1/5 mb-8 lg:mb-0 h-screen overflow-y-auto">
            <div className="sticky top-0 flex flex-col gap-6">
              {/* Quick Access Box - only heading */}
              <div className="flex flex-col space-y-1">
                <div className="flex items-center justify-between w-full pl-5 pr-3 py-2 mb-3 rounded-full border border-dark-200/80 dark:border-dark-700/60 bg-dark-100/50 dark:bg-dark-800/50 mt-0">
                  <h2 className="text-xs text-dark-500 dark:text-dark-400 font-semibold uppercase tracking-wider">Quick Access</h2>
                  <button
                    className={`p-1 rounded-full transition-all duration-150
                      ${isQuickAccessEditMode
                        ? 'bg-blue-100 text-primary-500 scale-110 dark:bg-primary-500/10 dark:text-primary-500'
                        : 'text-gray-500 hover:bg-blue-100 hover:text-primary-500 hover:scale-110 dark:text-white dark:hover:bg-primary-500/10 dark:hover:text-primary-500 dark:hover:scale-110'}
                    `}
                    title={isQuickAccessEditMode ? 'Done' : 'Edit Quick Access'}
                    onClick={() => {
                      setIsQuickAccessEditMode((v) => {
                        if (!v) setIsCategoryEditMode(false);
                        return !v;
                      });
                    }}
                  >
                    {isQuickAccessEditMode ? (
                      <Check size={20} className="text-primary-500" />
                    ) : (
                      <Pencil size={20} />
                    )}
                  </button>
                </div>
                {sidebarCategories.slice(0, 3).map((category) => {
                  const isVisible = quickAccessVisibility[category.name as 'Recent' | 'All' | 'Favorites'];
                  if (isQuickAccessEditMode) {
                    return (
                      <div key={category.id} className="touch-none flex items-center group">
                        <button
                          onClick={isQuickAccessEditMode ? undefined : () => setSelectedCategory(category.id)}
                          disabled={isCategoryEditMode || isQuickAccessEditMode}
                          aria-disabled={isQuickAccessEditMode ? 'true' : undefined}
                          className={`flex items-center flex-1 h-9 rounded-full px-4 transition-colors duration-200
                            ${selectedCategory === category.id ? 'bg-primary-500/10 text-primary-500 dark:text-primary-400' : 'text-dark-600 dark:text-dark-200'}
                            ${isCategoryEditMode || isQuickAccessEditMode ? '!cursor-default !pointer-events-none' : 'hover:bg-dark-100/60 dark:hover:bg-dark-800/60 hover:text-dark-900 dark:hover:text-white'}
                            ${!isVisible ? 'text-dark-400 dark:text-dark-500' : ''}`}
                        >
                          <div className="flex items-center space-x-3 text-left w-full">
                            <span className="font-medium text-sm flex-grow truncate">{category.name}</span>
                          </div>
                        </button>
                        <button
                          className={`ml-2 px-3 py-1 min-w-[72px] rounded-full text-xs font-semibold border transition-colors duration-150
                            ${isVisible
                              ? 'border-red-500 bg-red-500/20 text-red-500 hover:bg-red-500/60 hover:text-white'
                              : 'border-green-500 bg-green-500/20 text-green-500 hover:bg-green-500/60 hover:text-white'}
                          `}
                          onClick={() => setQuickAccessVisibility((prev: { Recent: boolean; All: boolean; Favorites: boolean }) => ({ ...prev, [category.name]: !isVisible }))}
                        >
                          {isVisible ? 'HIDE' : 'SHOW'}
                        </button>
                      </div>
                    );
                  } else if (isVisible) {
                    return (
                      <div key={category.id} className="touch-none flex items-center group">
                        <button
                          onClick={isQuickAccessEditMode ? undefined : () => setSelectedCategory(category.id)}
                          disabled={isCategoryEditMode || isQuickAccessEditMode}
                          aria-disabled={isQuickAccessEditMode ? 'true' : undefined}
                          className={`flex items-center flex-1 h-9 rounded-full px-4 transition-colors duration-200
                            ${selectedCategory === category.id ? 'bg-primary-500/10 text-primary-500 dark:text-primary-400' : 'text-dark-600 dark:text-dark-200'}
                            ${isCategoryEditMode || isQuickAccessEditMode ? '!cursor-default !pointer-events-none' : 'hover:bg-dark-100/60 dark:hover:bg-dark-800/60 hover:text-dark-900 dark:hover:text-white'}
                            ${!isVisible ? 'text-dark-400 dark:text-dark-500' : ''}`}
                        >
                          <div className="flex items-center space-x-3 text-left w-full">
                            <span className="font-medium text-sm flex-grow truncate">{category.name}</span>
                          </div>
                        </button>
                      </div>
                    );
                  } else {
                    return null;
                  }
                })}
              </div>

              {/* Categories Box - only heading and buttons */}
              <div className="flex flex-col space-y-1 mt-2">
                <div className="flex items-center justify-between w-full pl-5 pr-3 py-2 mb-3 mt-2 rounded-full border border-dark-200/80 dark:border-dark-700/60 bg-dark-100/50 dark:bg-dark-800/50">
                  <h2 className="text-xs text-dark-500 dark:text-dark-400 font-semibold uppercase tracking-wider">Categories</h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setIsCategoryEditMode((v) => {
                          if (!v) setIsQuickAccessEditMode(false);
                          return !v;
                        });
                      }}
                      className={`p-1 rounded-full transition-all duration-150 mr-2
                        ${isCategoryEditMode
                          ? 'bg-blue-100 text-primary-500 scale-110 dark:bg-primary-500/10 dark:text-primary-500'
                          : 'text-primary-500 hover:bg-blue-100 hover:text-primary-500 hover:scale-110 dark:text-primary-400 dark:hover:bg-primary-500/10 dark:hover:text-primary-500 dark:hover:scale-110'}
                      `}
                      title={isCategoryEditMode ? 'Exit edit mode' : 'Edit categories'}
                    >
                      <Pencil size={20} />
                    </button>
                    {isCategoryEditMode ? (
                      <button
                        onClick={async () => {
                          if (selectedCategoryIds.length === 0) return;
                          if (!currentUser) return;
                          const idToken = await currentUser.getIdToken();
                          // Delete selected categories
                          for (const catId of selectedCategoryIds) {
                            await deleteCategory(idToken, catId);
                          }
                          // Remove affected entries from local state (do NOT call deleteEntry)
                          setEntries(prev => prev.filter(entry =>
                            !entry.category_ids || !entry.category_ids.some(catId => selectedCategoryIds.includes(catId))
                          ));
                          setCategories(prev => prev.filter(cat => !selectedCategoryIds.includes(cat.id)));
                          setCategoryMap(prev => {
                            const newMap = { ...prev };
                            selectedCategoryIds.forEach(id => { delete newMap[id]; });
                            return newMap;
                          });
                          setSelectedCategoryIds([]);
                          // Optionally, still re-fetch from backend for consistency
                          const cats = await fetchCategories(idToken);
                          setCategories(cats);
                          const map: { [id: string]: string } = {};
                          cats.forEach((cat: Category) => { map[cat.id] = cat.name; });
                          setCategoryMap(map);
                          const data = await fetchEntries(idToken);
                          setEntries(data);
                        }}
                        className={`p-1 rounded-full transition-all duration-150 ${selectedCategoryIds.length === 0 ? 'text-dark-400 bg-dark-100/50 cursor-not-allowed' : 'text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 hover:text-red-700'} `}
                        title="Delete selected categories"
                        disabled={selectedCategoryIds.length === 0}
                      >
                        <Trash2 size={20} />
                      </button>
                    ) : (
                      <button
                        onClick={() => setShowCategoryModal(true)}
                        className="p-1 rounded-full transition-all duration-150 text-gray-500 hover:bg-blue-100 hover:text-primary-500 hover:scale-110 dark:text-white dark:hover:bg-primary-500/10 dark:hover:text-primary-500 dark:hover:scale-110"
                        title="Add category"
                      >
                        <Plus size={20} />
                      </button>
                    )}
                  </div>
                </div>
                {showAddCategory && (
                  <form
                    className="flex items-center gap-2 px-3 mb-2"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (newCategoryName.trim()) {
                        await saveNewCategory();
                      }
                    }}
                    autoComplete="off"
                  >
                    <input
                      type="text"
                      className="flex-1 px-3 py-1 rounded-lg border border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-900 text-dark-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="New category name"
                      value={newCategoryName}
                      autoFocus
                      onChange={e => setNewCategoryName(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Escape') {
                          setShowAddCategory(false);
                          setNewCategoryName('');
                        }
                      }}
                      disabled={addCategoryLoading}
                    />
                    {newCategoryName.trim() && (
                      <button
                        type="submit"
                        className="p-1 rounded-full text-green-500 hover:bg-green-100 dark:hover:bg-green-900/20"
                        title="Save category"
                        disabled={addCategoryLoading}
                      >
                        <Check size={16} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddCategory(false);
                        setNewCategoryName('');
                      }}
                      className="p-1 rounded-full text-dark-400 hover:text-red-500"
                      title="Cancel"
                      disabled={addCategoryLoading}
                    >
                      <X size={16} />
                    </button>
                  </form>
                )}
                {sidebarCategories.slice(3).map((category) => {
                  // For future extensibility, you could add per-category visibility here
                  // For now, all user/AI categories are always visible
                  const isProtected = protectedCategories.includes(category.name);
                  const isSelected = selectedCategoryIds.includes(category.id);
                  return (
                    <div key={category.id} className="touch-none">
                      <div className="flex items-center group">
                        {isCategoryEditMode && !isProtected && (
                          <button
                            type="button"
                            className={`mr-1 w-7 h-7 flex items-center justify-center rounded-full border-2 transition-colors duration-150 ${isSelected ? 'bg-red-500 border-red-500 text-white' : 'border-dark-200 dark:border-dark-700 text-dark-400 dark:text-dark-500 bg-transparent hover:bg-dark-100 dark:hover:bg-dark-800'}`}
                            onClick={() => {
                              setSelectedCategoryIds(prev =>
                                isSelected ? prev.filter(id => id !== category.id) : [...prev, category.id]
                              );
                            }}
                            aria-pressed={isSelected}
                            tabIndex={0}
                          >
                            {isSelected ? <Check size={18} /> : ''}
                          </button>
                        )}
                        <button
                          onClick={isQuickAccessEditMode ? undefined : () => setSelectedCategory(category.id)}
                          disabled={isCategoryEditMode || isQuickAccessEditMode}
                          aria-disabled={isQuickAccessEditMode ? 'true' : undefined}
                          className={`flex items-center flex-1 h-9 rounded-full px-4 transition-colors duration-200
                            ${selectedCategory === category.id ? 'bg-primary-500/10 text-primary-500 dark:text-primary-400' : 'text-dark-600 dark:text-dark-200'}
                            ${isCategoryEditMode || isQuickAccessEditMode ? '!cursor-default !pointer-events-none' : 'hover:bg-dark-100/60 dark:hover:bg-dark-800/60 hover:text-dark-900 dark:hover:text-white'}`}
                        >
                          <div className="flex items-center space-x-3 text-left w-full">
                            <span className="font-medium text-sm flex-grow truncate">{category.name}</span>
                          </div>
                        </button>
                        {isCategoryEditMode && !isProtected && (
                          <button
                            onClick={() => confirmDeleteCategory(category)}
                            className="ml-2 p-1 rounded-full text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors opacity-0 group-hover:opacity-100"
                            title="Delete category"
                            style={{ display: 'none' }} // Hide the old single delete button
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>

          <main className="flex-1 h-screen overflow-y-auto hide-scrollbar">
            {mainHeading && <h2 className="text-2xl font-bold mb-8">{mainHeading}</h2>}
            {loading ? (
              <div className="text-center py-20 text-dark-500 dark:text-dark-400">Loading entries...</div>
            ) : entriesToShow.length === 0 ? (
              selectedCategory === 'Favorites' ? (
                <div className="flex flex-col items-center justify-center py-20 text-dark-500 dark:text-dark-400">
                  <span className="mb-6">
                    <svg width="72" height="72" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" className="text-dark-400 dark:text-dark-500">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 17.75l-6.16 3.24 1.18-6.88-5-4.87 6.91-1L12 2.5l3.09 6.24 6.91 1-5 4.87 1.18 6.88z" />
                    </svg>
                  </span>
                  <div className="text-2xl font-semibold mb-2">No favorites yet.</div>
                  <div className="text-base text-dark-400 dark:text-dark-500 text-center max-w-xs">
                    Click the <span className="inline align-text-bottom"><svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" className="inline text-dark-400 dark:text-dark-500 relative top-[2px]"><path strokeLinecap="round" strokeLinejoin="round" d="M12 17.75l-6.16 3.24 1.18-6.88-5-4.87 6.91-1L12 2.5l3.09 6.24 6.91 1-5 4.87 1.18 6.88z" /></svg></span> icon on any entry to add it to your Favorites!
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-dark-500 dark:text-dark-400">
                  <Folder size={72} className="mb-6 text-dark-300 dark:text-dark-700" />
                  <div className="text-2xl font-semibold mb-2">No entries found.</div>
                  <div className="text-base text-dark-400 dark:text-dark-500">
                    Press <span className="inline-flex items-center font-semibold text-dark-600 dark:text-dark-200 border border-dark-200 dark:border-dark-700 bg-dark-100/60 dark:bg-dark-800/60 px-3 py-1 rounded-lg mr-1">+ Save</span> in the top bar or <span className="font-mono bg-dark-100 dark:bg-dark-800 px-2 py-1 rounded">{isMac ? '⌘' : 'Ctrl'}+I</span> to add your first entry!
                  </div>
                </div>
              )
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {entriesToShow.map((entry) => {
                  // Map the first category ID to its name
                  let categoryName = 'Unknown';
                  if (entry.category_ids && entry.category_ids.length > 0 && categoryMap) {
                    const catId = entry.category_ids[0];
                    categoryName = categoryMap[catId] || 'Unknown';
                  }
                    return (
                    <ContentCard
                      key={entry.id}
                      id={entry.id}
                      title={entry.title || 'Untitled'}
                      url={entry.url}
                      notes={entry.notes}
                      summary={entry.summary}
                      tags={entry.tags || []}
                      favorite={entry.favorite}
                      createdAt={entry.created_at}
                      category={categoryName}
                      thumbnail={entry.thumbnail}
                      platform={entry.platform}
                    />
                    );
                  })}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Delete Category Confirmation Modal */}
      {showDeleteConfirm && categoryToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-dark-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-dark-900 dark:text-white mb-4">
              Delete Category
            </h3>
            <p className="text-dark-600 dark:text-dark-300 mb-6">
              Are you sure you want to delete the category "{categoryToDelete.name}"?
              <br /><br />
              <span className="text-red-600 dark:text-red-400 font-medium">
                ⚠️ This will also delete ALL entries in this category permanently.
              </span>
              <br /><br />
              This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setCategoryToDelete(null);
                }}
                className="flex-1 px-4 py-2 rounded-lg border border-dark-200 dark:border-dark-700 text-dark-700 dark:text-dark-300 hover:bg-dark-50 dark:hover:bg-dark-700/50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteCategory(categoryToDelete)}
                className="flex-1 px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                Delete Category & Entries
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-dark-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-dark-900 dark:text-white mb-4">
              Add New Category
            </h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (newCategoryName.trim()) {
                  await saveNewCategory();
                }
              }}
              autoComplete="off"
            >
              <input
                type="text"
                className="w-full px-3 py-2 rounded-full border border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-900 text-dark-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 mb-4"
                placeholder="Category name"
                value={newCategoryName}
                autoFocus
                onChange={e => setNewCategoryName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Escape') {
                    setShowCategoryModal(false);
                    setNewCategoryName('');
                  }
                }}
                disabled={addCategoryLoading}
              />

              {/* Section title for entry assignment */}
              <div className="font-semibold text-dark-700 dark:text-dark-200 mb-2 mt-2">Assign Entries to This Category</div>

              {/* Scrollable list of entries for assignment */}
              <div className="max-h-56 overflow-y-auto mb-4 rounded-xl border border-dark-200 dark:border-dark-700 bg-dark-50 dark:bg-dark-900/40">
                {entries.length === 0 ? (
                  <div className="text-center text-dark-400 py-6">No entries found.</div>
                ) : (
                  entries.map(entry => {
                    const currentCat = (entry.category_ids && entry.category_ids.length > 0 && categoryMap[entry.category_ids[0]]) || 'None';
                    const isSelected = selectedEntryIds.includes(entry.id);
                    return (
                      <div
                        key={entry.id}
                        className={`flex items-center justify-between px-4 py-2 border-b border-dark-100 dark:border-dark-800 last:border-b-0 hover:bg-primary-50/30 dark:hover:bg-primary-900/10 transition-colors`}
                      >
                        <div className="flex flex-col min-w-0">
                          <span className="font-medium text-sm text-dark-900 dark:text-white truncate">{entry.title}</span>
                          <span className="text-xs text-dark-400 dark:text-dark-500">{currentCat}</span>
                        </div>
                        <button
                          type="button"
                          className={`ml-4 w-8 h-8 flex items-center justify-center rounded-full border-2 transition-colors duration-150 ${isSelected ? 'bg-primary-500 border-primary-500 text-white' : 'border-dark-200 dark:border-dark-700 text-dark-400 dark:text-dark-500 bg-transparent hover:bg-dark-100 dark:hover:bg-dark-800'}`}
                          onClick={() => {
                            setSelectedEntryIds(prev =>
                              isSelected ? prev.filter(id => id !== entry.id) : [...prev, entry.id]
                            );
                          }}
                          aria-pressed={isSelected}
                          tabIndex={0}
                        >
                          {isSelected ? <Check size={20} /> : ''}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="flex space-x-3 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCategoryModal(false);
                    setNewCategoryName('');
                  }}
                  className="flex-1 px-4 py-2 rounded-full border border-dark-200 dark:border-dark-700 text-dark-700 dark:text-dark-300 hover:bg-dark-50 dark:hover:bg-dark-700/50 transition-colors"
                  disabled={addCategoryLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 rounded-full bg-primary-500 text-white hover:bg-primary-600 transition-colors disabled:opacity-60"
                  disabled={addCategoryLoading || !newCategoryName.trim()}
                >
                  {addCategoryLoading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
