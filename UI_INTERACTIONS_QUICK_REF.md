# 🎯 UI Interactions Quick Reference

## 🔴 Red X Upload Button

### Quick Tap (< 200ms)
**Result:** Photo Mode - Anchor Post (Permanent)

### Long Press (> 200ms)  
**Result:** Video Mode - 15s Max Recording

### Elite 6 Detection
When uploading to a sound with 6 existing videos:
- Button glows/pulses after recording
- 6 thumbnails appear in grid
- Tap one to overwrite it
- Action logged to activity_log

---

## 🍔 Hamburger Menu

### Top Toggle: View as Stranger
- **ON:** Hides edit buttons, admin views, shows only 13+ likes
- **OFF:** Normal view with all controls
- Persists in localStorage
- Fires `viewModeChanged` event

### Talent Wallet Section
- Shows current balance
- Tap to expand dropdown:
  - **Reload Talents** → Navigate to /money
  - **Transaction History** → Last 20 transactions

### Status Indicators
- **CPR Count:** X/13 (Connection Protocol Requirement)
- **COMA/Active:** Current account status
- **Verification:** pending/verified/rejected

### Mod/Admin Ghost Menu (If Authorized)
- Admin Dashboard
- Open Tickets
- Global Toggles

---

## 🎨 Hue Tab Interactions

### Artist Typography (Sound Name)
**Action:** Single tap on styled artist name  
**Result:** Navigate to Sound Page (1 link + 6 videos)

### Long Press Menu (500ms)
**Verified Users:**
- ⭐ Favorite (1 of 5 slots)
- 🔗 Share (Slash-link)
- 🚩 Report

**Standard Users:**
- 🔗 Share
- 🚩 Report

### Silent Toggle (Top Right)
**Action:** Single tap  
**Result:** Hides all UI overlays
- Red X button hidden
- Hamburger menu hidden  
- Sound names hidden
- Tap again to restore

### Breathe Refresh (Pull Down)
**Action:** Deep pull from top (when scrollY === 0)  
**Result:**
1. Screen blurs
2. 7-second countdown: "Breathe..."
3. Then refresh
4. Prevents spam refreshing

### Double Tap (Future)
**Action:** Quick double tap on video  
**Result:** 13+ Like (if verified)

---

## 👮 Mod/Admin Actions

### Infinite Edit
**Trigger:** Mod taps edit icon on any post  
**Actions:**
- Edit content unlimited times
- Edit hashtags separately
- All changes logged to activity_log
- Old values preserved

### Ticket Dropdown (! Icon)
**Options:**
1. **Open Edit Ticket** - Creates admin ticket
2. **Force Slash** - Instant delete (with confirmation)
3. **Pin to Global** - Promotes to top

### Hashtag Slasher
**Trigger:** Mod long-presses hashtag (800ms)  
**Result:**
- Confirmation modal appears
- If confirmed:
  - Hashtag becomes grey
  - Unclickable app-wide
  - Line-through applied
  - Logged to activity_log

---

## 📜 Activity Log

### Shows:
- ✏️ **Mod Edits** - Before/after text
- 🔪 **Slashed Posts** - Original content (line-through)
- 🔄 **Elite 6 Swaps** - Which video replaced which
- 🚫 **Slashed Hashtags** - Tag and timestamp

### Filters:
- All
- Edits
- Slashes  
- Swaps

### Inline Badge
Appears on edited/slashed posts:
- Purple badge: "Edited by mod"
- Red badge: "Slashed"
- Blue badge: "Elite 6 Swap"

---

## 🎬 Key Animations

| Component | Animation | Duration | Easing |
|-----------|-----------|----------|--------|
| Red X Camera | Vertical Split | 300ms | Spring (damping: 25) |
| Recording Ring | Progress Circle | 15s | Linear |
| Elite 6 Glow | Pulse Opacity | 1s | Loop |
| Hamburger Panel | Slide In | 250ms | Spring (damping: 30) |
| Silent Toggle | Fade Out | 200ms | Ease |
| Breathe Countdown | Blur + Scale | 7s | Linear |
| Long Press Menu | Scale + Fade | 200ms | Ease out |

---

## 🎨 Color Coding

| Action Type | Color | Used For |
|-------------|-------|----------|
| Upload/Create | Red (`#DC2626`) | Red X button |
| Mod Edit | Purple (`#9333EA`) | Edit badges |
| Force Slash | Red (`#EF4444`) | Delete actions |
| Favorite | Yellow (`#EAB308`) | Star icon |
| Talent | Orange (`#F97316`) | Wallet |
| Active Gig | Green (`#22C55E`) | Profile rings |
| COMA | Blue (`#3B82F6`) | Status indicator |

---

## 📱 Mobile Gestures

| Gesture | Duration | Result |
|---------|----------|--------|
| Quick Tap | < 200ms | Photo capture OR Silent toggle OR Menu item |
| Long Press | 500ms | Video mode OR Long press menu |
| Hashtag Hold | 800ms | Slash menu (mods only) |
| Pull Down | 120px threshold | Breathe refresh |
| Swipe (future) | - | Navigate between tabs |

---

## 🔗 Component Imports

```tsx
// Upload
import RedXUploadButton from '@/components/RedXUploadButton';

// Navigation
import HamburgerMenu from '@/components/HamburgerMenu';

// Hue Interactions
import { 
  HueInteractionMenu,
  SilentToggle,
  BreatheRefresh,
  ArtistTypographyButton 
} from '@/components/HueInteractionNooks';

// Mod Actions
import { 
  ModInfiniteEdit,
  TicketDropdown,
  HashtagSlasher,
  ModActionIndicator 
} from '@/components/ModInfiniteActions';

// History
import ActivityLog, { ActivityLogInline } from '@/components/ActivityLog';
```

---

## ⚡ Event Listeners

### View Mode Change
```tsx
window.addEventListener('viewModeChanged', (e: CustomEvent) => {
  const isStrangerMode = e.detail.viewAsStranger;
  // Update your component's view
});
```

### Check localStorage
```tsx
const viewAsStranger = localStorage.getItem('viewAsStranger') === 'true';
```

---

## 🐛 Common Issues

### Camera Won't Open
- Check browser permissions: `navigator.mediaDevices.getUserMedia()`
- iOS requires HTTPS

### Elite 6 Not Showing
- Verify `soundId` prop is passed to `RedXUploadButton`
- Check `elite_6_videos` table has 6 rows for that sound

### Mod Edit Not Saving
- Verify user has `is_mod: true` or `is_admin: true` in `users` table
- Check `activity_log` table exists

### Breathe Refresh Not Triggering
- Must be at top of page (`window.scrollY === 0`)
- Pull past 120px threshold

---

## 📊 Database Queries

### Check Elite 6 Count
```sql
SELECT COUNT(*) FROM elite_6_videos WHERE sound_id = 'your-sound-id';
```

### Get Recent Activity
```sql
SELECT * FROM activity_log 
ORDER BY created_at DESC 
LIMIT 20;
```

### Find Slashed Hashtags
```sql
SELECT * FROM hashtags WHERE is_slashed = true;
```

### Check User Mod Status
```sql
SELECT is_mod, is_admin FROM users WHERE id = 'user-id';
```

---

## 🚀 Performance Tips

1. **Use React.memo** for expensive components
2. **Debounce** long press handlers
3. **Virtualize** long activity logs
4. **Lazy load** heavy modals
5. **Compress** videos before upload (max 15s helps)
6. **Cache** transaction history locally

---

## ✅ Accessibility

All components support:
- ✅ Keyboard navigation
- ✅ ARIA labels
- ✅ Screen reader announcements
- ✅ Focus indicators
- ✅ Touch targets (48x48px min)

---

**Need Help?** See [UI_INTERACTION_GUIDE.md](./UI_INTERACTION_GUIDE.md) for full documentation.
