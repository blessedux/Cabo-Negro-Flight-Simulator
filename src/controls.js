function easeOutQuad(x) {
  return 1 - (1 - x) * (1 - x);
}

export let controls = {};
export let isPaused = false;
export let isMenuOpen = false;
export let isOrbitPaused = false; // Separate state for orbit animation pause

// Function to set orbit pause state (can be called from other components)
export function setOrbitPaused(value) {
  isOrbitPaused = value;
}

// Callback system for React components to subscribe to state changes
let menuOpenCallbacks = [];
let pauseCallbacks = [];

export function subscribeToMenuOpen(callback) {
  menuOpenCallbacks.push(callback);
  return () => {
    menuOpenCallbacks = menuOpenCallbacks.filter(cb => cb !== callback);
  };
}

export function subscribeToPause(callback) {
  pauseCallbacks.push(callback);
  return () => {
    pauseCallbacks = pauseCallbacks.filter(cb => cb !== callback);
  };
}

function notifyMenuOpenCallbacks() {
  menuOpenCallbacks.forEach(cb => cb(isMenuOpen));
}

function notifyPauseCallbacks() {
  pauseCallbacks.forEach(cb => cb(isPaused));
}

// Pause state management
export function setPaused(value) {
  isPaused = value;
  notifyPauseCallbacks();
}

export function setMenuOpen(value) {
  isMenuOpen = value;
  // When menu opens, also pause
  if (value) {
    isPaused = true;
    notifyPauseCallbacks();
  }
  notifyMenuOpenCallbacks();
}

window.addEventListener("keydown", (e) => {
  const key = e.key.toLowerCase();
  
  // Handle Space key for orbit pause (only if menu is not open)
  if (key === " " && !isMenuOpen) {
    e.preventDefault();
    isOrbitPaused = !isOrbitPaused;
    return;
  }
  
  // Handle Escape key for menu
  if (key === "escape") {
    e.preventDefault();
    if (isMenuOpen) {
      // Close menu and resume
      setMenuOpen(false);
      setPaused(false);
    } else {
      // Open menu (which also pauses)
      setMenuOpen(true);
    }
    return;
  }
  
  controls[key] = true;
});

window.addEventListener("keyup", (e) => {
  const key = e.key.toLowerCase();
  
  // Don't process keyup for Space or Escape
  if (key === " " || key === "escape") {
    return;
  }
  
  controls[key] = false;
});

let maxVelocity = 0.04;
let jawVelocity = 0;
let pitchVelocity = 0;
let verticalVelocity = 0; // For K/L vertical movement
let planeSpeed = 0.006;
export let turbo = 0;

export function updatePlaneAxis(x, y, z, planePosition, camera) {
  // Don't update if paused
  if (isPaused) {
    return;
  }
  
  jawVelocity *= 0.95;
  pitchVelocity *= 0.95;

  if (Math.abs(jawVelocity) > maxVelocity) 
    jawVelocity = Math.sign(jawVelocity) * maxVelocity;

  if (Math.abs(pitchVelocity) > maxVelocity) 
    pitchVelocity = Math.sign(pitchVelocity) * maxVelocity;

  if (controls["a"]) {
    jawVelocity += 0.0025;
  }

  if (controls["d"]) {
    jawVelocity -= 0.0025;
  }

  if (controls["w"]) {
    pitchVelocity -= 0.0025;
  }

  if (controls["s"]) {
    pitchVelocity += 0.0025;
  }

  // Vertical movement (K = down, L = up)
  verticalVelocity *= 0.95; // Damping
  
  if (controls["k"]) {
    verticalVelocity -= 0.0025; // Move down
  }
  
  if (controls["l"]) {
    verticalVelocity += 0.0025; // Move up
  }
  
  // Clamp vertical velocity
  if (Math.abs(verticalVelocity) > maxVelocity) {
    verticalVelocity = Math.sign(verticalVelocity) * maxVelocity;
  }

  if (controls["r"]) {
    jawVelocity = 0;
    pitchVelocity = 0;
    verticalVelocity = 0;
    turbo = 0;
    x.set(1, 0, 0);
    y.set(0, 1, 0);
    z.set(0, 0, 1);
    // Reset to north border (terrain size: 34.55 units, north border at +17.275)
    planePosition.set(0, 3, 17.275);
  }

  x.applyAxisAngle(z, jawVelocity);
  y.applyAxisAngle(z, jawVelocity);

  y.applyAxisAngle(x, pitchVelocity);
  z.applyAxisAngle(x, pitchVelocity);

  x.normalize();
  y.normalize();
  z.normalize();


  // plane position & velocity
  if (controls.shift) {
    turbo += 0.025;
  } else {
    turbo *= 0.95;
  }
  turbo = Math.min(Math.max(turbo, 0), 1);

  // Increased turbo speed 3x (from 0.02 to 0.06)
  // Small plane speeds: ~100-200 km/h, so we need higher base speed
  let turboSpeed = easeOutQuad(turbo) * 0.06; // 3x increase

  camera.fov = 45 + turboSpeed * 900;
  camera.updateProjectionMatrix();

  // Calculate current speed for UI (total forward speed)
  const totalSpeed = planeSpeed + turboSpeed;
  
  // Export speed for UI (in scene units per frame)
  if (typeof window !== 'undefined' && window.updateSpeedTracking) {
    window.updateSpeedTracking(totalSpeed);
  }

  // Horizontal movement (forward/backward)
  planePosition.add(z.clone().multiplyScalar(-planeSpeed -turboSpeed));
  
  // Vertical movement (up/down)
  planePosition.y += verticalVelocity;
}