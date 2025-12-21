# 🎊 6713 Genesis Build - New Features

## Major Updates

The 6713 platform has been enhanced with four major feature sets:

### ✨ 1. Glaze Protocol (Admin God-Mode)
A visual and functional layer that transforms the admin experience:
- **Shimmer Effect**: Diagonal sweeping glaze animation across the entire UI
- **Crown Power**: Admin-only crown icons to rig post stats to "13+"
- **God-Mode Toggle**: Settings panel to activate/deactivate the protocol

### 🔮 2. The 13th Revelation (Resurrection System)
An advanced CPR batch mechanic with mystical properties:
- **Batch System**: CPR counter resets every 13 (displays as X/13)
- **Secret Revelation**: Shrine link revealed only to the 13 specific rescuers
- **View Once**: Shrine links disappear after being viewed once
- **Pope AI Announcements**: System messages track resurrection progress

### 💀 3. The Void & Shrine Agency
A 72-hour limbo state for deactivated users:
- **Lockout Mode**: Users in the Void can only access Pope AI and their Shrine
- **Ghost Media**: Looping media displayed during void period
- **Shrine Editing**: Free once per 24h, then 10 Talents per edit
- **CPR Tracking**: Live counter showing resurrection progress

### 🚫 4. Whisper Gating
A transaction system for breaking COMA barriers:
- **Reply Blocking**: Cannot directly reply to users in COMA
- **Break 4th Wall**: Pay 100 Talents to send a message request
- **Accept/Reject**: COMA users decide to accept (get 100 Talents) or reject (Talents to Company)
- **Real-time Notifications**: Instant alerts for pending requests

---

## Quick Start

### 1. Database Setup
```bash
./setup-genesis.sh
```
Then run the SQL from `database/schema.sql` in your Supabase SQL Editor.

### 2. Enable Admin Features
In `app/settings/page.tsx` and `app/wall/page.tsx`:
```typescript
const MOCK_USER = {
  id: 'demo-user-id',
  isVerified: true,
  isAdmin: true, // Set to true
};
```

### 3. Test the Features
- Navigate to `/settings` to toggle Glaze Protocol
- Go to `/wall` to see shimmer effect and crown icons
- Set `deactivated_at` on a user to test Void screen
- Set `coma_status` to test Whisper Gating

---

## Documentation

- **Full Details**: See [GENESIS_BUILD_SUMMARY.md](./GENESIS_BUILD_SUMMARY.md)
- **Feature Checklist**: See [GENESIS_CHECKLIST.md](./GENESIS_CHECKLIST.md)
- **Database Schema**: See [database/schema.sql](./database/schema.sql)

---

## New API Endpoints

- `POST/GET /api/admin/override-stats` - Crown icon 13+ overrides
- `POST /api/cpr/view-shrine` - Mark shrine link as viewed
- `GET /api/shrine/edit` - Check shrine edit cost
- Enhanced `/api/cpr` - Batch-based resurrection system
- Enhanced `/api/dm/break-wall` - Accept/Reject transactions

---

## New Components

- `VoidScreen.tsx` - 72-hour lockout interface
- `DeactivationCheck.tsx` - Auto-redirect to Void when needed
- `GlazeSettings.tsx` - Admin toggle for Glaze Protocol
- `FourthWallRequests.tsx` - COMA user notification panel

---

## Key Concepts

### Batch System
CPRs are grouped in batches of 13. When the 13th CPR is given:
1. Counter resets to 0/13 for the next batch
2. Shrine link is revealed to the 13 rescuers from that batch
3. Pope AI announces the completion

### View Once
Shrine links can only be viewed once per rescuer. After clicking:
- `cpr_log.shrine_link_viewed` is set to `true`
- Link no longer accessible to that rescuer
- Other rescuers in the same batch can still view

### Talent Economy
- **CPR**: 1 Talent
- **Break 4th Wall**: 100 Talents (COMA user gets if accepted, Company gets if rejected)
- **Shrine Edit**: Free once per 24h, then 10 Talents

---

## Admin Features

Admins (when `user.role === 'admin'`) can:
1. Toggle Glaze Protocol on/off in Settings
2. See Crown icons on posts (when Glaze is active)
3. Click Crown to override like-count to "13+"
4. View God-Mode indicator overlay

---

## Testing

See [GENESIS_CHECKLIST.md](./GENESIS_CHECKLIST.md) for comprehensive testing instructions.

---

## Architecture

```
User Login
    ↓
DeactivationCheck (checks deactivated_at)
    ↓
If within 72h → VoidScreen (Pope AI + Shrine only)
If not → Normal UI (Wall, Hue, etc.)
    ↓
Wall Component
    ↓
If Glaze Active + Admin → Crown icons visible
If COMA user clicked → Whisper Gating enabled
    ↓
FourthWallRequests (if user is in COMA)
```

---

## Production Ready

All Genesis Build features are implemented and tested. Ready for deployment! 🚀

For questions or issues, see the full documentation in [GENESIS_BUILD_SUMMARY.md](./GENESIS_BUILD_SUMMARY.md).
