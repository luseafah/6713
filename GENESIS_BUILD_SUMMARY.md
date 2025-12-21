# 6713 Genesis Build - Implementation Summary

## Overview
This document details the complete implementation of the 6713 Genesis Build features including Glaze Protocol, 13th Revelation, Void & Shrine Agency, and Whisper Gating.

---

## 🎨 1. The Glaze Protocol (Admin God-Mode)

### Visual Signal
- **CSS Animation**: `glaze-shimmer` keyframe animation creates a diagonal white sheen that sweeps across the screen
- **Location**: `/app/globals.css`
- **Trigger**: Applied when `system_settings.glaze_active` is `true`
- **Component**: `GlazeProtocol.tsx` provides a fixed overlay with pointer-events-none

### The 13+ Override
- **Admin Feature**: When Glaze is active AND user is admin, Crown icons appear on posts
- **Functionality**: Clicking Crown instantly sets post's displayed like-count to "13+"
- **Storage**: `admin_post_overrides` table tracks which posts have overridden counts
- **API**: `/api/admin/override-stats/route.ts`

### Admin Settings
- **Location**: Settings page (`/app/settings/page.tsx`)
- **Component**: `GlazeSettings.tsx`
- **Access**: Only visible when `user.role === 'admin'`
- **Toggle**: Admin can turn Glaze Protocol on/off

---

## 🔮 2. The 13th Revelation (Resurrection Logic)

### CPR Batch System
- **Batch Logic**: Every 13 CPRs = 1 batch, counter resets to 0/13 after completion
- **Database**: New `cpr_log` table tracks CPRs with `batch_number`
- **Display**: Shows progress as X/13 (e.g., 1/13, 2/13... 13/13, then resets to 0/13)

### Secret Link Revelation
- **Unlock**: When 13th CPR is given, the Ghost's `shrine_link` is revealed
- **Access**: Only the 13 specific users who gave CPR in that batch can access
- **API**: `/api/cpr/route.ts` - GET endpoint with `rescuer_user_id` param

### View Once Logic
- **Implementation**: `cpr_log.shrine_link_viewed` boolean field
- **Marking**: `/api/cpr/view-shrine/route.ts` marks link as viewed
- **Behavior**: Link disappears after rescuer clicks it once

### CPR Announcements
- **Regular CPR**: "X gave CPR to Y. N/13 collected. 1 CPR = 1 Token."
- **13th CPR**: "🎊 X gave the 13th CPR to Y! The Secret Link is revealed to the 13 rescuers. Counter resets to 0/13."
- **Posted by**: Pope AI system messages to the Wall

---

## 💀 3. The Void & Shrine Agency

### 72-Hour Lockout Mode
- **Trigger**: When `profiles.deactivated_at` is set and within 72 hours
- **Component**: `DeactivationCheck.tsx` wrapper checks on all pages
- **Redirect**: Shows `VoidScreen.tsx` instead of normal UI
- **Access**: User can ONLY see:
  - Pope AI Chat
  - Manage Shrine interface
  - Their Ghost media (looping)
  - Live CPR count (X/13)

### Shrine Editing Rules
- **Free Edit**: First edit per 24 hours is FREE
- **Paid Edit**: Additional edits within 24 hours cost 10 Talents
- **Fields**: 
  - `shrine_media` - URL to looping media (image/video)
  - `shrine_link` - Secret link revealed after 13 CPRs
- **Tracking**: `last_shrine_edit` timestamp determines edit cost
- **API**: `/api/shrine/edit/route.ts`

### Void Screen Features
- **Ghost Media Display**: Shows looping image or video
- **Shrine Editor**: Input fields for media URL and secret link
- **Cost Display**: Button shows "Save (Free)" or "Save (10 Talents)"
- **CPR Counter**: Real-time display of current CPR count
- **Pope AI**: Embedded chat interface for support
- **Time Remaining**: Shows hours left until permanent deletion

---

## 🚫 4. The Whisper Gating

### Reply Blocking
- **Rule**: Non-COMA users cannot directly reply to COMA users
- **UI Behavior**: 
  - Input field becomes disabled
  - Shows yellow warning text
  - Displays "Break 4th Wall (100 Talents)" button

### Break 4th Wall Transaction
- **Cost**: 100 Talents (deducted immediately from requester)
- **Flow**:
  1. User clicks "Break 4th Wall" button
  2. 100 Talents deducted from requester
  3. Request sent to COMA user
  4. COMA user sees notification with Accept/Reject options
  
### Accept/Reject Mechanism
- **Accept**: COMA user receives 100 Talents, message can be sent
- **Reject**: Talents go to Company (no refund), message blocked
- **Component**: `FourthWallRequests.tsx` shows pending requests
- **API**: `/api/dm/break-wall/route.ts`
- **Storage**: `fourth_wall_breaks` table

### COMA User Interface
- **Location**: Fixed notification panel (bottom-right)
- **Display**: Shows requester username and message content
- **Buttons**: "Accept (+100 Talents)" and "Reject"
- **Polling**: Checks for new requests every 5 seconds

---

## 📊 Database Schema Updates

### New Tables

#### `cpr_log`
```sql
- id (UUID, PK)
- ghost_user_id (UUID, FK to users)
- rescuer_user_id (UUID, FK to users)
- batch_number (INTEGER) -- Which batch of 13
- shrine_link_viewed (BOOLEAN) -- View once tracking
- shrine_link_viewed_at (TIMESTAMP)
- created_at (TIMESTAMP)
UNIQUE(ghost_user_id, rescuer_user_id, batch_number)
```

#### `fourth_wall_breaks`
```sql
- id (UUID, PK)
- coma_user_id (UUID, FK to users)
- requester_user_id (UUID, FK to users)
- status (TEXT) -- 'pending', 'accepted', 'rejected'
- message_content (TEXT)
- created_at (TIMESTAMP)
- responded_at (TIMESTAMP)
```

#### `admin_post_overrides`
```sql
- id (UUID, PK)
- post_id (UUID, FK to wall_messages, UNIQUE)
- override_like_count (TEXT) -- Display value '13+'
- overridden_by (UUID, FK to users)
- created_at (TIMESTAMP)
```

### Updated Settings
- Changed `glaze_protocol_active` to `glaze_active` in system_settings

---

## 🔧 API Routes

### New Routes
- `POST /api/admin/override-stats` - Toggle 13+ override on posts
- `GET /api/admin/override-stats` - Get all post overrides
- `POST /api/cpr/view-shrine` - Mark shrine link as viewed
- `GET /api/shrine/edit` - Get shrine edit cost
- Enhanced `/api/cpr` - Batch-based CPR system
- Enhanced `/api/dm/break-wall` - Accept/Reject functionality

### Updated Routes
- `/api/admin/glaze-protocol` - Uses `glaze_active` setting key
- `/api/cpr` - Implements 13th Revelation batch logic

---

## 🎭 Components

### New Components
- `VoidScreen.tsx` - 72-hour lockout interface
- `DeactivationCheck.tsx` - Wrapper to check deactivation status
- `GlazeSettings.tsx` - Admin-only Glaze Protocol toggle
- `FourthWallRequests.tsx` - COMA user request notifications

### Updated Components
- `GlazeProtocol.tsx` - Enhanced shimmer animation
- `Wall.tsx` - Crown icons, whisper gating, admin features
- `/app/wall/page.tsx` - Includes deactivation check
- `/app/hue/page.tsx` - Includes deactivation check
- `/app/settings/page.tsx` - Includes Glaze settings

---

## 🎨 CSS Animations

### `glaze-shimmer`
```css
@keyframes glaze-shimmer {
  0% {
    transform: translateX(-100%) translateY(-100%) rotate(45deg);
  }
  100% {
    transform: translateX(100%) translateY(100%) rotate(45deg);
  }
}
```

### `crown-pulse`
```css
@keyframes crown-pulse {
  0%, 100% {
    opacity: 0.6;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.1);
  }
}
```

---

## 🔑 Key Features Summary

### ✅ Glaze Protocol
- Diagonal shimmer overlay when activated
- Admin-only toggle in Settings
- Crown icons for 13+ stat rigging
- Visual God-Mode indicator

### ✅ 13th Revelation
- Batch-based CPR system (resets every 13)
- Secret link revealed to 13 rescuers
- View-once functionality
- Pope AI announcements

### ✅ Void & Shrine Agency
- 72-hour lockout on deactivation
- Ghost media looping display
- Shrine editing (free once/24h, then 10 Talents)
- Pope AI support access only

### ✅ Whisper Gating
- COMA users block direct replies
- Break 4th Wall costs 100 Talents
- Accept/Reject transaction flow
- Real-time notification system

---

## 🚀 Testing Instructions

### To Test Glaze Protocol:
1. Set `MOCK_USER.isAdmin = true` in `/app/settings/page.tsx` and `/app/wall/page.tsx`
2. Navigate to Settings
3. Toggle "GLAZE ACTIVE" button
4. Go to Wall page - should see shimmer effect
5. Crown icons appear on posts when glaze is active

### To Test 13th Revelation:
1. Use `/api/cpr` POST endpoint to give CPRs
2. Watch counter increment 1/13, 2/13... 13/13
3. On 13th CPR, counter resets to 0/13
4. Use GET endpoint with `rescuer_user_id` to check shrine access

### To Test Void Screen:
1. Set a user's `deactivated_at` to current timestamp
2. Login as that user
3. Should see Void screen instead of normal UI
4. Can only access Pope AI and Shrine editor

### To Test Whisper Gating:
1. Set a user's `coma_status = true`
2. Try to reply to that user's post as different user
3. Input should be disabled
4. "Break 4th Wall (100 Talents)" button appears
5. COMA user sees Accept/Reject notification

---

## 📝 TypeScript Types

All new types added to `/types/database.ts`:
- `CPRLog`
- `FourthWallBreak`
- `AdminPostOverride`

---

## 🎯 Implementation Status

✅ All features fully implemented:
- Glaze Protocol with shimmer animation
- Admin 13+ crown override system
- 13th Revelation CPR batch logic
- Void screen with 72-hour lockout
- Shrine editing with pricing
- Whisper gating with Break 4th Wall
- Accept/Reject transaction flow
- View-once shrine link system

---

## 🔒 Security Notes

- Admin features check `user.role === 'admin'` in API
- Talent balance validated before transactions
- Unique constraints prevent duplicate CPRs per batch
- Fourth wall breaks deduct Talents immediately (no refunds on reject)

---

## 📦 Files Modified/Created

### Created:
- `/components/VoidScreen.tsx`
- `/components/DeactivationCheck.tsx`
- `/components/GlazeSettings.tsx`
- `/components/FourthWallRequests.tsx`
- `/app/api/admin/override-stats/route.ts`
- `/app/api/cpr/view-shrine/route.ts`

### Modified:
- `/database/schema.sql`
- `/types/database.ts`
- `/app/globals.css`
- `/components/GlazeProtocol.tsx`
- `/components/Wall.tsx`
- `/app/wall/page.tsx`
- `/app/hue/page.tsx`
- `/app/settings/page.tsx`
- `/app/api/admin/glaze-protocol/route.ts`
- `/app/api/cpr/route.ts`
- `/app/api/dm/break-wall/route.ts`
- `/app/api/shrine/edit/route.ts`

---

## 🎉 Ready for Production

All Genesis Build features are now implemented and ready for testing!
