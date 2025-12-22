import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { Vector3, Euler } from 'three';
import * as THREE from 'three';
import { getFreeExplorationMode } from './FreeExplorationMode';
import { setSatelliteFollowMode, stopSatelliteFollowMode } from './FreeCameraDragControls';
import { setCameraTarget } from './CameraAnimator';
import { setOrbitPaused } from './controls';
import { setTileModalOpen } from './TileModal';

// Sphere radius matches SphereEnv (updated to match terrain size)
const SPHERE_RADIUS = 18; // Matches terrain diameter (~34.55 units side length)
const SPHERE_CENTER = new Vector3(0, 0, 0);

// Single satellite component - continuous orbital motion
function Satellite({ 
  orbitalPlane = 0,     // Orbital plane angle (0 to 2π) - determines which "side" of sphere
  inclination = 0,      // Inclination angle (0 to π/2) - tilt of orbit
  speed = 0.1,          // Speed of movement (radians per second)
  radius = SPHERE_RADIUS, // Distance from center (altitude)
  phaseOffset = 0       // Phase offset for different starting positions
}) {
  const satelliteRef = useRef();
  const timeRef = useRef(phaseOffset);
  const isFreeMode = getFreeExplorationMode();
  const [isHovered, setIsHovered] = useState(false);
  
  // Load the actual Starlink satellite model - must be called unconditionally
  const { scene: satelliteModel } = useGLTF("/assets/models/starlink_spacex_satellite.glb");
  
  // Handle click on satellite
  const handleClick = (e) => {
    if (!isFreeMode) return;
    e.stopPropagation();
    setOrbitPaused(true);
    
    if (!satelliteRef.current) return;
    
    // Get satellite world position
    const satelliteWorldPos = new Vector3();
    satelliteRef.current.getWorldPosition(satelliteWorldPos);
    
    // Calculate direction from satellite to center (satellite's forward direction)
    const directionToCenter = SPHERE_CENTER.clone().sub(satelliteWorldPos).normalize();
    
    // Position camera behind satellite (offset by 2 units in the opposite direction of center)
    // This matches the follow mode camera position
    const cameraOffset = directionToCenter.clone().multiplyScalar(-2);
    const targetCameraPos = satelliteWorldPos.clone().add(cameraOffset);
    
    // Calculate rotation to look at the satellite
    // Create a temporary camera to calculate the look-at rotation
    const tempCamera = new THREE.PerspectiveCamera();
    tempCamera.position.copy(targetCameraPos);
    tempCamera.lookAt(satelliteWorldPos);
    const euler = new Euler().setFromQuaternion(tempCamera.quaternion, 'YXZ');
    
    // Animate camera to satellite's POV quickly (800ms like cargo ship)
    setCameraTarget(
      [targetCameraPos.x, targetCameraPos.y, targetCameraPos.z],
      { pitch: euler.x, yaw: euler.y, roll: euler.z },
      800, // Fast animation
      [satelliteWorldPos.x, satelliteWorldPos.y, satelliteWorldPos.z] // Look at satellite during movement
    );
    
    // Open modal with information about satellite operations in the region
    setTileModalOpen(true, {
      title: "Satellite Operations Hub",
      paragraph: "This region offers exceptional conditions for satellite operations with high satellite coverage and over 200 clear-sky days per year. The low cloud cover and minimal atmospheric interference make it ideal for projects like Starlink and other low Earth orbit (LEO) satellite constellations. The area's geographic advantages and favorable climate position it as a strategic hub for the expanding satellite economy.",
      ctaText: "Learn More",
      ctaUrl: "https://www.cabonegro.cl/en/parque-tecnologico",
      position: 'left', // Always open on left side
      imageUrl: "/stalink_satelites.webp",
    });
    
    // Enable satellite follow mode after animation completes
    // Pass orbital parameters so camera can follow the same orbit
    setTimeout(() => {
      setSatelliteFollowMode(satelliteRef.current, {
        orbitalPlane,
        inclination,
        speed,
        radius,
        phaseOffset
      });
    }, 800);
  };
  
  // Handle hover
  const handlePointerOver = (e) => {
    if (!isFreeMode) return;
    e.stopPropagation();
    setIsHovered(true);
    document.body.style.cursor = 'pointer';
  };
  
  const handlePointerOut = (e) => {
    if (!isFreeMode) return;
    e.stopPropagation();
    setIsHovered(false);
    document.body.style.cursor = '';
  };

  useFrame((state, delta) => {
    if (!satelliteRef.current) return;
    
    // Update time - continuous orbital motion (wraps around)
    timeRef.current += delta * speed;
    // Keep time in reasonable range to avoid precision issues
    if (timeRef.current > Math.PI * 100) {
      timeRef.current = timeRef.current % (Math.PI * 100);
    }
    
    // Continuous orbital angle (0 to 2π, then repeats)
    const orbitalAngle = (timeRef.current + phaseOffset) % (Math.PI * 2);
    
    // Calculate position on orbital plane
    // The orbit is a circle that can be tilted (inclination) and rotated (orbitalPlane)
    // First, calculate position in the orbital plane (2D circle)
    const orbitX = Math.cos(orbitalAngle) * radius;
    const orbitY = Math.sin(orbitalAngle) * Math.sin(inclination) * radius;
    const orbitZ = Math.sin(orbitalAngle) * Math.cos(inclination) * radius;
    
    // Rotate the orbital plane around Y axis (orbitalPlane determines which side)
    const cosPlane = Math.cos(orbitalPlane);
    const sinPlane = Math.sin(orbitalPlane);
    
    // Apply rotation around Y axis
    const x = orbitX * cosPlane - orbitZ * sinPlane;
    const y = orbitY; // Y doesn't change with Y-axis rotation
    const z = orbitX * sinPlane + orbitZ * cosPlane;
    
    // Create position vector
    const position = new Vector3(x, y, z);
    
    // Ensure the point is exactly at the specified radius
    position.normalize().multiplyScalar(radius);
    
    // Set satellite position
    satelliteRef.current.position.copy(position);
    
    // Make satellite always point down (toward center)
    const directionToCenter = SPHERE_CENTER.clone().sub(position).normalize();
    const up = new Vector3(0, 1, 0);
    const right = new Vector3().crossVectors(up, directionToCenter).normalize();
    const correctedUp = new Vector3().crossVectors(directionToCenter, right).normalize();
    
    // Create rotation matrix to look at center
    const lookAtMatrix = new THREE.Matrix4();
    lookAtMatrix.lookAt(position, SPHERE_CENTER, correctedUp);
    const quaternion = new THREE.Quaternion();
    quaternion.setFromRotationMatrix(lookAtMatrix);
    satelliteRef.current.quaternion.copy(quaternion);
    
    // Calculate opacity based on Y position
    // Fully visible at top (Y = SPHERE_RADIUS), invisible at center (Y = 0)
    // Use absolute Y to handle both positive and negative
    const normalizedY = Math.max(0, Math.min(1, Math.abs(position.y) / SPHERE_RADIUS));
    const opacity = normalizedY; // Linear fade from top to center
    
    // Apply opacity to material
    if (satelliteRef.current.material) {
      satelliteRef.current.material.opacity = opacity;
      satelliteRef.current.material.transparent = opacity < 1;
    } else if (satelliteRef.current.children && satelliteRef.current.children.length > 0) {
      // If it's a group with children, apply to all materials
      satelliteRef.current.traverse((child) => {
        if (child.isMesh && child.material) {
          child.material.opacity = opacity;
          child.material.transparent = opacity < 1;
        }
      });
    }
  });

  // Use the loaded Starlink satellite model - scale appropriately for visibility
  // Scale of 0.1 makes them 10x smaller, which should be visible but not too large
  return (
    <group
      ref={satelliteRef}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      scale={0.1}
    >
      <primitive object={satelliteModel.clone()} />
    </group>
  );
}

// Main satellites component with 6 satellites in different orbits
export function Satellites() {
  return (
    <>
      {/* Satellite 1: Equatorial orbit, medium altitude */}
      <Satellite
        orbitalPlane={0}            // Orbital plane angle
        inclination={0}              // Equatorial orbit (no tilt)
        speed={0.12}                // Medium speed
        radius={SPHERE_RADIUS}      // Standard altitude
        phaseOffset={0}             // Start position
      />
      
      {/* Satellite 2: Polar orbit, higher altitude */}
      <Satellite
        orbitalPlane={Math.PI / 4}  // 45° orbital plane
        inclination={Math.PI / 2}   // Polar orbit (90° tilt)
        speed={0.15}                 // Faster speed
        radius={SPHERE_RADIUS + 3}   // Higher altitude
        phaseOffset={Math.PI / 3}   // Different phase
      />
      
      {/* Satellite 3: Inclined orbit, lower altitude */}
      <Satellite
        orbitalPlane={Math.PI / 2}  // 90° orbital plane
        inclination={Math.PI / 4}   // 45° inclination
        speed={0.1}                  // Slower speed
        radius={SPHERE_RADIUS - 2}   // Lower altitude
        phaseOffset={Math.PI * 2 / 3} // Different phase
      />
      
      {/* Satellite 4: Different orbital plane, medium altitude */}
      <Satellite
        orbitalPlane={Math.PI}      // 180° orbital plane
        inclination={Math.PI / 6}   // 30° inclination
        speed={0.13}                 // Medium speed
        radius={SPHERE_RADIUS + 1}   // Slightly higher
        phaseOffset={Math.PI}       // Opposite phase
      />
      
      {/* Satellite 5: High inclination, standard altitude */}
      <Satellite
        orbitalPlane={Math.PI * 3 / 4} // 135° orbital plane
        inclination={Math.PI / 3}   // 60° inclination
        speed={0.11}                 // Medium-slow speed
        radius={SPHERE_RADIUS}       // Standard altitude
        phaseOffset={Math.PI * 4 / 3} // Different phase
      />
      
      {/* Satellite 6: Low inclination, higher altitude */}
      <Satellite
        orbitalPlane={Math.PI * 5 / 4} // 225° orbital plane
        inclination={Math.PI / 8}   // 22.5° inclination (low)
        speed={0.14}                 // Medium-fast speed
        radius={SPHERE_RADIUS + 2}   // Higher altitude
        phaseOffset={Math.PI * 5 / 3} // Different phase
      />
    </>
  );
}

// Preload the Starlink satellite model
useGLTF.preload("/assets/models/starlink_spacex_satellite.glb");
