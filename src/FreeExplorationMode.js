import { isMobile } from './utils/isMobile';

// Free exploration mode state manager
let isFreeExplorationMode = false;
let freeModeCallbacks = [];

export function setFreeExplorationMode(enabled) {
  // Disable free exploration on mobile
  if (enabled && isMobile()) {
    console.log('Free exploration mode is not available on mobile devices');
    return;
  }
  
  isFreeExplorationMode = enabled;
  // Notify all callbacks
  freeModeCallbacks.forEach(cb => {
    try {
      cb(enabled);
    } catch (error) {
      console.error('Error in free exploration mode callback:', error);
    }
  });
}

export function getFreeExplorationMode() {
  return isFreeExplorationMode;
}

export function subscribeToFreeExplorationMode(callback) {
  freeModeCallbacks.push(callback);
  return () => {
    freeModeCallbacks = freeModeCallbacks.filter(cb => cb !== callback);
  };
}

export function toggleFreeExplorationMode() {
  setFreeExplorationMode(!isFreeExplorationMode);
}
