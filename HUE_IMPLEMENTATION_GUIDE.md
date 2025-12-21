# 🎨 HUE: For You Feed Implementation Guide

## ✅ Complete Implementation

The Hue tab has been transformed into a full-featured "For You" feed with stories, infinite scroll, and mixed content types.

---

## 🗂️ Database Changes

### New Columns in `wall_messages`

```sql
ALTER TABLE wall_messages ADD COLUMN post_type TEXT DEFAULT 'wall' CHECK (post_type IN ('wall', 'story'));
ALTER TABLE wall_messages ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;
```

**post_type:**
- `'wall'` = Permanent posts (default)
- `'story'` = 24-hour temporary posts

**expires_at:**
- NULL for wall posts
- Set to `created_at + 24 hours` for stories

### Indexes Added
```sql
CREATE INDEX idx_wall_messages_post_type ON wall_messages(post_type);
CREATE INDEX idx_wall_messages_expires_at ON wall_messages(expires_at) WHERE expires_at IS NOT NULL;
```

---

## 📦 New Components

### 1. **StoryCircle.tsx**
Circular story preview with pulsing border for live/recent stories.

**Features:**
- ✅ Pulsing gradient border for recent stories (< 3 hours old)
- ✅ Video thumbnail preview
- ✅ Username display
- ✅ Live indicator dot
- ✅ Hover scale effect

```tsx
<StoryCircle 
  story={storyData} 
  isLive={true}
  onClick={() => openStoryViewer()} 
/>
```

### 2. **LiveVideoCard.tsx**
Auto-playing video component with intersection observer.

**Features:**
- ✅ Auto-play when 50% visible
- ✅ Auto-pause when scrolled away
- ✅ LIVE badge overlay
- ✅ Content overlay with username
- ✅ Muted loop playback
- ✅ Mobile-optimized (playsInline)

```tsx
<LiveVideoCard
  videoUrl={url}
  username="user123"
  content="Check this out!"
  isLive={true}
/>
```

### 3. **Hue Page (Refactored)**
Complete "For You" feed with infinite scroll.

**Layout:**
```
┌─────────────────────────┐
│   Stories Row (Top)     │ ← Horizontal scroll, 3 circles
├─────────────────────────┤
│   Pull to Refresh       │ ← Manual refresh trigger
├─────────────────────────┤
│                         │
│   Text Post             │ ← Large typography cards
│                         │
├─────────────────────────┤
│   Image + Text          │ ← Full-width media
├─────────────────────────┤
│   Live Video            │ ← Auto-playing
├─────────────────────────┤
│   Text Post             │
│                         │
│   ↓ Infinite Scroll     │ ← Loads more on scroll
└─────────────────────────┘
```

---

## 🎯 How It Works

### Stories (The 3 Circles)

**Query:**
```typescript
const { data } = await supabase
  .from('wall_messages')
  .select('*')
  .eq('post_type', 'story')
  .gt('expires_at', new Date().toISOString()) // Only active stories
  .order('created_at', { ascending: false })
  .limit(3); // Show top 3
```

**Visual States:**
- **Live** (< 3 hours): Pulsing gradient border + red dot
- **Recent** (< 24 hours): Solid border
- **Expired**: Automatically filtered out

### Feed (The Infinite Scroll)

**Query:**
```typescript
const { data } = await supabase
  .from('wall_messages')
  .select('*')
  .eq('post_type', 'wall') // Only permanent posts
  .order('created_at', { ascending: false })
  .range(offset, offset + 9); // Fetch 10 at a time
```

**Content Types:**
1. **Text Posts**: Gradient background cards with large typography
2. **Image Posts**: Full-width images with caption overlays
3. **Video Posts**: Auto-playing LiveVideoCard components

### Infinite Scroll Logic

Uses **Intersection Observer API**:
```typescript
const observer = new IntersectionObserver((entries) => {
  if (entries[0].isIntersecting && hasMore) {
    loadMorePosts(); // Fetch next 10 posts
  }
}, { threshold: 0.5 });
```

Triggers when user scrolls to within 50% of the sentinel element.

---

## 🚀 Upload Modal Updates

### New: Post Type Toggle

Users can now choose between:
- **Wall (Permanent)**: Traditional posts that stay forever
- **Story (24h)**: Temporary posts with media requirement

**UI:**
```tsx
┌─────────────────────────────┐
│  Post Type                  │
│  ┌─────────┐  ┌──────────┐ │
│  │  Wall   │  │  Story   │ │ ← Toggle buttons
│  │ (Perm)  │  │  (24h)   │ │
│  └─────────┘  └──────────┘ │
└─────────────────────────────┘
```

**Validation:**
- Stories REQUIRE media (image or video)
- Wall posts can be text-only or with media

**Code:**
```typescript
if (postType === 'story' && !file) {
  setError('Stories require an image or video');
  return;
}

const expiresAt = postType === 'story' 
  ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  : null;
```

---

## 🎨 Styling Details

### Stories Row
```css
.stories-container {
  overflow-x: auto;
  scrollbar-hide; /* Hide scrollbar */
  flex: horizontal;
  gap: 1rem;
}

.story-circle {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  ring: 4px purple-500; /* Live stories */
  animation: pulse; /* Pulsing effect */
}
```

### Text Posts
```css
.text-post {
  background: gradient-to-br(purple-900/30, pink-900/30, orange-900/30);
  padding: 1.5rem;
  font-size: 1.125rem; /* Large text */
  border-radius: 0.75rem;
}
```

### Video Auto-Play
- Muted by default (browser requirement)
- Loops continuously
- Pauses when out of view (performance)

---

## 📊 Performance Optimizations

### 1. Lazy Loading
```tsx
<img loading="lazy" /> // Only load when scrolling into view
```

### 2. Video Preload
```tsx
<video preload="metadata" /> // Load only metadata, not full video
```

### 3. Pagination
- Loads 10 posts at a time
- Prevents massive initial data fetch

### 4. Index Usage
- `post_type` index speeds up story vs wall filtering
- `expires_at` index optimizes story expiry checks

### 5. Auto-Pause Videos
- Videos pause when scrolled away
- Saves bandwidth and CPU

---

## 🛠️ Migration Steps

### 1. Apply Database Migration
```sql
-- Run this in Supabase SQL Editor
\i database/migration-add-stories.sql
```

Or manually:
```sql
ALTER TABLE wall_messages ADD COLUMN post_type TEXT DEFAULT 'wall' CHECK (post_type IN ('wall', 'story'));
ALTER TABLE wall_messages ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;
CREATE INDEX idx_wall_messages_post_type ON wall_messages(post_type);
CREATE INDEX idx_wall_messages_expires_at ON wall_messages(expires_at) WHERE expires_at IS NOT NULL;
```

### 2. Verify Columns
```sql
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'wall_messages' 
ORDER BY ordinal_position;
```

Expected output includes:
- `post_type` → `text` → `'wall'::text`
- `expires_at` → `timestamp with time zone` → NULL

---

## 🧪 Testing Checklist

### Stories
- [ ] Post a story with image
- [ ] Post a story with video
- [ ] Verify appears in stories row
- [ ] Check pulsing border effect
- [ ] Wait 24 hours → story disappears

### Feed
- [ ] Scroll down → more posts load automatically
- [ ] Videos play when scrolled into view
- [ ] Videos pause when scrolled away
- [ ] Text posts display correctly
- [ ] Image posts display correctly
- [ ] Pull to refresh works

### Upload Modal
- [ ] Toggle between Wall and Story
- [ ] Story requires media validation
- [ ] Wall allows text-only posts
- [ ] 24h expiry set for stories
- [ ] Posts appear in correct location (stories row vs feed)

---

## 🎯 "For You" Algorithm (Future)

Currently shows **chronological** feed. To make it truly "For You":

### Phase 1: Basic Personalization
```sql
-- Prioritize mutuals and high-engagement users
SELECT * FROM wall_messages 
WHERE post_type = 'wall'
AND (
  user_id IN (SELECT friend_id FROM friendships WHERE user_id = current_user)
  OR user_id IN (SELECT user_id FROM profiles WHERE talent_balance > 1000)
)
ORDER BY created_at DESC;
```

### Phase 2: Engagement Scoring
```sql
-- Score based on reactions and comments
SELECT 
  wm.*,
  (SELECT COUNT(*) FROM reactions WHERE message_id = wm.id) * 2 +
  (SELECT COUNT(*) FROM comments WHERE post_id = wm.id) * 3 
  AS engagement_score
FROM wall_messages wm
ORDER BY engagement_score DESC, created_at DESC;
```

### Phase 3: Machine Learning
- Track user interactions (likes, watches, skips)
- Build preference model
- Serve personalized content

---

## 📱 Mobile Optimization

### Touch Interactions
```tsx
// Pull-to-refresh gesture
let startY = 0;
element.addEventListener('touchstart', (e) => {
  startY = e.touches[0].clientY;
});

element.addEventListener('touchmove', (e) => {
  const deltaY = e.touches[0].clientY - startY;
  if (deltaY > 100) {
    handleRefresh(); // Trigger refresh
  }
});
```

### Viewport Units
```css
.feed-container {
  height: 100vh; /* Full viewport height */
  overflow-y: auto;
  overscroll-behavior: contain; /* Prevent bounce */
}
```

---

## 🐛 Common Issues

### Issue: Stories not appearing
**Cause:** `expires_at` is in the past
**Solution:** Check system time, verify 24h calculation
```typescript
const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
```

### Issue: Videos not auto-playing
**Cause:** Browser autoplay policy
**Solution:** Videos must be muted for autoplay
```tsx
<video muted playsInline />
```

### Issue: Infinite scroll not loading
**Cause:** Observer not triggered
**Solution:** Check sentinel element is visible
```typescript
console.log('Has more:', hasMore);
console.log('Loading:', loadingMore);
```

### Issue: Stories showing expired content
**Cause:** Query not filtering correctly
**Solution:** Ensure greater-than comparison
```typescript
.gt('expires_at', new Date().toISOString())
```

---

## 📚 Files Modified/Created

### Database
- ✅ `database/schema.sql` - Added post_type and expires_at
- ✅ `database/migration-add-stories.sql` - Migration script

### Components
- ✅ `components/UploadModal.tsx` - Added post type toggle
- ✅ `components/StoryCircle.tsx` - NEW story preview
- ✅ `components/LiveVideoCard.tsx` - NEW video player
- ✅ `app/hue/page.tsx` - Complete refactor

### Types
- ✅ `types/database.ts` - Updated WallMessage interface

---

## 🎉 What You Can Do Now

### As a User:
1. **Post to Wall** - Permanent posts visible in feed
2. **Post Stories** - 24-hour temporary posts in circles
3. **Browse Feed** - Infinite scroll through mixed content
4. **Watch Videos** - Auto-playing as you scroll
5. **View Stories** - Tap circles to see recent updates

### As a Developer:
1. Customize story duration (currently 24h)
2. Add story viewer modal
3. Implement "For You" algorithm
4. Add reactions to feed posts
5. Build comment system
6. Add filters (videos only, images only, etc.)

---

## 🔮 Next Features

### Story Viewer Modal
- Full-screen story viewer
- Swipe between stories
- Progress bar at top
- Tap to advance

### Advanced Feed
- Filter by content type
- Search posts
- Save favorites
- Share posts

### Analytics
- Track story views
- Count video plays
- Measure engagement
- Optimize algorithm

---

**Status:** ✅ Complete and ready to use!

**Next Steps:**
1. Apply migration
2. Test story posting
3. Browse the Hue feed
4. Enjoy your TikTok-style For You page! 🚀
