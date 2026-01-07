# 6713 - Wall (Public Chat)

[![Open in CodeSandbox](https://img.shields.io/badge/Open%20in-CodeSandbox-blue?style=flat-square&logo=codesandbox)](https://codesandbox.io/p/github/luseafah/6713)

A full-featured public chat application with verification gating, COMA status system, and social interaction features.

## Quick Start

### Deploy to Replit
1. Click the "Import from GitHub" button on [Replit](https://replit.com)
2. Import this repository: `https://github.com/luseafah/6713`
3. Set environment variables in Replit's "Secrets" tab:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```
4. Click "Run" - Replit will automatically install dependencies and start the app

### Deploy to CodeSandbox
1. Click the badge above or visit [CodeSandbox](https://codesandbox.io)
2. Import this repository
3. Add environment variables (see [CODESANDBOX_SETUP.md](CODESANDBOX_SETUP.md))
4. Run `npm run dev`

### Local Development
```bash
npm install
cp .env.example .env.local
# Add your Supabase credentials to .env.local
npm run dev
```

## Features

### 🧱 Wall (Public Chat)
- **Full-screen chat interface** with pure black background (#000)
- **View access**: Everyone can read the Wall
- **Post access**: Only verified users (`is_verified === true`) can post
- **Real-time message updates** (polling every 3 seconds)
- **Message types**: Text, voice, and picture support

### ⏱️ 7-Second Slow Mode
- **Client & server-side cooldown** enforcement
- **UI feedback**: "Breathe... [X]s" countdown display
- **Disabled send button** during cooldown period

### 💀 COMA System
- **Whisper Mode**: COMA users can post with 50% opacity and italics
- **Pope AI Integration**: Auto-posts system warning when COMA user posts
- **Profile Modal**: Click username to see COMA reason and Wiki
- **Entry Ritual**: Choose "Choice" or "Quest" when entering COMA
- **Refill Economy**: 
  - 3 free refills to enter COMA
  - 1 refill regenerates every 24 hours
  - Costs 50 Talents if no refills available
  - 24-hour cooldown after exiting COMA

### ❤️ Reactions
- **Like system** with visual feedback
- **13+ cap**: Reactions display as "13+" when count exceeds 13

### 🧭 Navigation
- Fixed top navigation bar
- Links: Hue, Wall, Live, $$$4U

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Icons**: Lucide React
- **Date Utils**: date-fns

## Database Schema

### Tables
- `users` - Authentication and verification status
- `profiles` - User metadata, COMA status, refills, talents
- `wall_messages` - All chat messages
- `wall_reactions` - Message likes/reactions
- `post_cooldowns` - 7-second cooldown tracking

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Supabase

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Copy `.env.local.example` to `.env.local`
3. Add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Set Up Database

Run the SQL schema in your Supabase SQL editor:

```bash
# The schema is in: database/schema.sql
```

This will create:
- All required tables
- Indexes for performance
- Trigger for auto-regenerating COMA refills

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## API Routes

### Wall Messages
- `GET /api/wall/messages` - Fetch messages (with pagination)
- `POST /api/wall/messages` - Send a new message

### Reactions
- `GET /api/wall/reactions?message_id=X` - Get reaction count
- `POST /api/wall/reactions` - Toggle reaction

### Cooldown
- `GET /api/wall/cooldown?user_id=X` - Check if user can post

### COMA System
- `GET /api/coma/status?user_id=X` - Get COMA status and refills
- `POST /api/coma/enter` - Enter COMA (requires reason)
- `POST /api/coma/exit` - Exit COMA

### Profile
- `GET /api/profile?user_id=X` - Get user profile

## Project Structure

```
/workspaces/6713/
├── app/
│   ├── api/              # API routes
│   │   ├── wall/         # Wall endpoints
│   │   ├── coma/         # COMA system
│   │   └── profile/      # User profiles
│   ├── wall/             # Wall page
│   ├── settings/         # Settings page (COMA controls)
│   ├── layout.tsx        # Root layout
│   └── globals.css       # Global styles
├── components/
│   ├── Navigation.tsx    # Top navigation bar
│   ├── Wall.tsx          # Main Wall component
│   ├── ComaModal.tsx     # COMA user profile modal
│   └── ComaSettings.tsx  # COMA toggle & refills
├── database/
│   └── schema.sql        # Database schema
├── lib/
│   └── supabase.ts       # Supabase client
└── types/
    └── database.ts       # TypeScript types

```

## Key Features Implementation

### 7-Second Cooldown
The cooldown is enforced both client-side and server-side:
- Client displays countdown timer
- Server validates time since last post
- Returns 429 status with remaining time if violated

### COMA Whisper Logic
When a COMA user posts:
1. Message displays with 50% opacity and italics
2. Pope AI automatically posts warning
3. Clicking username opens modal with reason and wiki

### Reaction Cap
Reactions are counted normally but displayed as "13+" when exceeding 13.

### Refill Regeneration
- Refills auto-regenerate: 1 per 24 hours (max 3)
- Checked on status API call
- Updated via database trigger

## Mock Data Note

For demo purposes, the app uses a mock user ID (`demo-user-id`). In production:
1. Implement proper authentication (Supabase Auth, NextAuth, etc.)
2. Replace mock user with actual authenticated user
3. Add Row Level Security (RLS) policies in Supabase

## Future Enhancements

- [ ] Voice message support
- [ ] Picture upload functionality  
- [ ] Real-time updates with Supabase Realtime
- [ ] User authentication system
- [ ] Profile editing
- [ ] Search and filtering
- [ ] Notification system
- [ ] Admin controls for Pope AI

## License

See LICENSE file for details.