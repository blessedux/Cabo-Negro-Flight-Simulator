import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3, Euler, Matrix4, Quaternion } from 'three';
import * as THREE from 'three';
import { isCinematicMode } from './CinematicCameraController';
import { getFreeExplorationMode } from './FreeExplorationMode';

// Global state for camera animation
let targetPosition = null;
let targetRotation = null;
let lookAtTarget = null; // Optional: point to look at during movement
let isAnimating = false;
let animationDuration = 1500; // milliseconds
let animationStartTime = 0;
let startPosition = null;
let startRotation = null;

export function setCameraTarget(position, rotation, duration = 1500, lookAt = null) {
  targetPosition = position ? new Vector3(...position) : null;
  targetRotation = rotation ? { ...rotation } : null;
  lookAtTarget = lookAt ? new Vector3(...lookAt) : null;
  animationDuration = duration; // Allow custom duration
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
  lookAtTarget = null;
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
    // Don't animate if cinematic mode is active (unless in free exploration mode)
    const isFreeMode = getFreeExplorationMode();
    if (isCinematicMode() && !isFreeMode) {
      // Reset animation if cinematic mode takes over
      if (isAnimating) {
        isAnimating = false;
        targetPosition = null;
        targetRotation = null;
        lookAtTarget = null;
        startPosition = null;
        startRotation = null;
        startTimeRef.current = null;
      }
      return;
    }
    
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
    
    // Interpolate position (straight line movement)
    camera.position.lerpVectors(startPosition, targetPosition, easedProgress);
    
    // Handle rotation: if lookAtTarget is provided, look at it during movement, then rotate to final rotation
    if (lookAtTarget) {
      // For first 85% of animation, look at the target (straight line movement)
      // For last 15%, smoothly transition to final rotation
      const lookAtPhase = 0.85; // 85% of animation spent looking at target
      
      if (progress < lookAtPhase) {
        // Look at the target during movement (straight line - camera always faces target)
        camera.lookAt(lookAtTarget);
      } else {
        // In final 15%, smoothly transition from looking at target to final rotation
        const rotationProgress = (progress - lookAtPhase) / (1 - lookAtPhase); // 0 to 1 in final 15%
        const rotationEase = easeInOutCubic(rotationProgress);
        
        // Calculate what the rotation would be if we were still looking at the target
        const tempLookAtMatrix = new Matrix4();
        tempLookAtMatrix.lookAt(camera.position, lookAtTarget, new Vector3(0, 1, 0));
        const tempLookAtQuat = new THREE.Quaternion().setFromRotationMatrix(tempLookAtMatrix);
        const lookAtEuler = new Euler().setFromQuaternion(tempLookAtQuat, 'YXZ');
        
        const lookAtRotation = {
          pitch: lookAtEuler.x,
          yaw: lookAtEuler.y,
          roll: lookAtEuler.z,
        };
        
        // Interpolate from lookAt rotation to final rotation
        const currentPitch = THREE.MathUtils.lerp(lookAtRotation.pitch, targetRotation.pitch, rotationEase);
        const currentYaw = THREE.MathUtils.lerp(lookAtRotation.yaw, targetRotation.yaw, rotationEase);
        const currentRoll = THREE.MathUtils.lerp(
          lookAtRotation.roll || 0,
          targetRotation.roll || 0,
          rotationEase
        );
        
        const euler = new Euler(currentPitch, currentYaw, currentRoll, 'YXZ');
        camera.quaternion.setFromEuler(euler);
      }
    } else {
      // No lookAt target, use normal rotation interpolation
      const currentPitch = THREE.MathUtils.lerp(startRotation.pitch, targetRotation.pitch, easedProgress);
      const currentYaw = THREE.MathUtils.lerp(startRotation.yaw, targetRotation.yaw, easedProgress);
      const currentRoll = THREE.MathUtils.lerp(
        startRotation.roll || 0,
        targetRotation.roll || 0,
        easedProgress
      );
      
      const euler = new Euler(currentPitch, currentYaw, currentRoll, 'YXZ');
      camera.quaternion.setFromEuler(euler);
    }
    
    if (progress >= 1) {
      // Animation complete - ensure smooth final state
      camera.position.copy(targetPosition);
      
      // If we had a lookAtTarget, make sure final rotation matches what lookAt would produce
      // This ensures smooth transition to orbit mode
      if (lookAtTarget) {
        // Use lookAt to get the exact final rotation (matches what orbit mode will use)
        const finalLookAtMatrix = new Matrix4();
        finalLookAtMatrix.lookAt(targetPosition, lookAtTarget, new Vector3(0, 1, 0));
        const finalLookAtQuat = new Quaternion().setFromRotationMatrix(finalLookAtMatrix);
        camera.quaternion.copy(finalLookAtQuat);
      } else {
        // No lookAt target, use the target rotation directly
        const finalEuler = new Euler(
          targetRotation.pitch,
          targetRotation.yaw,
          targetRotation.roll || 0,
          'YXZ'
        );
        camera.quaternion.setFromEuler(finalEuler);
      }
      
      isAnimating = false;
      targetPosition = null;
      targetRotation = null;
      lookAtTarget = null;
      startPosition = null;
      startRotation = null;
      startTimeRef.current = null;
    }
  });
  
  return null;
}
