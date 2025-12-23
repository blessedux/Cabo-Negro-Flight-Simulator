// Asset configuration - switch between local and CDN
// Set USE_CDN to true and update CDN_BASE_URL after setting up GitHub repo

const USE_CDN = true; // Set to true when CDN is ready
// Using GitHub raw content - more reliable than jsDelivr for binary files
const CDN_BASE_URL = "https://raw.githubusercontent.com/blessedux/cabonegro-assets/main";
const LOCAL_BASE_URL = ""; // Empty for local assets (relative paths)

// CDN for large files (high-res textures, 196MB)
// Choose one of the following options:
// 1. Cloudflare R2: https://pub-xxxxx.r2.dev
// 2. Backblaze B2: https://f000.backblazeb2.com/file/bucket-name/
// 3. AWS S3: https://bucket-name.s3.region.amazonaws.com
// 4. DigitalOcean Spaces: https://bucket-name.region.digitaloceanspaces.com
// 5. Bunny CDN: https://storage.bunnycdn.com/zone-name/
// Set to null to disable high-res texture (uses low-res only)
const LARGE_FILE_CDN_URL = "https://pub-e0cbd7becdde415788b6e7249e704abb.r2.dev"; // e.g., "https://pub-xxxxx.r2.dev" or "https://f000.backblazeb2.com/file/bucket-name/"

const BASE_URL = USE_CDN ? CDN_BASE_URL : LOCAL_BASE_URL;

// Helper function to get asset URL
export function getAssetUrl(path) {
  // Remove leading slash if present
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  return BASE_URL ? `${BASE_URL}/${cleanPath}` : `/${cleanPath}`;
}

// Model paths
export const MODELS = {
  cargoShip: getAssetUrl("assets/models/cargo_ship_02.glb"),
  windTurbine: getAssetUrl("assets/models/wind_turbine.glb"),
  serverRoom: getAssetUrl("assets/models/Server_Room.glb"),
  starlinkSatellite: getAssetUrl("assets/models/starlink_spacex_satellite.glb"),
  airplaneBlack: getAssetUrl("assets/models/airplane_black.glb"),
};

// Texture paths
export const TEXTURES = {
  // Low-res texture (fast initial load, 3.2MB)
  terrainTextureLow: getAssetUrl("assets/textures/terrain-texture-low.png"),
  // High-res texture (progressive loading, 196MB)
  // Uses LARGE_FILE_CDN_URL if available, otherwise falls back to low-res
  terrainTexture: LARGE_FILE_CDN_URL 
    ? `${LARGE_FILE_CDN_URL}/terrain-texture.png`
    : getAssetUrl("assets/textures/terrain-texture-low.png"),
  envmapHdr: getAssetUrl("assets/textures/envmap.hdr"),
  envmapJpg: getAssetUrl("assets/textures/envmap.jpg"),
};

// Image paths
export const IMAGES = {
  cabonegroLogo: getAssetUrl("CaboNegro_logo_white.png"),
  terminalMaritimo: getAssetUrl("terminal_maritimo_iq.webp"),
  datacenter: getAssetUrl("datacenter.webp"),
  starlinkSatellites: getAssetUrl("stalink_satelites.webp"),
  puntaArenas: getAssetUrl("punta-arenas.webp"),
};

// Mapbox Configuration
export const MAPBOX_CONFIG = {
  // Get access token from environment variable
  accessToken: import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '',
  // Base URL for Mapbox Satellite tiles
  // @2x suffix provides 512x512 tiles (better quality than 256x256)
  baseUrl: 'https://api.mapbox.com/v4/mapbox.satellite/{z}/{x}/{y}@2x.jpg?access_token={token}',
  // Tile size in pixels (at base zoom, @2x gives 512px)
  tileSize: 256,
  // Default zoom level for terrain (zoom 9 = ~2,809 tiles, very efficient for free tier)
  // Each tile at zoom 9 covers 4x the area of zoom 11 (16x zoom 13), so tiles are much larger
  // This provides good coverage with minimal API usage
  defaultZoom: 9,
  // Geographic bounds for terrain area
  terrainCenter: {
    lat: -52.871, // Latitude in degrees
    lng: -70.862, // Longitude in degrees
  },
  // Terrain size in world units (matches existing terrain size)
  terrainSize: 34.55, // units (represents 3.455 km in real world)
  // Real world coverage in meters
  terrainCoverageMeters: 3455, // 3.455 km
  // Original tile range at zoom 13 (from TERRAIN_ASSETS_DOCUMENTATION.md)
  // X: 2333-2633 (301 tiles), Y: 5375-5675 (301 tiles) = 90,601 tiles total
  // At zoom 12: 151×151 tiles = 22,801 tiles (each tile 2x zoom 13)
  // At zoom 11: 75×75 tiles = 5,625 tiles (each tile 2x zoom 12, 4x zoom 13)
  // At zoom 9: 53×53 tiles = 2,809 tiles (each tile 4x zoom 11, 16x zoom 13)
  // This provides good coverage with minimal API usage
  terrainTileRange: {
    zoom9: {
      minX: 129, // Center (155) - radius (26) = 129
      maxX: 181, // Center (155) + radius (26) = 181
      minY: 319, // Center (345) - radius (26) = 319
      maxY: 371, // Center (345) + radius (26) = 371
    },
    zoom11: {
      minX: 583, // Center (620) - radius (37) = 583
      maxX: 657, // Center (620) + radius (37) = 657
      minY: 1344, // Center (1381) - radius (37) = 1344
      maxY: 1418, // Center (1381) + radius (37) = 1418
    },
    zoom12: {
      minX: 1188, // Center (1241) - radius (53) = 1188
      maxX: 1294, // Center (1241) + radius (53) = 1294
      minY: 2709, // Center (2762) - radius (53) = 2709
      maxY: 2815, // Center (2762) + radius (53) = 2815
    },
    zoom13: {
      minX: 2333,
      maxX: 2633,
      minY: 5375,
      maxY: 5675,
    },
    // At zoom 14, same geographic area requires 2x tiles in each direction
    zoom14: {
      minX: 4666, // 2333 * 2
      maxX: 5266, // 2633 * 2
      minY: 10750, // 5375 * 2
      maxY: 11350, // 5675 * 2
    },
  },
};

// Helper function to get Mapbox tile URL
export function getMapboxTileUrl(x, y, zoom = MAPBOX_CONFIG.defaultZoom) {
  if (!MAPBOX_CONFIG.accessToken) {
    console.warn('Mapbox access token not configured. Set VITE_MAPBOX_ACCESS_TOKEN in .env.local');
    return null;
  }
  
  return MAPBOX_CONFIG.baseUrl
    .replace('{z}', zoom)
    .replace('{x}', x)
    .replace('{y}', y)
    .replace('{token}', MAPBOX_CONFIG.accessToken);
}

