import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Plus, Search, User as UserIcon, Check, Pencil, ExternalLink, Trash2, X, Folder, ChevronLeft } from 'lucide-react';
import Logo from '../components/Logo';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import ContentCard from '../components/ContentCard';
import Kbd from '../components/Kbd';
import { fetchEntries, fetchCategories, updateCategory, deleteCategory, updateEntry, createCategory, deleteEntry, cleanupEmptyCategories } from '../services/api';

const protectedCategories = ['Recent', 'All', 'Favorites'];

interface Entry {
  id: string;
  url: string;
  title: string;
  notes?: string;
  tags?: string[];
  favorite?: boolean;
  created_at?: string;
  collection_ids?: string[];
  category_ids?: string[];
  thumbnail?: string;
  platform?: string;
  is_carousel?: boolean;
  carousel_count?: number;
  channel?: string;
}

interface Category {
  id: string;
  name: string;
  ai_generated?: boolean;
}

const DashboardPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
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
  const [expandedSummaries, setExpandedSummaries] = useState<{ [key: string]: boolean }>({});
  const cardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedEntryIds, setSelectedEntryIds] = useState<string[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameCategoryId, setRenameCategoryId] = useState<string | null>(null);
  const [renameCategoryName, setRenameCategoryName] = useState('');
  const [renameLoading, setRenameLoading] = useState(false);
  const [renameError, setRenameError] = useState<string | null>(null);
  const [categoriesToDelete, setCategoriesToDelete] = useState<Category[] | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showDeleteEntryModal, setShowDeleteEntryModal] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<Entry | null>(null);
  const [deleteEntryLoading, setDeleteEntryLoading] = useState(false);
  const [deleteEntryError, setDeleteEntryError] = useState<string | null>(null);

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
        await cleanupEmptyCategories(idToken);
        const cats = await fetchCategories(idToken);
        setCategories(cats);
        const map: { [id: string]: string } = {};
        cats.forEach((cat: Category) => { map[cat.id] = cat.name; });
        setCategoryMap(map);
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
            await cleanupEmptyCategories(idToken);
            const cats = await fetchCategories(idToken);
            setCategories(cats);
            const map: { [id: string]: string } = {};
            cats.forEach((cat: Category) => { map[cat.id] = cat.name; });
            setCategoryMap(map);
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

  // Main dashboard results use searchQuery for real-time filtering
  const filteredData = entries.filter(item => {
    if (!searchQuery.trim()) return true; // Show all entries when search is empty
    
    const query = searchQuery.toLowerCase();
    return (
      item.title && item.title.toLowerCase().includes(query) ||
      item.notes && item.notes.toLowerCase().includes(query) ||
      item.tags && item.tags.some(tag => tag.toLowerCase().includes(query))
    );
  });

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
    ...categories
      .filter((cat: Category) => !protectedCategories.includes(cat.name) && cat.name.trim().toLowerCase() !== 'uncategorized')
      .sort((a, b) => a.name.localeCompare(b.name))
      .filter((cat: Category, index: number, self: Category[]) => 
        index === self.findIndex((c: Category) => c.name === cat.name)
      ), // Remove duplicates based on name
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
      return diffMs <= 8 * 60 * 60 * 1000; // 8 hours
    });
  } else if (protectedCategories.includes(selectedCategory)) {
    mainHeading = selectedCategory;
    entriesToShow = filteredData;
  } else {
    const cat = categories.find((c: Category) => c.id === selectedCategory);
    mainHeading = cat ? cat.name : '';
    entriesToShow = filteredData.filter((item) => item.category_ids && item.category_ids.includes(selectedCategory));
  }

  if (selectedCategory.startsWith('platform:')) {
    const platform = selectedCategory.replace('platform:', '');
    mainHeading = platform;
    entriesToShow = filteredData.filter((item) => normalizePlatformKey(item.platform || '') === platform);
  }



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
    
    // Find the category this entry belongs to
    const entryCategoryId = entry.category_ids?.[0];
    if (entryCategoryId) {
      // Switch to the category containing this entry
      setSelectedCategory(entryCategoryId);
      sessionStorage.setItem('lastSelectedCategory', entryCategoryId);
      
      // Scroll to the entry after a short delay to ensure the category has loaded
      setTimeout(() => {
        const entryElement = document.getElementById(`entry-${entry.id}`);
        console.log('Looking for entry element:', `entry-${entry.id}`, entryElement);
        if (entryElement) {
          entryElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
          
          // Force the hover state by adding the actual hover styles directly
          entryElement.style.borderColor = 'rgba(59, 130, 246, 0.3)'; // primary-500/30
          entryElement.style.backgroundColor = 'rgba(229, 231, 235, 0.5)'; // dark-200/50
          entryElement.style.borderRadius = '0.75rem'; // rounded-xl to match ContentCard
          if (document.documentElement.classList.contains('dark')) {
            entryElement.style.backgroundColor = 'rgba(31, 41, 55, 1)'; // dark-800
          }
          entryElement.style.transition = 'all 0.2s ease-in-out';
          
          setTimeout(() => {
            // Remove the forced styles
            entryElement.style.borderColor = '';
            entryElement.style.backgroundColor = '';
            entryElement.style.borderRadius = '';
            entryElement.style.transition = '';
          }, 3000);
        }
      }, 100);
    } else {
      // If no category, switch to 'Recent'
      setSelectedCategory('Recent');
      sessionStorage.setItem('lastSelectedCategory', 'Recent');
    }
  };

  const handleDeleteCategory = async (category: Category) => {
    if (!currentUser) return;

    try {
      const idToken = await currentUser.getIdToken();
      await deleteCategory(idToken, category.id);

      // Optimistically remove deleted categories from state
      setCategories((prev: Category[]) => prev.filter(cat => !selectedCategoryIds.includes(cat.id)));
      setCategoryMap((prev: { [key: string]: string }) => {
        const newMap: { [key: string]: string } = { ...prev };
        selectedCategoryIds.forEach(id => { delete newMap[id]; });
        return newMap;
      });
      // Remove affected entries from local state (do NOT call deleteEntry)
      setEntries((prev: Entry[]) => prev.filter(entry =>
        !entry.category_ids || !entry.category_ids.some(catId => selectedCategoryIds.includes(catId))
      ));
      setSelectedCategoryIds([]);
      // Optionally, still re-fetch from backend for consistency
      await cleanupEmptyCategories(idToken);
      const updatedCats = await fetchCategories(idToken);
      setCategories(updatedCats);
      const updatedMap: { [key: string]: string } = {};
      updatedCats.forEach((cat) => { updatedMap[cat.id] = cat.name; });
      setCategoryMap(updatedMap);
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

  // Handle delete entry
  const handleDeleteEntry = (entryId: string) => {
    const entry = entries.find(e => e.id === entryId);
    if (entry) {
      setEntryToDelete(entry);
      setShowDeleteEntryModal(true);
      setDeleteEntryError(null);
    }
  };

  const confirmDeleteEntry = async () => {
    if (!currentUser || !entryToDelete) return;
    setDeleteEntryLoading(true);
    setDeleteEntryError(null);
    try {
      const idToken = await currentUser.getIdToken();
      await deleteEntry(idToken, entryToDelete.id);
      // Remove from local state
      setEntries((prev: Entry[]) => prev.filter(entry => entry.id !== entryToDelete.id));
      setShowDeleteEntryModal(false);
      setEntryToDelete(null);
    } catch (err: any) {
      setDeleteEntryError(err.message || 'Failed to delete entry.');
    } finally {
      setDeleteEntryLoading(false);
    }
  };

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
      await cleanupEmptyCategories(idToken);
      const updatedCats = await fetchCategories(idToken);
      setCategories(updatedCats);
      const updatedMap: { [key: string]: string } = {};
      updatedCats.forEach((cat) => { updatedMap[cat.id] = cat.name; });
      setCategoryMap(updatedMap);
      const data = await fetchEntries(idToken);
      setEntries(data);
    } catch (err: unknown) {
      console.error('Failed to add category or update entries:', err as Error);
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

  // Helper for platform display name and icon
  const platformDisplay: { [key: string]: { name: string; icon: React.ReactNode } } = {
    'YouTube': { name: 'YouTube', icon: <span style={{color:'#FF0000'}}><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a2.994 2.994 0 0 0-2.107-2.117C19.228 3.5 12 3.5 12 3.5s-7.228 0-9.391.569A2.994 2.994 0 0 0 .502 6.186C0 8.35 0 12 0 12s0 3.65.502 5.814a2.994 2.994 0 0 0 2.107 2.117C4.772 20.5 12 20.5 12 20.5s7.228 0 9.391-.569a2.994 2.994 0 0 0 2.107-2.117C24 15.65 24 12 24 12s0-3.65-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg></span> },
    'Instagram': { name: 'Instagram', icon: <span style={{color:'#E1306C'}}><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.334 3.608 1.308.974.974 1.246 2.241 1.308 3.608.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.062 1.366-.334 2.633-1.308 3.608-.974.974-2.241 1.246-3.608 1.308-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.366-.062-2.633-.334-3.608-1.308-.974-.974-1.246-2.241-1.308-3.608C2.175 15.647 2.163 15.267 2.163 12s.012-3.584.07-4.85c.062-1.366.334-2.633 1.308-3.608.974-.974 2.241-1.246 3.608-1.308C8.416 2.175 8.796 2.163 12 2.163zm0-2.163C8.741 0 8.332.013 7.052.072 5.771.131 4.659.363 3.678 1.344c-.98.98-1.213 2.092-1.272 3.373C2.013 5.668 2 6.077 2 12c0 5.923.013 6.332.072 7.613.059 1.281.292 2.393 1.272 3.373.98.98 2.092 1.213 3.373 1.272C8.332 23.987 8.741 24 12 24s3.668-.013 4.948-.072c1.281-.059 2.393-.292 3.373-1.272.98-.98 1.213-2.092 1.272-3.373.059-1.281.072-1.69.072-7.613 0-5.923-.013-6.332-.072-7.613-.059-1.281-.292-2.393-1.272-3.373-.98-.98-2.092-1.213-3.373-1.272C15.668.013 15.259 0 12 0z"/><circle cx="12" cy="12" r="3.5"/><circle cx="18.406" cy="5.594" r="1.44"/></svg></span> },
    'Reddit': { name: 'Reddit', icon: <span style={{color:'#FF4500'}}><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12c0-6.627-5.373-12-12-12S0 5.373 0 12c0 6.627 5.373 12 12 12s12-5.373 12-12zm-6.5 2.5c.828 0 1.5.672 1.5 1.5s-.672 1.5-1.5 1.5-1.5-.672-1.5-1.5.672-1.5 1.5-1.5zm-11 0c.828 0 1.5.672 1.5 1.5s-.672 1.5-1.5 1.5-1.5-.672-1.5-1.5.672-1.5 1.5-1.5zm11.072 3.219c-1.219.781-3.219 1.281-5.572 1.281s-4.353-.5-5.572-1.281c-.219-.141-.281-.438-.141-.656.141-.219.438-.281.656-.141 1.031.656 2.906 1.219 5.057 1.219s4.025-.563 5.057-1.219c.219-.141.516-.078.656.141.141.219.078.516-.141.656z"/></svg></span> },
    'TikTok': { name: 'TikTok', icon: <span style={{color:'#000'}}><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2v2.5A5.5 5.5 0 0 0 17.5 10H20a8 8 0 1 1-8-8z"/></svg></span> },
    'X': { name: 'X', icon: <span style={{color:'#000'}}><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.53 2.47a.75.75 0 0 1 1.06 1.06l-5.22 5.22 5.22 5.22a.75.75 0 0 1-1.06 1.06l-5.22-5.22-5.22 5.22a.75.75 0 0 1-1.06-1.06l5.22-5.22-5.22-5.22A.75.75 0 0 1 6.25 2.47l5.22 5.22 5.22-5.22z"/></svg></span> },
    'Twitter/X Post': { name: 'X', icon: <span style={{color:'#000'}}><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.53 2.47a.75.75 0 0 1 1.06 1.06l-5.22 5.22 5.22 5.22a.75.75 0 0 1-1.06 1.06l-5.22-5.22-5.22 5.22a.75.75 0 0 1-1.06-1.06l5.22-5.22-5.22-5.22A.75.75 0 0 1 6.25 2.47l5.22 5.22 5.22-5.22z"/></svg></span> },
    'LinkedIn': { name: 'LinkedIn', icon: <span style={{color:'#0077B5'}}><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452H17.21v-5.569c0-1.327-.025-3.037-1.849-3.037-1.851 0-2.132 1.445-2.132 2.939v5.667H9.073V9h3.112v1.561h.045c.434-.823 1.494-1.691 3.073-1.691 3.287 0 3.892 2.164 3.892 4.977v6.605zM5.337 7.433a1.81 1.81 0 1 1 0-3.62 1.81 1.81 0 0 1 0 3.62zM6.956 20.452H3.715V9h3.241v11.452zM22.225 0H1.771C.792 0 0 .771 0 1.723v20.549C0 23.229.792 24 1.771 24h20.451C23.2 24 24 23.229 24 22.271V1.723C24 .771 23.2 0 22.225 0z"/></svg></span> },
  };

  // Normalize platform keys for grouping (e.g., Twitter/X, YouTube Shorts, etc.)
  function normalizePlatformKey(platform: string) {
    const p = platform.trim().toLowerCase();
    if (p === 'twitter' || p === 'x.com' || p === 'x') return 'X';
    if (p.includes('youtube')) return 'YouTube';
    if (p.includes('instagram')) return 'Instagram';
    if (p.includes('reddit')) return 'Reddit';
    if (p.includes('tiktok')) return 'TikTok';
    if (p.includes('linkedin')) return 'LinkedIn';
    return platform;
  }

  // Compute platforms with at least one entry (normalized)
  const platformCounts: { [platform: string]: number } = {};
  entries.forEach(entry => {
    if (entry.platform) {
      const key = normalizePlatformKey(entry.platform);
      platformCounts[key] = (platformCounts[key] || 0) + 1;
    }
  });
  const platformList = Object.keys(platformCounts).filter(p => platformCounts[p] > 0);

  // Row-based tallest card detection for summary expansion
  useEffect(() => {
    if (entriesToShow.length === 0) return;

    // Use a small delay to ensure all cards are rendered
    const timeoutId = setTimeout(() => {
      // Group cards by row using offsetTop
      const rowMap: { [rowTop: number]: { id: string; height: number }[] } = {};
      entriesToShow.forEach(entry => {
        const cardElement = cardRefs.current[entry.id];
        if (cardElement) {
          const top = cardElement.offsetTop;
          const height = cardElement.offsetHeight;
          if (!rowMap[top]) rowMap[top] = [];
          rowMap[top].push({ id: entry.id, height });
        }
      });

      // For each row, find the tallest height
      const newExpandedSummaries: { [key: string]: boolean } = {};
      Object.values(rowMap).forEach(rowCards => {
        const maxHeight = Math.max(...rowCards.map(c => c.height));
        rowCards.forEach(card => {
          // Only the tallest card(s) in the row get expandSummary=false
          newExpandedSummaries[card.id] = card.height < maxHeight;
        });
      });
      setExpandedSummaries(newExpandedSummaries);
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [entriesToShow]);

  useEffect(() => {
    (window as any).setCategoriesFromOutside = (cats: Category[]) => setCategories(cats);
    return () => {
      delete (window as any).setCategoriesFromOutside;
    };
  }, []);

  return (
    <div className="fixed inset-0 w-full h-full bg-white dark:bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 text-dark-900 dark:text-white flex flex-col">
      {/* Sticky Navbar */}
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-dark-900/30 backdrop-blur-xl border-b border-dark-200/50 dark:border-dark-800/50">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Logo size="sm" />
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden flex items-center justify-center h-10 px-3 rounded-full bg-dark-100/50 dark:bg-dark-800/50 hover:bg-dark-200/60 dark:hover:bg-dark-700/70 transition-colors duration-200 text-dark-800 dark:text-white min-w-[80px]"
                title="Open categories"
              >
                <span className="font-medium text-xs leading-none">Categories</span>
              </button>
              <Link to="/save" className="flex items-center justify-center w-10 h-10 rounded-full bg-dark-100/50 dark:bg-dark-800/50 hover:bg-dark-200/60 dark:hover:bg-dark-700/70 transition-colors duration-200 text-dark-800 dark:text-white">
                <Plus size={16} className="text-gray-600 dark:text-white" />
              </Link>
              <Link to="/account" className="flex items-center justify-center w-10 h-10 rounded-full bg-dark-100/50 dark:bg-dark-800/50 hover:bg-dark-200/60 dark:hover:bg-dark-700/70 transition-colors duration-200">
                <UserIcon size={20} className="text-dark-900 dark:text-white" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Search Bar */}
      <div className="sticky top-[64px] z-20 bg-white/80 dark:bg-dark-900/30 backdrop-blur-xl border-b border-dark-200/30 dark:border-dark-800/30">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-4">
          <div className="relative">
            <div className="relative bg-dark-100/50 dark:bg-dark-800/50 border border-dark-200/80 dark:border-dark-700/60 rounded-full shadow-lg flex items-center pr-4">
              <Search className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 text-dark-500 dark:text-dark-400" size={20} />
              <div className="relative w-full">
                <input ref={searchInputRef} type="text" placeholder="Search your vault..." className="w-full bg-transparent py-3 pl-12 sm:pl-14 pr-16 text-dark-900 dark:text-white placeholder-dark-500 dark:placeholder-dark-400 focus:outline-none relative z-10" value={searchQuery} onChange={handleSearchChange} autoComplete="off" />
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
      </div>

      {/* Main Content Layout: Sidebar + Entry Section */}
      <div className="flex flex-1 min-h-0 max-w-screen-2xl mx-auto w-full px-4 sm:px-6 py-0 gap-4 lg:gap-8">
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        {/* Sidebar: Quick Access & Categories */}
        <aside className={`fixed lg:relative inset-y-0 left-0 z-50 lg:z-auto w-80 lg:w-1/4 xl:w-1/5 h-full overflow-y-auto hide-scrollbar overflow-x-hidden pt-8 pb-8 bg-white/5 dark:bg-dark-900/5 backdrop-blur-md border-r border-dark-200/30 dark:border-dark-800/30 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } lg:bg-white/10 lg:dark:bg-dark-900/10 lg:backdrop-blur-sm lg:border-dark-200/50 lg:dark:border-dark-800/50`}>
          {/* Mobile close button - outside sidebar */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden absolute -right-12 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-white/10 dark:bg-dark-900/10 backdrop-blur-md border border-dark-200/30 dark:border-dark-800/30 rounded-r-lg flex items-center justify-center hover:bg-white/20 dark:hover:bg-dark-900/20 transition-colors"
          >
            <ChevronLeft size={20} className="text-dark-600 dark:text-dark-300" />
          </button>

                                  <div className="flex flex-col gap-6 px-6 lg:px-4 pt-0">
            
            {/* Quick Access Box - only heading */}
            <div className="flex flex-col space-y-1">
              <div className="flex items-center justify-between w-full pl-5 pr-3 py-2 mb-3 rounded-full border border-dark-200/80 dark:border-dark-700/60 bg-dark-100/50 dark:bg-dark-800/50 mt-0">
                <h2 className="text-xs text-dark-500 dark:text-dark-400 font-semibold uppercase tracking-wider">Quick Access</h2>
                <button
                  className={isQuickAccessEditMode
                    ? "p-1 rounded-full border-2 border-blue-500 text-blue-500 bg-transparent transition-all duration-150 flex items-center justify-center w-8 h-8 hover:bg-blue-500 hover:text-white active:bg-blue-600 active:text-white focus:outline-none"
                    : "p-1 rounded-full transition-all duration-150 text-white hover:bg-blue-100 hover:text-primary-500 hover:scale-110 dark:text-white dark:hover:bg-primary-500/10 dark:hover:text-primary-500 dark:hover:scale-110"
                  }
                  title={isQuickAccessEditMode ? 'Done' : 'Edit Quick Access'}
                  onClick={() => {
                    setIsQuickAccessEditMode((v) => {
                      if (!v) setIsCategoryEditMode(false);
                      return !v;
                    });
                  }}
                >
                  {isQuickAccessEditMode ? (
                    <Check size={20} />
                  ) : (
                    <Pencil size={20} className="text-gray-600 dark:text-white" />
                  )}
                </button>
              </div>
              {sidebarCategories.slice(0, 3).map((category) => {
                const isVisible = quickAccessVisibility[category.name as 'Recent' | 'All' | 'Favorites'];
                if (isQuickAccessEditMode) {
                  return (
                    <div key={category.id} className="touch-none flex items-center group">
                      <button
                        onClick={isQuickAccessEditMode ? undefined : () => {
                          setSelectedCategory(category.id);
                          setSidebarOpen(false);
                        }}
                        disabled={isCategoryEditMode || isQuickAccessEditMode}
                        aria-disabled={isQuickAccessEditMode ? 'true' : undefined}
                        className={`flex items-center w-fit h-9 rounded-full px-4 transition-colors duration-200
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
                        onClick={() => setQuickAccessVisibility((prev: Record<string, boolean>) => ({ ...prev, [category.name]: !isVisible }))}
                      >
                        {isVisible ? 'HIDE' : 'SHOW'}
                      </button>
                    </div>
                  );
                } else if (isVisible) {
                  return (
                    <div key={category.id} className="flex items-center group w-full">
                      <button
                        onClick={isQuickAccessEditMode ? undefined : () => {
                          setSelectedCategory(category.id);
                          setSidebarOpen(false);
                        }}
                        disabled={isCategoryEditMode || isQuickAccessEditMode}
                        aria-disabled={isQuickAccessEditMode ? 'true' : undefined}
                        className={`flex items-center w-fit h-9 rounded-full px-4 transition-colors duration-200 touch-none
                          ${selectedCategory === category.id ? 'bg-primary-500/10 text-primary-500 dark:text-primary-400' : 'text-dark-600 dark:text-dark-200'}
                          ${isCategoryEditMode || isQuickAccessEditMode ? '!cursor-default !pointer-events-none' : 'hover:bg-dark-100/60 dark:hover:bg-dark-800/60 hover:text-dark-900 dark:hover:text-white'}
                          ${!isVisible ? 'text-dark-400 dark:text-dark-500' : ''}`}
                      >
                        <div className="flex items-center space-x-3 text-left w-full">
                          <span className="font-medium text-sm flex-grow truncate">{category.name}</span>
                        </div>
                      </button>
                      {/* Scrollable area to the right of the button */}
                      <div className="flex-1 h-9"></div>
                    </div>
                  );
                } else {
                  return null;
                }
              })}
              {/* Platform Quick Access */}
              {platformList.map((platform) => {
                const display = platformDisplay[platform] || { name: platform, icon: null };
                const isVisible = quickAccessVisibility[platform] !== false; // default to true if undefined
                if (isQuickAccessEditMode) {
                  return (
                    <div key={platform} className="touch-none flex items-center group">
                      <button
                        onClick={isQuickAccessEditMode ? undefined : () => {
                          setSelectedCategory(`platform:${platform}`);
                          setSidebarOpen(false);
                        }}
                        disabled={isCategoryEditMode || isQuickAccessEditMode}
                        aria-disabled={isQuickAccessEditMode ? 'true' : undefined}
                        className={`flex items-center w-fit h-9 rounded-full px-4 transition-colors duration-200
                          ${selectedCategory === `platform:${platform}` ? 'bg-primary-500/10 text-primary-500 dark:text-primary-400' : 'text-dark-600 dark:text-dark-200'}
                          ${isCategoryEditMode || isQuickAccessEditMode ? '!cursor-default !pointer-events-none' : 'hover:bg-dark-100/60 dark:hover:bg-dark-800/60 hover:text-dark-900 dark:hover:text-white'}
                          ${!isVisible ? 'text-dark-400 dark:text-dark-500' : ''}`}
                        >
                        <div className="flex items-center space-x-3 text-left w-full">
                          <span className="font-medium text-sm flex-grow truncate">{display.name}</span>
                        </div>
                      </button>
                      <button
                        className={`ml-2 px-3 py-1 min-w-[72px] rounded-full text-xs font-semibold border transition-colors duration-150
                          ${isVisible
                            ? 'border-red-500 bg-red-500/20 text-red-500 hover:bg-red-500/60 hover:text-white'
                            : 'border-green-500 bg-green-500/20 text-green-500 hover:bg-green-500/60 hover:text-white'}
                        `}
                        onClick={() => setQuickAccessVisibility((prev: Record<string, boolean>) => ({ ...prev, [platform]: !isVisible }))}
                      >
                        {isVisible ? 'HIDE' : 'SHOW'}
                      </button>
                    </div>
                  );
                } else if (isVisible) {
                  return (
                    <div key={platform} className="flex items-center group w-full">
                      <button
                        onClick={isQuickAccessEditMode ? undefined : () => {
                          setSelectedCategory(`platform:${platform}`);
                          setSidebarOpen(false);
                        }}
                        disabled={isCategoryEditMode || isQuickAccessEditMode}
                        aria-disabled={isQuickAccessEditMode ? 'true' : undefined}
                        className={`flex items-center w-fit h-9 rounded-full px-4 transition-colors duration-200 touch-none
                          ${selectedCategory === `platform:${platform}` ? 'bg-primary-500/10 text-primary-500 dark:text-primary-400' : 'text-dark-600 dark:text-dark-200'}
                          ${isCategoryEditMode || isQuickAccessEditMode ? '!cursor-default !pointer-events-none' : 'hover:bg-dark-100/60 dark:hover:bg-dark-800/60 hover:text-dark-900 dark:hover:text-white'}
                          ${!isVisible ? 'text-dark-400 dark:text-dark-500' : ''}`}
                        >
                        <div className="flex items-center space-x-3 text-left w-full">
                          <span className="font-medium text-sm flex-grow truncate">{display.name}</span>
                        </div>
                      </button>
                      {/* Scrollable area to the right of the button */}
                      <div className="flex-1 h-9"></div>
                    </div>
                  );
                } else {
                  return null;
                }
              })}
            </div>

            {/* Categories Box - only heading and buttons */}
            <div className={`flex flex-col space-y-1 mt-2 relative`}>
              <div className="flex items-center justify-between w-full pl-5 pr-3 py-2 mb-2 mt-2 rounded-full border border-dark-200/80 dark:border-dark-700/60 bg-dark-100/50 dark:bg-dark-800/50">
                <div className="flex items-center gap-2">
                  <h2 className="text-xs text-dark-500 dark:text-dark-400 font-semibold uppercase tracking-wider">Categories</h2>
                </div>
                <div className="flex items-center gap-2">
                  {isCategoryEditMode && (
                    <button
                      onClick={() => {
                        // Gather selected categories for confirmation
                        const cats = categories.filter(cat => selectedCategoryIds.includes(cat.id));
                        if (cats.length > 0) {
                          setCategoriesToDelete(cats);
                          setShowDeleteConfirm(true);
                        }
                      }}
                      className={`
                        flex items-center justify-center
                        rounded-xl border-2 transition-all duration-150
                        px-4 py-1
                        text-sm font-semibold
                        border-red-500
                        ${selectedCategoryIds.length === 0
                          ? 'text-red-400 bg-transparent cursor-not-allowed hover:text-red-500'
                          : 'text-red-500 bg-transparent hover:bg-red-500 hover:text-white'}
                      `}
                      title="Delete selected categories"
                      disabled={selectedCategoryIds.length === 0}
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                  {isCategoryEditMode ? (
                    <button
                      onClick={() => setIsCategoryEditMode(false)}
                      className="p-1 rounded-full border-2 border-blue-500 text-blue-500 bg-transparent transition-all duration-150 flex items-center justify-center w-8 h-8 hover:bg-blue-500 hover:text-white active:bg-blue-600 active:text-white focus:outline-none"
                      title="Done"
                    >
                      <Check size={22} />
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setIsCategoryEditMode((v) => {
                          if (!v) setIsQuickAccessEditMode(false);
                          return !v;
                        });
                      }}
                      className="p-1 rounded-full transition-all duration-150 text-white hover:bg-blue-100 hover:text-primary-500 hover:scale-110 dark:text-white dark:hover:bg-primary-500/10 dark:hover:text-primary-500 dark:hover:scale-110"
                      title="Edit categories"
                    >
                      <Pencil size={18} className="text-gray-600 dark:text-white" />
                    </button>
                  )}
                  {!isCategoryEditMode && (
                    <button
                      onClick={() => setShowCategoryModal(true)}
                      className="p-1 rounded-full transition-all duration-150 text-white hover:bg-blue-100 hover:text-primary-500 hover:scale-110 dark:text-white dark:hover:bg-primary-500/10 dark:hover:text-primary-500 dark:hover:scale-110"
                      title="Add category"
                    >
                      <Plus size={18} className="text-gray-600 dark:text-white" />
                    </button>
                  )}
                </div>
              </div>
              {/* Category List Edit Mode */}
              {isCategoryEditMode && (
                <div className="flex flex-col gap-1 px-2 pb-2">
                  {sidebarCategories.slice(3).map((category) => {
                    return (
                      <div
                        key={category.id}
                        className={`flex items-center rounded-lg px-2 py-1 transition-all duration-150 group relative`}
                      >
                        {/* Checkbox for selection */}
                        <button
                          type="button"
                          className={`mr-2 w-5 h-5 flex items-center justify-center rounded-full border-2 transition-colors duration-150`}
                          onClick={() => {
                            setSelectedCategoryIds(prev =>
                              prev.includes(category.id) ? prev.filter(id => id !== category.id) : [...prev, category.id]
                            );
                          }}
                          aria-pressed={selectedCategoryIds.includes(category.id)}
                          tabIndex={0}
                        >
                          {selectedCategoryIds.includes(category.id) ? <Check size={13} /> : ''}
                        </button>
                        {/* Category Name */}
                        <span className="font-medium text-sm flex-grow truncate text-dark-700 dark:text-dark-100">{category.name}</span>
                        {/* Rename button - only show in edit mode */}
                        {!selectedCategoryIds.includes(category.id) && (
                          <button
                            type="button"
                            className="ml-2 w-7 h-7 flex items-center justify-center rounded-full transition-all duration-150 bg-blue-100 text-primary-500 dark:bg-primary-500/10 dark:text-primary-500 hover:bg-blue-200 hover:text-primary-600 dark:hover:bg-primary-500/20 dark:hover:text-primary-400"
                            title="Rename category"
                            onClick={() => {
                              setRenameCategoryId(category.id);
                              setRenameCategoryName(category.name);
                              setShowRenameModal(true);
                              setRenameError(null);
                            }}
                          >
                            <Pencil size={15} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              {/* Normal Category List (not edit mode) */}
              {!isCategoryEditMode && (
                <>
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
                    return (
                      <React.Fragment key={category.id}>
                        <div className="w-full">
                          <div className="flex items-center group w-full">
                            <button
                              onClick={isQuickAccessEditMode ? undefined : () => {
                                setSelectedCategory(category.id);
                                setSidebarOpen(false);
                              }}
                              disabled={isCategoryEditMode || isQuickAccessEditMode}
                              aria-disabled={isQuickAccessEditMode ? 'true' : undefined}
                              className={`flex items-center w-fit h-9 rounded-full px-4 transition-colors duration-200 touch-none
                                ${selectedCategory === category.id ? 'bg-primary-500/10 text-primary-500 dark:text-primary-400' : 'text-dark-600 dark:text-dark-200'}
                                ${isCategoryEditMode || isQuickAccessEditMode ? '!cursor-default !pointer-events-none' : 'hover:bg-dark-100/60 dark:hover:bg-dark-800/60 hover:text-dark-900 dark:hover:text-white'}`}
                            >
                              <div className="flex items-center space-x-3 text-left w-full">
                                <span className="font-medium text-sm flex-grow truncate">{category.name}</span>
                              </div>
                            </button>
                            {/* Scrollable area to the right of the button */}
                            <div className="flex-1 h-9"></div>
                            {/* Rename button hidden in normal mode */}
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })}
                </>
              )}
            </div>

          </div>
        </aside>
        
        {/* Main Entry Section */}
        <main className="flex-1 h-full overflow-y-auto hide-scrollbar pt-8 pb-8">
          {mainHeading && (
            <h2
              className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-center mb-6 px-4"
              style={{ textShadow: '0 0 35px rgba(14, 165, 233, 0.6)' }}
            >
              {mainHeading}
            </h2>
          )}
          {loading ? (
            <div className="text-center py-20 text-dark-500 dark:text-dark-400">Loading entries...</div>
          ) : entriesToShow.length === 0 ? (
            selectedCategory === 'Favorites' ? (
              <div className="flex flex-col items-center justify-center py-20 text-dark-500 dark:text-dark-400 px-4">
                <span className="mb-6">
                  <svg width="72" height="72" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" className="text-dark-400 dark:text-dark-500">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 17.75l-6.16 3.24 1.18-6.88-5-4.87 6.91-1L12 2.5l3.09 6.24 6.91 1-5 4.87 1.18 6.88z" />
                  </svg>
                </span>
                <div className="text-xl sm:text-2xl font-semibold mb-2">No favorites yet.</div>
                <div className="text-sm sm:text-base text-dark-400 dark:text-dark-500 text-center max-w-xs">
                  Click the <span className="inline align-text-bottom"><svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" className="inline text-dark-400 dark:text-dark-500 relative top-[2px]"><path strokeLinecap="round" strokeLinejoin="round" d="M12 17.75l-6.16 3.24 1.18-6.88-5-4.87 6.91-1L12 2.5l3.09 6.24 6.91 1-5 4.87 1.18 6.88z" /></svg></span> icon on any entry to add it to your Favorites!
                </div>
              </div>
            ) : selectedCategory === 'Recent' ? (
              <div className="flex flex-col items-center justify-center py-20 text-dark-500 dark:text-dark-400 px-4">
                <Folder size={72} className="mb-6 text-dark-300 dark:text-dark-700" />
                <div className="text-xl sm:text-2xl font-semibold mb-2 text-center">No entries added in the last 8 hours.</div>
                <div className="text-sm sm:text-base text-dark-400 dark:text-dark-500 text-center">
                  Press <span className="inline-flex items-center font-semibold text-dark-600 dark:text-dark-200 border border-dark-200 dark:border-dark-700 bg-dark-100/60 dark:bg-dark-800/60 px-3 py-1 rounded-lg mr-1">+ Save</span> in the top bar or <span className="font-mono bg-dark-100 dark:bg-dark-800 px-2 py-1 rounded">{isMac ? '⌘' : 'Ctrl'}+I</span> to add your first entry!
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-dark-500 dark:text-dark-400 px-4">
                <Folder size={72} className="mb-6 text-dark-300 dark:text-dark-700" />
                <div className="text-xl sm:text-2xl font-semibold mb-2">No entries found.</div>
                <div className="text-sm sm:text-base text-dark-400 dark:text-dark-500 text-center">
                  Press <span className="inline-flex items-center font-semibold text-dark-600 dark:text-dark-200 border border-dark-200 dark:border-dark-700 bg-dark-100/60 dark:bg-dark-800/60 px-3 py-1 rounded-lg mr-1">+ Save</span> in the top bar or <span className="font-mono bg-dark-100 dark:bg-dark-800 px-2 py-1 rounded">{isMac ? '⌘' : 'Ctrl'}+I</span> to add your first entry!
                </div>
              </div>
            )
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 px-4 sm:px-0">
              {entriesToShow.map((entry) => {
                // Map the first category ID to its name
                let categoryName = 'Unknown';
                let categoryId = undefined;
                if (entry.category_ids && entry.category_ids.length > 0 && categoryMap) {
                  const catId = entry.category_ids[0];
                  categoryName = categoryMap[catId] || 'Unknown';
                  categoryId = catId;
                }
                return (
                  <div
                    key={entry.id}
                    id={`entry-${entry.id}`}
                    ref={(el) => {
                      cardRefs.current[entry.id] = el;
                    }}
                  >
                    <ContentCard
                      id={entry.id}
                      title={entry.title || 'Untitled'}
                      url={entry.url}
                      notes={entry.notes}

                      favorite={entry.favorite}
                      createdAt={entry.created_at}
                      category={categoryName}
                      categoryId={categoryId}
                      categories={categories}
                      onCategoryChange={async (entryId, newCategoryId) => {
                        if (!currentUser) return;
                        const idToken = await currentUser.getIdToken();
                        await updateEntry(idToken, entryId, { category_ids: [newCategoryId] });
                        // Update local state
                        setEntries((prev: Entry[]) => prev.map((e: Entry) =>
                          e.id === entryId ? { ...e, category_ids: [newCategoryId] } : e
                        ));
                        // Navigate to the new category
                        setSelectedCategory(newCategoryId);
                        sessionStorage.setItem('lastSelectedCategory', newCategoryId);
                        await cleanupEmptyCategories(idToken);
                        const updatedCats = await fetchCategories(idToken);
                        setCategories(updatedCats);
                        const updatedMap: { [key: string]: string } = {};
                        updatedCats.forEach((cat) => { updatedMap[cat.id] = cat.name; });
                        setCategoryMap(updatedMap);
                      }}
                      onFavoriteToggle={async (entryId, newFavoriteState) => {
                        if (!currentUser) return;
                        const idToken = await currentUser.getIdToken();
                        await updateEntry(idToken, entryId, { favorite: newFavoriteState });
                        // Update local state
                        setEntries((prev: Entry[]) => prev.map((e: Entry) =>
                          e.id === entryId ? { ...e, favorite: newFavoriteState } : e
                        ));
                      }}
                      onDelete={handleDeleteEntry}
                      thumbnail={entry.thumbnail}
                      platform={entry.platform}
                      isCarousel={entry.is_carousel}
                      carouselCount={entry.carousel_count}

                      channel={entry.channel}
                      expandSummary={expandedSummaries[entry.id] || false}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Delete Category Confirmation Modal */}
      {showDeleteConfirm && (categoryToDelete || (categoriesToDelete && categoriesToDelete.length > 0)) && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 transition-all">
          <div className="bg-white dark:bg-dark-900 rounded-3xl p-8 max-w-lg w-full mx-4 shadow-2xl border border-dark-200/60 dark:border-dark-700/60 flex flex-col gap-6 animate-fade-in-fast">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-2xl font-extrabold text-dark-900 dark:text-white text-left">
                  Delete {categoriesToDelete && categoriesToDelete.length > 1 ? 'Categories' : 'Category'}?
                </h3>
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-red-500 text-white text-sm font-semibold"><span className="mr-1">⚠️</span>Warning</span>
              </div>
              <div className="text-red-500 text-base font-medium mb-2">
                This will also delete ALL entries in {categoriesToDelete && categoriesToDelete.length > 1 ? 'these categories' : 'this category'} permanently.
              </div>
              <div className="text-dark-700 dark:text-dark-200 text-base leading-relaxed mb-2">
                {categoriesToDelete && categoriesToDelete.length > 1 ? (
                  <>Are you sure you want to delete <b>{categoriesToDelete.length}</b> categories?</>
                ) : (
                  <>Are you sure you want to delete the category "{(categoryToDelete || categoriesToDelete?.[0])?.name}"?</>
                )}
              </div>
              <div className="text-dark-400 dark:text-dark-400 text-sm">This action cannot be undone.</div>
            </div>
            <div className="flex gap-4 mt-2">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setCategoryToDelete(null);
                  setCategoriesToDelete(null);
                }}
                className="flex-1 px-0 py-0 h-12 rounded-2xl border-2 border-dark-200 dark:border-dark-700 text-dark-700 dark:text-dark-200 bg-transparent hover:bg-dark-100 dark:hover:bg-dark-800/40 font-semibold text-base transition-all"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setShowDeleteConfirm(false);
                  // Bulk delete
                  if (categoriesToDelete && categoriesToDelete.length > 0) {
                    if (!currentUser) return;
                    const idToken = await currentUser.getIdToken();
                    for (const cat of categoriesToDelete) {
                      await deleteCategory(idToken, cat.id);
                    }
                    setEntries((prev: Entry[]) => prev.filter((entry: Entry) =>
                      !entry.category_ids || !entry.category_ids.some(catId => categoriesToDelete.map(c => c.id).includes(catId))
                    ));
                    setCategories((prev: Category[]) => prev.filter(cat => !categoriesToDelete.map(c => c.id).includes(cat.id)));
                    setCategoryMap((prev: { [key: string]: string }) => {
                      const newMap: { [key: string]: string } = { ...prev };
                      categoriesToDelete.forEach(cat => { delete newMap[cat.id]; });
                      return newMap;
                    });
                    setSelectedCategoryIds([]);
                    const cats = await fetchCategories(idToken);
                    setCategories(cats);
                    const map: { [key: string]: string } = {};
                    cats.forEach((cat) => { map[cat.id] = cat.name; });
                    setCategoryMap(map);
                    const data = await fetchEntries(idToken);
                    setEntries(data);
                    setCategoriesToDelete(null);
                    setIsCategoryEditMode(false);
                  } else if (categoryToDelete) {
                    // Single delete fallback
                    await handleDeleteCategory(categoryToDelete);
                    setCategoryToDelete(null);
                  }
                }}
                className="flex-1 h-12 rounded-2xl border-2 border-red-500 text-red-500 bg-transparent font-bold text-sm transition-all shadow-sm hover:bg-red-500 hover:text-white active:bg-red-600 active:text-white focus:outline-none focus:ring-2 focus:ring-red-400 whitespace-nowrap min-w-[320px] px-8"
              >
                Delete {categoriesToDelete && categoriesToDelete.length > 1 ? 'Categories & Entries' : 'Category & Entries'}
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

      {/* Rename Category Modal */}
      {showRenameModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-dark-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-dark-900 dark:text-white mb-4">
              Rename Category
            </h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!renameCategoryName.trim()) {
                  setRenameError('Category name cannot be empty.');
                  return;
                }
                setRenameLoading(true);
                setRenameError(null);
                try {
                  if (!currentUser || !renameCategoryId) return;
                  const idToken = await currentUser.getIdToken();
                  const catObj = categories.find(cat => cat.id === renameCategoryId);
                  await updateCategory(idToken, renameCategoryId, {
                    name: renameCategoryName.trim(),
                    ai_generated: catObj?.ai_generated ?? false,
                  });
                  // Refresh categories and entries
                  const cats = await fetchCategories(idToken);
                  setCategories(cats);
                  const updatedMap: { [key: string]: string } = {};
                  cats.forEach((cat: Category) => { updatedMap[cat.id] = cat.name; });
                  setCategoryMap(updatedMap);
                  const data = await fetchEntries(idToken);
                  setEntries(data);
                  setShowRenameModal(false);
                  setRenameCategoryId(null);
                  setRenameCategoryName('');
                } catch (err: unknown) {
                  setRenameError(err instanceof Error ? err.message : 'Failed to rename category.');
                } finally {
                  setRenameLoading(false);
                }
              }}
              autoComplete="off"
            >
              <input
                type="text"
                className="w-full px-3 py-2 rounded-full border border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-900 text-dark-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 mb-4"
                placeholder="New category name"
                value={renameCategoryName}
                autoFocus
                onChange={e => setRenameCategoryName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Escape') {
                    setShowRenameModal(false);
                    setRenameCategoryId(null);
                    setRenameCategoryName('');
                  }
                }}
                disabled={renameLoading}
              />
              {renameError && <div className="text-red-500 text-sm mb-2">{renameError}</div>}
              <div className="flex space-x-3 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowRenameModal(false);
                    setRenameCategoryId(null);
                    setRenameCategoryName('');
                  }}
                  className="flex-1 px-4 py-2 rounded-full border border-dark-200 dark:border-dark-700 text-dark-700 dark:text-dark-300 hover:bg-dark-50 dark:hover:bg-dark-700/50 transition-colors"
                  disabled={renameLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 rounded-full bg-primary-500 text-white hover:bg-primary-600 transition-colors disabled:opacity-60"
                  disabled={renameLoading || !renameCategoryName.trim()}
                >
                  {renameLoading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Entry Confirmation Modal */}
      {showDeleteEntryModal && entryToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 animate-fade-in-fast" onClick={() => setShowDeleteEntryModal(false)}>
          <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-2xl w-full max-w-md m-4 sm:m-8 p-4 sm:p-6 transform animate-slide-up-fast" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-500/10 rounded-full flex items-center justify-center">
                <Trash2 size={20} className="sm:w-6 sm:h-6 text-red-500" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-dark-900 dark:text-white">Delete Entry?</h2>
            </div>
            <p className="text-sm text-dark-600 dark:text-dark-300 mb-4">Are you sure you want to permanently delete "{entryToDelete.title}"? This action cannot be undone.</p>
            {deleteEntryError && <div className="bg-red-500/10 text-red-500 dark:text-red-400 p-3 rounded-lg text-sm mb-3">{deleteEntryError}</div>}
            <div className="flex justify-end gap-3 mt-6">
              <button
                className="px-3 sm:px-4 py-2 rounded-full border border-dark-200 dark:border-dark-700 text-dark-700 dark:text-dark-300 hover:bg-dark-50 dark:hover:bg-dark-700/50 transition-colors text-sm"
                onClick={() => setShowDeleteEntryModal(false)}
                disabled={deleteEntryLoading}
              >
                Cancel
              </button>
              <button
                className="px-3 sm:px-4 py-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-60 text-sm"
                onClick={confirmDeleteEntry}
                disabled={deleteEntryLoading}
              >
                {deleteEntryLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
