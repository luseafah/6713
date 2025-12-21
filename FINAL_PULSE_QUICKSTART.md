# 6713 Protocol - Final Pulse Quick Start

## 🚀 What Was Implemented

### 1. **Live Tab Ceiling** (67+/13+ Caps)
- Hard-cap viewer count at "67+ Viewers"
- Hard-cap like count at "13+ Likes"
- 1-minute live video buffer (60-second DVR window)

### 2. **$$$4U Signal Channel**
- Admin-only posting for Forex & Crypto signals
- Verified users get push notifications
- Unverified users can view (no notifications)

### 3. **Search Radio Enhancement**
- Verified Name shows only when unmuted
- "Tap to reveal identity" when muted

### 4. **Live Stream Buffer**
- 60-second rewatch window
- Automatic segment pruning (sliding window)
- Prevents seeking beyond 1 minute

---

## 📂 Files Created/Modified

### New Files
- `lib/metricsCap.ts` - Ceiling format functions
- `lib/liveStreamConfig.ts` - DVR window configuration
- `hooks/useLiveVideo.ts` - 1-minute buffer enforcement
- `database/migration-signal-channel.sql` - Signal channel schema
- `app/money/page_signals.tsx` - Signal channel page
- `FINAL_PULSE_GUIDE.md` - Complete documentation

### Modified Files
- `components/LiveVideoCard.tsx` - Added 67+/13+ display
- `app/search/page.tsx` - Verified name reveal on unmute

---

## ⚡ Quick Setup

### 1. Run Database Migration
```bash
psql $DATABASE_URL -f database/migration-signal-channel.sql
```

Creates:
- `signal_posts` table (admin-only creation)
- `signal_notifications` table (verified user push)
- RLS policies (admin posting, public viewing)
- Functions: `create_signal_post()`, `get_unread_signal_count()`, `mark_signal_read()`

### 2. Create Storage Bucket
In Supabase Dashboard → Storage:
```
Bucket: signal-charts
Access: Public
Max Size: 50MB
```

### 3. Test the System
```bash
npm run dev
# Test routes:
# - /live (see 67+/13+ caps)
# - /money (see $$$4U Signal Channel)
# - /search (Audio Radio with verified name reveal)
```

---

## 🎯 Usage Guide

### Live Tab Ceiling
```typescript
// Display caps automatically
<LiveVideoCard 
  viewerCount={85}   // Shows "67+ Viewers"
  likeCount={20}     // Shows "13+ Likes"
  isLive={true}
/>
```

### $$$4U Signal Channel

**As Admin (Pope AI)**:
1. Navigate to `/money`
2. Click "Post Signal (Pope AI)"
3. Select signal type (Forex/Crypto)
4. Enter title, content, upload chart
5. Add metadata (pair, entry, SL, TP)

**As Verified User**:
- Receive push notification
- See unread badge on Money tab
- Click signal to view and mark read

**As Unverified User**:
- View signals (read-only)
- See gate notice about verification
- No push notifications

### Search Radio
1. Go to `/search` → Audio Radio tab
2. Click "Start Radio" → Audio plays (muted)
3. See "Tap to reveal identity" message
4. Click Mute icon → Verified Name + @username revealed
5. Audio continues → Auto-advances at 30s

---

## 🔧 Key Functions

### Metrics Ceiling
```typescript
import { formatViewerCount, formatLikeCount } from '@/lib/metricsCap';

formatViewerCount(85);  // "67+"
formatViewerCount(42);  // "42"
formatLikeCount(20);    // "13+"
formatLikeCount(7);     // "7"
```

### Signal Channel
```sql
-- Create signal (admin only)
SELECT create_signal_post(
  'forex',
  'EUR/USD Long Setup',
  'Entry at 1.0850, TP 1.0920',
  'https://chart.url',
  '{"pair": "EUR/USD", "entry": "1.0850"}'::JSONB
);

-- Get unread count (verified users)
SELECT get_unread_signal_count();

-- Mark signal as read
SELECT mark_signal_read('signal-uuid');
```

---

## 📱 Testing Checklist

### Live Tab
- [ ] View live stream with 80 viewers → See "67+ Viewers"
- [ ] Like count at 20 → See "13+ Likes"
- [ ] Seek back 30 seconds → Works
- [ ] Seek back 90 seconds → Blocked at 60s mark

### $$$4U Signal Channel
- [ ] Admin can post signals
- [ ] Verified users receive notifications
- [ ] Unverified users can view signals
- [ ] Unverified users see gate notice
- [ ] Signals expire after 7 days

### Search Radio
- [ ] Start Radio → Audio plays muted
- [ ] See "Tap to reveal identity"
- [ ] Unmute → Verified Name appears
- [ ] Auto-advance after 30s

---

## 🎙️ Summary

### Visual Hierarchy Table

| Tab       | Visual Signature | Primary Logic                  |
|-----------|-----------------|--------------------------------|
| Live      | 67+/13+ Caps    | 1-Minute DVR Buffer           |
| $$$4U     | Market Charts   | Admin Signals, Verified Push  |
| Search    | Audio Radio     | Verified Name on Unmute       |
| Hue       | Budge Flicker   | 3-Day Post Expiry             |

---

**"The Final Pulse"** - 6713 Protocol Complete 🎙️
