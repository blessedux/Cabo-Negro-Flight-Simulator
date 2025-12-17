import { useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
import { planePosition } from './Airplane';
import { beamPosition, beamRadius, beamHeight } from './LocationBeam';
import { isPaused } from './controls';
import { sampleTerrainHeight } from './terrainHeightSampler';

// Collision callbacks
let onBeamHit = null;
let onGroundHit = null;
let onAltitudeZero = null;

export function setBeamHitCallback(callback) {
  onBeamHit = callback;
}

export function setGroundHitCallback(callback) {
  onGroundHit = callback;
}

export function setAltitudeZeroCallback(callback) {
  onAltitudeZero = callback;
}

// Persistent flags that reset on scene change
let hasTriggeredBeamHit = false;
let hasTriggeredGroundHit = false;
let hasTriggeredAltitudeZero = false;

export function resetCollisionFlags() {
  hasTriggeredBeamHit = false;
  hasTriggeredGroundHit = false;
  hasTriggeredAltitudeZero = false;
}

export function CollisionDetector() {
  const collisionThreshold = 0.15; // Distance threshold for collisions
  // Very small threshold - only trigger when actually hitting terrain (within ~1-2 meters)
  // 0.02 units = ~2 meters in scene scale (0.01 scale means 1 unit = 100m)
  const groundCollisionThreshold = 0.02; // ~2 meters above terrain

  useFrame(() => {
    // Don't check collisions when paused
    if (isPaused) return;

    // Check beam collision
    if (!hasTriggeredBeamHit && onBeamHit && beamPosition) {
      const distanceToBeam = new Vector3();
      distanceToBeam.subVectors(planePosition, beamPosition);
      
      // Check horizontal distance (X and Z)
      const horizontalDistance = Math.sqrt(
        distanceToBeam.x * distanceToBeam.x + 
        distanceToBeam.z * distanceToBeam.z
      );
      
      // Check if plane is within beam radius horizontally
      // and within beam height range vertically
      const verticalDistance = Math.abs(distanceToBeam.y);
      const beamBottom = beamPosition.y - beamHeight / 2;
      const beamTop = beamPosition.y + beamHeight / 2;
      
      if (
        horizontalDistance < beamRadius + collisionThreshold &&
        planePosition.y >= beamBottom &&
        planePosition.y <= beamTop
      ) {
        hasTriggeredBeamHit = true;
        onBeamHit();
      }
    }

    // Sample terrain height at plane's X, Z position
    const terrainHeight = sampleTerrainHeight(planePosition.x, planePosition.z);
    const groundLevel = terrainHeight;
    const altitudeAboveGround = planePosition.y - groundLevel;
    
    // Check altitude zero (plane altitude relative to terrain <= 0)
    // Use a very small threshold (0.01 = ~1 meter) to account for floating point precision
    // Only trigger when actually at or below terrain level
    if (!hasTriggeredAltitudeZero && onAltitudeZero) {
      if (altitudeAboveGround <= 0.01) {
        hasTriggeredAltitudeZero = true;
        onAltitudeZero();
      }
    }

    // Check ground collision (plane altitude relative to terrain <= threshold)
    // Use the same small threshold - only trigger when actually hitting terrain
    if (!hasTriggeredGroundHit && onGroundHit) {
      if (altitudeAboveGround <= groundCollisionThreshold) {
        hasTriggeredGroundHit = true;
        onGroundHit();
      }
    }
  });

  return null; // This component doesn't render anything
}
