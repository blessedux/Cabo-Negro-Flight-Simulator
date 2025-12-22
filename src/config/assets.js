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
const LARGE_FILE_CDN_URL = "https://pub-e0cbd7becdde415788b6e7249e704abb.r2.dev" ; // e.g., "https://pub-xxxxx.r2.dev" or "https://f000.backblazeb2.com/file/bucket-name/"

const BASE_URL = USE_CDN ? CDN_BASE_URL : LOCAL_BASE_URL;

// Helper function to get asset URL
export function getAssetUrl(path) {
  // Remove leading slash if present
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  return BASE_URL ? `${BASE_URL}/${cleanPath}` : `/${cleanPath}`;
}

// Model paths
export const MODELS = {
  terrainTiles: getAssetUrl("assets/models/terrain-tiles.glb"),
  cargoShip: getAssetUrl("assets/models/cargo_ship_02.glb"),
  windTurbine: getAssetUrl("assets/models/wind_turbine.glb"),
  serverRoom: getAssetUrl("assets/models/Server_Room.glb"),
  starlinkSatellite: getAssetUrl("assets/models/starlink_spacex_satellite.glb"),
  airplaneBlack: getAssetUrl("assets/models/airplane_black.glb"),
  scene: getAssetUrl("assets/models/scene.glb"),
  terrain3d: getAssetUrl("assets/textures/terrain-3d.glb"),
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

