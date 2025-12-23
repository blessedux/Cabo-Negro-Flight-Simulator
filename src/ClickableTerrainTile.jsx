import React, { useState, useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Raycaster, Vector3, Matrix4, Quaternion, Euler } from 'three';
import * as THREE from 'three';
import { setCameraTarget } from './CameraAnimator';
import { sampleTerrainHeight } from './terrainHeightSampler';
import { setOrbitPaused } from './controls';
import { setTileModalOpen } from './TileModal';

export function ClickableTerrainTile({
  terrainGroupRef,
  tilePosition = [0, 0, 0], // X, Z position in scene coordinates
  cameraTarget,
  title = 'Placeholder Title',
  paragraph = 'Placeholder paragraph text goes here.',
  ctaText = 'Learn More',
  ctaUrl = '#',
  tagText = 'Click Me',
  squareSize = 0.2, // Size of the clickable square (default 0.2)
  imageUrl = null, // Optional image URL to display in modal
  imageLink = null, // Optional link URL when image is clicked
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const [tileMesh, setTileMesh] = useState(null);
  const [tagPosition, setTagPosition] = useState(new Vector3());
  const squareRef = useRef();
  const raycasterRef = useRef(new Raycaster());
  const { scene, camera } = useThree();
  
  // Find the terrain mesh at the specified position
  useEffect(() => {
    if (!terrainGroupRef?.current) return;
    
    // Flip X coordinate to match flipped terrain (terrain is scaled [-1, 1, 1])
    const flippedX = -tilePosition[0];
    
    // Sample terrain height at this position
    const terrainHeight = sampleTerrainHeight(flippedX, tilePosition[2]);
    const worldY = terrainHeight;
    
    // Find the closest mesh to this position
    const targetPos = new Vector3(flippedX, worldY, tilePosition[2]);
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
      raycasterRef.current.set(
        new Vector3(flippedX, 100, tilePosition[2]),
        new Vector3(0, -1, 0)
      );
      const intersects = raycasterRef.current.intersectObject(closestMesh, true);
      
      if (intersects.length > 0) {
        const surfacePoint = intersects[0].point;
        setTagPosition(surfacePoint);
      } else {
        // Fallback to mesh position + terrain height
        setTagPosition(new Vector3(flippedX, worldY, tilePosition[2]));
      }
      
      // Note: Click handlers will be on the square mesh, not the terrain mesh
    }
  }, [terrainGroupRef, tilePosition, cameraTarget]);
  

  // Handle square click
  const handleSquareClick = (e) => {
    e.stopPropagation();
    if (cameraTarget) {
      setIsClicked(true);
      setOrbitPaused(true); // Stop orbit animation when tile is clicked
      
      // Use tile position as lookAtTarget for straight-line camera movement
      const lookAtPos = tagPosition ? [tagPosition.x, tagPosition.y, tagPosition.z] : null;
      
      // Calculate final rotation using lookAt method to ensure smooth transition
      // This prevents any rotation jump when animation completes
      let finalRotation = cameraTarget.rotation;
      if (lookAtPos) {
        const tempCamPos = new Vector3(...cameraTarget.position);
        const tempLookAtPos = new Vector3(...lookAtPos);
        const tempLookAtMatrix = new Matrix4();
        tempLookAtMatrix.lookAt(tempCamPos, tempLookAtPos, new Vector3(0, 1, 0));
        const tempQuat = new Quaternion().setFromRotationMatrix(tempLookAtMatrix);
        const tempEuler = new Euler().setFromQuaternion(tempQuat, 'YXZ');
        
        finalRotation = {
          pitch: tempEuler.x,
          yaw: tempEuler.y,
          roll: tempEuler.z
        };
      }
      
      setCameraTarget(
        cameraTarget.position, 
        finalRotation,
        1500, // Default duration
        lookAtPos // Look at the tile during movement
      );
      
      // Open modal outside Canvas
      setTileModalOpen(true, {
        title,
        paragraph,
        ctaText,
        ctaUrl,
        imageUrl,
        imageLink,
      });
    }
  };

  // Handle square hover
  const handleSquarePointerOver = (e) => {
    e.stopPropagation();
    setIsHovered(true);
    document.body.style.cursor = 'pointer';
  };

  const handleSquarePointerOut = (e) => {
    e.stopPropagation();
    setIsHovered(false);
    document.body.style.cursor = '';
  };
  
  const handleClose = () => {
    setIsClicked(false);
    setOrbitPaused(false); // Resume orbit animation when popup is closed
    setTileModalOpen(false); // Close modal
  };
  
  // Listen for modal close events
  useEffect(() => {
    const handleModalClose = () => {
      setIsClicked(false);
      setOrbitPaused(false);
    };
    
    // Subscribe to modal close (we'll use a custom event for simplicity)
    const handleCustomClose = () => handleModalClose();
    window.addEventListener('tileModalClosed', handleCustomClose);
    
    return () => {
      window.removeEventListener('tileModalClosed', handleCustomClose);
    };
  }, []);
  
  const handleCTAClick = (e) => {
    e.stopPropagation();
    if (ctaUrl && ctaUrl !== '#') {
      window.open(ctaUrl, '_blank');
    }
  };
  
  // Animate the square with pulsating blue light
  useFrame((state) => {
    if (squareRef.current && tagPosition) {
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
      squareRef.current.position.set(tagPosition.x, tagPosition.y + 0.01, tagPosition.z);
    }
  });
  
  if (!tileMesh || !tagPosition) {
    return null; // Wait for mesh to be found
  }
  
  // Square size is now passed as a prop (default 0.2)

  return (
    <>
      {/* Clickable square with pulsating blue light animation */}
      <mesh
        ref={squareRef}
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={handleSquareClick}
        onPointerOver={handleSquarePointerOver}
        onPointerOut={handleSquarePointerOut}
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
    </>
  );
}
