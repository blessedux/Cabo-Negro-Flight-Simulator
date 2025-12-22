import React, { useEffect, useMemo, useRef, useState, forwardRef } from "react";
import { useGLTF, useTexture } from "@react-three/drei";
import { Color, MeshStandardMaterial, RepeatWrapping, ClampToEdgeWrapping, PlaneGeometry } from "three";
import { getHeightExaggeration } from "./terrainHeightUtils";

export const MountainRoadLandscape = forwardRef(function MountainRoadLandscape({ textureRotation = 0, ...props }, ref) {
  const groupRef = useRef();
  const meshRefs = useRef([]);
  const [heightExaggeration, setHeightExaggeration] = useState(getHeightExaggeration());
  
  // Load the GLB model
  const { scene } = useGLTF("assets/models/terrain-tiles.glb");
  
  // Load both textures
  const terrainTexture = useTexture("assets/textures/terrain-texture.png");
  const heightmapTexture = useTexture("assets/textures/punta-arenas-cabonegro-heightmap.png");
  
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
        repeat: terrainTexture.repeat
      });
    }
    
    if (heightmapTexture) {
      heightmapTexture.wrapS = RepeatWrapping;
      heightmapTexture.wrapT = RepeatWrapping;
      heightmapTexture.flipY = false;
      console.log("✓ Heightmap texture configured");
    }
  }, [terrainTexture, heightmapTexture]);
  
  // Update texture rotation when it changes
  useEffect(() => {
    if (terrainTexture) {
      terrainTexture.rotation = textureRotation;
      terrainTexture.needsUpdate = true;
      
      // Update all stored mesh materials
      meshRefs.current.forEach((mesh) => {
        if (mesh && mesh.material) {
          const material = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
          if (material && material.map === terrainTexture) {
            material.needsUpdate = true;
          }
        }
      });
      
      console.log(`Texture rotation updated to ${(textureRotation * 180 / Math.PI).toFixed(1)}°`);
    }
  }, [textureRotation, terrainTexture]);
  
  // Create processed scene with heightmap and texture
  const processedScene = useMemo(() => {
    if (!scene || !heightmapTexture || !terrainTexture) {
      console.log("Waiting for assets to load...", {
        scene: !!scene,
        heightmap: !!heightmapTexture,
        texture: !!terrainTexture
      });
      return null;
    }
    
    console.log("=== STARTING TERRAIN PROCESSING ===");
    
    // Clone the scene to avoid mutating the original
    const clonedScene = scene.clone();
    
    // Get heightmap image data (for elevation - real topography)
    const heightmapCanvas = document.createElement('canvas');
    const heightmapCtx = heightmapCanvas.getContext('2d');
    heightmapCanvas.width = heightmapTexture.image.width || 512;
    heightmapCanvas.height = heightmapTexture.image.height || 512;
    heightmapCtx.drawImage(heightmapTexture.image, 0, 0);
    const heightmapImageData = heightmapCtx.getImageData(0, 0, heightmapCanvas.width, heightmapCanvas.height);
    const heightmapData = heightmapImageData.data;
    
    console.log(`Heightmap loaded: ${heightmapCanvas.width}x${heightmapCanvas.height} pixels`);
    console.log(`Using real topography from heightmap`);
    
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
    
    // Heightmap settings
    const heightmapCoverageMeters = 80000; // 80 km
    const heightmapMetersPerPixel = heightmapCoverageMeters / heightmapCanvas.width; // ~78.125 m/pixel
    
    // Texture center: -52.871294° S, -70.861816° W (from documentation)
    // Heightmap center: -53.061222° S, -70.878388° W (from documentation)
    // Calculate offset from heightmap center to texture center
    const textureCenterLat = -52.871294;
    const textureCenterLng = -70.861816;
    const heightmapCenterLat = -53.061222;
    const heightmapCenterLng = -70.878388;
    
    // Convert lat/lng difference to meters (at latitude -53°)
    const metersPerDegreeLat = 111320; // Constant
    const metersPerDegreeLng = 111320 * Math.cos((heightmapCenterLat * Math.PI) / 180); // ~66,990 m at -53°
    
    const latDiff = textureCenterLat - heightmapCenterLat; // 0.19° (north)
    const lngDiff = textureCenterLng - heightmapCenterLng; // 0.016° (east)
    
    const offsetNorth = latDiff * metersPerDegreeLat; // ~21.1 km north
    const offsetEast = lngDiff * metersPerDegreeLng; // ~1.07 km east
    
    // Convert offset to heightmap pixel coordinates
    // Heightmap center is at (512, 512) in pixel space
    const heightmapCenterX = heightmapCanvas.width / 2;
    const heightmapCenterY = heightmapCanvas.height / 2;
    const textureCenterX = heightmapCenterX + (offsetEast / heightmapMetersPerPixel);
    const textureCenterY = heightmapCenterY - (offsetNorth / heightmapMetersPerPixel); // Negative because Y is flipped
    
    // Calculate the region of heightmap that corresponds to texture
    const textureSizeInHeightmapPixels = textureCoverageMeters / heightmapMetersPerPixel; // ~44 pixels
    
    // Height scale - make it visible!
    // The heightmap has 1500x exaggeration, but we need visible height in the scene
    const heightScale = 5.0; // Increased for visible height variation
    const segments = 512; // High resolution for detailed terrain (increased from 128)
    
    // Get current height exaggeration multiplier
    const exaggeration = heightExaggeration;
    
    // Check if texture region is within heightmap bounds
    const textureRegionValid = 
      textureCenterX >= 0 && textureCenterX < heightmapCanvas.width &&
      textureCenterY >= 0 && textureCenterY < heightmapCanvas.height &&
      textureSizeInHeightmapPixels > 0 && textureSizeInHeightmapPixels < heightmapCanvas.width;
    
    // If region is invalid, use center of heightmap as fallback
    const useAlignedRegion = textureRegionValid;
    const finalTextureCenterX = useAlignedRegion ? textureCenterX : heightmapCanvas.width / 2;
    const finalTextureCenterY = useAlignedRegion ? textureCenterY : heightmapCanvas.height / 2;
    const finalTextureSize = useAlignedRegion ? textureSizeInHeightmapPixels : Math.min(heightmapCanvas.width, heightmapCanvas.height) * 0.1; // 10% of heightmap
    
    console.log("=== TERRAIN ALIGNMENT ===");
    console.log(`Texture coverage (real): ${textureCoverageMeters}m (${(textureCoverageMeters/1000).toFixed(2)} km)`);
    console.log(`Terrain size (scene): ${terrainSize.toFixed(2)} units`);
    console.log(`Heightmap coverage: ${heightmapCoverageMeters}m (${(heightmapCoverageMeters/1000).toFixed(0)} km)`);
    console.log(`Texture center in heightmap pixels: (${textureCenterX.toFixed(1)}, ${textureCenterY.toFixed(1)})`);
    console.log(`Texture size in heightmap pixels: ${textureSizeInHeightmapPixels.toFixed(1)}`);
    console.log(`Texture region valid: ${textureRegionValid}`);
    console.log(`Height scale: ${heightScale}`);
    
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
        
        console.log(`Applying heightmap to ${vertexCount} vertices...`);
        console.log(`Using heightmap region: center (${finalTextureCenterX.toFixed(1)}, ${finalTextureCenterY.toFixed(1)}), size: ${finalTextureSize.toFixed(1)}px`);
        
        let minHeight = Infinity;
        let maxHeight = -Infinity;
        let samplesOutOfBounds = 0;
        
        // Modify each vertex using UV coordinates
        for (let i = 0; i < positionArray.length; i += 3) {
          // Get UV coordinates for this vertex (0-1 range)
          const uvIndex = (i / 3) * 2;
          let u = uvs.array[uvIndex];
          let v = uvs.array[uvIndex + 1];
          
          // Flip U coordinate horizontally to swap east/west
          u = 1 - u;
          
          // Clamp UV coordinates
          u = Math.max(0, Math.min(1, u));
          v = Math.max(0, Math.min(1, v));
          
          // Update the UV array with flipped coordinates
          uvs.array[uvIndex] = u;
          uvs.array[uvIndex + 1] = v;
          
          // Sample elevation from heightmap (grayscale elevation data)
          const heightmapU = (u - 0.5) * finalTextureSize + finalTextureCenterX;
          const heightmapV = (v - 0.5) * finalTextureSize + finalTextureCenterY;
          
          // Clamp to valid heightmap bounds
          const heightmapPixelX = Math.max(0, Math.min(heightmapCanvas.width - 1, Math.floor(heightmapU)));
          const heightmapPixelY = Math.max(0, Math.min(heightmapCanvas.height - 1, Math.floor(heightmapV)));
          const heightmapPixelIndex = (heightmapPixelY * heightmapCanvas.width + heightmapPixelX) * 4;
          
          // Make terrain completely flat (no heightmap)
          // Set all Y coordinates to 0 (sea level)
          positionArray[i + 1] = 0;
          
          minHeight = 0;
          maxHeight = 0;
        }
        
        if (samplesOutOfBounds > 0) {
          console.warn(`Warning: ${samplesOutOfBounds} samples were out of heightmap bounds`);
        }
        
        console.log(`Height range: ${minHeight.toFixed(2)} to ${maxHeight.toFixed(2)} units`);
        console.log(`Height variation: ${(maxHeight - minHeight).toFixed(2)} units`);
        
        if (maxHeight - minHeight < 0.1) {
          console.warn("⚠️ WARNING: Very little height variation detected! Heightmap may not be applying correctly.");
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
        if (terrainTexture) {
          terrainTexture.rotation = textureRotation;
        }
        
        child.material = new MeshStandardMaterial({
          map: terrainTexture,
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
  }, [scene, heightmapTexture, terrainTexture, textureRotation, heightExaggeration]);
  
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

useGLTF.preload("assets/models/terrain-tiles.glb");
