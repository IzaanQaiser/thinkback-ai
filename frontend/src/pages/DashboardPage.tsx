import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Plus, Search, User as UserIcon, Sun, Moon, Check, Pencil, ExternalLink, Trash2 } from 'lucide-react';
import Logo from '../components/Logo';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import ContentCard from '../components/ContentCard';
import Kbd from '../components/Kbd';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { fetchEntries, fetchCategories, updateCategory, deleteCategory, updateEntry } from '../services/api';

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

const DashboardPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const [isMac, setIsMac] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(sessionStorage.getItem('lastSelectedCategory') || 'Recent');
  const [isCategoryEditMode, setIsCategoryEditMode] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [categoryMap, setCategoryMap] = useState<{ [id: string]: string }>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<any>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');

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
        cats.forEach((cat: any) => { map[cat.id] = cat.name; });
        setCategoryMap(map);
      } catch (error) {
        // fallback to protectedCategories if error
        setCategories(protectedCategories.map((name) => ({ id: name, name })));
      }
    };
    loadCategories();
  }, [currentUser]);

  const filteredData = entries.filter(item =>
    item.title && item.title.toLowerCase().includes(searchQuery.toLowerCase())
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

  const sidebarCategories = [
    ...protectedCategories.map((name) => ({ id: name, name })),
    ...categories.filter((cat: any) => !protectedCategories.includes(cat.name) && cat.name.trim().toLowerCase() !== 'uncategorized'),
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
    const cat = categories.find((c: any) => c.id === selectedCategory);
    mainHeading = cat ? cat.name : '';
    entriesToShow = filteredData.filter((item) => item.category_ids && item.category_ids.includes(selectedCategory));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setCategories((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        if (newIndex < protectedCategories.length) {
          return items;
        }
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }

  const ensureUncategorized = async () => {
    let uncategorized = categories.find((cat: any) => cat.name.trim().toLowerCase() === 'uncategorized');
    if (!uncategorized && currentUser) {
      const idToken = await currentUser.getIdToken();
      // Create 'Uncategorized' category
      await updateCategory(idToken, '', 'Uncategorized'); // backend will create if not exists
      const cats = await fetchCategories(idToken);
      uncategorized = cats.find((cat: any) => cat.name.trim().toLowerCase() === 'uncategorized');
      setCategories(cats);
    }
    return uncategorized?.id;
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

  const handleDeleteCategory = async (category: any) => {
    if (!currentUser) return;

    try {
      const idToken = await currentUser.getIdToken();
      const deleteResult = await deleteCategory(idToken, category.id);

      // Get the count of deleted entries from the response
      const deletedEntriesCount = deleteResult.deleted_entries_count || 0;

      // Reload categories
      const cats = await fetchCategories(idToken);
      setCategories(cats);
      const map: { [id: string]: string } = {};
      cats.forEach((cat: any) => { map[cat.id] = cat.name; });
      setCategoryMap(map);

      // If the deleted category was selected, switch to 'Recent'
      if (selectedCategory === category.id) {
        setSelectedCategory('Recent');
      }

      // Remove deleted entries from local state
      if (deletedEntriesCount > 0) {
        setEntries(prevEntries =>
          prevEntries.filter(entry =>
            !entry.category_ids || !entry.category_ids.includes(category.id)
          )
        );
      }

      // Turn off edit mode after successful deletion
      setIsCategoryEditMode(false);

      setShowDeleteConfirm(false);
      setCategoryToDelete(null);
    } catch (error) {
      alert('Failed to delete category: ' + (error as Error).message);
    }
  };

  const confirmDeleteCategory = (category: any) => {
    setCategoryToDelete(category);
    setShowDeleteConfirm(true);
  };

  // Function to remove a specific entry from local state
  const removeEntryFromState = (entryId: string) => {
    setEntries(prevEntries => prevEntries.filter(entry => entry.id !== entryId));
  };

  // Expose the function globally so other components can use it
  useEffect(() => {
    (window as any).removeEntryFromState = removeEntryFromState;
    return () => {
      delete (window as any).removeEntryFromState;
    };
  }, []);

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
                <input ref={searchInputRef} type="text" placeholder="Search your vault..." className="w-full bg-transparent py-3 pl-14 pr-16 text-dark-900 dark:text-white placeholder-dark-500 dark:placeholder-dark-400 focus:outline-none relative z-10" value={searchQuery} onChange={handleSearchChange} autoComplete="off" />
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

        <div className="flex flex-col lg:flex-row lg:space-x-8">
          <aside className="w-full lg:w-1/4 xl:w-1/5 mb-8 lg:mb-0">
            <div className="sticky top-32">
              <div className="flex items-center justify-between mb-3 px-3">
                <h2 className="text-xs text-dark-500 dark:text-dark-400 font-semibold uppercase tracking-wider">Categories</h2>
                <button onClick={() => setIsCategoryEditMode(!isCategoryEditMode)} className="p-1 rounded-full text-dark-500 dark:text-dark-400 hover:text-dark-900 dark:hover:text-white hover:bg-dark-200/70 dark:hover:bg-dark-700/70 transition-colors">
                  {isCategoryEditMode ? <Check size={16} className="text-primary-500" /> : <Pencil size={14} />}
                </button>
              </div>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={sidebarCategories.map((c) => c.id)}
                  strategy={verticalListSortingStrategy}
                  disabled={!isCategoryEditMode}
                >
                  <nav className="flex flex-col space-y-1">
                    {sidebarCategories.map((category) => (
                      <div key={category.id} className="touch-none">
                        <div className="flex items-center group">
                          <button
                            onClick={() => setSelectedCategory(category.id)}
                            disabled={isCategoryEditMode}
                            className={`flex items-center flex-1 h-9 rounded-full px-4 transition-colors duration-200 ${selectedCategory === category.id && !isCategoryEditMode ? 'bg-primary-500/10 text-primary-500 dark:text-primary-400' : 'text-dark-600 dark:text-dark-200'} ${isCategoryEditMode ? 'cursor-default' : 'hover:bg-dark-100/60 dark:hover:bg-dark-800/60 hover:text-dark-900 dark:hover:text-white'}`}
                          >
                            <div className="flex items-center space-x-3 text-left w-full">
                              <span className="font-medium text-sm flex-grow truncate">{category.name}</span>
                            </div>
                          </button>

                          {/* Delete button - only show for non-protected categories in edit mode */}
                          {isCategoryEditMode && !protectedCategories.includes(category.name) && (
                            <button
                              onClick={() => confirmDeleteCategory(category)}
                              className="ml-2 p-1 rounded-full text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors opacity-0 group-hover:opacity-100"
                              title="Delete category"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                        {category.name === 'Favorites' && <div className="my-2 mx-3 border-b border-dark-200/80 dark:border-dark-800" />}
                      </div>
                    ))}
                  </nav>
                </SortableContext>
              </DndContext>
            </div>
          </aside>

          <main className="flex-1">
            {mainHeading && <h2 className="text-2xl font-bold mb-8">{mainHeading}</h2>}
            {loading ? (
              <div className="text-center py-20 text-dark-500 dark:text-dark-400">Loading entries...</div>
            ) : entriesToShow.length === 0 ? (
              <div className="text-center py-20 text-dark-500 dark:text-dark-400">No entries found.</div>
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
    </div>
  );
};

export default DashboardPage;
