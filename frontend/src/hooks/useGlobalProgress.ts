// Import React hooks for state management and performance optimization
import { useState, useEffect, useMemo, useCallback } from 'react';
// Import the global progress tracker and its types
import globalProgressTracker, { GlobalSaveProgress, ProgressEventType } from '../utils/globalProgressTracker';

// Custom hook to track global save progress across the app
export const useGlobalProgress = () => {
  // State to store all currently active save operations
  const [activeSaves, setActiveSaves] = useState<GlobalSaveProgress[]>([]);

  useEffect(() => {
    // Subscribe to global progress updates from the tracker
    const unsubscribe = globalProgressTracker.subscribe((saves) => {
      // Update our state whenever the global tracker reports changes
      setActiveSaves(saves);
    });

    // Cleanup subscription when component unmounts to prevent memory leaks
    return unsubscribe;
  }, []);

  // Memoize the return value to prevent unnecessary re-renders of components using this hook
  const memoizedValue = useMemo(() => ({
    activeSaves, // List of all active save operations
    globalProgressTracker, // The tracker instance for direct access
  }), [activeSaves]);

  return memoizedValue;
};

// Custom hook to listen for specific progress events (like save started, completed, etc.)
export const useGlobalProgressEvents = (eventType: ProgressEventType, callback: (data: unknown) => void) => {
  // Memoize the callback to prevent unnecessary re-subscriptions
  const memoizedCallback = useCallback(callback, [callback]);
  
  useEffect(() => {
    // Subscribe to specific event type from the global tracker
    const unsubscribe = globalProgressTracker.on(eventType, memoizedCallback);
    // Cleanup subscription when component unmounts or dependencies change
    return unsubscribe;
  }, [eventType, memoizedCallback]);
};

// Export the main hook as default for easier importing
export default useGlobalProgress; 