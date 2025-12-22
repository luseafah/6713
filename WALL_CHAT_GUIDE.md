# Wall Chat Room Guide (#Earth) - The Heartbeat System

## Overview
The Wall tab (#Earth) is the **living heartbeat** of Project 6713—a high-velocity, self-cleaning town square where "Happy Humans" interact under strict minimalist moderation. It features:

- **13+ Ghost Baseline:** Always feels populated, even when empty
- **67+ Typing Cap:** Real-time activity without status anxiety
- **30-Message Story Slider:** Periodic verified user discovery
- **50-Message Auto-Purge:** Lightweight, fast, ephemeral
- **Admin Slasher Moderation:** Transparent correction without deletion

---

## 1. The Living Presence (Online & Typing)

### 13+ Ghost Online Indicator
The Wall never feels abandoned. At the top of the chat, a permanent label displays the online count.

**Key Features:**
- **Baseline:** Even if the server is empty, the count shows "13+ Online"
- **Real Count:** If more than 13 people are actually online, the real number is shown
- **Green Pulse:** A subtle green dot pulses next to the count for visual energy
- **30-Second Heartbeat:** User presence is updated every 30 seconds
- **2-Minute Timeout:** Users offline >2 minutes are removed from count

```typescript
// Display logic
Math.max(onlineCount, 13) + '+ Online'
```

### 67+ Typing Presence Cap
At the bottom, just above the input field, is the real-time typing activity monitor.

**Behavior:**
- As users type, the count updates: "3 people typing..."
- **Cap at 67:** Once 67+ people are typing, it locks at "67+ people typing..."
- **Animation:** Three-dot ellipsis pulse in muted Paper White
- **2-Second Heartbeat:** Typing presence is broadcast every 2 seconds while active
- **10-Second Timeout:** Stops showing after 10 seconds of no typing

```typescript
// Display logic
{typingCount >= 67 ? '67+' : typingCount} people typing...
```

---

## 2. The 30-Message Story Slider

### Automatic Discovery Interruption
Every 30 messages, the chat stream pauses and a **3-Story Slider** appears.

**Purpose:**
- Prevent "text fatigue" with high-fidelity visual media
- **Elite Town Square:** Random verified users are discovered by everyone
- Not a "Following" feed—pure serendipity

**Trigger Logic:**
- System counts every message sent
- At exactly every 30th message (30, 60, 90...), the slider appears
- Fetches 3 random stories from verified users across the network

**UI Features:**
- **Hue-sized (9:16) vertical thumbnails**
- Horizontal swipe navigation
- Tap story to view full content
- Click Username to visit their Sound Page
- Story counter: "Story 1 of 3"
- Close button to dismiss and continue chatting

**Database:**
```sql
-- Automatically called every 30 messages
SELECT insert_story_slider(30); -- Returns 3 story IDs
```

---

## 3. The 50-Message Auto-Purge Infrastructure

Project 6713 has a "short memory" to remain lightweight and fast.

**Mechanics:**
- **Buffer Size:** Only the last 50 items (messages + sliders) are retained
- **Auto-Deletion:** When the 51st message arrives, the 1st message is permanently deleted
- **Media Cleanup:** If a purged message contains voice/image, the file is deleted from Supabase Storage
- **No Bloat:** Ensures the app never accumulates storage waste

```typescript
const trimmed = messages.slice(-MAX_MESSAGES); // Keep last 50
```

---

## 4. Admin "Slasher" Moderation

Mods are the "Gardeners" of the Wall Chat. They have infinite power to correct without erasing history.

### The Slash Action
**How It Works:**
- Admin hovers over any message
- Clicks the red "Slash" button (icon appears on hover)
- Message is instantly struck through: ~~Slashed Text~~
- Text turns **Slate Grey** (#94a3b8)
- Original content is preserved in database for audit trail

**Visual Treatment:**
```tsx
<p className="text-slate-400 line-through">
  {message.content}
</p>
<p className="text-xs text-slate-500 italic">
  ~~Slashed by moderator~~
</p>
```

**Philosophy:**
- Unlike "Delete" which leaves a gap, "Slash" shows that correction happened
- Keeps the "Happy Human" environment **transparent but clean**
- No information is truly lost—original content is stored

**Infinite Edits:**
- Mods can slash/unslash messages infinitely
- No 1-edit limit like regular users
- Can add optional `slash_reason` for context

**Database Functions:**
```sql
-- Slash a message
SELECT slash_wall_message(
  p_message_id := 'uuid-here',
  p_mod_user_id := 'mod-uuid',
  p_reason := 'Violated community guidelines' -- Optional
);

-- Undo a slash
SELECT unslash_wall_message(
  p_message_id := 'uuid-here',
  p_mod_user_id := 'mod-uuid'
);
```

---

---

## 5. The Functional Flow: A Human Perspective

Imagine entering the Wall:

1. **Status:** You see "13+ Online" at the top with a green pulse. You feel welcome, never alone.

2. **Conversation:** People are chatting. The bottom says "67+ people typing..." The energy is high and alive.

3. **Discovery:** After 30 messages, a Story Slider appears. You see 3 random verified artists you've never encountered. You swipe through their Hue-style stories. You tap a "Pretty Link" username and are redirected to their Sound Page.

4. **Moderation:** You notice a message that looks like it violated a rule—it's ~~Slashed out in grey~~. You know a Mod is active and the square is safe.

5. **Economy:** You run out of Talents to send a "Throw" post. You tap the $$$ Pill at the top of the Wall, enter the private chat with Admin, pay outside the app, and watch your balance in the Hamburger Menu update.

---

## Core Technical Features

### 1. **50-Message Rolling Buffer**
- Only the last 50 messages are displayed at any time
- Older messages are automatically discarded from the UI
- Uses `Set` tracking to identify which messages are currently visible
- Messages are fetched in descending order, then reversed for display

```typescript
const MAX_MESSAGES = 50;

// Keep only last 50
const trimmed = updated.slice(-MAX_MESSAGES);
messageIdsInBuffer.current = new Set(trimmed.map(m => m.id));
```

### 2. **Real-Time Updates (Supabase Realtime)**
Replaced 3-second polling with instant Supabase subscription:

```typescript
const channel = supabase
  .channel('wall-messages')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'wall_messages',
      filter: 'post_type=eq.wall'
    },
    (payload) => {
      const newMsg = payload.new as WallMessage;
      setMessages((prev) => {
        const updated = [...prev, newMsg];
        return updated.slice(-MAX_MESSAGES); // Keep buffer limit
      });
    }
  )
  .subscribe();
```

**Why This Matters:**
- Zero polling overhead
- Instant message delivery
- Scales to thousands of concurrent users
- Messages appear within milliseconds

### 3. **7-Second Slowmode**
Prevents spam by enforcing a 7-second cooldown after each message:

```typescript
const SLOWMODE_SECONDS = 7;
const [slowmodeCooldown, setSlowmodeCooldown] = useState(0);

// After sending
setSlowmodeCooldown(SLOWMODE_SECONDS);

// Countdown timer
useEffect(() => {
  if (slowmodeCooldown > 0) {
    const timer = setTimeout(() => {
      setSlowmodeCooldown(prev => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }
}, [slowmodeCooldown]);
```

Send button shows countdown: `5s`, `4s`, `3s`...

### 4. **Reply Logic with Buffer Check**
When replying to a message, the system checks if it's still in the 50-message buffer:

```typescript
const isMessageInBuffer = (messageId: string) => {
  return messageIdsInBuffer.current.has(messageId);
};

// In UI
{replyingTo && (
  <p className="text-xs text-white/40 truncate">
    {isMessageInBuffer(replyingTo.id)
      ? replyingTo.content.substring(0, 50)
      : 'Ask @' + replyingTo.username}
  </p>
)}
```

**Behavior:**
- **In buffer:** Shows message preview
- **Out of buffer:** Shows "Ask @username" (user must DM them)

### 5. **Voice Messages**
Users can record and send voice messages using the MediaRecorder API:

```typescript
// Start recording
voiceRecorder.startRecording();

// Stop and upload
const audioBlob = await voiceRecorder.stopRecording();
const voiceUrl = await voiceRecorder.uploadVoiceMessage(audioBlob);

await supabase.from('wall_messages').insert({
  user_id: currentUserId,
  username: currentUsername,
  content: `Voice message (${voiceRecorder.duration}s)`,
  media_url: voiceUrl,
  message_type: 'voice',
  post_type: 'wall'
});
```

**UI Features:**
- Red pulsing recording indicator
- Live duration timer (MM:SS)
- Progress bar (max 60 seconds)
- Cancel or Send buttons
- Audio waveform player in chat

**Storage Path:** `media/voice/{userId}-{timestamp}.webm`

### 6. **Pope AI Highlighting**
Messages from Pope AI are visually distinct:

```typescript
<div className={`group ${
  message.is_pope_ai 
    ? 'bg-red-900/20 border border-red-500/30 rounded-lg p-3' 
    : ''
}`}>
  {message.is_pope_ai && (
    <span className="text-xs bg-red-500/20 text-red-300 px-2 py-0.5 rounded">
      POPE AI
    </span>
  )}
</div>
```

**Visual Treatment:**
- Red background glow (`bg-red-900/20`)
- Red border (`border-red-500/30`)
- "POPE AI" badge
- Red username color

---

## Database Schema

### New Heartbeat Tables

```sql
-- Admin Slasher Columns (added to wall_messages)
ALTER TABLE wall_messages ADD COLUMN
  is_slashed BOOLEAN DEFAULT FALSE,
  slashed_by UUID REFERENCES users(id),
  slashed_at TIMESTAMP WITH TIME ZONE,
  original_content TEXT,
  slash_reason TEXT;

-- Story Slider Tracking
CREATE TABLE wall_story_sliders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slider_position INTEGER NOT NULL, -- 30, 60, 90...
  story_ids UUID[] NOT NULL, -- Array of 3 story IDs
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Typing Presence (67+ Cap)
CREATE TABLE wall_typing_presence (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  started_typing_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Online Presence (13+ Ghost Baseline)
CREATE TABLE wall_online_presence (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Required Columns in `wall_messages`

```sql
CREATE TABLE wall_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  content TEXT NOT NULL,
  media_url TEXT, -- Stores audio/image URLs
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'voice', 'picture', 'system')),
  post_type TEXT DEFAULT 'wall' CHECK (post_type IN ('wall', 'story')),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_permanent BOOLEAN DEFAULT FALSE,
  is_pope_ai BOOLEAN DEFAULT FALSE,
  is_coma_whisper BOOLEAN DEFAULT FALSE,
  admin_rigged_stats BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for real-time queries
CREATE INDEX idx_wall_messages_created_at ON wall_messages(created_at DESC);
CREATE INDEX idx_wall_messages_post_type ON wall_messages(post_type);
```

### Supabase Realtime Enable

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE wall_messages;
```

---

## File Structure

```
components/
  WallChat.tsx          # Main chat room component
  Wall.tsx              # OLD component (can be archived)

hooks/
  useVoiceRecorder.ts   # Voice recording hook

app/
  wall/
    page.tsx            # Updated to use WallChat

types/
  database.ts           # WallMessage interface with message_type
```

---

## Usage

### As a User

1. **Send Text Message:**
   - Type in the input box
   - Press Enter or click Send button
   - Wait 7 seconds before sending again

2. **Send Voice Message:**
   - Click the microphone icon
   - Record up to 60 seconds
   - Click "Send" to upload or "Cancel" to discard

3. **Reply to Message:**
   - Click "Reply" under any message
   - Type your response
   - If the original message scrolls out of buffer, you'll see "Ask @username"

4. **Read Pope AI Messages:**
   - Look for red-highlighted messages
   - These are permanent and never expire

### As a Developer

**Fetching Recent Messages:**
```typescript
const { data } = await supabase
  .from('wall_messages')
  .select('*')
  .eq('post_type', 'wall')
  .order('created_at', { ascending: false })
  .limit(50);
```

**Sending a Message:**
```typescript
await supabase.from('wall_messages').insert({
  user_id: session.user.id,
  username: userProfile.username,
  content: 'Hello, #Earth!',
  message_type: 'text',
  post_type: 'wall'
});
```

**Checking Buffer Status:**
```typescript
const messageIds = messages.map(m => m.id);
const isInBuffer = messageIds.includes(targetMessageId);
```

---

## Advanced Features (Future)

### $$$ Money Chat Integration
The $$$ Pill at the top of Wall Chat opens a direct DM with Admin for Talent purchases.

**Flow:**
1. User taps $$$ Pill
2. Opens Money Chat (private DM with Admin)
3. User requests Talents, pays via external method
4. Admin manually updates balance in database
5. User sees new balance in Hamburger Menu

### Hue Post Sharing (1 Talent Cost)
Not yet implemented. Will allow users to share Hue posts in the chat for 1 Talent:

```typescript
const shareHuePost = async (postId: string) => {
  // Deduct 1 Talent
  const { data: profile } = await supabase
    .from('users')
    .select('talent_balance')
    .eq('id', userId)
    .single();

  if (profile.talent_balance < 1) {
    alert('Need 1 Talent to share Hue post');
    return;
  }

  await supabase.rpc('deduct_talent', { user_id: userId, amount: 1 });

  // Post to Wall
  await supabase.from('wall_messages').insert({
    user_id: userId,
    username: currentUsername,
    content: `Shared Hue post: ${postId}`,
    message_type: 'picture',
    post_type: 'wall'
  });
};
```

### GIF Support
Currently not implemented. Will use Tenor or GIPHY API:

```typescript
// Search GIFs
const searchGifs = async (query: string) => {
  const response = await fetch(
    `https://tenor.googleapis.com/v2/search?q=${query}&key=${TENOR_API_KEY}&limit=20`
  );
  return response.json();
};
```

### Message Reactions
Quick emoji reactions:

```sql
CREATE TABLE wall_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES wall_messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji)
);
```

---

## Performance Optimization

### Buffer Management
- Uses `Set` for O(1) message ID lookups
- `slice(-50)` is efficient for array trimming
- No DOM manipulation for scrolling (uses `scrollIntoView`)

### Real-Time Connection
- Single channel subscription per user
- Automatic reconnection on network loss
- Channel cleanup on component unmount

### Voice Recording
- Streams directly to Blob (no intermediate storage)
- WebM format for optimal size (opus codec)
- Upload happens in single batch (no chunking needed)

---

## Testing Checklist

- [ ] **13+ Online Ghost Indicator**
  - [ ] Verify shows "13+ Online" when no users are active
  - [ ] Shows real count when >13 users online
  - [ ] Green pulse animation works
  - [ ] Updates every 30 seconds

- [ ] **67+ Typing Presence**
  - [ ] Shows "X people typing..." when users type
  - [ ] Caps at "67+ people typing..." when >67 active
  - [ ] Three-dot ellipsis animation works
  - [ ] Disappears 10 seconds after user stops typing

- [ ] **30-Message Story Slider**
  - [ ] Slider appears at exactly 30, 60, 90 messages
  - [ ] Shows 3 random verified user stories
  - [ ] Swipe navigation works (left/right arrows)
  - [ ] Story counter shows "Story X of 3"
  - [ ] Close button dismisses slider
  - [ ] Username taps redirect to Sound Page

- [ ] **50-Message Auto-Purge**
  - [ ] Only last 50 messages display
  - [ ] 51st message deletes the 1st message
  - [ ] Voice/image media files are deleted from storage
  - [ ] No storage bloat accumulates

- [ ] **Admin Slasher Moderation**
  - [ ] Admin sees red Slash button on message hover
  - [ ] Clicking Slash strikes through text
  - [ ] Text turns slate grey (#94a3b8)
  - [ ] Shows "~~Slashed by moderator~~" label
  - [ ] Original content preserved in database
  - [ ] Can unslash to restore original message

- [ ] Send text message
- [ ] Wait for 7-second slowmode
- [ ] Record and send voice message
- [ ] Reply to recent message (in buffer)
- [ ] Reply to old message (out of buffer) - should show "Ask @username"
- [ ] Check Pope AI message highlighting
- [ ] Verify only 50 messages display
- [ ] Open two browser windows and test real-time updates
- [ ] Test voice recording cancel
- [ ] Test voice recording max duration (60s)

---

## Troubleshooting

### Online Count Not Updating
1. Check that `update_online_presence()` function exists:
   ```sql
   SELECT * FROM pg_proc WHERE proname = 'update_online_presence';
   ```
2. Verify Supabase Realtime is enabled for `wall_online_presence`
3. Check browser console for RPC errors
4. Ensure 30-second heartbeat interval is running

### Typing Indicator Not Showing
1. Check that `wall_typing_presence` table exists
2. Verify user is authenticated (typing requires auth)
3. Check 2-second broadcast interval in useEffect
4. Ensure cleanup function removes stale presence (10s timeout)

### Story Slider Not Appearing
1. Verify verified users have active stories:
   ```sql
   SELECT COUNT(*) FROM wall_messages 
   WHERE post_type = 'story' 
     AND expires_at > NOW() 
     AND user_id IN (SELECT id FROM users WHERE is_verified = TRUE);
   ```
2. Check that `insert_story_slider()` function returns 3 story IDs
3. Ensure message count is tracking correctly
4. Check browser console for RPC errors

### Slash Button Not Visible for Admin
1. Verify user `is_admin = TRUE` in database
2. Check that `isCurrentUserAdmin` state is set correctly
3. Ensure hover effect is working (`.group-hover/message:opacity-100`)
4. Verify `slash_wall_message()` function exists

### Messages Not Appearing in Real-Time
1. Check Supabase Realtime is enabled:
   ```sql
   ALTER PUBLICATION supabase_realtime ADD TABLE wall_messages;
   ```
2. Verify RLS policies allow SELECT for authenticated users
3. Check browser console for subscription errors

### Voice Recording Not Working
1. Ensure HTTPS (MediaRecorder requires secure context)
2. Check microphone permissions
3. Verify browser supports `navigator.mediaDevices.getUserMedia`

### Buffer Not Trimming
1. Verify `slice(-50)` logic in subscription handler
2. Check `messageIdsInBuffer.current` is being updated
3. Ensure `MAX_MESSAGES` constant is set to 50

---

## Related Documentation

- [GENESIS_CLEANUP_GUIDE.md](./GENESIS_CLEANUP_GUIDE.md) - Ephemeral content architecture
- [MEDIA_UPLOAD_GUIDE.md](./database/MEDIA_UPLOAD_GUIDE.md) - Storage bucket setup
- [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) - Database schema reference
- [ADMIN_GOD_MODE_GUIDE.md](./ADMIN_GOD_MODE_GUIDE.md) - Admin moderation powers
- [MONEY_CHAT_QUICKSTART.md](./MONEY_CHAT_QUICKSTART.md) - Talent economy integration

---

**Wall Chat Status:** ✅ **HEARTBEAT ACTIVE**  
**Last Updated:** December 2025  
**New Features:**
- ✅ 13+ Ghost Online Indicator
- ✅ 67+ Typing Presence Cap
- ✅ 30-Message Story Slider
- ✅ Admin Slasher Moderation
- ✅ 50-Message Auto-Purge

**Next Feature:** GIF support + Direct Hue post sharing
