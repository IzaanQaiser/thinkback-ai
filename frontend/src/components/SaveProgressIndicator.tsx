import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Loader2, CheckCircle, Clock, ExternalLink, X } from 'lucide-react';
import { GlobalSaveProgress } from '../utils/globalProgressTracker';

interface SaveProgressIndicatorProps {
  progress: GlobalSaveProgress;
  onClose: () => void;
}

const SaveProgressIndicator: React.FC<SaveProgressIndicatorProps> = React.memo(({ progress, onClose }) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [dots, setDots] = useState('');
  const [isFadingOut, setIsFadingOut] = useState(false);

  // Memoize expensive calculations
  const isComplete = useMemo(() => {
    const complete = progress.stepStatuses.every(status => status === 'done');
    console.log('🔍 SAVE PROGRESS DEBUG:', { 
      progressId: progress.id, 
      isComplete: complete,
      savedEntry: progress.savedEntry,
      stepStatuses: progress.stepStatuses
    });
    return complete;
  }, [progress.stepStatuses, progress.id, progress.savedEntry]);
  
  const completedSteps = useMemo(() => progress.stepStatuses.filter(status => status === 'done').length, [progress.stepStatuses]);
  const inProgressSteps = useMemo(() => progress.stepStatuses.filter(status => status === 'in_progress').length, [progress.stepStatuses]);
  const progressPercentage = useMemo(() => {
    return isComplete ? 100 : ((completedSteps + (inProgressSteps * 0.5)) / progress.totalSteps) * 100;
  }, [isComplete, completedSteps, inProgressSteps, progress.totalSteps]);
  
  const currentStepProgress = useMemo(() => {
    return isComplete ? progress.totalSteps : progress.currentStep + 1;
  }, [isComplete, progress.totalSteps, progress.currentStep]);

  // Memoize the onClose callback to prevent unnecessary re-renders
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  // Auto-dismiss after 7 seconds when complete - SIMPLE LOGIC
  useEffect(() => {
    if (isComplete) {
      setTimeout(() => {
        setIsFadingOut(true);
        // Wait for fade out animation to complete before calling onClose
        setTimeout(() => {
          handleClose();
        }, 500); // Match the fade out animation duration
      }, 7000);
    }
  }, [isComplete, handleClose]);

  // Update elapsed time (stop when complete)
  useEffect(() => {
    if (isComplete) return; // Stop timer when complete

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - progress.startTime.getTime()) / 1000);
      setElapsedTime(elapsed);
    }, 1000);
    return () => clearInterval(interval);
  }, [progress.startTime, isComplete]);

  // Animated dots for in-progress steps
  useEffect(() => {
    if (isComplete) return; // Stop dots animation when complete
    
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, [isComplete]);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const getCurrentStepName = useCallback(() => {
    const stepNames = [
      'Authentication',
      'Content Analysis',
      'AI Classification',
      'Content Processing',
      'Database Storage',
      'Finalizing',
      'Complete'
    ];
    return stepNames[progress.currentStep] || 'Processing';
  }, [progress.currentStep]);

  const getPlatformFromUrl = useCallback((url: string) => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'YouTube';
    if (url.includes('twitter.com') || url.includes('x.com')) return 'X';
    if (url.includes('instagram.com')) return 'Instagram';
    if (url.includes('tiktok.com')) return 'TikTok';
    if (url.includes('linkedin.com')) return 'LinkedIn';
    if (url.includes('reddit.com')) return 'Reddit';
    return 'Content';
  }, []);

  return (
    <div className={`backdrop-blur-xl rounded-2xl p-4 shadow-lg transition-all duration-300 ${
      isFadingOut ? 'animate-fade-out' : 'animate-slide-in-top'
    } ${
      isComplete
        ? 'bg-green-50/90 dark:bg-green-900/20 border border-green-200 dark:border-green-700/60' // Green styling when complete
        : 'bg-white/90 dark:bg-dark-800/90 border border-dark-200/60 dark:border-dark-700/60'
    } ${
      progress.isExiting ? 'opacity-0 scale-95 translate-y-2' : 'opacity-100 scale-100 translate-y-0'
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary-500/10 flex items-center justify-center">
            {isComplete ? (
              <CheckCircle size={16} className="text-green-500" /> // Green checkmark when complete
            ) : (
              <Loader2 size={16} className="text-primary-500 animate-spin animate-pulse-slow" />
            )}
          </div>
          <div>
            <h4 className={`text-sm font-semibold ${
              isComplete ? 'text-green-900 dark:text-green-100' : 'text-dark-900 dark:text-white' // Green text for title
            }`}>
              {isComplete ? 'Save Complete!' : `Saving ${getPlatformFromUrl(progress.url)} content`}
            </h4>
            <p className={`text-xs flex items-center gap-1 ${
              isComplete ? 'text-green-700 dark:text-green-300' : 'text-dark-500 dark:text-dark-400' // Green text for timer
            }`}>
              <Clock size={12} />
              {formatTime(elapsedTime)}
              {isComplete && ' (final)'}
            </p>
            {isComplete && progress.savedEntry && (
              <div className="mt-2 space-y-1">
                {console.log('🔍 RENDERING SAVED ENTRY INFO:', progress.savedEntry)}
                <div className="text-xs text-green-700 dark:text-green-300">
                  <span className="font-medium">Title:</span> {progress.savedEntry.title}
                </div>
                <div className="text-xs text-green-700 dark:text-green-300">
                  <span className="font-medium">Category:</span> {progress.savedEntry.category}
                </div>
              </div>
            )}
          </div>
        </div>
        <button
          onClick={handleClose}
          className="text-dark-400 dark:text-dark-500 hover:text-dark-600 dark:hover:text-dark-300 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <span className={`text-xs ${
            isComplete ? 'text-green-700 dark:text-green-300' : 'text-dark-600 dark:text-dark-300' // Green text for step name
          }`}>
            {isComplete ? 'Complete' : getCurrentStepName()}
          </span>
          <span className={`text-xs ${
            isComplete ? 'text-green-600 dark:text-green-400' : 'text-dark-500 dark:text-dark-400' // Green text for step counter
          }`}>
            {currentStepProgress}/{progress.totalSteps}
          </span>
        </div>
        <div className="w-full bg-dark-200/50 dark:bg-dark-700/50 rounded-full h-2 overflow-hidden">
          <div
            className={`h-2 rounded-full transition-all duration-500 ease-out relative ${
              isComplete ? 'bg-green-500' : 'bg-primary-500' // Green progress bar when complete
            }`}
            style={{ width: `${progressPercentage}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse-slow" />
          </div>
        </div>
      </div>

      {/* Current step indicator */}
      <div className={`flex items-center gap-2 text-xs ${
        isComplete ? 'text-green-700 dark:text-green-300' : 'text-dark-600 dark:text-dark-300' // Green text for URL
      }`}>
        <span className="w-4 h-4 flex items-center justify-center">
          {isComplete ? (
            <CheckCircle size={12} className="text-green-500" /> // Green checkmark for step indicator
          ) : progress.stepStatuses[progress.currentStep] === 'in_progress' ? (
            <span className="text-primary-500 font-bold font-mono">{dots}</span>
          ) : progress.stepStatuses[progress.currentStep] === 'done' ? (
            <CheckCircle size={12} className="text-green-500" />
          ) : null}
        </span>
        <span className="truncate">
          {progress.url.length > 40 ? `${progress.url.substring(0, 40)}...` : progress.url}
        </span>
      </div>
    </div>
  );
});

SaveProgressIndicator.displayName = 'SaveProgressIndicator';

export default SaveProgressIndicator; 