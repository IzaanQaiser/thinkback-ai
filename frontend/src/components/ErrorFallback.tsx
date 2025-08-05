import React from 'react';
import { AlertTriangle, RefreshCw, Bug, ExternalLink } from 'lucide-react';
import Button from './Button';

interface ErrorFallbackProps {
  error: Error | string;
  onRetry?: () => void;
  onDismiss?: () => void;
  showBugReport?: boolean;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({ 
  error, 
  onRetry, 
  onDismiss, 
  showBugReport = true 
}) => {
  const errorMessage = typeof error === 'string' ? error : error.message;
  
  const handleBugReport = () => {
    const bugReportData = {
      type: 'bug',
      title: 'Save Process Error',
      description: `Error: ${errorMessage}\n\nUser encountered this error during the save process. Please investigate.`,
      priority: 'high',
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString()
    };

    // Store in localStorage for the feedback page to pick up
    localStorage.setItem('pendingBugReport', JSON.stringify(bugReportData));
    
    // Navigate to feedback page
    window.location.href = '/feedback';
  };

  return (
    <div className="w-full max-w-lg mx-auto mb-8 bg-red-50 dark:bg-red-900/20 rounded-2xl shadow p-6 border border-red-200/40 dark:border-red-800/40">
      <div className="flex items-center gap-3 mb-4">
        <AlertTriangle className="w-6 h-6 text-red-500" />
        <h2 className="text-xl font-bold text-red-700 dark:text-red-400">
          Something went wrong
        </h2>
      </div>
      
      <p className="text-red-600 dark:text-red-300 mb-4">
        {errorMessage}
      </p>
      
      <div className="flex flex-col sm:flex-row gap-3">
        {onRetry && (
          <Button
            onClick={onRetry}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </Button>
        )}
        
        {showBugReport && (
          <Button
            onClick={handleBugReport}
            variant="outline"
            className="flex items-center gap-2 border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            <Bug className="w-4 h-4" />
            Report Bug
          </Button>
        )}
        
        {onDismiss && (
          <Button
            onClick={onDismiss}
            variant="ghost"
            className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Dismiss
          </Button>
        )}
      </div>
      
      <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
        <p className="text-sm text-yellow-700 dark:text-yellow-300">
          💡 <strong>Tip:</strong> If this keeps happening, try:
        </p>
        <ul className="text-sm text-yellow-600 dark:text-yellow-400 mt-2 space-y-1">
          <li>• Checking if the URL is valid and accessible</li>
          <li>• Refreshing the page and trying again</li>
          <li>• Using a different browser</li>
        </ul>
      </div>
    </div>
  );
};

export default ErrorFallback; 