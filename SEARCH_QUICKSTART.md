# Search Radio & Pope AI Gig-Close - Quick Start

## 🚀 What Was Built

### 1. **Search Interface** (`/search`)
4-tab discovery system with Stories row at top:
- **Gigs Tab** - Active Gigs with Budge flicker
- **Pics Tab** - Image posts  
- **Videos Tab** - Video posts
- **Audio Radio Tab** - Auto-cycling voice notes ("The Pulse")

### 2. **Audio Radio** (The Pulse)
Auto-plays random 30-second voice notes from verified users. When one clip ends, automatically fetches and plays the next "frequency."

**Controls**: Mute, Skip, Play/Pause  
**Visual**: Live indicator, progress bar, verified name display

### 3. **Two-Name Protocol**
Every user displays:
- **Verified Name** (Real identity - for Search/Radio authority)
- **@username** (Handle - for Ask logic and identification)

### 4. **Pope AI Gig-Close Modal**
When a Gig is marked "Completed," all participants must:
1. Record a **3-second voice note** (one word)
2. One person uploads a **Group Photo** (max 50MB)

Once complete → Gig becomes **un-deletable** and expires in 3 days.

---

## 📂 Files Created

### Database
- `database/migration-search-protocol.sql` - Schema for Two-Name Protocol & Gig completion

### Components
- `app/search/page.tsx` - 4-tab Search interface
- `components/VerifiedName.tsx` - Two-Name Protocol display
- `components/PopeGigClose.tsx` - Gig completion verification modal

### Hooks
- `hooks/useProtocolRadio.ts` - Audio Radio auto-cycle logic

### Documentation
- `SEARCH_PROTOCOL_GUIDE.md` - Complete implementation guide

---

## ⚡ Quick Setup

### 1. Run Database Migration
```bash
# Connect to your Supabase instance
psql $DATABASE_URL -f database/migration-search-protocol.sql
```

This creates:
- `verified_name` column in profiles
- `gig_completions` table (voice submissions)
- `gig_group_photos` table (group photo per gig)
- RLS policies
- Database functions: `check_gig_completion_requirements()`, `submit_gig_voice()`

### 2. Create Storage Buckets
In Supabase Dashboard → Storage:
```sql
-- Voice notes for Gig completion
CREATE BUCKET voices;

-- Group photos for Gig completion  
CREATE BUCKET gig-photos;
```

Set both to **Public** with appropriate policies.

### 3. Test the Search Tab
```bash
npm run dev
# Navigate to http://localhost:3000/search
```

---

## 🎯 How To Use

### Audio Radio (The Pulse)
1. Go to `/search` → Click "Audio Radio" tab
2. Click "Start Radio" → Auto-plays random voice notes
3. Each clip auto-advances to next when done
4. Click Mute icon to silence, Skip to advance manually

### Two-Name Protocol
All username displays now show:
```tsx
<VerifiedName
  verifiedName="John Smith"  // Real identity
  username="jsmith"          // @handle
  size="md"
  layout="stacked"
/>
```

### Pope AI Gig-Close
1. Mark a Gig as "Completed" (in Gig details)
2. Pope AI modal opens for all participants
3. Each user records 3-second voice note (one word)
4. One user uploads Group Photo
5. Modal shows progress: "2/3 voices submitted"
6. When complete → Gig becomes un-deletable, expires in 3 days

---

## 🔧 Key Functions

### Check Gig Completion Status
```typescript
const { data } = await supabase.rpc('check_gig_completion_requirements', {
  gig_uuid: gigId,
});

// Returns:
{
  "total_participants": 3,
  "voice_submissions": 2,
  "has_group_photo": true,
  "requirements_met": false,
  "missing_voices": 1
}
```

### Submit Voice Note
```typescript
const { data } = await supabase.rpc('submit_gig_voice', {
  gig_uuid: gigId,
  voice_url: publicUrl,
});
```

### Use Protocol Radio Hook
```typescript
const {
  currentFrequency,    // Current voice note object
  isPlaying,           // Boolean
  isMuted,             // Boolean
  playNextFrequency,   // Function to skip
  toggleMute,          // Function to mute/unmute
} = useProtocolRadio();
```

---

## 🎨 UI Features

### Budge Flicker
Gigs with budget > 0 show Yellow-to-Red flicker (6s cycle):
```css
animate-[gigFlicker_6s_ease-in-out_infinite]
```

### Stories Row
Always visible at top of all Search tabs - shows recent Stories in horizontal scroll.

### Voice Recording
Pope AI modal includes voice recorder with:
- 3-second max (auto-stop)
- Visual countdown
- Re-record option
- Upload button after recording

---

## 🚨 Financial Rules

### No-Refund Deletion
If an **Incomplete Gig** is deleted:
- 10 Talent fee is **NOT refunded**
- Fee transferred to company vault

```sql
SELECT delete_gig_no_refund('gig-uuid');
```

### Completion Persistence
- **Completed Gigs** → Un-deletable, expire in 3 days
- Voice notes → Enter Radio rotation for 3 days
- Group photos → Visible in Stories/Search for 3 days

---

## 📱 Testing Checklist

- [ ] Navigate to `/search` - See 4 tabs with Stories row
- [ ] Click "Audio Radio" tab - See "Start Radio" button
- [ ] Click "Start Radio" - Hear voice note autoplay
- [ ] Wait for clip to end - See auto-advance to next
- [ ] Click Mute icon - Audio mutes but playback continues
- [ ] Click Skip - Jumps to next frequency immediately
- [ ] Mark a Gig "Completed" - Pope AI modal opens
- [ ] Record 3-second voice note - See upload button
- [ ] Upload Group Photo - See completion status update
- [ ] All requirements met - See "Gig Verified!" message
- [ ] Check Search tabs - See Verified Names displayed

---

## 📖 Full Documentation

See [SEARCH_PROTOCOL_GUIDE.md](SEARCH_PROTOCOL_GUIDE.md) for:
- Complete database schema
- Function signatures
- RLS policies
- User flows
- Implementation details

---

## 🎙️ Protocol Notice

**G$4U PROTOCOL NOTICE**

Gigs: Posting costs 10 Talents. No refunds for incomplete deletions.

Verification: Completion requires a 3-second voice frequency and a group photo. These become the 'Radio' and 'Stories' that power the Search Tab.

Persistence: Your success stays visible for 3 days. Your name is your bond.

---

**"Your name is your bond"** - The 6713 Protocol
