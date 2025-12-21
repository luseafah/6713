# 6713 Wall Project Structure

```
/workspaces/6713/
│
├── 📁 app/                         # Next.js App Router
│   ├── 📁 api/                     # API Routes (Server-side)
│   │   ├── 📁 wall/                # Wall-related endpoints
│   │   │   ├── 📁 messages/
│   │   │   │   └── route.ts        # GET/POST messages
│   │   │   ├── 📁 reactions/
│   │   │   │   └── route.ts        # GET/POST reactions
│   │   │   └── 📁 cooldown/
│   │   │       └── route.ts        # GET cooldown status
│   │   │
│   │   ├── 📁 coma/                # COMA system endpoints
│   │   │   ├── 📁 enter/
│   │   │   │   └── route.ts        # POST enter COMA
│   │   │   ├── 📁 exit/
│   │   │   │   └── route.ts        # POST exit COMA
│   │   │   └── 📁 status/
│   │   │       └── route.ts        # GET COMA status
│   │   │
│   │   └── 📁 profile/
│   │       └── route.ts            # GET user profile
│   │
│   ├── 📁 wall/                    # Wall page
│   │   └── page.tsx                # Main Wall interface
│   │
│   ├── 📁 settings/                # Settings page
│   │   └── page.tsx                # COMA controls
│   │
│   ├── 📁 hue/                     # Hue page (placeholder)
│   │   └── page.tsx
│   │
│   ├── 📁 live/                    # Live page (placeholder)
│   │   └── page.tsx
│   │
│   ├── 📁 money/                   # $$$4U page (placeholder)
│   │   └── page.tsx
│   │
│   ├── layout.tsx                  # Root layout with metadata
│   ├── page.tsx                    # Home (redirects to /wall)
│   └── globals.css                 # Global styles (Tailwind)
│
├── 📁 components/                  # React Components
│   ├── Wall.tsx                    # Main Wall chat component
│   ├── Navigation.tsx              # Top navigation bar
│   ├── ComaModal.tsx               # COMA user profile modal
│   └── ComaSettings.tsx            # COMA toggle & settings
│
├── 📁 database/                    # Database files
│   └── schema.sql                  # PostgreSQL schema (Supabase)
│
├── 📁 lib/                         # Utility libraries
│   └── supabase.ts                 # Supabase client config
│
├── 📁 types/                       # TypeScript types
│   └── database.ts                 # Database type definitions
│
├── 📄 Configuration Files
│   ├── package.json                # Dependencies & scripts
│   ├── tsconfig.json               # TypeScript config
│   ├── tailwind.config.ts          # Tailwind CSS config
│   ├── postcss.config.js           # PostCSS config
│   ├── next.config.js              # Next.js config
│   ├── .env.local.example          # Environment variables template
│   └── .gitignore                  # Git ignore rules
│
├── 📄 Documentation
│   ├── README.md                   # Main project documentation
│   ├── QUICKSTART.md               # Quick start guide
│   ├── COMPONENTS.md               # Component documentation
│   ├── BLUEPRINT_IMPLEMENTATION.md # Blueprint checklist
│   └── STRUCTURE.md                # This file
│
└── 📄 Scripts
    ├── setup.sh                    # Setup automation script
    └── LICENSE                     # Project license

```

## 🔄 Data Flow

### Message Posting Flow
```
User Types Message
       ↓
[Wall.tsx] handleSendMessage()
       ↓
POST /api/wall/messages
       ↓
[route.ts] Validates:
  - User verified?
  - Cooldown OK?
  - COMA status
       ↓
Insert to wall_messages
       ↓
If COMA user → Pope AI auto-post
       ↓
Update post_cooldowns
       ↓
Response to client
       ↓
[Wall.tsx] Refresh messages
       ↓
Display on screen
```

### COMA Entry Flow
```
User Toggles COMA
       ↓
[ComaSettings.tsx] Shows reason modal
       ↓
User selects "Choice" or "Quest"
       ↓
POST /api/coma/enter
       ↓
[route.ts] Validates:
  - Not already in COMA?
  - 24h cooldown expired?
  - Has refills or 50 talents?
       ↓
Deduct refill or talents
       ↓
Update profiles table:
  - coma_status = true
  - coma_reason = selected
  - coma_entered_at = now
       ↓
Response to client
       ↓
[ComaSettings.tsx] Update UI
```

### Reaction Flow
```
User Clicks Heart
       ↓
[Wall.tsx] handleReaction()
       ↓
POST /api/wall/reactions
       ↓
[route.ts] Check existing reaction
       ↓
If exists → DELETE (unlike)
If not → INSERT (like)
       ↓
Response to client
       ↓
[Wall.tsx] Refresh messages
       ↓
Display count (13+ cap)
```

## 🗄️ Database Tables

### users
Primary authentication table
- `id` (UUID, primary key)
- `email` (unique)
- `username` (unique)
- `is_verified` (boolean) ← Post access gate

### profiles
User metadata and COMA system
- `id` (UUID, references users)
- `coma_status` (boolean)
- `coma_reason` ('Choice' | 'Quest')
- `coma_refills` (integer, max 3)
- `talents` (integer, currency)
- `wiki` (text, user bio)

### wall_messages
All chat messages
- `id` (UUID, primary key)
- `user_id` (references users)
- `content` (text)
- `is_coma_whisper` (boolean)
- `is_pope_ai` (boolean)
- `created_at` (timestamp)

### wall_reactions
Message likes/reactions
- `id` (UUID, primary key)
- `message_id` (references wall_messages)
- `user_id` (references users)
- Unique constraint: (message_id, user_id)

### post_cooldowns
7-second slow mode tracking
- `user_id` (UUID, primary key)
- `last_post_at` (timestamp)

## 🎨 Styling System

### Color Palette
- **Background**: `#000000` (pure black)
- **Text**: `#ffffff` (white)
- **Borders**: `white/10` to `white/40` (opacity variants)
- **COMA Whisper**: 50% opacity + italics
- **Pope AI**: Red theme (`red-400`, `red-900/20`)
- **Warnings**: Yellow theme (`yellow-400`, `yellow-900/20`)

### Layout Structure
```
┌─────────────────────────────┐
│   Navigation (fixed top)    │ ← 64px height
├─────────────────────────────┤
│                             │
│   Messages Area (scroll)    │ ← Flex-1
│                             │
│   [Message bubbles...]      │
│                             │
├─────────────────────────────┤
│   Input Area (fixed bottom) │ ← Auto height
│   [Text input] [Send btn]   │
└─────────────────────────────┘
```

## 🔌 API Endpoints Summary

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| `/api/wall/messages` | GET | Fetch messages | No (read all) |
| `/api/wall/messages` | POST | Send message | Yes (verified) |
| `/api/wall/reactions` | GET | Get reaction count | No |
| `/api/wall/reactions` | POST | Toggle reaction | Yes |
| `/api/wall/cooldown` | GET | Check cooldown | Yes |
| `/api/coma/status` | GET | Get COMA info | Yes |
| `/api/coma/enter` | POST | Enter COMA | Yes |
| `/api/coma/exit` | POST | Exit COMA | Yes |
| `/api/profile` | GET | Get user profile | No |

## 🔧 Key Technologies

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Icons**: Lucide React
- **Date Formatting**: date-fns
- **State Management**: React Hooks (useState, useEffect)

## 📦 NPM Scripts

```bash
npm run dev      # Start development server (port 3000)
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## 🚀 Deployment Checklist

1. Set up Supabase project
2. Run database/schema.sql
3. Configure environment variables
4. Build the application
5. Deploy to Vercel/Netlify
6. Set up domain
7. Enable monitoring
8. Configure authentication
9. Add RLS policies
10. Test all features

## 📱 Responsive Design

The application is designed mobile-first:
- Navigation: Stacks icons on small screens
- Wall: Full-width messages
- Input: Stacks button below input on narrow screens
- Modals: Responsive max-width with margins

## 🔐 Security Considerations

1. **Server-side validation**: All critical operations validated in API routes
2. **Cooldown enforcement**: Both client and server-side
3. **SQL injection**: Protected by Supabase client
4. **XSS protection**: React auto-escapes content
5. **Rate limiting**: Cooldown system prevents spam
6. **Authentication**: Mock user for demo (implement proper auth for production)

## 🎯 Future Enhancements

- [ ] WebSocket/Supabase Realtime for instant updates
- [ ] Voice message recording and playback
- [ ] Image upload with CDN storage
- [ ] User authentication (Supabase Auth)
- [ ] Private messaging
- [ ] User blocking/reporting
- [ ] Admin dashboard
- [ ] Analytics and metrics
- [ ] Mobile app (React Native)
- [ ] Push notifications
