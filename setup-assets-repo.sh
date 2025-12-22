#!/bin/bash
# Script to help set up the GitHub assets repository

echo "🚀 Cabo Negro Assets Repository Setup"
echo "======================================"
echo ""
echo "This script will help you prepare files for the GitHub assets repo."
echo ""

# Check if we're in the right directory
if [ ! -d "public/assets" ]; then
    echo "❌ Error: public/assets directory not found!"
    echo "Please run this script from the project root."
    exit 1
fi

echo "📁 Files to upload:"
echo ""
echo "Models (.glb files):"
find public/assets/models -name "*.glb" -exec ls -lh {} \; | awk '{print "  - " $9 " (" $5 ")"}'

echo ""
echo "Textures:"
find public/assets/textures -type f \( -name "*.hdr" -o -name "*.jpg" -o -name "*.png" \) -exec ls -lh {} \; | awk '{print "  - " $9 " (" $5 ")"}'

echo ""
echo "Root images:"
ls -lh public/*.png public/*.webp 2>/dev/null | awk '{print "  - " $9 " (" $5 ")"}'

echo ""
echo "📋 Next steps:"
echo "1. Create a new public GitHub repository (e.g., 'cabonegro-assets')"
echo "2. Upload these files maintaining the same folder structure"
echo "3. Update src/config/assets.js with your GitHub username"
echo "4. Set USE_CDN = true in src/config/assets.js"
echo ""
echo "See GITHUB_CDN_SETUP.md for detailed instructions."
