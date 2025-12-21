# Artist Page System - The 6713 Rule Implementation Guide

## 🎯 Overview

The Artist Page system implements the **6713 Rule**: intentional curation through strict limits on content, favorites, and history. This creates a platform where every pixel and second of audio matters.

**Core Constraints**:
- **3 Sound Snippets** per artist (10s max each)
- **Elite 6 Gallery** (only 6 videos per sound)
- **5 Verified Favorites** (The Jukebox)
- **1 Anchor Post** (permanent photo)
- **10 Video Watch History** (prevents rabbit holes)
- **15s Max Videos** (crop-only editing)

---

## 📂 Files Created

### Database
- **[database/migration-artist-pages.sql](database/migration-artist-pages.sql)** - Complete schema

### Components
- **[components/ArtistPage.tsx](components/ArtistPage.tsx)** - 4-zone artist profile

### Documentation
- This guide

---

## 🗄️ Database Schema

### 1. Artist Profile Extensions
```sql
ALTER TABLE profiles ADD:
- is_artist: BOOLEAN (unlocks 3 sounds + Elite 6)
- artist_bio: TEXT
- featured_videos: UUID[] (3 pinned video IDs)
- pinned_count: INTEGER (max 3)
```

### 2. Sound Snippets (3 per Artist)
```sql
CREATE TABLE sound_snippets (
  id: UUID
  artist_id: UUID → profiles
  title: TEXT
  audio_url: TEXT
  duration_seconds: INTEGER ≤ 10
  external_link: TEXT (commerce or full track)
  sort_order: INTEGER (0-2)
  play_count: BIGINT
)
```

**Constraint**: Max 3 sounds per artist via `check_artist_sound_limit()` trigger

### 3. Elite 6 Gallery (6 Videos per Sound)
```sql
CREATE TABLE elite_6_videos (
  id: UUID
  sound_id: UUID → sound_snippets
  video_id: UUID → messages
  creator_id: UUID → profiles
  quality_score: INTEGER (determines "weakest link")
  slot_number: INTEGER (1-6)
)
```

**Functions**:
- `add_to_elite_6()` - Adds video or prompts to replace weakest
- `replace_elite_6_video()` - Replaces specific video in gallery

### 4. Verified Favorites (Max 5)
```sql
CREATE TABLE user_favorites (
  id: UUID
  user_id: UUID → profiles (must be verified)
  sound_id: UUID → sound_snippets
  favorited_at: TIMESTAMPTZ
)
```

**Constraint**: Max 5 favorites via `check_favorite_limit()` trigger

### 5. Anchor Post (1 per User)
```sql
CREATE TABLE anchor_posts (
  id: UUID
  user_id: UUID UNIQUE → profiles
  photo_url: TEXT (no videos allowed)
  caption: TEXT
  sound_snippet_id: UUID → sound_snippets (optional 10s)
)
```

**Constraint**: Only 1 anchor post per user via `check_anchor_post_limit()` trigger

### 6. Watch History (10 Videos Max)
```sql
CREATE TABLE watch_history (
  id: UUID
  user_id: UUID → profiles
  video_id: UUID → messages
  watched_at: TIMESTAMPTZ
  watch_duration_seconds: INTEGER
)
```

**Auto-Cleanup**: `maintain_watch_history()` deletes 11th+ entries

### 7. Activity Log (Recent Activity Audit)
```sql
CREATE TABLE activity_log (
  id: UUID
  user_id: UUID → profiles
  activity_type: TEXT (viewed_profile, viewed_gig, viewed_post, etc.)
  target_id: UUID
  target_type: TEXT
  target_username: TEXT
  target_title: TEXT
  duration_minutes: INTEGER
  is_expired: BOOLEAN (true if content deleted)
  created_at: TIMESTAMPTZ
)
```

**Expiration Tracking**: `mark_activity_expired()` triggers on content deletion

### 8. Admin Tickets (Moderation System)
```sql
CREATE TABLE admin_tickets (
  id: UUID
  target_type: TEXT (post, profile, sound, comment)
  target_id: UUID
  target_user_id: UUID → profiles
  opened_by_admin: UUID → profiles
  reason: TEXT
  status: TEXT (pending, user_editing, resolved, escalated)
  resolution_notes: TEXT
)
```

**Function**: `admin_open_ticket()` - Request changes instead of instant ban

### 9. Hashtags (Volatile Search)
```sql
CREATE TABLE hashtags (
  id: UUID
  tag: TEXT UNIQUE LOWERCASE
  post_count: INTEGER
  language: TEXT
  last_used_at: TIMESTAMPTZ
)

CREATE TABLE post_hashtags (
  post_id: UUID → messages
  hashtag_id: UUID → hashtags
)
```

**Auto-Cleanup**: `cleanup_unused_hashtags()` deletes tags with 0 posts

---

## 🎨 Artist Page UI - 4 Zones

### Zone 1: Identity Header
**Components**:
- Avatar (80x80 circular)
- Verified Name (h1, 2xl font)
- @username (zinc-400)
- Artist badge (purple)
- QT Blimp (minutes spent viewing, yellow-400, 3xl font)
- Artist bio (text-sm, leading-relaxed)
- COMA status indicator (if applicable)

### Zone 2: Featured Grid (3 Pinned Videos)
**Layout**: 3-column grid with aspect-square cells

**Interaction**:
- Click video → navigate to post detail
- Empty slots show dashed border with Pin icon

**Stranger View**: Non-functional (cursor-default)

### Zone 3: Sound Library (3 Waveforms)
**Each Sound Card**:
- Waveform icon (Music, 12x12)
- Sound title (font-bold)
- Duration (10s max)
- Play count
- External link icon (if present)
- Play/Pause button

**Interaction**:
- Click card → navigate to Sound Page
- Click play → preview audio (disabled in Stranger View)

### Zone 4: Records Tabs
**3 Tabs**: Wiki, Gigs, Bank

**Wiki Tab**:
- Shows Anchor Post (permanent photo)
- Caption text
- Factual history

**Gigs Tab**:
- Friendship resumes
- Collaboration history

**Bank Tab**:
- Linked to $$$4U signals
- Financial activities

---

## 🎵 Sound Page (Elite 6 Gallery)

### Layout
1. **Header**:
   - Sound title (h1, bold)
   - Artist name + avatar
   - Duration + play count
   - External link button (if present)

2. **Elite 6 Gallery**:
   - 2x3 or 3x2 grid
   - Aspect-square video thumbnails
   - Slot numbers (1-6)
   - Quality score indicator

3. **Add Video Flow**:
   ```
   User posts video with sound attachment
   ↓
   Check Elite 6 count
   ↓
   If < 6: Add to next slot
   If = 6: Show prompt:
     "The Elite 6 are full. Replace the weakest link?"
     [Show weakest video with quality score]
     [Replace] [Cancel]
   ```

---

## ✂️ High-Intent Editor

### Features
- **Camera Access**: Device camera for 15s max recording
- **One Function**: Crop only (no filters, stickers, effects)
- **Sound Attachment**: 
  - Music note icon opens drawer
  - Shows artist's 3 sounds OR user's 5 favorites
  - One-tap attach
- **Post Button**: Bold center button
- **Auto-Upload**: Uploads to cloud storage (S3/Firebase)
- **Elite 6 Check**: Prompts if sound gallery full

### UI Components Needed
```tsx
<Editor>
  <CameraView maxDuration={15} />
  <CropTool />
  <SoundDrawer>
    {artistSounds.map(sound => (
      <SoundOption onClick={() => attachSound(sound.id)} />
    ))}
  </SoundDrawer>
  <PostButton onClick={handlePost} />
</Editor>
```

---

## 🧠 Memory Bank (Recent Activity)

### Location
**You (&)** tab → Recent Activity

### Components

#### 1. Watch History (Horizontal Scroll)
- Last 10 videos viewed
- Square thumbnails (1:1 aspect)
- Auto-deletes 11th+ entry
- Click → navigate to video

#### 2. Activity Audit (Vertical List)
**Entry Format**:
```
[Icon] Viewed [Artist Name] Gig — 12m
[Icon] Looked at [Post Link] — 4 hrs
```

**States**:
- **Active**: White bold text, clickable
- **Expired**: ~~Grey strikethrough~~, inactive

**Implementation**:
```tsx
<ActivityLog>
  {activities.map(activity => (
    <ActivityEntry
      key={activity.id}
      isExpired={activity.is_expired}
      onClick={() => !activity.is_expired && navigate(activity.target_id)}
      className={activity.is_expired ? 'line-through text-zinc-600' : 'text-white'}
    >
      {activity.target_username} · {activity.duration_minutes}m
    </ActivityEntry>
  ))}
</ActivityLog>
```

---

## 👁️ Stranger View (Preview Mode)

### Purpose
Allows artist to see profile exactly as non-connected users see it

### Implementation
```tsx
<ArtistPage
  artistId={currentUserId}
  isOwnProfile={true}
  isStrangerView={true}
/>
```

### Behavior
- All buttons visible but **non-functional**
- Hover states disabled
- `cursor-default` on all interactive elements
- Shows "13+" like count (not actual number)
- Cannot play sounds
- Cannot navigate to posts
- Purple indicator: "Stranger View (Preview Only)"

### Use Case
Artist verifies:
- 3 pinned videos look good
- 3 waveforms display correctly
- Anchor post visible
- "13+" like cap working
- Bio text readable

---

## 🎛️ Admin Command Center

### Feature Toggles
**Global Switches**:
- Incognito Mode (enable/disable)
- 4th Wall Breaks (maintenance mode)
- Elite 6 System (rollout control)
- Hashtag Search (enable/disable)

**UI**:
```tsx
<AdminToggles>
  <Toggle label="Incognito Mode" enabled={features.incognito} />
  <Toggle label="4th Wall" enabled={features.fourthWall} />
  <Toggle label="Elite 6" enabled={features.elite6} />
</AdminToggles>
```

### Artist Assignment
**Dropdown Menu**:
1. Search for user by @username or name
2. Click "Assign Artist"
3. Calls `admin_toggle_artist(user_id, true)`
4. Unlocks 3 sounds + Elite 6 for user

**UI**:
```tsx
<ArtistAssignment>
  <SearchBar placeholder="Search user..." />
  <UserList>
    {results.map(user => (
      <UserRow>
        {user.verified_name} @{user.username}
        <Button onClick={() => toggleArtist(user.id)}>
          {user.is_artist ? 'Remove Artist' : 'Assign Artist'}
        </Button>
      </UserRow>
    ))}
  </UserList>
</ArtistAssignment>
```

### Ticket System
**Flow**:
1. Admin sees problematic post
2. Clicks "Open Ticket"
3. Enters reason: "Content violates community standards"
4. Post gets blurred overlay: "Pending Change"
5. User receives notification: "Admin has requested a change"
6. User edits post or contacts admin
7. Admin reviews and closes ticket

**UI**:
```tsx
<TicketQueue>
  {tickets.map(ticket => (
    <TicketCard>
      <PostPreview postId={ticket.target_id} blurred />
      <TicketDetails>
        <User>@{ticket.target_username}</User>
        <Reason>{ticket.reason}</Reason>
        <Status>{ticket.status}</Status>
      </TicketDetails>
      <Actions>
        <Button onClick={() => resolveTicket(ticket.id)}>
          Resolve
        </Button>
        <Button onClick={() => escalateTicket(ticket.id)}>
          Escalate
        </Button>
      </Actions>
    </TicketCard>
  ))}
</TicketQueue>
```

---

## ⚓ Anchor Post

### Rules
- **1 per user** (permanent)
- **Photo only** (no videos)
- **Text caption** allowed
- **10s sound** attachment optional
- **Top of grid** placement (always visible)

### UI
```tsx
<AnchorPostEditor>
  <PhotoUpload accept="image/*" maxSize={50 * 1024 * 1024} />
  <CaptionInput maxLength={500} />
  <SoundAttachment optional maxDuration={10} />
  <SubmitButton>Create Anchor Post</SubmitButton>
</AnchorPostEditor>
```

### Display
- Shows at top of profile grid
- Border or badge to indicate "Anchor"
- Cannot be deleted (only updated)
- Exempt from expiration rules

---

## #️⃣ Hashtag System

### Creation
User adds hashtags to post:
```tsx
<PostEditor>
  <TextArea placeholder="What's happening? Use #hashtags" />
</PostEditor>
```

Parse and create hashtags:
```tsx
const hashtags = extractHashtags(postContent);
hashtags.forEach(async (tag) => {
  await createOrIncrementHashtag(tag);
  await linkHashtagToPost(postId, hashtagId);
});
```

### Search
```tsx
<SearchBar>
  <Input placeholder="Search #hashtags..." />
  <Suggestions>
    {trending.map(tag => (
      <HashtagSuggestion onClick={() => searchByTag(tag)}>
        #{tag.tag} · {tag.post_count} posts
      </HashtagSuggestion>
    ))}
  </Suggestions>
</SearchBar>
```

### Auto-Cleanup
When post deleted:
1. `DELETE FROM post_hashtags WHERE post_id = ?`
2. Trigger: `cleanup_unused_hashtags()`
3. Deletes hashtags with `post_count = 0`

Result: Hashtags disappear when no active posts use them

---

## 🎨 Color Palette & UI Philosophy

### Background
- Pure Black: `#000000` (battery saving + depth)

### Text
- Paper White: `#FFFFFF` (primary)
- Slate Grey: `#71717A` (secondary, zinc-500)

### Functional Accents
- **Gold**: `#D4AF37` - Financials/Talents
- **Electric Purple**: `#A855F7` - Incognito/Special
- **Yellow**: `#FACC15` - Primary actions (yellow-400)
- **Red**: `#EF4444` - Danger/Warnings

### Navigation
- **6-Tab Menu**: Floating top bar (not bottom footer)
- **Long Press**: Reveals sub-menu
- **Pull-to-Breathe**: 0.5s blur instead of spinner

---

## 🚀 Setup Instructions

### 1. Run Database Migration
```bash
psql $DATABASE_URL -f database/migration-artist-pages.sql
```

**Verify**:
```sql
SELECT * FROM sound_snippets LIMIT 5;
SELECT * FROM elite_6_videos LIMIT 5;
SELECT * FROM user_favorites LIMIT 5;
SELECT * FROM anchor_posts LIMIT 5;
SELECT * FROM watch_history LIMIT 10;
SELECT * FROM activity_log ORDER BY created_at DESC LIMIT 10;
SELECT * FROM admin_tickets WHERE status = 'pending';
```

### 2. Create Storage Buckets
In Supabase Dashboard → Storage:
```sql
-- Sound snippets (10s audio files)
CREATE BUCKET sounds;

-- Elite 6 videos (15s max)
CREATE BUCKET elite-6-videos;

-- Anchor posts (photos only)
CREATE BUCKET anchor-posts;
```

Set to **Public** with appropriate size limits.

### 3. Assign First Artist
```sql
-- Via SQL
SELECT admin_toggle_artist('user-uuid', true);

-- Or via Admin UI
-- Search user → Click "Assign Artist"
```

### 4. Test Elite 6 Flow
1. Artist uploads sound snippet (10s audio)
2. Create 6 videos with that sound attached
3. Try to add 7th video
4. See prompt: "The Elite 6 are full. Replace the weakest link?"
5. Choose to replace or cancel

### 5. Test Stranger View
1. Log in as artist
2. Navigate to own profile
3. Click "Stranger View" button
4. Verify all buttons non-functional
5. See purple indicator at bottom

---

## 📊 Storage Architecture

### Media Storage Structure
```
videos/
  sound_id_1/
    video_1.mp4 (15s max)
    video_2.mp4
    ...
    video_6.mp4 (Elite 6 cap)
  sound_id_2/
    video_1.mp4
    ...

sounds/
  artist_id_1/
    sound_1.mp3 (10s max)
    sound_2.mp3
    sound_3.mp3 (3 sound cap)

anchor-posts/
  user_id.jpg (permanent)
```

### Auto-Cleaning Logic
```typescript
// When video bumped from Elite 6
await deleteFromStorage(`videos/${soundId}/${oldVideoId}.mp4`);

// When sound deleted
await deleteFromStorage(`sounds/${artistId}/${soundId}.mp3`);

// When post expires (not anchor post)
await deleteFromStorage(`posts/${postId}.mp4`);
```

### Efficiency
- **15s video cap** = ~5-10 MB per video
- **Elite 6** = max 60 MB per sound
- **3 sounds** = max 180 MB per artist
- **10s audio** = ~1 MB per sound
- **Total per artist**: ~200 MB max

---

## 🔧 Key Functions Usage

### Add Video to Elite 6
```typescript
const { data } = await supabase.rpc('add_to_elite_6', {
  p_sound_id: soundId,
  p_video_id: newVideoId,
  p_creator_id: userId,
  p_quality_score: 100, // Based on likes, comments, etc.
});

if (data.action === 'prompt_replace') {
  // Show "Replace weakest link?" modal
  showReplacePrompt(data.weakest_id, data.weakest_score);
} else {
  // Video added successfully
  toast.success(data.message);
}
```

### Replace Elite 6 Video
```typescript
const { data } = await supabase.rpc('replace_elite_6_video', {
  p_sound_id: soundId,
  p_old_video_id: weakestVideoId,
  p_new_video_id: newVideoId,
  p_creator_id: userId,
  p_quality_score: 100,
});

if (data.success) {
  toast.success(`Video replaced in slot ${data.slot_number}`);
}
```

### Favorite a Sound
```typescript
const { error } = await supabase
  .from('user_favorites')
  .insert({
    user_id: currentUserId,
    sound_id: soundId,
  });

if (error?.message.includes('5 sounds maximum')) {
  toast.error('You can only favorite 5 sounds. Remove one to add another.');
}
```

### Open Admin Ticket
```typescript
const ticketId = await supabase.rpc('admin_open_ticket', {
  p_target_type: 'post',
  p_target_id: postId,
  p_target_user_id: postOwnerId,
  p_reason: 'Content violates community guidelines',
});

// Send notification to user
await sendNotification(postOwnerId, {
  type: 'admin_ticket',
  message: 'Admin has requested changes to your post',
  ticketId,
});
```

### Track Watch History
```typescript
const { error } = await supabase
  .from('watch_history')
  .insert({
    user_id: currentUserId,
    video_id: videoId,
    watch_duration_seconds: 15,
  });

// Auto-cleanup happens via trigger (maintains 10 max)
```

### Log Activity
```typescript
await supabase.from('activity_log').insert({
  user_id: currentUserId,
  activity_type: 'viewed_profile',
  target_id: artistId,
  target_type: 'profile',
  target_username: artistUsername,
  duration_minutes: qtMinutes,
});
```

---

## 🎯 Testing Checklist

- [ ] Run database migration successfully
- [ ] Create storage buckets (sounds, elite-6-videos, anchor-posts)
- [ ] Assign artist status to test user
- [ ] Upload 3 sound snippets (10s each)
- [ ] Create 6 videos for one sound
- [ ] Try to add 7th video → see "Replace weakest?" prompt
- [ ] Replace video successfully
- [ ] Create anchor post (photo only, no video)
- [ ] Try to create 2nd anchor post → see error
- [ ] Favorite 5 sounds as verified user
- [ ] Try to favorite 6th → see error message
- [ ] Watch 10 videos → see watch history
- [ ] Watch 11th video → 1st deleted automatically
- [ ] View artist profile for 5 minutes
- [ ] Check activity log shows 5m view time
- [ ] Delete a post → activity log entry shows ~~strikethrough~~
- [ ] Enable "Stranger View" → verify buttons non-functional
- [ ] Admin opens ticket on post → user sees "Pending Change"
- [ ] Create hashtag → appears in search
- [ ] Delete last post with hashtag → hashtag disappears

---

## 📖 Related Documentation

- [ADMIN_GOD_MODE_GUIDE.md](ADMIN_GOD_MODE_GUIDE.md) - Admin moderation
- [POPE_AI_MASTER_CONTROL_GUIDE.md](POPE_AI_MASTER_CONTROL_GUIDE.md) - Dynamic messaging
- [SEARCH_PROTOCOL_GUIDE.md](SEARCH_PROTOCOL_GUIDE.md) - Search & Radio

---

**"Every pixel and every second of audio matters."** - The 6713 Protocol
