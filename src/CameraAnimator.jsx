import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3, Euler } from 'three';
import * as THREE from 'three';

// Global state for camera animation
let targetPosition = null;
let targetRotation = null;
let isAnimating = false;
let animationDuration = 1500; // milliseconds
let animationStartTime = 0;
let startPosition = null;
let startRotation = null;

export function setCameraTarget(position, rotation) {
  targetPosition = position ? new Vector3(...position) : null;
  targetRotation = rotation ? { ...rotation } : null;
  isAnimating = true;
  animationStartTime = Date.now();
  startPosition = null; // Reset start position
  startRotation = null; // Reset start rotation
}

// Helper to reset animation state (for component cleanup)
export function resetCameraAnimation() {
  isAnimating = false;
  targetPosition = null;
  targetRotation = null;
  startPosition = null;
  startRotation = null;
}

export function getCameraAnimationState() {
  return { isAnimating, targetPosition, targetRotation };
}

export function CameraAnimator() {
  const { camera } = useThree();
  const startTimeRef = useRef(null);
  
  useFrame(() => {
    if (!isAnimating || !targetPosition || !targetRotation) {
      if (startTimeRef.current !== null) {
        startTimeRef.current = null; // Reset when animation stops
      }
      return;
    }

    // Initialize start time on first frame of animation
    if (startTimeRef.current === null) {
      startTimeRef.current = Date.now();
      // Initialize start position/rotation on first frame
      startPosition = camera.position.clone();
      const currentEuler = new Euler().setFromQuaternion(camera.quaternion, 'YXZ');
      startRotation = {
        pitch: currentEuler.x,
        yaw: currentEuler.y,
        roll: currentEuler.z,
      };
    }

    const elapsed = Date.now() - startTimeRef.current;
    const progress = Math.min(elapsed / animationDuration, 1);
    
    // Easing function (ease in out cubic)
    const easeInOutCubic = (t) => {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    };
    
    const easedProgress = easeInOutCubic(progress);
    
    // Interpolate position
    camera.position.lerpVectors(startPosition, targetPosition, easedProgress);
    
    // Interpolate rotation
    const currentPitch = THREE.MathUtils.lerp(startRotation.pitch, targetRotation.pitch, easedProgress);
    const currentYaw = THREE.MathUtils.lerp(startRotation.yaw, targetRotation.yaw, easedProgress);
    const currentRoll = THREE.MathUtils.lerp(
      startRotation.roll || 0,
      targetRotation.roll || 0,
      easedProgress
    );
    
    const euler = new Euler(currentPitch, currentYaw, currentRoll, 'YXZ');
    camera.quaternion.setFromEuler(euler);
    
    if (progress >= 1) {
      // Animation complete
      camera.position.copy(targetPosition);
      const finalEuler = new Euler(
        targetRotation.pitch,
        targetRotation.yaw,
        targetRotation.roll || 0,
        'YXZ'
      );
      camera.quaternion.setFromEuler(finalEuler);
      isAnimating = false;
      targetPosition = null;
      targetRotation = null;
      startPosition = null;
      startRotation = null;
      startTimeRef.current = null;
    }
  });
  
  return null;
}
