import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Plus, Search, User as UserIcon, Sun, Moon, Zap, Clock, Star, LayoutGrid, Folder, Check, X, Edit, Pencil, GripVertical, HelpCircle } from 'lucide-react';
import Logo from '../components/Logo';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import ContentCard from '../components/ContentCard';
import Kbd from '../components/Kbd';
import { mockData } from '../data/mockData';
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

const protectedCategories = ['For You', 'All', 'Favorites'];

const groupContentByCategory = (items: typeof mockData) => {
  const groups: { [key: string]: typeof mockData } = {
    All: items,
    Favorites: items.filter(item => item.favorite),
  };
  items.forEach(item => {
    const key = item.category;
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  });
  return groups;
};

interface DashboardProps {
  isCategoryEditMode: boolean;
  selectedCategory: string;
  editingCategory: string | null;
  editingCategoryName: string;
  setSelectedCategory: (category: string) => void;
  handleRename: (category: string) => void;
  handleSaveRename: (oldName: string) => void;
  handleDelete: (category: string) => void;
  setEditingCategoryName: (name: string) => void;
  setEditingCategory: (category: string | null) => void;
}

function SortableCategoryItem({ id, category, dashboardProps }: { id: string, category: string, dashboardProps: DashboardProps }) {
  const {
    isCategoryEditMode,
    selectedCategory,
    editingCategory,
    editingCategoryName,
    setSelectedCategory,
    handleRename,
    handleSaveRename,
    handleDelete,
    setEditingCategoryName,
    setEditingCategory
  } = dashboardProps;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 'auto',
  };

  const isActive = selectedCategory === category;
  const isSpecialCategory = protectedCategories.includes(category);
  const isEditing = editingCategory === category;
  const Icon = category === 'For You' || category === 'Favorites' ? Star : category === 'All' ? LayoutGrid : categoryIcons[category] || Folder;

  return (
    <div ref={setNodeRef} style={style} className="touch-none">
      <div className="relative group px-3">
        <button
          onClick={() => !isEditing && setSelectedCategory(category)}
          disabled={isCategoryEditMode}
          className={`flex items-center w-full h-9 rounded-full px-4 transition-colors duration-200 ${isActive && !isCategoryEditMode ? 'bg-primary-500/10 text-primary-500 dark:text-primary-400' : 'text-dark-600 dark:text-dark-200'} ${isCategoryEditMode ? 'cursor-default' : 'hover:bg-dark-100/60 dark:hover:bg-dark-800/60 hover:text-dark-900 dark:hover:text-white'} ${isEditing ? 'bg-dark-200/60 dark:bg-dark-800/60' : ''}`}
        >
          <div className="flex items-center space-x-3 text-left w-full">
            {isCategoryEditMode && !isSpecialCategory && (
              <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
                <GripVertical size={16} className="text-dark-400" />
              </div>
            )}
            <Icon size={18} className={`flex-shrink-0 ${isCategoryEditMode && !isSpecialCategory ? '' : 'mr-3'} ${isActive && !isCategoryEditMode ? 'text-primary-500 dark:text-primary-400' : 'text-dark-400'}`} />
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
        </button>

        {isCategoryEditMode && !isSpecialCategory && !isEditing && (
          <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center space-x-1 transition-opacity">
            <button onClick={() => handleRename(category)} className="p-1 text-dark-500 dark:text-dark-400 hover:text-dark-900 dark:hover:text-white rounded-full hover:bg-dark-200/70 dark:hover:bg-dark-700/70 transition-colors">
              <Edit size={14} />
            </button>
            <button onClick={() => handleDelete(category)} className="p-1 text-red-500 hover:text-red-400 rounded-full hover:bg-red-500/10 transition-colors">
              <X size={14} />
            </button>
          </div>
        )}
      </div>
      {category === 'Favorites' && <div className="my-2 mx-3 border-b border-dark-200/80 dark:border-dark-800" />}
    </div>
  );
}

const DashboardPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [ghostSuggestion, setGhostSuggestion] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const location = useLocation();
  const [isMac, setIsMac] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(sessionStorage.getItem('lastSelectedCategory') || 'For You');
  const [isCategoryEditMode, setIsCategoryEditMode] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  const allContentGrouped = groupContentByCategory(mockData);
  const initialCategories = [...protectedCategories, ...Object.keys(allContentGrouped).filter(c => !protectedCategories.includes(c)).sort()];
  const [categories, setCategories] = useState<string[]>(initialCategories);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => { setIsMac(/(Mac|iPhone|iPod|iPad)/i.test(navigator.platform)); }, []);
  useEffect(() => { if (location.search.includes('focus=search')) searchInputRef.current?.focus(); }, [location]);

  useEffect(() => {
    document.title = 'thinkback.ai - Dashboard';
    sessionStorage.setItem('lastSelectedCategory', selectedCategory);
  }, [selectedCategory]);

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
      const mainCategories = [...categories.filter(c => !protectedCategories.includes(c)), trimmedName].sort();
      setCategories([...protectedCategories, ...mainCategories]);
      setSelectedCategory(trimmedName);
      setNewCategoryName('');
      setIsCreatingCategory(false);
    }
  };

  const handleEditToggle = () => {
    setIsCategoryEditMode(!isCategoryEditMode);
    setEditingCategory(null);
  }

  const handleRename = (category: string) => {
    setEditingCategory(category);
    setEditingCategoryName(category);
  };

  const handleSaveRename = (oldName: string) => {
    const newName = editingCategoryName.trim();
    if (newName && newName !== oldName && !categories.find(c => c.toLowerCase() === newName.toLowerCase())) {
      setCategories(categories.map(c => c === oldName ? newName : c));
      setSelectedCategory(newName);
    }
    setEditingCategory(null);
  };

  const handleDelete = (categoryToDelete: string) => {
    setCategories(categories.filter(c => c !== categoryToDelete));
    if (selectedCategory === categoryToDelete) {
      setSelectedCategory('All');
    }
  };

  const filteredData = mockData.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const contentToDisplay = selectedCategory === 'All' || selectedCategory === 'For You'
    ? filteredData
    : filteredData.filter(item => item.category === selectedCategory);

  return (
    <>
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
                  <input ref={searchInputRef} type="text" placeholder="Search your vault..." className="w-full bg-transparent py-3 pl-14 pr-16 text-dark-900 dark:text-white placeholder-dark-500 dark:placeholder-dark-400 focus:outline-none relative z-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={handleKeyDown} autoComplete="off" />
                  <div className="absolute inset-y-0 left-0 w-full py-3 pl-14 pr-16 text-dark-400 dark:text-dark-500 pointer-events-none">
                    {ghostSuggestion && (<span><span className="opacity-0">{searchQuery}</span><span>{ghostSuggestion.substring(searchQuery.length)}</span></span>)}
                  </div>
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
                  <button onClick={handleEditToggle} className="p-1 rounded-full text-dark-500 dark:text-dark-400 hover:text-dark-900 dark:hover:text-white hover:bg-dark-200/70 dark:hover:bg-dark-700/70 transition-colors">
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
                        <SortableCategoryItem key={category} id={category} category={category} dashboardProps={{
                          isCategoryEditMode,
                          selectedCategory,
                          editingCategory,
                          editingCategoryName,
                          setSelectedCategory,
                          handleRename,
                          handleSaveRename,
                          handleDelete,
                          setEditingCategoryName,
                          setEditingCategory
                        }} />
                      ))}
                    </nav>
                  </SortableContext>
                </DndContext>

                <div className="mt-2 px-3">
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
              </div>
            </aside>

            <main className="w-full lg:w-3/4 xl:w-4/5">
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

      <button
        onClick={() => setIsHelpModalOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-12 h-12 bg-primary-500 hover:bg-primary-600 text-white rounded-full flex items-center justify-center shadow-lg transform hover:scale-110 transition-all duration-200"
        aria-label="Open user guide"
      >
        <HelpCircle size={24} />
      </button>

      <HelpModal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} />
    </>
  );
};

export default DashboardPage;
