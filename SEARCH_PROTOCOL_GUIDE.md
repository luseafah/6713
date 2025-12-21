# Search Protocol & Pope AI Gig-Close Implementation

## Overview
The Search Radio system integrates discovery, verification, and Gig completion into one high-velocity protocol. Users discover content through the "Audio Radio" (The Pulse) and verify completed Gigs through Pope AI's requirement system.

---

## 1. Search Interface Architecture

### 4-Tab Layout
All tabs include a horizontal Stories row at the top for persistent discovery:

1. **Gigs Tab** - Active Gigs with Budge flicker (Yellow-to-Red 6s cycle)
2. **Pics Tab** - Image posts from wall_messages
3. **Videos Tab** - Video posts from wall_messages  
4. **Audio Radio Tab** - The Pulse (auto-cycling 30s voice notes)

### Implementation
- **File**: [app/search/page.tsx](app/search/page.tsx)
- **Hook**: [hooks/useProtocolRadio.ts](hooks/useProtocolRadio.ts)
- **Component**: [components/VerifiedName.tsx](components/VerifiedName.tsx)

---

## 2. The Audio Radio (The Pulse)

### Concept
A passive discovery tool that auto-cycles through random 30-second voice notes from verified users. As one clip ends, the system automatically fetches and plays the next "frequency."

### Features
- **Auto-Cycle**: Plays random voice notes continuously
- **Verified Names**: Displays real identity for authority
- **Controls**: Mute, Skip, Play/Pause
- **Visual Feedback**: Live indicator, progress bar, frequency display

### Hook: `useProtocolRadio()`

```typescript
const {
  currentFrequency,    // Current playing voice note
  isPlaying,           // Playback state
  isMuted,             // Mute state
  loading,             // Loading state
  playNextFrequency,   // Fetch next random clip
  toggleMute,          // Toggle audio
  skipFrequency,       // Skip to next
} = useProtocolRadio();
```

### Database Query
```sql
SELECT 
  id,
  media_url,
  user_id,
  username,
  created_at,
  profiles.verified_name
FROM wall_messages
WHERE message_type = 'voice'
  AND media_url IS NOT NULL
  AND expires_at > NOW()
ORDER BY random()
LIMIT 10;
```

---

## 3. Two-Name Protocol

### Concept
Every profile renders **two names**:
1. **Verified Name** - Real identity (for Search/Radio authority)
2. **@username** - Handle (for 'Ask @user' logic and unique identification)

### Component: `<VerifiedName />`

```tsx
<VerifiedName
  verifiedName="John Smith"     // Real identity (optional)
  username="jsmith"             // Handle (required)
  size="md"                     // sm | md | lg
  layout="stacked"              // stacked | inline
  showUsername={true}           // Show @username below
/>
```

### Display Logic
- **If verified_name exists**: Show both real name and @username
- **If no verified_name**: Show @username only
- **In Search/Radio**: Always show verified_name first for authority
- **In Wall/Hue**: Show @username for familiarity

### Database Schema
```sql
ALTER TABLE profiles 
ADD COLUMN verified_name TEXT;
```

---

## 4. Pope AI Gig-Close System

### Trigger
When a Gig is marked "Completed," Pope AI opens a private modal with all participants.

### Requirements
1. **Voice Notes**: Every participant must record a **3-second voice note** (one word)
2. **Group Photo**: One person must upload a **Group Photo** (max 50MB)

### Enforcement
- Gig becomes **un-deletable** after requirements are met
- Verified Gig expires in **3 days** as a permanent record
- Participants can see completion status in real-time

### Component: `<PopeGigClose />`

```tsx
<PopeGigClose
  gigId="uuid"
  gigTitle="Beach Cleanup"
  participants={[
    { user_id: "...", username: "alice", verified_name: "Alice Johnson" },
    { user_id: "...", username: "bob", verified_name: "Bob Smith" },
  ]}
  onClose={() => {}}
  onComplete={() => {}}
/>
```

### Database Functions

#### Check Completion Status
```sql
SELECT check_gig_completion_requirements('gig-uuid');

-- Returns:
{
  "total_participants": 3,
  "voice_submissions": 2,
  "has_group_photo": true,
  "requirements_met": false,
  "missing_voices": 1
}
```

#### Submit Voice Note
```sql
SELECT submit_gig_voice('gig-uuid', 'https://storage.url/voice.webm');

-- Returns:
{
  "success": true,
  "requirements": { ... }
}
```

### Database Schema

```sql
-- Track voice submissions per participant
CREATE TABLE gig_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gig_id UUID REFERENCES gigs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  voice_note_url TEXT,
  voice_submitted_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(gig_id, user_id)
);

-- Group photo (one per gig)
CREATE TABLE gig_group_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gig_id UUID REFERENCES gigs(id) ON DELETE CASCADE UNIQUE,
  uploaded_by UUID REFERENCES auth.users(id),
  photo_url TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 5. Financial Enforcer Rules

### No-Refund Deletion
If an **Incomplete Gig** is deleted:
- The 10 Talent fee is **NOT refunded**
- Fee is transferred to company vault (admin user)

```sql
SELECT delete_gig_no_refund('gig-uuid');
```

### Budge Flicker
If a post is "Budging" (has budget > 0):
- Trigger **Yellow-to-Red Profile Border Flicker** (6s cycle)
- Apply across all Search results
- CSS: `animate-[gigFlicker_6s_ease-in-out_infinite]`

---

## 6. Pope AI Protocol Notice

Before verification, Pope AI sends this message to the Gig-Close chat:

```
G$4U PROTOCOL NOTICE

Gigs: Posting costs 10 Talents. No refunds for incomplete deletions.

Verification: Completion requires a 3-second voice frequency and a group photo. 
These become the 'Radio' and 'Stories' that power the Search Tab.

Persistence: Your success stays visible for 3 days. Your name is your bond.
```

---

## 7. Implementation Checklist

### Database Migrations
- [x] Run [migration-search-protocol.sql](database/migration-search-protocol.sql)
- [x] Add `verified_name` column to profiles
- [x] Create `gig_completions` table
- [x] Create `gig_group_photos` table
- [x] Add RLS policies for both tables

### Components
- [x] [app/search/page.tsx](app/search/page.tsx) - 4-tab search interface
- [x] [hooks/useProtocolRadio.ts](hooks/useProtocolRadio.ts) - Audio Radio logic
- [x] [components/VerifiedName.tsx](components/VerifiedName.tsx) - Two-Name Protocol
- [x] [components/PopeGigClose.tsx](components/PopeGigClose.tsx) - Gig completion modal

### Storage Buckets
Create these buckets in Supabase:
```sql
-- Voice notes for Gig completion
CREATE BUCKET voices;

-- Group photos for Gig completion
CREATE BUCKET gig-photos;
```

### Testing
- [ ] Test Audio Radio auto-cycle on Search tab
- [ ] Test voice note recording (3s max) in Pope AI modal
- [ ] Test group photo upload (50MB max)
- [ ] Test Two-Name Protocol display (verified_name + @username)
- [ ] Test Budge flicker on Search results
- [ ] Test no-refund deletion for incomplete Gigs

---

## 8. User Flow

### Discovery Flow
1. User opens Search tab → Sees Stories row at top
2. Clicks "Audio Radio" tab
3. Hears random verified frequencies auto-playing
4. Taps audio bubble → Sees Verified Name + Mute option
5. Radio auto-advances to next frequency when clip ends

### Verification Flow
1. Gig host marks Gig as "Completed"
2. Pope AI opens modal for all participants
3. Each user records 3-second voice note (one word)
4. One user uploads Group Photo
5. Once requirements met → Gig becomes un-deletable
6. Verified Gig expires in 3 days

---

## 9. Protocol Enforcement

### Voice Recording Rules
- **Max Duration**: 3 seconds (auto-stop)
- **Format**: WebM audio
- **Storage**: `voices` bucket
- **Requirement**: One word only

### Photo Upload Rules
- **Max Size**: 50MB
- **Format**: Any image format
- **Storage**: `gig-photos` bucket
- **Requirement**: Group photo with all participants

### Expiry Rules
- **Completed Gigs**: Un-deletable, expire in 3 days
- **Voice Notes**: Included in Radio rotation for 3 days
- **Group Photos**: Visible in Stories/Search for 3 days

---

## 10. Database Functions Reference

```sql
-- Check if Gig completion requirements are met
check_gig_completion_requirements(gig_uuid UUID) 
→ JSONB

-- Submit voice note for user
submit_gig_voice(gig_uuid UUID, voice_url TEXT) 
→ JSONB

-- Delete incomplete Gig (no refund)
delete_gig_no_refund(gig_uuid UUID) 
→ JSONB
```

---

## Key Features

✅ **4-Tab Search** with horizontal Stories row  
✅ **Audio Radio** (The Pulse) with auto-cycle  
✅ **Two-Name Protocol** (Verified Name + @username)  
✅ **Pope AI Gig-Close** with voice + photo requirements  
✅ **No-Refund Enforcement** for incomplete deletions  
✅ **Budge Flicker** (Yellow-to-Red 6s cycle)  

🎙️ **"Your name is your bond"** - The 6713 Protocol
