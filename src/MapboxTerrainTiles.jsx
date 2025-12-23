import React, { useEffect, useRef, useState, useMemo, forwardRef, useCallback } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import { TextureLoader, MeshStandardMaterial, PlaneGeometry, ClampToEdgeWrapping } from "three";
import { MAPBOX_CONFIG, getMapboxTileUrl } from "./config/assets";
import {
  latLngToTile,
  tileToWorldPosition,
  getVisibleTileRange,
  getTilesInRange,
  getTilesWithinSphere,
  getSphereTileRange,
  worldToTile,
  metersPerTile,
  getPuntaArenasWorldPosition,
} from "./utils/tileCoordinates";
import { getCurrentSceneId } from "./CinematicCameraController";
import { getTileDebugEnabled } from "./TileDebugToggle";

export const MapboxTerrainTiles = forwardRef(function MapboxTerrainTiles(
  { textureRotation = 0, onClick, ...props },
  ref
) {
  const groupRef = useRef();
  const { camera } = useThree();
  
  // Tile cache: Object with "x_y" keys -> { texture, mesh, loading, error }
  // Using object instead of Map so React can track changes
  const [tileCache, setTileCache] = useState({});
  const tileCacheRef = useRef({}); // Ref for synchronous access
  const [visibleTileRange, setVisibleTileRange] = useState(null);
  const loadingTilesRef = useRef(new Set());
  const unloadTimersRef = useRef(new Map());
  
  // Detect current scene
  const [currentSceneId, setCurrentSceneId] = useState(null);
  const prevSceneIdRef = useRef(null);
  useEffect(() => {
    const updateScene = () => {
      const newSceneId = getCurrentSceneId();
      if (newSceneId !== currentSceneId) {
        setCurrentSceneId(newSceneId);
        // Reset visible tile range when scene changes
        if (prevSceneIdRef.current !== null) {
          setVisibleTileRange(null);
          setTileCache({});
          tileCacheRef.current = {};
          loadingTilesRef.current.clear();
        }
        prevSceneIdRef.current = newSceneId;
      }
    };
    updateScene();
    const interval = setInterval(updateScene, 100); // Check every 100ms
    return () => clearInterval(interval);
  }, [currentSceneId]);
  
  // Tile debug toggle (wireframe + labels)
  const [tileDebugEnabled, setTileDebugEnabled] = useState(getTileDebugEnabled());
  useEffect(() => {
    const handleToggle = (event) => {
      const newValue = event.detail.enabled;
      setTileDebugEnabled(newValue);
    };
    // Check initial state
    const initialValue = getTileDebugEnabled();
    setTileDebugEnabled(initialValue);
    window.addEventListener('tileDebugToggle', handleToggle);
    return () => {
      window.removeEventListener('tileDebugToggle', handleToggle);
    };
  }, []); // Empty deps - only set up listener once
  
  // Configuration - use default zoom for all scenes
  const zoom = MAPBOX_CONFIG.defaultZoom;
  const terrainCenter = MAPBOX_CONFIG.terrainCenter;
  const terrainSize = MAPBOX_CONFIG.terrainSize;
  
  
  // Check Mapbox token on mount
  useEffect(() => {
    if (!MAPBOX_CONFIG.accessToken || MAPBOX_CONFIG.accessToken === 'your_mapbox_token_here') {
      console.error('⚠️ Mapbox access token not configured!');
      console.error('   Please set VITE_MAPBOX_ACCESS_TOKEN in .env.local');
      console.error('   Get your token from: https://account.mapbox.com/access-tokens/');
    }
  }, []);
  
  // Calculate tile size in world units
  // At zoom 9, each tile covers ~183.68 meters at this latitude (4x zoom 11, 16x zoom 13)
  // At zoom 11, each tile covers ~45.92 meters at this latitude (2x zoom 12, 4x zoom 13)
  // At zoom 12, each tile covers ~22.96 meters at this latitude (2x zoom 13)
  // At zoom 13, each tile covers ~11.48 meters at this latitude
  const tileSizeMeters = metersPerTile(terrainCenter.lat, zoom);
  const tileSizeWorld = (tileSizeMeters / MAPBOX_CONFIG.terrainCoverageMeters) * terrainSize;
  
  // Calculate tile size
  useEffect(() => {
    // Tile size calculation (removed verbose logging)
    if (false) {
      console.log("📏 Tile Size Calculation:", {
      zoom,
      tileSizeMeters: tileSizeMeters.toFixed(2),
      terrainCoverageMeters: MAPBOX_CONFIG.terrainCoverageMeters,
      terrainSize,
      tileSizeWorld: tileSizeWorld.toFixed(4),
      metersPerUnit: (MAPBOX_CONFIG.terrainCoverageMeters / terrainSize).toFixed(2),
    });
    }
  }, [zoom, tileSizeMeters, tileSizeWorld]);
  
  // Calculate tile range that fits within sphere radius (only load tiles inside sphere)
  // For scene 7, load high-res tiles around interactive tile position
  useEffect(() => {
    if (!visibleTileRange) {
      // Calculate the exact tile range that fits within the sphere
      const sphereTileRange = getSphereTileRange(terrainCenter, terrainSize, zoom);
      const tilesWithinSphere = getTilesWithinSphere(terrainCenter, terrainSize, zoom);
      
      // Calculate tile range (removed verbose logging)
      
      setVisibleTileRange(sphereTileRange);
    }
  }, [visibleTileRange, zoom, terrainCenter, terrainSize, tileSizeWorld]);
  
  // Load a single tile (with zoom level)
  const loadTile = useCallback((x, y, tileZoom = zoom) => {
    const tileKey = `${x}_${y}_z${tileZoom}`;
    
    // Skip if already loaded or loading
    if (tileCacheRef.current[tileKey] || loadingTilesRef.current.has(tileKey)) {
      return;
    }
    
    // Cancel any pending unload timer
    if (unloadTimersRef.current.has(tileKey)) {
      clearTimeout(unloadTimersRef.current.get(tileKey));
      unloadTimersRef.current.delete(tileKey);
    }
    
    // Check if tile URL is available
    const tileUrl = getMapboxTileUrl(x, y, tileZoom);
    if (!tileUrl) {
      console.warn(`Cannot load tile ${tileKey}: Mapbox token not configured`);
      return;
    }
    
    // Mark as loading
    loadingTilesRef.current.add(tileKey);
    
    // Load texture
    const loader = new TextureLoader();
    // Loading tile (removed verbose logging)
    
    loader.load(
      tileUrl,
      (texture) => {
        
        // Configure texture
        texture.wrapS = ClampToEdgeWrapping;
        texture.wrapT = ClampToEdgeWrapping;
        texture.flipY = false;
        texture.rotation = textureRotation;
        
        // Create mesh for this tile
        // Calculate tile size for this specific zoom level
        const tileSizeMetersForZoom = metersPerTile(terrainCenter.lat, tileZoom);
        const terrainCoverageMeters = 3455;
        let tileSizeWorldForZoom = (tileSizeMetersForZoom / terrainCoverageMeters) * terrainSize;
        
        
        // Ensure tile size is reasonable
        if (tileSizeWorldForZoom <= 0 || tileSizeWorldForZoom > 20) {
          console.error(`⚠️ Invalid tile size for ${tileKey}: ${tileSizeWorldForZoom}. Zoom: ${tileZoom}`);
        }
        const geometry = new PlaneGeometry(tileSizeWorldForZoom, tileSizeWorldForZoom);
        geometry.rotateX(-Math.PI / 2); // Rotate to horizontal
        
        const material = new MeshStandardMaterial({
          map: texture,
          color: 0xffffff,
          roughness: 0.7,
          metalness: 0.05,
          side: 2, // DoubleSide
        });
        
        // Calculate world position for this tile
        let worldPos = tileToWorldPosition(x, y, tileZoom, terrainCenter, terrainSize);
        
        // Tile positioned (removed verbose logging)
        
        // Update cache
        const tileData = {
          texture,
          geometry,
          material,
          x,
          y,
          zoom: tileZoom,
          worldPos,
          mesh: null, // Will be set when mesh is created
        };
        
        setTileCache((prev) => {
          const newCache = { ...prev, [tileKey]: tileData };
          tileCacheRef.current = newCache;
          // Tile loaded (removed verbose logging)
          return newCache;
        });
        
        loadingTilesRef.current.delete(tileKey);
      },
      undefined,
      (error) => {
        console.error(`❌ Failed to load tile ${tileKey}:`, error);
        console.error(`   URL was: ${tileUrl}`);
        if (!MAPBOX_CONFIG.accessToken || MAPBOX_CONFIG.accessToken === 'your_mapbox_token_here') {
          console.error(`   ⚠️ Mapbox token not configured! Set VITE_MAPBOX_ACCESS_TOKEN in .env.local`);
        }
        loadingTilesRef.current.delete(tileKey);
        
        // Store error state
        const errorData = { error: true, x, y };
        setTileCache((prev) => {
          const newCache = { ...prev, [tileKey]: errorData };
          tileCacheRef.current = newCache;
          return newCache;
        });
      }
    );
  }, [zoom, terrainCenter, terrainSize, tileSizeWorld, textureRotation]);
  
  // Unload a tile (with delay)
  const unloadTile = useCallback((tileKey, delay = 3000) => {
    if (unloadTimersRef.current.has(tileKey)) {
      return; // Already scheduled for unload
    }
    
    const timer = setTimeout(() => {
      setTileCache((prev) => {
        const tile = prev[tileKey];
        
        if (tile) {
          // Dispose resources
          if (tile.texture) tile.texture.dispose();
          if (tile.material) tile.material.dispose();
          if (tile.geometry) tile.geometry.dispose();
          if (tile.mesh) {
            // Remove mesh from scene if it exists
            if (tile.mesh.parent) {
              tile.mesh.parent.remove(tile.mesh);
            }
          }
        }
        
        const newCache = { ...prev };
        delete newCache[tileKey];
        tileCacheRef.current = newCache;
        return newCache;
      });
      
      unloadTimersRef.current.delete(tileKey);
    }, delay);
    
    unloadTimersRef.current.set(tileKey, timer);
  }, []);
  
  // Full terrain loading: loads all tiles progressively from center outward
  // At zoom 12: ~22,500 tiles (well within free tier)
  // At zoom 13: ~90,601 tiles (exceeds free tier)
  // Tiles are cached in browser, so repeat visits won't reload them
  
  // Update texture rotation when it changes
  useEffect(() => {
    Object.values(tileCache).forEach((tile) => {
      if (tile.texture) {
        tile.texture.rotation = textureRotation;
        tile.texture.needsUpdate = true;
      }
    });
  }, [textureRotation, tileCache]);
  
  // Forward ref to group
  useEffect(() => {
    if (ref) {
      if (typeof ref === "function") {
        ref(groupRef.current);
      } else {
        ref.current = groupRef.current;
      }
    }
  }, [ref]);
  
  // Render tile meshes (only within sphere radius)
  const tileMeshes = useMemo(() => {
    console.log('🔄 tileMeshes useMemo running, tileDebugEnabled:', tileDebugEnabled);
    const meshes = [];
    const validTiles = [];
    const errorTiles = [];
    const loadingTiles = [];
    const filteredTiles = [];
    
    // Calculate sphere radius in world units
    const sphereRadius = terrainSize / 2; // 34.55 / 2 = 17.275 units
    
    Object.entries(tileCache).forEach(([tileKey, tile]) => {
      if (tile.error) {
        errorTiles.push(tileKey);
        return; // Skip error tiles
      }
      
      if (!tile.geometry || !tile.material) {
        loadingTiles.push(tileKey);
        return; // Skip incomplete tiles
      }
      
      // Check if tile is within sphere radius
      const tileZoom = tile.zoom || zoom;
      const distanceFromCenter = Math.sqrt(
        tile.worldPos.x * tile.worldPos.x + tile.worldPos.z * tile.worldPos.z
      );
      const isWithinSphere = distanceFromCenter <= sphereRadius + (tileSizeWorld / 2);
      
      if (!isWithinSphere) {
        filteredTiles.push(tileKey);
        return; // Skip rendering tiles outside sphere
      }
      
      validTiles.push({
        key: tileKey,
        coords: { x: tile.x, y: tile.y },
        position: tile.worldPos,
        distance: distanceFromCenter,
        zoom: tileZoom,
      });
      
      // Get tile size from geometry for wireframe rendering
      const tileSizeMetersForZoom = metersPerTile(terrainCenter.lat, tileZoom);
      const terrainCoverageMeters = 3455;
      const tileSizeWorldForZoom = (tileSizeMetersForZoom / terrainCoverageMeters) * terrainSize;
      
      // Position is already calculated correctly in loadTile
      const finalWorldPos = tile.worldPos;
      
      meshes.push(
        <group key={tileKey} position={[finalWorldPos.x, 0, finalWorldPos.z]}>
          <mesh
            geometry={tile.geometry}
            material={tile.material}
            castShadow
            receiveShadow
            onClick={onClick}
          />
          {/* Tile label showing coordinates - only when debug enabled */}
          {tileDebugEnabled && (
            <Text
              position={[0, 0.01, 0]}
              fontSize={0.03}
              color="#ffffff"
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.003}
              outlineColor="#000000"
            >
              {`${tile.x}_${tile.y}`}
            </Text>
          )}
          {/* Wireframe box for debugging - only when toggle is ON */}
          {tileDebugEnabled && (
            <mesh position={[0, 0.15, 0]}>
              <boxGeometry args={[tileSizeWorldForZoom, 0.3, tileSizeWorldForZoom]} />
              <meshBasicMaterial color="#ff0000" wireframe />
            </mesh>
          )}
        </group>
      );
    });
    
    // Check for critical errors only
    if (errorTiles.length > 0) {
      console.warn(`❌ Failed to load ${errorTiles.length} tiles`, errorTiles);
    }
    
    // Check if tiles are all at same position (bug indicator)
    if (validTiles.length > 1) {
      const uniquePositions = new Set(validTiles.map(t => `${t.position.x.toFixed(2)}_${t.position.z.toFixed(2)}`));
      if (uniquePositions.size === 1) {
        console.error(`⚠️ WARNING: All ${validTiles.length} tiles are at the same position! This is a bug.`);
      }
    }
    
    return meshes;
  }, [tileCache, onClick, terrainSize, tileSizeWorld, tileDebugEnabled]);
  
  // Load only tiles within sphere radius (progressive loading from center outward)
  // This only loads tiles that are actually within the sphere - no unnecessary API calls
  useEffect(() => {
    if (!visibleTileRange) return;
    
    // Get only tiles within sphere (already filtered)
    const tilesWithinSphere = getTilesWithinSphere(terrainCenter, terrainSize, zoom);
    const centerTile = latLngToTile(terrainCenter.lat, terrainCenter.lng, zoom);
    
    const existingTileKeys = new Set(Object.keys(tileCache).filter(k => !tileCache[k].error && tileCache[k].geometry));
    const newTiles = tilesWithinSphere.filter(t => !existingTileKeys.has(`${t.x}_${t.y}_z${zoom}`));
    
    // Loading tiles (removed verbose logging)
    
    // Sort tiles by distance from center (load center tiles first for better UX)
    const sortedTiles = newTiles.sort((a, b) => {
      const distA = Math.sqrt(
        Math.pow(a.x - centerTile.x, 2) + Math.pow(a.y - centerTile.y, 2)
      );
      const distB = Math.sqrt(
        Math.pow(b.x - centerTile.x, 2) + Math.pow(b.y - centerTile.y, 2)
      );
      return distA - distB;
    });
    
    // Load tiles progressively with batching to avoid overwhelming the API
    const batchSize = 20;
    sortedTiles.forEach((tile, index) => {
      setTimeout(() => {
        loadTile(tile.x, tile.y);
      }, Math.floor(index / batchSize) * 100); // 100ms delay between batches
    });
    
  }, [visibleTileRange, loadTile, tileCache, terrainCenter, zoom, terrainSize, tileSizeWorld]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear all unload timers
      unloadTimersRef.current.forEach((timer) => clearTimeout(timer));
      unloadTimersRef.current.clear();
      
      // Dispose all cached resources
      Object.values(tileCacheRef.current).forEach((tile) => {
        if (tile.texture) tile.texture.dispose();
        if (tile.material) tile.material.dispose();
        if (tile.geometry) tile.geometry.dispose();
      });
    };
  }, []);
  
  // Periodic status logging removed to reduce console bloat
  
  // Debug: Add wireframe boxes to visualize tile positions - only when toggle is enabled
  const debugBoxes = useMemo(() => {
    // Only show wireframes when toggle is enabled (not just in development)
    if (!tileDebugEnabled) {
      console.log('🔴 debugBoxes: tileDebugEnabled is false, returning null');
      return null;
    }
    
    const validTiles = Object.entries(tileCache)
      .filter(([_, tile]) => tile.geometry && tile.material && !tile.error);
    
    console.log('🟢 debugBoxes: Creating wireframes for', validTiles.length, 'tiles');
    
    return validTiles.map(([tileKey, tile]) => {
        const tileZoom = tile.zoom || zoom;
        const tileSizeMetersForZoom = metersPerTile(terrainCenter.lat, tileZoom);
        const terrainCoverageMeters = 3455;
        let tileSizeWorldForZoom = (tileSizeMetersForZoom / terrainCoverageMeters) * terrainSize;
        
        
        return (
          <mesh
            key={`debug-${tileKey}`}
            position={[tile.worldPos.x, 0.15, tile.worldPos.z]}
          >
            <boxGeometry args={[tileSizeWorldForZoom, 0.3, tileSizeWorldForZoom]} />
            <meshBasicMaterial color="#ff0000" wireframe />
          </mesh>
        );
      });
  }, [tileCache, tileSizeWorld, tileDebugEnabled, zoom, terrainCenter, terrainSize]);
  
  return (
    <group {...props} dispose={null}>
      {/* Flip entire terrain horizontally to swap east/west while keeping tiles cohesive */}
      <group ref={groupRef} scale={[-1, 1, 1]} dispose={null}>
        {tileMeshes}
        {debugBoxes}
      </group>
    </group>
  );
});

