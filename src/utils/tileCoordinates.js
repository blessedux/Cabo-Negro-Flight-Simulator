/**
 * Tile Coordinate Utilities
 * 
 * Functions for converting between geographic coordinates (lat/lng),
 * tile coordinates (x, y, zoom), and 3D world positions.
 * 
 * Based on Web Mercator projection (EPSG:3857)
 */

/**
 * Convert latitude/longitude to tile coordinates
 * @param {number} lat - Latitude in degrees
 * @param {number} lng - Longitude in degrees
 * @param {number} zoom - Zoom level
 * @returns {{x: number, y: number}} Tile coordinates
 */
export function latLngToTile(lat, lng, zoom) {
  const n = Math.pow(2, zoom);
  const x = Math.floor((lng + 180) / 360 * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n);
  return { x, y };
}

/**
 * Convert tile coordinates to latitude/longitude bounds
 * @param {number} x - Tile X coordinate
 * @param {number} y - Tile Y coordinate
 * @param {number} zoom - Zoom level
 * @returns {{minLat: number, maxLat: number, minLng: number, maxLng: number}} Geographic bounds
 */
export function tileToLatLng(x, y, zoom) {
  const n = Math.pow(2, zoom);
  const minLng = (x / n) * 360 - 180;
  const maxLng = ((x + 1) / n) * 360 - 180;
  const minLat = Math.atan(Math.sinh(Math.PI * (1 - 2 * (y + 1) / n))) * 180 / Math.PI;
  const maxLat = Math.atan(Math.sinh(Math.PI * (1 - 2 * y / n))) * 180 / Math.PI;
  return { minLat, maxLat, minLng, maxLng };
}

/**
 * Convert tile coordinates to center latitude/longitude
 * @param {number} x - Tile X coordinate
 * @param {number} y - Tile Y coordinate
 * @param {number} zoom - Zoom level
 * @returns {{lat: number, lng: number}} Center point
 */
export function tileToLatLngCenter(x, y, zoom) {
  const bounds = tileToLatLng(x, y, zoom);
  return {
    lat: (bounds.minLat + bounds.maxLat) / 2,
    lng: (bounds.minLng + bounds.maxLng) / 2,
  };
}

/**
 * Convert 3D world position to tile coordinates
 * @param {number} worldX - X position in world space
 * @param {number} worldZ - Z position in world space
 * @param {number} zoom - Zoom level
 * @param {{lat: number, lng: number}} terrainCenter - Center of terrain in lat/lng
 * @param {number} terrainSize - Size of terrain in world units
 * @returns {{x: number, y: number}} Tile coordinates
 */
export function worldToTile(worldX, worldZ, zoom, terrainCenter, terrainSize) {
  // Convert world position to lat/lng
  // At latitude -53°, 1 degree lat ≈ 111,320 meters
  // 1 degree lng ≈ 111,320 * cos(-53°) ≈ 66,980 meters
  const metersPerDegreeLat = 111320;
  const metersPerDegreeLng = 111320 * Math.cos((terrainCenter.lat * Math.PI) / 180);
  
  // Convert world units to meters (terrainSize units = terrainCoverageMeters)
  // From assets.js: terrainSize = 34.55 units, terrainCoverageMeters = 3455 meters
  const metersPerUnit = 3455 / 34.55; // ~100 meters per unit
  
  // Calculate lat/lng offset from center
  const latOffset = -worldZ * metersPerUnit / metersPerDegreeLat; // Negative because Z increases south
  const lngOffset = worldX * metersPerUnit / metersPerDegreeLng;
  
  const lat = terrainCenter.lat + latOffset;
  const lng = terrainCenter.lng + lngOffset;
  
  return latLngToTile(lat, lng, zoom);
}

/**
 * Convert tile coordinates to 3D world position
 * @param {number} x - Tile X coordinate
 * @param {number} y - Tile Y coordinate
 * @param {number} zoom - Zoom level
 * @param {{lat: number, lng: number}} terrainCenter - Center of terrain in lat/lng
 * @param {number} terrainSize - Size of terrain in world units
 * @returns {{x: number, z: number}} World position (X, Z coordinates)
 */
export function tileToWorldPosition(x, y, zoom, terrainCenter, terrainSize) {
  // Get the center tile coordinates for the terrain center
  const centerTile = latLngToTile(terrainCenter.lat, terrainCenter.lng, zoom);
  
  // Calculate tile size in world units
  const tileSizeMeters = metersPerTile(terrainCenter.lat, zoom);
  const terrainCoverageMeters = 3455; // From MAPBOX_CONFIG
  const tileSizeWorld = (tileSizeMeters / terrainCoverageMeters) * terrainSize;
  
  // Calculate offset from center tile in tile coordinates
  const tileOffsetX = x - centerTile.x;
  const tileOffsetY = y - centerTile.y;
  
  // Convert tile offset to world position
  // X increases east (positive lng), Z increases south (negative lat)
  const worldX = tileOffsetX * tileSizeWorld;
  const worldZ = -tileOffsetY * tileSizeWorld; // Negative because Z increases south
  
  return { x: worldX, z: worldZ };
}

/**
 * Calculate meters per tile at a given latitude and zoom level
 * @param {number} lat - Latitude in degrees
 * @param {number} zoom - Zoom level
 * @returns {number} Meters per tile
 */
export function metersPerTile(lat, zoom) {
  const latRad = (lat * Math.PI) / 180;
  return (156543.03392 * Math.cos(latRad)) / Math.pow(2, zoom);
}

/**
 * Get visible tile range based on camera viewport
 * @param {Object} camera - Three.js camera object
 * @param {{lat: number, lng: number}} terrainCenter - Center of terrain
 * @param {number} terrainSize - Size of terrain in world units
 * @param {number} zoom - Zoom level
 * @param {number} padding - Number of extra tiles to load beyond viewport (default: 2)
 * @returns {{minX: number, maxX: number, minY: number, maxY: number}} Visible tile range
 */
export function getVisibleTileRange(camera, terrainCenter, terrainSize, zoom, padding = 2) {
  // Simplified approach: calculate tile range based on terrain bounds
  // The component will refine this based on actual camera frustum
  const halfSize = terrainSize / 2;
  
  // Get corners of terrain in world space
  const corners = [
    { x: -halfSize, z: -halfSize },
    { x: halfSize, z: -halfSize },
    { x: halfSize, z: halfSize },
    { x: -halfSize, z: halfSize },
  ];
  
  // Convert corners to tile coordinates
  const tileCoords = corners.map(corner => 
    worldToTile(corner.x, corner.z, zoom, terrainCenter, terrainSize)
  );
  
  // Find min/max tile coordinates
  const xs = tileCoords.map(t => t.x);
  const ys = tileCoords.map(t => t.y);
  
  // Add padding
  return {
    minX: Math.min(...xs) - padding,
    maxX: Math.max(...xs) + padding,
    minY: Math.min(...ys) - padding,
    maxY: Math.max(...ys) + padding,
  };
}

/**
 * Get all tiles in a range
 * @param {{minX: number, maxX: number, minY: number, maxY: number}} range - Tile range
 * @returns {Array<{x: number, y: number}>} Array of tile coordinates
 */
export function getTilesInRange(range) {
  const tiles = [];
  for (let x = range.minX; x <= range.maxX; x++) {
    for (let y = range.minY; y <= range.maxY; y++) {
      tiles.push({ x, y });
    }
  }
  return tiles;
}

/**
 * Get tiles within sphere radius (only tiles that are actually within the sphere)
 * @param {{lat: number, lng: number}} terrainCenter - Center of terrain in lat/lng
 * @param {number} terrainSize - Size of terrain in world units
 * @param {number} zoom - Zoom level
 * @returns {Array<{x: number, y: number}>} Array of tile coordinates within sphere
 */
export function getTilesWithinSphere(terrainCenter, terrainSize, zoom) {
  const sphereRadius = terrainSize / 2;
  const centerTile = latLngToTile(terrainCenter.lat, terrainCenter.lng, zoom);
  const tileSizeMeters = metersPerTile(terrainCenter.lat, zoom);
  const terrainCoverageMeters = 3455; // From MAPBOX_CONFIG
  const tileSizeWorld = (tileSizeMeters / terrainCoverageMeters) * terrainSize;
  
  // Calculate how many tiles from center we need (with margin for tile edges)
  const radiusInTiles = Math.ceil(sphereRadius / tileSizeWorld) + 1;
  
  // Get all tiles in a square around center
  const tiles = [];
  for (let x = centerTile.x - radiusInTiles; x <= centerTile.x + radiusInTiles; x++) {
    for (let y = centerTile.y - radiusInTiles; y <= centerTile.y + radiusInTiles; y++) {
      // Calculate world position for this tile
      const worldPos = tileToWorldPosition(x, y, zoom, terrainCenter, terrainSize);
      // Calculate distance from center (0, 0)
      const distanceFromCenter = Math.sqrt(worldPos.x * worldPos.x + worldPos.z * worldPos.z);
      // Include tile if within sphere radius (with small margin for tile edges)
      if (distanceFromCenter <= sphereRadius + (tileSizeWorld / 2)) {
        tiles.push({ x, y });
      }
    }
  }
  
  return tiles;
}

/**
 * Get tile range that fits within sphere radius
 * @param {{lat: number, lng: number}} terrainCenter - Center of terrain in lat/lng
 * @param {number} terrainSize - Size of terrain in world units
 * @param {number} zoom - Zoom level
 * @returns {{minX: number, maxX: number, minY: number, maxY: number}} Tile range
 */
export function getSphereTileRange(terrainCenter, terrainSize, zoom) {
  const sphereRadius = terrainSize / 2;
  const centerTile = latLngToTile(terrainCenter.lat, terrainCenter.lng, zoom);
  const tileSizeMeters = metersPerTile(terrainCenter.lat, zoom);
  const terrainCoverageMeters = 3455; // From MAPBOX_CONFIG
  const tileSizeWorld = (tileSizeMeters / terrainCoverageMeters) * terrainSize;
  
  // Calculate how many tiles from center we need (with margin for tile edges)
  const radiusInTiles = Math.ceil(sphereRadius / tileSizeWorld) + 1;
  
  return {
    minX: centerTile.x - radiusInTiles,
    maxX: centerTile.x + radiusInTiles,
    minY: centerTile.y - radiusInTiles,
    maxY: centerTile.y + radiusInTiles,
  };
}

/**
 * Get Punta Arenas world position
 * Punta Arenas coordinates: -53.131750, -70.867303
 * @param {{lat: number, lng: number}} terrainCenter - Center of terrain in lat/lng
 * @param {number} terrainSize - Size of terrain in world units
 * @returns {{x: number, z: number}} World position (X, Z coordinates)
 */
export function getPuntaArenasWorldPosition(terrainCenter, terrainSize) {
  const puntaArenasLat = -53.131750;
  const puntaArenasLng = -70.867303;
  
  const metersPerDegreeLat = 111320;
  const metersPerDegreeLng = 111320 * Math.cos((terrainCenter.lat * Math.PI) / 180);
  const terrainCoverageMeters = 3455; // From MAPBOX_CONFIG
  const metersPerUnit = terrainCoverageMeters / terrainSize;
  
  const latOffset = puntaArenasLat - terrainCenter.lat;
  const lngOffset = puntaArenasLng - terrainCenter.lng;
  
  // Flip X coordinate to match flipped terrain (terrain is scaled [-1, 1, 1])
  const x = -(lngOffset * metersPerDegreeLng) / metersPerUnit;
  const z = -(latOffset * metersPerDegreeLat) / metersPerUnit; // Negative because Z increases south
  
  return { x, z };
}

// THREE will be imported by the component that uses this utility

