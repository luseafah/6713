# 6713 - Sovereign Social Application

A next-generation social platform with unique COMA mechanics, verification systems, and talent economy.

## Features

### 🎨 UI Architecture
- **Top-Heavy Command Center**: Fixed navigation bar with glassmorphism design
- **Pure Black Theme**: #000 background with white text for maximum contrast
- **Tab Navigation**: Hue, Wall, Live, $$$4U
- **Upload Button**: Centered + button for verified users only

### 💬 COMA Logic & Whispers
- **COMA Mode**: Toggle in settings to activate private mode
  - Profile becomes blurred
  - Grid is hidden
  - Only one-way "Whispers" can be sent
- **4th Wall Break**: Recipients can pay 100 Talents to reply to COMA users
  - If accepted: Sender gets 100 Talents, recipient can reply once
  - If rejected: 100 Talents go to the Company

### ✅ Verification & Admin System
- **Pope AI**: Direct admin DM route for ID submissions
- **Admin Powers**: VERIFY and MAKE ADMIN buttons in Pope AI chat
- **First User**: Automatically becomes admin and verified

### 💎 Talent Economy
- **Starting Balance**: 100 Talents per user
- **Purchase Gating**: Only verified users can purchase Talents
- **4th Wall Breaks**: Cost 100 Talents

### 🛡️ Self-Kill Feature
- Deactivation system with `deactivated_at` timestamp
- CPR counter for reactivation attempts

## Database Schema

### Profiles Table
```sql
- id: UUID (Primary Key)
- username: TEXT (Unique)
- is_verified: BOOLEAN (Default: false)
- role: TEXT (Default: 'user', Options: 'user' | 'admin')
- coma_status: BOOLEAN (Default: true)
- talent_balance: INTEGER (Default: 100)
- deactivated_at: TIMESTAMP (Default: NULL)
- cpr_count: INTEGER (Default: 0)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### Messages Table
```sql
- id: UUID (Primary Key)
- sender_id: UUID (Foreign Key -> profiles.id)
- recipient_id: UUID (Foreign Key -> profiles.id)
- content: TEXT
- is_whisper: BOOLEAN (Default: false)
- created_at: TIMESTAMP
```

### Fourth Wall Breaks Table
```sql
- id: UUID (Primary Key)
- sender_id: UUID (Foreign Key -> profiles.id)
- recipient_id: UUID (Foreign Key -> profiles.id)
- status: TEXT (Options: 'pending' | 'accepted' | 'rejected')
- created_at: TIMESTAMP
```

### Posts, Likes, Comments, Saves Tables
Standard social media tables for content management.

## Tech Stack

- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with glassmorphism utilities
- **Database**: Supabase (PostgreSQL)
- **Icons**: Lucide React
- **Authentication**: Supabase Auth (to be implemented)

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/luseafah/6713.git
cd 6713
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

4. Run the database migration:
- Go to your Supabase project dashboard
- Navigate to SQL Editor
- Copy and paste the contents of `supabase/migrations/20231219_init_schema.sql`
- Execute the migration

5. Start the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
6713/
├── app/                    # Next.js app directory
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── NavigationBar.tsx  # Top navigation with tabs
│   ├── InteractionStack.tsx # Right-side icon stack
│   ├── SettingsModal.tsx  # Settings with COMA toggle
│   ├── DMModal.tsx        # Direct messages & Whispers
│   └── Post.tsx           # Post component
├── lib/                   # Utilities
│   └── supabase.ts        # Supabase client
├── types/                 # TypeScript types
│   └── database.ts        # Database type definitions
├── supabase/             # Database files
│   └── migrations/       # SQL migrations
└── public/               # Static assets
```

## Key Components

### NavigationBar
Top-fixed navigation with glassmorphism effect, containing:
- Logo/Brand (6713)
- Tabs: Hue, Wall, Live, $$$4U
- Upload button (visible only to verified users)

### InteractionStack
Vertical icon stack on the right edge with:
1. Gear icon (Settings)
2. Pulse icon (DMs)
3. Avatar with QT Blimp timer
4. Like (with count)
5. Comment (with count)
6. Share (native share sheet)
7. Save/Bookmark

### SettingsModal
Settings interface featuring:
- Profile information display
- COMA toggle switch
- Whisper mode explanation
- Account management options

### DMModal
Messaging interface with:
- Standard messaging for normal users
- Whisper mode for COMA users
- 4th Wall Break payment option
- Admin controls (VERIFY & MAKE ADMIN) for Pope AI chats

## Implementation Status

✅ **Completed:**
- Project setup and configuration
- Database schema design
- Core UI components
- Navigation system
- Settings with COMA toggle
- DM/Whisper interface
- Admin controls in Pope AI chat
- Post feed component
- Interaction stack
- Glassmorphism theme

🚧 **To Be Implemented:**
- Supabase authentication integration
- Real-time database operations
- File upload for posts
- 4th Wall Break payment processing
- Profile blur/grid hiding for COMA users
- Self-Kill (account deactivation) flow
- Talent purchase system
- Real-time messaging
- QT Blimp timer logic
- Image/video gallery access

## Development Guidelines

### Styling
- Use pure black (#000) for backgrounds
- White (#FFF) text for maximum contrast
- Glassmorphism: `bg-black/40 backdrop-blur-xl border border-white/10`
- Purple accents for COMA-related features

### COMA Logic
When `coma_status` is `true`:
1. User's profile becomes blurred
2. User's grid/posts are hidden
3. User can only send Whispers (one-way messages)
4. Recipients cannot reply unless:
   - Sender toggles COMA off, OR
   - Recipient pays 100 Talents for 4th Wall Break

### Admin Initialization
The database automatically assigns the first user:
- `role = 'admin'`
- `is_verified = true`

### Verification Flow
1. User sends ID photo to Pope AI via DM
2. Admin reviews in Pope AI chat
3. Admin clicks VERIFY or MAKE ADMIN button
4. Database updates instantly

## Contributing

This is a sovereign application. Contributions should align with the core vision:
- Maintain the COMA mechanics
- Preserve the talent economy
- Keep the UI pure black with glassmorphism
- Respect the verification gating

## License

ISC

## Contact

For questions or support, reach out through the Pope AI admin channel.
