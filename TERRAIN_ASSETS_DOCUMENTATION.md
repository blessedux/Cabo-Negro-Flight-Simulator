# Terrain Assets Documentation

This document provides comprehensive specifications for the terrain assets used in the Cabo Negro landing page project. This information is essential for aligning the texture image, heightmap, and GLB model correctly.

---

## Quick Reference

### Texture Image (terrain-texture.png)

- **Size**: `2048 × 2048 pixels` (3.2 MB)
- **Tiles**: `90,601 tiles` (301 × 301 grid)
- **Tile Range**: X: `2333-2633`, Y: `5375-5675` (zoom 13)
- **Coverage**: ~`3.45 km × 3.45 km`
- **Center**: `-52.871° S, -70.862° W`
- **Scale Factor**: `0.026578` (scaled down from 77,056×77,056)

### Heightmap (punta-arenas-cabonegro-heightmap.png)

- **Size**: `1024 × 1024 pixels` (158 KB)
- **Coverage**: `80 km × 80 km`
- **Center**: `-53.061° S, -70.878° W`
- **Resolution**: `~78.125 meters/pixel`
- **Height Scale**: `1500x` exaggeration

### GLB Model (terrain-tiles.glb)

- **Size**: `3.2 MB`
- **Mesh**: Simple quad plane (4 vertices, 2 triangles)
- **Coordinates**: Normalized (-1 to 1), needs world space scaling
- **Texture**: Embedded terrain-texture.png

---

## Overview

The terrain system uses three main assets:

1. **Texture Image PNG** - Satellite imagery texture atlas
2. **Heightmap PNG** - Elevation data for terrain displacement
3. **GLB Model** - 3D mesh with embedded texture

---

## 1. Texture Image (terrain-texture.png)

### File Information

- **Location**: `/public/assets/models/terrain-texture.png`
- **Dimensions**: `2048 x 2048 pixels`
- **File Size**: `3.2 MB`
- **Format**: PNG (RGB)

### Tile Configuration

- **Source Tiles**: 90,601 individual tiles (301 × 301 grid)
- **Tile Coordinates**:
  - X range: `2333` to `2633` (301 tiles)
  - Y range: `5375` to `5675` (301 tiles)
- **Zoom Level**: `13`
- **Original Tile Size**: `256 × 256 pixels` per tile
- **Original Atlas Size**: `77,056 × 77,056 pixels` (301 × 256)
- **Scale Factor**: `0.026578` (scaled down to fit 2048×2048 limit)
- **Needs Scaling**: `true` (was scaled down from original size)

### Geographic Coverage

- **Center Point**: `-52.871294° S, -70.861816° W`
- **Approximate Coverage**:
  - The tiles cover a large area at zoom level 13
  - Each tile at zoom 13 covers approximately `11.48 meters` at latitude -53°
  - Total coverage: ~`3.45 km × 3.45 km` (301 tiles × 11.48m)

### Coordinate System

- **Projection**: Web Mercator (TMS/XYZ tile system)
- **Tile Naming**: `{zoom}_{x}_{y}.png` (e.g., `13_2333_5375.png`)

---

## 2. Heightmap (punta-arenas-cabonegro-heightmap.png)

### File Information

- **Location**: `/public/assets/terrain/punta-arenas-cabonegro-heightmap.png`
- **Dimensions**: `1024 × 1024 pixels`
- **File Size**: `158 KB`
- **Format**: PNG (Grayscale)

### Geographic Coverage

- **Terrain Center**: `-53.061222° S, -70.878388° W`
- **Terrain Size**: `80,000 meters` (80 km diameter, 40 km radius)
- **Bounding Box**:
  - Latitude: `-53.241222°` to `-52.881222°` (±0.18° ≈ ±20 km)
  - Longitude: `-71.178388°` to `-70.578388°` (±0.30° ≈ ±20 km)

### Height Data

- **Encoding**: Grayscale (white = high elevation, black = low elevation)
- **Height Scale**: `1500x` exaggeration for visibility in 3D
- **Sea Level Offset**: `-25%` of height range (25% of range = sea level)
- **Resolution**: `1024 × 1024` pixels representing 80 km × 80 km
- **Meters per Pixel**: `~78.125 meters/pixel` (80,000m / 1024px)

### Usage

- Used for terrain displacement in `LowPolyTerrain` component
- Decimation ratio: `0.3` (30% of original resolution)
- Result: ~66,000 vertices from ~1.2M original

---

## 3. GLB Model (terrain-tiles.glb)

### File Information

- **Location**: `/public/assets/models/terrain-tiles.glb`
- **File Size**: `3.2 MB`
- **Format**: GLB (binary GLTF 2.0)

### Mesh Information

- **Geometry Type**: Simple quad plane (4 vertices, 2 triangles)
- **Vertex Count**: `4 vertices`
- **Triangle Count**: `2 triangles`
- **Texture**: Embedded texture from `terrain-texture.png`
- **UV Mapping**: Full coverage (0,0 to 1,1)

### Vertex Structure

```
Vertices (4):
  [-1.0, 0.0, -1.0]  // Bottom-left
  [ 1.0, 0.0, -1.0]  // Bottom-right
  [ 1.0, 0.0,  1.0]  // Top-right
  [-1.0, 0.0,  1.0]  // Top-left

Indices (6):
  0, 1, 2  // First triangle
  0, 2, 3  // Second triangle

UV Coordinates:
  [0.0, 1.0]  // Bottom-left
  [1.0, 1.0]  // Bottom-right
  [1.0, 0.0]  // Top-right
  [0.0, 0.0]  // Top-left

Normals:
  All pointing up [0.0, 1.0, 0.0]
```

### Material

- **Type**: PBR Metallic Roughness
- **Base Color Texture**: Embedded terrain-texture.png
- **Metallic Factor**: `0.0`
- **Roughness Factor**: `1.0`

---

## 4. Alignment & Matching Guide

### Key Differences to Consider

1. **Resolution Mismatch**:

   - Texture: `2048 × 2048` pixels
   - Heightmap: `1024 × 1024` pixels
   - **Ratio**: Texture is 2× larger in each dimension

2. **Coverage Mismatch**:

   - Texture: Covers ~3.45 km × 3.45 km (from 90,601 tiles at zoom 13)
   - Heightmap: Covers 80 km × 80 km
   - **Ratio**: Heightmap covers ~23× larger area

3. **Coordinate Systems**:
   - Texture: Uses Web Mercator tile coordinates (zoom 13, tiles 2333-2633, 5375-5675)
   - Heightmap: Uses geographic bounds centered at `-53.061222, -70.878388`
   - GLB: Uses normalized coordinates (-1 to 1) that need to be scaled

### Scaling Factors

To align the assets:

1. **Texture to World Space**:

   - Each pixel in texture ≈ `1.68 meters` (3.45 km / 2048 px)
   - GLB plane spans `-1 to 1` in normalized space
   - Scale GLB by actual world size to match texture coverage

2. **Heightmap to World Space**:

   - Each pixel in heightmap ≈ `78.125 meters` (80 km / 1024 px)
   - Heightmap should be scaled to match terrain size (80 km)

3. **Texture to Heightmap Alignment**:
   - Texture covers a subset of the heightmap area
   - Need to calculate offset and scale to align texture within heightmap bounds

### Recommended Approach

For proper alignment:

1. **Determine Texture Geographic Bounds**:

   - Convert tile coordinates (2333-2633, 5375-5675) to lat/lng
   - Calculate actual geographic bounds of texture coverage

2. **Scale GLB Model**:

   - Scale the GLB plane to match texture's geographic size (~3.45 km)
   - Position at correct world coordinates

3. **Align with Heightmap**:
   - Calculate which portion of heightmap corresponds to texture area
   - Extract/use that portion for displacement if needed
   - Or use heightmap for full terrain and texture as overlay

---

## 5. Metadata Reference

### terrain-metadata.json

```json
{
  "atlasConfig": {
    "minX": 2333,
    "maxX": 2633,
    "minY": 5375,
    "maxY": 5675,
    "tileWidth": 2048,
    "tileHeight": 2048,
    "scale": 0.026578073089700997,
    "needsScaling": true
  },
  "tileSize": 256,
  "createdAt": "1765898303.8620489"
}
```

### Coordinate Constants (from coordinates.ts)

```typescript
TERRAIN_CENTER = {
  lat: -53.061222,
  lng: -70.878388,
};

TERRAIN_SIZE = 80000; // 80km (40km radius)

CORRIDOR_BOUNDS = {
  minLat: -53.241222, // ~20km south
  maxLat: -52.881222, // ~20km north
  minLng: -71.178388, // ~20km west
  maxLng: -70.578388, // ~20km east
};
```

---

## 6. Calculation Formulas

### Tile to Geographic Conversion

```python
def tileToLatLng(x, y, zoom):
    n = 2.0 ** zoom
    lng = x / n * 360.0 - 180.0
    lat_rad = math.atan(math.sinh(math.pi * (1 - 2 * y / n)))
    lat = math.degrees(lat_rad)
    return lat, lng
```

### Meters per Tile (at latitude)

```python
metersPerTile = 156543.03392 * math.cos(lat_radians) / (2 ** zoom)
```

### World Space Conversion

```typescript
// At latitude -53°
metersPerDegreeLat = 111320;
metersPerDegreeLng = 111320 * Math.cos((lat * Math.PI) / 180);

x = (lng - centerLng) * metersPerDegreeLng;
z = -(lat - centerLat) * metersPerDegreeLat;
```

---

## 7. Summary Table

| Asset             | Dimensions   | File Size | Coverage             | Center Point           |
| ----------------- | ------------ | --------- | -------------------- | ---------------------- |
| **Texture PNG**   | 2048×2048 px | 3.2 MB    | ~3.45 km × 3.45 km   | -52.871° S, -70.862° W |
| **Heightmap PNG** | 1024×1024 px | 158 KB    | 80 km × 80 km        | -53.061° S, -70.878° W |
| **GLB Model**     | 4 vertices   | 3.2 MB    | Normalized (-1 to 1) | N/A (needs scaling)    |

| Asset             | Tiles/Resolution       | Scale Factor           | Coordinate System      |
| ----------------- | ---------------------- | ---------------------- | ---------------------- |
| **Texture PNG**   | 90,601 tiles (301×301) | 0.026578 (scaled down) | Web Mercator (zoom 13) |
| **Heightmap PNG** | 1024×1024 pixels       | 1.0 (no scaling)       | Geographic bounds      |
| **GLB Model**     | Simple quad            | Normalized             | 3D world space         |

---

## 8. Notes & Warnings

⚠️ **Important Considerations**:

1. The texture and heightmap cover **different geographic areas**:

   - Texture: Small area (~3.45 km) from satellite tiles
   - Heightmap: Large area (80 km) for full terrain

2. The texture was **scaled down** from original size (77,056×77,056) to fit GPU limits (2048×2048)

3. The GLB model is a **simple plane** - it does not include height displacement. Height data must be applied separately using the heightmap.

4. For proper alignment, you may need to:
   - Calculate the exact geographic bounds of the texture tiles
   - Scale and position the GLB model to match texture coverage
   - Extract the corresponding portion of the heightmap for that area
   - Or use heightmap for full terrain and texture as an overlay

---

## 9. Related Files

- **Metadata**: `/public/assets/models/terrain-metadata.json`
- **Coordinate Utilities**: `/src/lib/terrain/coordinates.ts`
- **Tile Utilities**: `/src/lib/terrain/map-tiles.ts`
- **Terrain Components**:
  - `/src/components/scenes/LowPolyTerrain.tsx`
  - `/src/components/scenes/ProceduralTileTerrain.tsx`
- **Generation Scripts**:
  - `/scripts/tiles-to-glb.py`
  - `/scripts/tiles-to-glb.js`

---

_Last Updated: Based on terrain-metadata.json and asset files_
_Generated from: terrain-metadata.json, coordinates.ts, and file system analysis_
