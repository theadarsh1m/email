# EmailTriageBot - Vercel Deployment Guide

## Prerequisites
- ✅ Vercel CLI installed (`vercel --version` shows 41.7.8)
- ✅ Build process working (`npm run build` successful)
- ✅ Environment variables configured

## Environment Variables for Vercel

You'll need to set these environment variables in your Vercel dashboard:

```bash
DATABASE_URL=postgresql://neondb_owner:npg_kuim2BhJNDK7@ep-lucky-shadow-aggx5fl3.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require
SESSION_SECRET=aj2p/srMQDG5UuD7nNWPKhVjJmmcFnVtrmgx7xlX9kChZGBH6DprHE715y+ENrz+vz2XXet1HsM3Cl6JtOOIrQ==
PGDATABASE=neondb
PGHOST=ep-lucky-shadow-aggx5fl3.c-2.eu-central-1.aws.neon.tech
PGPORT=5432
PGUSER=neondb_owner
PGPASSWORD=npg_kuim2BhJNDK7
GOOGLE_API_KEY=AIzaSyBBbRD0PId3G4OsfWGtV6FpRkzfDQzGs8U
GEMINI_API_KEY=AIzaSyBBbRD0PId3G4OsfWGtV6FpRkzfDQzGs8U
NODE_ENV=production
```

## Deployment Steps

### Option 1: Deploy via CLI (Recommended)

1. **Login to Vercel**:
   ```bash
   vercel login
   ```

2. **Deploy the project**:
   ```bash
   vercel --prod
   ```

3. **Set environment variables** (if not set via dashboard):
   ```bash
   vercel env add DATABASE_URL
   vercel env add SESSION_SECRET
   vercel env add GOOGLE_API_KEY
   # ... add all other environment variables
   ```

### Option 2: Deploy via GitHub

1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit for EmailTriageBot"
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

2. **Import to Vercel**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository
   - Configure environment variables
   - Deploy

## What's Configured

### 1. **Serverless API Functions**
- All API routes are handled by `/api/index.ts`
- Proper CORS headers for frontend integration
- Error handling and logging

### 2. **Static File Serving**
- Frontend built to `dist/public`
- All non-API routes serve the React app
- SPA routing handled properly

### 3. **Database Connection**
- Uses Neon PostgreSQL (already configured)
- Connection pooling for serverless functions
- Environment variables loaded via dotenv

### 4. **Build Configuration**
- Vite builds the frontend
- TypeScript compilation
- Asset optimization

## Post-Deployment

### 1. **Verify Deployment**
- Check that your app loads at the Vercel URL
- Test API endpoints (e.g., `/api/emails`)
- Verify database connectivity

### 2. **Monitor Logs**
- Use Vercel dashboard to monitor function logs
- Check for any runtime errors

### 3. **Custom Domain (Optional)**
- Add your custom domain in Vercel dashboard
- Configure DNS settings

## Troubleshooting

### If API routes don't work:
- Check environment variables are set correctly
- Verify database connection string
- Check Vercel function logs

### If frontend doesn't load:
- Verify build completed successfully
- Check that `dist/public` contains built assets
- Ensure routing is configured correctly

### If database connections fail:
- Verify DATABASE_URL is correct
- Check that Neon database is accessible
- Confirm all database credentials are set

## Local vs Production Differences

- **Local**: Uses `tsx` to run TypeScript directly
- **Production**: Uses compiled serverless functions
- **Database**: Same Neon instance for both
- **Environment**: Loaded from `.env` locally, from Vercel env vars in production

## Cost Optimization

- Vercel Free Tier includes:
  - 100GB bandwidth
  - 100GB-hours of serverless function execution
  - Unlimited static requests

Perfect for development and small-scale production use!
