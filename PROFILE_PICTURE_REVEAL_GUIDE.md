# PROFILE PICTURE REVEAL SYSTEM

## Overview
The Profile Picture Reveal system is a privacy-first monetization feature where users must pay **1 Talent** to reveal another user's profile picture. Reveals are **permanent** unless the picture changes.

## Core Mechanics

### 1. Nickname Display (Wall)
**Everyone sees nicknames on the Wall** - no full names visible until profile is opened.

```typescript
// Wall display logic
const displayName = message.profiles?.nickname || message.username;
```

**Visual Example:**
```
Wall View (All Users):
┌────────────────────────────┐
│ BlueSky23: Hey everyone!   │
│ MaxVibes: What's up!       │
│ PopeAI: Welcome to 6713    │
└────────────────────────────┘
```

### 2. Profile Picture Blocking
By default, all profile pictures are **blocked** until revealed.

**Blocker Options:**
- **Black**: Dark overlay with lock icon
- **White**: Light overlay with lock icon
- User chooses their preference in settings

### 3. Reveal Economics
- **Cost**: 1 Talent per reveal
- **Permanence**: Once revealed, stays revealed
- **Invalidation**: If picture changes, reveal expires (must pay again)
- **Own Pictures**: Always visible to self (no payment needed)

## Database Schema

### `profile_picture_reveals` Table
```sql
CREATE TABLE profile_picture_reveals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  viewer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  viewed_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  revealed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  picture_url_at_reveal TEXT, -- Tracks picture changes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(viewer_id, viewed_user_id)
);
```

**Key Fields:**
- `viewer_id`: User who paid to reveal
- `viewed_user_id`: User whose picture was revealed
- `picture_url_at_reveal`: URL at time of reveal (detects picture changes)
- `revealed_at`: Timestamp of reveal

### `profiles` Extension
```sql
ALTER TABLE profiles ADD COLUMN blocker_preference TEXT 
  DEFAULT 'black' 
  CHECK (blocker_preference IN ('black', 'white'));
```

### Indexes
```sql
CREATE INDEX idx_profile_picture_reveals_viewer ON profile_picture_reveals(viewer_id);
CREATE INDEX idx_profile_picture_reveals_viewed ON profile_picture_reveals(viewed_user_id);
CREATE INDEX idx_profile_picture_reveals_lookup ON profile_picture_reveals(viewer_id, viewed_user_id);
```

## Component Architecture

### ProfilePictureReveal Component
**Location**: `/workspaces/6713/components/ProfilePictureReveal.tsx`

**Props:**
```typescript
interface ProfilePictureRevealProps {
  profilePhotoUrl?: string | null;
  blockerPreference: 'black' | 'white';
  viewedUserId: string;
  viewerUserId: string;
  viewerTalentBalance: number;
  onRevealPurchase: () => Promise<void>;
  className?: string;
}
```

**States:**
1. **Loading**: Checking reveal status
2. **Own Profile**: Always visible
3. **Revealed**: Picture visible with "✓ Revealed" badge
4. **Blocked**: Blocker with hover prompt to reveal

**Visual Flow:**
```
┌─────────────────────────┐
│  Hover Over Blocked     │
│  Profile Picture        │
│                         │
│  [Eye Icon]             │
│  Reveal Profile Picture │
│  1 Talent • Permanent   │
│                         │
│  [Reveal for 1T Button] │
└─────────────────────────┘
```

### ComaModal Integration
**Location**: `/workspaces/6713/components/ComaModal.tsx`

**Enhanced Features:**
- Profile picture with reveal system
- Full name display (first_name + last_name)
- Nickname display in header
- Wiki/bio section
- COMA status
- Talent balance (own profile only)

**Props Update:**
```typescript
interface ComaModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile | null;
  username: string;
  currentUserId?: string; // NEW: For reveal logic
}
```

## API Endpoints

### GET `/api/profile/picture-reveal`
**Check if viewer has revealed a profile picture**

**Query Params:**
- `viewer_id`: User checking reveal status
- `viewed_user_id`: User whose picture is being checked

**Response:**
```json
{
  "revealed": true,
  "picture_url_at_reveal": "https://...",
  "revealed_at": "2025-12-21T10:30:00Z"
}
```

### POST `/api/profile/picture-reveal`
**Purchase reveal for 1 Talent**

**Body:**
```json
{
  "viewer_id": "user-uuid",
  "viewed_user_id": "target-uuid",
  "picture_url": "https://..."
}
```

**Success Response:**
```json
{
  "success": true,
  "new_balance": 99
}
```

**Error Responses:**
- `400`: Missing fields, cannot reveal own picture
- `400`: Insufficient Talents
- `500`: Server error

**Transaction Flow:**
1. Check if already revealed
2. If picture changed, update reveal record
3. Verify viewer's Talent balance ≥ 1
4. Deduct 1 Talent from viewer
5. Create/update reveal record
6. Log transaction in `talent_transactions`

### PUT `/api/profile/blocker-preference`
**Update blocker preference**

**Body:**
```json
{
  "user_id": "user-uuid",
  "blocker_preference": "black" // or "white"
}
```

**Response:**
```json
{
  "success": true,
  "blocker_preference": "black"
}
```

## User Flows

### Flow 1: View Profile (First Time)
1. User clicks nickname on Wall
2. ComaModal opens with profile
3. Profile picture shows blocker (black or white)
4. User hovers → Sees "Reveal for 1T" prompt
5. User clicks → Confirms purchase
6. 1 Talent deducted
7. Picture revealed with ✓ badge
8. Reveal is permanent

### Flow 2: View Previously Revealed Profile
1. User clicks nickname on Wall
2. ComaModal opens
3. Profile picture immediately visible (no blocker)
4. "✓ Revealed" badge shows in corner

### Flow 3: Picture Changed
1. User views previously revealed profile
2. Picture has changed since last reveal
3. Blocker appears again
4. Must pay 1 Talent to reveal new picture

### Flow 4: View Own Profile
1. User clicks their own nickname
2. Profile picture always visible
3. No payment required
4. No blocker shown

### Flow 5: Insufficient Talents
1. User tries to reveal picture
2. Has 0 Talents
3. Button disabled: "Not enough Talents"
4. Cannot purchase reveal

## Privacy & Security

### Row Level Security (RLS)
```sql
-- Users can view their own reveals
CREATE POLICY "Users can view their own reveals"
  ON profile_picture_reveals FOR SELECT
  USING (viewer_id = auth.uid());

-- Users can insert their own reveals
CREATE POLICY "Users can create reveals"
  ON profile_picture_reveals FOR INSERT
  WITH CHECK (viewer_id = auth.uid());

-- No delete policy = reveals are permanent
```

### Access Control
- **Own Pictures**: Always visible
- **Revealed Pictures**: Visible only to payer
- **Unrevealed Pictures**: Blocked for everyone else
- **Picture Changes**: Invalidate previous reveals

### Anti-Abuse Measures
1. **Cannot reveal own picture** - Server-side check
2. **Permanent reveals** - No refunds, no deletions
3. **Picture change detection** - Must repay if picture changes
4. **Unique constraint** - One reveal per viewer-viewed pair

## TypeScript Types

### Profile Interface Updates
```typescript
export interface Profile {
  id: string;
  display_name?: string;
  wiki?: string;
  nickname?: string; // 10 char max Wall identifier
  first_name?: string; // Full first name
  last_name?: string; // Full last name
  blocker_preference?: 'black' | 'white'; // NEW
  profile_photo_url?: string; // NEW
  is_admin: boolean;
  verified_at?: string;
  // ... rest of fields
}
```

### ProfilePictureReveal State
```typescript
const [isRevealed, setIsRevealed] = useState(false);
const [loading, setLoading] = useState(true);
const [purchasing, setPurchasing] = useState(false);
const [showRevealPrompt, setShowRevealPrompt] = useState(false);
```

## Testing Checklist

### Database
- [ ] Run migration: `migration-profile-picture-reveals.sql`
- [ ] Verify `profile_picture_reveals` table exists
- [ ] Verify `blocker_preference` column in `profiles`
- [ ] Check RLS policies active
- [ ] Verify indexes created

### Reveal Mechanics
- [ ] Hover over blocked picture shows prompt
- [ ] Click reveals picture after payment
- [ ] 1 Talent deducted from balance
- [ ] "✓ Revealed" badge appears
- [ ] Reveal persists on modal close/reopen
- [ ] Own picture always visible

### Picture Change Detection
- [ ] Change profile picture
- [ ] Previous reveals become invalid
- [ ] Blocker reappears for users who revealed old picture
- [ ] Must pay again to reveal new picture

### Blocker Preferences
- [ ] Black blocker displays correctly
- [ ] White blocker displays correctly
- [ ] Setting saves in database
- [ ] Other users see chosen blocker

### Edge Cases
- [ ] Cannot reveal own picture
- [ ] Insufficient Talents disables button
- [ ] Multiple reveals of same picture don't charge twice
- [ ] Reveal for deleted user handled gracefully

### Wall Display
- [ ] Both verified and unverified see nicknames
- [ ] Full names only in profile modal
- [ ] Username fallback if no nickname set

## Monetization Strategy

### Revenue Sources
1. **Initial Reveals**: 1 Talent per picture
2. **Picture Changes**: Re-reveals cost 1 Talent
3. **Popular Users**: High-follower accounts = more reveals

### Talent Sink
- Removes Talents from economy
- Incentivizes Talent earning activities
- Creates scarcity value

### Psychological Design
- **FOMO**: Everyone else can see if they pay
- **Permanence**: One-time cost (good value)
- **Mystery**: Blocker creates curiosity
- **Status**: Revealed badge shows who paid

## Future Enhancements

### Phase 2
- **Bulk Reveals**: Pay 10 Talents to reveal 15 pictures
- **Reveal Notifications**: Alert users when their picture is revealed
- **Reveal Count**: Show "67 people revealed this picture"
- **Reveal Leaderboard**: Most-revealed pictures

### Phase 3
- **Temporary Reveals**: Pay 0.5T for 24-hour view
- **Reveal Gifting**: Gift reveals to friends
- **Picture Showcase**: Users can make pictures free to reveal
- **Animated Blockers**: Premium blocker animations

### Phase 4
- **NFT Integration**: Reveal as NFT ownership
- **Reveal Marketplace**: Trade reveal rights
- **Celebrity Pricing**: Higher reveal costs for verified artists
- **Reveal Subscriptions**: Monthly fee for unlimited reveals

## Troubleshooting

### Issue: Picture not revealing after payment
**Solution**: Check if picture URL changed since payment
```sql
SELECT picture_url_at_reveal, p.profile_photo_url
FROM profile_picture_reveals r
JOIN profiles p ON p.id = r.viewed_user_id
WHERE r.viewer_id = 'user-id' AND r.viewed_user_id = 'target-id';
```

### Issue: Talent deducted but reveal failed
**Solution**: Check `talent_transactions` table for transaction
```sql
SELECT * FROM talent_transactions 
WHERE user_id = 'user-id' 
AND transaction_type = 'profile_picture_reveal'
ORDER BY created_at DESC LIMIT 1;
```

### Issue: Blocker not showing correct color
**Solution**: Verify `blocker_preference` in profiles table
```sql
SELECT blocker_preference FROM profiles WHERE id = 'user-id';
```

### Issue: Own picture shows blocker
**Solution**: Check `viewerUserId === viewedUserId` logic
```typescript
if (viewedUserId === viewerUserId) {
  // Should always show picture, no blocker
  setIsRevealed(true);
  return;
}
```

## Related Documentation
- [WIKI_SEARCH_GUIDE.md](./WIKI_SEARCH_GUIDE.md) - Nickname and name search
- [UNVERIFIED_GATING_GUIDE.md](./UNVERIFIED_GATING_GUIDE.md) - Access control
- [PROFILE_CONNECTIONS_GUIDE.md](./PROFILE_CONNECTIONS_GUIDE.md) - Profile system
- [AUTH_SYSTEM.md](./AUTH_SYSTEM.md) - Authentication

---

**Status**: ✅ Implemented
**Last Updated**: December 21, 2025
**Version**: 1.0
**Talent Cost**: 1T per reveal
