# NICKNAME & PROFILE REVEAL SYSTEM - QUICK REFERENCE

## What Changed?

### 1. Wall Display (Everyone)
- **Before**: Unverified saw nicknames, verified saw usernames
- **After**: **EVERYONE sees nicknames** on the Wall
- **Full Names**: Only visible when opening profile modal
- **Rationale**: Creates mystery, encourages profile viewing

### 2. Profile Pictures
- **Default**: All pictures are **blocked** (black or white overlay)
- **Reveal Cost**: 1 Talent per picture
- **Permanence**: Once revealed, stays revealed (unless picture changes)
- **Own Pictures**: Always visible to yourself

### 3. Blocker Preference
- Users choose between **black** or **white** blocker
- Shown to users who haven't paid to reveal
- Configurable in settings

## Quick Implementation Checklist

### ✅ Database Migrations
1. **migration-nickname-names.sql**
   - Adds `nickname` (10 char max)
   - Adds `first_name`, `last_name`
   - Creates search indexes

2. **migration-profile-picture-reveals.sql**
   - Creates `profile_picture_reveals` table
   - Adds `blocker_preference` to profiles
   - Sets up RLS policies

### ✅ New Components
1. **ProfilePictureReveal.tsx**
   - Handles picture blocking/revealing
   - 1 Talent payment flow
   - Hover reveal prompt
   - Blocker display (black/white)

### ✅ Updated Components
1. **Wall.tsx**
   - Shows nicknames for ALL users
   - Passes `currentUserId` to ComaModal

2. **ComaModal.tsx**
   - Integrates ProfilePictureReveal
   - Shows full name (first + last)
   - Displays nickname in header

3. **GlobalSearch.tsx**
   - Added "Wiki" tab
   - Searches first/last names
   - Shows gig counts

### ✅ API Endpoints
1. **GET `/api/profile/picture-reveal`**
   - Check reveal status
   - Returns picture URL at reveal time

2. **POST `/api/profile/picture-reveal`**
   - Purchase reveal (1 Talent)
   - Validates balance
   - Creates reveal record
   - Logs transaction

3. **PUT `/api/profile/blocker-preference`**
   - Update blocker color choice
   - Validates black/white

### ✅ Type Updates
1. **Profile Interface**
   - Added `nickname`, `first_name`, `last_name`
   - Added `blocker_preference`, `profile_photo_url`

2. **WallMessage Interface**
   - Added `profiles` relation for nickname access

## User Experience Flow

### Scenario 1: New User Browses Wall
```
1. Opens Wall
2. Sees nicknames: "BlueSky23", "MaxVibes", "DJ_Neon"
3. Clicks "BlueSky23"
4. Profile modal opens
5. Picture is blocked (black square with lock icon)
6. Hovers over picture → "Reveal for 1T" prompt appears
7. Has 100 Talents
8. Clicks "Reveal for 1T"
9. Confirms purchase
10. Picture revealed with ✓ badge
11. 99 Talents remaining
12. Reveal is permanent
```

### Scenario 2: View Previously Revealed Profile
```
1. Clicks nickname on Wall
2. Profile opens
3. Picture immediately visible (already revealed)
4. "✓ Revealed" badge in corner
5. No payment required
```

### Scenario 3: Picture Changed
```
1. User BlueSky23 changes profile picture
2. Viewer clicks nickname
3. Blocker appears (new picture not revealed yet)
4. Must pay 1 Talent to reveal new picture
5. Old reveal record still exists but picture_url_at_reveal doesn't match
```

## Key Features

### Privacy Protection
- Nicknames hide real identities on Wall
- Full names only in profile view
- Profile pictures require payment to view
- Users control blocker color

### Monetization
- 1 Talent per reveal = Talent sink
- Picture changes = re-reveal opportunities
- Popular users = more revenue
- Permanent reveals = perceived value

### Gamification
- Curiosity = hover to see reveal option
- FOMO = everyone else can see if they pay
- Status = "✓ Revealed" badge
- Collection = reveal multiple profiles

## Database Queries

### Check Reveal Status
```sql
SELECT * FROM profile_picture_reveals
WHERE viewer_id = 'user-uuid'
AND viewed_user_id = 'target-uuid';
```

### Count Total Reveals
```sql
SELECT COUNT(*) as total_reveals
FROM profile_picture_reveals
WHERE viewed_user_id = 'target-uuid';
```

### Find Expired Reveals (Picture Changed)
```sql
SELECT r.*, p.profile_photo_url
FROM profile_picture_reveals r
JOIN profiles p ON p.id = r.viewed_user_id
WHERE r.picture_url_at_reveal != p.profile_photo_url
OR p.profile_photo_url IS NULL;
```

### Revenue from Reveals
```sql
SELECT COUNT(*) as total_reveals,
       COUNT(*) * 1 as talents_spent
FROM profile_picture_reveals;
```

## Testing Commands

### 1. Run Migrations
```bash
# In Supabase SQL Editor
-- Run migration-nickname-names.sql
-- Run migration-profile-picture-reveals.sql
```

### 2. Test Reveal Flow
```bash
# 1. Create test users
# 2. Set nicknames for each
# 3. Upload profile pictures
# 4. User A clicks User B's nickname
# 5. Pay 1 Talent to reveal
# 6. Verify picture shows
# 7. Close and reopen modal
# 8. Verify picture still visible
```

### 3. Test Picture Change
```bash
# 1. Reveal User B's picture
# 2. User B uploads new picture
# 3. User A reopens profile
# 4. Verify blocker reappears
# 5. Verify must pay again
```

## Edge Cases Handled

### ✅ No Nickname Set
- Fallback to username
```typescript
const displayName = message.profiles?.nickname || message.username;
```

### ✅ No Profile Picture
- Shows "No photo" placeholder
```typescript
{profilePhotoUrl ? (
  <img src={profilePhotoUrl} />
) : (
  <div>No photo</div>
)}
```

### ✅ Insufficient Talents
- Button disabled with message
```typescript
{viewerTalentBalance < 1 ? 'Not enough Talents' : 'Reveal for 1T'}
```

### ✅ View Own Profile
- Always visible, no blocker
```typescript
if (viewedUserId === viewerUserId) {
  setIsRevealed(true);
  return;
}
```

### ✅ Picture Changed
- Detect via URL comparison
```typescript
if (data.picture_url_at_reveal !== profilePhotoUrl) {
  setIsRevealed(false);
}
```

## Settings Integration (Future)

### Blocker Preference Selector
```typescript
// In Settings page
<div>
  <label>Profile Picture Blocker</label>
  <select onChange={handleBlockerChange}>
    <option value="black">Black</option>
    <option value="white">White</option>
  </select>
</div>
```

### API Call
```typescript
await fetch('/api/profile/blocker-preference', {
  method: 'PUT',
  body: JSON.stringify({
    user_id: currentUserId,
    blocker_preference: 'black', // or 'white'
  }),
});
```

## Performance Considerations

### Indexes
```sql
-- Fast reveal lookups
CREATE INDEX idx_profile_picture_reveals_lookup 
ON profile_picture_reveals(viewer_id, viewed_user_id);

-- Fast profile queries
CREATE INDEX idx_profiles_nickname ON profiles(nickname);
CREATE INDEX idx_profiles_first_name ON profiles(first_name);
CREATE INDEX idx_profiles_last_name ON profiles(last_name);
```

### Caching Strategy
- Reveal status cached in component state
- Refetch on modal open
- Talent balance refreshed after purchase

## Security Notes

### RLS Policies
- Users can only view their own reveals
- Users can only insert reveals for themselves
- No delete policy = reveals are permanent
- Admins have full access

### Payment Validation
- Server-side Talent balance check
- Transaction logged in `talent_transactions`
- Cannot reveal own picture (server validation)
- Unique constraint prevents duplicate payments

## Migration Order

**CRITICAL**: Run migrations in this order:

1. `migration-nickname-names.sql` (adds nickname, first/last names)
2. `migration-profile-picture-reveals.sql` (adds reveal system)

## Files Modified/Created

### Created
- `/database/migration-nickname-names.sql`
- `/database/migration-profile-picture-reveals.sql`
- `/components/ProfilePictureReveal.tsx`
- `/app/api/profile/picture-reveal/route.ts`
- `/app/api/profile/blocker-preference/route.ts`
- `/WIKI_SEARCH_GUIDE.md`
- `/PROFILE_PICTURE_REVEAL_GUIDE.md`
- `/NICKNAME_REVEAL_QUICK_REFERENCE.md` (this file)

### Modified
- `/components/Wall.tsx` (nickname display for all)
- `/components/ComaModal.tsx` (reveal integration)
- `/components/GlobalSearch.tsx` (Wiki tab)
- `/types/database.ts` (Profile interface)
- `/app/api/wall/messages/route.ts` (profiles relation)

## Summary

### Before
- Unverified: See nicknames
- Verified: See usernames
- Profile pictures: Always visible
- Full names: Searchable, visible

### After
- **Everyone**: See nicknames on Wall
- **Full names**: Only in profile modal (verified users)
- **Profile pictures**: Blocked by default
- **Reveals**: 1 Talent = permanent reveal
- **Blocker**: User-chosen black or white

### Impact
- ✅ More privacy (nicknames only)
- ✅ Talent sink (monetization)
- ✅ Gamification (reveal system)
- ✅ Mystery (blocked pictures)
- ✅ Searchability (Wiki tab for names)

---

**Status**: ✅ Complete
**Date**: December 21, 2025
**Version**: 1.0
