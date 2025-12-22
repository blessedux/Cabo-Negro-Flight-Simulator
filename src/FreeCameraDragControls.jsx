import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3, Euler, Quaternion, Matrix4 } from 'three';
import * as THREE from 'three';
import { controls, isMenuOpen, isPaused, isOrbitPaused } from './controls';
import { getCameraAnimationState } from './CameraAnimator';
import { beamPosition, beamHeight } from './LocationBeam';
import { sampleTerrainHeight } from './terrainHeightSampler';
import { isCinematicMode } from './CinematicCameraController';
import { getFreeExplorationMode } from './FreeExplorationMode';

// Constants for satellite follow mode
const SPHERE_CENTER = new Vector3(0, 0, 0);

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

// Export FOV control (for camera zoom/scale)
let cameraFovGlobal = 40; // Default FOV (degrees)
export function setCameraFov(fov) {
  // FOV range: 10 (zoomed in, everything looks bigger) to 80 (wide angle)
  cameraFovGlobal = Math.max(10, Math.min(80, fov));
}
export function getCameraFov() {
  return cameraFovGlobal;
}

// Cargo ship orbit mode
let cargoShipOrbitMode = null;
let cargoShipOrbitStartTime = null;
let cargoShipOrbitStartAngle = null;

export function setCargoShipOrbitMode(config) {
  cargoShipOrbitMode = config;
  cargoShipOrbitStartTime = Date.now();
  
  // Calculate starting angle from camera position to center
  const startPos = new Vector3(...config.startPosition);
  const center = new Vector3(...config.center);
  const offset = startPos.clone().sub(center);
  cargoShipOrbitStartAngle = Math.atan2(offset.z, offset.x);
}

export function stopCargoShipOrbitMode() {
  cargoShipOrbitMode = null;
  cargoShipOrbitStartTime = null;
  cargoShipOrbitStartAngle = null;
}

// Satellite follow mode
let satelliteFollowMode = null;
let satelliteFollowRef = null; // Reference to the satellite's ref
let satelliteOrbitParams = null; // Store orbital parameters to follow the same orbit
let satelliteFollowStartTime = null; // Track when follow mode started for time synchronization
let satelliteInitialPhase = null; // Store initial orbital phase to sync with satellite's current position

export function setSatelliteFollowMode(satelliteRef, orbitParams) {
  satelliteFollowMode = true;
  satelliteFollowRef = satelliteRef;
  satelliteOrbitParams = orbitParams; // Store orbital parameters
  
  // Get satellite's current position to calculate its current orbital phase
  // This ensures we start following from the satellite's current position in its orbit
  if (satelliteRef && satelliteRef.current) {
    const satellitePos = new Vector3();
    satelliteRef.current.getWorldPosition(satellitePos);
    
    // Calculate current orbital angle from satellite's position
    // Reverse the orbital calculation to find the angle
    const { orbitalPlane, inclination, radius } = orbitParams;
    
    // Rotate position back to orbital plane coordinates
    const cosPlane = Math.cos(orbitalPlane);
    const sinPlane = Math.sin(orbitalPlane);
    const orbitX = satellitePos.x * cosPlane + satellitePos.z * sinPlane;
    const orbitZ = -satellitePos.x * sinPlane + satellitePos.z * cosPlane;
    
    // Calculate angle from orbital plane coordinates
    // atan2 gives us the angle, but we need to account for inclination
    const orbitalAngle = Math.atan2(orbitZ / Math.cos(inclination), orbitX);
    
    // Store the initial phase offset to sync with satellite's current position
    satelliteInitialPhase = orbitalAngle;
    satelliteFollowStartTime = Date.now() / 1000; // Store start time in seconds
  } else {
    satelliteFollowStartTime = Date.now() / 1000;
    satelliteInitialPhase = orbitParams.phaseOffset; // Fallback to original phaseOffset
  }
}

export function stopSatelliteFollowMode() {
  satelliteFollowMode = null;
  satelliteFollowRef = null;
  satelliteOrbitParams = null;
  satelliteFollowStartTime = null;
  satelliteInitialPhase = null;
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
  
  // Mouse position tracking for camera rotation
  const mouseX = useRef(0); // Normalized mouse X position (-1 to 1, center = 0)
  const mouseY = useRef(0); // Normalized mouse Y position (-1 to 1, center = 0)
  const mouseDistanceFromCenter = useRef(0); // Distance from center (0 to 1)
  const mouseRotationInfluence = 0.25; // How much mouse position affects rotation (more exaggerated)
  const maxMouseRotation = 0.15; // Maximum rotation offset in radians (~8.6 degrees) - more movement
  
  // Mouse drag handlers
  useEffect(() => {
    const handleMouseDown = (e) => {
      // Don't allow dragging when menu is open
      if (isMenuOpen) return;
      
      // Stop cargo ship orbit if active (user is clicking/dragging)
      if (cargoShipOrbitMode) {
        stopCargoShipOrbitMode();
      }
      // Stop satellite follow if active (user is clicking/dragging)
      if (satelliteFollowMode) {
        stopSatelliteFollowMode();
      }
      
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
      
      // Only process dragging if mouse button is actually down
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
          
          // Stop cargo ship orbit when user starts dragging
          if (cargoShipOrbitMode) {
            stopCargoShipOrbitMode();
          }
          // Stop satellite follow when user starts dragging
          if (satelliteFollowMode) {
            stopSatelliteFollowMode();
          }
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

    // Track mouse position continuously (even when not dragging)
    const handleMouseMoveGlobal = (e) => {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      
      // Calculate distance from center (0 to 1, where 1 is at corner)
      const deltaX = e.clientX - centerX;
      const deltaY = e.clientY - centerY;
      const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);
      const distanceFromCenter = Math.sqrt(deltaX * deltaX + deltaY * deltaY) / maxDistance;
      
      // Normalize to -1 to 1 range (center = 0)
      mouseX.current = deltaX / centerX;
      mouseY.current = deltaY / centerY;
      
      // Store distance for speed ramping (0 = center, 1 = corner)
      mouseDistanceFromCenter.current = Math.min(1, distanceFromCenter);
    };

    // Add event listeners
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousemove', handleMouseMoveGlobal); // Track mouse position always
    window.addEventListener('mouseup', handleMouseUp);

    // Cleanup
    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousemove', handleMouseMoveGlobal);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
    };
  }, []);
  
  // Apply rotation and movement each frame
  useFrame((state, delta) => {
    // Don't update if menu is open, paused, or cinematic mode is active
    // But allow updates in free exploration mode
    const isFreeMode = getFreeExplorationMode();
    if (isMenuOpen || isPaused || (!isFreeMode && isCinematicMode())) return;
    
    // Handle cargo ship orbit mode
    if (cargoShipOrbitMode && cargoShipOrbitStartTime !== null) {
      const center = new Vector3(...cargoShipOrbitMode.center);
      const orbitSpeed = 0.008; // Slow orbit speed
      const direction = cargoShipOrbitMode.direction === 'counterclockwise' ? -1 : 1;
      
      // Calculate elapsed time
      const elapsed = (Date.now() - cargoShipOrbitStartTime) / 1000; // Convert to seconds
      
      // Smooth transition: for first 0.5 seconds, gradually start the orbit to avoid sudden movement
      const transitionDuration = 0.5; // 0.5 seconds transition
      const transitionProgress = Math.min(elapsed / transitionDuration, 1);
      const transitionEase = (t) => t * t * (3 - 2 * t); // Smoothstep easing
      const easedTransition = transitionEase(transitionProgress);
      
      // Calculate current orbit angle (starting from initial angle)
      // Start with 0 movement, gradually increase to full speed
      const angleOffset = elapsed * orbitSpeed * direction * easedTransition;
      const currentAngle = cargoShipOrbitStartAngle + angleOffset;
      
      // Calculate orbit position
      const x = center.x + Math.cos(currentAngle) * cargoShipOrbitMode.radius;
      const z = center.z + Math.sin(currentAngle) * cargoShipOrbitMode.radius;
      const y = cargoShipOrbitMode.startPosition[1]; // Maintain Y height
      
      // Smoothly transition position from start to orbit position
      const startPos = new Vector3(...cargoShipOrbitMode.startPosition);
      const orbitPos = new Vector3(x, y, z);
      camera.position.lerpVectors(startPos, orbitPos, easedTransition);
      
      // Look at center (cargo ship) - this will be smooth since we're already looking at it
      camera.lookAt(center);
      const euler = new Euler().setFromQuaternion(camera.quaternion, 'YXZ');
      
      // Update rotation state
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
      
      return; // Don't apply normal movement during orbit
    }
    
    // Handle satellite follow mode - calculate orbital position independently to ensure smooth orbit
    if (satelliteFollowMode && satelliteOrbitParams && satelliteFollowStartTime !== null && satelliteInitialPhase !== null) {
      const { orbitalPlane, inclination, speed, radius } = satelliteOrbitParams;
      
      // Calculate elapsed time since follow mode started
      const currentTime = Date.now() / 1000; // Current time in seconds
      const elapsedTime = currentTime - satelliteFollowStartTime;
      
      // Calculate orbital angle using the same formula as the satellite
      // Start from the initial phase (where satellite was when follow started) and progress forward
      const orbitalAngle = ((elapsedTime * speed) + satelliteInitialPhase) % (Math.PI * 2);
      
      // Calculate satellite position on orbital plane (same calculation as satellite component)
      const orbitX = Math.cos(orbitalAngle) * radius;
      const orbitY = Math.sin(orbitalAngle) * Math.sin(inclination) * radius;
      const orbitZ = Math.sin(orbitalAngle) * Math.cos(inclination) * radius;
      
      // Rotate the orbital plane around Y axis
      const cosPlane = Math.cos(orbitalPlane);
      const sinPlane = Math.sin(orbitalPlane);
      
      // Apply rotation around Y axis
      const x = orbitX * cosPlane - orbitZ * sinPlane;
      const y = orbitY;
      const z = orbitX * sinPlane + orbitZ * cosPlane;
      
      // Create satellite position vector
      const satellitePos = new Vector3(x, y, z);
      satellitePos.normalize().multiplyScalar(radius);
      
      // Calculate direction from satellite to center (satellite's forward direction)
      const directionToCenter = SPHERE_CENTER.clone().sub(satellitePos).normalize();
      
      // Position camera behind satellite (offset by 1.5 units - closer for better framing)
      // This keeps the satellite more in frame during orbital motion
      const cameraOffset = directionToCenter.clone().multiplyScalar(-1.5);
      const targetCameraPos = satellitePos.clone().add(cameraOffset);
      
      // Set camera position to follow the orbital path
      camera.position.copy(targetCameraPos);
      
      // Always look at satellite to keep it in frame
      camera.lookAt(satellitePos);
      const euler = new Euler().setFromQuaternion(camera.quaternion, 'YXZ');
      
      // Update rotation state
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
      
      return; // Don't apply normal movement during satellite follow
    }
    
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
    // Add mouse-based rotation offset when not dragging with speed ramping
    let finalPitch = rotation.current.pitch;
    let finalYaw = rotation.current.yaw;
    
    if (!isDragging.current && !isMenuOpen && !isPaused) {
      // Calculate speed ramp: faster at center (distance = 0), slower at corners (distance = 1)
      // Use easeOutQuad for smooth deceleration: 1 at center, 0 at corners
      const distance = mouseDistanceFromCenter.current;
      const speedRamp = 1 - (distance * distance); // Quadratic ease-out: 1 at center, 0 at corners
      
      // Apply mouse-based rotation offset with speed ramping
      // Mouse X controls yaw (horizontal rotation) - REVERSED direction
      // Mouse Y controls pitch (vertical rotation)
      // Speed ramping: full influence at center, reduced at edges
      const baseYawOffset = -mouseX.current * maxMouseRotation * mouseRotationInfluence; // Reversed (negative)
      const basePitchOffset = -mouseY.current * maxMouseRotation * mouseRotationInfluence; // Negative for natural feel
      
      // Apply speed ramp to the offsets
      const mouseYawOffset = baseYawOffset * speedRamp;
      const mousePitchOffset = basePitchOffset * speedRamp;
      
      // Clamp the offsets to ensure they don't exceed limits
      finalYaw += Math.max(-maxMouseRotation, Math.min(maxMouseRotation, mouseYawOffset));
      finalPitch += Math.max(-maxMouseRotation, Math.min(maxMouseRotation, mousePitchOffset));
    }
    
    const euler = new Euler(finalPitch, finalYaw, 0, 'YXZ');
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
    
    // Auto-orbit rotation removed - user has full free exploration control
    
    // Maximum altitude check: limit to terrain height + 6000m
    const terrainHeight = sampleTerrainHeight(camera.position.x, camera.position.z);
    const maxAltitude = terrainHeight + 60; // 60 units = 6000 meters above terrain (1 unit = 100m)
    if (camera.position.y > maxAltitude) {
      camera.position.y = maxAltitude;
    }
    
    // Minimum altitude check: prevent going below terrain + 5m (0.05 units)
    // 0.05 units = 5 meters (sceneScale 0.01, so 1 unit = 100m)
    const minHeightAboveTerrain = 0.05; // 5 meters above terrain
    const minAltitude = terrainHeight + minHeightAboveTerrain;
    if (camera.position.y < minAltitude) {
      camera.position.y = minAltitude;
    }
    
    // Adjust camera near plane to prevent seeing through terrain when looking down at minimum altitude
    // Calculate distance from camera to terrain
    const distanceToTerrain = camera.position.y - terrainHeight;
    // Set near plane to be a small fraction of the distance to terrain, but not too small
    // This prevents z-fighting and seeing through terrain
    const optimalNear = Math.max(0.01, Math.min(0.1, distanceToTerrain * 0.1));
    if (camera.near !== optimalNear) {
      camera.near = optimalNear;
      camera.updateProjectionMatrix();
    }
    
    // Update camera FOV from global control
    if (camera.fov !== cameraFovGlobal) {
      camera.fov = cameraFovGlobal;
      camera.updateProjectionMatrix();
    }
    
    // Auto-orbit rotation removed - user has full free exploration control
  });
  
  return null; // This component doesn't render anything
}
