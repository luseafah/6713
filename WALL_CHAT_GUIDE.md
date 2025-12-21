# Wall Chat Room Guide (#Earth)

## Overview
The Wall tab has been transformed into **#Earth**, a high-velocity real-time chat room with a 50-message rolling buffer. Unlike the Hue feed (infinite scroll), Wall operates as ephemeral chat with live updates.

---

## Core Features

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

---

**Chat Room Status:** ✅ **LIVE**  
**Last Updated:** January 2025  
**Next Feature:** GIF support + Hue post sharing
