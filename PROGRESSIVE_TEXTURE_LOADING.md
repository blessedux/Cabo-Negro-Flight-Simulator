# Progressive Texture Loading Solution

## Problem
The high-resolution terrain texture (16384×16384, 196MB) exceeds GitHub's 100MB file size limit, but we want to use it for better visual quality while maintaining fast load times.

## Solution: Progressive Loading + Cloudflare R2

### How It Works

1. **Fast Initial Load**: The app loads the low-resolution texture (2048×2048, 3.2MB) immediately from GitHub CDN
2. **Background Loading**: While the user sees the low-res texture, the high-res texture (16384×16384, 196MB) loads in the background from Cloudflare R2
3. **Automatic Upgrade**: Once the high-res texture is ready, it automatically replaces the low-res version
4. **Fallback**: If R2 is not configured or the high-res fails to load, the app continues using the low-res texture

### Benefits

- ✅ **Fast initial load**: Users see the terrain immediately (3.2MB vs 196MB)
- ✅ **Better quality**: High-res texture loads in background and upgrades automatically
- ✅ **No GitHub limit**: Large file hosted on Cloudflare R2 (free tier: 10GB storage)
- ✅ **Global CDN**: Cloudflare's edge network ensures fast delivery worldwide
- ✅ **No egress fees**: Unlike AWS S3, R2 doesn't charge for data transfer
- ✅ **Graceful degradation**: Falls back to low-res if high-res unavailable

### Setup Instructions

1. **Create Cloudflare R2 Bucket** (see `CLOUDFLARE_R2_SETUP.md`)
   - Sign up at https://dash.cloudflare.com
   - Create bucket: `cabonegro-assets`
   - Enable public access
   - Upload `terrain-texture.png` (196MB)

2. **Update Asset Config**
   - Open `src/config/assets.js`
   - Set `R2_BASE_URL` to your R2 public URL:
     ```javascript
     const R2_BASE_URL = "https://pub-xxxxx.r2.dev";
     ```

3. **Deploy**
   - The app will automatically use progressive loading
   - Low-res loads first, high-res upgrades when ready

### Technical Details

- **Low-res texture**: `terrain-texture-low.png` (2048×2048, 3.2MB)
- **High-res texture**: `terrain-texture.png` (16384×16384, 196MB)
- **Loading strategy**: `useTexture` hook for low-res (blocking), `TextureLoader` for high-res (async)
- **Texture swap**: Automatic when high-res loads, preserves rotation and settings

### Performance

- **Initial load**: ~3.2MB (low-res texture)
- **Background load**: ~196MB (high-res texture, non-blocking)
- **User experience**: Terrain visible immediately, quality improves automatically
- **CDN caching**: Both textures cached by Cloudflare for subsequent visits

