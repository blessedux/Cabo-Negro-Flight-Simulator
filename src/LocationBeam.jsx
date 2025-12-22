import React, { useMemo, useEffect, useState } from 'react';
import { CylinderGeometry, ShaderMaterial } from 'three';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

import { Vector3 } from 'three';

// Export beam position for collision detection
export let beamPosition = new Vector3();
export let beamRadius = 0.03;
export let beamHeight = 50;

export function LocationBeam() {
  // Target location based on tile 13_2483_5521
  // Position: approximately 45.94 meters north of the terrain center
  
  // Terrain settings from MountainRoadLandscape
  const textureCoverageMeters = 3455; // 3.455 km
  const sceneScale = 0.01; // Scene scale factor
  
  // Position relative to terrain center
  // Each tile is ~11.48 meters
  // Moving 10 more tiles north and 1 tile west from current position
  const tilesNorth = 6; // Additional 6 tiles north
  const additionalTilesNorth = 10; // Additional 10 tiles north
  const tilesWest = 1; // 1 tile west
  const offsetNorthMeters = 45.94 - (12 * 11.48) + (6 * 11.48) + (10 * 11.48) + (tilesNorth * 11.48) + (6 * 11.48) - (additionalTilesNorth * 28.48); // Subtract to move north (north is negative in this coordinate system)
  const offsetEastMeters = -tilesWest * 6.48; // West is negative (1 tile west)
  
  // Convert to scene coordinates
  // North is negative Z, so we negate the north offset
  const sceneX = offsetEastMeters * sceneScale;
  const sceneZ = -offsetNorthMeters * sceneScale; // Negative because north = negative Z
  
  // Load heightmap to sample terrain height
  const heightmapTexture = useTexture("/assets/textures/punta-arenas-cabonegro-heightmap.png");
  const [terrainHeight, setTerrainHeight] = useState(0);
  
  // Calculate terrain height at beam position
  useEffect(() => {
    if (!heightmapTexture || !heightmapTexture.image) return;
    
    // Terrain settings (matching MountainRoadLandscape)
    const heightmapCoverageMeters = 80000; // 80 km
    const textureCenterLat = -52.871;
    const textureCenterLng = -70.862;
    const heightmapCenterLat = -53.061;
    const heightmapCenterLng = -70.878;
    
    // Convert lat/lng difference to meters
    const metersPerDegreeLat = 111320;
    const metersPerDegreeLng = 111320 * Math.cos((heightmapCenterLat * Math.PI) / 180);
    
    // Calculate target location in lat/lng
    const targetLat = textureCenterLat + (offsetNorthMeters / metersPerDegreeLat);
    const targetLng = textureCenterLng + (offsetEastMeters / metersPerDegreeLng);
    
    // Calculate offset from heightmap center
    const latDiff = targetLat - heightmapCenterLat;
    const lngDiff = targetLng - heightmapCenterLng;
    
    const offsetNorth = latDiff * metersPerDegreeLat;
    const offsetEast = lngDiff * metersPerDegreeLng;
    
    // Convert to heightmap pixel coordinates
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = heightmapTexture.image.width || 1024;
    canvas.height = heightmapTexture.image.height || 1024;
    ctx.drawImage(heightmapTexture.image, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    const heightmapMetersPerPixel = heightmapCoverageMeters / canvas.width;
    const heightmapCenterX = canvas.width / 2;
    const heightmapCenterY = canvas.height / 2;
    const pixelX = Math.floor(heightmapCenterX + (offsetEast / heightmapMetersPerPixel));
    const pixelY = Math.floor(heightmapCenterY - (offsetNorth / heightmapMetersPerPixel));
    
    // Sample heightmap
    if (pixelX >= 0 && pixelX < canvas.width && pixelY >= 0 && pixelY < canvas.height) {
      const pixelIndex = (pixelY * canvas.width + pixelX) * 4;
      const gray = (data[pixelIndex] + data[pixelIndex + 1] + data[pixelIndex + 2]) / 3;
      const normalizedHeight = gray / 255;
      const seaLevelThreshold = 0.25;
      const adjustedHeight = (normalizedHeight - seaLevelThreshold) / (1 - seaLevelThreshold);
      const heightScale = 5.0; // Matching MountainRoadLandscape
      const height = adjustedHeight * heightScale;
      setTerrainHeight(height);
    } else {
      setTerrainHeight(0); // Default to sea level
    }
  }, [heightmapTexture, offsetNorthMeters, offsetEastMeters]);
  
  // Use terrain height for beam base position
  const sceneY = terrainHeight;
  
  // Debug: log the position
  console.log('LocationBeam position:', {
    sceneX: sceneX.toFixed(4),
    sceneY: sceneY.toFixed(4),
    sceneZ: sceneZ.toFixed(4),
    offsetNorthMeters: offsetNorthMeters,
    sceneScale: sceneScale
  });
  
  // Beam properties - make it thin
  beamHeight = 50; // Height of the beam in scene units
  beamRadius = 0.03; // Thin beam (1/10th of previous 0.3)
  const segments = 32; // Number of segments for smooth cylinder
  
  // Create geometry
  const geometry = useMemo(() => {
    return new CylinderGeometry(beamRadius, beamRadius, beamHeight, segments);
  }, [beamRadius, beamHeight, segments]);
  
  // Create shader material with gradient fade
  const material = useMemo(() => {
    const halfHeight = beamHeight / 2.0;
    return new ShaderMaterial({
      uniforms: {
        color: { value: new THREE.Color(0x00ffff) }, // Cyan blue
        halfHeight: { value: halfHeight }, // Half height for shader calculation
      },
      vertexShader: `
        varying vec3 vPosition;
        void main() {
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        uniform float halfHeight;
        varying vec3 vPosition;
        
        void main() {
          // Calculate normalized Y position (0 at bottom, 1 at top)
          // Cylinder is centered at origin, so Y ranges from -halfHeight to +halfHeight
          float normalizedY = (vPosition.y + halfHeight) / (halfHeight * 2.0);
          
          // Create gradient: 50% at bottom, 100% in middle, fade at top
          // Use smooth curves for transitions
          float opacity;
          if (normalizedY < 0.5) {
            // Bottom half: fade from 0.5 to 1.0
            float t = normalizedY * 2.0; // 0 to 1 in bottom half
            opacity = mix(0.5, 1.0, smoothstep(0.0, 1.0, t));
          } else {
            // Top half: fade from 1.0 to 0.0, with faster fade at very top
            float t = (normalizedY - 0.5) * 2.0; // 0 to 1 in top half
            // Use smoothstep for smooth fade, with more fade at the end
            float fadeStart = 0.7; // Start fading more aggressively after 70% of top half
            if (t < fadeStart) {
              opacity = 1.0;
            } else {
              float fadeT = (t - fadeStart) / (1.0 - fadeStart);
              opacity = 1.0 - smoothstep(0.0, 1.0, fadeT);
            }
          }
          
          gl_FragColor = vec4(color, opacity);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false, // Allow objects behind to show through
    });
  }, [beamHeight]);
  
  // Position beam so bottom is at terrain height
  // Cylinder is centered, so we need to offset by half height
  const beamY = sceneY + beamHeight / 2;
  
  // Update exported beam position for collision detection
  beamPosition.set(sceneX, beamY, sceneZ);
  
  return (
    <mesh
      geometry={geometry}
      material={material}
      position={[sceneX, beamY, sceneZ]}
    />
  );
}
