# API Deployment Instructions

## Deploy API Separately to Vercel

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Click "Add New Project"**
3. **Import the same GitHub repository**: `JulioLunaAlva/Tfbe-roadmap`
4. **Configure the project**:
   - **Project Name**: `tfbe-roadmap-api` (or similar)
   - **Root Directory**: `api` ← **IMPORTANT!**
   - **Framework Preset**: Other
   - **Build Command**: Leave empty
   - **Output Directory**: Leave empty
   - **Install Command**: `npm install`

5. **Add Environment Variables** (same as frontend project):
   - `DATABASE_URL`: (your PostgreSQL connection string)
   - `JWT_SECRET`: (your JWT secret)
   - `SMTP_HOST`: (your SMTP host)

6. **Deploy**

7. **Copy the API URL** (will be something like `https://tfbe-roadmap-api.vercel.app`)

## Update Frontend to Use New API URL

After API is deployed, update the frontend:

1. Go to frontend Vercel project settings
2. Add environment variable:
   - `VITE_API_URL`: `https://tfbe-roadmap-api.vercel.app`

3. Update `client/src/` files to use this URL instead of `/api`

## Why This Works

- **Separate builds**: Each part compiles independently
- **No routing conflicts**: API handles all routes directly
- **Easier debugging**: Clear separation of logs and errors
- **Standard Vercel pattern**: This is how Vercel recommends deploying Express apps

## Alternative: Use Existing API Project

If you already have a Vercel project for the API:
1. Go to that project's settings
2. Change **Root Directory** to `api`
3. Redeploy

The API will be available at its own URL and the frontend will call it via CORS.
