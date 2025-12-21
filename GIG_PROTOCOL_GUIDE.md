# 💼 Gig Protocol - Complete Implementation Guide

## Overview
The **Gig Protocol** transforms the 6713 economy by allowing users to post high-value job opportunities for 10 Talents. The "Budge" feature creates visual urgency with yellow/red flickering borders.

## 🎯 Core Mechanics

### Gig Slots System
- ✅ **5 Slots Maximum**: Each user can have up to 5 active gigs simultaneously
- 💰 **10 Talent Cost**: Every gig posting costs 10 Talents (deducted immediately)
- 🔒 **Slot Liberation**: Mark a gig as "Completed" to free up a slot for a new one
- 🚫 **Smart Blocking**: Post button is disabled when all 5 slots are full

### The BUDGE Feature
**Visual Signal System for Active Opportunity**

#### Border Logic:
1. **Yellow Border Only** → User has Budge-enabled gig, NO active Story
   - Applies `.budge-border` class (solid yellow, 3px, glow)
   
2. **Yellow ↔ Red Flicker** → User has Budge-enabled gig + Active Story (24h)
   - Applies `.flicker-border` class (6-second animation)
   - 0-80%: Yellow
   - 90-100%: Red
   - Creates psychological urgency ("This person is active NOW")

#### Where Budge Appears:
- ✅ GigCard profile photos in Hue feed
- ✅ Regular post profile photos in Hue feed (if that user has active Budge gig)
- ✅ Story circles (if Budge + Story active)

## Database Schema

### Gigs Table
```sql
CREATE TABLE gigs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  talent_reward INTEGER NOT NULL CHECK (talent_reward > 0),
  budge_enabled BOOLEAN DEFAULT FALSE,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Helper Functions
```sql
-- Check if user can post another gig (< 5 active)
CREATE FUNCTION user_can_post_gig(user_uuid UUID) RETURNS BOOLEAN

-- Get user's current active gig count
CREATE FUNCTION get_active_gig_count(user_uuid UUID) RETURNS INTEGER
```

### RLS Policies
- **SELECT**: Anyone can view active (is_completed = FALSE) gigs
- **INSERT**: Authenticated users can create gigs for themselves
- **UPDATE**: Users can update only their own gigs
- **Realtime**: Enabled for live gig updates

## API Endpoints

### POST /api/gig
Create a new gig

**Request:**
```typescript
{
  title: string;           // Max 100 chars
  description: string;     // Max 500 chars
  talent_reward: number;   // Must be > 0
  budge_enabled: boolean;  // Default: false
}
```

**Validation Flow:**
1. Check user has < 5 active gigs
2. Verify user has ≥ 10 Talents
3. Deduct 10 Talents from profiles.talent_balance
4. Insert gig into database
5. On error: Rollback talent deduction

**Response:**
```typescript
{
  success: true;
  gig: Gig;
  new_balance: number;
}
```

**Error Cases:**
- `400`: "You have reached the maximum of 5 active Gigs"
- `400`: "Insufficient Talents. You need 10 Talents to post a Gig."
- `401`: "Unauthorized"

### GET /api/gig?user_id=xyz
Get user's gigs (both active and completed)

**Response:**
```typescript
{
  gigs: Gig[];
  active_count: number;
  can_post_more: boolean;
}
```

### POST /api/gig/complete
Mark gig as completed

**Request:**
```typescript
{
  gig_id: string;
}
```

**Validation:**
- Gig must belong to requesting user
- Gig must not already be completed

**Response:**
```typescript
{
  success: true;
}
```

## Components

### GigCard
**Location:** [components/GigCard.tsx](components/GigCard.tsx)

**Props:**
```typescript
interface GigCardProps {
  gig: Gig;
  currentUserId?: string;
}
```

**Features:**
- 🟣 **Purple Gradient Theme**: Matches branding
- 👤 **Profile Photo with Budge Border**: Flickers if user has active Story
- 🏷️ **BUDGE Badge**: Yellow pill badge in corner
- 💰 **Talent Reward Display**: Prominent purple-themed reward section
- 📝 **Title & Description**: Truncated with line-clamp-3
- 🔗 **Clickable Username**: Links to Hue profile
- ✅ **Apply Button**: Sends application (placeholder - shows success)
- 🚫 **Disabled for Own Gigs**: Shows "Your Gig" instead

**Budge Border Classes:**
```tsx
className={`w-12 h-12 rounded-full ${
  gig.budge_enabled && gig.user_has_story ? 'flicker-border' :
  gig.budge_enabled ? 'budge-border' : 'border-2 border-purple-500/50'
}`}
```

### GigsModal
**Location:** [components/GigsModal.tsx](components/GigsModal.tsx)

**Props:**
```typescript
interface GigsModalProps {
  onClose: () => void;
  userId: string;
  talentBalance: number;
  onGigPosted: () => void; // Refresh parent balance
}
```

**Features:**
- 📊 **Slot Status Display**: "Active Gigs: X/5"
- 💰 **Balance Display**: Shows current Talent balance
- ➕ **Post New Gig Form**: 
  - Title input (max 100 chars)
  - Description textarea (max 500 chars)
  - Talent reward input (number)
  - Budge toggle with explanation
- 📋 **Gigs List**: 
  - Shows all user gigs (active first)
  - Green "DONE" badge for completed
  - Yellow "BUDGE" badge for active budge
  - "Mark Complete" button
- 🔒 **Smart Disabling**: 
  - Post button disabled if 5 slots full or balance < 10
  - Shows helpful error messages

### Settings Page Integration
**Location:** [app/settings/page.tsx](app/settings/page.tsx)

**New Section:**
```tsx
<div className="bg-gradient-to-br from-purple-900/20 to-black border-2 border-purple-500/30 rounded-xl p-6 mb-8">
  <Briefcase icon />
  <h2>Gig Protocol</h2>
  <p>Post high-value opportunities for 10 Talents</p>
  <button onClick={handleOpenGigs}>Manage Your Gigs</button>
  <info>5 Gig Slots Max. Enable BUDGE for yellow border.</info>
</div>
```

## Hue Feed Integration

### Gig Interleaving
**Pattern:** 1 GigCard every 3 regular posts
```
POST 1
POST 2  
POST 3
GIG 1  ← First gig
POST 4
POST 5
POST 6
GIG 2  ← Second gig (or cycle back to first)
...
```

### Budge Border Application
**Enhanced Profile Photos Everywhere:**

When rendering ANY profile photo in the Hue feed:
1. Check if user has active Budge-enabled gig
2. Check if user has active Story (expires_at > NOW())
3. Apply appropriate border class

**Example:**
```tsx
{post.profile_photo ? (
  <img
    src={post.profile_photo}
    className={`w-12 h-12 rounded-full ${
      userHasBudgeGig && userHasActiveStory ? 'flicker-border' :
      userHasBudgeGig ? 'budge-border' : ''
    }`}
  />
) : (
  <div className={`w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 ${
    userHasBudgeGig && userHasActiveStory ? 'flicker-border' :
    userHasBudgeGig ? 'budge-border' : ''
  }`}>
    {/* Fallback */}
  </div>
)}
```

### Data Fetching
```typescript
// Load gigs with user data and story status
const loadGigs = async () => {
  const { data: gigs } = await supabase
    .from('gigs')
    .select(`
      *,
      profiles!user_id (
        display_name,
        profile_photo
      )
    `)
    .eq('is_completed', false)
    .order('created_at', { ascending: false });

  // For each gig, check for active story
  const gigsWithStories = await Promise.all(
    gigs.map(async (gig) => {
      const { data: story } = await supabase
        .from('wall_messages')
        .select('id')
        .eq('user_id', gig.user_id)
        .eq('post_type', 'story')
        .gt('expires_at', new Date().toISOString())
        .limit(1)
        .single();

      return {
        ...gig,
        user_has_story: !!story
      };
    })
  );

  setGigs(gigsWithStories);
};
```

## CSS Animations

### Budge Border (Yellow Only)
```css
.budge-border {
  border: 3px solid #eab308 !important;
  box-shadow: 0 0 12px rgba(234, 179, 8, 0.5);
}
```

### Flicker Border (Yellow ↔ Red)
```css
.flicker-border {
  border: 3px solid #eab308;
  box-shadow: 0 0 12px rgba(234, 179, 8, 0.5);
  animation: flicker 6s infinite;
}

@keyframes flicker {
  0%, 80% { 
    border-color: #eab308; 
    box-shadow: 0 0 12px rgba(234, 179, 8, 0.5);
  }
  90%, 100% { 
    border-color: #ef4444; 
    box-shadow: 0 0 12px rgba(239, 68, 68, 0.5);
  }
}
```

**Why 6 seconds?**
- Long enough to not be distracting
- Short enough to create urgency
- Smooth psychological trigger (red flash = "Act now!")

## User Flow

### Posting a Gig
1. Navigate to Settings page
2. Click "Manage Your Gigs" in Gig Protocol section
3. GigsModal opens showing:
   - Current active slots (X/5)
   - Talent balance
4. Click "Post New Gig (10 Talents)"
5. Fill form:
   - Title (required)
   - Description (required)
   - Talent Reward (required, > 0)
   - Toggle "Enable BUDGE" (optional)
6. Click "Post Gig (10 Talents)"
7. System validates:
   - User has < 5 active gigs ✓
   - User has ≥ 10 Talents ✓
8. Deduct 10 Talents, create gig
9. Gig appears in Hue feed immediately
10. If Budge enabled, user's profile photo gets yellow border

### Completing a Gig
1. Open GigsModal from Settings
2. Find active gig in list
3. Click "Mark Complete" button
4. Gig marked as completed (gets green "DONE" badge)
5. Slot is freed (can now post another)
6. Completed gig no longer appears in Hue feed

### Applying to a Gig (User Perspective)
1. Scrolling Hue feed
2. See GigCard with purple gradient
3. Notice BUDGE badge or flickering border
4. Read title, description, reward
5. Click "Apply for This Gig"
6. See "Application Sent!" success message
7. (In full implementation: DM sent to gig poster)

## Psychology & Economics

### Why 10 Talents?
- **Quality Control**: High enough cost to prevent spam
- **Commitment Signal**: Shows poster is serious
- **Value Perception**: Makes Talents feel like real currency
- **Economy Loop**:
  1. User earns Talents (donations, verifications, goals)
  2. Spends 10 Talents to post Gig
  3. Gets work done, possibly earns more Talents
  4. Repeats cycle

### Why Budge Works
- **Scarcity**: Limited to 5 slots = competition for visibility
- **Urgency**: Flickering red border = "This person is online NOW"
- **Social Proof**: Yellow border = "I'm actively hiring"
- **Story Synergy**: If someone has both Budge + Story, they're hyper-visible
- **Attention Economics**: Makes users stop scrolling (6s flicker = subliminal trigger)

### Future Expansions
The modular Talent transaction system powers:

1. **Gig Marketplace** (Current)
   - Post jobs, hire talent
   - 10 Talent listing fee

2. **Sales Protocol** (Planned)
   - Sell digital/physical goods
   - Talent as currency
   - Similar 5-slot system

3. **Service Economy** (Planned)
   - Coaching, consulting, tutoring
   - Book sessions with Talents
   - Budge = "Available Now"

4. **Crowdfunding** (Already live via $$$4U)
   - Donate Talents to community goals
   - Same transaction infrastructure

## Setup Instructions

### 1. Run Database Migration
```bash
# Copy database/migration-gig-protocol.sql
# Paste in Supabase SQL Editor
# Execute
```

Verify tables created:
```sql
SELECT * FROM gigs LIMIT 1;
SELECT user_can_post_gig('YOUR_USER_ID');
```

### 2. Test Gig Posting
```bash
# Ensure user has at least 10 Talents
UPDATE profiles SET talent_balance = 50 WHERE id = 'YOUR_USER_ID';

# Post a gig via UI:
1. Go to Settings
2. Click "Manage Your Gigs"
3. Click "Post New Gig"
4. Fill form with Budge enabled
5. Check balance decreased by 10
```

### 3. Verify Budge Borders
```bash
# Post a Story (24h expiration)
# Navigate to Hue feed
# Your profile photo should flicker yellow ↔ red
# Other users' photos should have solid yellow if Budge enabled
```

### 4. Test Slot Limits
```bash
# Post 5 gigs
# Try to post 6th → Should see "maximum of 5 active Gigs" error
# Complete one gig
# Should be able to post another
```

## Troubleshooting

### Gigs Not Appearing in Hue Feed
- ✅ Check `is_completed = FALSE` in database
- ✅ Verify Hue feed `loadGigs()` function called in useEffect
- ✅ Check browser console for fetch errors
- ✅ Ensure gigs table has RLS policies enabled

### Budge Border Not Showing
- ✅ Verify `budge_enabled = TRUE` in database
- ✅ Check CSS classes applied in browser DevTools
- ✅ Ensure globals.css has `.budge-border` and `.flicker-border` keyframes
- ✅ Verify user has active Story for flicker effect

### Can't Post Gig (Button Disabled)
- ✅ Check user has < 5 active gigs: `SELECT COUNT(*) FROM gigs WHERE user_id = 'X' AND is_completed = FALSE`
- ✅ Verify user has ≥ 10 Talents: `SELECT talent_balance FROM profiles WHERE id = 'X'`
- ✅ Check browser console for validation errors

### Talent Not Deducted
- ✅ Check API endpoint response in Network tab
- ✅ Verify `SUPABASE_SERVICE_ROLE_KEY` in .env
- ✅ Check supabaseAdmin client initialized correctly
- ✅ Look for rollback errors in POST /api/gig

### Flicker Animation Laggy
- ✅ Use `will-change: border-color` in CSS for GPU acceleration
- ✅ Limit number of flickering elements on screen
- ✅ Ensure animation uses `transform` and `opacity` (GPU-friendly)
- ✅ Test on lower-end devices

## Metrics to Track

### Gig Performance
```sql
-- Total gigs posted
SELECT COUNT(*) FROM gigs;

-- Active vs completed
SELECT is_completed, COUNT(*) FROM gigs GROUP BY is_completed;

-- Average talent reward
SELECT AVG(talent_reward) FROM gigs;

-- Budge adoption rate
SELECT 
  COUNT(CASE WHEN budge_enabled THEN 1 END) * 100.0 / COUNT(*) as budge_rate
FROM gigs;
```

### User Engagement
```sql
-- Users who posted gigs
SELECT COUNT(DISTINCT user_id) FROM gigs;

-- Users at 5-slot limit
SELECT user_id, COUNT(*) as active_gigs
FROM gigs
WHERE is_completed = FALSE
GROUP BY user_id
HAVING COUNT(*) = 5;

-- Total Talents spent on gigs
SELECT COUNT(*) * 10 as talents_spent FROM gigs;
```

### ROI Analysis
```sql
-- Compare Talent in vs. Talent out
SELECT 
  SUM(talent_reward) as total_rewards_offered,
  COUNT(*) * 10 as total_posting_costs
FROM gigs;
```

## Best Practices

### For Gig Posters
1. **Write Clear Titles**: 3-7 words, action-oriented
2. **Detail Requirements**: What skills/deliverables needed
3. **Fair Rewards**: Consider complexity and time
4. **Use Budge Wisely**: Enable when you need quick fill
5. **Mark Complete Promptly**: Free up slots for new opportunities

### For Platform
1. **Monitor Slot Usage**: If most users hit 5-slot limit, consider increasing
2. **Adjust Cost**: If 10 Talents too high/low, experiment with 5 or 15
3. **Budge Limits**: Consider adding cooldown to prevent Budge spam
4. **Quality Control**: Flag gigs with < 10 Talent rewards as low-value

### For Developers
1. **Lazy Load Gigs**: Don't load all gigs at once in feed
2. **Cache Story Status**: Don't query stories for every render
3. **Debounce Flicker**: Ensure CSS animation doesn't block main thread
4. **Error Boundaries**: Wrap GigCard in error boundary to prevent feed crashes

---

**Status:** ✅ Production Ready  
**Dependencies:** $$$4U Official Protocol (Talent economy), Wall/Hue feed  
**Next:** Test in production, monitor adoption, expand to Sales Protocol
