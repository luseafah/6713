# 🚀 Deploy Database Migrations

## Quick Start (3 steps)

### 1. Get your service role key
Go to: https://supabase.com/dashboard/project/vsxrvrtnwvslmuvykhhy/settings/api

Copy the **service_role** key (it's under "Project API keys" - click "Reveal" to see it)

### 2. Add it to .env.local
Open `.env.local` and replace:
```bash
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

With your actual key:
```bash
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Run the deployment script
```bash
python3 scripts/deploy-with-service-key.py
```

## What gets deployed

✅ **Master Schema** (DEPLOY-ALL-IN-ONE.sql)
- `profiles` table linked to `auth.users`
- Auto-profile creation trigger
- Helper functions: `get_username()`, `get_user_by_username()`, `is_admin()`, `throw_talents()`
- Core tables: `wall_messages`, `wall_reactions`, `talent_transactions`, `system_settings`

✅ **Wall Chat Heartbeat** (migration-wall-chat-heartbeat.sql)
- Slash moderation system
- Story slider (24h expiring posts)
- Typing/online presence indicators
- Verified user reactions

✅ **Hamburger Search** (migration-hamburger-search.sql)
- Search history tracking
- Trending tags system
- Slashed tags filtering
- User search function

✅ **Profile Page** (migration-profile-page.sql)
- Anchor posts
- Pinned content
- Quote-tweet tracking
- CPR/connection cuts
- 4th wall breaking

✅ **Pulse Chat** (migration-pulse-chat.sql)
- Chat threads & messages
- Conversation quote-tweets
- Pope AI integration
- Message reactions

## After deployment

1. **Verify tables created**: Go to Supabase Dashboard → Table Editor
2. **Test sign-up**: Create account at your app → should auto-create profile
3. **Test Wall Chat**: Post a message → should appear instantly
4. **Deploy to Replit**: If not already deployed

## Troubleshooting

**Script fails?** 
→ Copy/paste migrations manually in Supabase Dashboard SQL Editor

**Tables already exist?**
→ All migrations use `IF NOT EXISTS` - safe to re-run

**Need to reset database?**
→ Drop all tables in Supabase Dashboard first, then re-run script
