# 🎯 Hunt Protocol & Verification System

## What We Just Built

### 1. **Hunt Mode** (Admin Surveillance)
Admins can "hunt" any user to see their complete activity feed in real-time.

**Features:**
- 🎯 **Ghost View**: See the app from the target user's perspective
- 📊 **Live Stats**: Posts, DMs, Talents, verification status
- 📝 **Activity Log**: Real-time feed of all user actions
- ⏱️ **Time Tracking**: See when actions occurred
- 🚪 **Exit Button**: Top-center X button to leave hunt mode

**Access:**
- Admin dashboard verification queue (hover over user card)
- Any profile page (admin-only button)
- Use `<HuntButton targetUserId={userId} />` component

**Files:**
- `components/HuntMode.tsx` - Full-screen surveillance interface
- `components/HuntButton.tsx` - Activator button for profiles

---

### 2. **Verification Chat Pinned**
Shows verification status at top of /messages for unverified users.

**Features:**
- ⏱️ **Live Timer**: Shows how long user has been waiting
- 🎨 **Status Badge**: "On Hold" (yellow) or "Active" (green)
- 👑 **Pope AI Avatar**: Animated crown icon with pulsing indicator
- 📱 **Tap to Open**: Quick access to full verification chat

**States:**
- **Pending**: Yellow, shows wait timer
- **Active**: Green, pulsing indicator, "Ready to verify you now!"
- **Verified**: Component hidden (user has full access)

**Files:**
- `components/VerificationChatPinned.tsx`
- `app/messages/page.tsx` (updated to show pinned chat)

---

### 3. **Admin Quick Actions**
Swipeable moderation controls for fast verification decisions.

**Features:**
- ✅ **Verify User**: Instant approval with database update
- ❌ **Reject**: With confirmation modal
- ⭐ **Artist Badge**: Grant special artist status
- 💰 **Gift Talents**: Quick gift options (50T, 100T, 250T)
- 🔔 **Confirmation Modals**: Safety checks for destructive actions

**Variants:**
- `full`: Complete action panel with all buttons
- `compact`: Just Verify/Reject for tight spaces

**Files:**
- `components/AdminQuickActions.tsx`
- Integrated into `app/admin/page.tsx`

---

## Implementation Guide

### Add Hunt Mode to Profile Page

```tsx
import HuntButton from '@/components/HuntButton';

// In your profile component:
<HuntButton targetUserId={profileUserId} variant="button" />
```

### Show Verification Status

```tsx
import VerificationChatPinned from '@/components/VerificationChatPinned';

// At top of messages/DMs:
{!isVerified && <VerificationChatPinned userId={currentUserId} />}
```

### Add Quick Actions to Admin UI

```tsx
import AdminQuickActions from '@/components/AdminQuickActions';

<AdminQuickActions 
  targetUserId={userId}
  onAction={() => refreshData()}
  variant="compact"
/>
```

---

## UX Innovations

### 1. **Hunt Protocol** 
- Real-time surveillance without leaving admin view
- Activity log with type-based icons (DM = purple, Post = blue, Throw = yellow)
- Relative timestamps ("5m ago", "2h ago")
- Ghost-themed red/purple gradient overlay
- Exit button always visible at top center

### 2. **Pinned Chat Status**
- Dynamic background gradient based on status
- Animated shimmer effect on pending
- Pulsing green indicator when admin is ready
- Live timer shows exact wait time
- Tap anywhere to open full chat

### 3. **Quick Actions**
- Swipe-optimized touch targets
- Haptic feedback on action
- Confirmation modals prevent mistakes
- Gift amounts as quick-tap buttons
- Success animations and alerts

---

## Next Steps

1. **Add Hunt Button to Wall Posts**
   - Long-press menu for admin
   - Quick access to user surveillance

2. **Real-time Activity Updates**
   - WebSocket connection for live feed
   - Push notifications to Hunt Mode

3. **Hunt Mode Enhancements**
   - View user's DM threads
   - See their live location (if shared)
   - Timeline view with filtering

4. **Verification Automations**
   - Auto-approve after 24h wait
   - AI photo verification
   - Batch actions for queue

---

## Database Functions Used

```sql
-- Approve verification
admin_approve_verification(admin_id, target_id, notes)

-- Gift talents
admin_gift_talents(admin_id, target_id, amount, reason)

-- Issue fine
admin_issue_fine(admin_id, target_id, amount, reason)

-- Shadow ban
admin_shadow_ban(admin_id, target_id, reason)
```

---

## Testing Checklist

- [ ] Hunt Mode activates from admin dashboard
- [ ] Exit button returns to dashboard
- [ ] Activity log shows recent posts/DMs
- [ ] Timer updates every second
- [ ] Verification chat pinned for unverified users
- [ ] Chat opens on tap
- [ ] Status changes from pending → active → verified
- [ ] Quick actions approve/reject users
- [ ] Gift talents modal shows amounts
- [ ] Confirmation modals prevent accidents
- [ ] Hunt button only visible to admins

---

**"The Protocol sees all."** 👁️
