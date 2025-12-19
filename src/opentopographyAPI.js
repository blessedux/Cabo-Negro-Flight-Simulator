// OpenTopography API utility for fetching SRTM elevation data
// Based on OpenTopography Global API: https://portal.opentopography.org/API/globaldem

/**
 * Fetch SRTM elevation data from OpenTopography Global API
 * 
 * @param {number} south - Southern boundary (latitude)
 * @param {number} north - Northern boundary (latitude)
 * @param {number} west - Western boundary (longitude)
 * @param {number} east - Eastern boundary (longitude)
 * @param {string} demtype - DEM type: 'SRTMGL1' (30m) or 'SRTMGL3' (90m)
 * @param {string} apiKey - OpenTopography API key (optional, but recommended)
 * @returns {Promise<ImageData>} Elevation data as ImageData
 */
export async function fetchSRTMElevationData(south, north, west, east, demtype = 'SRTMGL1', apiKey = null) {
  const baseUrl = 'https://portal.opentopography.org/API/globaldem';
  
  // Build query parameters
  const params = new URLSearchParams({
    demtype: demtype,
    south: south.toString(),
    north: north.toString(),
    west: west.toString(),
    east: east.toString(),
    outputFormat: 'GTiff', // GeoTIFF format
  });
  
  // Add API key if provided (recommended for higher rate limits)
  if (apiKey) {
    params.append('API_Key', apiKey);
  }
  
  const url = `${baseUrl}?${params.toString()}`;
  
  try {
    console.log(`Fetching SRTM elevation data from OpenTopography...`);
    console.log(`Region: ${south}°S to ${north}°N, ${west}°W to ${east}°E`);
    console.log(`DEM Type: ${demtype}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`OpenTopography API error: ${response.status} ${response.statusText}`);
    }
    
    // Get the response as a blob
    const blob = await response.blob();
    
    // Convert blob to image
    const imageUrl = URL.createObjectURL(blob);
    const img = new Image();
    
    return new Promise((resolve, reject) => {
      img.onload = () => {
        // Create canvas to extract pixel data
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // Clean up
        URL.revokeObjectURL(imageUrl);
        
        console.log(`✓ SRTM elevation data loaded: ${canvas.width}×${canvas.height} pixels`);
        resolve(imageData);
      };
      
      img.onerror = (error) => {
        URL.revokeObjectURL(imageUrl);
        reject(new Error(`Failed to load elevation image: ${error}`));
      };
      
      img.src = imageUrl;
    });
  } catch (error) {
    console.error('Error fetching SRTM elevation data:', error);
    throw error;
  }
}

/**
 * Get elevation value from SRTM data at a specific pixel
 * SRTM data is typically 16-bit, with values representing meters above sea level
 * 
 * @param {ImageData} imageData - SRTM elevation image data
 * @param {number} x - Pixel X coordinate
 * @param {number} y - Pixel Y coordinate
 * @returns {number} Elevation in meters
 */
export function getElevationFromSRTM(imageData, x, y) {
  const { width, height, data } = imageData;
  
  // Clamp coordinates
  x = Math.max(0, Math.min(width - 1, Math.floor(x)));
  y = Math.max(0, Math.min(height - 1, Math.floor(y)));
  
  const index = (y * width + x) * 4;
  
  // SRTM data in GeoTIFF might be stored as grayscale
  // Typically, the red channel contains the elevation value
  // For 16-bit data, we might need to combine channels
  // For now, assume it's stored as grayscale (all channels same)
  const elevation = data[index]; // Using red channel
  
  // If the data is 16-bit, we might need to combine bytes
  // For simplicity, assuming 8-bit grayscale for now
  // In production, you'd want to handle 16-bit properly
  
  return elevation;
}

/**
 * Sample elevation at geographic coordinates using SRTM data
 * 
 * @param {ImageData} imageData - SRTM elevation image data
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {number} boundsSouth - Southern boundary of the data
 * @param {number} boundsNorth - Northern boundary of the data
 * @param {number} boundsWest - Western boundary of the data
 * @param {number} boundsEast - Eastern boundary of the data
 * @returns {number} Elevation in meters
 */
export function sampleElevationAtCoordinates(imageData, lat, lng, boundsSouth, boundsNorth, boundsWest, boundsEast) {
  const { width, height } = imageData;
  
  // Convert lat/lng to pixel coordinates
  const latRange = boundsNorth - boundsSouth;
  const lngRange = boundsEast - boundsWest;
  
  const normalizedLat = (lat - boundsSouth) / latRange;
  const normalizedLng = (lng - boundsWest) / lngRange;
  
  // Flip Y coordinate (image Y is top-to-bottom, lat is bottom-to-top)
  const pixelX = normalizedLng * width;
  const pixelY = (1 - normalizedLat) * height;
  
  return getElevationFromSRTM(imageData, pixelX, pixelY);
}
