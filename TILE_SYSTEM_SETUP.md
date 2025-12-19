# Tile-Based Terrain System Setup Guide

## Overview

The terrain system now uses **individual tile-based rendering** instead of a single large texture. This allows:

- ✅ Only visible tiles are loaded (performance)
- ✅ Real-time drag-and-drop navigation
- ✅ Support for high-resolution individual tile images
- ✅ Dynamic loading/unloading as you explore

## How It Works

1. **Tile Grid**: The terrain is divided into a 301×301 grid of tiles
2. **Visible Tiles**: Only a 4×4 grid of tiles is rendered at once (configurable)
3. **On-Demand Loading**: Tiles load their textures as they become visible
4. **Drag Navigation**: Dragging updates which tiles are visible

## CDN Setup Options

Since individual tile images are 100+ MB each, you'll need to host them on a CDN. Here are the best options:

### Option 1: AWS S3 + CloudFront (Recommended for Production)

**Pros**: Fast, scalable, reliable
**Cons**: Costs money (but reasonable for static assets)

1. Upload tiles to S3 bucket
2. Enable CloudFront distribution
3. Update `tileConfig.cdnBaseUrl`:
   ```javascript
   cdnBaseUrl: 'https://your-distribution.cloudfront.net/tiles/',
   tilePathFormat: '13_{x}_{y}.png' // or your naming convention
   ```

### Option 2: Google Drive (Free, Good for Testing)

**Pros**: Free, easy setup
**Cons**: Slower, rate limits, requires public sharing

1. Upload tiles to Google Drive
2. Make folder public (or files individually)
3. Get shareable link format
4. Update `tileConfig.cdnBaseUrl`:
   ```javascript
   cdnBaseUrl: 'https://drive.google.com/uc?export=view&id=',
   // Note: You'll need individual file IDs for each tile
   // Or use a script to generate the URLs
   ```

### Option 3: Cloudinary (Good Free Tier)

**Pros**: Free tier available, good performance
**Cons**: Free tier has limits

1. Upload tiles to Cloudinary
2. Update `tileConfig.cdnBaseUrl`:
   ```javascript
   cdnBaseUrl: 'https://res.cloudinary.com/your-cloud/image/upload/tiles/',
   tilePathFormat: '13_{x}_{y}.png'
   ```

### Option 4: Self-Hosted / Local Development

For testing with local files:

1. Place tiles in `/public/assets/tiles/` folder
2. Name them according to `tilePathFormat` (e.g., `tile_2333_5375.png`)
3. Leave `cdnBaseUrl` empty:
   ```javascript
   cdnBaseUrl: '', // Uses local path
   tilePathFormat: 'tile_{x}_{y}.png'
   ```

## Tile Naming Convention

The system uses a configurable naming format. Update `tilePathFormat` to match your files:

- **Standard format**: `tile_{x}_{y}.png` → `tile_2333_5375.png`
- **Zoom format**: `13_{x}_{y}.png` → `13_2333_5375.png`
- **Custom**: `{x}_{y}_tile.png` → `2333_5375_tile.png`

The `{x}` and `{y}` placeholders are replaced with actual tile coordinates.

## Configuration

Edit `tileConfig` in `terrain-test.html`:

```javascript
const tileConfig = {
  tilesPerSide: 301, // Total tiles (301×301)
  tileSizeInUnits: 2.0, // Size of each tile in scene
  visibleTiles: 4, // Grid size (4×4 = 16 tiles visible)

  // CDN Configuration
  cdnBaseUrl: "YOUR_CDN_URL_HERE",
  tilePathFormat: "tile_{x}_{y}.png",

  // Tile coordinate range
  tileXStart: 2333, // Starting X coordinate
  tileYStart: 5375, // Starting Y coordinate
};
```

## Performance Tips

1. **Tile Size**: Keep individual tile images reasonable (1-5 MB each)
2. **Visible Tiles**: Adjust `visibleTiles` (4×4 = 16 tiles is a good balance)
3. **Caching**: Ensure your CDN has proper cache headers
4. **Lazy Loading**: Tiles load automatically as they become visible

## Testing Without CDN

If you don't have tiles set up yet, the system will:

- Show gray placeholder tiles
- Log loading errors in console
- Still allow drag-and-drop navigation

This lets you test the navigation system before uploading tiles.

## Next Steps

1. Choose a CDN option
2. Upload your tile images
3. Update `tileConfig.cdnBaseUrl` and `tilePathFormat`
4. Test the system
5. Adjust `visibleTiles` if needed for performance

## Troubleshooting

**Tiles not loading?**

- Check browser console for errors
- Verify CDN URL is correct
- Check tile naming matches `tilePathFormat`
- Ensure CORS is enabled on CDN

**Performance issues?**

- Reduce `visibleTiles` (e.g., 3×3 instead of 4×4)
- Optimize tile image sizes
- Use a faster CDN (CloudFront > Cloudinary > Google Drive)

**Tiles loading slowly?**

- Check CDN performance
- Consider image compression
- Use WebP format if supported
