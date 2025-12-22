# WIKI SEARCH & NICKNAME SYSTEM GUIDE

## Overview
The Wiki Search feature allows users to discover others by their full names, completed gigs, and personal bios. This creates a professional directory while maintaining privacy for unverified users through the nickname system.

## Core Concept
**Dual Identity System:**
- **Nicknames (Wall)**: 10-character max identifiers shown on the Wall
- **Full Names (Profiles)**: First and last names only visible to verified users via profile view
- **Wiki Search**: Searchable database of names, gigs, and bios

## Database Schema

### New Fields in `profiles` table
```sql
-- Nickname system (Wall identifier)
nickname TEXT CHECK (LENGTH(nickname) <= 10)

-- Full names (verified users only)
first_name TEXT
last_name TEXT

-- Wiki/bio already exists
wiki TEXT
```

### Migration
Run: `/workspaces/6713/database/migration-nickname-names.sql`

Creates:
- `nickname` column with 10-char constraint
- `first_name` and `last_name` columns
- Search indexes on all three fields
- Wiki index for bio search

## Access Control Matrix

### Unverified Users
| Feature | Access | Details |
|---------|--------|---------|
| Wall Display | Nickname only | See 10-char identifiers |
| Full Names | ❌ Blocked | Cannot view first/last names |
| Profile Click | ❌ Blocked | Cannot open profiles |
| Wiki Search | Read-only | Can search but not view full profiles |

### Verified Users
| Feature | Access | Details |
|---------|--------|---------|
| Wall Display | Username | See full @username |
| Full Names | ✅ Full Access | View first/last names in profiles |
| Profile Click | ✅ Full Access | Open and view all profiles |
| Wiki Search | ✅ Full Access | Search and view full details |

## Wall Display Logic

### Implementation (`Wall.tsx`)
```typescript
// Show nickname for unverified users, username for verified
const displayName = !isVerified && message.profiles?.nickname 
  ? message.profiles.nickname 
  : message.username;
```

### Examples
**Unverified user sees:**
```
BlueSky23: Hey everyone! 👋
MaxVibes: What's up!
```

**Verified user sees:**
```
@bluesky_official: Hey everyone! 👋
@max_anderson: What's up!
```

## Wiki Search Feature

### Search Tab
Located in `GlobalSearch.tsx` component as 6th tab:
- All
- Users
- **Wiki** ← New tab
- Gigs
- Pics
- Videos
- Audio

### Query Logic
```typescript
// Search Wiki (profiles by first/last name, gigs, wiki/bio)
if (tab === 'all' || tab === 'wiki') {
  const { data: wikiProfiles } = await supabase
    .from('profiles')
    .select(`
      id,
      username,
      first_name,
      last_name,
      nickname,
      verified_name,
      wiki,
      profile_photo_url,
      gigs_completed:gig_connections!inner(
        connection_type,
        gigs(title, description)
      )
    `)
    .or(
      `first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,wiki.ilike.%${searchQuery}%`
    )
    .limit(10);
}
```

### Search Fields
1. **First Name** - Full first name
2. **Last Name** - Full last name
3. **Wiki/Bio** - Personal bio/description
4. **Gigs** - Joined with `gig_connections` table

### Display Format
```typescript
const fullName = [p.first_name, p.last_name].filter(Boolean).join(' ');
const gigCount = p.gigs_completed?.length || 0;

{
  title: fullName || nickname || verified_name || username,
  subtitle: gigCount > 0 
    ? `${gigCount} gig${gigCount !== 1 ? 's' : ''} completed` 
    : 'No gigs yet'
}
```

### Example Results
```
🔍 Search: "Sarah"

Wiki Results:
┌─────────────────────────────────────┐
│ Sarah Johnson                        │
│ 5 gigs completed                     │
│ @sarahjay                            │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Sarah Chen                           │
│ No gigs yet                          │
│ @sarachen88                          │
└─────────────────────────────────────┘
```

## API Updates

### Wall Messages API
**File**: `app/api/wall/messages/route.ts`

**Before:**
```typescript
.select(`
  *,
  reaction_count:wall_reactions(count)
`)
```

**After:**
```typescript
.select(`
  *,
  reaction_count:wall_reactions(count),
  profiles!wall_messages_user_id_fkey(nickname, first_name, last_name)
`)
```

### Profile Search API
**File**: `components/GlobalSearch.tsx`

**Enhanced Query:**
```typescript
.select('id, username, verified_name, display_name, profile_photo_url, nickname, first_name, last_name')
.or(
  `username.ilike.%${searchQuery}%,verified_name.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%,nickname.ilike.%${searchQuery}%`
)
```

## TypeScript Types

### Profile Interface (`types/database.ts`)
```typescript
export interface Profile {
  id: string;
  display_name?: string;
  wiki?: string;
  nickname?: string; // 10 char max Wall identifier
  first_name?: string; // Full first name (verified users only)
  last_name?: string; // Full last name (verified users only)
  // ... rest of fields
}
```

### WallMessage Interface
```typescript
export interface WallMessage {
  id: string;
  user_id: string;
  username: string;
  content: string;
  // ... rest of fields
  profiles?: { // Relation for nickname display
    nickname?: string;
    first_name?: string;
    last_name?: string;
  };
}
```

## User Flow Examples

### Scenario 1: Unverified User on Wall
1. User lands on Wall
2. Sees messages with nicknames: "BlueSky23", "MaxVibes"
3. Tries to click nickname → **Blocked** (no action)
4. Cannot view full names

### Scenario 2: Verified User on Wall
1. User lands on Wall
2. Sees messages with usernames: "@bluesky_official", "@max_anderson"
3. Clicks username → Opens full profile
4. Profile shows first_name, last_name, gigs, bio

### Scenario 3: Wiki Search
1. User opens Global Search (magnifying glass icon)
2. Clicks "Wiki" tab
3. Types "Sarah"
4. Sees results:
   - Sarah Johnson (5 gigs completed)
   - Sarah Chen (No gigs yet)
5. If **verified**: Clicks result → Opens profile
6. If **unverified**: Clicks result → Shows UnverifiedGate modal

## Privacy Protection

### 1. Nickname Constraint
```sql
CHECK (LENGTH(nickname) <= 10)
```
- Forces brevity
- Creates mystique
- Protects identity

### 2. Name Visibility
- Full names only in profiles
- Profiles only accessible to verified users
- Unverified users see nicknames on Wall

### 3. Search Access
- Everyone can search Wiki
- Only verified users can view clicked results
- Prevents profile scraping by unverified accounts

## Best Practices

### For Users
1. **Choose unique nicknames** - 10 chars max, memorable
2. **Fill out Wiki** - Makes you discoverable
3. **Complete gigs** - Boosts your Wiki ranking
4. **Get verified** - Unlock full name viewing

### For Admins
1. **Monitor nickname uniqueness** - Prevent impersonation
2. **Review Wiki content** - Flag inappropriate bios
3. **Track search patterns** - Identify popular searches
4. **Verify carefully** - Full names become visible

## Testing Checklist

### Database
- [ ] Run migration successfully
- [ ] Verify nickname length constraint (10 chars)
- [ ] Check indexes created
- [ ] Test wiki column exists

### Wall Display
- [ ] Unverified user sees nicknames
- [ ] Verified user sees usernames
- [ ] Clicking nickname blocked for unverified
- [ ] Clicking username works for verified

### Wiki Search
- [ ] Wiki tab appears in search
- [ ] First name search returns results
- [ ] Last name search returns results
- [ ] Wiki/bio search returns results
- [ ] Gig count displays correctly
- [ ] Empty gigs shows "No gigs yet"

### Access Control
- [ ] Unverified cannot view profiles from Wiki
- [ ] Verified can view profiles from Wiki
- [ ] UnverifiedGate modal shows for blocked access

## Future Enhancements

### Phase 2
- **Nickname uniqueness** - Prevent duplicates
- **Wiki formatting** - Rich text editor
- **Gig badges** - Visual indicators for completed gigs
- **Search ranking** - Sort by gig completion count

### Phase 3
- **Advanced filters** - Filter by gig type, talent balance
- **Wiki templates** - Pre-made bio formats
- **Name verification** - Official document uploads
- **Public/Private toggle** - Hide from Wiki search

## Troubleshooting

### Issue: Nicknames not showing on Wall
**Solution**: Check API includes profiles relation
```typescript
profiles!wall_messages_user_id_fkey(nickname, first_name, last_name)
```

### Issue: Wiki search returns no results
**Solution**: Verify indexes exist
```sql
CREATE INDEX idx_profiles_first_name ON profiles(first_name);
CREATE INDEX idx_profiles_last_name ON profiles(last_name);
CREATE INDEX idx_profiles_wiki ON profiles(wiki);
```

### Issue: Full names visible to unverified users
**Solution**: Check Wall display logic uses isVerified check
```typescript
const displayName = !isVerified && message.profiles?.nickname 
  ? message.profiles.nickname 
  : message.username;
```

## Related Documentation
- [UNVERIFIED_GATING_GUIDE.md](./UNVERIFIED_GATING_GUIDE.md) - Access control system
- [SEARCH_PROTOCOL_GUIDE.md](./SEARCH_PROTOCOL_GUIDE.md) - Search features
- [PROFILE_CONNECTIONS_GUIDE.md](./PROFILE_CONNECTIONS_GUIDE.md) - Profile system
- [GIG_PROTOCOL_GUIDE.md](./GIG_PROTOCOL_GUIDE.md) - Gig system

---

**Status**: ✅ Implemented
**Last Updated**: December 21, 2025
**Version**: 1.0
