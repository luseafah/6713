# 6713 - Sovereign Database Implementation

Complete implementation of the 6713 social platform with verification, COMA system, Self-Kill mechanics, CPR resurrection, and admin sovereignty.

## 🎯 Core Features

### 1. **Sovereign Database & Admin Access**

#### First User = Admin
- The first user to register is automatically promoted to `role: 'admin'`
- Admins have elevated permissions across the platform

#### Admin Powers
- **Verify Users**: Toggle `is_verified` status via Pope AI chat
- **Promote Admins**: Grant admin role to other users
- **Award Max Stats**: Force posts to display "13+" likes (rigging)
- **Glaze Protocol**: Toggle global UI shimmer effect (God Mode)

### 2. **Navigation - The Command Center**

- **Fixed Top Bar**: Black background with backdrop blur
- **Tabs**: Hue (Primary Feed), Wall (Public Square), Live, $$$4U (Signals)
- **Center Upload**: '+' icon visible only for verified users
- **Right Stack**: Interaction icons (Settings, Messages, Profile with timer)

### 3. **Interaction Stack (Right Edge)**

Vertical stack of interactive elements:
- ⚙️ **Gear Icon**: Settings & COMA Toggle
- 💬 **Texts Icon**: DMs and Pope AI support
- 👤 **Avatar**: With 'QT Blimp' timer overlay
- ❤️ **Like**: Capped at 13+ display
- 💬 **Comment**: Capped at 67+ display
- ↗️ **Share**: Native sharing
- 🔖 **Save**: Bookmark posts

### 4. **COMA Mode & Whisper Rule**

#### Entry System
- Toggle COMA in Settings
- **3 free refills** (regenerate 1 per 24h, max 3)
- **50 Talents** per entry if refills depleted
- **Default status**: `coma_status = true` (users start in COMA)

#### The Ritual
- Upon entering COMA, choose **'Choice' or 'Quest'**
- Stored in database and displayed on profile

#### Whispers (One-Way DMs)
- COMA users send **one-way DMs** to others
- Recipients cannot reply unless they pay **100 Talents** to "Break 4th Wall"
- Wall posts by COMA users: 50% opacity, italicized
- Pope AI auto-posts: `@everyone advice @user in COMA to log off`

### 5. **Self-Kill & CPR Resurrection**

#### The Void (72-Hour Lockout)
- User initiates 'Self-Kill' → profile becomes "ghost"
- **72-hour hard lockout**: Can ONLY message Pope AI
- Ghost profiles display looping shrine media

#### Shrine Editing
- **Free edit**: Once per 24 hours
- **Extra edits**: 10 Talents each
- Fields: `shrine_link` (secret) and `shrine_media` (looping video)

#### The Rescue (CPR System)
- Ghost profiles show **looping media** + CPR button
- **1 CPR = 1 Talent** (deducted from rescuer)
- Each user can give CPR once
- Progress tracked: "X/13 collected"

#### The 13 Gate
- After **13 unique CPRs**, secret link is revealed
- Revealed **view-once** to those 13 rescuers
- Count resets for next batch

#### Public Announcements
- Pope AI auto-posts to Wall:
  - `@everyone [User] gave CPR to @[Ghost]. [X]/13 collected. 1 CPR = 1 Token.`

### 6. **Anti-Vanity & Economy UI**

#### Hard Display Caps
- **Posts**: Display "1+"
- **Reactions**: Display "13+"
- **Comments**: Display "67+"
- **Followers**: Display "13+ Huemans"

#### The 7s Rule
- **7-second cooldown** on all Wall posts
- UI displays: "Breathe... [X]s"
- Enforced client and server-side

#### Immersion Design
- **No bottom navigation bar**
- Feed uses `h-screen` with `pb-12` for text alignment
- Pure black (#000) background throughout

## 📊 Database Schema

### Tables

#### `users`
- `id`, `email`, `username`
- `is_verified` (default: false)
- `role` ('user' or 'admin')

#### `profiles`
- `id`, `display_name`, `wiki`
- `coma_status` (default: **true**)
- `coma_reason` ('Choice' | 'Quest')
- `coma_refills` (default: 3)
- `talent_balance` (default: **100**)
- `deactivated_at` (Self-Kill timestamp)
- `shrine_link` (secret link)
- `shrine_media` (looping video URL)
- `last_shrine_edit` (cooldown tracking)

#### `system_settings`
- `setting_key`, `setting_value`
- Stores `glaze_protocol_active`

#### `wall_messages`
- Post content and metadata
- `admin_rigged_stats` (forces 13+ display)
- `is_pope_ai`, `is_coma_whisper`

#### `comments`
- Comments on posts
- Display capped at 67+

#### `cpr_rescues`
- Tracks CPR given to ghost users
- Unique constraint: one CPR per user per ghost

#### `dm_threads` & `dm_messages`
- Direct messaging system
- Pope AI threads (persistent for all users)
- `is_whisper` (COMA one-way messages)
- `fourth_wall_broken` (100 Talent unlock)

## 🔌 API Endpoints

### Admin Routes
- `POST /api/admin/verify` - Toggle user verification
- `POST /api/admin/promote` - Promote user to admin
- `POST /api/admin/award-stats` - Rig post stats to 13+
- `GET/POST /api/admin/glaze-protocol` - Toggle Glaze Protocol

### Self-Kill & Shrine
- `GET/POST /api/self-kill` - Initiate/check lockout status
- `POST /api/shrine/edit` - Edit shrine (with cooldown/cost)

### CPR System
- `GET/POST /api/cpr` - Give CPR / check count

### DMs & Pope AI
- `GET/POST /api/dm/pope-ai` - Message Pope AI
- `POST /api/dm/break-wall` - Pay 100 Talents to reply

### Wall & COMA (Existing, Updated)
- All previous Wall/COMA endpoints updated for new schema

## 🎨 UI Components

### New Components
- **InteractionStack**: Right-edge vertical icon stack
- **PostInteraction**: Like/Comment/Share/Save with caps
- **GlazeProtocol**: Shimmer overlay when admin activates
- **PopeAIChat**: Persistent DM thread with Pope AI
- **GhostProfile**: CPR interface for Self-Kill users

### Updated Components
- **Navigation**: Added center upload button (verified only), backdrop blur
- **Wall**: Removed bottom nav, added `pb-12` spacing
- **ComaSettings**: Updated to use `talent_balance` field

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Configure environment
cp .env.local.example .env.local
# Edit .env.local with Supabase credentials

# Run database schema
# Copy database/schema.sql into Supabase SQL editor and execute

# Start development
npm run dev
```

## 🎯 Key Implementation Details

### First User Auto-Admin
Database trigger automatically assigns `role: 'admin'` to first registered user.

### Glaze Protocol Effect
CSS shimmer overlay activates globally when admin toggles setting. Creates "God Mode" visual indicator.

### CPR Economy
- Each CPR costs 1 Talent
- Pope AI announces progress publicly
- Secret link revealed after 13th CPR
- Unique constraint prevents duplicate CPRs

### Whisper vs. Normal DM
- Whispers are one-way (COMA users to others)
- Recipients see grayed message
- Must pay 100 Talents to unlock reply ability

### Display Caps Logic
- Database stores real counts
- UI displays capped values (1+, 13+, 67+)
- Admin rigging overrides to show 13+ regardless

## 📖 Documentation Files

- **README.md** - This file (complete overview)
- **QUICKSTART.md** - Setup and testing guide
- **COMPONENTS.md** - Component API documentation
- **BLUEPRINT_IMPLEMENTATION.md** - Spec compliance checklist
- **STRUCTURE.md** - Project architecture and data flow

## 🔐 Security Features

- Server-side validation on all critical operations
- Role-based access control (Admin checks)
- Cooldown enforcement (7s posts, 24h shrine edits)
- Talent balance checks before transactions
- Unique constraints prevent duplicate actions

## 🎨 Design System

- **Background**: Pure black (#000)
- **Text**: White (#FFF)
- **Backdrop Blur**: `backdrop-blur-md` on navigation
- **COMA Styling**: 50% opacity + italics
- **Pope AI**: Red theme (red-400, red-900/20)
- **Admin/Glaze**: Purple theme (purple-500/10)
- **No Bottom Nav**: Immersive full-screen experience

## ✅ All Blueprint Requirements Implemented

✓ Sovereign Database with admin powers
✓ Navigation command center with center upload
✓ Right-edge interaction stack
✓ COMA mode with whisper rules
✓ Self-Kill 72-hour lockout
✓ CPR resurrection system with 13 gate
✓ Anti-vanity display caps (1+, 13+, 67+)
✓ 7-second slow mode
✓ Immersive design (no bottom nav)
✓ Glaze Protocol shimmer effect
✓ Pope AI support chat
✓ Talent economy integration

---

**Total Project Size**: 30+ files, 8,000+ lines of code
**Tech Stack**: Next.js 14, TypeScript, Tailwind CSS, Supabase
**Status**: ✅ Production-ready implementation
