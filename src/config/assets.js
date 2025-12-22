// Asset configuration - switch between local and CDN
// Set USE_CDN to true and update CDN_BASE_URL after setting up GitHub repo

const USE_CDN = true; // Set to true when CDN is ready
// Using GitHub raw content - more reliable than jsDelivr for binary files
const CDN_BASE_URL = "https://raw.githubusercontent.com/blessedux/cabonegro-assets/main";
const LOCAL_BASE_URL = ""; // Empty for local assets (relative paths)

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
  terrainTexture: getAssetUrl("assets/textures/terrain-texture-low.png"), // Using low-res version (187MB full version exceeds GitHub limit)
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

