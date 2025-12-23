import React, { useMemo, useEffect, useState } from 'react';
import { CylinderGeometry, ShaderMaterial } from 'three';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { Vector3 } from 'three';
import { latLngToTile, tileToLatLngCenter, metersPerTile } from './utils/tileCoordinates';

// Export beam position for collision detection
export let beamPosition = new Vector3();
export let beamRadius = 0.05; // Beam radius (half of 0.1)
export let beamHeight = 50;

export function LocationBeam() {
  // Position beam at origin [0, 0, 0] - correct position
  const sceneX = 0;
  const sceneZ = 0;
  const sceneY = 0;
  
  // Heightmap removed - using flat terrain
  const [terrainHeight, setTerrainHeight] = useState(0);
  
  // Calculate terrain height at beam position
  useEffect(() => {
    // Use flat terrain (heightmap removed)
    setTerrainHeight(0);
  }, [sceneX, sceneZ]);
  
  // Use terrain height for beam base position
  const finalSceneY = terrainHeight;
  
  // Position calculated (removed verbose logging)
  
  // Beam properties - make it visible
  beamHeight = 50; // Height of the beam in scene units
  beamRadius = 0.05; // Half the previous size (0.1 / 2 = 0.05)
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
        color: { value: new THREE.Color(0x00ffff) }, // Cyan blue - bright cyan
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
          
          // Create gradient: brighter at bottom, full brightness in middle, fade at top
          // Use smooth curves for transitions
          float opacity;
          if (normalizedY < 0.3) {
            // Bottom 30%: fade from 0.8 to 1.0 for better visibility
            float t = normalizedY / 0.3; // 0 to 1 in bottom 30%
            opacity = mix(0.8, 1.0, smoothstep(0.0, 1.0, t));
          } else if (normalizedY < 0.7) {
            // Middle 40%: full opacity
            opacity = 1.0;
          } else {
            // Top 30%: fade from 1.0 to 0.0
            float t = (normalizedY - 0.7) / 0.3; // 0 to 1 in top 30%
            opacity = 1.0 - smoothstep(0.0, 1.0, t);
          }
          
          // Make color much brighter and more visible
          vec3 brightColor = color * 3.0; // Increase brightness significantly
          gl_FragColor = vec4(brightColor, opacity);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false, // Allow objects behind to show through
      depthTest: true, // Enable depth testing for proper rendering
    });
  }, [beamHeight]);
  
  // Position beam so bottom is at terrain height
  // Cylinder is centered, so we need to offset by half height
  const beamY = finalSceneY + beamHeight / 2;
  
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
