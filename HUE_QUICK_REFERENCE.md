# 🎨 HUE Feed - Quick Reference

## 🚀 Apply Migration First!

Run in Supabase SQL Editor:
```sql
-- Add story support
ALTER TABLE wall_messages ADD COLUMN post_type TEXT DEFAULT 'wall' CHECK (post_type IN ('wall', 'story'));
ALTER TABLE wall_messages ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;

-- Add indexes
CREATE INDEX idx_wall_messages_post_type ON wall_messages(post_type);
CREATE INDEX idx_wall_messages_expires_at ON wall_messages(expires_at) WHERE expires_at IS NOT NULL;
```

---

## 📋 What Was Built

### 🔵 Stories Row (Top)
- 3 circular slots
- Pulsing border for live stories (< 3 hours)
- Auto-expires after 24 hours
- Horizontal scrollable

### 📰 Infinite Feed (Main)
- Text posts with gradient backgrounds
- Image posts with full-width display
- Auto-playing video posts
- Loads 10 posts at a time
- Pull-to-refresh support

### 🎥 Video Auto-Play
- Plays when 50% visible
- Pauses when scrolled away
- Muted loop playback
- LIVE badge overlay

### 📤 Upload Modal Update
- Toggle: **Wall (Permanent)** vs **Story (24h)**
- Stories require media
- Automatic 24h expiry calculation

---

## 🎯 Key Components

| Component | Purpose | Location |
|-----------|---------|----------|
| **StoryCircle** | Story preview circles | `components/StoryCircle.tsx` |
| **LiveVideoCard** | Auto-play video player | `components/LiveVideoCard.tsx` |
| **Hue Page** | Complete For You feed | `app/hue/page.tsx` |
| **UploadModal** | Post type selector | `components/UploadModal.tsx` |

---

## 🗄️ Database Schema

```typescript
interface WallMessage {
  // Existing fields...
  post_type: 'wall' | 'story';      // NEW
  expires_at: string | null;         // NEW
}
```

**Post Types:**
- `wall` = Permanent (default)
- `story` = 24-hour temporary

**Expires At:**
- NULL for wall posts
- `created_at + 24 hours` for stories

---

## 🎨 How Content Displays

### Stories Query
```typescript
// Fetch top 3 active stories
.eq('post_type', 'story')
.gt('expires_at', NOW())
.limit(3)
```

### Feed Query
```typescript
// Fetch wall posts with pagination
.eq('post_type', 'wall')
.order('created_at', desc)
.range(0, 9) // First 10
```

### Content Types in Feed
1. **Text Only** → Gradient card with large text
2. **Image + Text** → Full-width image with caption
3. **Video** → LiveVideoCard with auto-play

---

## ⚡ Quick Test

### 1. Post a Story
1. Click upload button
2. Select **"Story (24h)"**
3. Add image/video (required)
4. Add optional text
5. Post

**Expected:** Appears in stories row with pulsing border

### 2. Post to Wall
1. Click upload button
2. Keep **"Wall (Permanent)"** selected
3. Add text or media
4. Post

**Expected:** Appears in main feed below stories

### 3. Scroll Feed
1. Open Hue tab
2. Scroll down
3. Watch videos auto-play
4. Keep scrolling

**Expected:** More posts load automatically

---

## 🎯 Styling Classes

### Stories Row
```tsx
className="overflow-x-auto scrollbar-hide flex gap-4"
```

### Story Circle (Live)
```tsx
className="ring-4 ring-purple-500 animate-pulse"
```

### Text Post
```tsx
className="bg-gradient-to-br from-purple-900/30 via-pink-900/30 to-orange-900/30"
```

### Video Container
```tsx
className="relative w-full rounded-xl overflow-hidden"
```

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Stories not showing | Run migration to add columns |
| Videos not playing | Must be muted for autoplay |
| Infinite scroll stuck | Check `hasMore` state |
| Story validation fails | Stories require media file |

---

## 📊 Performance Tips

✅ **Videos pause** when scrolled away (saves bandwidth)
✅ **Images lazy load** (only when visible)
✅ **Paginated queries** (10 posts at a time)
✅ **Indexed queries** (fast post_type filtering)

---

## 🎉 What Works Now

- ✅ Post permanent wall posts
- ✅ Post 24-hour stories
- ✅ Browse infinite feed
- ✅ Auto-playing videos
- ✅ Pull to refresh
- ✅ Stories auto-expire
- ✅ Mobile responsive

---

## 🔮 Coming Soon

- Story viewer modal (tap to view full-screen)
- Story progress indicator
- Swipe between stories
- "For You" algorithm (personalized)
- Video view counts
- Story reactions

---

## 📁 Files Changed

```
✅ database/schema.sql
✅ database/migration-add-stories.sql
✅ components/UploadModal.tsx
✅ components/StoryCircle.tsx (NEW)
✅ components/LiveVideoCard.tsx (NEW)
✅ app/hue/page.tsx
✅ types/database.ts
```

---

## 🎯 Summary

You now have a complete **TikTok/Instagram-style "For You" feed** with:
- 📍 Stories at the top (24h expiry)
- 📜 Infinite scrolling feed
- 🎥 Auto-playing videos
- 📸 Mixed content types
- 🔄 Pull-to-refresh

**Start using:** Apply migration → Post a story → Browse Hue tab! 🚀
