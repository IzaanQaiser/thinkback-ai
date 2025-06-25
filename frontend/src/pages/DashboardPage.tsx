import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Plus, Search, User as UserIcon, Sun, Moon, Zap, Star, LayoutGrid, Folder, Check, X, Edit, Pencil, GripVertical, HelpCircle } from 'lucide-react';
import Logo from '../components/Logo';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import ContentCard from '../components/ContentCard';
import Kbd from '../components/Kbd';
import HelpModal from '../components/HelpModal';
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
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { fetchEntries } from '../services/api';

const protectedCategories = ['For You', 'All', 'Favorites'];

const categoryIcons: { [key: string]: React.ElementType } = {
  Productivity: Zap,
  Finance: Folder,
  Health: Moon,
  Tech: Star
};

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
}

const DashboardPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const location = useLocation();
  const [isMac, setIsMac] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(sessionStorage.getItem('lastSelectedCategory') || 'For You');
  const [isCategoryEditMode, setIsCategoryEditMode] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [categories, setCategories] = useState<string[]>([...protectedCategories]);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

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

  const filteredData = entries.filter(item =>
    item.title && item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const contentToDisplay = selectedCategory === 'All' || selectedCategory === 'For You'
    ? filteredData
    : filteredData.filter(item => item.category_ids && item.category_ids.length && item.category_ids.includes(selectedCategory));

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
                <input ref={searchInputRef} type="text" placeholder="Search your vault..." className="w-full bg-transparent py-3 pl-14 pr-16 text-dark-900 dark:text-white placeholder-dark-500 dark:placeholder-dark-400 focus:outline-none relative z-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} autoComplete="off" />
              </div>
              <Kbd className="hidden sm:block">{isMac ? '⌘' : 'Ctrl'}+K</Kbd>
            </div>
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
                  items={categories.filter(c => !protectedCategories.includes(c))}
                  strategy={verticalListSortingStrategy}
                  disabled={!isCategoryEditMode}
                >
                  <nav className="flex flex-col space-y-1">
                    {categories.map((category) => (
                      <div key={category} className="touch-none">
                        <button
                          onClick={() => setSelectedCategory(category)}
                          disabled={isCategoryEditMode}
                          className={`flex items-center w-full h-9 rounded-full px-4 transition-colors duration-200 ${selectedCategory === category && !isCategoryEditMode ? 'bg-primary-500/10 text-primary-500 dark:text-primary-400' : 'text-dark-600 dark:text-dark-200'} ${isCategoryEditMode ? 'cursor-default' : 'hover:bg-dark-100/60 dark:hover:bg-dark-800/60 hover:text-dark-900 dark:hover:text-white'}`}
                        >
                          <div className="flex items-center space-x-3 text-left w-full">
                            <span className="font-medium text-sm flex-grow truncate">{category}</span>
                          </div>
                        </button>
                        {category === 'Favorites' && <div className="my-2 mx-3 border-b border-dark-200/80 dark:border-dark-800" />}
                      </div>
                    ))}
                  </nav>
                </SortableContext>
              </DndContext>
            </div>
          </aside>

          <main className="flex-1">
            {loading ? (
              <div className="text-center py-20 text-dark-500 dark:text-dark-400">Loading entries...</div>
            ) : contentToDisplay.length === 0 ? (
              <div className="text-center py-20 text-dark-500 dark:text-dark-400">No entries found.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {contentToDisplay.map((entry) => (
                  <ContentCard
                    key={entry.id}
                    title={entry.title || 'Untitled'}
                    url={entry.url}
                    notes={entry.notes}
                    tags={entry.tags || []}
                    favorite={entry.favorite}
                    createdAt={entry.created_at}
                  />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
