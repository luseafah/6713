# 6713 Protocol - Notification Engine

## Overview
Granular frequency control system allowing users to tune into specific signals while silencing others. Includes $$$4U Signals, G$4U Gigs, Wall mentions, Live/Hue updates, and account activity.

---

## 1. Notification Frequencies

### $$$4U Signals (Verified Only)
- **Wealth Alerts**: New Forex/Crypto signals from Pope AI
- **Priority**: High-priority sound (unique 6713 ping)
- **Gate**: Only verified users receive these notifications
- **Badge**: Yellow indicator in app icon

### G$4U & Gigs
- **New Join Request**: Someone wants to join your Gig
- **Gig Accepted**: Creator accepted your join request
- **Pope AI Gig-Close**: Mandatory 3s voice note & photo prompt

### The Wall (#Earth)
- **Mentions/@Handles**: Alert when someone mentions your @username
- **Talent Throw**: "Someone threw 5 Talents at your message!"

### Live & Hue
- **Live Pulse**: Followed user starts streaming
- **New Hue Story**: New 3-day post from followed users

### Account Activity
- **Self-Kill Alerts**: Global broadcast when connection deletes account
- **Verification Status**: Updates from Pope AI about account standing

---

## 2. Proper Social Features

### Quiet Hours
- **Mute All Frequencies**: Silent period between specific times
- **Default**: 12 AM – 6 AM (configurable)
- **Override**: Critical signals can optionally bypass (admin only)

### Badge Counts
- **App Icon**: Red badge showing total unread notifications
- **Category Badges**: 
  - Yellow for Signals
  - Blue for Gigs
  - Green for Wall
  - Purple for Live/Hue
- **Real-time Updates**: WebSocket-based instant badge refresh

### Deep Linking
- **Tap Navigation**: Opens app directly to relevant content
- **Examples**:
  - Signal notification → `/money?tab=signals&signal={id}`
  - Gig request → `/money?tab=gigs&gig={id}`
  - Mention → `/wall?message={id}`
  - Live stream → `/live?user={id}`

### The 6713 Ping
- **Unique Sound**: Custom digital "ping" distinguishing from standard apps
- **File**: `/sounds/6713-ping.mp3`
- **Duration**: ~0.5 seconds
- **Tone**: Subtle but distinctive protocol signature

---

## 3. Database Schema

### Notification Preferences (profiles table)
```json
{
  "signals": {
    "enabled": true,
    "verified_only": true
  },
  "gigs": {
    "join_request": true,
    "gig_accepted": true,
    "pope_gig_close": true
  },
  "wall": {
    "mentions": true,
    "talent_throw": true
  },
  "live_hue": {
    "live_pulse": true,
    "new_story": true
  },
  "account": {
    "self_kill": true,
    "verification_status": true
  },
  "quiet_hours": {
    "enabled": false,
    "start_time": "00:00",
    "end_time": "06:00"
  }
}
```

### Notifications Table
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  deep_link TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  is_delivered BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivered_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE
);
```

---

## 4. Files Created

### Database
- **[database/migration-notification-engine.sql](database/migration-notification-engine.sql)** - Schema, triggers, functions

### Pages
- **[app/settings/notifications/page.tsx](app/settings/notifications/page.tsx)** - Settings UI with toggles

### Components
- **[components/NotificationCenter.tsx](components/NotificationCenter.tsx)** - Notification panel with badges

### Hooks
- **[hooks/useNotifications.ts](hooks/useNotifications.ts)** - Real-time notification system

---

## 5. Key Functions

### Check if Notification Enabled
```sql
SELECT is_notification_enabled(
  'user-uuid',
  'signal'  -- notification_type
);
-- Returns: true/false (considers quiet hours and preferences)
```

### Create Notification
```sql
SELECT create_notification(
  'user-uuid',
  'talent_throw',
  '💰 Talent Incoming!',
  'Alice threw 5T at your message!',
  '{"amount": 5, "from_user_id": "..."}'::JSONB,
  '/wall?message=abc123'
);
-- Returns: notification_id or NULL if disabled
```

### Get Badge Counts
```sql
SELECT get_badge_counts();
-- Returns:
{
  "total": 12,
  "signals": 3,
  "gigs": 5,
  "wall": 2,
  "live_hue": 1,
  "account": 1
}
```

### Mark as Read
```sql
SELECT mark_notification_read('notification-uuid');
SELECT mark_all_notifications_read();
```

---

## 6. Usage Examples

### React Hook
```typescript
import { useNotifications } from '@/hooks/useNotifications';

function MyComponent() {
  const {
    notifications,
    badgeCounts,
    unreadCount,
    markAsRead,
    markAllAsRead,
    navigateToDeepLink,
    requestNotificationPermission,
  } = useNotifications();

  return (
    <div>
      {/* Badge Indicator */}
      {unreadCount > 0 && (
        <div className="badge">{unreadCount}</div>
      )}

      {/* Notification List */}
      {notifications.map((notif) => (
        <div 
          key={notif.id}
          onClick={() => navigateToDeepLink(notif)}
        >
          {notif.title}
        </div>
      ))}
    </div>
  );
}
```

### Trigger Notification (Server-side)
```typescript
// When talent is thrown
await supabase.rpc('create_notification', {
  p_user_id: recipientUserId,
  p_notification_type: 'talent_throw',
  p_title: '💰 Talent Incoming!',
  p_body: `${username} threw ${amount}T at your message!`,
  p_data: { amount, from_user_id: senderId },
  p_deep_link: `/wall?message=${messageId}`,
});
```

---

## 7. Database Triggers

### Signal Post Trigger
```sql
-- Auto-notify verified users when signal is posted
CREATE TRIGGER trigger_notify_signal_post
AFTER INSERT ON signal_posts
FOR EACH ROW
EXECUTE FUNCTION notify_signal_post();
```

### Talent Throw Trigger
```sql
-- Auto-notify recipient when Talents are thrown
CREATE TRIGGER trigger_notify_talent_throw
AFTER INSERT ON talent_transactions
FOR EACH ROW
WHEN (NEW.transaction_type = 'throw')
EXECUTE FUNCTION notify_talent_throw();
```

### Additional Triggers Needed
```sql
-- Add these triggers for complete coverage:
- Gig join request (gig_connections table)
- Gig acceptance (gig_connections table)
- Wall mentions (wall_messages table)
- Live stream start (live_streams table)
- New story (stories table)
- Verification status change (profiles table)
```

---

## 8. Settings UI Features

### Toggle Switches
- **Material Design**: Smooth animations on toggle
- **Instant Save**: Updates preferences on change (no "Save" button)
- **Visual Feedback**: Yellow accent when enabled, gray when disabled
- **Disabled State**: Signals toggle grayed out for unverified users

### Quiet Hours Picker
- **Time Range**: Start and end time inputs (24-hour format)
- **Visual**: Moon icon, dark themed section
- **Validation**: Ensures start < end or handles midnight span

### Category Organization
- **Grouped Sections**: Signals, Gigs, Wall, Live/Hue, Account
- **Icons**: Unique icon per category for quick scanning
- **Descriptions**: Brief explanation under each toggle

---

## 9. Implementation Checklist

### Database
- [x] Run [migration-notification-engine.sql](database/migration-notification-engine.sql)
- [x] Create `notifications` table
- [x] Add `notification_preferences` JSONB column to profiles
- [x] Create functions: `is_notification_enabled()`, `create_notification()`, `get_badge_counts()`
- [x] Add triggers for Signal posts and Talent throws
- [ ] Add remaining triggers (Gig requests, mentions, live streams, stories)

### UI Components
- [x] [app/settings/notifications/page.tsx](app/settings/notifications/page.tsx) - Settings page
- [x] [components/NotificationCenter.tsx](components/NotificationCenter.tsx) - Notification panel
- [x] [hooks/useNotifications.ts](hooks/useNotifications.ts) - React hook

### Audio
- [ ] Add `/public/sounds/6713-ping.mp3` - Custom notification sound

### Push Notifications
- [ ] Set up Firebase Cloud Messaging (FCM) or similar
- [ ] Register service worker for push
- [ ] Request notification permission on first load

---

## 10. Testing Guide

### Settings Page
1. Navigate to `/settings/notifications`
2. Toggle each frequency switch → See instant save feedback
3. Enable Quiet Hours → Set time range (e.g., 12 AM - 6 AM)
4. Disable all signals → Verify no notifications received
5. Re-enable → Verify notifications resume

### Notification Delivery
1. **As Admin**: Post new Signal → Verify verified users get notified
2. **As User A**: Throw Talents at User B's message → User B gets notification
3. **As User C**: Mention @userD in Wall post → User D gets notification
4. **Check Badge**: Verify app icon shows red badge with count

### Deep Linking
1. Tap Signal notification → Opens `/money?tab=signals&signal={id}`
2. Tap Gig request → Opens `/money?tab=gigs&gig={id}`
3. Tap Mention → Opens `/wall?message={id}`
4. Verify correct scroll position and highlighting

### Quiet Hours
1. Enable Quiet Hours (12 AM - 6 AM)
2. Trigger notification at 3 AM → Should be suppressed
3. Trigger notification at 8 AM → Should be delivered
4. Verify quiet hours respect timezone

---

## 11. Notification Types Reference

| Type | Title | Body | Deep Link | Badge Color |
|------|-------|------|-----------|-------------|
| `signal` | 🚨 Wealth Alert | New {type} Signal | `/money?tab=signals&signal={id}` | Yellow |
| `gig_join_request` | 👥 Join Request | {user} wants to join {gig} | `/money?tab=gigs&gig={id}` | Blue |
| `gig_accepted` | ✅ Gig Accepted | {user} accepted your request | `/money?tab=gigs&gig={id}` | Blue |
| `pope_gig_close` | 🎙️ Gig-Close | Submit voice note & photo | `/gig/{id}/close` | Blue |
| `wall_mention` | @ Mentioned | {user} mentioned you | `/wall?message={id}` | Green |
| `talent_throw` | 💰 Talent Incoming | {user} threw {amount}T | `/wall?message={id}` | Green |
| `live_pulse` | 🔴 Live Now | {user} started streaming | `/live?user={id}` | Purple |
| `new_story` | 📸 New Story | {user} posted a story | `/hue?story={id}` | Purple |
| `self_kill` | 💀 Account Deleted | {user} left the protocol | `/profile/{id}` | Red |
| `verification_status` | ✅ Verification | Status update from Pope AI | `/settings/account` | White |

---

## Key Features

✅ **Granular Control** - Individual toggles for each frequency  
✅ **Quiet Hours** - Mute all during sleep (12 AM - 6 AM)  
✅ **Badge Counts** - Red app icon badge with category breakdown  
✅ **Deep Linking** - Tap to navigate directly to content  
✅ **6713 Ping** - Unique protocol sound  
✅ **Real-time** - WebSocket-based instant delivery  
✅ **Smart Filtering** - Respects preferences and quiet hours  

🔔 **"Your notifications, your rules"** - The 6713 Protocol
