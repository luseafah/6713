# Quick Start Guide for 6713 Wall

## Installation

```bash
# Run the setup script
./setup.sh

# Or manually:
npm install
```

## Configuration

1. Create `.env.local`:
```bash
cp .env.local.example .env.local
```

2. Add your Supabase credentials to `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Database Setup

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and run the entire content of `database/schema.sql`

This creates:
- All tables (users, profiles, wall_messages, wall_reactions, post_cooldowns)
- Indexes for performance
- Auto-regeneration trigger for COMA refills

## Run the App

```bash
npm run dev
```

Visit: http://localhost:3000

## Testing the Features

### Wall Chat
1. Navigate to `/wall`
2. Type a message and send
3. Watch the 7-second "Breathe..." countdown
4. Click heart icon to react to messages

### COMA System
1. Navigate to `/settings`
2. Toggle COMA on (choose "Choice" or "Quest")
3. Post on Wall - notice 50% opacity and italics
4. See Pope AI auto-post warning
5. Click username to view COMA modal

### Reactions
1. Click heart on any message
2. Watch count increment
3. Count displays as "13+" when exceeding 13

## Troubleshooting

### "User not found" error
- The app uses a mock user ID for demo purposes
- In production, implement authentication
- For testing, create a user in Supabase:

```sql
INSERT INTO users (id, email, username, is_verified) 
VALUES ('demo-user-id', 'demo@example.com', 'DemoUser', true);

INSERT INTO profiles (id, talents, coma_refills) 
VALUES ('demo-user-id', 100, 3);
```

### Cooldown not working
- Ensure `post_cooldowns` table exists
- Check browser console for API errors
- Verify server-side cooldown logic in `/api/wall/messages`

### Messages not showing
- Check Supabase connection in browser console
- Verify environment variables are set
- Ensure database tables are created

## Key Files

- `components/Wall.tsx` - Main chat interface
- `components/ComaSettings.tsx` - COMA controls
- `app/api/wall/messages/route.ts` - Message API
- `app/api/coma/enter/route.ts` - COMA entry
- `database/schema.sql` - Database structure

## Demo Flow

1. **First Visit**: Go to `/wall` - see messages (read-only if not verified)
2. **Post Message**: Type and send - see 7s cooldown
3. **React**: Click hearts on messages
4. **Enter COMA**: Go to `/settings`, toggle on, choose reason
5. **Whisper Post**: Post on Wall - see special styling
6. **Pope AI**: See automatic warning post
7. **View Profile**: Click a COMA username - see modal
8. **Exit COMA**: Toggle off - see 24h cooldown timer

## Production Checklist

- [ ] Implement real authentication
- [ ] Add Row Level Security (RLS) policies
- [ ] Replace mock user IDs
- [ ] Add error boundaries
- [ ] Implement proper logging
- [ ] Add rate limiting
- [ ] Set up monitoring
- [ ] Add E2E tests
- [ ] Optimize database queries
- [ ] Add caching layer
