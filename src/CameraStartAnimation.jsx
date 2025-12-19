import { useRef, useEffect } from 'react';

// Global state for camera start animation
let animationState = {
  isAnimating: false,
  hasCompleted: false, // Track if animation has completed
  startTime: null,
  duration: 3000, // 3 seconds
  startOffset: null,
  startDownAngle: null,
  targetOffset: null,
  targetDownAngle: null,
  finalOffset: null, // Store final values after animation completes
  finalDownAngle: null,
};

// Set target camera parameters for animation
export function setCameraStartAnimationTarget(offset, downAngle) {
  animationState.targetOffset = offset ? { ...offset } : null;
  animationState.targetDownAngle = downAngle !== undefined ? downAngle : null;
  animationState.isAnimating = true;
  animationState.startTime = null; // Will be set on first frame
}

// Get current animation state
export function getCameraStartAnimationState() {
  return {
    isAnimating: animationState.isAnimating,
    progress: animationState.startTime 
      ? Math.min((Date.now() - animationState.startTime) / animationState.duration, 1)
      : 0,
  };
}

// Get interpolated camera parameters
export function getAnimatedCameraParams(startOffset, startDownAngle) {
  // If animation has completed, always use the final (target) values
  if (animationState.hasCompleted && animationState.finalOffset && animationState.finalDownAngle !== null) {
    return { 
      offset: animationState.finalOffset, 
      downAngle: animationState.finalDownAngle 
    };
  }

  // If not animating and hasn't completed, return start values (initial state)
  if (!animationState.isAnimating) {
    return { offset: startOffset, downAngle: startDownAngle };
  }

  // If target not set yet, return start values
  if (!animationState.targetOffset || animationState.targetDownAngle === null) {
    return { offset: startOffset, downAngle: startDownAngle };
  }

  // Initialize start time and start values on first call
  if (animationState.startTime === null) {
    animationState.startTime = Date.now();
    animationState.startOffset = { 
      x: startOffset.x || startOffset.x === 0 ? startOffset.x : 0,
      y: startOffset.y || startOffset.y === 0 ? startOffset.y : 0,
      z: startOffset.z || startOffset.z === 0 ? startOffset.z : 0
    };
    animationState.startDownAngle = startDownAngle;
    console.log('🎬 Camera animation started:', {
      start: animationState.startOffset,
      startAngle: animationState.startDownAngle,
      target: animationState.targetOffset,
      targetAngle: animationState.targetDownAngle
    });
  }

  const elapsed = Date.now() - animationState.startTime;
  const progress = Math.min(elapsed / animationState.duration, 1);

  // Easing function (ease in out cubic)
  const easeInOutCubic = (t) => {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  };

  const easedProgress = easeInOutCubic(progress);

  // Interpolate offset
  const offset = {
    x: animationState.startOffset.x + (animationState.targetOffset.x - animationState.startOffset.x) * easedProgress,
    y: animationState.startOffset.y + (animationState.targetOffset.y - animationState.startOffset.y) * easedProgress,
    z: animationState.startOffset.z + (animationState.targetOffset.z - animationState.startOffset.z) * easedProgress,
  };

  // Interpolate down angle
  const downAngle = animationState.startDownAngle + (animationState.targetDownAngle - animationState.startDownAngle) * easedProgress;

  // Check if animation is complete
  if (progress >= 1) {
    animationState.isAnimating = false;
    animationState.hasCompleted = true;
    // Store final values so they persist after animation
    animationState.finalOffset = { ...animationState.targetOffset };
    animationState.finalDownAngle = animationState.targetDownAngle;
    console.log('🎬 Camera animation completed, staying at target position:', {
      offset: animationState.finalOffset,
      downAngle: animationState.finalDownAngle
    });
    // Return final values
    return { 
      offset: animationState.finalOffset, 
      downAngle: animationState.finalDownAngle 
    };
  }

  return { offset, downAngle };
}

// Reset animation state
export function resetCameraStartAnimation() {
  animationState.isAnimating = false;
  animationState.hasCompleted = false;
  animationState.startTime = null;
  animationState.startOffset = null;
  animationState.startDownAngle = null;
  animationState.targetOffset = null;
  animationState.targetDownAngle = null;
  animationState.finalOffset = null;
  animationState.finalDownAngle = null;
}

// Reset animation when scene restarts
export function resetCameraStartAnimationOnRestart() {
  resetCameraStartAnimation();
  // Allow animation to start again on next scene load
  if (typeof window !== 'undefined') {
    window.__cameraAnimationReset = true;
  }
}

// Component to trigger animation on scene start
export function CameraStartAnimation() {
  useEffect(() => {
    // Reset animation state when component mounts (scene starts)
    resetCameraStartAnimation();
    
    // Small delay to ensure scene is fully loaded before starting animation
    const timer = setTimeout(() => {
      // Default target values - these can be updated via console
      // To set custom target, call: window.setCameraAnimationTarget({x, y, z}, downAngle)
      // Example: window.setCameraAnimationTarget({x: 0, y: 0.1, z: 0.4}, -0.2)
      
      // Target: position (0, 15, 12) with rotation (0, 0, 0)
      // Plane is at (0, 3, 17.275), so offset in world space is (0, 12, -5.275)
      // In local space (plane facing south, rotated 180° around Y):
      // - Y: 12 (up)
      // - Z: 5.275 (behind plane, since plane faces south)
      // - X: 0 (centered)
      // Down angle: 0 (looking straight ahead)
      setCameraStartAnimationTarget(
        { x: 0, y: 0.12, z: 0.5275 }, // Adjusted for local space
        0 // Looking straight ahead (no down angle)
      );
    }, 100);
    
    return () => {
      clearTimeout(timer);
      // Reset on unmount
      resetCameraStartAnimation();
    };
  }, []);

  // Expose function to window for easy console access
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.setCameraAnimationTarget = (offset, downAngle) => {
        setCameraStartAnimationTarget(offset, downAngle);
        console.log('🎬 Camera animation target set:', { offset, downAngle });
      };
    }
  }, []);

  return null;
}
