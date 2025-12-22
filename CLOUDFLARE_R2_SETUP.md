# Cloudflare R2 Setup for Large Assets

This guide explains how to set up Cloudflare R2 to host the high-resolution terrain texture (196MB) without hitting GitHub's 100MB limit.

## Why Cloudflare R2?

- **Free Tier**: 10GB storage, 1M Class A operations/month
- **Fast CDN**: Automatically distributed globally
- **No Egress Fees**: Unlike AWS S3, R2 doesn't charge for data transfer
- **S3-Compatible API**: Easy to use with standard tools

## Setup Steps

### 1. Create Cloudflare Account

1. Go to https://dash.cloudflare.com/sign-up
2. Sign up for a free account

### 2. Enable R2

1. In Cloudflare dashboard, go to **R2** (in left sidebar)
2. Click **Create bucket**
3. Name it: `cabonegro-assets`
4. Choose a location (closest to your users)
5. Click **Create bucket**

### 3. Upload the High-Resolution Texture

1. In your bucket, click **Upload**
2. Upload `terrain-texture.png` (196MB)
3. Note the file path: `terrain-texture.png`

### 4. Set Up Public Access

1. Go to **Settings** → **Public Access**
2. Enable **Public Access**
3. Copy the **Public URL** (format: `https://pub-xxxxx.r2.dev/terrain-texture.png`)

### 5. Configure CORS (if needed)

1. Go to **Settings** → **CORS Policy**
2. Add CORS rule:
   ```
   Allowed Origins: *
   Allowed Methods: GET
   Allowed Headers: *
   ```

### 6. Update Asset Configuration

Update `src/config/assets.js` with your R2 public URL:

```javascript
const R2_BASE_URL = "https://pub-xxxxx.r2.dev"; // Your R2 public URL
```

## Alternative: AWS S3 + CloudFront

If you prefer AWS:

1. Create S3 bucket
2. Upload file with public read access
3. Create CloudFront distribution
4. Use CloudFront URL in asset config

## Cost Comparison

- **Cloudflare R2**: Free (10GB storage, 1M operations/month)
- **AWS S3**: ~$0.023/GB storage + $0.09/GB transfer
- **GitHub LFS**: Not suitable for CDN serving (we tried this)

## Performance

R2 files are automatically cached by Cloudflare's CDN, providing:

- Fast global delivery
- Automatic compression
- HTTP/2 and HTTP/3 support
- Edge caching
