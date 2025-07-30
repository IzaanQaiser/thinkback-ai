import { SaveProgress } from '../contexts/SaveNotificationContext';

export type SaveStepStatus = 'pending' | 'in_progress' | 'done';

export interface GlobalSaveProgress extends SaveProgress {
  listeners: Set<(progress: GlobalSaveProgress) => void>;
}

// Global state
let activeSaves: GlobalSaveProgress[] = [];
let globalListeners: Set<(saves: GlobalSaveProgress[]) => void> = new Set();

// Event types
export const PROGRESS_EVENTS = {
  SAVE_STARTED: 'save_started',
  STEP_UPDATED: 'step_updated',
  SAVE_COMPLETED: 'save_completed',
  SAVE_FAILED: 'save_failed',
  SAVE_REMOVED: 'save_removed',
} as const;

export type ProgressEventType = typeof PROGRESS_EVENTS[keyof typeof PROGRESS_EVENTS];

// Event listeners
const eventListeners: Map<ProgressEventType, Set<(data: any) => void>> = new Map();

// Initialize event listeners map
Object.values(PROGRESS_EVENTS).forEach(eventType => {
  eventListeners.set(eventType, new Set());
});

// Global progress tracking functions
export const globalProgressTracker = {
  // Start a new save
  startSave: (url: string, totalSteps: number, classificationMethod: 'ai' | 'manual' = 'ai') => {
    const saveId = Math.random().toString(36).substr(2, 9);
    const steps = classificationMethod === 'manual' ? 4 : 7;
    
    const newSave: GlobalSaveProgress = {
      id: saveId,
      url,
      stepStatuses: Array(steps).fill('pending'),
      currentStep: 0,
      totalSteps: steps,
      startTime: new Date(),
      isExiting: false,
      listeners: new Set(),
    };
    
    activeSaves.unshift(newSave);
    
    // Trigger events
    globalProgressTracker.triggerEvent(PROGRESS_EVENTS.SAVE_STARTED, newSave);
    globalProgressTracker.notifyGlobalListeners();
    
    console.log('Global: Started new save:', { saveId, url, steps });
    return saveId;
  },

  // Update a step
  updateStep: (saveId: string, stepIndex: number, status: SaveStepStatus) => {
    const saveIndex = activeSaves.findIndex(save => save.id === saveId);
    if (saveIndex === -1) {
      console.warn('Global: Save not found for update:', saveId);
      return;
    }
    
    const save = activeSaves[saveIndex];
    const updatedSave = {
      ...save,
      stepStatuses: save.stepStatuses.map((s, i) => i === stepIndex ? status : s),
      currentStep: stepIndex,
    };
    
    activeSaves[saveIndex] = updatedSave;
    
    // Trigger events
    globalProgressTracker.triggerEvent(PROGRESS_EVENTS.STEP_UPDATED, {
      saveId,
      stepIndex,
      status,
      save: updatedSave
    });
    globalProgressTracker.notifyGlobalListeners();
    
    console.log('🔵 GLOBAL: Updated step:', { 
      saveId, 
      stepIndex, 
      status, 
      newStepStatuses: updatedSave.stepStatuses,
      currentStep: updatedSave.currentStep,
      activeSavesCount: activeSaves.length
    });
  },

  // Complete a save
  completeSave: (saveId: string, savedEntry?: { title: string; category: string; platform: string; tags: string[] }) => {
    const saveIndex = activeSaves.findIndex(save => save.id === saveId);
    if (saveIndex === -1) {
      console.warn('Global: Save not found for completion:', saveId);
      return;
    }
    
    const save = activeSaves[saveIndex];
    const updatedSave = {
      ...save,
      stepStatuses: save.stepStatuses.map(s => 'done'),
      currentStep: save.stepStatuses.length - 1,
      savedEntry,
    };
    
    activeSaves[saveIndex] = updatedSave;
    
    console.log('🔍 GLOBAL PROGRESS: Completed save with saved entry:', { 
      saveId, 
      savedEntry,
      updatedSave: updatedSave
    });
    
    // Trigger events
    globalProgressTracker.triggerEvent(PROGRESS_EVENTS.SAVE_COMPLETED, updatedSave);
    globalProgressTracker.notifyGlobalListeners();
    
    console.log('Global: Completed save:', saveId, savedEntry);
  },

  // Fail a save
  failSave: (saveId: string, error?: string) => {
    const saveIndex = activeSaves.findIndex(save => save.id === saveId);
    if (saveIndex === -1) {
      console.warn('Global: Save not found for failure:', saveId);
      return;
    }
    
    const save = activeSaves[saveIndex];
    
    // Trigger events
    globalProgressTracker.triggerEvent(PROGRESS_EVENTS.SAVE_FAILED, {
      saveId,
      save,
      error
    });
    globalProgressTracker.notifyGlobalListeners();
    
    console.log('Global: Failed save:', { saveId, error });
  },

  // Remove a save
  removeSave: (saveId: string) => {
    const saveIndex = activeSaves.findIndex(save => save.id === saveId);
    if (saveIndex === -1) {
      console.warn('Global: Save not found for removal:', saveId);
      return;
    }
    
    const save = activeSaves[saveIndex];
    activeSaves.splice(saveIndex, 1);
    
    // Trigger events
    globalProgressTracker.triggerEvent(PROGRESS_EVENTS.SAVE_REMOVED, save);
    globalProgressTracker.notifyGlobalListeners();
    
    console.log('Global: Removed save:', saveId);
  },

  // Get all active saves
  getActiveSaves: () => {
    return [...activeSaves];
  },

  // Get a specific save
  getSave: (saveId: string) => {
    return activeSaves.find(save => save.id === saveId);
  },

  // Subscribe to global updates
  subscribe: (callback: (saves: GlobalSaveProgress[]) => void) => {
    globalListeners.add(callback);
    // Immediately call with current state
    callback([...activeSaves]);
    
    // Return unsubscribe function
    return () => {
      globalListeners.delete(callback);
    };
  },

  // Subscribe to specific events
  on: (eventType: ProgressEventType, callback: (data: any) => void) => {
    const listeners = eventListeners.get(eventType);
    if (listeners) {
      listeners.add(callback);
      
      // Return unsubscribe function
      return () => {
        listeners.delete(callback);
      };
    }
  },

  // Internal event trigger
  triggerEvent: (eventType: ProgressEventType, data: any) => {
    const listeners = eventListeners.get(eventType);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Global: Error in event listener:', error);
        }
      });
    }
  },

  // Internal global listener notification
  notifyGlobalListeners: () => {
    globalListeners.forEach(callback => {
      try {
        callback([...activeSaves]);
      } catch (error) {
        console.error('Global: Error in global listener:', error);
      }
    });
  },

  // Clear all saves (for testing/debugging)
  clearAll: () => {
    activeSaves = [];
    globalProgressTracker.notifyGlobalListeners();
    console.log('Global: Cleared all saves');
  },
};

// Export for global access
(window as any).globalProgressTracker = globalProgressTracker;

export default globalProgressTracker; 