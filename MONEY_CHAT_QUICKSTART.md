# $$$ CHAT PILL & PRETTY LINK - QUICK REFERENCE

## 🎯 TL;DR

**$$$ Chat Pill**: Floating green button at top of Wall → Opens encrypted 1-on-1 chat with Admin for buying Talents
**Pretty Links**: Verified users share Hue posts to Wall as beautiful clickable cards with artist typography

---

## 🚀 Quick Start

### 1. Deploy Database
```sql
-- In Supabase SQL Editor:
1. Run: /database/migration-money-chat-pill.sql
2. Run: /database/migration-pretty-link-sharing.sql
3. Create storage bucket: 'money-chat-proofs' (public)
```

### 2. Components Created
```
/components/MoneyChatPill.tsx           - User chat interface
/components/AdminMoneyChatPanel.tsx     - Admin management panel
/components/PrettyLink.tsx              - Pretty Link card
/components/ShareToWallButton.tsx       - Share button
```

### 3. Pages Updated
```
/app/wall/page.tsx       - Added $$$ Pill
/app/messages/page.tsx   - Added $$$ Chat tab
/app/admin/page.tsx      - Added Money Chat management
```

---

## 💰 $$$ Chat Pill - User Flow

1. **Access**: 
   - Click green $$$ pill at top of Wall
   - OR open Messages → Switch to "💰 $$$ Chat" tab

2. **Send Payment Proof**:
   - Type message: "I want 500 Talents"
   - Click 📸 to upload payment screenshot
   - OR hold 🎤 to record voice message
   - Send

3. **Admin Response**:
   - Admin reviews in Admin Panel
   - Admin manually tops up balance
   - User sees new balance instantly

---

## 🎨 Pretty Links - User Flow

### Sharing
1. Open Hue (For You) page
2. Find post to share
3. Long-press post
4. Add optional message
5. Post appears on Wall as Pretty Link

### Viewing
1. Pretty Link displays on Wall with:
   - Original aspect ratio
   - Artist's custom typography
   - Preview media (auto-play video on hover)
   - Tap count
2. Tap → Redirects to original artist's page
3. Tap tracked for analytics

---

## 🔐 Admin Quick Actions

### Access
Navigate to: `/admin` → Click "💰 Money Chat" tab

### Set User Balance
```typescript
await supabase.rpc('admin_set_talent_balance', {
  p_admin_user_id: YOUR_ADMIN_ID,
  p_target_user_id: USER_ID,
  p_new_balance: 500,
  p_reason: 'PayPal payment received'
});
```

### Strikethrough Message
```typescript
await supabase.rpc('admin_strikethrough_money_message', {
  p_admin_user_id: YOUR_ADMIN_ID,
  p_message_id: MESSAGE_ID
});
```

### Reply to User
```typescript
await supabase.rpc('send_money_chat_message', {
  p_user_id: USER_ID,
  p_sender_type: 'admin',
  p_message_type: 'text',
  p_content: 'Balance topped up!',
  p_admin_user_id: YOUR_ADMIN_ID
});
```

---

## 📊 Key Features

### $$$ Chat Pill
✅ Floating green pill at top of Wall
✅ Encrypted 1-on-1 with Admin
✅ Text, image, voice support
✅ Real-time messaging
✅ Unread indicators
✅ Payment proof tracking
✅ Appears in Messages tab

### Pretty Links
✅ Verified users only
✅ Maintains aspect ratio
✅ Artist custom typography
✅ One-tap redirect
✅ Tap analytics
✅ Beautiful gallery display
✅ Video auto-play on hover

### Admin Panel
✅ View all pending payment proofs
✅ Manual balance top-ups
✅ Strikethrough non-transactional messages
✅ Reply as "The Banker"
✅ Track active chats
✅ View payment history

---

## 🗄️ Database Tables

| Table | Description |
|-------|-------------|
| `money_chat_messages` | All $$$ chat messages |
| `money_chat_metadata` | Unread counts, last activity |
| `payment_proofs` | User payment proof submissions |
| `shared_posts` | Pretty Link records |
| `artist_typography_styles` | Artist text customization |

---

## 🎨 Artist Typography

Artists can customize their sound name display:

```typescript
await supabase.rpc('set_artist_typography', {
  p_user_id: ARTIST_ID,
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

## 🔍 Useful Queries

### View Pending Payments
```sql
SELECT * FROM admin_payment_queue;
```

### View Active Chats
```sql
SELECT * FROM admin_active_money_chats;
```

### Most Shared Artists
```sql
SELECT * FROM most_shared_artists;
```

### Pretty Links Feed
```sql
SELECT * FROM wall_pretty_links_feed;
```

---

## 🎯 Navigation Flow

### Old Flow
```
Hue → Wall (just messages) → Messages (Pope AI only)
```

### New Flow
```
Hue → Share to Wall (Pretty Link)
     ↓
Wall → $$$ Pill at top → Opens Money Chat
     ↓
Messages → 2 tabs: ⚡ Pope AI | 💰 $$$ Chat
```

---

## 🚨 Troubleshooting

### $$$ Pill Not Showing
- Check `/app/wall/page.tsx` imports `MoneyChatPill`
- Verify database migration ran successfully
- Check browser console for errors

### Can't Upload Payment Proof
- Verify storage bucket `money-chat-proofs` exists
- Check RLS policies on storage bucket
- Ensure bucket is public

### Admin Can't See Chats
- Verify admin role: `SELECT role FROM profiles WHERE id = 'user-id';`
- Check RLS policies on `money_chat_messages`
- Refresh admin panel

### Pretty Links Not Working
- Verify user is verified: `verified_at IS NOT NULL`
- Check `shared_posts` table permissions
- Ensure `share_post_to_wall()` function exists

---

## 📱 Mobile Optimization

Both features are mobile-responsive:
- $$$ Pill scales for mobile screens
- Pretty Links maintain aspect ratio
- Touch-friendly tap targets
- Voice recording works on mobile

---

## 🎉 Success Indicators

You're good to go when:
- [ ] Green $$$ pill visible on Wall
- [ ] Messages page has 2 tabs
- [ ] Admin panel has Money Chat tab
- [ ] Verified users can share posts
- [ ] Pretty Links display on Wall
- [ ] Admin can set balances
- [ ] Real-time messages work

---

## 💡 Pro Tips

1. **Admin Response Time**: Reply fast to keep users engaged
2. **Pretty Link Quality**: High-quality media = more taps
3. **Typography Style**: Unique fonts = artist recognition
4. **Payment Verification**: Always verify externally before topping up
5. **Strikethrough**: Keep $$$ chat professional and transactional

---

## 📚 Full Documentation

See: `/MONEY_CHAT_PILL_GUIDE.md` for detailed implementation guide

---

**Built for 6713 Protocol** • The $$$ is the "Power Button" for the app's economy 💰✨
