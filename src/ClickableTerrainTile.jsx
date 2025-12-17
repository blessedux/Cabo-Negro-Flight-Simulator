import React, { useState, useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { Raycaster, Vector3 } from 'three';
import { setCameraTarget } from './CameraAnimator';
import { sampleTerrainHeight } from './terrainHeightSampler';

export function ClickableTerrainTile({
  terrainGroupRef,
  tilePosition = [0, 0, 0], // X, Z position in scene coordinates
  cameraTarget,
  title = 'Placeholder Title',
  paragraph = 'Placeholder paragraph text goes here.',
  ctaText = 'Learn More',
  ctaUrl = '#',
  tagText = 'Click Me',
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const [tileMesh, setTileMesh] = useState(null);
  const [tagPosition, setTagPosition] = useState(new Vector3());
  const tagRef = useRef();
  const { scene, camera } = useThree();
  const raycaster = useRef(new Raycaster());
  
  // Find the terrain mesh at the specified position
  useEffect(() => {
    if (!terrainGroupRef?.current) return;
    
    // Sample terrain height at this position
    const terrainHeight = sampleTerrainHeight(tilePosition[0], tilePosition[2]);
    const worldY = terrainHeight;
    
    // Find the closest mesh to this position
    const targetPos = new Vector3(tilePosition[0], worldY, tilePosition[2]);
    let closestMesh = null;
    let closestDistance = Infinity;
    
    terrainGroupRef.current.traverse((child) => {
      if (child.isMesh && child.geometry) {
        // Get mesh world position
        child.updateMatrixWorld();
        const meshWorldPos = new Vector3();
        child.getWorldPosition(meshWorldPos);
        
        // Calculate distance in XZ plane (ignore Y)
        const dx = meshWorldPos.x - targetPos.x;
        const dz = meshWorldPos.z - targetPos.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        
        // Check if this mesh contains the point (rough check)
        child.geometry.computeBoundingBox();
        const bbox = child.geometry.boundingBox;
        const localPos = new Vector3();
        child.worldToLocal(localPos.copy(targetPos));
        
        if (bbox.containsPoint(localPos) || distance < 2) {
          if (distance < closestDistance) {
            closestDistance = distance;
            closestMesh = child;
          }
        }
      }
    });
    
    if (closestMesh) {
      setTileMesh(closestMesh);
      // Get the actual world position of the mesh surface
      const meshPos = new Vector3();
      closestMesh.getWorldPosition(meshPos);
      
      // Use raycaster to find exact surface point
      raycaster.current.set(
        new Vector3(tilePosition[0], 100, tilePosition[2]),
        new Vector3(0, -1, 0)
      );
      const intersects = raycaster.current.intersectObject(closestMesh, true);
      
      if (intersects.length > 0) {
        const surfacePoint = intersects[0].point;
        setTagPosition(surfacePoint);
      } else {
        // Fallback to mesh position + terrain height
        setTagPosition(new Vector3(tilePosition[0], worldY, tilePosition[2]));
      }
      
      // Add click handlers to the mesh
      const originalOnClick = closestMesh.onClick;
      const originalOnPointerOver = closestMesh.onPointerOver;
      const originalOnPointerOut = closestMesh.onPointerOut;
      
      closestMesh.onClick = (e) => {
        e.stopPropagation();
        if (cameraTarget) {
          setIsClicked(true);
          setCameraTarget(cameraTarget.position, cameraTarget.rotation);
        }
        if (originalOnClick) originalOnClick(e);
      };
      
      closestMesh.onPointerOver = (e) => {
        e.stopPropagation();
        setIsHovered(true);
        document.body.style.cursor = 'pointer';
        if (originalOnPointerOver) originalOnPointerOver(e);
      };
      
      closestMesh.onPointerOut = (e) => {
        e.stopPropagation();
        setIsHovered(false);
        document.body.style.cursor = '';
        if (originalOnPointerOut) originalOnPointerOut(e);
      };
      
      // Cleanup
      return () => {
        if (closestMesh) {
          closestMesh.onClick = originalOnClick;
          closestMesh.onPointerOver = originalOnPointerOver;
          closestMesh.onPointerOut = originalOnPointerOut;
        }
      };
    }
  }, [terrainGroupRef, tilePosition, cameraTarget]);
  
  // Animate tag floating
  useFrame((state) => {
    if (tagRef.current && tagPosition) {
      tagRef.current.position.copy(tagPosition);
      tagRef.current.position.y += 0.5 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
    }
  });
  
  const handleClose = () => {
    setIsClicked(false);
  };
  
  const handleCTAClick = (e) => {
    e.stopPropagation();
    if (ctaUrl && ctaUrl !== '#') {
      window.open(ctaUrl, '_blank');
    }
  };
  
  // Animated highlight ring around the tile
  const highlightRef = useRef();
  
  // Animate the highlight
  useFrame((state) => {
    if (highlightRef.current && tileMesh) {
      // Pulse animation - more dramatic
      const pulse = Math.sin(state.clock.elapsedTime * 2.5) * 0.5 + 0.5;
      const scale = 1 + pulse * 0.3; // Scale from 1.0 to 1.3
      highlightRef.current.scale.set(scale, scale, 1);
      highlightRef.current.material.opacity = 0.4 + pulse * 0.5;
      highlightRef.current.material.emissive.setRGB(0, 0.4 + pulse * 0.6, 1);
      
      // Position highlight at tile position
      if (tagPosition) {
        highlightRef.current.position.set(tagPosition.x, tagPosition.y + 0.01, tagPosition.z);
      }
    }
  });
  
  if (!tileMesh || !tagPosition) {
    return null; // Wait for mesh to be found
  }
  
  return (
    <>
      {/* Animated blue highlight ring */}
      <mesh ref={highlightRef} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2, 2.8, 64]} />
        <meshStandardMaterial
          color="#0066ff"
          emissive="#0066ff"
          transparent
          opacity={0.6}
          side={2} // DoubleSide
          emissiveIntensity={2}
        />
      </mesh>
      
      {/* Floating tag above the tile */}
      <mesh ref={tagRef}>
        <Html
          center
          style={{
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          <div
            style={{
              background: isHovered ? 'rgba(100, 150, 255, 0.9)' : 'rgba(255, 255, 255, 0.8)',
              color: isHovered ? 'white' : '#333',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 'bold',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
            }}
          >
            {tagText}
          </div>
        </Html>
      </mesh>
      
      {/* Content overlay when clicked */}
      {isClicked && (
        <Html
          center
          style={{
            width: '100%',
            height: '100%',
            pointerEvents: 'auto',
          }}
        >
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'rgba(0, 0, 0, 0.85)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 10000,
              backdropFilter: 'blur(5px)',
            }}
            onClick={handleClose}
          >
            <div
              style={{
                background: 'rgba(20, 20, 30, 0.95)',
                padding: '40px',
                borderRadius: '15px',
                border: '2px solid rgba(255, 255, 255, 0.1)',
                maxWidth: '600px',
                width: '90%',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
                pointerEvents: 'auto',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2
                style={{
                  color: '#fff',
                  marginTop: 0,
                  marginBottom: '20px',
                  fontSize: '28px',
                  fontWeight: 'bold',
                }}
              >
                {title}
              </h2>
              <p
                style={{
                  color: '#ccc',
                  marginBottom: '30px',
                  fontSize: '16px',
                  lineHeight: '1.6',
                }}
              >
                {paragraph}
              </p>
              <div
                style={{
                  display: 'flex',
                  gap: '15px',
                  justifyContent: 'flex-end',
                }}
              >
                <button
                  onClick={handleClose}
                  style={{
                    padding: '12px 24px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                  }}
                >
                  Continue Exploring
                </button>
                <button
                  onClick={handleCTAClick}
                  style={{
                    padding: '12px 24px',
                    background: 'rgba(100, 150, 255, 0.8)',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(100, 150, 255, 1)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(100, 150, 255, 0.8)';
                  }}
                >
                  {ctaText}
                </button>
              </div>
            </div>
          </div>
        </Html>
      )}
    </>
  );
}
