// Terrain height sampling utility
// Based on the same logic used in MountainRoadLandscape and LocationBeam
// Uses real topography from heightmap

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
// Terrain is now completely flat (no heightmap)
export function sampleTerrainHeight(sceneX, sceneZ) {
  // Return 0 for completely flat terrain (sea level)
  return 0;
}
