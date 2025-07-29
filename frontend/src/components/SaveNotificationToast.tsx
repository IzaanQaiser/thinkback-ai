import React from 'react';
import { X, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { SaveNotification } from '../contexts/SaveNotificationContext';

interface SaveNotificationToastProps {
  notification: SaveNotification;
  onClose: () => void;
  isExiting?: boolean;
}

const SaveNotificationToast: React.FC<SaveNotificationToastProps> = ({ notification, onClose, isExiting = false }) => {
  const isSuccess = notification.type === 'success';
  const isError = notification.type === 'error';

  return (
    <div className={`
      relative w-full max-w-sm bg-white dark:bg-dark-800 rounded-2xl shadow-lg border 
      ${isSuccess ? 'border-green-200 dark:border-green-800' : 'border-red-200 dark:border-red-800'}
      transform
      ${isExiting ? 'animate-slide-out-right' : 'animate-slide-in-right'}
    `}>

      
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={`
            flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
            ${isSuccess ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'}
          `}>
            {isSuccess ? (
              <CheckCircle size={20} className="text-green-600 dark:text-green-400" />
            ) : (
              <AlertCircle size={20} className="text-red-600 dark:text-red-400" />
            )}
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h4 className={`
                font-semibold text-sm leading-tight
                ${isSuccess ? 'text-green-900 dark:text-green-100' : 'text-red-900 dark:text-red-100'}
              `}>
                {notification.title}
              </h4>
              <button
                onClick={onClose}
                className="flex-shrink-0 w-6 h-6 rounded-full hover:bg-dark-100 dark:hover:bg-dark-700 flex items-center justify-center transition-colors"
              >
                <X size={14} className="text-dark-500 dark:text-dark-400" />
              </button>
            </div>
            
            <p className="text-sm text-dark-600 dark:text-dark-300 mt-1 leading-relaxed">
              {notification.message}
            </p>
            
            {/* Entry details for success notifications */}
            {isSuccess && notification.entryTitle && (
              <div className="mt-3 p-2 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-200 dark:border-green-800/30">
                <div className="flex items-center gap-2 text-xs text-green-700 dark:text-green-300">
                  <ExternalLink size={12} />
                  <span className="font-medium truncate">{notification.entryTitle}</span>
                </div>
                {notification.category && (
                  <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                    Category: {notification.category}
                  </div>
                )}
                {notification.platform && (
                  <div className="text-xs text-green-600 dark:text-green-400">
                    Platform: {notification.platform}
                  </div>
                )}
              </div>
            )}
            
            {/* Error details for error notifications */}
            {isError && (
              <div className="mt-2 text-xs text-red-600 dark:text-red-400">
                {notification.message}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SaveNotificationToast; 