import { useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { Matrix4, Vector3 } from 'three';

// Store camera rotation offsets globally so they persist across frames
// This will be imported by Airplane component to apply the offsets
export let cameraRotationOffset = { pitch: 0, yaw: 0 };
let isDragging = false;
let lastMouseX = 0;
let lastMouseY = 0;

export function CameraDragControls() {
  const { camera } = useThree();
  const dragSensitivity = 0.005; // Adjust this to change drag sensitivity
  const maxPitch = Math.PI / 3; // Limit vertical rotation to 60 degrees

  useEffect(() => {
    const handleMouseDown = (e) => {
      // Only start dragging on left mouse button
      if (e.button === 0) {
        isDragging = true;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
        // Change cursor to indicate dragging
        document.body.style.cursor = 'grabbing';
        e.preventDefault();
      }
    };

    const handleMouseMove = (e) => {
      if (!isDragging) return;

      const deltaX = e.clientX - lastMouseX;
      const deltaY = e.clientY - lastMouseY;

      // Update rotation offsets
      // Yaw (horizontal rotation) - rotate around Y axis
      cameraRotationOffset.yaw -= deltaX * dragSensitivity;
      
      // Pitch (vertical rotation) - rotate around X axis, clamped
      cameraRotationOffset.pitch -= deltaY * dragSensitivity;
      cameraRotationOffset.pitch = Math.max(
        -maxPitch,
        Math.min(maxPitch, cameraRotationOffset.pitch)
      );

      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
    };

    const handleMouseUp = () => {
      isDragging = false;
      document.body.style.cursor = '';
    };

    // Add event listeners
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    // Cleanup
    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
    };
  }, []);

  // The rotation offsets are stored globally and will be applied by the Airplane component
  // This component just handles the mouse input

  // Reset function (can be called externally if needed)
  const resetCameraRotation = () => {
    cameraRotationOffset.pitch = 0;
    cameraRotationOffset.yaw = 0;
  };

  // Expose reset function globally for potential use
  if (typeof window !== 'undefined') {
    window.resetCameraRotation = resetCameraRotation;
  }

  return null; // This component doesn't render anything
}

// Export the offset getter for potential external use
export function getCameraRotationOffset() {
  return { ...cameraRotationOffset };
}
