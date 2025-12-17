import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3 } from 'three';

// Global reference to update the compass overlay
let compassOverlayRef = null;

export function setCompassOverlayRef(ref) {
  compassOverlayRef = ref;
}

export function Compass() {
  const { camera } = useThree();

  useFrame(() => {
    if (compassOverlayRef && camera) {
      // Since camera.matrixAutoUpdate is false, we need to extract rotation from matrix
      // The camera matrix is updated by the Airplane component, so we read from matrix directly
      const matrix = camera.matrix;
      
      // Extract the forward direction from the camera matrix
      // In a camera/view matrix, the third column represents the camera's local -Z axis (forward)
      // Matrix columns: [right, up, forward, position]
      // Indices: [0-3, 4-7, 8-11, 12-15]
      const forwardX = matrix.elements[8];
      const forwardY = matrix.elements[9];
      const forwardZ = matrix.elements[10];
      
      // Project forward onto XZ plane (horizontal plane) to get horizontal direction
      const forwardXZ = new Vector3(forwardX, 0, forwardZ);
      const length = forwardXZ.length();
      
      // Avoid division by zero
      if (length > 0.001) {
        forwardXZ.normalize();
        
        // Calculate angle between camera's horizontal forward and world north
        // North is negative Z in our coordinate system (0, 0, -1)
        // Use atan2 to get angle: atan2(x, z) gives angle from north
        // When forward is north (0, 0, -1): atan2(0, -1) = π (180°)
        // When forward is east (1, 0, 0): atan2(1, 0) = π/2 (90°)
        // When forward is south (0, 0, 1): atan2(0, 1) = 0 (0°)
        // When forward is west (-1, 0, 0): atan2(-1, 0) = -π/2 (-90°)
        const angle = Math.atan2(forwardXZ.x, -forwardXZ.z);
        
        // Rotate the compass so that north (red N) always points to world north
        // The compass rotates opposite to the camera's rotation to keep north fixed
        // Convert to degrees and apply rotation
        const angleDegrees = angle * (180 / Math.PI);
        compassOverlayRef.style.transform = `rotate(${-angleDegrees}deg)`;
      }
    }
  });

  return null; // This component doesn't render anything, it just updates the overlay
}
