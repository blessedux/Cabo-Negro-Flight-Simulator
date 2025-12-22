# CDN Setup Guide for GLB Files

## Option 1: GitHub + jsDelivr (Easiest - Recommended)

### Steps:
1. Create a new public GitHub repository (e.g., `cabonegro-assets`)
2. Upload your GLB files to the repository
3. Use jsDelivr URLs in your code:

```javascript
// Example URL format:
// https://cdn.jsdelivr.net/gh/username/repo@main/path/to/file.glb

// In your code, replace:
useGLTF("/assets/models/terrain-tiles.glb")
// With:
useGLTF("https://cdn.jsdelivr.net/gh/username/cabonegro-assets@main/models/terrain-tiles.glb")
```

### Pros:
- ✅ Completely free
- ✅ No setup required (just GitHub)
- ✅ Global CDN via jsDelivr
- ✅ Easy to update (just push to GitHub)

### Cons:
- ⚠️ Files must be in a public repo
- ⚠️ jsDelivr has rate limits (but generous for static assets)

---

## Option 2: Cloudflare R2 (Best for Large Files)

### Steps:
1. Sign up for Cloudflare (free account)
2. Go to R2 in dashboard
3. Create a bucket
4. Upload GLB files
5. Make bucket public
6. Get public URL for each file

### Pros:
- ✅ 10 GB free storage
- ✅ No egress fees
- ✅ Global CDN
- ✅ Best for large files (45MB+)

### Cons:
- ⚠️ Requires Cloudflare account setup
- ⚠️ Slightly more complex than GitHub

---

## Option 3: Netlify Drop

### Steps:
1. Go to https://app.netlify.com/drop
2. Drag and drop your `assets` folder
3. Get instant CDN URL
4. Use URLs like: `https://your-site.netlify.app/assets/models/terrain-tiles.glb`

### Pros:
- ✅ Instant setup
- ✅ 100 GB bandwidth/month free
- ✅ Global CDN

### Cons:
- ⚠️ Less permanent (if you don't link to Git)
- ⚠️ Manual upload process

---

## Quick Implementation

After choosing a CDN, update your asset URLs:

### Files to update:
- `src/MountainRoadLandscape.jsx` - terrain-tiles.glb
- `src/CargoShip.jsx` - cargo_ship_02.glb
- `src/ExploreEnvironment.jsx` - wind_turbine.glb, Server_Room.glb, terrain-3d.glb
- `src/Satellites.jsx` - starlink_spacex_satellite.glb
- `src/Airplane.jsx` - airplane_black.glb
- `src/Landscape.jsx` - scene.glb
- All scene files - envmap.hdr

### Example replacement:
```javascript
// Before:
const { scene } = useGLTF("/assets/models/terrain-tiles.glb");

// After (GitHub + jsDelivr):
const { scene } = useGLTF("https://cdn.jsdelivr.net/gh/username/cabonegro-assets@main/models/terrain-tiles.glb");

// Or create a config file:
const CDN_BASE = "https://cdn.jsdelivr.net/gh/username/cabonegro-assets@main";
const { scene } = useGLTF(`${CDN_BASE}/models/terrain-tiles.glb`);
```

---

## Recommended: GitHub + jsDelivr

This is the easiest and most reliable free option. Just:
1. Create repo: `cabonegro-assets`
2. Upload files maintaining the same folder structure
3. Replace `/assets/` with `https://cdn.jsdelivr.net/gh/yourusername/cabonegro-assets@main/` in your code

