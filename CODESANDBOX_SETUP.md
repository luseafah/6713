# CodeSandbox & Supabase Setup Guide

## Quick Start

This project is fully configured for CodeSandbox and Supabase integration.

### 1. Open in CodeSandbox

Click the button or import the GitHub repository directly into CodeSandbox.

### 2. Configure Environment Variables

In CodeSandbox, go to **Server Control Panel** → **Secrets** and add:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_APP_URL=https://your-sandbox-url.csb.app
```

### 3. Install Dependencies

CodeSandbox will automatically install dependencies. If needed, run:

```bash
npm install
```

### 4. Start Development Server

```bash
npm run dev
```

The app will be available at `https://your-sandbox-url.csb.app`

## Supabase Configuration

### Get Your Supabase Credentials

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Database Setup

Run the SQL migrations in your Supabase SQL Editor:

```bash
# Check the supabase/functions directory for migration files
```

## Features Enabled

✅ Next.js 14 with App Router  
✅ Supabase Authentication  
✅ Real-time Subscriptions  
✅ TypeScript Support  
✅ Tailwind CSS  
✅ Automatic Hot Reload  
✅ CodeSandbox Browser View  

## Troubleshooting

### Environment Variables Not Loading

1. Make sure variables start with `NEXT_PUBLIC_`
2. Restart the development server after adding secrets
3. Check the Console for specific error messages

### Supabase Connection Issues

1. Verify your Supabase project is active
2. Check that the URL and anon key are correct
3. Ensure your project's RLS policies are configured

### Port Issues

The app runs on port 3000 by default. CodeSandbox automatically handles port forwarding.

## File Structure

```
/app          - Next.js App Router pages
/components   - React components
/lib          - Utilities and Supabase client
/supabase     - Database functions and migrations
/types        - TypeScript type definitions
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Support

For issues or questions, check the README.md and project documentation files.
