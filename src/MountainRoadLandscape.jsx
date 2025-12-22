import React, { useEffect, useMemo, useRef, useState, forwardRef } from "react";
import { useGLTF, useTexture } from "@react-three/drei";
import { Color, MeshStandardMaterial, RepeatWrapping, ClampToEdgeWrapping, PlaneGeometry, TextureLoader } from "three";
import { getHeightExaggeration } from "./terrainHeightUtils";
import { MODELS, TEXTURES } from "./config/assets";

export const MountainRoadLandscape = forwardRef(function MountainRoadLandscape({ textureRotation = 0, ...props }, ref) {
  const groupRef = useRef();
  const meshRefs = useRef([]);
  const [heightExaggeration, setHeightExaggeration] = useState(getHeightExaggeration());
  const [highResTexture, setHighResTexture] = useState(null);
  
  // Load the GLB model
  const { scene } = useGLTF(MODELS.terrainTiles);
  
  // Load low-res texture first (fast initial load)
  const terrainTexture = useTexture(TEXTURES.terrainTextureLow);
  
  // Progressive loading: Load high-res texture in background if available
  useEffect(() => {
    // Only load high-res if it's different from low-res (i.e., R2 is configured)
    if (TEXTURES.terrainTexture !== TEXTURES.terrainTextureLow) {
      const loader = new TextureLoader();
      loader.load(
        TEXTURES.terrainTexture,
        (texture) => {
          console.log("✓ High-resolution texture loaded:", {
            size: `${texture.image?.width || 'unknown'}×${texture.image?.height || 'unknown'}`,
            url: TEXTURES.terrainTexture
          });
          // Configure high-res texture same way as low-res
          texture.wrapS = ClampToEdgeWrapping;
          texture.wrapT = ClampToEdgeWrapping;
          texture.repeat.set(1, 1);
          texture.flipY = false;
          texture.rotation = terrainTexture?.rotation || 0;
          setHighResTexture(texture);
        },
        undefined,
        (error) => {
          console.warn("Failed to load high-resolution texture, using low-res:", error);
        }
      );
    }
  }, []);
  
  // Listen for height exaggeration changes
  useEffect(() => {
    const handleExaggerationChange = (event) => {
      setHeightExaggeration(event.detail.multiplier);
    };
    
    window.addEventListener('heightExaggerationChanged', handleExaggerationChange);
    return () => {
      window.removeEventListener('heightExaggerationChanged', handleExaggerationChange);
    };
  }, []);
  
  // Use high-res texture if available, otherwise use low-res
  const activeTexture = highResTexture || terrainTexture;
  
  // Configure textures
  useEffect(() => {
    if (terrainTexture) {
      // Use ClampToEdgeWrapping to prevent visible tiling/seams/grid
      // This ensures the texture is used exactly once without repeating
      terrainTexture.wrapS = ClampToEdgeWrapping;
      terrainTexture.wrapT = ClampToEdgeWrapping;
      // Texture is 2048×2048 and represents 301×301 tiles covering 3.45 km × 3.45 km
      // Set repeat to 1,1 to use the texture exactly once (no tiling)
      terrainTexture.repeat.set(1, 1);
      terrainTexture.flipY = false;
      console.log("✓ Terrain texture configured:", {
        size: `${terrainTexture.image?.width || 'unknown'}×${terrainTexture.image?.height || 'unknown'}`,
        coverage: "3.45 km × 3.45 km",
        tiles: "301×301 (90,601 total)",
        wrapping: "ClampToEdge (no tiling)",
        repeat: terrainTexture.repeat,
        quality: "low-res (fast load)"
      });
    }
    
    if (highResTexture) {
      console.log("✓ Switched to high-resolution texture");
    }
  }, [terrainTexture, highResTexture]);
  
  // Update texture rotation when it changes
  useEffect(() => {
    const texture = activeTexture;
    if (texture) {
      texture.rotation = textureRotation;
      texture.needsUpdate = true;
      
      // Update all stored mesh materials
      meshRefs.current.forEach((mesh) => {
        if (mesh && mesh.material) {
          const material = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
          if (material && material.map) {
            // Update if using either texture
            if (material.map === terrainTexture || material.map === highResTexture) {
              material.map = texture;
              material.needsUpdate = true;
            }
          }
        }
      });
      
      console.log(`Texture rotation updated to ${(textureRotation * 180 / Math.PI).toFixed(1)}°`);
    }
  }, [textureRotation, activeTexture, terrainTexture, highResTexture]);
  
  // Create processed scene with texture
  const processedScene = useMemo(() => {
    if (!scene || !activeTexture) {
      console.log("Waiting for assets to load...", {
        scene: !!scene,
        texture: !!activeTexture
      });
      return null;
    }
    
    console.log("=== STARTING TERRAIN PROCESSING ===");
    
    // Clone the scene to avoid mutating the original
    const clonedScene = scene.clone();
    
    console.log(`Using terrain from GLB model`);
    
    // Terrain settings based on documentation
    // Texture: 2048×2048 pixels covering ~3.45 km × 3.45 km
    // Heightmap: 1024×1024 pixels covering 80 km × 80 km
    // GLB: Normalized -1 to 1, needs scaling to match texture coverage
    
    // Scale terrain based on documentation
    // Texture: 2048×2048 pixels covering 3.45 km × 3.45 km (301×301 tiles)
    // Each tile at zoom 13: ~11.48 meters
    // Total: 301 tiles × 11.48m = 3,455 meters (3.455 km)
    const textureCoverageMeters = 3455; // 3.455 km (301 tiles × 11.48m per tile)
    
    // Scale to scene units - make terrain visible but realistic
    // Camera is at [0, 8, 8], so terrain should be visible but not too large
    const sceneScale = 0.01; // 3455m * 0.01 = 34.55 units
    const terrainSize = textureCoverageMeters * sceneScale; // 34.55 units
    
    console.log("=== TERRAIN SCALING ===");
    console.log(`Real world coverage: ${textureCoverageMeters}m (${(textureCoverageMeters/1000).toFixed(3)} km)`);
    console.log(`Scene terrain size: ${terrainSize.toFixed(2)} units`);
    console.log(`Texture: 2048×2048 pixels = 301×301 tiles`);
    console.log(`Each tile: ~11.48 meters`);
    
    // Use terrain as-is from GLB model
    const segments = 512;
    
    // Clear previous mesh refs
    meshRefs.current = [];
    
    // Find and process terrain meshes
    let meshCount = 0;
    clonedScene.traverse((child) => {
      if (child.isMesh && child.geometry) {
        meshCount++;
        console.log(`Found mesh "${child.name || 'unnamed'}":`, {
          vertexCount: child.geometry.attributes.position.count,
          position: child.position,
          rotation: child.rotation,
          scale: child.scale
        });
        
        // Get original bounding box
        child.geometry.computeBoundingBox();
        const originalBbox = child.geometry.boundingBox;
        const originalWidth = originalBbox.max.x - originalBbox.min.x;
        const originalDepth = originalBbox.max.z - originalBbox.min.z;
        
        console.log(`Original mesh size: ${originalWidth.toFixed(2)} x ${originalDepth.toFixed(2)}`);
        
        // Create a new horizontal plane geometry
        // PlaneGeometry creates a plane in XY plane, we need XZ (horizontal)
        const geometry = new PlaneGeometry(terrainSize, terrainSize, segments, segments);
        
        // Rotate to make it horizontal (XZ plane instead of XY)
        geometry.rotateX(-Math.PI / 2);
        
        // Center at origin
        geometry.translate(0, 0, 0);
        
        // Ensure UV coordinates map exactly 0-1 (no tiling)
        // PlaneGeometry already creates proper UVs, which map 0-1 perfectly for our single texture
        // Note: We don't log UV ranges here to avoid stack overflow with large vertex counts
        
        console.log(`Created ${segments}x${segments} horizontal plane at origin, size: ${terrainSize}x${terrainSize}`);
        
        // Modify vertex positions based on heightmap
        const positions = geometry.attributes.position;
        const uvs = geometry.attributes.uv;
        const positionArray = positions.array;
        const vertexCount = positions.count;
        
        console.log(`Processing ${vertexCount} vertices from GLB model...`);
        
        // Use terrain geometry as-is from GLB model (no heightmap modification)
        // Just flip U coordinate for texture orientation
        for (let i = 0; i < uvs.count; i++) {
          uvs.array[i * 2] = 1 - uvs.array[i * 2]; // Flip U coordinate
        }
        
        // Update geometry
        positions.needsUpdate = true;
        uvs.needsUpdate = true; // Mark UVs as updated after flipping
        geometry.computeVertexNormals();
        geometry.computeBoundingBox();
        geometry.computeBoundingSphere();
        
        // Log final bounding box
        geometry.computeBoundingBox();
        const finalBbox = geometry.boundingBox;
        console.log(`Final terrain bounds:`, {
          min: `(${finalBbox.min.x.toFixed(2)}, ${finalBbox.min.y.toFixed(2)}, ${finalBbox.min.z.toFixed(2)})`,
          max: `(${finalBbox.max.x.toFixed(2)}, ${finalBbox.max.y.toFixed(2)}, ${finalBbox.max.z.toFixed(2)})`,
          size: `(${(finalBbox.max.x - finalBbox.min.x).toFixed(2)}, ${(finalBbox.max.y - finalBbox.min.y).toFixed(2)}, ${(finalBbox.max.z - finalBbox.min.z).toFixed(2)})`
        });
        
        // Replace the geometry
        child.geometry = geometry;
        
        // Reset transform to ensure proper positioning
        child.position.set(0, 0, 0);
        child.rotation.set(0, 0, 0);
        child.scale.set(1, 1, 1);
        
        // Apply terrain texture to material
        // Set texture rotation before creating material
        if (activeTexture) {
          activeTexture.rotation = textureRotation;
        }
        
        child.material = new MeshStandardMaterial({
          map: activeTexture,
          color: 0xffffff,
          roughness: 0.7, // Slightly less rough for better texture visibility
          metalness: 0.05, // Lower metalness for more natural terrain
          side: 2, // DoubleSide to ensure visibility
          flatShading: false, // Smooth shading for better appearance
        });
        
        // Verify texture settings
        console.log(`Material texture settings:`, {
          wrapS: child.material.map.wrapS === ClampToEdgeWrapping ? 'ClampToEdge' : 'Repeat',
          wrapT: child.material.map.wrapT === ClampToEdgeWrapping ? 'ClampToEdge' : 'Repeat',
          repeat: `(${child.material.map.repeat.x}, ${child.material.map.repeat.y})`,
          rotation: `${(child.material.map.rotation * 180 / Math.PI).toFixed(1)}°`
        });
        
        // Enable shadows
        child.castShadow = true;
        child.receiveShadow = true;
        
        // Store reference to this mesh for rotation updates
        meshRefs.current.push(child);
        
        console.log(`✓ Processed terrain mesh "${child.name || 'unnamed'}"`);
      }
    });
    
    console.log(`=== TERRAIN PROCESSING COMPLETE (${meshCount} meshes) ===`);
    return clonedScene;
  }, [scene, activeTexture, textureRotation]);
  
  if (!processedScene) {
    return null; // Wait for everything to load
  }
  
  // No scaling - use the terrain size directly
  // Forward the ref to the group
  useEffect(() => {
    if (ref) {
      if (typeof ref === 'function') {
        ref(groupRef.current);
      } else {
        ref.current = groupRef.current;
      }
    }
  }, [ref, processedScene]);
  
  return (
    <group {...props} dispose={null} ref={groupRef}>
      <primitive object={processedScene} dispose={null} />
    </group>
  );
});

useGLTF.preload(MODELS.terrainTiles);
