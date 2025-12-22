# Profile Page Implementation Guide
## Project 6713: The Definitive Digital Footprint

---

## 🎯 Overview

The Profile Page is the **definitive record** of a human's digital footprint in Project 6713. It's designed as a high-fidelity "Summary" that loads instantly and honors the **6713 Rule** in every corner.

**Core Philosophy**: Permanence, factual proof, and metric caps (13+/67+) to maintain mystery and value.

---

## ✅ Implementation Complete

### 1. **Database Migration** (`database/migration-profile-page.sql`)

**Tables Created:**
- `anchor_posts` - The 1 permanent photo post (10 Talents to swap)
- `pinned_content` - 3 Tier 1 (videos/photos) + 3 Tier 2 (audio waveforms)
- `profile_visits` - QT (Quality Time) tracking with incognito detection
- `cpr_counters` - Revival tracking after deactivation (0/13)
- `fourth_wall_breaks` - COMA interaction messages (100 Talents)
- `connection_cuts` - Snitch Protocol tracking with QT reveal

**Functions Created (15 total):**
- `swap_anchor_post()` - Costs 10 Talents after first anchor
- `get_anchor_post()` - Fetch user's anchor post
- `pin_content()` - Add/update pinned videos/photos/audio
- `get_pinned_content()` - Fetch all pinned content
- `start_profile_visit()` - Begin QT tracking
- `update_profile_visit()` - Increment dwell time
- `end_profile_visit()` - Finalize visit session
- `get_total_qt()` - Sum all visit seconds
- `get_active_visitors()` - Real-time visitor list (for QT Blimp)
- `start_cpr_counter()` - Initialize revival tracking
- `increment_cpr()` - Add 1 to CPR counter
- `get_cpr_status()` - Fetch current CPR progress
- `break_fourth_wall()` - Send message to COMA user (100 Talents)
- `get_fourth_wall_breaks()` - Fetch received COMA messages
- `cut_connection()` - Execute Snitch Protocol with QT reveal
- `get_profile_stats()` - Get stats with 13+/67+ caps
- `admin_slash_content()` - Admin moderation (strikethrough)
- `admin_inject_talents()` - Manual talent adjustment

---

### 2. **Profile Page Component** (`app/profile/[username]/page.tsx`)

#### **Identity Header**
- **Avatar**: Displays profile photo with COMA desaturation overlay if applicable
- **Status**: Shows "COMA" badge in red if user is deactivated
- **Verified Badge**: Purple checkmark for verified users
- **Stats Display**: 
  - ❤️ Likes (capped at 13+ for strangers)
  - 👥 Huemans (capped at 67+ for strangers)
  - 💎 Talents (only visible on own profile)
- **QT Blimp**: Floating notification showing active viewers with dwell time
  - Electric Purple when viewer is in Incognito mode

#### **The Anchor Post**
- **1 Permanent Photo** at the top of the profile
- **No videos allowed** (photos only)
- Optional 10s sound snippet
- Optional text caption
- **10 Talents to swap** after the first anchor
- Swap count displayed to owner
- Admin slash button (strikethrough moderation)
- Edit button (owner only, hidden in Stranger View)

#### **3-Tier Grid**

**Tier 1: Pinned Videos/Photos (3 slots)**
- Grid layout (3 columns)
- Each slot can hold 1 video or photo
- Empty slots show edit icon for owner
- Admin can slash individual items
- Slashed content shows red slash icon

**Tier 2: Audio Waveforms (3 slots)**
- List layout with sound snippets
- Shows duration and sound name
- Waveform data for visual display
- Edit button for owner

**Tier 3: Navigation Tabs**
- **Gigs** button (green theme) → Links to `/gigs/[username]`
- **Wiki** button (blue theme) → Links to `/wiki/[username]`
- Non-deletable friendship resumes and ID-verified history

#### **Action Buttons**

**For Other Users:**
- **Break 4th Wall** (visible if COMA): Send message for 100 Talents
- **Cut Connection** (visible if connected): Trigger Snitch Protocol

**For Own Profile:**
- **View as Stranger**: Caps metrics at 13+/67+, hides edit buttons
- **Exit Stranger View**: Returns to full view
- **CPR Counter** (if active): Shows 0/13 revival progress

#### **Admin God-Mode**
- **Crown Icon** (top-right): Opens admin panel
- **Slash Content**: Strikethrough anchor post or pinned items
- **Inject Talents**: Add/subtract talents manually (click talent balance)
- Visible only to admins/mods viewing other profiles

---

### 3. **Hamburger Menu Enhancements**

#### **Footer Icons (Side-by-Side)**

**Link Icon (Share Profile):**
- Opens modal with profile URL
- Pretty link: `https://6713.app/profile/username`
- Copy to clipboard button
- "Share to Wall" button (posts link to public Wall)
- Purple gradient theme

**Gear Icon (Settings):**
- Opens settings modal
- **Stranger View Toggle**: See your profile as others do
- **Notification Settings**: Sound/Message alerts
- **Privacy Settings**: Profile visibility, online status
- **Account Actions**: Account settings, deactivate button
- Gray gradient theme

#### **Updated Components:**
- QR Code button (generate profile QR)
- QR Scanner button (scan other profiles)
- Settings modal with toggles
- Share Profile modal with pretty link

---

## 📊 Key Features

### **6713 Rule: Metric Caps**
```typescript
// Non-connections and Stranger View see capped metrics
if (!isConnected || isStrangerView) {
  likes: "13+"  // if > 13
  huemans: "67+" // if > 67
} else {
  likes: actual_count
  huemans: actual_count
}
```

### **QT Tracking (Quality Time)**
- Real-time dwell time tracking on profile pages
- Stored in `profile_visits` table
- QT Blimp shows active viewers with seconds
- Incognito detection (purple highlight)
- Used in Snitch Protocol when cutting connections

### **Snitch Protocol**
When a user cuts a connection from the profile page:
1. Calculate total QT (visitor's time on profile - profile owner's time on visitor's profile)
2. QT can be **negative** (if you spent more time on them than they on you)
3. Reveal the **exact QT** to the profile owner
4. Delete the connection from the database
5. Redirect cutter back to Hue tab

```typescript
// Example Snitch Alert
"Connection cut. Snitch Alert: Total QT revealed to @john: +347 seconds"
// or
"Connection cut. Snitch Alert: Total QT revealed to @jane: -89 seconds"
```

### **4th Wall Break (COMA Interaction)**
- Visible only when viewing a COMA user's profile
- Costs **100 Talents** per message
- Message is stored in `fourth_wall_breaks` table
- COMA user receives message in inbox
- Red gradient modal with textarea

### **CPR Counter (Revival Tracking)**
- Visible only on own profile when active
- Starts after account deactivation
- Range: 0/13 (needs 13 "revival" interactions)
- Yellow progress bar
- Expires after 30 days (configurable)

### **Stranger View Mode**
- Toggle in Settings or profile page
- Caps metrics at 13+/67+
- Hides all edit buttons
- Hides talent balance
- Shows profile exactly as non-connections see it
- Persists across navigation (stored in state)

---

## 🗄️ Database Schema

### **anchor_posts**
```sql
CREATE TABLE anchor_posts (
  anchor_post_id UUID PRIMARY KEY,
  user_id UUID UNIQUE,  -- Only 1 anchor per user
  image_url TEXT NOT NULL,
  caption TEXT,
  sound_id UUID,
  sound_start_time INTEGER,
  swap_count INTEGER,
  is_slashed BOOLEAN,
  slashed_by UUID,
  slashed_at TIMESTAMPTZ,
  slash_reason TEXT
);
```

### **pinned_content**
```sql
CREATE TABLE pinned_content (
  pinned_id UUID PRIMARY KEY,
  user_id UUID,
  content_type TEXT CHECK (content_type IN ('video', 'photo', 'audio')),
  tier INTEGER CHECK (tier IN (1, 2)),
  position INTEGER CHECK (position BETWEEN 1 AND 3),
  media_url TEXT,
  thumbnail_url TEXT,
  caption TEXT,
  sound_id UUID,
  duration_seconds INTEGER,
  waveform_data JSONB,
  is_slashed BOOLEAN,
  UNIQUE(user_id, tier, position)
);
```

### **profile_visits**
```sql
CREATE TABLE profile_visits (
  visit_id UUID PRIMARY KEY,
  profile_user_id UUID,  -- Whose profile
  visitor_user_id UUID,  -- Who's viewing
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  dwell_seconds INTEGER,
  is_incognito BOOLEAN
);
```

### **cpr_counters**
```sql
CREATE TABLE cpr_counters (
  cpr_id UUID PRIMARY KEY,
  user_id UUID UNIQUE,
  current_revivals INTEGER,  -- 0 to 13
  max_revivals INTEGER DEFAULT 13,
  is_active BOOLEAN,
  expires_at TIMESTAMPTZ
);
```

### **fourth_wall_breaks**
```sql
CREATE TABLE fourth_wall_breaks (
  break_id UUID PRIMARY KEY,
  sender_id UUID,
  recipient_id UUID,  -- COMA user
  message_text TEXT,
  talent_cost INTEGER DEFAULT 100,
  is_read BOOLEAN,
  created_at TIMESTAMPTZ
);
```

### **connection_cuts**
```sql
CREATE TABLE connection_cuts (
  cut_id UUID PRIMARY KEY,
  cutter_id UUID,
  cut_user_id UUID,
  total_qt_seconds INTEGER,  -- Can be negative
  revealed_to_user BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ
);
```

---

## 🔧 API Usage Examples

### **Load Profile**
```typescript
// Get user data
const { data: profileData } = await supabase
  .from('users')
  .select(`
    user_id,
    username,
    talent_balance,
    is_coma,
    profiles (profile_photo_url, verified_name, bio)
  `)
  .eq('username', username)
  .single();

// Get anchor post
const { data: anchor } = await supabase.rpc('get_anchor_post', {
  p_user_id: profileData.user_id
});

// Get stats with caps
const { data: stats } = await supabase.rpc('get_profile_stats', {
  p_profile_user_id: profileData.user_id,
  p_viewer_user_id: currentUserId,
  p_is_stranger_view: isStrangerView
});
```

### **Track Profile Visit**
```typescript
// Start visit
const { data: visitId } = await supabase.rpc('start_profile_visit', {
  p_profile_user_id: profileUserId,
  p_visitor_user_id: currentUserId,
  p_is_incognito: isStrangerView
});

// Update dwell time (every second)
await supabase.rpc('update_profile_visit', {
  p_visit_id: visitId,
  p_additional_seconds: 1
});

// End visit
await supabase.rpc('end_profile_visit', {
  p_visit_id: visitId
});
```

### **Break 4th Wall**
```typescript
const { data } = await supabase.rpc('break_fourth_wall', {
  p_sender_id: currentUserId,
  p_recipient_id: comaUserId,
  p_message_text: "Hey! Hope you come back soon!"
});

if (data?.success) {
  alert(`4th Wall Broken! ${data.talents_spent} Talents spent.`);
}
```

### **Cut Connection (Snitch Protocol)**
```typescript
const { data } = await supabase.rpc('cut_connection', {
  p_cutter_id: currentUserId,
  p_cut_user_id: otherUserId
});

if (data?.success) {
  // Example: data.revealed_qt = 347 or -89
  alert(`Connection cut. QT revealed: ${data.qt_display} seconds`);
}
```

### **Admin Slash Content**
```typescript
const { data } = await supabase.rpc('admin_slash_content', {
  p_admin_user_id: adminId,
  p_content_type: 'anchor', // or 'pinned'
  p_content_id: anchorPostId,
  p_slash_reason: "Inappropriate content"
});
```

### **Admin Inject Talents**
```typescript
const { data } = await supabase.rpc('admin_inject_talents', {
  p_admin_user_id: adminId,
  p_target_user_id: targetUserId,
  p_talent_amount: -50, // Negative to subtract
  p_reason: "Refund for bug"
});
```

---

## 🎨 UI Components

### **Identity Header**
```tsx
<div className="bg-gradient-to-b from-purple-900/20 to-black p-6">
  {/* Avatar with COMA overlay */}
  <img 
    src={profilePhotoUrl}
    className={is_coma ? 'grayscale' : ''}
  />
  
  {/* Stats with 13+/67+ caps */}
  <div className="flex gap-4">
    <Heart /> {stats.likes_display}
    <Users /> {stats.huemans_display}
    <DollarSign /> {talent_balance}
  </div>
  
  {/* QT Blimp (active visitors) */}
  {activeVisitors.map(v => (
    <div className={v.is_incognito ? 'text-purple-400' : 'text-white'}>
      {v.visitor_username} ({v.dwell_seconds}s)
    </div>
  ))}
</div>
```

### **Anchor Post**
```tsx
<div className="bg-gradient-to-br from-purple-900/30 to-black">
  <img 
    src={anchor.image_url}
    className={anchor.is_slashed ? 'opacity-50' : ''}
  />
  
  {anchor.is_slashed && (
    <div className="line-through decoration-4">SLASHED</div>
  )}
  
  {isAdmin && (
    <button onClick={() => handleSlash('anchor', anchor.id)}>
      <Slash />
    </button>
  )}
  
  <p className="text-xs">
    Swaps: {anchor.swap_count} • 10 💎 to replace
  </p>
</div>
```

### **4th Wall Break Modal**
```tsx
<motion.div className="bg-red-900/50 border-red-500/50">
  <h2>Break the 4th Wall</h2>
  <p>Send a message to {username} (in COMA) for 100 Talents</p>
  
  <textarea 
    value={message}
    placeholder="Your message..."
  />
  
  <button onClick={handleBreak4thWall}>
    Send (100 💎)
  </button>
</motion.div>
```

### **Snitch Alert Modal**
```tsx
<motion.div className="bg-yellow-900/50 border-yellow-500/50">
  <h2>Snitch Alert</h2>
  <p>Cut connection with @{username}?</p>
  
  <div className="bg-yellow-500/10">
    ⚠️ The Snitch Protocol will reveal your total QT to them,
    including negative values.
  </div>
  
  <button onClick={handleCutConnection}>
    Cut Connection
  </button>
</motion.div>
```

---

## 🚀 Deployment Steps

### 1. Deploy Database Migration
```bash
# Option A: Supabase Dashboard
# 1. Open Supabase Dashboard → SQL Editor
# 2. Copy/paste database/migration-profile-page.sql
# 3. Click "Run"

# Option B: Supabase CLI (if available)
supabase db push database/migration-profile-page.sql
```

### 2. Verify Functions
```sql
-- Test anchor post
SELECT * FROM get_anchor_post('user-uuid-here');

-- Test profile stats
SELECT * FROM get_profile_stats(
  'profile-user-uuid',
  'viewer-user-uuid',
  FALSE  -- is_stranger_view
);

-- Test QT tracking
SELECT * FROM get_active_visitors('user-uuid-here');
```

### 3. Test Frontend
1. Navigate to `/profile/[username]`
2. Verify all zones load correctly
3. Test Stranger View toggle
4. Test 4th Wall Break (if COMA user available)
5. Test Cut Connection
6. Test Admin God-Mode (if admin account)
7. Test QT Blimp (open profile in two browsers)

### 4. Test Hamburger Menu
1. Open hamburger menu
2. Verify Link and Gear icons at bottom
3. Test Settings modal
4. Test Share Profile modal with copy button
5. Test QR Code generator
6. Test QR Scanner placeholder

---

## 📝 Important Notes

### **The Anchor Post Rule**
- First anchor is **free**
- All subsequent swaps cost **10 Talents**
- Only **photos** allowed (no videos)
- Can include 10s sound snippet
- Cannot be deleted (only swapped)

### **The 6713 Metric Caps**
- Non-connections see: **13+** likes, **67+** huemans
- Connections see: **exact numbers**
- Stranger View respects these caps even for owner

### **The Snitch Protocol**
- Always reveals **exact QT** (even negatives)
- QT = (time they spent on your profile) - (time you spent on theirs)
- Cannot be cancelled once initiated
- Deletes connection permanently

### **COMA Status**
- Deactivated accounts show grayscale avatar
- "COMA" badge displayed prominently
- 4th Wall Break button appears (100 Talents)
- CPR counter may be active (0/13 revivals)

### **Admin Powers**
- Crown icon only visible to admins/mods
- Can slash any content (anchor or pinned)
- Can inject/subtract talents
- Can override locked Wiki/Gigs text
- Slashed content shows strikethrough

---

## 🔮 Future Enhancements

1. **Anchor Post Editing**
   - Modal UI for swapping anchor
   - Image upload with crop/resize
   - Sound snippet selector (10s max)
   - Caption editor with 280 char limit

2. **Pinned Content Management**
   - Drag-and-drop reordering
   - Bulk upload for multiple items
   - Video preview player
   - Audio waveform visualization

3. **QT Analytics**
   - QT leaderboard (who views you most)
   - QT history chart (time series)
   - Average session length
   - Incognito vs. normal ratio

4. **CPR Gamification**
   - CPR revival mini-games
   - Social CPR (friends help revive)
   - CPR completion rewards (bonus Talents)
   - CPR progress notifications

5. **Enhanced Sharing**
   - Generate profile cards (PNG)
   - Share to external platforms (Twitter, etc.)
   - Custom share messages
   - Profile QR code with logo

---

## 📚 Related Files

- **Database**: [database/migration-profile-page.sql](database/migration-profile-page.sql)
- **Profile Page**: [app/profile/[username]/page.tsx](app/profile/[username]/page.tsx)
- **Hamburger Menu**: [components/HamburgerMenu.tsx](components/HamburgerMenu.tsx)
- **Search Guide**: [HAMBURGER_SEARCH_ENHANCEMENTS.md](HAMBURGER_SEARCH_ENHANCEMENTS.md)
- **Wall Chat Guide**: (migration-wall-chat-heartbeat.sql exists, needs deployment)

---

## ✅ Implementation Checklist

- [x] Database migration with 6 tables
- [x] 15 database functions (swap, get, track, break, cut, admin)
- [x] RLS policies for all tables
- [x] Profile page component with Identity Header
- [x] The Anchor (1 permanent photo post)
- [x] 3-Tier Grid (pinned content + navigation)
- [x] QT Blimp with real-time visitors
- [x] CPR Counter (0/13 revival tracking)
- [x] Stranger View toggle
- [x] 4th Wall Break modal (100 Talents)
- [x] Snitch Alert modal (connection cutting)
- [x] Admin God-Mode (slash + inject talents)
- [x] Metric caps (13+/67+) for non-connections
- [x] Hamburger Menu footer icons (Link + Gear)
- [x] Settings modal with toggles
- [x] Share Profile modal with pretty link
- [ ] Deploy database migration
- [ ] End-to-end testing
- [ ] Anchor post swap UI
- [ ] Pinned content edit UI
- [ ] QR scanner camera integration

---

**Status**: ✅ Implementation Complete | ⏳ Deployment Pending

**Next Steps**: Deploy `migration-profile-page.sql` via Supabase Dashboard, then test all features end-to-end.
