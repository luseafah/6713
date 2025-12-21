# Quick Reference: Gig Visual States

## 🎨 CSS Classes Reference

### Border Styles
```css
/* Yellow border with flicker animation (6s cycle: 5.5s yellow, 0.5s red) */
.flicker-border

/* Pulsing red border for live-only streams (2s cycle) */
.live-border  

/* Static yellow border (no animation) */
.budge-border

/* Standard grey border */
.ring-2 .ring-white/30
```

### Username Indicator
```css
/* Yellow '+' symbol for users with active Gigs */
.gig-active-indicator
```

---

## 📋 Component Usage

### StoryCircle
```tsx
// Scenario A: Live + Budge
<StoryCircle
  story={storyData}
  isLive={true}
  hasActiveBudgeGig={true}
  liveStreamDuration={3600}  // seconds
  onClick={handleClick}
/>
// Result: Yellow/Red flicker + "1hr" badge

// Scenario B: Static Gig (Budge ON)
<StoryCircle
  story={storyData}
  isLive={false}
  hasActiveBudgeGig={true}
  onClick={handleClick}
/>
// Result: Yellow/Red flicker + No badge

// Live Only
<StoryCircle
  story={storyData}
  isLive={true}
  hasActiveBudgeGig={false}
  liveStreamDuration={120}  // 2 minutes
  onClick={handleClick}
/>
// Result: Pulsing red + "2m" badge

// Standard Story
<StoryCircle
  story={storyData}
  isLive={false}
  hasActiveBudgeGig={false}
  onClick={handleClick}
/>
// Result: Grey border + No badge
```

### Username
```tsx
// User with active Gig
<Username 
  username="johndoe"
  hasActiveGig={true}
  className="font-bold text-white"
/>
// Displays: johndoe+

// User without Gig
<Username 
  username="janedoe"
  hasActiveGig={false}
  className="font-bold text-white"
/>
// Displays: janedoe
```

---

## 🔍 State Determination Logic

### Check if user has active Gig
```tsx
const { data: gigs } = await supabase
  .from('gigs')
  .select('user_id')
  .eq('is_completed', false);

const usersWithActiveGigs = new Set(
  gigs?.map(g => g.user_id) || []
);

const hasActiveGig = usersWithActiveGigs.has(userId);
```

### Check if user has Budge enabled
```tsx
const hasActiveBudgeGig = gigs.some(
  gig => gig.user_id === userId && 
         gig.budge_enabled && 
         !gig.is_completed
);
```

### Check if user is live
```tsx
// In production: query live_sessions table
const { data: liveSessions } = await supabase
  .from('live_sessions')
  .select('user_id, started_at')
  .eq('user_id', userId)
  .eq('is_active', true);

const isLive = liveSessions && liveSessions.length > 0;

// Calculate duration
const liveStreamDuration = isLive 
  ? Math.floor((Date.now() - new Date(liveSessions[0].started_at).getTime()) / 1000)
  : undefined;
```

---

## 🗃️ Database Queries

### Get all active Gigs with user info
```sql
SELECT g.*, p.user_display_name, p.profile_photo
FROM gigs g
JOIN profiles p ON g.user_id = p.user_id
WHERE g.is_completed = FALSE
ORDER BY g.created_at DESC;
```

### Check if user's posts should persist
```sql
SELECT EXISTS (
  SELECT 1 FROM gigs 
  WHERE user_id = $1 
    AND budge_enabled = TRUE 
    AND is_completed = FALSE
) AS should_persist;
```

### Get stories with active Budge status
```sql
SELECT wm.*, 
       EXISTS (
         SELECT 1 FROM gigs g
         WHERE g.user_id = wm.user_id
           AND g.budge_enabled = TRUE
           AND g.is_completed = FALSE
       ) AS has_budge_gig
FROM wall_messages wm
WHERE post_type = 'story'
  AND expires_at > NOW()
ORDER BY created_at DESC;
```

---

## ⏱️ Duration Badge Formatting

```tsx
const formatDuration = (seconds: number): string => {
  if (seconds < 60) return `${seconds}s`;           // "45s"
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;           // "5m"
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}hr`;              // "1hr"
  
  const days = Math.floor(hours / 24);
  return `${days}D`;                                 // "30D"
};

// Examples:
formatDuration(45);      // "45s"
formatDuration(300);     // "5m"
formatDuration(3600);    // "1hr"
formatDuration(86400);   // "1D"
```

---

## 🎭 Visual Priority Stack

```
┌─────────────────────────────────────┐
│  LIVE + BUDGE (Maximum Visibility)  │  ← Flicker + Badge + '+' + Persistent
├─────────────────────────────────────┤
│  LIVE ONLY                          │  ← Pulsing + Badge
├─────────────────────────────────────┤
│  BUDGE ONLY                         │  ← Flicker + '+' + Persistent
├─────────────────────────────────────┤
│  ACTIVE GIG (no Budge)              │  ← '+' symbol only
├─────────────────────────────────────┤
│  STANDARD                           │  ← Default appearance
└─────────────────────────────────────┘
```

---

## 🧪 Testing Helpers

### Mock Live User Data
```tsx
const mockLiveUsers = [
  {
    story: { /* story data */ },
    isLive: true,
    liveStreamDuration: 3600,
    hasActiveBudgeGig: true,
  },
  {
    story: { /* story data */ },
    isLive: false,
    hasActiveBudgeGig: true,
  },
  {
    story: { /* story data */ },
    isLive: true,
    liveStreamDuration: 120,
    hasActiveBudgeGig: false,
  },
];
```

### Test Border Animations
```tsx
// Add to any test page
<div className="space-y-4 p-8">
  <div className="w-20 h-20 rounded-full bg-purple-500 flicker-border" />
  <div className="w-20 h-20 rounded-full bg-red-500 live-border" />
  <div className="w-20 h-20 rounded-full bg-yellow-500 budge-border" />
  <div className="w-20 h-20 rounded-full bg-gray-500 ring-2 ring-white/30" />
</div>
```

---

## 🔐 Database Triggers

### Post Expiry Trigger
```sql
-- Automatically called on INSERT/UPDATE of wall_messages
CREATE TRIGGER trigger_set_message_expiry
  BEFORE INSERT OR UPDATE ON wall_messages
  FOR EACH ROW
  EXECUTE FUNCTION set_message_expiry();
```

### Gig Status Trigger
```sql
-- Automatically called on UPDATE of gigs
CREATE TRIGGER trigger_update_posts_on_gig_change
  AFTER UPDATE ON gigs
  FOR EACH ROW
  EXECUTE FUNCTION update_posts_on_gig_change();
```

---

## 📊 State Combinations Matrix

| isLive | hasActiveBudgeGig | Border | Badge | Symbol | Persist |
|--------|-------------------|--------|-------|--------|---------|
| true   | true              | Flicker| ✅    | ✅     | ✅      |
| true   | false             | Pulse  | ✅    | ❌     | ❌      |
| false  | true              | Flicker| ❌    | ✅     | ✅      |
| false  | false             | Grey   | ❌    | ❌     | ❌      |

---

## 🎯 Key Design Principles

1. **Badge = Live Stream** → If you see a duration badge, it's a real-time video chat
2. **Flicker = Budge** → Yellow/Red flicker means user paid to boost visibility
3. **+ = Active Gig** → Yellow '+' means user is offering services
4. **No Expiry = Budge** → Budge posts persist until Gig completed

---

## 🚦 Implementation Checklist

- [x] CSS animations with precise timing
- [x] StoryCircle conditional rendering
- [x] Username component with '+' indicator
- [x] Live Tab with visual hierarchy
- [x] Wall Chat integration
- [x] Hue Feed integration
- [x] Database triggers for persistence
- [x] Documentation and quick reference

**Status:** ✅ Ready for production
