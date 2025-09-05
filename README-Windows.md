# EmailTriageBot - Windows Setup Guide

## Prerequisites
- ✅ Node.js v22.15.0+ (already installed)
- ✅ npm (already installed)
- ✅ PowerShell execution policy set to RemoteSigned

## Quick Start

### Option 1: Using npm directly
```bash
npm run dev
```

### Option 2: Using the PowerShell script
```bash
./start-dev.ps1
```

### Option 3: Using the batch file
```bash
start-dev.bat
```

## What's Fixed

1. **Environment Variables**: Added `dotenv` package to load `.env` file properly
2. **Cross-platform Scripts**: Added `cross-env` for Windows compatibility
3. **Server Configuration**: Fixed server binding from `0.0.0.0` to `127.0.0.1` for Windows
4. **PowerShell Policy**: Set execution policy to allow npm scripts
5. **Database Setup**: Automatically configured with Neon PostgreSQL

## Access the Application

Once running, open your browser and go to:
```
http://127.0.0.1:5000
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run dev:win` - Windows-specific development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run check` - Run TypeScript checks
- `npm run db:push` - Update database schema

## Environment Variables

All environment variables are configured in the `.env` file:
- `DATABASE_URL` - Neon PostgreSQL connection
- `GOOGLE_API_KEY` / `GEMINI_API_KEY` - AI service configuration
- `SESSION_SECRET` - Application security

## Troubleshooting

### If you see "execution policy" errors:
```bash
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### If the server won't start:
1. Make sure port 5000 is not in use by another application
2. Check that all dependencies are installed: `npm install`
3. Verify the database connection in `.env`

### If you need to reset the database:
```bash
npm run db:push
```
