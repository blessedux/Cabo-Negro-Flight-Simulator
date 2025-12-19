// Utility functions for color-based terrain height calculation

import { getHeightForColor } from './colorHeightMapping';

// Global height exaggeration multiplier (1.0 = normal, higher = more exaggerated)
let heightExaggerationRef = { current: 1.0 };

export function setHeightExaggeration(multiplier) {
  heightExaggerationRef.current = Math.max(0.1, Math.min(10.0, multiplier));
  // Dispatch event to notify terrain components to update
  window.dispatchEvent(new CustomEvent('heightExaggerationChanged', { 
    detail: { multiplier: heightExaggerationRef.current } 
  }));
}

export function getHeightExaggeration() {
  return heightExaggerationRef.current;
}

/**
 * Calculate terrain type multiplier based on RGB color values from satellite imagery
 * Blue = water (low), Green = valleys (low-medium), White = clouds (high), Brown = mountains (very high)
 * 
 * @param {number} r - Red channel (0-255)
 * @param {number} g - Green channel (0-255)
 * @param {number} b - Blue channel (0-255)
 * @returns {number} Terrain type multiplier (affects height)
 */
export function getTerrainTypeMultiplier(r, g, b) {
  // Normalize RGB values to 0-1
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;
  
  // Calculate brightness (grayscale)
  const brightness = (r + g + b) / 3 / 255;
  
  // Detect color types with improved thresholds
  // Blue: dominant blue channel, typically water
  const isBlue = bNorm > Math.max(rNorm, gNorm) * 1.2 && bNorm > 0.25;
  
  // Green: dominant green channel, typically valleys/vegetation
  const isGreen = !isBlue && gNorm > Math.max(rNorm, bNorm) * 1.1 && gNorm > 0.25;
  
  // White: high brightness with balanced RGB, typically clouds
  const isWhite = !isBlue && !isGreen && brightness > 0.65 && 
                  Math.abs(rNorm - gNorm) < 0.15 && 
                  Math.abs(gNorm - bNorm) < 0.15 &&
                  Math.abs(rNorm - bNorm) < 0.15;
  
  // Brown: reddish-brown tones, typically mountain peaks/rock
  const isBrown = !isBlue && !isGreen && !isWhite && 
                  rNorm > 0.35 && gNorm > 0.25 && bNorm < rNorm * 0.7 &&
                  (rNorm + gNorm) > bNorm * 2.0;
  
  // Return terrain type multiplier
  if (isBlue) {
    return 0.3; // Water: low multiplier
  } else if (isGreen) {
    return 0.6; // Valleys: medium-low multiplier
  } else if (isWhite) {
    return 1.3; // Clouds: high multiplier
  } else if (isBrown) {
    return 1.8; // Mountain peaks: very high multiplier
  } else {
    return 1.0; // Default: normal multiplier
  }
}

/**
 * Calculate height based on elevation data and terrain type from satellite imagery
 * Combines actual elevation (from heightmap/SRTM) with terrain type adjustments (from satellite texture)
 * First checks for custom color mappings, then falls back to automatic terrain type detection
 * 
 * @param {number} elevationValue - Elevation value from heightmap (0-255 grayscale)
 * @param {number} terrainR - Red channel from terrain texture (0-255)
 * @param {number} terrainG - Green channel from terrain texture (0-255)
 * @param {number} terrainB - Blue channel from terrain texture (0-255)
 * @param {number} baseHeightScale - Base height scale multiplier
 * @returns {number} Calculated height value
 */
export function calculateHeightFromElevationAndTerrainType(elevationValue, terrainR, terrainG, terrainB, baseHeightScale = 5.0) {
  // First, check if there's a custom color mapping for this color
  const customHeight = getHeightForColor(terrainR, terrainG, terrainB, baseHeightScale, heightExaggerationRef.current);
  
  if (customHeight !== null) {
    // Use custom mapping
    return customHeight;
  }
  
  // Fall back to automatic terrain type detection
  const terrainTypeMultiplier = getTerrainTypeMultiplier(terrainR, terrainG, terrainB);
  
  // Normalize elevation to 0-1 range
  const normalizedElevation = elevationValue / 255;
  
  // Apply sea level threshold (25% = sea level)
  const seaLevelThreshold = 0.25;
  const adjustedElevation = (normalizedElevation - seaLevelThreshold) / (1 - seaLevelThreshold);
  
  // Apply base height scale and terrain type multiplier
  const height = adjustedElevation * baseHeightScale * terrainTypeMultiplier;
  
  // Apply global exaggeration multiplier
  const exaggeratedHeight = height * heightExaggerationRef.current;
  
  return exaggeratedHeight;
}

/**
 * Legacy function for backward compatibility
 * Calculate height based on RGB color values (uses color as both terrain type and elevation)
 * 
 * @param {number} r - Red channel (0-255)
 * @param {number} g - Green channel (0-255)
 * @param {number} b - Blue channel (0-255)
 * @param {number} baseHeightScale - Base height scale multiplier
 * @returns {number} Calculated height value
 */
export function calculateColorBasedHeight(r, g, b, baseHeightScale = 5.0) {
  const terrainTypeMultiplier = getTerrainTypeMultiplier(r, g, b);
  // Use brightness as elevation approximation
  const brightness = (r + g + b) / 3;
  return calculateHeightFromElevationAndTerrainType(brightness, terrainTypeMultiplier, baseHeightScale);
}
