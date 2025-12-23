// Global state for tile debug toggle (wireframe + labels)
let tileDebugEnabled = false;

export function setTileDebugEnabled(enabled) {
  const oldValue = tileDebugEnabled;
  tileDebugEnabled = enabled;
  console.log('🔧 TileDebugToggle.setTileDebugEnabled:', { oldValue, newValue: enabled });
  // Dispatch event for components to listen to
  const event = new CustomEvent('tileDebugToggle', { detail: { enabled } });
  window.dispatchEvent(event);
  console.log('📡 Dispatched tileDebugToggle event:', { enabled, event });
}

export function getTileDebugEnabled() {
  return tileDebugEnabled;
}

