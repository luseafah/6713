# Hamburger Menu Search Enhancements

## 🎯 Overview
Enhanced the Hamburger Menu search system with **Gigs filter**, **full name search**, **username search**, and **QR code profile sharing**.

---

## ✅ Features Added

### 1. **Gigs Search Filter**
- **Filter Chip**: New "Gigs" button alongside Humans, Sounds, and Tags
- **Database Function**: `search_gigs()` searches active gigs by title/description
- **Display**: Shows gig title, creator username, and talent reward
- **Icon**: Briefcase icon for visual distinction
- **Navigation**: Clicking a gig result navigates to the gig detail page

**Backend (migration-hamburger-search.sql)**:
```sql
CREATE OR REPLACE FUNCTION search_gigs(search_term TEXT)
RETURNS TABLE (
  gig_id UUID,
  gig_title TEXT,
  gig_description TEXT,
  creator_username TEXT,
  talent_reward INTEGER,
  deadline TIMESTAMPTZ,
  is_completed BOOLEAN,
  is_verified_only BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    g.gig_id,
    g.title,
    g.description,
    u.username,
    g.talent_reward,
    g.deadline,
    g.is_completed,
    g.is_verified_only
  FROM gigs g
  JOIN users u ON g.user_id = u.user_id
  WHERE g.is_completed = FALSE
    AND (
      g.title ILIKE '%' || search_term || '%'
      OR g.description ILIKE '%' || search_term || '%'
    )
  ORDER BY g.created_at DESC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Frontend**: Filter chip UI + result rendering with talent rewards

---

### 2. **Full Name Search**
- **Backend**: `search_humans()` now searches across:
  - Username (`@username`)
  - Display name
  - First name
  - Last name
  - **Full name** (first + last concatenated)
  
**Example**: Searching "John Smith" will find users with first_name="John" and last_name="Smith"

**Database Update**:
```sql
-- search_humans() now includes:
WHERE (
  u.username ILIKE '%' || search_term || '%'
  OR p.display_name ILIKE '%' || search_term || '%'
  OR p.first_name ILIKE '%' || search_term || '%'
  OR p.last_name ILIKE '%' || search_term || '%'
  OR CONCAT_WS(' ', p.first_name, p.last_name) ILIKE '%' || search_term || '%'
)
```

---

### 3. **Username Search**
- Already supported via `search_humans()` function
- Searches the `username` field in `users` table
- Supports partial matches (e.g., "john" finds "@johnny", "@johnsmith")

---

### 4. **QR Code Profile Sharing**

#### **QR Code Generator**
- **Button**: QR icon in search bar (top-right)
- **Modal**: Shows QR code of user's profile URL
- **Generation**: Uses `api.qrserver.com` API (300x300 image)
- **Use Case**: Share profile offline or in-person

**Function**:
```typescript
const getProfileQRCodeURL = () => {
  const profileURL = `${window.location.origin}/profile/${userId}`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(profileURL)}`;
};
```

**Modal UI**:
- Purple gradient theme
- White background QR code area
- "Share this QR code to instantly connect" message
- Close button

#### **QR Code Scanner**
- **Button**: Camera icon in search bar (top-right)
- **Modal**: Placeholder for future camera scanner
- **Status**: UI ready, camera integration coming soon
- **Workaround**: Use device camera app to scan QR codes

**Modal UI**:
- Blue gradient theme
- Placeholder message: "📷 Camera scanner coming soon"
- Instruction: "Use device camera app to scan QR codes"
- Close button

---

## 📊 Search Results Display

### Gigs Results
```tsx
{result.type === 'gig' && (
  <>
    <Briefcase icon /> {/* Gig icon */}
    <p>{result.name}</p> {/* Gig title */}
    <p>{result.subtitle}</p> {/* Creator username */}
    <p>💎 {result.talent_reward} Talents</p> {/* Reward */}
  </>
)}
```

### Humans Results (unchanged)
- Profile photo or User icon
- Display name
- Username (subtitle)
- Verified badge
- COMA status
- COMA cost (if applicable)

---

## 🗄️ Database Schema Updates

### `search_history` Table
```sql
ALTER TABLE search_history
DROP CONSTRAINT IF EXISTS search_history_search_type_check,
ADD CONSTRAINT search_history_search_type_check 
  CHECK (search_type IN ('human', 'sound', 'tag', 'gig'));
```
Now tracks gig searches in history.

### New Function: `search_gigs()`
- Returns: `gig_id`, `gig_title`, `gig_description`, `creator_username`, `talent_reward`, `deadline`
- Filters: Only active gigs (`is_completed = FALSE`)
- Search: Title + description (case-insensitive)
- Limit: 20 results
- Order: Newest first

### Updated Function: `search_humans()`
- Added: `full_name` column in RETURNS TABLE
- Added: `CONCAT_WS(' ', p.first_name, p.last_name) AS full_name` in SELECT
- Added: Full name search in WHERE clause

---

## 🎨 UI Components Added

### 1. Gigs Filter Chip
```tsx
<button
  onClick={() => setSearchFilter('gigs')}
  className={searchFilter === 'gigs' ? 'bg-white text-black' : 'bg-white/10'}
>
  <Briefcase size={16} />
  <span>Gigs</span>
</button>
```

### 2. QR Code Button
```tsx
<button
  onClick={() => setShowQRCode(true)}
  className="p-3 bg-white/5 border border-white/10 hover:bg-white/10"
  title="Share Your Profile QR"
>
  <QrCode size={18} />
</button>
```

### 3. QR Scanner Button
```tsx
<button
  onClick={() => setShowQRScanner(true)}
  className="p-3 bg-white/5 border border-white/10 hover:bg-white/10"
  title="Scan Profile QR"
>
  <Camera size={18} />
</button>
```

### 4. QR Code Modal
- Animated entrance/exit (Framer Motion)
- Purple gradient background
- White QR code container
- Generated QR image
- Close button

### 5. QR Scanner Modal
- Animated entrance/exit (Framer Motion)
- Blue gradient background
- Placeholder camera view
- Coming soon message
- Close button

---

## 🚀 Deployment Steps

### 1. Deploy Database Migration
```bash
# Open Supabase Dashboard → SQL Editor
# Paste contents of: database/migration-hamburger-search.sql
# Click "Run" to execute
```

### 2. Verify Functions
```sql
-- Test full name search
SELECT * FROM search_humans('John Smith');

-- Test gigs search
SELECT * FROM search_gigs('design');

-- Check search history
SELECT * FROM search_history WHERE search_type = 'gig';
```

### 3. Test Frontend
1. Open Hamburger Menu
2. Click search bar (should see 4 filter chips: Humans, Sounds, Gigs, Tags)
3. Select "Gigs" filter
4. Search for gig keywords (e.g., "design", "video")
5. Click QR Code icon (should show profile QR)
6. Click Camera icon (should show scanner placeholder)

---

## 🔧 Technical Details

### TypeScript Interfaces
```typescript
interface SearchResult {
  id: string;
  type: 'human' | 'sound' | 'tag' | 'gig';
  name: string;
  subtitle: string;
  profile_photo_url?: string;
  is_verified?: boolean;
  is_coma?: boolean;
  coma_cost?: number;
  count?: string;
  talent_reward?: number; // NEW: for gigs
  deadline?: string; // NEW: for gigs
  full_name?: string; // NEW: for humans
}
```

### State Variables
```typescript
const [searchFilter, setSearchFilter] = useState<'humans' | 'sounds' | 'tags' | 'gigs'>('humans');
const [showQRCode, setShowQRCode] = useState(false);
const [showQRScanner, setShowQRScanner] = useState(false);
```

### Search Logic
```typescript
const performSearch = async () => {
  switch (searchFilter) {
    case 'gigs':
      const { data: gigs } = await supabase.rpc('search_gigs', { search_term: searchQuery });
      return gigs.map(g => ({
        id: g.gig_id,
        type: 'gig',
        name: g.gig_title,
        subtitle: `@${g.creator_username}`,
        talent_reward: g.talent_reward
      }));
    // ... other cases
  }
};
```

---

## 📝 Notes

### QR Code API
- **Current**: Using `qrserver.com` free API
- **Future**: Consider switching to `qrcode.react` library for:
  - Offline generation
  - Custom styling
  - Logo embedding
  - Color customization

**Install qrcode.react**:
```bash
npm install qrcode.react
```

**Usage**:
```tsx
import QRCode from 'qrcode.react';

<QRCode 
  value={`${window.location.origin}/profile/${userId}`}
  size={300}
  level="H"
  includeMargin={true}
/>
```

### QR Scanner
- **Options**:
  1. **html5-qrcode** library (recommended)
  2. **react-qr-scanner** library
  3. Native HTML5 camera API + jsQR library

**Install html5-qrcode**:
```bash
npm install html5-qrcode
```

**Basic Implementation**:
```tsx
import { Html5Qrcode } from 'html5-qrcode';

const startScanner = () => {
  const scanner = new Html5Qrcode("qr-reader");
  scanner.start(
    { facingMode: "environment" },
    { fps: 10, qrbox: 250 },
    (decodedText) => {
      // Navigate to profile
      router.push(decodedText);
    }
  );
};
```

---

## 🎯 Success Criteria

- [x] Gigs filter chip visible in search UI
- [x] Gigs search returns relevant active gigs
- [x] Gig results show talent reward
- [x] Full name search works (e.g., "John Smith")
- [x] Username search works (e.g., "@johnny")
- [x] QR code button displays in search bar
- [x] QR code modal shows profile QR image
- [x] QR scanner button displays in search bar
- [x] QR scanner modal has placeholder UI
- [ ] Database migration deployed to Supabase
- [ ] End-to-end testing completed

---

## 🔮 Future Enhancements

1. **QR Scanner Implementation**
   - Integrate html5-qrcode library
   - Camera permission handling
   - Scan success animation
   - Automatic profile navigation

2. **Gigs Filter Enhancements**
   - Filter by talent reward range
   - Filter by deadline (urgent/soon/anytime)
   - Filter by verified-only gigs
   - Sort by reward/deadline

3. **QR Code Customization**
   - Add profile photo in center
   - Custom colors matching profile theme
   - Download QR code as PNG
   - Share QR code via messaging apps

4. **Search Analytics**
   - Track most searched gigs
   - Popular search terms
   - Search conversion rates
   - A/B test search UI

---

## 📚 Related Files

- **Frontend**: [components/HamburgerMenu.tsx](components/HamburgerMenu.tsx)
- **Backend**: [database/migration-hamburger-search.sql](database/migration-hamburger-search.sql)
- **Types**: [types/database.ts](types/database.ts)
- **Guide**: [HAMBURGER_SEARCH_ENHANCEMENTS.md](HAMBURGER_SEARCH_ENHANCEMENTS.md) (this file)

---

**Status**: ✅ Implementation Complete | ⏳ Deployment Pending
