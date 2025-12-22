import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { sampleTerrainHeight } from './terrainHeightSampler';

export function AnimatedTile({
  terrainGroupRef,
  tilePosition = [0, 0, 0], // X, Z position in scene coordinates
  squareSize = 0.2, // Size of the animated square
}) {
  const squareRef = useRef();
  
  // Sample terrain height at this position
  const terrainHeight = sampleTerrainHeight(tilePosition[0], tilePosition[2]);
  
  // Animate the square with pulsating blue light
  useFrame((state) => {
    if (squareRef.current) {
      // Pulse animation for blue light
      const pulse = Math.sin(state.clock.elapsedTime * 2.5) * 0.5 + 0.5;
      const intensity = 0.4 + pulse * 0.6; // Pulse from 0.4 to 1.0
      
      // Update material emissive and opacity
      if (squareRef.current.material) {
        squareRef.current.material.emissive.setRGB(0, 0.3 + pulse * 0.7, 1);
        squareRef.current.material.emissiveIntensity = intensity * 2;
        squareRef.current.material.opacity = 0.5 + pulse * 0.5;
      }
      
      // Position square at tile position, slightly above terrain
      squareRef.current.position.set(tilePosition[0], terrainHeight + 0.01, tilePosition[2]);
    }
  });

  return (
    <mesh
      ref={squareRef}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <planeGeometry args={[squareSize, squareSize]} />
      <meshStandardMaterial
        color="#0066ff"
        emissive="#0066ff"
        transparent
        opacity={0.7}
        side={2} // DoubleSide
        emissiveIntensity={1.5}
      />
    </mesh>
  );
}

