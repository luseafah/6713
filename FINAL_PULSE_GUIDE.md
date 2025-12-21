# 6713 Protocol - Final Pulse Implementation

## Overview
The Final Pulse integrates capped engagement metrics, 1-minute live buffer, $$$4U Signal Channel, and finalized Search Radio logic into one cohesive discovery system.

---

## 1. Live Tab 'Ceiling' (67+/13+ Caps)

### Concept
Hard-cap visible metrics to maintain mystique and prevent vanity metric culture.

### Implementation
- **Viewers**: Display caps at **67+ Viewers**
- **Likes**: Display caps at **13+ Likes**
- **Buffer**: 1-minute rewatch window (60-second DVR)

### Files
- **Utility**: [lib/metricsCap.ts](lib/metricsCap.ts) - Format functions
- **Component**: [components/LiveVideoCard.tsx](components/LiveVideoCard.tsx) - Display with caps
- **Config**: [lib/liveStreamConfig.ts](lib/liveStreamConfig.ts) - DVR window settings
- **Hook**: [hooks/useLiveVideo.ts](hooks/useLiveVideo.ts) - 1-minute buffer enforcement

### Functions
```typescript
// Format with ceiling
formatViewerCount(85) → "67+"
formatViewerCount(42) → "42"

formatLikeCount(20) → "13+"
formatLikeCount(7) → "7"
```

### Live Buffer Configuration
```typescript
const LIVE_STREAM_CONFIG = {
  dvrWindow: 60,        // 1 minute buffer
  segmentDuration: 2,   // 2-second HLS segments
  maxSegments: 30,      // 60s / 2s = 30 segments
};
```

**DVR Logic**: As new 2-second segments are created, delete segments older than 62 seconds to prevent rewatch beyond 1-minute limit.

---

## 2. $$$4U Signal Channel

### Concept
Admin-only posting channel for Forex & Crypto signals. Unverified users can view, but only Verified Users receive push notifications.

### Features
- **Admin Posting**: Only Pope AI (Admin) can create signals
- **Signal Types**: Forex, Crypto, Announcements
- **Metadata**: Pair, Entry, Stop-Loss, Take-Profit
- **Chart Uploads**: Optional screenshot/chart (max 50MB)
- **Notifications**: Push to verified users only
- **Expiry**: Signals expire in 7 days

### Files
- **Database**: [database/migration-signal-channel.sql](database/migration-signal-channel.sql)
- **Page**: [app/money/page_signals.tsx](app/money/page_signals.tsx)

### Database Schema
```sql
-- Signal posts (admin-only creation)
CREATE TABLE signal_posts (
  id UUID PRIMARY KEY,
  created_by UUID REFERENCES auth.users(id),
  signal_type TEXT CHECK (signal_type IN ('forex', 'crypto', 'announcement')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  chart_url TEXT,
  metadata JSONB DEFAULT '{}',
  expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '7 days')
);

-- Notifications (verified users only)
CREATE TABLE signal_notifications (
  id UUID PRIMARY KEY,
  signal_id UUID REFERENCES signal_posts(id),
  user_id UUID REFERENCES auth.users(id),
  is_read BOOLEAN DEFAULT FALSE,
  UNIQUE(signal_id, user_id)
);
```

### Functions
```sql
-- Create signal and notify verified users
SELECT create_signal_post(
  'forex',                           -- signal_type
  'EUR/USD Long Setup',              -- title
  'Entry at 1.0850, TP 1.0920',     -- content
  'https://chart.url',               -- chart_url
  '{"pair": "EUR/USD", "direction": "long", "entry": "1.0850", "stop_loss": "1.0800", "take_profit": "1.0920"}'::JSONB
);

-- Get unread count for current user
SELECT get_unread_signal_count();

-- Mark signal as read
SELECT mark_signal_read('signal-uuid');
```

### RLS Policies
- **Read**: Anyone can view signals (unverified can see content)
- **Create/Update/Delete**: Admin only
- **Notifications**: Users can read/update their own

### Gate Notice
Unverified users see:
```
🔔 Verification Required
You can view signals, but only Verified Users receive push notifications.
```

---

## 3. Search Radio - Verified Name Display

### Concept
Audio Radio shows **Verified Name** (real identity) only when audio is **unmuted**, maintaining privacy until user opts in to discovery.

### Behavior
- **Muted**: "Tap to reveal identity" (generic message)
- **Unmuted**: Shows Verified Name + @username

### Updated Logic
```tsx
{isMuted ? (
  <span className="text-white/40">Tap to reveal identity</span>
) : (
  currentFrequency.verified_name
)}
```

### File
- **Component**: [app/search/page.tsx](app/search/page.tsx)

---

## 4. Visual & Data Hierarchy

### Tab Signature Table

| Tab       | Visual Signature          | Primary Data Logic                     |
|-----------|--------------------------|----------------------------------------|
| **Live**  | 67+/13+ Caps             | 1-Minute Rewatch Buffer               |
| **$$$4U** | Market Charts            | Admin-only Forex/Crypto Signals        |
| **Search**| Audio Radio              | Random 30s Voice Auto-play             |
| **Hue**   | Budge Flicker            | 3-Day Post Expiry (Gigs stay open)     |

---

## 5. Implementation Checklist

### Database
- [x] Run [migration-signal-channel.sql](database/migration-signal-channel.sql)
- [x] Create `signal_posts` table
- [x] Create `signal_notifications` table
- [x] Add RLS policies (admin-only posting)
- [x] Create functions: `create_signal_post()`, `get_unread_signal_count()`, `mark_signal_read()`

### Components
- [x] [lib/metricsCap.ts](lib/metricsCap.ts) - Ceiling format functions
- [x] [lib/liveStreamConfig.ts](lib/liveStreamConfig.ts) - DVR window config
- [x] [hooks/useLiveVideo.ts](hooks/useLiveVideo.ts) - 1-minute buffer hook
- [x] [components/LiveVideoCard.tsx](components/LiveVideoCard.tsx) - Display 67+/13+ caps
- [x] [app/money/page_signals.tsx](app/money/page_signals.tsx) - Signal channel page
- [x] [app/search/page.tsx](app/search/page.tsx) - Verified name on unmute

### Storage
Create storage buckets in Supabase Dashboard:
- `signal-charts` - For signal screenshots/charts

---

## 6. Testing Guide

### Live Tab Ceiling
1. Open a live stream with 80 viewers → See "67+ Viewers"
2. Like count at 20 → See "13+ Likes"
3. Seek back in live video → Limited to 60 seconds
4. Try seeking beyond 1 minute → Blocked at DVR window edge

### $$$4U Signal Channel
1. **As Admin**:
   - Click "Post Signal (Pope AI)" button
   - Create Forex signal with metadata
   - Upload chart screenshot
   - Verify all verified users get notification
2. **As Verified User**:
   - See notification badge with unread count
   - Click signal → Badge clears
   - View signal content and chart
3. **As Unverified User**:
   - See signals (read-only)
   - See gate notice about verification
   - No push notifications received

### Search Radio
1. Navigate to Search → Audio Radio tab
2. Click "Start Radio" → Audio plays, shows "Tap to reveal identity"
3. Click Mute icon → See Verified Name + @username revealed
4. Audio continues → Auto-advances to next frequency at 30s

---

## 7. Protocol Enforcement

### Live Ceiling Rules
- Viewers: Display "67+" when count ≥ 67
- Likes: Display "13+" when count ≥ 13
- Buffer: Hard limit at 60 seconds (no seeking beyond)

### Signal Channel Rules
- **Posting**: Admin only (Pope AI)
- **Viewing**: All users (including unverified)
- **Notifications**: Verified users only
- **Expiry**: 7 days (auto-cleanup via cron)

### Search Radio Rules
- **Muted**: Generic "Tap to reveal identity"
- **Unmuted**: Show Verified Name (real identity)
- **Auto-Play**: 30-second clips, auto-advance
- **Rotation**: Track last 50 played to avoid repetition

---

## 8. Database Functions Reference

```sql
-- Signal Channel
create_signal_post(signal_type, title, content, chart_url, metadata) → JSONB
get_unread_signal_count() → INTEGER
mark_signal_read(signal_id) → VOID
cleanup_expired_signals() → INTEGER

-- Metrics
formatViewerCount(count) → STRING (caps at 67+)
formatLikeCount(count) → STRING (caps at 13+)

-- Live Video
validateLiveSeek(seekTime, currentTime) → NUMBER
getMinSeekTime(currentTime) → NUMBER (currentTime - 60)
shouldPruneSegment(segmentAge) → BOOLEAN
```

---

## Key Features

✅ **67+/13+ Ceiling** - Mystique-preserving metrics  
✅ **1-Minute DVR** - Sliding window live buffer  
✅ **Admin Signals** - Pope AI exclusive posting  
✅ **Verified Notifications** - Push for verified users only  
✅ **Verified Name Reveal** - Privacy-first Audio Radio  
✅ **7-Day Signal Expiry** - Auto-cleanup  

🎙️ **"The Final Pulse"** - 6713 Protocol Complete
