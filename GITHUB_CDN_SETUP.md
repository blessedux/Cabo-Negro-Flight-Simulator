# GitHub + jsDelivr CDN Setup Guide

## Step 1: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `cabonegro-assets` (or any name you prefer)
3. Make it **Public** (required for jsDelivr)
4. Don't initialize with README, .gitignore, or license
5. Click "Create repository"

## Step 2: Upload Assets to GitHub

You have two options:

### Option A: Using GitHub Web Interface (Easiest)

1. Go to your new repository
2. Click "uploading an existing file"
3. Create the folder structure:
   - `assets/models/` - Upload all .glb files here
   - `assets/textures/` - Upload .hdr, .jpg, .png files here
   - Root level - Upload images like `CaboNegro_logo_white.png`, `terminal_maritimo_iq.webp`, etc.
4. Commit the files

### Option B: Using Git (Recommended for large files)

Run these commands in a new folder:

```bash
# Create new directory for assets repo
mkdir cabonegro-assets
cd cabonegro-assets

# Initialize git
git init
git remote add origin https://github.com/YOUR_USERNAME/cabonegro-assets.git

# Copy files from your project (adjust paths as needed)
cp -r /path/to/R3F-takes-flight/public/assets .
cp /path/to/R3F-takes-flight/public/*.png .
cp /path/to/R3F-takes-flight/public/*.webp .

# Commit and push
git add .
git commit -m "Initial commit: Add 3D assets"
git branch -M main
git push -u origin main
```

## Step 3: Update Your Code

1. Open `src/config/assets.js`
2. Update these values:

   ```javascript
   const USE_CDN = true; // Change to true
   const CDN_BASE_URL =
     "https://cdn.jsdelivr.net/gh/YOUR_USERNAME/cabonegro-assets@main";
   ```

   Replace `YOUR_USERNAME` with your GitHub username

3. Save and rebuild:
   ```bash
   npm run build
   ```

## Step 4: Test

1. Deploy to Vercel
2. Check browser console - assets should load from jsDelivr
3. Verify files are loading correctly

## File Structure in GitHub Repo

Your GitHub repo should have this structure:

```
cabonegro-assets/
├── assets/
│   ├── models/
│   │   ├── terrain-tiles.glb
│   │   ├── cargo_ship_02.glb
│   │   ├── wind_turbine.glb
│   │   ├── Server_Room.glb
│   │   ├── starlink_spacex_satellite.glb
│   │   ├── airplane_black.glb
│   │   ├── scene.glb
│   │   └── ... (other .glb files)
│   └── textures/
│       ├── envmap.hdr
│       ├── envmap.jpg
│       ├── terrain-texture.png
│       └── terrain-3d.glb
├── CaboNegro_logo_white.png
├── terminal_maritimo_iq.webp
├── datacenter.webp
├── stalink_satelites.webp
└── punta-arenas.webp
```

## jsDelivr URL Format

Once uploaded, your files will be accessible at:

- `https://cdn.jsdelivr.net/gh/YOUR_USERNAME/cabonegro-assets@main/assets/models/terrain-tiles.glb`
- `https://cdn.jsdelivr.net/gh/YOUR_USERNAME/cabonegro-assets@main/assets/textures/envmap.hdr`

## Updating Assets

When you need to update assets:

1. Push new files to GitHub
2. jsDelivr will automatically serve the latest version
3. You may need to clear browser cache or use a version tag

## Benefits

✅ Free forever
✅ Global CDN (fast worldwide)
✅ No bandwidth limits
✅ Easy to update (just push to GitHub)
✅ Works with Vercel deployment
