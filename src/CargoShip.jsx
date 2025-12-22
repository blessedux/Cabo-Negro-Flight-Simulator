import React, { useRef, useState } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { Euler, Vector3, Matrix4, Quaternion } from 'three';
import * as THREE from 'three';
import { sampleTerrainHeight } from './terrainHeightSampler';
import { getFreeExplorationMode } from './FreeExplorationMode';
import { setCargoShipOrbitMode } from './FreeCameraDragControls';
import { setCameraTarget } from './CameraAnimator';
import { setTileModalOpen } from './TileModal';
import { setOrbitPaused } from './controls';

// Global state for cargo ship position and rotation
// Initialize with values from first image (default)
// Y offset added to keep ship above flat terrain (was underwater)
const yOffset = 0.13; // Lift ship by 0.05 units (5cm) above flat terrain
let cargoShipPosition = { x: -7.99, y: -0.08 + yOffset, z: 2.17 };
let cargoShipRotation = { pitch: 0.01, yaw: 2.989224077521392, roll: 0 };
let cargoShipCallbacks = [];

// Animation keyframes (5 positions from images)
const animationKeyframes = [
  // Keyframe 1 (default/start - first image)
  {
    position: { x: -7.99, y: -0.08 + yOffset, z: 2.17 },
    rotation: { pitch: 0.01, yaw: 2.989224077521392, roll: 0 }
  },
  // Keyframe 2 (second image)
  {
    position: { x: -4.75, y: 0.06 + yOffset, z: 2.95 },
    rotation: { pitch: 0.01, yaw: 2.989224077521392, roll: 0 }
  },
  // Keyframe 3 (third image)
  {
    position: { x: -3.64, y: -0.05 + yOffset, z: 2.71 },
    rotation: { pitch: 0.01, yaw: 3.84922407752139, roll: 0 }
  },
  // Keyframe 4 (fourth image from attached images)
  {
    position: { x: -2.5, y: 0.0 + yOffset, z: 2.5 },
    rotation: { pitch: 0.01, yaw: 4.0, roll: 0 }
  },
  // Keyframe 5 (fifth image from attached images)
  {
    position: { x: -1.5, y: -0.02 + yOffset, z: 2.3 },
    rotation: { pitch: 0.01, yaw: 4.5, roll: 0 }
  }
];

// Animation state
let animationStartTime = null;
let isAnimating = false;
const animationDuration = 160000; // 160 seconds total (10x slower than 16 seconds)
const keyframeDuration = animationDuration / 4; // 40 seconds per transition (5 keyframes total)
const shouldLoop = true; // Loop animation continuously

// Easing function for smooth animation
function easeInOutCubic(t) {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function setCargoShipPosition(position) {
  cargoShipPosition = { ...position };
  cargoShipCallbacks.forEach(cb => {
    try {
      cb({ position: cargoShipPosition, rotation: cargoShipRotation });
    } catch (error) {
      console.error('Error in cargo ship callback:', error);
    }
  });
}

export function setCargoShipRotation(rotation) {
  cargoShipRotation = { ...rotation };
  cargoShipCallbacks.forEach(cb => {
    try {
      cb({ position: cargoShipPosition, rotation: cargoShipRotation });
    } catch (error) {
      console.error('Error in cargo ship callback:', error);
    }
  });
}

export function getCargoShipState() {
  return {
    position: { ...cargoShipPosition },
    rotation: { ...cargoShipRotation }
  };
}

export function subscribeToCargoShip(callback) {
  cargoShipCallbacks.push(callback);
  return () => {
    cargoShipCallbacks = cargoShipCallbacks.filter(cb => cb !== callback);
  };
}

export function startCargoShipAnimation() {
  if (!isAnimating) {
    isAnimating = true;
    animationStartTime = Date.now();
  }
}

export function autoStartCargoShipAnimation() {
  // Auto-start animation if not already running
  if (!isAnimating) {
    startCargoShipAnimation();
  }
}

export function stopCargoShipAnimation() {
  isAnimating = false;
  animationStartTime = null;
}

export function isCargoShipAnimating() {
  return isAnimating;
}

function CargoShipModel() {
  const shipRef = useRef();
  const isFreeMode = getFreeExplorationMode();
  
  // Load cargo ship model - useGLTF must be called unconditionally
  // Errors are handled by Suspense/ErrorBoundary in parent component
  const shipModel = useGLTF("assets/models/cargo_ship_02.glb");

  useFrame(() => {
    if (!shipRef.current) return;
    
    // Use the current position and rotation from global state (default position)
    const currentPosition = { ...cargoShipPosition };
    const currentRotation = { ...cargoShipRotation };
    
    // Sample terrain height at ship's X, Z position
    const terrainHeight = sampleTerrainHeight(currentPosition.x, currentPosition.z);
    
    // Apply position - Y is relative to terrain, so add terrain height
    const finalY = terrainHeight + currentPosition.y;
    shipRef.current.position.set(
      currentPosition.x,
      finalY,
      currentPosition.z
    );
    
    // Apply rotation
    const euler = new Euler(
      currentRotation.pitch,
      currentRotation.yaw,
      currentRotation.roll,
      'YXZ'
    );
    shipRef.current.quaternion.setFromEuler(euler);
  });

  // Handle click on cargo ship
  const handleClick = (e) => {
    if (!isFreeMode) return;
    e.stopPropagation();
    
    // Get current cargo ship position (with terrain height)
    const currentPosition = { ...cargoShipPosition };
    const terrainHeight = sampleTerrainHeight(currentPosition.x, currentPosition.z);
    const shipWorldPos = {
      x: currentPosition.x,
      y: terrainHeight + currentPosition.y,
      z: currentPosition.z
    };
    
    // Camera position that looks at cargo ship - further away for better view
    const startCamPos = {
      x: -7.3,
      y: 0.353,
      z: 2.618
    };
    
    const finalRotation = {
      pitch: -0.3588,
      yaw: 0.9989,
      roll: 0
    };
    
    // Calculate orbit radius based on distance from ship
    const cameraToShip = new THREE.Vector3(
      startCamPos.x - shipWorldPos.x,
      startCamPos.y - shipWorldPos.y,
      startCamPos.z - shipWorldPos.z
    );
    const closeOrbitRadius = cameraToShip.length(); // Use actual distance as orbit radius
    
    // First animate camera to starting position (zoom in fast - 800ms), then start orbit
    // Pass the cargo ship position as lookAtTarget so camera looks at it during movement
    // Use the calculated lookAt rotation as final rotation to ensure smooth transition
    setCameraTarget(
      [startCamPos.x, startCamPos.y, startCamPos.z],
      finalRotation,
      800, // Fast zoom-in animation (800ms instead of default 1500ms)
      [shipWorldPos.x, shipWorldPos.y, shipWorldPos.z] // Look at cargo ship during movement
    );
    
    // Open modal with maritime route information
    setOrbitPaused(true);
    setTileModalOpen(true, {
      title: "Global Maritime Routes",
      paragraph: "Strategic maritime routes in this region offer significant benefits for global commerce, particularly for trade between China and the Americas. These routes provide efficient alternatives to traditional shipping lanes, reducing transit times and costs while connecting major economic centers.",
      ctaText: "Learn More",
      ctaUrl: "https://cabonegro.cl/en/terminal-maritimo",
      imageUrl: "/terminal_maritimo_iq.webp",
    });
    
    // Wait for animation to complete, then start orbit
    // Use the same final rotation to ensure smooth transition
    setTimeout(() => {
      setCargoShipOrbitMode({
        center: [shipWorldPos.x, shipWorldPos.y, shipWorldPos.z],
        startPosition: [startCamPos.x, startCamPos.y, startCamPos.z],
        startRotation: finalRotation,
        radius: closeOrbitRadius, // Very close orbit
        direction: 'counterclockwise' // Orbit to the left
      });
    }, 900); // Wait for camera animation to complete (800ms + 100ms buffer)
  };

  // Use loaded model - scaled down by 20x
  return (
    <primitive 
      ref={shipRef}
      object={shipModel.scene.clone()}
      scale={0.05} // 1/20 = 0.05 (20x smaller)
      onClick={handleClick}
      onPointerOver={(e) => {
        if (isFreeMode) {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }
      }}
      onPointerOut={(e) => {
        if (isFreeMode) {
          e.stopPropagation();
          document.body.style.cursor = '';
        }
      }}
    />
  );
}

export function CargoShip() {
  return (
    <CargoShipModel />
  );
}

// Preload the cargo ship model at module level (like Airplane.jsx)
useGLTF.preload("assets/models/cargo_ship_02.glb");
