// Terrain height sampling utility
// Based on the same logic used in MountainRoadLandscape and LocationBeam

let heightmapData = null;
let heightmapCanvas = null;
let heightmapReady = false;

// Initialize heightmap data
export function initializeHeightmap(image) {
  if (!image) return;
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = image.width || 1024;
  canvas.height = image.height || 1024;
  ctx.drawImage(image, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  
  heightmapData = imageData.data;
  heightmapCanvas = canvas;
  heightmapReady = true;
}

// Sample terrain height at a given X, Z position in scene coordinates
export function sampleTerrainHeight(sceneX, sceneZ) {
  if (!heightmapReady || !heightmapData || !heightmapCanvas) {
    return 0; // Default to sea level
  }

  // Terrain settings (matching MountainRoadLandscape)
  const heightmapCoverageMeters = 80000; // 80 km
  const textureCenterLat = -52.871294;
  const textureCenterLng = -70.861816;
  const heightmapCenterLat = -53.061222;
  const heightmapCenterLng = -70.878388;
  const sceneScale = 0.01;
  const textureCoverageMeters = 3455; // 3.455 km
  
  // Convert scene coordinates to meters
  const offsetEastMeters = sceneX / sceneScale;
  const offsetNorthMeters = -sceneZ / sceneScale; // Negative because north = negative Z
  
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
  const heightmapMetersPerPixel = heightmapCoverageMeters / heightmapCanvas.width;
  const heightmapCenterX = heightmapCanvas.width / 2;
  const heightmapCenterY = heightmapCanvas.height / 2;
  const pixelX = Math.floor(heightmapCenterX + (offsetEast / heightmapMetersPerPixel));
  const pixelY = Math.floor(heightmapCenterY - (offsetNorth / heightmapMetersPerPixel));
  
  // Sample heightmap
  if (pixelX >= 0 && pixelX < heightmapCanvas.width && pixelY >= 0 && pixelY < heightmapCanvas.height) {
    const pixelIndex = (pixelY * heightmapCanvas.width + pixelX) * 4;
    const gray = (heightmapData[pixelIndex] + heightmapData[pixelIndex + 1] + heightmapData[pixelIndex + 2]) / 3;
    const normalizedHeight = gray / 255;
    const seaLevelThreshold = 0.25;
    const adjustedHeight = (normalizedHeight - seaLevelThreshold) / (1 - seaLevelThreshold);
    const heightScale = 5.0; // Matching MountainRoadLandscape
    const height = adjustedHeight * heightScale;
    return height;
  }
  
  return 0; // Default to sea level if out of bounds
}
