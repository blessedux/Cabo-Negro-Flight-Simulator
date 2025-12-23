import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3, Euler, Matrix4, Quaternion } from 'three';
import * as THREE from 'three';
import { getScene, EASING_FUNCTIONS } from './cinematicScenes';
import { beamPosition, beamHeight } from './LocationBeam';
import { sampleTerrainHeight } from './terrainHeightSampler';
import { resetCameraAnimation } from './CameraAnimator';

// Global state for cinematic camera control
let currentSceneId = null;
let sceneStartTime = null;
let isCinematicActive = false;
let orbitAngle = 0;
let sceneProgress = 0;

// Transition state
let isTransitioning = false;
let transitionStartTime = null;
let transitionStartPosition = null;
let transitionStartRotation = null;
let transitionStartFov = null;
let transitionTargetPosition = null;
let transitionTargetRotation = null;
let transitionTargetFov = null;
let transitionDuration = 2000; // 2 seconds for smooth transition
let transitionTurbo = 0; // For FOV zoom effect (0-1)
let transitionMotionBlurStrength = 0; // For motion blur effect (0-1)

// Camera reference (set by CinematicCameraController component)
let cameraRef = null;

// Callbacks for scene changes
let sceneChangeCallbacks = [];

export function setCameraRef(camera) {
  cameraRef = camera;
}

export function getCameraRef() {
  return cameraRef;
}

export function startCinematicScene(sceneId) {
  const scene = getScene(sceneId);
  if (!scene) return;
  
  const isSceneChange = currentSceneId !== null && currentSceneId !== sceneId;
  
  // If we have a camera reference and we're switching scenes, start transition
  if (cameraRef && isSceneChange) {
    // Capture current camera state for transition
    transitionStartPosition = cameraRef.position.clone();
    const currentEuler = new Euler().setFromQuaternion(cameraRef.quaternion, 'YXZ');
    transitionStartRotation = {
      pitch: currentEuler.x,
      yaw: currentEuler.y,
      roll: currentEuler.z
    };
    transitionStartFov = cameraRef.fov;
    
    // Set target state from new scene
    transitionTargetPosition = new Vector3(...scene.camera.position);
    transitionTargetRotation = { ...scene.camera.rotation };
    transitionTargetFov = scene.camera.fov;
    
    // Start transition
    isTransitioning = true;
    transitionStartTime = Date.now();
    isCinematicActive = false; // Don't start cinematic movement yet
  } else {
    // First scene or no camera reference, start immediately
    isTransitioning = false;
    isCinematicActive = true;
    sceneStartTime = Date.now();
    
    // Set camera to initial position immediately if available
    if (cameraRef && !isSceneChange) {
      cameraRef.position.set(...scene.camera.position);
      const initialEuler = new Euler(
        scene.camera.rotation.pitch,
        scene.camera.rotation.yaw,
        scene.camera.rotation.roll,
        'YXZ'
      );
      cameraRef.quaternion.setFromEuler(initialEuler);
      cameraRef.fov = scene.camera.fov;
      cameraRef.updateProjectionMatrix();
    }
  }
  
  currentSceneId = sceneId;
  orbitAngle = 0;
  sceneProgress = 0;
  
  // Reset any ongoing camera animations to prevent interference
  resetCameraAnimation();
  
  // Notify listeners
  sceneChangeCallbacks.forEach(cb => {
    try {
      cb(sceneId);
    } catch (error) {
      console.error('Error in scene change callback:', error);
    }
  });
}

export function isTransitioningState() {
  return isTransitioning;
}

export function getTransitionTurbo() {
  return transitionTurbo;
}

export function getTransitionMotionBlurStrength() {
  return transitionMotionBlurStrength;
}

export function stopCinematicScene() {
  isCinematicActive = false;
  isTransitioning = false;
  currentSceneId = null;
  sceneStartTime = null;
  transitionStartTime = null;
  transitionStartPosition = null;
  transitionStartRotation = null;
  transitionStartFov = null;
  transitionTargetPosition = null;
  transitionTargetRotation = null;
  transitionTargetFov = null;
  transitionTurbo = 0;
  transitionMotionBlurStrength = 0;
  orbitAngle = 0;
  sceneProgress = 0;
}

export function getCurrentSceneId() {
  return currentSceneId;
}

export function isCinematicMode() {
  return isCinematicActive;
}

export function getSceneProgress() {
  return sceneProgress;
}

export function subscribeToSceneChange(callback) {
  sceneChangeCallbacks.push(callback);
  return () => {
    sceneChangeCallbacks = sceneChangeCallbacks.filter(cb => cb !== callback);
  };
}

export function CinematicCameraController() {
  const { camera } = useThree();
  const initialPositionRef = useRef(null);
  const initialRotationRef = useRef(null);
  const movementStateRef = useRef({
    orbitAngle: 0,
    panProgress: 0,
    dollyProgress: 0,
    trackingProgress: 0,
    staticDrift: { x: 0, y: 0, z: 0 },
    pullBackProgress: 0,
    satelliteTime: 0 // Track accumulated time for satellite orbit (frame-based)
  });
  
  // Scroll zoom momentum state
  const scrollVelocityRef = useRef(0);
  const targetDistanceRef = useRef(null);

  // Store camera reference globally for transitions
  useEffect(() => {
    setCameraRef(camera);
    
    // Initialize camera position for current scene if not transitioning
    if (currentSceneId && !isTransitioning && !isCinematicActive) {
      const scene = getScene(currentSceneId);
      if (scene) {
        camera.position.set(...scene.camera.position);
        const initialEuler = new Euler(
          scene.camera.rotation.pitch,
          scene.camera.rotation.yaw,
          scene.camera.rotation.roll || 0,
          'YXZ'
        );
        camera.quaternion.setFromEuler(initialEuler);
        camera.fov = scene.camera.fov;
        camera.updateProjectionMatrix();
        isCinematicActive = true;
        sceneStartTime = Date.now();
      }
    }
    
    return () => {
      setCameraRef(null);
    };
  }, [camera]);

  // Scroll wheel support for zooming with momentum (drone camera feel)
  useEffect(() => {
    const scrollSpeed = 0.15; // Base scroll speed
    const maxMomentum = 2.0; // Maximum momentum multiplier
    
    const handleWheel = (e) => {
      // Only allow scrolling when cinematic mode is active
      if (!isCinematicActive || isTransitioning) return;
      
      e.preventDefault();
      
      // Calculate scroll delta (normalize for different browsers)
      const delta = e.deltaY > 0 ? scrollSpeed : -scrollSpeed;
      
      // Add to velocity with momentum
      scrollVelocityRef.current += delta;
      scrollVelocityRef.current = Math.max(-maxMomentum * scrollSpeed, Math.min(maxMomentum * scrollSpeed, scrollVelocityRef.current));
      
      // Use beam position as the reference point for distance calculation
      const lookAtPoint = beamPosition.clone();
      const currentDistance = camera.position.distanceTo(lookAtPoint);
      
      // Calculate target distance based on velocity
      targetDistanceRef.current = currentDistance - scrollVelocityRef.current;
      const minDistance = 0.5;
      const maxDistance = 15.0;
      targetDistanceRef.current = Math.max(minDistance, Math.min(maxDistance, targetDistanceRef.current));
    };
    
    window.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      window.removeEventListener('wheel', handleWheel);
    };
  }, [camera]);

  useFrame((state, delta) => {
    // Apply scroll zoom momentum (drone camera feel)
    if (isCinematicActive && !isTransitioning && targetDistanceRef.current !== null) {
      const momentumDecay = 0.92; // Momentum decay per frame
      const minDistance = 0.5;
      const maxDistance = 15.0;
      
      // Get camera's forward direction
      const forward = new Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
      const lookAtPoint = beamPosition.clone();
      const currentDistance = camera.position.distanceTo(lookAtPoint);
      
      // Smoothly interpolate towards target distance
      const distanceDiff = targetDistanceRef.current - currentDistance;
      const moveAmount = distanceDiff * 0.1; // Smooth interpolation
      
      if (Math.abs(distanceDiff) > 0.01) {
        const newPosition = camera.position.clone().add(forward.multiplyScalar(-moveAmount));
        const newDistance = newPosition.distanceTo(lookAtPoint);
        
        // Clamp distance
        if (newDistance >= minDistance && newDistance <= maxDistance) {
          // Also check terrain height
          const terrainHeight = sampleTerrainHeight(newPosition.x, newPosition.z);
          const minHeightAboveTerrain = 0.3;
          if (newPosition.y >= terrainHeight + minHeightAboveTerrain) {
            camera.position.copy(newPosition);
          }
        }
      }
      
      // Decay momentum
      scrollVelocityRef.current *= momentumDecay;
      if (Math.abs(scrollVelocityRef.current) < 0.01) {
        scrollVelocityRef.current = 0;
        targetDistanceRef.current = null;
      } else {
        // Update target distance based on remaining velocity
        targetDistanceRef.current = currentDistance - scrollVelocityRef.current;
        targetDistanceRef.current = Math.max(minDistance, Math.min(maxDistance, targetDistanceRef.current));
      }
    }
    
    // Handle transition first
    if (isTransitioning && transitionStartTime && transitionStartPosition && transitionTargetPosition) {
      const transitionElapsed = Date.now() - transitionStartTime;
      const transitionProgress = Math.min(transitionElapsed / transitionDuration, 1);
      
      // Create turbo effect: zoom in at start, zoom out at end (like shift key effect)
      // Turbo peaks at 50% of transition
      const turboProgress = transitionProgress < 0.5 
        ? transitionProgress * 2  // Ramp up to 1.0 at midpoint
        : 2 - (transitionProgress * 2); // Ramp down from 1.0 to 0.0
      
      // Ease the turbo for smoother effect
      const easeOutQuad = (t) => t * (2 - t);
      transitionTurbo = easeOutQuad(turboProgress);
      
      // Motion blur strength follows turbo
      transitionMotionBlurStrength = transitionTurbo;
      
      // Use easeInOutCubic for smooth camera movement
      const easing = EASING_FUNCTIONS.easeInOutCubic;
      const easedProgress = easing(transitionProgress);
      
      // Interpolate position
      camera.position.lerpVectors(transitionStartPosition, transitionTargetPosition, easedProgress);
      
      // Interpolate rotation
      const currentPitch = THREE.MathUtils.lerp(
        transitionStartRotation.pitch,
        transitionTargetRotation.pitch,
        easedProgress
      );
      const currentYaw = THREE.MathUtils.lerp(
        transitionStartRotation.yaw,
        transitionTargetRotation.yaw,
        easedProgress
      );
      const currentRoll = THREE.MathUtils.lerp(
        transitionStartRotation.roll || 0,
        transitionTargetRotation.roll || 0,
        easedProgress
      );
      
      const euler = new Euler(currentPitch, currentYaw, currentRoll, 'YXZ');
      camera.quaternion.setFromEuler(euler);
      
      // Apply FOV zoom effect (like shift key in flight scene)
      // Base FOV interpolation
      let baseFov = transitionStartFov;
      if (transitionTargetFov !== null && transitionStartFov !== null) {
        baseFov = THREE.MathUtils.lerp(transitionStartFov, transitionTargetFov, easedProgress);
      }
      
      // Add turbo zoom effect (similar to flight scene: 45 + turboSpeed * 900)
      // Scale the effect based on transition turbo
      const turboSpeed = easeOutQuad(transitionTurbo) * 0.06; // Match flight scene calculation
      const zoomFov = turboSpeed * 900; // Match flight scene FOV calculation
      camera.fov = baseFov + zoomFov;
      camera.updateProjectionMatrix();
      
      // Transition complete
      if (transitionProgress >= 1) {
        isTransitioning = false;
        transitionTurbo = 0;
        transitionMotionBlurStrength = 0;
        isCinematicActive = true;
        sceneStartTime = Date.now();
        initialPositionRef.current = null; // Reset to allow new scene initialization
        initialRotationRef.current = null;
        
        // Reset FOV to target
        if (transitionTargetFov !== null) {
          camera.fov = transitionTargetFov;
          camera.updateProjectionMatrix();
        }
      }
      
      return; // Don't process cinematic movement during transition
    }
    
    if (!isCinematicActive || !currentSceneId) {
      return;
    }

    const scene = getScene(currentSceneId);
    if (!scene) {
      return;
    }

    // Initialize camera position/rotation on first frame
    if (initialPositionRef.current === null) {
      initialPositionRef.current = camera.position.clone();
      const euler = new Euler().setFromQuaternion(camera.quaternion, 'YXZ');
      initialRotationRef.current = {
        pitch: euler.x,
        yaw: euler.y,
        roll: euler.z
      };
      
      // Set initial camera position and FOV
      camera.position.set(...scene.camera.position);
      camera.fov = scene.camera.fov;
      camera.updateProjectionMatrix();
      
      const initialEuler = new Euler(
        scene.camera.rotation.pitch,
        scene.camera.rotation.yaw,
        scene.camera.rotation.roll,
        'YXZ'
      );
      camera.quaternion.setFromEuler(initialEuler);
    }

    // Calculate scene progress (0-1)
    const elapsed = Date.now() - sceneStartTime;
    sceneProgress = Math.min(elapsed / scene.movement.duration, 1);
    
    // Get easing function
    const easing = EASING_FUNCTIONS[scene.movement.easing] || EASING_FUNCTIONS.linear;
    const easedProgress = easing(sceneProgress);

    // Apply movement based on type
    const movement = scene.movement;
    const basePos = new Vector3(...scene.camera.position);
    const baseRot = scene.camera.rotation;

    switch (movement.type) {
      case 'orbit': {
        // Circular orbit around center
        const radius = THREE.MathUtils.lerp(movement.radiusStart, movement.radiusEnd, easedProgress);
        
        // Update orbit angle based on elapsed time for consistency
        const elapsed = (Date.now() - sceneStartTime) / 1000; // Convert to seconds
        const currentAngle = elapsed * movement.speed * (movement.direction === 'clockwise' ? 1 : -1);
        
        const x = movement.center[0] + Math.cos(currentAngle) * radius;
        const z = movement.center[2] + Math.sin(currentAngle) * radius;
        const y = basePos.y;
        
        camera.position.set(x, y, z);
        
        // Maintain constant pitch, rotate yaw to look at center
        const lookAtCenter = new Vector3(...movement.center);
        camera.lookAt(lookAtCenter);
        const euler = new Euler().setFromQuaternion(camera.quaternion, 'YXZ');
        camera.quaternion.setFromEuler(new Euler(baseRot.pitch, euler.y, baseRot.roll, 'YXZ'));
        break;
      }

      case 'orbitDolly': {
        // Combined orbit and dolly backwards - smooth circular orbit while pulling back
        const radius = THREE.MathUtils.lerp(movement.radiusStart, movement.radiusEnd, easedProgress);
        
        // Calculate starting angle from initial position
        const startPos = new Vector3(...basePos);
        const center = new Vector3(...movement.center);
        const startOffset = startPos.clone().sub(center);
        const startAngle = Math.atan2(startOffset.z, startOffset.x);
        
        // Update orbit angle based on elapsed time, starting from initial angle
        const elapsed = (Date.now() - sceneStartTime) / 1000; // Convert to seconds
        const orbitSpeed = movement.speed || 0.008;
        const angleOffset = elapsed * orbitSpeed * (movement.direction === 'clockwise' ? 1 : -1);
        const currentAngle = startAngle + angleOffset;
        
        // Calculate orbit position (maintain Y coordinate from starting position)
        const x = movement.center[0] + Math.cos(currentAngle) * radius;
        const z = movement.center[2] + Math.sin(currentAngle) * radius;
        const y = basePos.y; // Maintain Y height from starting position (0.05)
        
        camera.position.set(x, y, z);
        
        // Look at center while orbiting and dollying
        const lookAtCenter = new Vector3(...movement.center);
        camera.lookAt(lookAtCenter);
        const euler = new Euler().setFromQuaternion(camera.quaternion, 'YXZ');
        
        // Smoothly adjust pitch slightly as we dolly back to maintain good viewing angle
        const pitchAdjustment = easedProgress * 0.05; // Very slight pitch adjustment
        camera.quaternion.setFromEuler(new Euler(baseRot.pitch + pitchAdjustment, euler.y, baseRot.roll, 'YXZ'));
        break;
      }

      case 'pan': {
        // Lateral movement with yaw rotation
        const yaw = THREE.MathUtils.lerp(movement.yawStart, movement.yawEnd, easedProgress);
        const panDistance = easedProgress * 3.0; // Adjust pan distance as needed
        
        const forward = new Vector3(0, 0, -1);
        const right = new Vector3(1, 0, 0);
        const euler = new Euler(baseRot.pitch, yaw, baseRot.roll, 'YXZ');
        const quaternion = new THREE.Quaternion().setFromEuler(euler);
        
        right.applyQuaternion(quaternion);
        const newPos = basePos.clone().add(right.multiplyScalar(panDistance));
        
        camera.position.copy(newPos);
        camera.quaternion.setFromEuler(euler);
        break;
      }

      case 'lateralPan': {
        // Lateral panning while maintaining the same camera angle
        const right = new Vector3(1, 0, 0);
        const euler = new Euler(baseRot.pitch, baseRot.yaw, baseRot.roll, 'YXZ');
        const quaternion = new THREE.Quaternion().setFromEuler(euler);
        
        // Apply rotation to right vector to get camera's right direction
        right.applyQuaternion(quaternion);
        
        // Calculate pan distance based on progress
        const panDistance = easedProgress * (movement.distance || 4.0);
        const direction = movement.direction === 'left' ? -1 : 1;
        
        // Move camera along its right vector
        const newPos = basePos.clone().add(right.multiplyScalar(panDistance * direction));
        
        camera.position.copy(newPos);
        // Keep the exact same rotation
        camera.quaternion.setFromEuler(euler);
        break;
      }

      case 'keyframePan': {
        // Smooth keyframe-based panning that orbits around the cargo ship
        const keyframes = movement.keyframes || [];
        if (keyframes.length === 0) {
          // Fallback to base position/rotation
          camera.position.set(...basePos);
          const euler = new Euler(baseRot.pitch, baseRot.yaw, baseRot.roll, 'YXZ');
          camera.quaternion.setFromEuler(euler);
          break;
        }
        
        // Handle looping: if loop is enabled, wrap the progress
        let progress = sceneProgress;
        if (movement.loop) {
          progress = progress % 1; // Wrap to 0-1 range
        } else {
          progress = Math.min(progress, 1); // Clamp to 1
        }
        
        // Calculate which segment we're in
        const numSegments = keyframes.length - 1;
        const segmentSize = 1 / numSegments;
        
        // Find current segment
        let currentSegment = Math.floor(progress / segmentSize);
        // For looping, wrap around; for non-looping, clamp to last segment
        if (movement.loop) {
          currentSegment = currentSegment % numSegments;
        } else {
          currentSegment = Math.min(currentSegment, numSegments - 1);
        }
        
        // Calculate progress within current segment (0 to 1)
        const segmentProgress = (progress % segmentSize) / segmentSize;
        
        // Get keyframes for current segment
        const fromKeyframe = keyframes[currentSegment];
        const toKeyframe = keyframes[(currentSegment + 1) % keyframes.length]; // Wrap around for looping
        
        // Use easeInOutSine for smooth transitions between keyframes
        const segmentEasing = EASING_FUNCTIONS.easeInOutSine || EASING_FUNCTIONS.linear;
        const easedSegmentProgress = segmentEasing(segmentProgress);
        
        // Interpolate position
        const currentPosition = new Vector3(
          THREE.MathUtils.lerp(fromKeyframe.position[0], toKeyframe.position[0], easedSegmentProgress),
          THREE.MathUtils.lerp(fromKeyframe.position[1], toKeyframe.position[1], easedSegmentProgress),
          THREE.MathUtils.lerp(fromKeyframe.position[2], toKeyframe.position[2], easedSegmentProgress)
        );
        
        // Interpolate rotation
        const currentPitch = THREE.MathUtils.lerp(
          fromKeyframe.rotation.pitch,
          toKeyframe.rotation.pitch,
          easedSegmentProgress
        );
        const currentYaw = THREE.MathUtils.lerp(
          fromKeyframe.rotation.yaw,
          toKeyframe.rotation.yaw,
          easedSegmentProgress
        );
        const currentRoll = THREE.MathUtils.lerp(
          fromKeyframe.rotation.roll || 0,
          toKeyframe.rotation.roll || 0,
          easedSegmentProgress
        );
        
        // Interpolate FOV if provided in keyframes
        if (fromKeyframe.fov !== undefined && toKeyframe.fov !== undefined) {
          const currentFov = THREE.MathUtils.lerp(
            fromKeyframe.fov,
            toKeyframe.fov,
            easedSegmentProgress
          );
          camera.fov = currentFov;
          camera.updateProjectionMatrix();
        }
        
        // Apply position and rotation
        camera.position.copy(currentPosition);
        const euler = new Euler(currentPitch, currentYaw, currentRoll, 'YXZ');
        camera.quaternion.setFromEuler(euler);
        break;
      }

      case 'pullBack': {
        // Vertical pull-back
        if (movement.axis === 'vertical') {
          const y = THREE.MathUtils.lerp(movement.startY, movement.endY, easedProgress);
          camera.position.set(basePos.x, y, basePos.z);
          
          // If lookAtCenter is enabled, continuously adjust angle to look at center/beam
          if (movement.lookAtCenter) {
            // Calculate beam base position (center target)
            const beamBasePosition = new Vector3(
              beamPosition.x,
              beamPosition.y - beamHeight / 2,
              beamPosition.z
            );
            
            // Calculate direction to beam base
            const directionToBeam = beamBasePosition.clone().sub(camera.position).normalize();
            const up = new Vector3(0, 1, 0);
            
            // Create rotation matrix to look at beam base
            const lookAtMatrix = new Matrix4();
            lookAtMatrix.lookAt(camera.position, beamBasePosition, up);
            const targetQuaternion = new Quaternion();
            targetQuaternion.setFromRotationMatrix(lookAtMatrix);
            
            camera.quaternion.copy(targetQuaternion);
          } else {
            // Maintain original rotation if lookAtCenter is not enabled
            const euler = new Euler(baseRot.pitch, baseRot.yaw, baseRot.roll, 'YXZ');
            camera.quaternion.setFromEuler(euler);
          }
        } else {
          // Maintain rotation for non-vertical pullBack
          const euler = new Euler(baseRot.pitch, baseRot.yaw, baseRot.roll, 'YXZ');
          camera.quaternion.setFromEuler(euler);
        }
        break;
      }

      case 'dolly': {
        // Forward movement with slight yaw adjustment
        const yaw = THREE.MathUtils.lerp(movement.yawStart, movement.yawEnd, easedProgress);
        const forward = new Vector3(0, 0, -1);
        const euler = new Euler(baseRot.pitch, yaw, baseRot.roll, 'YXZ');
        const quaternion = new THREE.Quaternion().setFromEuler(euler);
        
        forward.applyQuaternion(quaternion);
        const newPos = basePos.clone().add(forward.multiplyScalar(easedProgress * movement.distance));
        
        camera.position.copy(newPos);
        camera.quaternion.setFromEuler(euler);
        break;
      }

      case 'tracking': {
        // Lateral tracking shot (right to left)
        const right = new Vector3(1, 0, 0);
        const euler = new Euler(baseRot.pitch, baseRot.yaw, baseRot.roll, 'YXZ');
        const quaternion = new THREE.Quaternion().setFromEuler(euler);
        
        right.applyQuaternion(quaternion);
        const trackingDistance = easedProgress * 4.0; // Adjust tracking distance
        const newPos = basePos.clone().sub(right.multiplyScalar(trackingDistance));
        
        camera.position.copy(newPos);
        camera.quaternion.setFromEuler(euler);
        break;
      }

      case 'staticHold': {
        // Minimal drift with micro movement
        const drift = movement.drift;
        const time = state.clock.elapsedTime;
        
        movementStateRef.current.staticDrift.x = Math.sin(time * movement.speed) * drift;
        movementStateRef.current.staticDrift.y = Math.cos(time * movement.speed * 0.7) * drift * 0.5;
        movementStateRef.current.staticDrift.z = Math.sin(time * movement.speed * 1.3) * drift * 0.3;
        
        const newPos = basePos.clone().add(new Vector3(
          movementStateRef.current.staticDrift.x,
          movementStateRef.current.staticDrift.y,
          movementStateRef.current.staticDrift.z
        ));
        
        camera.position.copy(newPos);
        const euler = new Euler(baseRot.pitch, baseRot.yaw, baseRot.roll, 'YXZ');
        camera.quaternion.setFromEuler(euler);
        break;
      }

      case 'pullBackRise': {
        // Combined pull-back and rise
        const forward = new Vector3(0, 0, -1);
        const up = new Vector3(0, 1, 0);
        const euler = new Euler(baseRot.pitch, baseRot.yaw, baseRot.roll, 'YXZ');
        const quaternion = new THREE.Quaternion().setFromEuler(euler);
        
        forward.applyQuaternion(quaternion);
        const pullBack = forward.multiplyScalar(easedProgress * movement.pullBackDistance);
        const rise = up.multiplyScalar(easedProgress * movement.riseDistance);
        
        const newPos = basePos.clone().add(pullBack).add(rise);
        camera.position.copy(newPos);
        camera.quaternion.setFromEuler(euler);
        break;
      }

      case 'satellite': {
        // Satellite movement: camera follows satellite's orbital motion and always looks at the satellite model
        const SPHERE_RADIUS = 18; // Matches terrain diameter (~34.55 units side length)
        const SPHERE_CENTER = new Vector3(0, 0, 0);
        
        // Use frame-based time accumulation (same as Satellite component)
        // Reset time when scene starts
        if (sceneStartTime === null) {
          sceneStartTime = Date.now();
          movementStateRef.current.satelliteTime = movement.phaseOffset || 0;
        }
        
        // Accumulate time using delta (frame-based, matches satellite component exactly)
        // Satellite component: timeRef.current += delta * speed
        movementStateRef.current.satelliteTime += delta * movement.speed;
        // Keep time in reasonable range to avoid precision issues
        if (movementStateRef.current.satelliteTime > Math.PI * 100) {
          movementStateRef.current.satelliteTime = movementStateRef.current.satelliteTime % (Math.PI * 100);
        }
        
        // Continuous orbital angle (0 to 2π, then repeats) - matches satellite calculation exactly
        // Satellite component: const orbitalAngle = (timeRef.current + phaseOffset) % (Math.PI * 2);
        const orbitalAngle = (movementStateRef.current.satelliteTime + (movement.phaseOffset || 0)) % (Math.PI * 2);
        
        // Orbital plane and inclination from movement config
        const orbitalPlane = movement.orbitalPlane || 0;
        const inclination = movement.inclination || 0;
        const radius = movement.radius || SPHERE_RADIUS;
        
        // Calculate satellite position on orbital plane (same calculation as Satellite component)
        const orbitX = Math.cos(orbitalAngle) * radius;
        const orbitY = Math.sin(orbitalAngle) * Math.sin(inclination) * radius;
        const orbitZ = Math.sin(orbitalAngle) * Math.cos(inclination) * radius;
        
        // Rotate the orbital plane around Y axis (orbitalPlane determines which side)
        const cosPlane = Math.cos(orbitalPlane);
        const sinPlane = Math.sin(orbitalPlane);
        
        // Apply rotation around Y axis
        const x = orbitX * cosPlane - orbitZ * sinPlane;
        let y = orbitY; // Y doesn't change with Y-axis rotation
        const z = orbitX * sinPlane + orbitZ * cosPlane;
        
        // Create satellite position vector
        const satellitePosition = new Vector3(x, y, z);
        
        // Ensure the point is exactly at the specified radius
        satellitePosition.normalize().multiplyScalar(radius);
        
        // Ensure orbit doesn't go below terrain (altitude 0+)
        // Clamp Y to ensure it's always above terrain level (Y >= 0)
        // For orbits that would go below, we'll adjust the Y to be at least 0
        if (satellitePosition.y < 0) {
          // Project the position onto the sphere at Y = 0 level
          const horizontalRadius = Math.sqrt(satellitePosition.x * satellitePosition.x + satellitePosition.z * satellitePosition.z);
          if (horizontalRadius > 0) {
            const scale = radius / horizontalRadius;
            satellitePosition.x *= scale;
            satellitePosition.z *= scale;
            satellitePosition.y = 0; // Set to terrain level
          } else {
            // If at center, position above
            satellitePosition.set(0, radius, 0);
          }
        }
        
        // Calculate direction from satellite to center (satellite's forward direction)
        const directionToCenter = SPHERE_CENTER.clone().sub(satellitePosition).normalize();
        
        // Position camera behind satellite (offset by 1.5 units - closer for better framing)
        // This keeps the satellite in frame during orbital motion
        const cameraOffset = directionToCenter.clone().multiplyScalar(-1.5);
        const targetCameraPos = satellitePosition.clone().add(cameraOffset);
        
        // Set camera position to follow the orbital path behind the satellite
        camera.position.copy(targetCameraPos);
        
        // Always look at satellite to keep it in frame
        camera.lookAt(satellitePosition);
        break;
      }

      default:
        // Static camera
        camera.position.set(...basePos);
        const euler = new Euler(baseRot.pitch, baseRot.yaw, baseRot.roll, 'YXZ');
        camera.quaternion.setFromEuler(euler);
    }
  });

    // Reset when scene changes
  useEffect(() => {
    const unsubscribe = subscribeToSceneChange(() => {
      initialPositionRef.current = null;
      initialRotationRef.current = null;
      movementStateRef.current = {
        orbitAngle: 0,
        panProgress: 0,
        dollyProgress: 0,
        trackingProgress: 0,
        staticDrift: { x: 0, y: 0, z: 0 },
        pullBackProgress: 0,
        satelliteTime: 0
      };
    });

    return unsubscribe;
  }, []);

  return null;
}
