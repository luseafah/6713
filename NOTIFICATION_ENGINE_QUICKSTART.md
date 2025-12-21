# 6713 Protocol - Notification Engine Quick Start

## 🚀 What Was Built

### 1. **Settings > Notifications Page**
Individual toggle switches for all protocol events:
- $$$4U Signals (Verified only)
- G$4U & Gigs (Join requests, acceptances, Pope AI Gig-Close)
- The Wall (Mentions, Talent throws)
- Live & Hue (Live streams, Stories)
- Account Activity (Self-Kill, Verification status)
- Quiet Hours (Mute all frequencies 12 AM - 6 AM)

### 2. **Badge Count System**
- Red badge on app icon showing total unread
- Category-specific badges (Signals, Gigs, Wall, Live/Hue)
- Real-time WebSocket updates

### 3. **Deep Linking**
- Tap notification → Opens app to exact content
- Examples: Signal → `/money?tab=signals&signal={id}`

### 4. **The 6713 Ping**
- Unique custom notification sound
- Distinguishes protocol from standard apps

---

## 📂 Files Created

### Database
- `database/migration-notification-engine.sql` - Schema, triggers, functions

### Pages
- `app/settings/notifications/page.tsx` - Settings UI with toggles

### Components
- `components/NotificationCenter.tsx` - Notification panel
- `hooks/useNotifications.ts` - Real-time notification hook

### Documentation
- `NOTIFICATION_ENGINE_GUIDE.md` - Complete implementation

---

## ⚡ Quick Setup

### 1. Run Database Migration
```bash
psql $DATABASE_URL -f database/migration-notification-engine.sql
```

Creates:
- `notifications` table
- `notification_preferences` JSONB column in profiles
- Functions: `is_notification_enabled()`, `create_notification()`, `get_badge_counts()`
- Triggers for Signal posts and Talent throws

### 2. Add Notification Sound
Place custom sound file:
```
/public/sounds/6713-ping.mp3
```

### 3. Test Settings Page
```bash
npm run dev
# Navigate to /settings/notifications
```

---

## 🎯 Usage Guide

### Settings Page
1. Go to `/settings/notifications`
2. Toggle each frequency (instant save)
3. Enable Quiet Hours → Set time range
4. Changes apply immediately

### Notification Hook
```typescript
import { useNotifications } from '@/hooks/useNotifications';

const {
  notifications,      // Array of notifications
  badgeCounts,        // { total, signals, gigs, wall, live_hue }
  unreadCount,        // Total unread
  markAsRead,         // Mark single as read
  markAllAsRead,      // Mark all as read
  navigateToDeepLink, // Navigate to content
} = useNotifications();
```

### Trigger Notification
```typescript
await supabase.rpc('create_notification', {
  p_user_id: userId,
  p_notification_type: 'talent_throw',
  p_title: '💰 Talent Incoming!',
  p_body: 'Alice threw 5T at your message!',
  p_data: { amount: 5 },
  p_deep_link: '/wall?message=123',
});
```

---

## 🔧 Key Functions

### Check if Enabled
```sql
SELECT is_notification_enabled(user_id, 'signal');
-- Returns: true/false (considers quiet hours)
```

### Get Badge Counts
```sql
SELECT get_badge_counts();
-- Returns: { total, signals, gigs, wall, live_hue, account }
```

### Mark as Read
```sql
SELECT mark_notification_read('notif-uuid');
SELECT mark_all_notifications_read();
```

---

## 🎨 Notification Types

| Icon | Type | Title | Deep Link |
|------|------|-------|-----------|
| 🚨 | signal | Wealth Alert | `/money?tab=signals` |
| 👥 | gig_join_request | Join Request | `/money?tab=gigs` |
| ✅ | gig_accepted | Gig Accepted | `/money?tab=gigs` |
| 🎙️ | pope_gig_close | Gig-Close | `/gig/{id}/close` |
| @ | wall_mention | Mentioned | `/wall?message={id}` |
| 💰 | talent_throw | Talent Incoming | `/wall?message={id}` |
| 🔴 | live_pulse | Live Now | `/live?user={id}` |
| 📸 | new_story | New Story | `/hue?story={id}` |

---

## 📱 Testing Checklist

### Settings
- [ ] Navigate to `/settings/notifications`
- [ ] Toggle each switch → See instant save
- [ ] Enable Quiet Hours → Set time range
- [ ] Disable signals → Verify no notifications

### Delivery
- [ ] Post Signal → Verified users notified
- [ ] Throw Talents → Recipient notified
- [ ] Mention user → User notified
- [ ] Check badge count on app icon

### Deep Linking
- [ ] Tap Signal notification → Opens `/money`
- [ ] Tap Mention → Opens `/wall?message={id}`
- [ ] Verify correct scroll position

### Quiet Hours
- [ ] Set 12 AM - 6 AM
- [ ] Trigger notification at 3 AM → Suppressed
- [ ] Trigger at 8 AM → Delivered

---

## 🚨 Proper Social Features

### ✅ Badge Counts
- Red badge on app icon
- Category breakdown (Signals, Gigs, Wall, Live/Hue)
- Real-time updates via WebSocket

### ✅ Deep Linking
- Tap notification → Opens to exact content
- Auto-marks as read when opened

### ✅ Quiet Hours
- Mute all between specific times
- Configurable start/end (default 12 AM - 6 AM)

### ✅ The 6713 Ping
- Unique protocol sound
- Plays on new notification
- Volume: 50% (not intrusive)

---

## 📖 Full Documentation

See [NOTIFICATION_ENGINE_GUIDE.md](NOTIFICATION_ENGINE_GUIDE.md) for:
- Complete database schema
- All notification types
- Trigger implementation
- Category organization
- Testing procedures

---

🔔 **"Your notifications, your rules"** - The 6713 Protocol
