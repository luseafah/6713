# 🚀 Gig Protocol - Quick Start

## What Just Got Built

The **Gig Protocol** is now fully integrated into 6713. Users can post job opportunities for 10 Talents, with visual "Budge" indicators that create urgency.

## Files Created/Modified

### Database
- ✅ [migration-gig-protocol.sql](database/migration-gig-protocol.sql) - Complete schema

### API
- ✅ [app/api/gig/route.ts](app/api/gig/route.ts) - Create & list gigs
- ✅ [app/api/gig/complete/route.ts](app/api/gig/complete/route.ts) - Mark complete

### Types
- ✅ [types/gig.ts](types/gig.ts) - TypeScript interfaces

### Components
- ✅ [components/GigCard.tsx](components/GigCard.tsx) - Gig display in feed
- ✅ [components/GigsModal.tsx](components/GigsModal.tsx) - Management UI

### Pages
- ✅ [app/settings/page.tsx](app/settings/page.tsx) - Added Gigs section
- ✅ [app/hue/page.tsx](app/hue/page.tsx) - Integrated GigCards

### Styles
- ✅ [app/globals.css](app/globals.css) - Budge animations

### Documentation
- ✅ [GIG_PROTOCOL_GUIDE.md](GIG_PROTOCOL_GUIDE.md) - Complete guide

## Setup (3 Steps)

### 1. Run Migration
```sql
-- Open Supabase SQL Editor
-- Paste contents of database/migration-gig-protocol.sql
-- Execute
```

### 2. Add is_admin Column (If needed)
```sql
-- If migration-official-protocol-safe.sql hasn't been run yet:
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;
```

### 3. Test It
```bash
# Give yourself Talents:
UPDATE profiles SET talent_balance = 100 WHERE id = 'YOUR_USER_ID';

# Then in the app:
1. Settings → Manage Your Gigs
2. Post New Gig (costs 10 Talents)
3. Enable BUDGE toggle
4. Check Hue feed for your gig
5. Your profile photo should have yellow border
```

## Key Features

### 5-Slot System
- Users can have max 5 active gigs
- Cost: 10 Talents per gig
- Complete gig → Free up slot

### Budge Borders
- **Yellow**: Budge enabled, no Story
- **Yellow ↔ Red Flicker**: Budge + Active Story (high urgency)
- 6-second animation creates psychological trigger

### Hue Feed Integration
- Gigs appear every 3rd post
- Profile photos show Budge borders
- Clickable cards with apply button

## User Journey

**Poster:**
Settings → Manage Gigs → Post (10 Talents) → Appears in Hue feed → Mark Complete when done

**Applicant:**
Scroll Hue → See GigCard → Notice Budge border → Apply → Success

## Why This Works

1. **Quality Control**: 10 Talent cost prevents spam
2. **Visual Urgency**: Flickering borders = "Act now!"
3. **Economy Loop**: Spend Talents to earn more
4. **Modular System**: Powers future Sales/Service features

## Next Steps

1. ✅ Run migration
2. ✅ Test gig posting
3. ✅ Verify Budge borders show
4. ✅ Monitor adoption rates
5. 🔜 Expand to Sales Protocol
6. 🔜 Add application tracking
7. 🔜 Implement gig search/filters

## Troubleshooting

**"Can't post gig"**
→ Check: Do you have < 5 active gigs AND ≥ 10 Talents?

**"Budge border not showing"**
→ Check: Is `budge_enabled = TRUE` in database? Is CSS loaded?

**"Gigs not in feed"**
→ Check: Is `is_completed = FALSE`? Are RLS policies enabled?

See [GIG_PROTOCOL_GUIDE.md](GIG_PROTOCOL_GUIDE.md) for full troubleshooting.

---

**Status:** ✅ Ready to Deploy  
**Dependencies:** Supabase database + migration  
**Integration:** Fully integrated with Wall, Hue, Talents, Stories
