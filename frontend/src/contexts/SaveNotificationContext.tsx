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

interface SaveNotificationContextType {
  notifications: SaveNotification[];
  addNotification: (notification: Omit<SaveNotification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  shouldRefreshDashboard: boolean;
  markDashboardRefreshed: () => void;
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
      addNotification,
      removeNotification,
      clearNotifications,
      shouldRefreshDashboard,
      markDashboardRefreshed,
    }}>
      {children}
    </SaveNotificationContext.Provider>
  );
}; 