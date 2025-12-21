# Supabase + CodeSandbox Integration Checklist

## ✅ Configuration Files

- [x] `sandbox.config.json` - CodeSandbox template set to "next"
- [x] `.codesandbox/tasks.json` - Automated dev server startup
- [x] `next.config.js` - CORS headers and webpack fallbacks for browser compatibility
- [x] `.env.example` - Environment variable template
- [x] `lib/supabase.ts` - Supabase client with proper error handling
- [x] `package.json` - All dependencies including @supabase/supabase-js

## 🔧 Required Environment Variables

Add these in CodeSandbox Secrets or `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://[your-project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
NEXT_PUBLIC_APP_URL=https://[your-sandbox].csb.app
```

## 🚀 How to Open in CodeSandbox

### Method 1: Direct Import
1. Go to https://codesandbox.io
2. Click "Import" → "From GitHub"
3. Enter: `luseafah/6713`
4. Click "Import"

### Method 2: URL
Visit: https://codesandbox.io/p/github/luseafah/6713

### Method 3: Badge
Click the CodeSandbox badge in README.md

## 🗄️ Supabase Setup

1. **Create Project**: Go to https://app.supabase.com
2. **Get Credentials**: Settings → API
3. **Add to CodeSandbox**: Server Control Panel → Secrets
4. **Run Migrations**: Copy SQL from `/supabase/functions/` to SQL Editor

## 📦 Features Ready

- ✅ Next.js 14 App Router
- ✅ TypeScript
- ✅ Tailwind CSS
- ✅ Supabase Auth & Database
- ✅ Real-time subscriptions
- ✅ Hot module reloading
- ✅ Browser-compatible webpack config

## 🐛 Troubleshooting

### "Missing Supabase environment variables"
→ Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to Secrets

### Blank page on load
→ Check browser console for errors
→ Verify Supabase credentials are correct

### CSS not loading
→ Restart the dev server
→ Clear browser cache

### Real-time features not working
→ Check Supabase project is active
→ Verify RLS policies in Supabase dashboard

## 📝 Next Steps After Opening

1. Add environment variables in Secrets
2. Wait for `npm install` to complete
3. Click "Open Browser" button
4. App should load at port 3000
5. Check console for any errors

## 🔗 Useful Links

- [Supabase Dashboard](https://app.supabase.com)
- [CodeSandbox Docs](https://codesandbox.io/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [Project Documentation](./CODESANDBOX_SETUP.md)
