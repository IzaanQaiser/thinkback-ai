import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface SaveNotification {
  id: string;
  type: 'success' | 'error';
  title: string;
  message: string;
  entryTitle?: string;
  category?: string;
  platform?: string;
  timestamp: Date;
  isExiting?: boolean;
}

export interface SaveProgress {
  id: string;
  url: string;
  stepStatuses: ('pending' | 'in_progress' | 'done')[];
  currentStep: number;
  totalSteps: number;
  startTime: Date;
  isExiting?: boolean;
  // Saved entry information
  savedEntry?: {
    title: string;
    category: string;
    platform: string;
    tags: string[];
  };
}

interface SaveNotificationContextType {
  notifications: SaveNotification[];
  activeSaves: SaveProgress[];
  addNotification: (notification: Omit<SaveNotification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  shouldRefreshDashboard: boolean;
  markDashboardRefreshed: () => void;
  addSaveProgress: (progress: Omit<SaveProgress, 'id' | 'startTime'>) => string;
  updateSaveProgress: (id: string, updates: Partial<SaveProgress>) => void;
  removeSaveProgress: (id: string) => void;
  clearSaveProgress: () => void;
}

const SaveNotificationContext = createContext<SaveNotificationContextType | undefined>(undefined);

export const useSaveNotification = () => {
  const context = useContext(SaveNotificationContext);
  if (context === undefined) {
    throw new Error('useSaveNotification must be used within a SaveNotificationProvider');
  }
  return context;
};

interface SaveNotificationProviderProps {
  children: ReactNode;
}

export const SaveNotificationProvider: React.FC<SaveNotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<SaveNotification[]>([]);
  const [activeSaves, setActiveSaves] = useState<SaveProgress[]>([]);
  const [shouldRefreshDashboard, setShouldRefreshDashboard] = useState(false);

  const addNotification = (notification: Omit<SaveNotification, 'id' | 'timestamp'>) => {
    const newNotification: SaveNotification = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      isExiting: false,
    };
    
    setNotifications(prev => [newNotification, ...prev]);
    
    // Trigger dashboard refresh for success notifications
    if (notification.type === 'success') {
      // Small delay to ensure the save operation is complete
      setTimeout(() => {
        setShouldRefreshDashboard(true);
      }, 100);
    }
    
    // Auto-remove success notifications after 8 seconds
    if (notification.type === 'success') {
      setTimeout(() => {
        removeNotification(newNotification.id);
      }, 8000);
    }
  };

  const addSaveProgress = (progress: Omit<SaveProgress, 'id' | 'startTime'>) => {
    const newProgress: SaveProgress = {
      ...progress,
      id: Math.random().toString(36).substr(2, 9),
      startTime: new Date(),
      isExiting: false,
    };
    console.log('Context: Adding new save progress:', newProgress);
    setActiveSaves(prev => {
      const updated = [newProgress, ...prev];
      console.log('Context: Active saves after adding:', updated);
      return updated;
    });
    return newProgress.id;
  };

  const updateSaveProgress = (id: string, updates: Partial<SaveProgress>) => {
    console.log('Context: Updating save progress:', { id, updates });
    setActiveSaves(prev => {
      const updated = prev.map(progress => 
        progress.id === id ? { ...progress, ...updates } : progress
      );
      console.log('Context: Updated active saves:', updated);
      return updated;
    });
  };

  const removeSaveProgress = (id: string) => {
    setActiveSaves(prev => prev.map(progress => 
      progress.id === id ? { ...progress, isExiting: true } : progress
    ));
    setTimeout(() => {
      setActiveSaves(prev => prev.filter(progress => progress.id !== id));
    }, 400);
  };

  const clearSaveProgress = () => {
    setActiveSaves([]);
  };

  const removeNotification = (id: string) => {
    // First mark the notification as exiting to trigger the slide-out animation
    setNotifications(prev => prev.map(notification => 
      notification.id === id ? { ...notification, isExiting: true } : notification
    ));
    
    // Then remove it after the animation completes
    setTimeout(() => {
      setNotifications(prev => prev.filter(notification => notification.id !== id));
    }, 400); // Match the animation duration
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const markDashboardRefreshed = () => {
    setShouldRefreshDashboard(false);
  };

  return (
    <SaveNotificationContext.Provider value={{
      notifications,
      activeSaves,
      addNotification,
      removeNotification,
      clearNotifications,
      shouldRefreshDashboard,
      markDashboardRefreshed,
      addSaveProgress,
      updateSaveProgress,
      removeSaveProgress,
      clearSaveProgress,
    }}>
      {children}
    </SaveNotificationContext.Provider>
  );
}; 