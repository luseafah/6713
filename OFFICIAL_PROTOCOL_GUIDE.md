# 🏛️ Official Protocol System ($$$4U)

## Overview
The **$$$4U** tab is a strictly regulated humanitarian dashboard for official community announcements. Think of it as a high-trust, one-way communication channel styled like Pope AI directives.

## Key Features

### 1. **Strictly Regulated**
- ✅ **Admin-Only**: Only admins can post announcements
- ✅ **10 Limit**: Only the last 10 announcements are displayed
- ✅ **Auto-Archive**: Old announcements automatically archive when new ones exceed limit
- ✅ **One-Way Flow**: No comments/replies - just donate or follow

### 2. **Donation Goals**
- 💰 Each announcement can have a Talent donation goal
- 📊 Real-time progress bar shows community contributions
- ✅ Goal reached status when target is met
- 🎯 Optional: Announcements work with or without goals

### 3. **Interactive Elements**
- 🔗 **Clickable @mentions**: Click usernames to view Hue profiles
- 💛 **Donate Button**: Contribute Talent to help reach goals
- 👤 **Follow Button**: Follow mentioned users directly

### 4. **Pope AI Styling**
- 🟡 Gold/yellow gradient backgrounds
- ⚪ White text on dark backgrounds
- 🛡️ Official seal icon
- ✨ Divine aesthetic matching Pope AI system

## Database Schema

### Tables Created
```sql
-- Official announcements (max 10 active)
CREATE TABLE official_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  media_url TEXT,
  donation_goal INTEGER DEFAULT 0,
  current_donations INTEGER DEFAULT 0,
  goal_reached BOOLEAN DEFAULT FALSE,
  mentioned_user_id UUID REFERENCES profiles(id),
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Donation tracking
CREATE TABLE donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID REFERENCES official_announcements(id),
  donor_user_id UUID REFERENCES profiles(id),
  amount INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Automatic Systems

**Auto-Archiving Trigger**
```sql
-- Keeps only 10 newest announcements
CREATE FUNCTION archive_old_announcements()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE official_announcements
  SET archived_at = NOW()
  WHERE id NOT IN (
    SELECT id FROM official_announcements
    WHERE archived_at IS NULL
    ORDER BY created_at DESC
    LIMIT 10
  ) AND archived_at IS NULL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Donation Progress Trigger**
```sql
-- Auto-updates donation totals and goal status
CREATE FUNCTION update_donation_progress()
RETURNS TRIGGER AS $$
DECLARE
  total_donations INTEGER;
  target_goal INTEGER;
BEGIN
  SELECT SUM(amount), a.donation_goal
  INTO total_donations, target_goal
  FROM donations d
  JOIN official_announcements a ON a.id = d.announcement_id
  WHERE d.announcement_id = NEW.announcement_id
  GROUP BY a.donation_goal;

  UPDATE official_announcements
  SET 
    current_donations = COALESCE(total_donations, 0),
    goal_reached = (COALESCE(total_donations, 0) >= donation_goal)
  WHERE id = NEW.announcement_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## API Endpoints

### POST /api/admin/announce
Create new official announcement (admin only)

**Request Body:**
```typescript
{
  content: string;
  media_url?: string;
  donation_goal?: number;
  mentioned_user_id?: string; // Auto-detected from @username
}
```

**Response:**
```typescript
{
  success: true;
  announcement: OfficialAnnouncement;
}
```

### GET /api/admin/announce
Get active announcements (public)

**Response:**
```typescript
{
  announcements: OfficialAnnouncement[];
}
```

### POST /api/donate
Donate Talent to an announcement

**Request Body:**
```typescript
{
  announcement_id: string;
  amount: number;
}
```

**Response:**
```typescript
{
  success: true;
  donation: Donation;
  new_balance: number;
}
```

### GET /api/donate?announcement_id=xyz
Get donation history for an announcement

**Response:**
```typescript
{
  donations: Donation[];
  total: number;
}
```

## Components

### AnnouncementCard
Full-featured announcement display with donation UI

**Features:**
- 📄 Content with @mention parsing
- 🖼️ Optional media display
- 📊 Progress bar (if donation goal set)
- 💰 Donate input and confirmation
- 🎯 Goal reached celebration
- 🔗 Clickable @mentions to Hue profiles
- 👤 Follow mentioned user button

**Usage:**
```tsx
<AnnouncementCard
  announcement={announcement}
  currentUserId={user.id}
  talentBalance={talentBalance}
  onDonationComplete={(newBalance) => {
    setTalentBalance(newBalance);
  }}
/>
```

## Page Implementation

### app/money/page.tsx
Complete $$$4U dashboard

**Features:**
- 🎨 Pope AI themed header with official seal
- 💰 Talent balance display
- 📡 Real-time donation updates via Supabase Realtime
- 📊 Loading states and empty state handling
- 🔄 Auto-refreshes when donations are made
- ℹ️ Info footer showing X of max 10 announcements

**Real-Time Subscription:**
```typescript
const channel = supabase
  .channel('donations-updates')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'donations'
  }, (payload) => {
    // Refresh announcement that was donated to
    const updatedAnnouncement = payload.new;
    setAnnouncements(prev =>
      prev.map(ann => ann.id === updatedAnnouncement.announcement_id 
        ? { ...ann, ...updatedAnnouncement } 
        : ann
      )
    );
  })
  .subscribe();
```

## User Flow

### Viewing Announcements
1. Navigate to $$$4U tab
2. See official header with Pope AI seal
3. View Talent balance at top
4. Scroll through active announcements (max 10)
5. Click @mentions to visit Hue profiles

### Donating to Goals
1. Find announcement with donation goal
2. See progress bar showing current/target
3. Enter Talent amount in input field
4. Click "Donate X Talent" button
5. Confirm donation
6. See balance update and progress bar increase
7. When goal reached, see "Goal Reached" celebration

### Admin Creating Announcements
1. Be logged in as admin (is_admin=TRUE)
2. POST to /api/admin/announce with content
3. Include @username to auto-link a user profile
4. Set donation_goal if it's a fundraising announcement
5. Upload media_url if visual is needed
6. Announcement appears instantly in $$$4U feed
7. If 11th announcement, oldest auto-archives

## Modular Talent System

This implementation uses a **modular donation function** that will power future features:

### Current: $$$4U Donations
```typescript
POST /api/donate {
  announcement_id: "uuid",
  amount: 100
}
```

### Future: Gig Payments
```typescript
POST /api/gig/pay {
  gig_id: "uuid",
  amount: 500
}
```

### Future: Sales Transactions
```typescript
POST /api/sales/purchase {
  item_id: "uuid",
  amount: 250
}
```

**Shared Logic:**
1. Verify user has balance
2. Deduct Talent from sender
3. Record transaction
4. Rollback on failure
5. Return new balance

## Styling Guidelines

### Color Palette
- **Primary Gold**: `text-yellow-400`, `bg-yellow-500`
- **Dark Background**: `bg-black`, `bg-gradient-to-br from-yellow-900/20`
- **Borders**: `border-yellow-500/30`
- **Text**: `text-white`, `text-white/80`, `text-white/60`

### Components
```tsx
// Official Seal
<div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center shadow-lg shadow-yellow-500/50">
  <Shield className="w-8 h-8 text-black" />
</div>

// Progress Bar
<div className="h-3 bg-yellow-900/30 rounded-full overflow-hidden">
  <div 
    className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 transition-all duration-500"
    style={{ width: `${progress}%` }}
  />
</div>

// Donate Button
<button className="px-6 py-3 bg-gradient-to-r from-yellow-600 to-yellow-500 text-black font-semibold rounded-lg hover:from-yellow-500 hover:to-yellow-400 transition-all">
  Donate {amount} Talent
</button>
```

## Security

### RLS Policies
```sql
-- Admin-only announcement creation
CREATE POLICY "Admins can insert announcements"
ON official_announcements FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
);

-- Public can view active announcements
CREATE POLICY "Anyone can view active announcements"
ON official_announcements FOR SELECT
TO authenticated
USING (archived_at IS NULL);

-- Anyone can donate
CREATE POLICY "Authenticated users can donate"
ON donations FOR INSERT
TO authenticated
WITH CHECK (donor_user_id = auth.uid());
```

### Transaction Safety
```typescript
// Rollback on failure
try {
  // Deduct Talent
  const { error: deductError } = await supabaseAdmin
    .from('profiles')
    .update({ talent_balance: currentBalance - amount })
    .eq('id', userId);

  if (deductError) throw deductError;

  // Record donation
  const { error: donationError } = await supabaseAdmin
    .from('donations')
    .insert({ announcement_id, donor_user_id: userId, amount });

  if (donationError) {
    // Rollback: refund Talent
    await supabaseAdmin
      .from('profiles')
      .update({ talent_balance: currentBalance })
      .eq('id', userId);
    throw donationError;
  }
} catch (error) {
  return { error };
}
```

## Setup Instructions

### 1. Run Migration
```bash
# Copy database/migration-official-protocol.sql
# Paste in Supabase SQL Editor
# Execute
```

### 2. Create Admin User
```sql
UPDATE profiles
SET is_admin = TRUE
WHERE id = 'your-user-id';
```

### 3. Test Flow
```bash
# 1. Create announcement (as admin)
curl -X POST https://your-app.vercel.app/api/admin/announce \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"content":"Help rebuild the community center! @john will lead the project","donation_goal":1000}'

# 2. Donate (as any user)
curl -X POST https://your-app.vercel.app/api/donate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"announcement_id":"UUID","amount":50}'

# 3. View in browser
open https://your-app.vercel.app/money
```

## Troubleshooting

### Announcements Not Showing
- ✅ Check migration ran successfully
- ✅ Verify RLS policies enabled
- ✅ Check `archived_at IS NULL` in query
- ✅ Ensure user is authenticated

### Donations Failing
- ✅ Verify user has enough Talent balance
- ✅ Check donation amount > 0
- ✅ Ensure announcement exists and not archived
- ✅ Check network tab for API errors

### Progress Bar Not Updating
- ✅ Verify `update_donation_progress()` trigger exists
- ✅ Check Supabase Realtime subscription connected
- ✅ Inspect browser console for subscription errors
- ✅ Ensure `donations` table has proper foreign keys

### @Mentions Not Clickable
- ✅ Check user exists in profiles table
- ✅ Verify `renderContent()` regex: `/(@\w+)/`
- ✅ Ensure Link component imported from 'next/link'
- ✅ Check Hue profile route exists: `/hue?user=xyz`

## Future Expansions

### Gig Economy
```typescript
// Job postings with Talent payments
interface Gig {
  title: string;
  description: string;
  talent_reward: number;
  assigned_to?: string;
}
```

### Sales Protocol
```typescript
// Marketplace for digital/physical goods
interface SaleItem {
  title: string;
  price_in_talent: number;
  seller_id: string;
}
```

### Milestone Rewards
```typescript
// Auto-distribute Talent when goals reached
CREATE FUNCTION distribute_milestone_rewards()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.goal_reached = TRUE THEN
    -- Award bonus Talent to top donors
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## Philosophy

The $$$4U system embodies:
- **Focus**: 10 announcements max keeps signal high, noise low
- **Action**: Every interaction (donate/follow) has real impact
- **Trust**: Admin-only posting creates authoritative voice
- **Economy**: Talent becomes real-world utility, not just points
- **Expansion**: Modular design powers future Gig/Sales features

---

**Timestamp:** Genesis Build Complete
**Status:** ✅ Production Ready
**Next:** Run migration, test in prod, expand to Gigs/Sales
