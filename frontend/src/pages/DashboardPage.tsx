// Import React hooks and components
import React, { useState, useEffect, useRef, useCallback } from 'react';
// Import routing components
import { Link, useLocation } from 'react-router-dom';
// Import icons from Lucide React
import { Plus, Search, User as UserIcon, Check, Pencil, ExternalLink, Trash2, X, Folder, ChevronLeft } from 'lucide-react';
// Import custom components
import Logo from '../components/Logo';
import ContentCard from '../components/ContentCard';
import Kbd from '../components/Kbd';
import FloatingFeedbackButton from '../components/FloatingFeedbackButton';
import SaveNotificationToast from '../components/SaveNotificationToast';
import SaveProgressIndicator from '../components/SaveProgressIndicator';
import SemanticSearchChat from '../components/SemanticSearchChat';
// Import context hooks for managing app state
import { useAuth } from '../contexts/AuthContext';
import { useSaveNotification } from '../contexts/SaveNotificationContext';
// Import custom hooks
import useGlobalProgress from '../hooks/useGlobalProgress';
// Import API functions for data operations
import { fetchEntries, fetchCategories, updateCategory, deleteCategory, updateEntry, createCategory, deleteEntry, cleanupEmptyCategories, checkCleanupNeeded } from '../services/api';

// Categories that cannot be deleted or modified by users
const protectedCategories = ['Recent', 'All', 'Favorites'];

// TypeScript interface for saved content entries
interface Entry {
  id: string;                    // Unique identifier
  url: string;                   // Original URL of the content
  title: string;                 // Display title
  notes?: string;                // User's personal notes
  summary?: string;              // AI-generated summary
  tags?: string[];               // User-added tags
  favorite?: boolean;            // Whether user marked as favorite
  created_at?: string;           // When the entry was created
  collection_ids?: string[];     // Which collections it belongs to
  category_ids?: string[];       // Which categories it belongs to
  thumbnail?: string;            // Preview image URL
  platform?: string;             // Source platform (YouTube, Instagram, etc.)
  is_carousel?: boolean;         // Whether it's a carousel post
  carousel_count?: number;       // Number of images in carousel
  channel?: string;              // Channel/creator name
}

// TypeScript interface for content categories
interface Category {
  id: string;                    // Unique identifier
  name: string;                  // Display name
  ai_generated?: boolean;        // Whether created by AI or user
}

// Main dashboard component that displays saved content
const DashboardPage: React.FC = () => {
  // Get current user and authentication data
  const { currentUser } = useAuth();
  // Get save notification state and functions
  const { notifications, removeNotification, shouldRefreshDashboard, markDashboardRefreshed } = useSaveNotification();
  // Get global progress tracking for save operations
  const { activeSaves, globalProgressTracker } = useGlobalProgress();

  // Search functionality state
  const [searchQuery, setSearchQuery] = useState('');                    // Current search text
  const [showSuggestions, setShowSuggestions] = useState(false);         // Whether to show search suggestions
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1); // Which suggestion is highlighted
  const searchInputRef = useRef<HTMLInputElement>(null);                // Reference to search input
  const suggestionsRef = useRef<HTMLDivElement>(null);                  // Reference to suggestions dropdown

  // Navigation and UI state
  const location = useLocation();                                       // Current route location
  const [isMac, setIsMac] = useState(false);                            // Whether user is on Mac (for keyboard shortcuts)
  const [selectedCategory, setSelectedCategory] = useState(sessionStorage.getItem('lastSelectedCategory') || 'Recent'); // Currently selected category
  const [sidebarOpen, setSidebarOpen] = useState(false);                // Whether mobile sidebar is open

  // Category management state
  const [isCategoryEditMode, setIsCategoryEditMode] = useState(false);  // Whether in category edit mode
  const [categories, setCategories] = useState<Category[]>([]);         // List of all categories
  const [categoryMap, setCategoryMap] = useState<{ [id: string]: string }>({}); // Map of category ID to name
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);    // Whether to show delete confirmation
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null); // Category being deleted
  const [categoriesToDelete, setCategoriesToDelete] = useState<Category[] | null>(null); // Multiple categories to delete
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]); // Selected categories for bulk operations

  // Category creation and editing state
  const [showAddCategory, setShowAddCategory] = useState(false);         // Whether to show add category form
  const [newCategoryName, setNewCategoryName] = useState('');           // Name for new category
  const [addCategoryLoading, setAddCategoryLoading] = useState(false);  // Loading state for adding category
  const [showRenameModal, setShowRenameModal] = useState(false);        // Whether to show rename modal
  const [renameCategoryId, setRenameCategoryId] = useState<string | null>(null); // Category being renamed
  const [renameCategoryName, setRenameCategoryName] = useState('');     // New name for category
  const [renameLoading, setRenameLoading] = useState(false);            // Loading state for rename
  const [renameError, setRenameError] = useState<string | null>(null);  // Error message for rename

  // Content entries state
  const [entries, setEntries] = useState<Entry[]>([]);                  // List of all saved entries
  const [loading, setLoading] = useState(true);                         // Whether data is loading
  const [selectedEntryIds, setSelectedEntryIds] = useState<string[]>([]); // Selected entries for operations
  const [showDeleteEntryModal, setShowDeleteEntryModal] = useState(false); // Whether to show delete entry modal
  const [entryToDelete, setEntryToDelete] = useState<Entry | null>(null); // Entry being deleted
  const [deleteEntryLoading, setDeleteEntryLoading] = useState(false);  // Loading state for deleting entry
  const [deleteEntryError, setDeleteEntryError] = useState<string | null>(null); // Error message for delete

  // Quick access customization state
  const [isQuickAccessEditMode, setIsQuickAccessEditMode] = useState(false); // Whether in quick access edit mode
  const [quickAccessVisibility, setQuickAccessVisibility] = useState(() => {
    // Load quick access visibility from localStorage
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

  // UI and animation state
  const [expandedSummaries, setExpandedSummaries] = useState<{ [key: string]: boolean }>({}); // Which summaries are expanded
  const cardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({}); // References to content cards
  const [showCategoryModal, setShowCategoryModal] = useState(false);     // Whether to show category modal

  // Performance and UX state
  const [lastLoadTime, setLastLoadTime] = useState<number>(0);           // When data was last loaded
  const [isInitialLoad, setIsInitialLoad] = useState(true);             // Whether this is the first load
  const [shouldSlideUpCards, setShouldSlideUpCards] = useState(false);  // Whether to animate cards sliding up
  const [newlySavedEntryIds, setNewlySavedEntryIds] = useState<Set<string>>(new Set()); // IDs of newly saved entries
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(0);     // When data was last refreshed
  const [isRefreshing, setIsRefreshing] = useState(false);              // Whether currently refreshing data

  // Detect if user is on Mac for keyboard shortcuts
  useEffect(() => {
    setIsMac(/(Mac|iPhone|iPod|iPad)/i.test(navigator.platform));
  }, []);

  // Focus search input when URL contains focus=search parameter
  useEffect(() => {
    if (location.search.includes('focus=search')) searchInputRef.current?.focus();
  }, [location]);

  // Update page title and save selected category to session storage
  useEffect(() => {
    document.title = 'thinkback - Dashboard';
    sessionStorage.setItem('lastSelectedCategory', selectedCategory);
  }, [selectedCategory]);

  // Trigger slide up animation when save progress indicators disappear
  useEffect(() => {
    if (activeSaves.length === 0 && shouldSlideUpCards) {
      // Reset the slide up state after animation completes
      setTimeout(() => {
        setShouldSlideUpCards(false);
      }, 600); // Match the slide up animation duration
    }
  }, [activeSaves.length, shouldSlideUpCards]);

  // Set slide up trigger when active saves become empty
  useEffect(() => {
    if (activeSaves.length === 0) {
      setShouldSlideUpCards(true);
    }
  }, [activeSaves.length]);

  // Main function to load dashboard data (entries and categories)
  const loadDashboardData = useCallback(async (forceRefresh: boolean = false) => {
    if (!currentUser) return;

    const now = Date.now();
    const timeSinceLastLoad = now - lastLoadTime;
    // Use cached data if it's less than 30 seconds old and not forcing refresh
    const shouldUseCache = !forceRefresh && timeSinceLastLoad < 30000; // 30 seconds

    try {
      setLoading(true);
      if (forceRefresh) {
        setIsRefreshing(true);
      }

      // Get user's authentication token
      const idToken = await currentUser.getIdToken();

      // Load entries and categories in parallel for better performance
      const [entriesData, categoriesData] = await Promise.all([
        fetchEntries(idToken, shouldUseCache),
        fetchCategories(idToken, shouldUseCache)
      ]);

      // Track newly saved entries for highlighting animation
      if (forceRefresh && entries.length > 0) {
        const newEntryIds = new Set<string>();
        entriesData.forEach((newEntry: Entry) => {
          const existingEntry = entries.find((oldEntry: Entry) => oldEntry.id === newEntry.id);
          if (!existingEntry) {
            // This is a newly saved entry
            newEntryIds.add(newEntry.id);
          }
        });

        if (newEntryIds.size > 0) {
          setNewlySavedEntryIds(newEntryIds);
          // Clear the highlight after 5 seconds
          setTimeout(() => {
            setNewlySavedEntryIds(new Set());
          }, 5000);
        }
      }

      // Update state with loaded data
      setEntries(entriesData);
      setCategories(categoriesData);

      // Build a map of category ID to name for quick lookups
      const map: { [id: string]: string } = {};
      categoriesData.forEach((cat: Category) => { map[cat.id] = cat.name; });
      setCategoryMap(map);

      // Update timing information
      setLastLoadTime(now);
      setLastRefreshTime(now);
      setIsInitialLoad(false);

      // Only run cleanup on initial load or force refresh, and only if needed
      if (isInitialLoad || forceRefresh) {
        try {
          const cleanupCheck = await checkCleanupNeeded(idToken);
          if (cleanupCheck.cleanup_needed) {
            // console.log(`🧹 Cleanup needed: ${cleanupCheck.empty_categories_count} empty categories found`);
            await cleanupEmptyCategories(idToken);
          } else {
            // console.log('✅ No cleanup needed');
          }
        } catch (error) {
          console.warn('Cleanup check failed, but continuing:', error);
        }
      }

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      if (isInitialLoad) {
        alert('Failed to load entries: ' + (error as Error).message);
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [currentUser, lastLoadTime, isInitialLoad, entries]);

  // Load data when component first mounts or user changes
  useEffect(() => {
    loadDashboardData();
  }, [currentUser]);

  // Refresh dashboard data when a save notification is triggered
  useEffect(() => {
    if (shouldRefreshDashboard && currentUser) {
      const refreshData = async () => {
        try {
          await loadDashboardData(true); // Force refresh

          // If the currently selected category was deleted, switch to 'Recent'
          if (selectedCategory !== 'Recent' && selectedCategory !== 'All' && selectedCategory !== 'Favorites' && !categories.find(cat => cat.id === selectedCategory)) {
            setSelectedCategory('Recent');
            sessionStorage.setItem('lastSelectedCategory', 'Recent');
          }

          markDashboardRefreshed();
        } catch (error) {
          console.error('Failed to refresh dashboard data:', error);
          markDashboardRefreshed();
        }
      };
      refreshData();
    }
  }, [shouldRefreshDashboard, currentUser, markDashboardRefreshed, selectedCategory, categories]);

  // Listen for save completions and show immediate feedback
  useEffect(() => {
    const handleSaveCompleted = (completedSave: any) => {
      try {
        if (completedSave?.savedEntry) {
          // Immediately refresh the dashboard to show the new entry
          if (currentUser) {
            loadDashboardData(true);
          }
        }
      } catch (error) {
        console.error('Error handling save completion:', error);
      }
    };

    // Subscribe to save completion events from the global progress tracker
    let unsubscribe: (() => void) | undefined;
    try {
      unsubscribe = globalProgressTracker.on('SAVE_COMPLETED', handleSaveCompleted);
      console.log('Dashboard: Successfully subscribed to SAVE_COMPLETED events');
    } catch (error) {
      console.error('Error subscribing to save completion events:', error);
    }

    return () => {
      // Clean up subscription when component unmounts
      if (typeof unsubscribe === 'function') {
        try {
          unsubscribe();
        } catch (error) {
          console.error('Error unsubscribing from save completion events:', error);
        }
      }
    };
  }, [currentUser, loadDashboardData]);

  // Refresh data when window regains focus (if data is stale)
  useEffect(() => {
    const handleFocus = () => {
      if (currentUser && !isInitialLoad) {
        const now = Date.now();
        const timeSinceLastLoad = now - lastLoadTime;

        // Only refresh if it's been more than 2 minutes since last load
        if (timeSinceLastLoad > 120000) {
          loadDashboardData();
        }
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [currentUser, lastLoadTime, isInitialLoad, loadDashboardData]);

  // Filter entries based on search query for real-time search
  const filteredData = entries.filter(item => {
    if (!searchQuery.trim()) return true; // Show all entries when search is empty

    const query = searchQuery.toLowerCase();
    return (
      item.title && item.title.toLowerCase().includes(query) ||
      item.notes && item.notes.toLowerCase().includes(query) ||
      item.tags && item.tags.some(tag => tag.toLowerCase().includes(query))
    );
  });

  // Get search suggestions for autocomplete dropdown
  const getSuggestions = () => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase();
    return entries
      .filter(item =>
        item.title && item.title.toLowerCase().includes(query) ||
        item.notes && item.notes.toLowerCase().includes(query) ||
        item.tags && item.tags.some(tag => tag.toLowerCase().includes(query))
      )
      .slice(0, 5); // Limit to 5 suggestions for better UX
  };

  const suggestions = getSuggestions();

  // Close search suggestions when clicking outside
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

  // Handle keyboard navigation for search suggestions
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showSuggestions || suggestions.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          // Move down through suggestions, wrap to top
          setSelectedSuggestionIndex(prev =>
            prev < suggestions.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          // Move up through suggestions, wrap to bottom
          setSelectedSuggestionIndex(prev =>
            prev > 0 ? prev - 1 : suggestions.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          // Select the highlighted suggestion
          if (selectedSuggestionIndex >= 0 && selectedSuggestionIndex < suggestions.length) {
            handleSuggestionClick(suggestions[selectedSuggestionIndex]);
          }
          break;
        case 'Escape':
          // Close suggestions
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

  // Build the sidebar categories list (protected + user categories)
  const sidebarCategories: Category[] = [
    // Add protected categories first
    ...protectedCategories.map((name) => ({ id: name, name, ai_generated: false })),
    // Add user-created categories, sorted alphabetically and deduplicated
    ...categories
      .filter((cat: Category) => !protectedCategories.includes(cat.name) && cat.name.trim().toLowerCase() !== 'uncategorized')
      .sort((a, b) => a.name.localeCompare(b.name))
      .filter((cat: Category, index: number, self: Category[]) =>
        index === self.findIndex((c: Category) => c.name === cat.name)
      ), // Remove duplicates based on name
  ];

  // Determine what entries to show based on selected category
  let mainHeading = '';
  let entriesToShow: Entry[] = [];

  if (selectedCategory === 'Favorites') {
    // Show only favorited entries
    mainHeading = 'Favorites';
    entriesToShow = filteredData.filter((item) => item.favorite);
  } else if (selectedCategory === 'Recent') {
    // Show entries from the last 8 hours
    mainHeading = 'Recent';
    const now = new Date();
    entriesToShow = filteredData.filter((item) => {
      if (!item.created_at) return false;
      const createdAt = new Date(item.created_at);
      const diffMs = now.getTime() - createdAt.getTime();
      return diffMs <= 8 * 60 * 60 * 1000; // 8 hours
    });
  } else if (protectedCategories.includes(selectedCategory)) {
    // Show all entries for protected categories (All, etc.)
    mainHeading = selectedCategory;
    entriesToShow = filteredData;
  } else {
    // Show entries from a specific user category
    const cat = categories.find((c: Category) => c.id === selectedCategory);
    mainHeading = cat ? cat.name : '';
    entriesToShow = filteredData.filter((item) => item.category_ids && item.category_ids.includes(selectedCategory));
  }

  // Handle platform-specific filtering
  if (selectedCategory.startsWith('platform:')) {
    const platform = selectedCategory.replace('platform:', '');
    mainHeading = platform;
    entriesToShow = filteredData.filter((item) => normalizePlatformKey(item.platform || '') === platform);
  }



  // Handle search input changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowSuggestions(value.length > 0);
    setSelectedSuggestionIndex(-1);
  };

  // Handle clicking on a search suggestion
  const handleSuggestionClick = (entry: Entry) => {
    // Clear search and close suggestions
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
        // console.log('Looking for entry element:', `entry-${entry.id}`, entryElement);
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
            // Remove the forced styles after 3 seconds
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

  // Handle deleting a category and all its entries
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

  // Handle delete entry - show confirmation modal
  const handleDeleteEntry = (entryId: string) => {
    const entry = entries.find(e => e.id === entryId);
    if (entry) {
      setEntryToDelete(entry);
      setShowDeleteEntryModal(true);
      setDeleteEntryError(null);
    }
  };

  // Confirm and execute entry deletion
  const confirmDeleteEntry = async () => {
    if (!currentUser || !entryToDelete) return;
    setDeleteEntryLoading(true);
    setDeleteEntryError(null);
    try {
      const idToken = await currentUser.getIdToken();
      await deleteEntry(idToken, entryToDelete.id);
      // Remove from local state
      setEntries((prev: Entry[]) => prev.filter(entry => entry.id !== entryToDelete.id));

      // Clean up empty categories and refresh category list
      await cleanupEmptyCategories(idToken);
      const cats = await fetchCategories(idToken);
      setCategories(cats);
      const map: { [id: string]: string } = {};
      cats.forEach((cat: Category) => { map[cat.id] = cat.name; });
      setCategoryMap(map);

      // If the currently selected category was deleted, switch to 'Recent'
      if (selectedCategory !== 'Recent' && selectedCategory !== 'All' && selectedCategory !== 'Favorites' && !cats.find(cat => cat.id === selectedCategory)) {
        setSelectedCategory('Recent');
        sessionStorage.setItem('lastSelectedCategory', 'Recent');
      }

      setShowDeleteEntryModal(false);
      setEntryToDelete(null);
    } catch (err: any) {
      setDeleteEntryError(err.message || 'Failed to delete entry.');
    } finally {
      setDeleteEntryLoading(false);
    }
  };

  // Create a new category and assign selected entries to it
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

  // Auto-switch selection when entering Quick Access edit mode
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

  // Auto-switch selection when entering category edit mode
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

  // Save quick access visibility preferences to localStorage
  useEffect(() => {
    localStorage.setItem('quickAccessVisibility', JSON.stringify(quickAccessVisibility));
  }, [quickAccessVisibility]);

  // Prevent body scrolling when category modal is open
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

  // Platform display configuration with icons and names
  const platformDisplay: { [key: string]: { name: string; icon: React.ReactNode } } = {
    'YouTube': { name: 'YouTube', icon: <span style={{ color: '#FF0000' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a2.994 2.994 0 0 0-2.107-2.117C19.228 3.5 12 3.5 12 3.5s-7.228 0-9.391.569A2.994 2.994 0 0 0 .502 6.186C0 8.35 0 12 0 12s0 3.65.502 5.814a2.994 2.994 0 0 0 2.107 2.117C4.772 20.5 12 20.5 12 20.5s7.228 0 9.391-.569a2.994 2.994 0 0 0 2.107-2.117C24 15.65 24 12 24 12s0-3.65-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg></span> },
    'Instagram': { name: 'Instagram', icon: <span style={{ color: '#E1306C' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.334 3.608 1.308.974.974 1.246 2.241 1.308 3.608.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.062 1.366-.334 2.633-1.308 3.608-.974.974-2.241 1.246-3.608 1.308-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.366-.062-2.633-.334-3.608-1.308-.974-.974-1.246-2.241-1.308-3.608C2.175 15.647 2.163 15.267 2.163 12s.012-3.584.07-4.85c.062-1.366.334-2.633 1.308-3.608.974-.974 2.241-1.246 3.608-1.308C8.416 2.175 8.796 2.163 12 2.163zm0-2.163C8.741 0 8.332.013 7.052.072 5.771.131 4.659.363 3.678 1.344c-.98.98-1.213 2.092-1.272 3.373C2.013 5.668 2 6.077 2 12c0 5.923.013 6.332.072 7.613.059 1.281.292 2.393 1.272 3.373.98.98 2.092 1.213 3.373 1.272C8.332 23.987 8.741 24 12 24s3.668-.013 4.948-.072c1.281-.059 2.393-.292 3.373-1.272.98-.98 1.213-2.092 1.272-3.373.059-1.281.072-1.69.072-7.613 0-5.923-.013-6.332-.072-7.613-.059-1.281-.292-2.393-1.272-3.373-.98-.98-2.092-1.213-3.373-1.272C15.668.013 15.259 0 12 0z" /><circle cx="12" cy="12" r="3.5" /><circle cx="18.406" cy="5.594" r="1.44" /></svg></span> },
    'Reddit': { name: 'Reddit', icon: <span style={{ color: '#FF4500' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12c0-6.627-5.373-12-12-12S0 5.373 0 12c0 6.627 5.373 12 12 12s12-5.373 12-12zm-6.5 2.5c.828 0 1.5.672 1.5 1.5s-.672 1.5-1.5 1.5-1.5-.672-1.5-1.5.672-1.5 1.5-1.5zm-11 0c.828 0 1.5.672 1.5 1.5s-.672 1.5-1.5 1.5-1.5-.672-1.5-1.5.672-1.5 1.5-1.5zm11.072 3.219c-1.219.781-3.219 1.281-5.572 1.281s-4.353-.5-5.572-1.281c-.219-.141-.281-.438-.141-.656.141-.219.438-.281.656-.141 1.031.656 2.906 1.219 5.057 1.219s4.025-.563 5.057-1.219c.219-.141.516-.078.656.141.141.219.078.516-.141.656z" /></svg></span> },
    'TikTok': { name: 'TikTok', icon: <span style={{ color: '#000' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2v2.5A5.5 5.5 0 0 0 17.5 10H20a8 8 0 1 1-8-8z" /></svg></span> },
    'X': { name: 'X', icon: <span style={{ color: '#000' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.53 2.47a.75.75 0 0 1 1.06 1.06l-5.22 5.22 5.22 5.22a.75.75 0 0 1-1.06 1.06l-5.22-5.22-5.22 5.22a.75.75 0 0 1-1.06-1.06l5.22-5.22-5.22-5.22A.75.75 0 0 1 6.25 2.47l5.22 5.22 5.22-5.22z" /></svg></span> },
    'Twitter/X Post': { name: 'X', icon: <span style={{ color: '#000' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.53 2.47a.75.75 0 0 1 1.06 1.06l-5.22 5.22 5.22 5.22a.75.75 0 0 1-1.06 1.06l-5.22-5.22-5.22 5.22a.75.75 0 0 1-1.06-1.06l5.22-5.22-5.22-5.22A.75.75 0 0 1 6.25 2.47l5.22 5.22 5.22-5.22z" /></svg></span> },
    'LinkedIn': { name: 'LinkedIn', icon: <span style={{ color: '#0077B5' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452H17.21v-5.569c0-1.327-.025-3.037-1.849-3.037-1.851 0-2.132 1.445-2.132 2.939v5.667H9.073V9h3.112v1.561h.045c.434-.823 1.494-1.691 3.073-1.691 3.287 0 3.892 2.164 3.892 4.977v6.605zM5.337 7.433a1.81 1.81 0 1 1 0-3.62 1.81 1.81 0 0 1 0 3.62zM6.956 20.452H3.715V9h3.241v11.452zM22.225 0H1.771C.792 0 0 .771 0 1.723v20.549C0 23.229.792 24 1.771 24h20.451C23.2 24 24 23.229 24 22.271V1.723C24 .771 23.2 0 22.225 0z" /></svg></span> },
  };

  // Normalize platform names for consistent grouping (e.g., Twitter/X, YouTube Shorts, etc.)
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

  // Count entries per platform for sidebar display
  const platformCounts: { [platform: string]: number } = {};
  entries.forEach(entry => {
    if (entry.platform) {
      const key = normalizePlatformKey(entry.platform);
      platformCounts[key] = (platformCounts[key] || 0) + 1;
    }
  });
  const platformList = Object.keys(platformCounts).filter(p => platformCounts[p] > 0);

  // Automatically expand summaries for shorter cards in each row
  useEffect(() => {
    if (entriesToShow.length === 0) return;

    // Use a small delay to ensure all cards are rendered
    const timeoutId = setTimeout(() => {
      // Group cards by row using their vertical position
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

      // For each row, find the tallest card and expand summaries for shorter ones
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

  // Expose category setter function globally for external use
  useEffect(() => {
    (window as any).setCategoriesFromOutside = (cats: Category[]) => setCategories(cats);
    return () => {
      delete (window as any).setCategoriesFromOutside;
    };
  }, []);

  return (
    // Main dashboard container with full screen height and dark theme
    <div className="fixed inset-0 w-full h-full bg-white dark:bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 text-dark-900 dark:text-white flex flex-col">
      {/* Top navigation bar with logo and action buttons */}
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-dark-900/30 backdrop-blur-xl border-b border-dark-200/50 dark:border-dark-800/50">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo section */}
            <div className="flex items-center gap-3">
              <Logo size="sm" />
            </div>
            {/* Action buttons section */}
            <div className="flex items-center space-x-2">
              {/* Mobile categories button (hidden on large screens) */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden flex items-center justify-center h-10 px-3 rounded-full bg-dark-100/50 dark:bg-dark-800/50 hover:bg-dark-200/60 dark:hover:bg-dark-700/70 transition-colors duration-200 text-dark-800 dark:text-white min-w-[80px]"
                title="Open categories"
              >
                <span className="font-medium text-xs leading-none">Categories</span>
              </button>
              {/* Save new content button */}
              <Link to="/save" className="flex items-center justify-center w-10 h-10 rounded-full bg-dark-100/50 dark:bg-dark-800/50 hover:bg-dark-200/60 dark:hover:bg-dark-700/70 transition-colors duration-200 text-dark-800 dark:text-white">
                <Plus size={16} className="text-gray-600 dark:text-white" />
              </Link>
              {/* Feedback button */}
              <FloatingFeedbackButton />
              {/* Account settings button */}
              <Link to="/account" className="flex items-center justify-center w-10 h-10 rounded-full bg-dark-100/50 dark:bg-dark-800/50 hover:bg-dark-200/60 dark:hover:bg-dark-700/70 transition-colors duration-200">
                <UserIcon size={20} className="text-dark-900 dark:text-white" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* AI-Powered Semantic Search Chat */}
      <div className="sticky top-[64px] z-20 bg-white/80 dark:bg-dark-900/30 backdrop-blur-xl border-b border-dark-200/30 dark:border-dark-800/30">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-4">
          <SemanticSearchChat
            onEntryClick={(entry) => {
              // Find the category this entry belongs to and navigate to it
              const entryCategoryId = entry.category_ids?.[0];
              if (entryCategoryId) {
                setSelectedCategory(entryCategoryId);
                sessionStorage.setItem('lastSelectedCategory', entryCategoryId);

                // Scroll to the entry after a short delay
                setTimeout(() => {
                  const entryElement = document.getElementById(`entry-${entry.id}`);
                  if (entryElement) {
                    entryElement.scrollIntoView({
                      behavior: 'smooth',
                      block: 'center'
                    });

                    // Highlight the entry temporarily
                    entryElement.style.borderColor = 'rgba(59, 130, 246, 0.3)';
                    entryElement.style.backgroundColor = document.documentElement.classList.contains('dark')
                      ? 'rgba(31, 41, 55, 1)'
                      : 'rgba(229, 231, 235, 0.5)';
                    entryElement.style.borderRadius = '0.75rem';
                    entryElement.style.transition = 'all 0.2s ease-in-out';

                    setTimeout(() => {
                      entryElement.style.borderColor = '';
                      entryElement.style.backgroundColor = '';
                      entryElement.style.borderRadius = '';
                      entryElement.style.transition = '';
                    }, 3000);
                  }
                }, 100);
              } else {
                setSelectedCategory('Recent');
                sessionStorage.setItem('lastSelectedCategory', 'Recent');
              }
            }}
            getIdToken={async () => {
              if (currentUser) {
                return await currentUser.getIdToken();
              }
              return null;
            }}
            isMac={isMac}
          />
        </div>
      </div>

      {/* Main content area with sidebar and entries */}
      <div className="flex flex-1 min-h-0 max-w-screen-2xl mx-auto w-full px-4 sm:px-6 py-0 gap-4 lg:gap-8">
        {/* Mobile sidebar overlay (dark background when sidebar is open) */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Left sidebar with categories and quick access */}
        <aside className={`fixed lg:relative inset-y-0 left-0 z-50 lg:z-auto w-80 lg:w-1/4 xl:w-1/5 h-full overflow-y-auto hide-scrollbar overflow-x-hidden pt-8 pb-8 bg-white/5 dark:bg-dark-900/5 backdrop-blur-md border-r border-dark-200/30 dark:border-dark-800/30 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
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

        {/* Main content area showing entries */}
        <main className="flex-1 h-full overflow-y-auto hide-scrollbar pt-8 pb-8">
          {/* Page heading with refresh indicator */}
          {mainHeading && (
            <h2
              className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-center mb-6 px-4"
              style={{ textShadow: '0 0 35px rgba(14, 165, 233, 0.6)' }}
            >
              {mainHeading}
              {/* Show refreshing indicator when data is being updated */}
              {isRefreshing && (
                <span className="inline-flex items-center gap-2 ml-3 text-sm font-normal text-green-600 dark:text-green-400">
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                  </svg>
                  <span>Updating...</span>
                </span>
              )}
            </h2>
          )}

          {/* Save progress indicators for ongoing save operations */}
          {activeSaves.length > 0 && (
            <div className="px-4 sm:px-0 mb-6">
              <div className="space-y-3">
                {/* Only show the most recent save progress indicator */}
                <SaveProgressIndicator
                  key={activeSaves[0].id}
                  progress={activeSaves[0]}
                  onClose={() => globalProgressTracker.removeSave(activeSaves[0].id)}
                />
              </div>
            </div>
          )}
          {/* Content display based on loading and data state */}
          {loading ? (
            // Loading state
            <div className="text-center py-20 text-dark-500 dark:text-dark-400">Loading entries...</div>
          ) : entriesToShow.length === 0 ? (
            // Empty state messages based on selected category
            selectedCategory === 'Favorites' ? (
              // No favorites message
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
              // No recent entries message
              <div className="flex flex-col items-center justify-center py-20 text-dark-500 dark:text-dark-400 px-4">
                <Folder size={72} className="mb-6 text-dark-300 dark:text-dark-700" />
                <div className="text-xl sm:text-2xl font-semibold mb-2 text-center">No entries added in the last 8 hours.</div>
                <div className="text-sm sm:text-base text-dark-400 dark:text-dark-500 text-center">
                  Press <span className="inline-flex items-center font-semibold text-dark-600 dark:text-dark-200 border border-dark-200 dark:border-dark-700 bg-dark-100/60 dark:bg-dark-800/60 px-3 py-1 rounded-lg mr-1">+ Save</span> in the top bar or <span className="font-mono bg-dark-100 dark:bg-dark-800 px-2 py-1 rounded">{isMac ? '⌘' : 'Ctrl'}+I</span> to add your first entry!
                </div>
              </div>
            ) : (
              // No entries in category message
              <div className="flex flex-col items-center justify-center py-20 text-dark-500 dark:text-dark-400 px-4">
                <Folder size={72} className="mb-6 text-dark-300 dark:text-dark-700" />
                <div className="text-xl sm:text-2xl font-semibold mb-2">No entries found.</div>
                <div className="text-sm sm:text-base text-dark-400 dark:text-dark-500 text-center">
                  Press <span className="inline-flex items-center font-semibold text-dark-600 dark:text-dark-200 border border-dark-200 dark:border-dark-700 bg-dark-100/60 dark:bg-dark-800/60 px-3 py-1 rounded-lg mr-1">+ Save</span> in the top bar or <span className="font-mono bg-dark-100 dark:bg-dark-800 px-2 py-1 rounded">{isMac ? '⌘' : 'Ctrl'}+I</span> to add your first entry!
                </div>
              </div>
            )
          ) : (
            // Grid of content cards
            <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 px-4 sm:px-0 ${shouldSlideUpCards ? 'animate-slide-up' : ''
              }`}>
              {entriesToShow.map((entry) => {
                // Map the first category ID to its name
                let categoryName = 'Unknown';
                let categoryId = undefined;
                if (entry.category_ids && entry.category_ids.length > 0 && categoryMap) {
                  const catId = entry.category_ids[0];
                  categoryName = categoryMap[catId] || 'Unknown';
                  categoryId = catId;
                }

                // Check if this is a newly saved entry
                const isNewlySaved = newlySavedEntryIds.has(entry.id);

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

                        // Clean up empty categories and refresh category list
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

      {/* Delete Category Confirmation Modal - warns user about deleting categories and all their entries */}
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

      {/* Add Category Modal - allows creating new categories and assigning entries to them */}
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

      {/* Rename Category Modal - allows renaming existing categories */}
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

      {/* Delete Entry Confirmation Modal - confirms deletion of individual entries */}
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

      {/* Save Notifications - Hidden (commented out but kept for future use) */}
      {/* {notifications.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-3">
          {notifications.map((notification) => (
            <SaveNotificationToast
              key={notification.id}
              notification={notification}
              onClose={() => removeNotification(notification.id)}
              isExiting={notification.isExiting}
            />
          ))}
        </div>
      )} */}
    </div>
  );
};

// Export the main dashboard component
export default DashboardPage;
