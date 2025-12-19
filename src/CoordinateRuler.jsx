import React, { useMemo } from 'react';
import { Text } from '@react-three/drei';
import { sampleTerrainHeight } from './terrainHeightSampler';

// Origin marker component
function OriginMarker({ centerX, centerZ, showLabels }) {
  const terrainHeight = sampleTerrainHeight(centerX, centerZ);
  const y = terrainHeight; // Match terrain plane height
  
  return (
    <group position={[centerX, y, centerZ]}>
      <mesh>
        <cylinderGeometry args={[0.05, 0.05, 0.3, 16]} />
        <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={0.5} />
      </mesh>
      {showLabels && (
        <Text
          position={[0, 0.5, 0]}
          fontSize={0.2}
          color="#ff0000"
          anchorX="center"
          anchorY="middle"
        >
          Origin (0, 0)
        </Text>
      )}
    </group>
  );
}

// Individual marker component
function Marker({ position, label, tiles, axis, showLabels }) {
  return (
    <group position={position}>
      {/* Marker pole */}
      <mesh>
        <cylinderGeometry args={[0.02, 0.02, 0.2, 8]} />
        <meshStandardMaterial 
          color={axis === 'x' ? "#00ff00" : "#0000ff"} 
          emissive={axis === 'x' ? "#00ff00" : "#0000ff"} 
          emissiveIntensity={0.4} 
        />
      </mesh>
      
      {/* Label */}
      {showLabels && (
        <>
          <Text
            position={[0, 0.3, 0]}
            fontSize={0.15}
            color={axis === 'x' ? "#00ff00" : "#0000ff"}
            anchorX="center"
            anchorY="middle"
          >
            {label}
          </Text>
          {tiles !== 0 && (
            <Text
              position={[0, 0.15, 0]}
              fontSize={0.1}
              color="#ffffff"
              anchorX="center"
              anchorY="middle"
            >
              {`${tiles > 0 ? '+' : ''}${tiles}t`}
            </Text>
          )}
        </>
      )}
    </group>
  );
}

// Coordinate ruler with markers to visualize the coordinate system
export function CoordinateRuler({ 
  centerX = 0, 
  centerZ = 0, 
  range = 20, // Range in scene units (e.g., 20 units = ~2000 meters)
  markerSpacing = 1, // Spacing between markers in scene units
  showLabels = true 
}) {
  const sceneScale = 0.01;
  const tileSizeMeters = 11.48;
  const tileSizeScene = tileSizeMeters * sceneScale; // ~0.1148 units per tile
  
  // Create markers along X and Z axes
  const markers = useMemo(() => {
    const markerArray = [];
    const numMarkers = Math.floor(range / markerSpacing);
    
    // X-axis markers (East-West)
    for (let i = -numMarkers; i <= numMarkers; i++) {
      const x = centerX + i * markerSpacing;
      const z = centerZ;
      const tilesFromCenter = i * markerSpacing / tileSizeScene;
      
      markerArray.push({
        position: [x, 0, z],
        label: `${i}`,
        tiles: Math.round(tilesFromCenter),
        axis: 'x'
      });
    }
    
    // Z-axis markers (North-South)
    for (let i = -numMarkers; i <= numMarkers; i++) {
      if (i === 0) continue; // Skip center (already added in X-axis)
      const x = centerX;
      const z = centerZ + i * markerSpacing;
      const tilesFromCenter = i * markerSpacing / tileSizeScene;
      
      markerArray.push({
        position: [x, 0, z],
        label: `${i}`,
        tiles: Math.round(tilesFromCenter),
        axis: 'z'
      });
    }
    
    return markerArray;
  }, [centerX, centerZ, range, markerSpacing, tileSizeScene]);
  
  return (
    <group>
      {/* Center marker (origin) */}
      <OriginMarker centerX={centerX} centerZ={centerZ} showLabels={showLabels} />
      
      {/* X-axis line (East-West, green) - positioned at terrain height */}
      {(() => {
        const terrainHeight = sampleTerrainHeight(centerX, centerZ);
        return (
          <mesh position={[centerX, terrainHeight + 0.01, centerZ]}>
            <boxGeometry args={[range * 2, 0.01, 0.01]} />
            <meshStandardMaterial color="#00ff00" emissive="#00ff00" emissiveIntensity={0.3} />
          </mesh>
        );
      })()}
      
      {/* Z-axis line (North-South, blue) - positioned at terrain height */}
      {(() => {
        const terrainHeight = sampleTerrainHeight(centerX, centerZ);
        return (
          <mesh position={[centerX, terrainHeight + 0.01, centerZ]} rotation={[0, Math.PI / 2, 0]}>
            <boxGeometry args={[range * 2, 0.01, 0.01]} />
            <meshStandardMaterial color="#0000ff" emissive="#0000ff" emissiveIntensity={0.3} />
          </mesh>
        );
      })()}
      
      {/* Markers */}
      {markers.map((marker, index) => {
        // Sample terrain height for this marker position
        const terrainHeight = sampleTerrainHeight(marker.position[0], marker.position[2]);
        const y = terrainHeight; // Match terrain plane height
        
        return (
          <Marker
            key={`${marker.axis}-${index}`}
            position={[marker.position[0], y, marker.position[2]]}
            label={marker.label}
            tiles={marker.tiles}
            axis={marker.axis}
            showLabels={showLabels}
          />
        );
      })}
      
      {/* Grid lines for better visualization - positioned at terrain height */}
      {Array.from({ length: Math.floor(range / markerSpacing) * 2 + 1 }).map((_, i) => {
        const offset = (i - Math.floor(range / markerSpacing)) * markerSpacing;
        const gridX = centerX + offset;
        const gridZ = centerZ + offset;
        const gridHeightX = sampleTerrainHeight(gridX, centerZ);
        const gridHeightZ = sampleTerrainHeight(centerX, gridZ);
        
        return (
          <group key={`grid-${i}`}>
            {/* X-axis grid lines (parallel to Z) */}
            <mesh position={[gridX, gridHeightX + 0.01, centerZ]}>
              <boxGeometry args={[0.005, 0.01, range * 2]} />
              <meshStandardMaterial color="#ffffff" opacity={0.15} transparent />
            </mesh>
            {/* Z-axis grid lines (parallel to X) */}
            <mesh position={[centerX, gridHeightZ + 0.01, gridZ]}>
              <boxGeometry args={[range * 2, 0.01, 0.005]} />
              <meshStandardMaterial color="#ffffff" opacity={0.15} transparent />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
