# 🎨 HUE Feed Architecture Diagram

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Hue Page (app/hue/page.tsx)             │  │
│  │                                                      │  │
│  │  ┌────────────────────────────────────────────────┐ │  │
│  │  │   Stories Row (Horizontal Scroll)              │ │  │
│  │  │                                                │ │  │
│  │  │   ┌──────┐  ┌──────┐  ┌──────┐              │ │  │
│  │  │   │Story │  │Story │  │Story │              │ │  │
│  │  │   │  #1  │  │  #2  │  │  #3  │              │ │  │
│  │  │   └──────┘  └──────┘  └──────┘              │ │  │
│  │  │                                                │ │  │
│  │  │   Component: <StoryCircle />                  │ │  │
│  │  └────────────────────────────────────────────────┘ │  │
│  │                                                      │  │
│  │  ┌────────────────────────────────────────────────┐ │  │
│  │  │   Infinite Feed (Vertical Scroll)              │ │  │
│  │  │                                                │ │  │
│  │  │   ┌────────────────────────────────────────┐  │ │  │
│  │  │   │  Text Post (Gradient Card)             │  │ │  │
│  │  │   │  "This is my frequency"                │  │ │  │
│  │  │   └────────────────────────────────────────┘  │ │  │
│  │  │                                                │ │  │
│  │  │   ┌────────────────────────────────────────┐  │ │  │
│  │  │   │  Image Post                            │  │ │  │
│  │  │   │  [Full-width image]                    │  │ │  │
│  │  │   │  Caption: "Check this out"             │  │ │  │
│  │  │   └────────────────────────────────────────┘  │ │  │
│  │  │                                                │ │  │
│  │  │   ┌────────────────────────────────────────┐  │ │  │
│  │  │   │  Video Post                            │  │ │  │
│  │  │   │  [Auto-playing video] 🔴 LIVE         │  │ │  │
│  │  │   │  @username                             │  │ │  │
│  │  │   └────────────────────────────────────────┘  │ │  │
│  │  │                                                │ │  │
│  │  │   Component: <LiveVideoCard />                │ │  │
│  │  │                                                │ │  │
│  │  │   [Loading more...]  ← Intersection Observer │ │  │
│  │  └────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │          Upload Modal (components/UploadModal.tsx)    │  │
│  │                                                      │  │
│  │  ┌────────┐  ┌────────┐                             │  │
│  │  │  Wall  │  │ Story  │  ← Post Type Toggle         │  │
│  │  │ (Perm) │  │ (24h)  │                             │  │
│  │  └────────┘  └────────┘                             │  │
│  │                                                      │  │
│  │  [Text Input]                                        │  │
│  │  [Media Upload]                                      │  │
│  │  [Submit Button]                                     │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

```
┌─────────────┐
│    User     │
└──────┬──────┘
       │ 1. Creates Post
       ↓
┌─────────────────────────────────┐
│      UploadModal.tsx            │
│  - Validates input              │
│  - Uploads media to storage     │
│  - Calculates expires_at        │
└──────┬──────────────────────────┘
       │ 2. Insert Post
       ↓
┌─────────────────────────────────┐
│   Supabase Database             │
│   wall_messages table           │
│   ┌───────────────────────────┐ │
│   │ id: uuid                  │ │
│   │ content: text             │ │
│   │ media_url: text           │ │
│   │ post_type: 'wall'|'story' │ │◄─── NEW
│   │ expires_at: timestamp     │ │◄─── NEW
│   │ created_at: timestamp     │ │
│   └───────────────────────────┘ │
└──────┬──────────────────────────┘
       │ 3. Query Posts
       ↓
┌─────────────────────────────────┐
│      Hue Page (Feed)            │
│                                 │
│  Query 1: Stories               │
│  ─────────────────             │
│  SELECT * FROM wall_messages    │
│  WHERE post_type = 'story'      │
│    AND expires_at > NOW()       │
│  LIMIT 3                        │
│                                 │
│  Query 2: Feed                  │
│  ─────────────────             │
│  SELECT * FROM wall_messages    │
│  WHERE post_type = 'wall'       │
│  ORDER BY created_at DESC       │
│  RANGE (offset, offset+9)       │
└──────┬──────────────────────────┘
       │ 4. Render Content
       ↓
┌─────────────────────────────────┐
│   Component Selection           │
│                                 │
│   if (post_type === 'story')    │
│   └─> <StoryCircle />           │
│                                 │
│   if (media_url && video)       │
│   └─> <LiveVideoCard />         │
│                                 │
│   if (media_url && image)       │
│   └─> <img /> with caption      │
│                                 │
│   if (!media_url)               │
│   └─> Text card with gradient   │
└─────────────────────────────────┘
```

## Video Auto-Play Flow

```
┌──────────────────────────────────┐
│     User scrolls feed            │
└────────────┬─────────────────────┘
             │
             ↓
┌──────────────────────────────────┐
│  Intersection Observer           │
│  Watches video element           │
│  Threshold: 50% visibility       │
└────────────┬─────────────────────┘
             │
       ┌─────┴─────┐
       │           │
   YES │           │ NO
       ↓           ↓
┌─────────────┐  ┌─────────────┐
│ 50% visible │  │ Out of view │
│ video.play()│  │ video.pause()│
└─────────────┘  └─────────────┘
```

## Database Schema

```
┌─────────────────────────────────────────────────────────┐
│                    wall_messages                         │
├──────────────┬──────────────────────────────────────────┤
│ Column       │ Type                                      │
├──────────────┼──────────────────────────────────────────┤
│ id           │ UUID (PK)                                 │
│ user_id      │ UUID (FK → users)                        │
│ username     │ TEXT                                      │
│ content      │ TEXT                                      │
│ media_url    │ TEXT (nullable) ← Storage URL            │
│ message_type │ TEXT (text|picture|voice|system)         │
│ post_type    │ TEXT (wall|story) ← NEW                  │
│ expires_at   │ TIMESTAMP (nullable) ← NEW               │
│ is_pope_ai   │ BOOLEAN                                   │
│ created_at   │ TIMESTAMP                                 │
└──────────────┴──────────────────────────────────────────┘

Indexes:
- idx_wall_messages_created_at (created_at DESC)
- idx_wall_messages_post_type (post_type) ← NEW
- idx_wall_messages_expires_at (expires_at) ← NEW
```

## Component Hierarchy

```
App
└── Hue Page
    ├── Stories Row
    │   ├── StoryCircle (Story 1)
    │   ├── StoryCircle (Story 2)
    │   └── StoryCircle (Story 3)
    │
    └── Feed Container
        ├── Pull to Refresh
        │
        ├── Post Loop
        │   ├── Text Post (if !media_url)
        │   ├── Image Post (if media_url && picture)
        │   └── LiveVideoCard (if media_url && voice)
        │       └── Intersection Observer
        │
        └── Infinite Scroll Trigger
            └── Load More Posts
```

## State Management

```
Hue Page State:
┌─────────────────────────────────┐
│ stories: WallMessage[]          │ ← Top 3 active stories
│ feed: WallMessage[]             │ ← Current feed posts
│ loading: boolean                │ ← Initial load state
│ loadingMore: boolean            │ ← Pagination load
│ hasMore: boolean                │ ← More posts available?
│ offset: number                  │ ← Current pagination offset
└─────────────────────────────────┘

Upload Modal State:
┌─────────────────────────────────┐
│ content: string                 │ ← Text message
│ file: File | null               │ ← Selected media
│ postType: 'wall' | 'story'      │ ← NEW: Post type
│ loading: boolean                │ ← Upload in progress
│ error: string                   │ ← Validation errors
└─────────────────────────────────┘

LiveVideoCard State:
┌─────────────────────────────────┐
│ isInView: boolean               │ ← Video visibility
│ videoRef: HTMLVideoElement      │ ← Video DOM reference
└─────────────────────────────────┘
```

## Timeline: Story Lifecycle

```
Hour 0: Story Created
├─> post_type = 'story'
├─> expires_at = NOW() + 24h
├─> Appears in stories row
└─> Pulsing border (LIVE)

Hour 3: Still Active
├─> Still visible in stories row
├─> Border changes to solid (Recent)
└─> No longer pulsing

Hour 24: Expired
├─> expires_at < NOW()
├─> Filtered out of stories query
└─> No longer visible

Optional: Cleanup Job
└─> DELETE FROM wall_messages
    WHERE post_type = 'story'
    AND expires_at < NOW() - INTERVAL '7 days'
```

## API Endpoints (Future)

```
GET /api/stories
├─> Returns active stories
└─> Filters by expires_at > NOW()

GET /api/hue/feed
├─> Returns paginated feed
├─> Params: offset, limit
└─> Filters by post_type = 'wall'

POST /api/upload
├─> Handles media upload
├─> Sets post_type and expires_at
└─> Returns created post

GET /api/story/:id
├─> Returns single story
└─> Increments view count (future)

DELETE /api/story/:id
├─> Allows creator to delete
└─> Before expiration
```

## Performance Metrics

```
Query Performance:
├─> Stories query: ~10-20ms (indexed, LIMIT 3)
├─> Feed query: ~20-50ms (indexed, paginated)
└─> Media upload: ~500-2000ms (depends on file size)

Render Performance:
├─> Initial load: <1s (first 10 posts)
├─> Infinite scroll: <500ms (next 10 posts)
└─> Video auto-play: <100ms (intersection observer)

Network Usage:
├─> Initial page load: ~100-200KB (HTML/CSS/JS)
├─> Stories load: ~50-100KB (3 stories with metadata)
├─> Feed load (10 posts): ~200-500KB (with lazy images)
└─> Video streaming: ~1-5MB per video (depends on length)
```

## Mobile vs Desktop

```
Mobile (< 768px):
├─> Stories: Horizontal scroll, full-width container
├─> Feed: Single column, full-width posts
├─> Videos: Auto-play on scroll, tap to unmute
└─> Pull-to-refresh: Native gesture support

Tablet (768px - 1024px):
├─> Stories: Same as mobile
├─> Feed: Single column, max-width 600px
├─> Videos: Larger playback area
└─> Touch-optimized controls

Desktop (> 1024px):
├─> Stories: Same layout, centered
├─> Feed: Single column, max-width 700px
├─> Videos: Full controls visible
└─> Mouse hover effects enabled
```

## Security & Permissions

```
RLS Policies:
┌─────────────────────────────────────────┐
│ wall_messages table:                    │
│ ├─> SELECT: Anyone can view             │
│ ├─> INSERT: Authenticated users only    │
│ ├─> UPDATE: Owner or admin only         │
│ └─> DELETE: Owner or admin only         │
└─────────────────────────────────────────┘

Storage (media bucket):
┌─────────────────────────────────────────┐
│ ├─> SELECT: Public (public bucket)      │
│ ├─> INSERT: Authenticated users only    │
│ └─> DELETE: File owner only             │
└─────────────────────────────────────────┘
```

## Error Handling

```
Upload Modal:
├─> No media on story → "Stories require media"
├─> File too large → "Max 50MB"
├─> Invalid type → "Valid: jpg, png, gif, webp, mp4, webm"
├─> Upload failed → Show error + retry option
└─> Network error → "Check connection"

Hue Feed:
├─> No stories → Show placeholder message
├─> No feed posts → "Be the first to post"
├─> Load error → Retry button
├─> Video error → Show thumbnail fallback
└─> End of feed → "You've reached the end"

Auto-Play:
├─> Autoplay blocked → Show play button
├─> Video failed → Log error, show placeholder
└─> Network slow → Show loading spinner
```

---

## 🎯 Key Takeaways

1. **Two Query System**: Stories and feed fetched separately
2. **Intersection Observer**: Powers video auto-play and infinite scroll
3. **Post Types**: `wall` (permanent) vs `story` (24h)
4. **Performance**: Indexed queries, lazy loading, pagination
5. **Mobile First**: Responsive design, touch-optimized

**Built for scale, optimized for experience.** 🚀
