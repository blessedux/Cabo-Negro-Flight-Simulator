import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3, Euler, Quaternion, Matrix4 } from 'three';
import * as THREE from 'three';
import { controls, isMenuOpen, isPaused, isOrbitPaused } from './controls';
import { getCameraAnimationState } from './CameraAnimator';
import { beamPosition, beamHeight } from './LocationBeam';
import { sampleTerrainHeight } from './terrainHeightSampler';

// Export camera data for UI components outside Canvas
export let cameraData = {
  position: { x: 0, y: 0, z: 0 },
  rotation: { pitch: 0, yaw: 0, roll: 0 }
};

export function getCameraData() {
  return { ...cameraData };
}

// Export orbit speed ref (will be set up in component)
let orbitSpeedRefGlobal = null;
export function setOrbitSpeedRef(ref) {
  orbitSpeedRefGlobal = ref;
}
export function setOrbitSpeed(speed) {
  // Speed should be between 0 and 1 (0 = stopped, 1 = max speed)
  const maxSpeed = 0.5; // Maximum orbit speed
  if (orbitSpeedRefGlobal) {
    orbitSpeedRefGlobal.current = speed * maxSpeed;
  }
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
  
  // Movement speed (reduced by half)
  const moveSpeed = 0.075; // Base movement speed (half of 0.15)
  const fastMoveSpeed = 0.15; // Speed when shift is held (half of 0.3)
  
  // Auto-orbit state
  const orbitAngle = useRef(0); // Current angle in the orbit
  const orbitRadius = useRef(8); // Starting radius from beam
  const orbitSpeedRef = useRef(0.15); // Speed of orbit rotation (radians per second) - controllable via UI
  const orbitSpeedMultiplier = 2.0; // Speed multiplier when shift is held
  const radiusIncreaseRate = 0.00005; // Reduced rate - how fast the radius increases per frame
  const orbitHeight = useRef(8); // Height offset for orbit
  const minOrbitRadius = 3; // Minimum orbit radius (allow getting closer)
  
  // Export orbit speed ref for UI control
  useEffect(() => {
    setOrbitSpeedRef(orbitSpeedRef);
  }, []);
  
  // User interaction tracking for smooth return to default view
  const lastUserInteractionTime = useRef(0); // Time since last user drag (0 = never interacted)
  const hasUserInteracted = useRef(false); // Track if user has ever interacted
  const returnToDefaultSpeed = 0.05; // Speed of returning to default view (0-1)
  const userInteractionTimeout = 2.0; // Seconds before returning to default view
  
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
      
      // Update last interaction time and mark that user has interacted
      lastUserInteractionTime.current = performance.now() / 1000;
      hasUserInteracted.current = true;

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
  useFrame((state, delta) => {
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
    
    // Auto-orbit around the light beam (only X and Z, not Y - allow free vertical movement)
    // Only apply orbit if not paused by spacebar
    if (!isOrbitPaused) {
      // Calculate current orbit speed (faster with shift key)
      const currentOrbitSpeed = controls.shift ? orbitSpeedRef.current * orbitSpeedMultiplier : orbitSpeedRef.current;
      
      // Update orbit angle (smooth rotation using delta time)
      orbitAngle.current += currentOrbitSpeed * delta;
      
      // Calculate current distance from beam
      const cameraToBeam = new Vector3().subVectors(camera.position, beamPosition);
      const currentDistance = Math.sqrt(cameraToBeam.x * cameraToBeam.x + cameraToBeam.z * cameraToBeam.z);
      
      // Only increase radius if user is not trying to get closer (current distance > orbit radius)
      // This allows user to move closer without being pushed away
      if (currentDistance > orbitRadius.current) {
        // Gradually increase radius (move slowly further away) but respect minimum
        orbitRadius.current = Math.max(minOrbitRadius, orbitRadius.current + radiusIncreaseRate * delta * 60);
      } else {
        // If user is closer than orbit radius, update orbit radius to match (but don't go below minimum)
        orbitRadius.current = Math.max(minOrbitRadius, currentDistance);
      }
      
      // Calculate desired orbit position around the beam (X and Z only, no Y influence)
      const desiredX = beamPosition.x + Math.cos(orbitAngle.current) * orbitRadius.current;
      const desiredZ = beamPosition.z + Math.sin(orbitAngle.current) * orbitRadius.current;
      
      // Only apply orbit influence if user is not actively trying to get closer
      // Check if user is moving toward or away from beam
      const desiredToBeam = new Vector3(desiredX - beamPosition.x, 0, desiredZ - beamPosition.z);
      const cameraToBeamXZ = new Vector3(cameraToBeam.x, 0, cameraToBeam.z);
      const isMovingTowardBeam = cameraToBeamXZ.length() < currentDistance * 0.98; // User getting closer
      
      // Smoothly interpolate camera position towards orbit position (X and Z only)
      // Use lower influence if user is trying to get closer
      const orbitInfluence = isMovingTowardBeam ? 0.005 : 0.015; // Less aggressive when user wants to get closer
      const targetX = camera.position.x + (desiredX - camera.position.x) * orbitInfluence;
      const targetZ = camera.position.z + (desiredZ - camera.position.z) * orbitInfluence;
      
      // Keep current Y position (no vertical pushback from orbit)
      const targetY = camera.position.y;
      
      // Apply orbit position (X and Z only)
      camera.position.set(targetX, targetY, targetZ);
    }
    
    // Maximum altitude check: limit to terrain height + 30m
    const terrainHeight = sampleTerrainHeight(camera.position.x, camera.position.z);
    const maxAltitude = terrainHeight + 30; // 30 meters above terrain
    if (camera.position.y > maxAltitude) {
      camera.position.y = maxAltitude;
    }
    
    // Minimum altitude check: prevent going below Y=0.15
    const minAltitude = 0.15;
    if (camera.position.y < minAltitude) {
      camera.position.y = minAltitude;
    }
    
    // Check if user has interacted recently
    // Don't return to default if orbit is paused (user wants free exploration)
    const currentTime = performance.now() / 1000;
    let shouldReturnToDefault = false;
    
    if (!isOrbitPaused) {
      if (!hasUserInteracted.current) {
        // If user hasn't interacted yet, always return to default (look at beam initially)
        shouldReturnToDefault = true;
      } else {
        // If user has interacted, only return to default after timeout
        const timeSinceLastInteraction = currentTime - lastUserInteractionTime.current;
        shouldReturnToDefault = timeSinceLastInteraction > userInteractionTimeout;
      }
    }
    
    // Make camera smoothly return to looking at the base of the light beam
    // Only if user hasn't interacted recently and orbit is not paused
    if (shouldReturnToDefault) {
      // Calculate base position (beamPosition is at center, base is at Y - beamHeight/2)
      const beamBasePosition = new Vector3(
        beamPosition.x,
        beamPosition.y - beamHeight / 2,
        beamPosition.z
      );
      
      // Calculate direction to beam base to check if valid
      const directionToBeam = new Vector3().subVectors(beamBasePosition, camera.position);
      
      // Only apply lookAt if we have a valid direction (not too close)
      if (directionToBeam.length() > 0.1) {
        // Calculate target quaternion that looks at the beam base
        const targetQuaternion = new Quaternion();
        const tempMatrix = new Matrix4();
        tempMatrix.lookAt(camera.position, beamBasePosition, new Vector3(0, 1, 0));
        targetQuaternion.setFromRotationMatrix(tempMatrix);
        
        // Smoothly interpolate toward looking at the beam
        // Lower value = smoother return to default
        camera.quaternion.slerp(targetQuaternion, returnToDefaultSpeed);
        
        // Sync rotation refs with the new camera rotation
        const updatedEuler = new Euler().setFromQuaternion(camera.quaternion, 'YXZ');
        rotation.current.yaw = updatedEuler.y;
        rotation.current.pitch = updatedEuler.x;
      }
    }
  });
  
  return null; // This component doesn't render anything
}
