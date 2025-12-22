// Free exploration mode state manager
let isFreeExplorationMode = false;
let freeModeCallbacks = [];

export function setFreeExplorationMode(enabled) {
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
