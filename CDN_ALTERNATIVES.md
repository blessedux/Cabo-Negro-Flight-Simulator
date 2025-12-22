# CDN Alternatives for Large Files

This guide covers multiple CDN options for hosting the high-resolution terrain texture (196MB) when Cloudflare R2 is unavailable.

## Quick Comparison

| Provider | Free Tier | Setup Difficulty | Best For |
|---------|-----------|------------------|----------|
| **Backblaze B2** | 10GB storage, 1GB/day download | Easy | Free tier users |
| **AWS S3 + CloudFront** | 5GB storage (12 months) | Medium | Production apps |
| **DigitalOcean Spaces** | $5/month (250GB) | Easy | Simple setup |
| **Bunny CDN** | $1/month (10GB) | Easy | Budget option |
| **Vercel Blob** | 1GB free | Easy | Vercel users |

## Option 1: Backblaze B2 (Recommended - Free Tier)

### Why Backblaze B2?
- ✅ **Free tier**: 10GB storage, 1GB/day download
- ✅ **No egress fees** for first 1GB/day
- ✅ **Fast global CDN** (via Cloudflare)
- ✅ **Easy setup**

### Setup Steps

1. **Create Account**
   - Go to https://www.backblaze.com/b2/sign-up.html
   - Sign up for free account

2. **Create Bucket**
   - Go to **Buckets** → **Create a Bucket**
   - Name: `cabonegro-assets`
   - Set to **Public**
   - Choose location (US West recommended)

3. **Upload File**
   - Click your bucket
   - Click **Upload a File**
   - Upload `terrain-texture.png` (196MB)
   - Note the file URL format: `https://f000.backblazeb2.com/file/bucket-name/terrain-texture.png`

4. **Get Public URL**
   - Click on the uploaded file
   - Copy the **Friendly URL** or construct it:
     ```
     https://f000.backblazeb2.com/file/bucket-name/terrain-texture.png
     ```
   - Replace `f000` with your account ID (shown in bucket URL)

5. **Update Config**
   ```javascript
   // In src/config/assets.js
   const LARGE_FILE_CDN_URL = "https://f000.backblazeb2.com/file/cabonegro-assets";
   ```

### CORS Setup (if needed)
- Go to **CORS Rules** in bucket settings
- Add rule:
  ```
  Allowed Origins: *
  Allowed Operations: b2_download_file_by_name
  ```

---

## Option 2: AWS S3 + CloudFront

### Why AWS?
- ✅ Industry standard
- ✅ Highly reliable
- ✅ Global CDN (CloudFront)
- ⚠️ Costs money after free tier

### Setup Steps

1. **Create S3 Bucket**
   - Go to https://console.aws.amazon.com/s3
   - Create bucket: `cabonegro-assets`
   - Uncheck "Block all public access"
   - Enable static website hosting

2. **Upload File**
   - Upload `terrain-texture.png`
   - Set permissions to public read

3. **Create CloudFront Distribution**
   - Go to CloudFront in AWS Console
   - Create distribution
   - Origin: Your S3 bucket
   - Default cache behavior: Allow GET, HEAD
   - Copy the CloudFront URL

4. **Update Config**
   ```javascript
   const LARGE_FILE_CDN_URL = "https://d1234567890.cloudfront.net";
   ```

### Cost Estimate
- Storage: ~$0.004/month (196MB)
- Transfer: ~$0.09/GB (first 1GB free)
- CloudFront: ~$0.085/GB

---

## Option 3: DigitalOcean Spaces

### Why DigitalOcean?
- ✅ Simple setup
- ✅ Built-in CDN
- ✅ $5/month for 250GB
- ✅ No egress fees

### Setup Steps

1. **Create Space**
   - Go to https://cloud.digitalocean.com/spaces
   - Create Space: `cabonegro-assets`
   - Choose region
   - Enable CDN

2. **Upload File**
   - Upload `terrain-texture.png`
   - Make it public

3. **Get CDN URL**
   - Your CDN URL will be: `https://cabonegro-assets.region.digitaloceanspaces.com`
   - Or use the CDN endpoint if enabled

4. **Update Config**
   ```javascript
   const LARGE_FILE_CDN_URL = "https://cabonegro-assets.nyc3.digitaloceanspaces.com";
   ```

---

## Option 4: Bunny CDN

### Why Bunny CDN?
- ✅ Very cheap ($1/month for 10GB)
- ✅ Fast performance
- ✅ Easy setup

### Setup Steps

1. **Create Account**
   - Go to https://bunny.net
   - Sign up (free trial)

2. **Create Storage Zone**
   - Go to **Storage** → **Add Storage Zone**
   - Name: `cabonegro-assets`
   - Choose region

3. **Upload File**
   - Use FTP or web interface
   - Upload `terrain-texture.png`

4. **Get URL**
   - Your URL: `https://storage.bunnycdn.com/cabonegro-assets/terrain-texture.png`

5. **Update Config**
   ```javascript
   const LARGE_FILE_CDN_URL = "https://storage.bunnycdn.com/cabonegro-assets";
   ```

---

## Option 5: Vercel Blob Storage

### Why Vercel Blob?
- ✅ Integrated with Vercel
- ✅ 1GB free tier
- ✅ Easy if already using Vercel

### Setup Steps

1. **Install Vercel Blob**
   ```bash
   npm install @vercel/blob
   ```

2. **Upload via API** (create a script)
   ```javascript
   import { put } from '@vercel/blob';
   
   const blob = await put('terrain-texture.png', file, {
     access: 'public',
   });
   console.log(blob.url);
   ```

3. **Update Config**
   ```javascript
   const LARGE_FILE_CDN_URL = "https://[your-blob-url].public.blob.vercel-storage.com";
   ```

---

## Testing Your CDN

After setting up, test the URL:

```bash
curl -I https://your-cdn-url.com/terrain-texture.png
```

Should return:
- `HTTP/2 200` or `HTTP/1.1 200 OK`
- `Content-Type: image/png`
- `Content-Length: 205520896` (or similar, ~196MB)

---

## Recommendation

**For free tier**: Use **Backblaze B2** - best free option with good performance.

**For production**: Use **AWS S3 + CloudFront** or **DigitalOcean Spaces** for reliability.

**For budget**: Use **Bunny CDN** at $1/month.

