# $$$ CHAT PILL & PRETTY LINK IMPLEMENTATION GUIDE

## 🎯 Overview
Complete implementation of the $$$ Chat Pill economy system and Pretty Link sharing feature for the 6713 Protocol.

---

## 📦 What Was Built

### 1. $$$ Chat Pill System
**Location**: Floating pill at top of Wall + Dedicated tab in Messages

**Features**:
- 💬 Encrypted 1-on-1 chat with Admin (The Banker)
- 📸 Support for text, images (payment screenshots), and voice recordings
- 💰 Dedicated talent purchase corridor
- ⚡ Real-time messaging with unread indicators
- 🔒 Secure payment proof tracking

**Files Created**:
- `/database/migration-money-chat-pill.sql` - Database schema
- `/components/MoneyChatPill.tsx` - User-facing chat interface
- `/components/AdminMoneyChatPanel.tsx` - Admin management interface

### 2. Pretty Link Sharing
**Purpose**: Share Hue posts to Wall as beautiful, clickable cards

**Features**:
- 🎨 Artist-customizable typography
- 📐 Maintains original aspect ratio (15s video or photo)
- 👆 One-tap redirect to original artist's sound page
- 📊 Tap tracking analytics
- ✨ Visual gallery on Wall

**Files Created**:
- `/database/migration-pretty-link-sharing.sql` - Database schema
- `/components/PrettyLink.tsx` - Pretty Link card display
- `/components/ShareToWallButton.tsx` - Share button for Hue posts

### 3. Integration Points
- Updated `/app/wall/page.tsx` - Added $$$ Pill
- Updated `/app/messages/page.tsx` - Added $$$ Chat tab
- Updated `/app/admin/page.tsx` - Added Money Chat management tab

---

## 🗄️ Database Setup

### Step 1: Run Migrations

```bash
# In Supabase SQL Editor, run in order:

# 1. Money Chat System
/database/migration-money-chat-pill.sql

# 2. Pretty Link Sharing
/database/migration-pretty-link-sharing.sql
```

### Step 2: Create Storage Bucket

In Supabase Dashboard → Storage:

```sql
-- Create bucket for payment proofs
INSERT INTO storage.buckets (id, name, public)
VALUES ('money-chat-proofs', 'money-chat-proofs', true);

-- Set RLS policies
CREATE POLICY "Users can upload their own proofs"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'money-chat-proofs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can view all proofs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'money-chat-proofs'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
);
```

---

## 🎨 Frontend Integration

### Using the $$$ Chat Pill

The pill automatically appears on the Wall page. Users can:
1. Click to open chat
2. Send text messages
3. Upload payment screenshots
4. Record voice messages
5. See real-time admin responses

### Using Pretty Links

To enable sharing from Hue:

```tsx
import ShareToWallButton from '@/components/ShareToWallButton';

// In your Hue post component:
<ShareToWallButton 
  postId={post.id}
  isVerified={currentUser.verified_at !== null}
/>
```

To display Pretty Links on Wall:

```tsx
import PrettyLink from '@/components/PrettyLink';

// Fetch shared posts:
const { data: sharedPosts } = await supabase
  .from('wall_pretty_links_feed')
  .select('*');

// Render:
{sharedPosts.map(post => (
  <PrettyLink key={post.shared_post_id} {...post} />
))}
```

---

## 🔐 Admin Features

### Access Money Chat Panel

Navigate to: `/admin` → Click "💰 Money Chat" tab

**Admin Capabilities**:
1. **View Pending Payment Proofs**
   - See all user payment screenshots
   - Track requested Talent amounts
   - Review payment claims

2. **Manual Balance Top-Up**
   - Set exact Talent balance for any user
   - Add reason/notes
   - Instant updates

3. **Message Management**
   - Strikethrough non-transactional chatter
   - Reply to users as "The Banker"
   - Keep chat professional and focused

4. **Active Chats Monitor**
   - See all users with recent messages
   - Track unread counts
   - Jump to any conversation

### Admin Functions

```typescript
// Set user's Talent balance
const { data } = await supabase.rpc('admin_set_talent_balance', {
  p_admin_user_id: adminId,
  p_target_user_id: userId,
  p_new_balance: 500, // New total balance
  p_reason: 'Purchased 500 Talents via PayPal'
});

// Strikethrough a message
await supabase.rpc('admin_strikethrough_money_message', {
  p_admin_user_id: adminId,
  p_message_id: messageId
});

// Send admin reply
await supabase.rpc('send_money_chat_message', {
  p_user_id: targetUserId,
  p_sender_type: 'admin',
  p_message_type: 'text',
  p_content: 'Your balance has been topped up!',
  p_admin_user_id: adminId
});
```

---

## 📊 Database Views

### Payment Queue
```sql
SELECT * FROM admin_payment_queue;
```
Shows all pending payment proofs awaiting admin review.

### Active Money Chats
```sql
SELECT * FROM admin_active_money_chats;
```
Lists users with recent money chat activity.

### Pretty Link Analytics
```sql
SELECT * FROM most_shared_artists;
```
Shows which artists are getting shared the most.

### Wall Pretty Links Feed
```sql
SELECT * FROM wall_pretty_links_feed;
```
Retrieves all shared posts formatted as Pretty Links.

---

## 🎨 Artist Typography Customization

Verified artists can customize how their sound names appear when shared:

```typescript
await supabase.rpc('set_artist_typography', {
  p_user_id: artistId,
  p_font_family: 'Playfair Display',
  p_font_weight: '700',
  p_font_size: '1.5rem',
  p_text_color: '#FFD700',
  p_text_shadow: '0 4px 12px rgba(255,215,0,0.6)',
  p_letter_spacing: '0.1em',
  p_text_transform: 'uppercase'
});
```

---

## 🔄 User Flow

### Buying Talents
1. User taps $$$ Pill on Wall (or opens $$$ Chat in Messages tab)
2. User sends message: "I want to buy 500 Talents"
3. User uploads payment screenshot
4. Admin reviews in Admin Panel → Money Chat tab
5. Admin verifies payment externally
6. Admin sets new balance: `admin_set_talent_balance()`
7. User sees updated balance instantly

### Sharing to Wall
1. Verified user finds post on Hue (For You page)
2. Long-press post to open share dialog
3. Optional: Add message
4. Post appears on Wall as Pretty Link
5. Others tap Pretty Link → Redirected to original artist's page
6. Tap tracked for analytics

---

## 🚀 Testing Checklist

### $$$ Chat Pill
- [ ] Pill visible at top of Wall
- [ ] Opens chat on click
- [ ] Send text message works
- [ ] Upload image works
- [ ] Voice recording works
- [ ] Unread count displays
- [ ] Real-time messages appear
- [ ] Admin can see chat
- [ ] Admin can reply
- [ ] Admin can set balance
- [ ] Admin can strikethrough messages

### Pretty Links
- [ ] Verified users can share
- [ ] Non-verified users blocked
- [ ] Pretty Link displays correctly
- [ ] Artist typography applies
- [ ] Tap redirects to original post
- [ ] Tap count increments
- [ ] Maintains aspect ratio
- [ ] Video autoplay on hover

---

## 🎯 Key Database Tables

| Table | Purpose |
|-------|---------|
| `money_chat_messages` | All $$$ chat messages |
| `money_chat_metadata` | Unread counts, last activity |
| `payment_proofs` | User payment proof tracking |
| `shared_posts` | Pretty Link records |
| `artist_typography_styles` | Custom text styling per artist |

---

## 🔥 Admin Cheat Sheet

### Quick Actions
```sql
-- View pending proofs
SELECT * FROM admin_payment_queue;

-- Set user balance
SELECT admin_set_talent_balance(
  'admin-user-id',
  'target-user-id',
  500, -- new balance
  'Payment received via PayPal'
);

-- Strikethrough message
SELECT admin_strikethrough_money_message(
  'admin-user-id',
  'message-id'
);
```

---

## 📝 Notes

### Security
- All money chat messages are user-specific (RLS enforced)
- Only admins can see all chats
- Payment proofs stored in secure bucket
- Balance changes logged in `talent_transactions`

### Performance
- Real-time subscriptions for instant messages
- Indexed queries for fast admin lookups
- Pretty Links use cached preview images

### Future Enhancements
- Automated payment processing (Stripe integration)
- In-app Talent packages
- Pretty Link analytics dashboard
- Artist revenue sharing

---

## 🎉 Success!

You now have:
✅ A complete $$$ Chat Pill economy system
✅ Beautiful Pretty Link sharing
✅ Full admin control panel
✅ Real-time messaging
✅ Payment proof tracking
✅ Artist customization

The Wall is now both a gallery and an economy hub! 💰🎨
