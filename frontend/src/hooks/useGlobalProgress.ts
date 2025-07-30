import { useState, useEffect, useMemo, useCallback } from 'react';
import globalProgressTracker, { GlobalSaveProgress, PROGRESS_EVENTS, ProgressEventType } from '../utils/globalProgressTracker';

export const useGlobalProgress = () => {
  const [activeSaves, setActiveSaves] = useState<GlobalSaveProgress[]>([]);

  useEffect(() => {
    // Subscribe to global updates
    const unsubscribe = globalProgressTracker.subscribe((saves) => {
      setActiveSaves(saves);
    });

    // Cleanup on unmount
    return unsubscribe;
  }, []);

  // Memoize the return value to prevent unnecessary re-renders
  const memoizedValue = useMemo(() => ({
    activeSaves,
    globalProgressTracker,
  }), [activeSaves]);

  return memoizedValue;
};

export const useGlobalProgressEvents = (eventType: ProgressEventType, callback: (data: any) => void) => {
  const memoizedCallback = useCallback(callback, [callback]);
  
  useEffect(() => {
    const unsubscribe = globalProgressTracker.on(eventType, memoizedCallback);
    return unsubscribe;
  }, [eventType, memoizedCallback]);
};

export default useGlobalProgress; 