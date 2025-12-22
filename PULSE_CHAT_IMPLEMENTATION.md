# Pulse (Chat) System Implementation Guide
## Project 6713: Human-First Conversations

---

## 🎯 Overview

The **Pulse (Chat)** page prioritizes human connection over generic handles. The **Nickname is the primary identifier** for every thread, ensuring the interface feels personal and direct.

**Core Philosophy**: Nickname-first, anchored utility ($$$, Pope AI), and centralized controls for the "Happy Human" flow.

---

## ✅ Implementation Complete

### 1. **Database Migration** (`database/migration-pulse-chat.sql`)

**Tables Created:**
- `system_accounts` - Fixed pillars ($$$, Pope AI)
- `chat_threads` - Conversations with nickname storage
- `chat_messages` - Individual messages with Pretty Links
- `conversation_qt` - Dwell time tracking in threads

**System Accounts Initialized:**
- **$$$** (The Banker) - Gold accent (#D4AF37), manual Talent buying
- **Pope AI** (The Guide) - Purple accent (#9333EA), 24/7 assistant

**Functions Created (15 total):**
- `get_or_create_thread()` - Get/create user or system threads
- `get_thread_list()` - Fetch threads with fixed pillars at top
- `send_message()` - Send text, media, or Pretty Links
- `get_thread_messages()` - Fetch messages with pagination
- `mark_messages_read()` - Update unread counters
- `start_conversation_qt()` - Begin QT session
- `update_conversation_qt()` - Increment dwell time
- `end_conversation_qt()` - Finalize and add to thread total
- `admin_slash_message()` - Mod strikethrough moderation
- `banker_inject_talents()` - Manual talent injection in $$$
- `pope_ai_respond()` - Auto-responses to user queries
- `set_thread_nickname()` - Update custom nickname

---

### 2. **Pulse List Page** (`app/pulse/page.tsx`)

#### **Fixed Pillars (Always at Top)**

**$$$** (The Banker):
- Gold border and accent color (#D4AF37)
- Dollar sign icon
- Subtitle: "Your private line to the Admin for manual Talent buying"
- Always pinned at position 1

**Pope AI** (The Guide):
- Purple border and accent color (#9333EA)
- Sparkles icon
- Subtitle: "Your 24/7 assistant for navigating the 6713 rules"
- Always pinned at position 2

**Visual Hierarchy:**
```
┌─────────────────────────────┐
│ [Pulse Header]              │
├─────────────────────────────┤
│ $$$ (Gold Border)           │  ← Fixed Pillar 1
│ Pope AI (Purple Border)     │  ← Fixed Pillar 2
├─────────────────────────────┤
│ John (Active)               │  ← Social Thread 1
│ Sarah (COMA)                │  ← Social Thread 2
│ Mike (Active)               │  ← Social Thread 3
│ ...                         │
└─────────────────────────────┘
```

#### **Social List (Nickname-First)**

Each thread displays:
- **Avatar** with COMA/Active indicator
- **Nickname** (bold, primary identifier) or username fallback
- **Verified Badge** (purple checkmark)
- **Last Message Preview** (truncated)
- **Timestamp** (relative, e.g., "5m ago")
- **QT Display** (total conversation time, e.g., "15m QT")
- **Unread Badge** (purple circle with count)

**Sorting**: Newest message first (below fixed pillars)

**Status Indicators:**
- 🟢 Green dot = Active
- 🔴 Red Ban icon = COMA

---

### 3. **Chat Thread Page** (`app/pulse/[threadId]/page.tsx`)

#### **Header (Nickname-Centered + QT Blimp)**

**Layout:**
```
[←] [Avatar] [Nickname (Bold, Centered)] [QT: 5:34] [👑]
                  @username (small)
```

**QT Blimp:**
- Real-time dwell time (MM:SS format)
- Purple background with clock icon
- Updates every second

**Admin Crown ($$$ thread only):**
- Yellow crown icon
- Opens talent injection panel
- Visible only to admins

#### **Messages Display**

**Message Types:**

1. **Text Messages**
   - Own messages: Purple background, right-aligned
   - Other messages: White/10 background, left-aligned
   - Rounded bubbles with sender name (if not own)

2. **Pretty Links (Shared Media)**
   - High-fidelity thumbnail
   - Aspect ratio preserved (Hue-sized)
   - Artist-stylized typography
   - **One-tap redirect**: Tapping media navigates to `/hue?post={postId}`
   - Shows video/photo icon

3. **System Messages**
   - Centered, purple border
   - Used for: Pope AI responses, talent injections
   - Shows talent amount with green dollar icon

4. **Slashed Messages**
   - ~~Strikethrough text~~
   - Muted grey/ghost state
   - Shows "Slashed by @username"
   - Stays in history as moderation record

**Admin Slasher:**
- Hover over message → Red slash button appears
- Prompts for optional reason
- Message turns grey with strikethrough
- Visible to all as moderation record

#### **Input Bar**

**Features:**
- Rounded full-width input
- Purple send button
- Context-aware placeholder:
  - Pope AI: "Ask about 6713 rules, CPR, or Talents..."
  - $$$: "Request manual Talent top-up..."
  - Social: "Type a message..."
- Enter key to send

#### **Admin Talent Injection ($$$)**

**Workflow:**
1. Admin opens $$$ thread
2. Clicks Crown icon → Panel expands
3. Enters amount (+100 or -50)
4. Optional reason prompt
5. Injection creates system message in chat
6. User sees: "💰 +100 Talents" with reason

**Function Flow:**
```typescript
banker_inject_talents()
  ↓
Update user.talent_balance
  ↓
Create system message with is_talent_injection=TRUE
  ↓
Return new_balance + amount
```

#### **Pope AI Auto-Responses**

**Keyword Triggers:**
- "CPR" / "revival" → Explains CPR 0/13 system
- "talent" / "💎" → Explains Talent economy
- "COMA" → Explains COMA status + 4th Wall Break
- "13" / "67" → Explains 6713 Rule (metric caps)
- "QT" → Explains Quality Time + Snitch Protocol
- Default → General welcome message

**Response Logic:**
```sql
pope_ai_respond(user_id, user_message)
  ↓
Pattern match keywords
  ↓
Generate contextual response
  ↓
Insert system message
  ↓
Return message_id
```

---

## 📊 Key Features

### **Nickname-First Hierarchy**

Every thread prioritizes the **human identifier**:
1. Custom nickname (set by user)
2. Profile nickname (from profiles table)
3. Username fallback (from users table)

```typescript
// Display priority
const displayName = 
  thread.nickname_for_other ||  // Custom nickname
  thread.other_nickname ||       // Profile nickname
  thread.other_username;         // Username fallback
```

### **Fixed Pillars Logic**

System threads are always pinned at the top:
```sql
-- In get_thread_list()
ORDER BY is_pinned DESC NULLS LAST, last_message_at DESC

-- Result:
-- 1. $$$ (is_pinned=TRUE)
-- 2. Pope AI (is_pinned=TRUE)
-- 3. John (is_pinned=FALSE, sorted by last_message_at)
-- 4. Sarah (is_pinned=FALSE, sorted by last_message_at)
```

### **QT Conversation Tracking**

**How it works:**
1. User opens thread → `start_conversation_qt()` creates session
2. Every second: `update_conversation_qt()` increments `dwell_seconds`
3. User closes thread → `end_conversation_qt()` adds to `thread.total_qt_seconds`

**Display:**
- In thread list: "15m QT" (total across all sessions)
- In thread header: "5:34" (current session timer)

### **Pretty Links**

Shared media appears as high-fidelity cards:
```tsx
<button onClick={() => router.push(`/hue?post=${postId}`)}>
  <img src={thumbnail} className="aspect-video" />
  <div>
    <Video /> Tap to view in Hue
  </div>
</button>
```

**One-tap redirect**: Takes user back to Hue tab with post focused

### **Admin Moderation**

**Message Slashing:**
- Hover message → Slash button appears
- Prompts for reason
- Sets `is_slashed=TRUE`, stores `slashed_by` and `slash_reason`
- Message stays visible but greyed with strikethrough
- Doesn't delete (creates moderation record)

**Talent Injection:**
- Only in $$$ thread
- Admin enters amount (positive or negative)
- Creates system message with talent badge
- Updates user balance immediately

---

## 🗄️ Database Schema

### **system_accounts**
```sql
CREATE TABLE system_accounts (
  account_id UUID PRIMARY KEY,
  account_type TEXT UNIQUE CHECK (account_type IN ('banker', 'pope_ai')),
  display_name TEXT, -- "$$$" or "Pope AI"
  description TEXT,
  accent_color TEXT, -- "#D4AF37" or "#9333EA"
  is_pinned BOOLEAN DEFAULT TRUE
);
```

### **chat_threads**
```sql
CREATE TABLE chat_threads (
  thread_id UUID PRIMARY KEY,
  user_id UUID,
  other_user_id UUID, -- NULL for system threads
  system_account_id UUID, -- For $$$, Pope AI
  nickname_for_other TEXT, -- Custom nickname
  is_system_thread BOOLEAN,
  last_message_at TIMESTAMPTZ,
  unread_count INTEGER,
  total_qt_seconds INTEGER, -- Sum of all QT sessions
  UNIQUE(user_id, other_user_id),
  UNIQUE(user_id, system_account_id)
);
```

### **chat_messages**
```sql
CREATE TABLE chat_messages (
  message_id UUID PRIMARY KEY,
  thread_id UUID,
  sender_id UUID,
  is_system_message BOOLEAN,
  message_text TEXT,
  media_url TEXT, -- Pretty Link photo/video
  media_type TEXT CHECK (media_type IN ('photo', 'video', 'link')),
  post_id UUID, -- For redirect to Hue
  is_slashed BOOLEAN,
  slashed_by UUID,
  slash_reason TEXT,
  is_talent_injection BOOLEAN,
  talent_injection_amount INTEGER
);
```

### **conversation_qt**
```sql
CREATE TABLE conversation_qt (
  qt_id UUID PRIMARY KEY,
  thread_id UUID,
  user_id UUID,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  dwell_seconds INTEGER
);
```

---

## 🔧 API Usage Examples

### **Get Thread List**
```typescript
const { data: threads } = await supabase.rpc('get_thread_list', {
  p_user_id: currentUserId
});

// Result structure:
threads = [
  {
    thread_id: "...",
    is_system_thread: true,
    system_display_name: "$$$",
    system_accent_color: "#D4AF37",
    is_pinned: true,
    last_message_at: "2025-12-22T10:30:00Z",
    unread_count: 2
  },
  {
    thread_id: "...",
    is_system_thread: false,
    other_nickname: "John",
    other_is_coma: false,
    other_is_verified: true,
    last_message_text: "Hey!",
    last_message_at: "2025-12-22T09:15:00Z",
    unread_count: 1,
    total_qt_seconds: 347
  }
]
```

### **Send Message**
```typescript
const { data: messageId } = await supabase.rpc('send_message', {
  p_thread_id: threadId,
  p_sender_id: currentUserId,
  p_message_text: "Hello!",
  p_media_url: null, // Or photo/video URL
  p_post_id: null    // Or post UUID for Pretty Link
});
```

### **Track QT Session**
```typescript
// Start
const { data: qtId } = await supabase.rpc('start_conversation_qt', {
  p_thread_id: threadId,
  p_user_id: currentUserId
});

// Update (every second)
setInterval(() => {
  supabase.rpc('update_conversation_qt', {
    p_qt_id: qtId,
    p_additional_seconds: 1
  });
}, 1000);

// End (on navigate away)
const { data: totalSeconds } = await supabase.rpc('end_conversation_qt', {
  p_qt_id: qtId
});
```

### **Admin Slash Message**
```typescript
const { data } = await supabase.rpc('admin_slash_message', {
  p_admin_user_id: adminId,
  p_message_id: messageId,
  p_slash_reason: "Spam"
});
```

### **Banker Inject Talents**
```typescript
const { data } = await supabase.rpc('banker_inject_talents', {
  p_admin_user_id: adminId,
  p_recipient_user_id: userId,
  p_talent_amount: 100, // or negative
  p_reason: "Manual top-up after payment"
});

// Returns:
{
  success: true,
  new_balance: 250,
  amount: 100,
  message_id: "..." // System message in $$$ thread
}
```

### **Pope AI Auto-Response**
```typescript
// Triggered after user sends message to Pope AI
const { data: responseId } = await supabase.rpc('pope_ai_respond', {
  p_user_id: currentUserId,
  p_user_message: "What is CPR?"
});

// Pope AI automatically generates contextual response
```

---

## 🎨 UI Components

### **System Thread Row ($$$ / Pope AI)**
```tsx
<button 
  className="w-full p-4"
  style={{ borderLeft: `4px solid ${accentColor}` }}
>
  <div className="flex items-center gap-4">
    {/* Icon with accent color */}
    <div style={{ 
      background: `${accentColor}20`,
      border: `2px solid ${accentColor}`
    }}>
      {isBanker ? <DollarSign /> : <Sparkles />}
    </div>
    
    {/* Name (Bold) */}
    <div>
      <p className="text-white font-bold text-lg">
        {system_display_name}
      </p>
      <p className="text-white/60 text-sm">
        {last_message_text}
      </p>
    </div>
    
    {/* Unread Badge */}
    {unread_count > 0 && (
      <div style={{ backgroundColor: accentColor }}>
        {unread_count}
      </div>
    )}
  </div>
</button>
```

### **Social Thread Row (Nickname-First)**
```tsx
<button className="w-full p-4">
  <div className="flex items-center gap-4">
    {/* Avatar + Status */}
    <div className="relative">
      <img 
        src={profile_photo}
        className={is_coma ? 'grayscale' : ''}
      />
      {is_coma ? (
        <div className="absolute bg-red-500">
          <Ban />
        </div>
      ) : (
        <div className="absolute bg-green-500" />
      )}
    </div>
    
    {/* Nickname (Bold, Primary) */}
    <div className="flex-1">
      <p className="text-white font-bold text-lg">
        {nickname || username}
      </p>
      <p className="text-white/60 text-sm truncate">
        {last_message_text}
      </p>
      <div className="flex gap-3">
        <TimeAgo date={last_message_at} />
        {total_qt_seconds > 0 && (
          <span>{Math.floor(total_qt_seconds / 60)}m QT</span>
        )}
      </div>
    </div>
  </div>
</button>
```

### **Message Bubble**
```tsx
{/* Own Message (Right) */}
<div className="flex justify-end">
  <div className="bg-purple-500 rounded-2xl p-3 text-white">
    {message_text}
  </div>
</div>

{/* Other Message (Left) */}
<div className="flex justify-start">
  <div className="bg-white/10 rounded-2xl p-3 text-white">
    <p className="text-white/60 text-xs">{sender_nickname}</p>
    {message_text}
  </div>
</div>

{/* Slashed Message */}
<div className="opacity-60">
  <p className="line-through">{message_text}</p>
  <p className="text-red-300 text-xs">
    ~~Slashed by {slashed_by_username}~~
  </p>
</div>
```

### **Pretty Link Card**
```tsx
<button onClick={() => router.push(`/hue?post=${post_id}`)}>
  <img 
    src={media_thumbnail}
    className="aspect-video object-cover rounded-lg"
  />
  <div className="flex items-center gap-1 text-purple-300 text-xs">
    {media_type === 'video' && <Video />}
    <span>Tap to view in Hue</span>
  </div>
</button>
```

### **QT Blimp (Header)**
```tsx
<div className="flex items-center gap-2 px-3 py-2 bg-purple-500/20 border border-purple-500/50 rounded-full">
  <Clock size={14} className="text-purple-400" />
  <span className="text-white text-sm font-medium">
    {Math.floor(dwellSeconds / 60)}:{(dwellSeconds % 60).toString().padStart(2, '0')}
  </span>
</div>
```

---

## 🚀 Deployment Steps

### 1. Deploy Database Migration
```bash
# Open Supabase Dashboard → SQL Editor
# Copy/paste database/migration-pulse-chat.sql
# Click "Run"
```

### 2. Verify System Accounts
```sql
SELECT * FROM system_accounts;
-- Should return 2 rows: $$$, Pope AI
```

### 3. Test Functions
```sql
-- Create test thread
SELECT get_or_create_thread(
  'user-uuid',
  NULL,
  'banker'
);

-- Send test message
SELECT send_message(
  'thread-uuid',
  'sender-uuid',
  'Test message'
);
```

### 4. Test Frontend
1. Navigate to `/pulse`
2. Verify $$$ and Pope AI appear at top
3. Click $$$ → Should open chat thread
4. Send message to Pope AI → Should get auto-response
5. Test admin slash (if admin account)
6. Test talent injection in $$$ (if admin)

---

## 📝 Important Notes

### **Nickname Hierarchy**
The system prioritizes nicknames in this order:
1. **Custom nickname** (`thread.nickname_for_other`) - Set by user in thread settings
2. **Profile nickname** (`profile.nickname`) - From user's profile
3. **Username** (`user.username`) - Fallback if no nickname set

### **Fixed Pillars Always Visible**
- $$$ and Pope AI are **never** below social threads
- Even if no recent messages, they stay pinned at top
- Auto-created on first app load if missing

### **QT Privacy**
- Only the thread owner sees QT seconds
- QT is per-thread (not global like profile QT)
- Used for personal tracking, not displayed to other party

### **Admin Slashing Rules**
- Slashed messages **stay visible** (not deleted)
- Creates permanent moderation record
- Turns message grey with strikethrough
- Shows slasher's username

### **$$$ Thread is Admin-Only**
- Regular users can send messages
- Only admins can inject talents
- Injection creates system message visible to both parties

### **Pope AI Intelligence**
- Currently keyword-based (simple pattern matching)
- Future: Can integrate with OpenAI API for smarter responses
- Responds instantly (no loading delay)

---

## 🔮 Future Enhancements

1. **Rich Media Uploads**
   - Camera/gallery picker
   - Video compression
   - Photo filters/cropping

2. **Thread Settings**
   - Change custom nickname
   - Mute notifications
   - Archive thread
   - Block user

3. **Voice Messages**
   - Record audio
   - Waveform visualization
   - Playback controls

4. **Message Reactions**
   - Heart, laugh, etc.
   - Quick reply emojis
   - Reaction counts

5. **Advanced Pope AI**
   - OpenAI GPT integration
   - Context-aware responses
   - Learn from user history
   - Proactive suggestions

6. **Group Threads**
   - Multiple participants
   - Group nickname/avatar
   - Admin controls

---

## 📚 Related Files

- **Database**: [database/migration-pulse-chat.sql](database/migration-pulse-chat.sql)
- **Pulse List**: [app/pulse/page.tsx](app/pulse/page.tsx)
- **Chat Thread**: [app/pulse/[threadId]/page.tsx](app/pulse/[threadId]/page.tsx)
- **Profile Page**: [PROFILE_PAGE_IMPLEMENTATION.md](PROFILE_PAGE_IMPLEMENTATION.md)
- **Hamburger Menu**: [HAMBURGER_SEARCH_ENHANCEMENTS.md](HAMBURGER_SEARCH_ENHANCEMENTS.md)

---

## ✅ Implementation Checklist

- [x] Database migration with 4 tables
- [x] 12 database functions (threads, messages, QT, admin)
- [x] System accounts ($$$ & Pope AI)
- [x] RLS policies for all tables
- [x] Pulse list page with fixed pillars
- [x] Nickname-first social list
- [x] Chat thread page with nickname header
- [x] QT Blimp (real-time timer)
- [x] Pretty Links (media cards with Hue redirect)
- [x] Admin slasher (message moderation)
- [x] Banker talent injection UI
- [x] Pope AI auto-responses
- [x] Realtime message subscriptions
- [ ] Deploy database migration
- [ ] End-to-end testing
- [ ] Rich media uploads
- [ ] Thread settings UI

---

**Status**: ✅ Implementation Complete | ⏳ Deployment Pending

**Next Steps**: Deploy `migration-pulse-chat.sql` via Supabase Dashboard, then test all features end-to-end.
