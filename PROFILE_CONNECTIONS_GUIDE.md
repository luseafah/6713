# 🔗 Profile Connections & Discovery System

## Overview
The **Profile Connections & Discovery** system transforms networking into a high-stakes discovery game. Users can see who they've worked with through Gigs and randomly discover new connections through their network.

## Core Features

### 1. **Recent Connections Row**
Displays the last 3 people who completed Gigs with the profile owner, creating a visual "legacy" of collaborations.

### 2. **Involvement Count**
Shows quantifiable social impact: `@username +1.2k involved`
- Counts total gig connections (as poster or worker)
- Auto-formats large numbers (1200 → 1.2k, 1,500,000 → 1.5M)

### 3. **Random Discovery**
Phone icon button that fetches a random user from the connection network, creating an "endless web of verified connections."

### 4. **Discovery Modal**
Beautiful popup showing:
- Profile photo
- Gig stars rating (0-5)
- Follower count
- Latest post expiry countdown
- ❤️ "Social Teleport" button to visit their profile

## Database Schema

### gig_connections Table
```sql
CREATE TABLE gig_connections (
  id UUID PRIMARY KEY,
  gig_id UUID REFERENCES gigs(id),
  poster_user_id UUID REFERENCES auth.users(id),
  worker_user_id UUID REFERENCES auth.users(id),
  gig_title TEXT NOT NULL,
  talent_amount INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE
);
```

**Purpose:** Records when two users work together on a gig

**When Created:** When gig poster marks gig as complete and specifies worker

### Helper Functions

**get_involvement_count(user_uuid)**
```sql
-- Returns total count of connections (as poster OR worker)
SELECT COUNT(*) FROM gig_connections
WHERE poster_user_id = user_uuid OR worker_user_id = user_uuid;
```

**get_recent_connections(user_uuid)**
```sql
-- Returns last 3 distinct users who worked with this user
-- Joins with profiles to get display_name and profile_photo
-- Orders by created_at DESC, LIMIT 3
```

**get_random_connection(user_uuid)**
```sql
-- Returns ONE random user from connection network
-- Includes: profile photo, gig stars, follower count, latest post expiry
-- Uses ORDER BY RANDOM() LIMIT 1
```

### New Profile Column: gig_stars
```sql
ALTER TABLE profiles 
ADD COLUMN gig_stars INTEGER DEFAULT 0 
CHECK (gig_stars >= 0 AND gig_stars <= 5);
```

**Purpose:** User's gig quality rating (0-5 stars)

**Future Use:** Rating system after gig completion

## API Endpoints

### GET /api/gig/connections?user_id=xyz
Get recent connections and involvement count

**Response:**
```typescript
{
  connections: [
    {
      connection_user_id: string;
      connection_user_name: string;
      connection_profile_photo: string;
      connection_date: string;
    }
  ],
  involvement_count: number;
}
```

### GET /api/gig/random-connection?user_id=xyz
Get random connection for discovery

**Response:**
```typescript
{
  user: {
    user_id: string;
    display_name: string;
    profile_photo: string;
    gig_stars: number;
    follower_count: number;
    latest_post_expires_at: string | null;
  }
}
```

**Error Cases:**
- `404`: No connections found
- `500`: Database error

### POST /api/gig/complete
Mark gig complete and record connection

**Request:**
```typescript
{
  gig_id: string;
  worker_user_id?: string; // Optional: who completed the gig
}
```

**New Behavior:**
If `worker_user_id` is provided, creates a record in `gig_connections` table linking poster and worker.

## Components

### ProfileConnections
**Location:** [components/ProfileConnections.tsx](components/ProfileConnections.tsx)

**Props:**
```typescript
interface ProfileConnectionsProps {
  userId: string;        // Profile owner's ID
  displayName: string;   // For "@username +X involved" text
}
```

**Features:**
- 🖼️ **3 Profile Photos**: Overlapping circles with z-index stacking
- 📊 **Involvement Text**: `@username +1.2k involved` with smart formatting
- 📞 **Discovery Button**: Phone icon that triggers random fetch
- ⚡ **Loading States**: Skeleton loader and spinner
- 🔄 **Auto-Load**: Fetches on mount using useState(() => {})

**Smart Number Formatting:**
```typescript
const formatCount = (count: number) => {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return count.toString();
};
```

### DiscoveryModal (embedded in ProfileConnections)
**Features:**
- 🎨 **Purple Gradient Theme**: Matches Gig Protocol branding
- 🌟 **Star Rating**: Visual 5-star display with filled/empty states
- 👥 **Follower Count**: With formatted numbers
- ⏱️ **Post Expiry**: Countdown timer (e.g., "Expires in 4h 23m")
- ❤️ **Social Teleport**: Pink-to-red gradient button that navigates to profile

**Time Calculation Logic:**
```typescript
const getTimeRemaining = () => {
  if (!latest_post_expires_at) return 'No active posts';
  
  const diff = expiresAt - now;
  if (diff <= 0) return 'Expired';
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  return hours > 0 ? `Expires in ${hours}h ${minutes}m` : `Expires in ${minutes}m`;
};
```

## Integration Points

### GhostProfile Component
**Updated:** [components/GhostProfile.tsx](components/GhostProfile.tsx)

**Changes:**
1. Import ProfileConnections
2. Add `displayName` prop (optional, default 'User')
3. Render ProfileConnections at top of page

```tsx
<ProfileConnections 
  userId={ghostUserId}
  displayName={displayName}
/>
```

### Hue Feed Profiles
**Future:** When users click profile photos in Hue feed, show ProfileConnections in modal/page

### Settings Page
**Future:** Add "My Connections" section showing full network graph

## User Flow

### Viewing Connections
1. Visit user's profile (via Ghost profile, Hue modal, etc.)
2. See ProfileConnections row at top
3. View 3 recent connection profile photos
4. Read involvement count: `@alice +347 involved`

### Random Discovery
1. Click Phone icon on ProfileConnections row
2. See spinner while fetching
3. DiscoveryModal appears with random connected user
4. View their stats:
   - Profile photo
   - 3/5 Gig stars
   - 1.2k followers
   - "Expires in 2h" for latest post
5. Click ❤️ button
6. Redirected to that user's full profile
7. See THEIR connections → Discover more users
8. **Endless Discovery Loop**

### Recording Connections
1. User A posts Gig
2. User B applies and does work
3. User A marks Gig complete
4. System prompts: "Who completed this gig?"
5. User A enters User B's username/ID
6. Connection recorded in gig_connections
7. Both users now show each other in Recent Connections
8. Both users' involvement count increases by 1

## Psychology & Network Effects

### Why This Works

**1. Quantifiable Legacy**
- "+1.2k involved" makes social impact visible and measurable
- Creates competition to increase involvement count
- Shows "this person gets things done"

**2. Discovery as Game**
- Random fetch = surprise and delight
- Phone icon = "call someone new"
- ❤️ button = low-friction engagement

**3. Verified Network**
- Connections only form through completed Gigs
- No fake followers or spam
- Every connection represents real work

**4. Network Density**
- More gigs = more connections = more discoveries
- Creates incentive to participate in Gig economy
- "Small world" effect: 3 degrees of separation

**5. Social Teleport**
- Jump from profile to profile through connections
- Explore network organically
- Find opportunities through "warm introductions"

### Future Enhancements

**1. Connection Strength**
```sql
-- Track multiple gigs between same users
SELECT COUNT(*) as connection_strength
FROM gig_connections
WHERE (poster_user_id = 'A' AND worker_user_id = 'B')
   OR (poster_user_id = 'B' AND worker_user_id = 'A');
```

**2. Network Visualization**
```jsx
<NetworkGraph
  userId={currentUser}
  depth={2} // Show connections of connections
  highlightPath={true}
/>
```

**3. Connection Tags**
```sql
ALTER TABLE gig_connections 
ADD COLUMN gig_category TEXT; -- 'design', 'dev', 'writing', etc.

-- Then filter discoveries by category:
SELECT * FROM get_random_connection(user_id)
WHERE gig_category = 'design';
```

**4. Mutual Connections**
```tsx
<ConnectionCard user={targetUser}>
  <MutualConnections count={12}>
    <Avatar src={mutual1} />
    <Avatar src={mutual2} />
    <Avatar src={mutual3} />
    <span>+9 more</span>
  </MutualConnections>
</ConnectionCard>
```

**5. Connection Timeline**
```tsx
<Timeline>
  {connections.map(conn => (
    <TimelineItem key={conn.id}>
      <Date>{conn.created_at}</Date>
      <GigTitle>{conn.gig_title}</GigTitle>
      <Talent>{conn.talent_amount} Talents</Talent>
    </TimelineItem>
  ))}
</Timeline>
```

## Setup Instructions

### 1. Run Migration
```bash
# Copy database/migration-gig-connections.sql
# Paste in Supabase SQL Editor
# Execute
```

**Verify:**
```sql
SELECT * FROM gig_connections LIMIT 1;
SELECT get_involvement_count('YOUR_USER_ID');
SELECT * FROM get_recent_connections('YOUR_USER_ID');
```

### 2. Test Connection Recording
```bash
# Create a test gig
POST /api/gig {
  title: "Test Gig",
  description: "Testing connections",
  talent_reward: 50,
  budge_enabled: false
}

# Complete it with worker ID
POST /api/gig/complete {
  gig_id: "GIG_UUID",
  worker_user_id: "WORKER_UUID"
}

# Check connection was created
SELECT * FROM gig_connections WHERE gig_id = 'GIG_UUID';
```

### 3. Test ProfileConnections Display
```bash
# Visit any profile page
# Should see ProfileConnections row with:
# - 3 recent connection photos (or fewer if < 3 connections)
# - "@username +X involved" text
# - Phone icon for discovery
```

### 4. Test Random Discovery
```bash
# Click Phone icon
# Should see DiscoveryModal with random connected user
# Click ❤️ button
# Should navigate to that user's profile
```

## Troubleshooting

### "No connections found"
- ✅ Check gig_connections table has data
- ✅ Verify connections were created when gigs completed
- ✅ Ensure worker_user_id was provided in completion

### ProfileConnections not showing
- ✅ Check userId prop is correct
- ✅ Verify API endpoint returning data
- ✅ Check browser console for fetch errors
- ✅ Component hidden if involvement_count = 0

### Random discovery fails
- ✅ Need at least 1 connection to discover
- ✅ Check RLS policies on gig_connections table
- ✅ Verify get_random_connection function exists
- ✅ Check for SQL errors in function

### Involvement count wrong
- ✅ Count includes connections as poster AND worker
- ✅ Check DISTINCT clause in query
- ✅ Verify no duplicate connections

### Post expiry shows "Expired" immediately
- ✅ Check wall_messages.expires_at is in future
- ✅ Verify timezone handling (all timestamps UTC)
- ✅ Ensure post_type = 'wall' (not 'story')

## Performance Considerations

### Database Indexes
```sql
-- Fast lookups by user
CREATE INDEX idx_connections_poster ON gig_connections(poster_user_id);
CREATE INDEX idx_connections_worker ON gig_connections(worker_user_id);

-- Fast recent connections query
CREATE INDEX idx_connections_created ON gig_connections(created_at DESC);
```

### Query Optimization
```sql
-- Use DISTINCT to avoid duplicates
-- Use LIMIT 3 for recent connections
-- Use LIMIT 1 with RANDOM() for discovery
-- Join profiles AFTER filtering connections
```

### Caching Strategy
```typescript
// Cache involvement count for 5 minutes
const [cachedCount, setCachedCount] = useState<{
  count: number;
  timestamp: number;
} | null>(null);

const getInvolvementCount = async () => {
  const now = Date.now();
  if (cachedCount && (now - cachedCount.timestamp) < 300000) {
    return cachedCount.count;
  }
  
  const count = await fetchCount();
  setCachedCount({ count, timestamp: now });
  return count;
};
```

## Analytics to Track

### Connection Metrics
```sql
-- Total connections in system
SELECT COUNT(*) FROM gig_connections;

-- Average connections per user
SELECT AVG(conn_count) FROM (
  SELECT user_id, COUNT(*) as conn_count
  FROM (
    SELECT poster_user_id as user_id FROM gig_connections
    UNION ALL
    SELECT worker_user_id FROM gig_connections
  ) sub
  GROUP BY user_id
) stats;

-- Top networkers
SELECT user_id, COUNT(*) as involvement
FROM (
  SELECT poster_user_id as user_id FROM gig_connections
  UNION ALL
  SELECT worker_user_id FROM gig_connections
) sub
GROUP BY user_id
ORDER BY involvement DESC
LIMIT 10;
```

### Discovery Usage
```sql
-- Track discovery clicks (add to analytics)
CREATE TABLE discovery_events (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  discovered_user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analyze discovery patterns
SELECT discovered_user_id, COUNT(*) as times_discovered
FROM discovery_events
GROUP BY discovered_user_id
ORDER BY times_discovered DESC;
```

---

**Status:** ✅ Production Ready  
**Dependencies:** Gig Protocol, profiles table, wall_messages  
**Next:** Network visualization, mutual connections, connection tags

## Complete Ecosystem

Now that **Profile Connections & Discovery** is live, 6713 has a complete ecosystem:

1. **Hue** → Personal feed with Budge indicators
2. **Wall** → Public #Earth chat room
3. **$$$4U** → Humanitarian donations and goals
4. **Gigs** → Job marketplace with 5 slots
5. **Profiles** → Verified legacy with connections
6. **Discovery** → Random social teleportation

Every interaction creates value, every connection is verified, and every user has a quantifiable impact.
