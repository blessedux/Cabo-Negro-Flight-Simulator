import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3, Euler } from 'three';
import { controls, isMenuOpen, isPaused } from './controls';
import { getCameraAnimationState } from './CameraAnimator';

// Export camera data for UI components outside Canvas
export let cameraData = {
  position: { x: 0, y: 0, z: 0 },
  rotation: { pitch: 0, yaw: 0, roll: 0 }
};

export function getCameraData() {
  return { ...cameraData };
}

export function FreeCameraDragControls() {
  const { camera } = useThree();
  
  // Rotation state (using refs to persist across renders)
  const isDragging = useRef(false);
  const isMouseDown = useRef(false);
  const lastMouseX = useRef(0);
  const lastMouseY = useRef(0);
  const mouseDownPos = useRef({ x: 0, y: 0 });
  const hasMoved = useRef(false);
  const dragSensitivity = 0.005;
  const maxPitch = Math.PI / 2.2; // Limit vertical rotation (slightly less than 90 degrees)
  
  // Current rotation angles (Euler angles) - using refs
  const rotation = useRef({ yaw: 0, pitch: 0 });
  
  // Initialize rotation from camera's current orientation
  useEffect(() => {
    const euler = new Euler().setFromQuaternion(camera.quaternion, 'YXZ');
    rotation.current = { yaw: euler.y, pitch: euler.x };
  }, [camera]);
  
  // Movement speed
  const moveSpeed = 0.15; // Base movement speed
  const fastMoveSpeed = 0.3; // Speed when shift is held
  
  // Mouse drag handlers
  useEffect(() => {
    const handleMouseDown = (e) => {
      // Don't allow dragging when menu is open
      if (isMenuOpen) return;
      
      // Only start dragging on left mouse button
      if (e.button === 0) {
        isMouseDown.current = true;
        mouseDownPos.current = { x: e.clientX, y: e.clientY };
        lastMouseX.current = e.clientX;
        lastMouseY.current = e.clientY;
        hasMoved.current = false;
        // Don't prevent default immediately - allow 3D object clicks to work
      }
    };

    const handleMouseMove = (e) => {
      // Don't allow dragging when menu is open
      if (isMenuOpen) {
        if (isDragging.current) {
          isDragging.current = false;
          document.body.style.cursor = '';
        }
        return;
      }
      
      // Only process movement if mouse button is actually down
      if (!isMouseDown.current) return;
      
      // Check if mouse has moved enough to start dragging (threshold to allow clicks)
      if (!isDragging.current && !hasMoved.current) {
        const deltaX = Math.abs(e.clientX - mouseDownPos.current.x);
        const deltaY = Math.abs(e.clientY - mouseDownPos.current.y);
        const threshold = 3; // pixels
        
        if (deltaX > threshold || deltaY > threshold) {
          isDragging.current = true;
          hasMoved.current = true;
          document.body.style.cursor = 'grabbing';
        }
      }
      
      // Only update rotation if we're actually dragging
      if (!isDragging.current) return;

      const deltaX = e.clientX - lastMouseX.current;
      const deltaY = e.clientY - lastMouseY.current;

      // Update rotation angles
      // Yaw (horizontal rotation) - rotate around Y axis
      rotation.current.yaw -= deltaX * dragSensitivity;
      
      // Pitch (vertical rotation) - rotate around X axis, clamped
      rotation.current.pitch -= deltaY * dragSensitivity;
      rotation.current.pitch = Math.max(
        -maxPitch,
        Math.min(maxPitch, rotation.current.pitch)
      );

      lastMouseX.current = e.clientX;
      lastMouseY.current = e.clientY;
    };

    const handleMouseUp = () => {
      isMouseDown.current = false;
      isDragging.current = false;
      hasMoved.current = false;
      mouseDownPos.current = { x: 0, y: 0 }; // Reset mouse down position
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
  
  // Apply rotation and movement each frame
  useFrame(() => {
    // Don't update if menu is open or paused
    if (isMenuOpen || isPaused) return;
    
    // Check if camera is animating - if so, sync rotation from camera instead of applying
    const animState = getCameraAnimationState();
    if (animState.isAnimating) {
      // Sync rotation from camera (which is being animated)
      const euler = new Euler().setFromQuaternion(camera.quaternion, 'YXZ');
      rotation.current = { yaw: euler.y, pitch: euler.x };
      
      // Update exported camera data
      cameraData.position = {
        x: parseFloat(camera.position.x.toFixed(3)),
        y: parseFloat(camera.position.y.toFixed(3)),
        z: parseFloat(camera.position.z.toFixed(3)),
      };
      cameraData.rotation = {
        pitch: parseFloat(euler.x.toFixed(4)),
        yaw: parseFloat(euler.y.toFixed(4)),
        roll: parseFloat(euler.z.toFixed(4)),
      };
      
      return; // Don't apply movement during animation
    }
    
    // Apply rotation to camera using Euler angles
    const euler = new Euler(rotation.current.pitch, rotation.current.yaw, 0, 'YXZ');
    camera.quaternion.setFromEuler(euler);
    
    // Update exported camera data
    cameraData.position = {
      x: parseFloat(camera.position.x.toFixed(3)),
      y: parseFloat(camera.position.y.toFixed(3)),
      z: parseFloat(camera.position.z.toFixed(3)),
    };
    cameraData.rotation = {
      pitch: parseFloat(rotation.current.pitch.toFixed(4)),
      yaw: parseFloat(rotation.current.yaw.toFixed(4)),
      roll: 0,
    };
    
    // Determine movement speed (faster with shift)
    const currentMoveSpeed = controls.shift ? fastMoveSpeed : moveSpeed;
    
    // Get camera's forward, right, and up vectors
    const forward = new Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    const right = new Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
    const worldUp = new Vector3(0, 1, 0);
    
    // Calculate movement direction
    const moveDirection = new Vector3(0, 0, 0);
    
    // W/S - Forward/Backward
    if (controls['w']) {
      moveDirection.add(forward);
    }
    if (controls['s']) {
      moveDirection.sub(forward);
    }
    
    // A/D - Left/Right (strafe)
    if (controls['a']) {
      moveDirection.sub(right);
    }
    if (controls['d']) {
      moveDirection.add(right);
    }
    
    // Q/E - Up/Down (vertical movement in world space)
    if (controls['q']) {
      moveDirection.add(worldUp);
    }
    if (controls['e']) {
      moveDirection.sub(worldUp);
    }
    
    // I/K - Up/Down (vertical movement in world space - alternative controls)
    if (controls['i']) {
      moveDirection.add(worldUp);
    }
    if (controls['k']) {
      moveDirection.sub(worldUp);
    }
    
    // Normalize and apply speed
    if (moveDirection.length() > 0) {
      moveDirection.normalize();
      moveDirection.multiplyScalar(currentMoveSpeed);
      
      // Apply movement to camera position
      camera.position.add(moveDirection);
    }
  });
  
  return null; // This component doesn't render anything
}
