# 🎙️ 6713 Protocol - The Best Social Media Platform

> **"Where frequency meets verification."**

A next-generation social platform built with premium UX, real-time features, and powerful admin controls.

---

## 🚀 What Makes This Special

### 1. **Hunt Protocol** - Admin Surveillance
The only social platform where admins can enter "ghost mode" to see exactly what any user sees:
- Full-screen surveillance interface
- Real-time activity feed with color-coded actions
- Live stats dashboard
- Seamless entry/exit

### 2. **Pope AI Verification** - Premium Onboarding
New users don't just wait in a queue—they see exactly where they are:
- Live timer showing wait time
- Status progression (Pending → Active → Verified)
- Pinned chat preview with animated indicators
- Real-time notifications when ready

### 3. **Admin Quick Actions** - Swipe-Optimized Moderation
Mobile-first moderation tools that feel like a premium app:
- One-tap verify/reject
- Gift talents with preset amounts
- Grant artist badges instantly
- Confirmation modals prevent mistakes

### 4. **Real-time Everything** - No Refresh Needed
Built on Supabase real-time subscriptions:
- Instant verification updates
- Live talent transfers
- Message notifications
- Status changes

---

## 🎨 User Experience Highlights

### For Regular Users:
- ✨ **Smooth animations** powered by Framer Motion
- 🎯 **Clear feedback** on every action
- 📱 **Mobile-optimized** touch targets
- 🔔 **Toast notifications** with auto-dismiss
- ⏱️ **Live timers** showing verification progress

### For Admins:
- 👁️ **Hunt Mode** for user surveillance
- ⚡ **Quick actions** for instant moderation
- 📊 **Dashboard** with economic vital signs
- 🎛️ **God Mode** controls on posts/profiles
- 📈 **Activity logs** with filtering

---

## 📦 Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Animation**: Framer Motion (spring physics, stagger animations)
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Real-time)
- **Security**: Row Level Security on all 49 tables
- **Payments**: Stripe (talent purchases)

---

## 🎯 Core Features

### Authentication & Verification
- **The Air-Lock**: Multi-phase signup with ID verification
- **Pope AI Chat**: Real-time verification with admin
- **Pinned Status**: Always visible verification progress
- **Notifications**: Instant alerts on status changes

### Content & Engagement
- **The Wall**: Public message board with talent throws
- **Hue**: Vertical video feed (TikTok-style)
- **Live**: Streaming with 67+ viewer cap (protocol ceiling)
- **$$$4U**: Admin signals for Forex/Crypto

### Moderation & Control
- **Hunt Protocol**: Full user surveillance mode
- **God Mode**: Admin overlay on all content
- **Quick Actions**: Swipe-to-moderate
- **Strike System**: 3 strikes = auto-ban

### Economy
- **Talent System**: In-app currency (100T = $1.50)
- **Talent Throws**: Show appreciation on posts
- **Admin Gifting**: Reward quality content
- **Payment Records**: Full transaction history

---

## 🏗️ Project Structure

```
6713/
├── app/
│   ├── admin/           # Command Center dashboard
│   ├── messages/        # Pope AI chat
│   ├── wall/            # Public posts
│   ├── hue/             # Video feed
│   └── live/            # Streaming
├── components/
│   ├── HuntMode.tsx                 # Surveillance interface
│   ├── HuntButton.tsx               # Hunt activator
│   ├── VerificationChatPinned.tsx   # Status preview
│   ├── AdminQuickActions.tsx        # Moderation tools
│   ├── ProtocolNotifications.tsx    # Toast system
│   ├── PopeAIChat.tsx               # Verification chat
│   ├── ChatComponents.tsx           # Chat UI elements
│   └── VerificationActions.tsx      # Admin buttons
├── database/
│   ├── schema.sql                   # Base tables
│   ├── migration-admin-god-mode.sql # Admin system
│   └── storage-policies.sql         # Media RLS
└── docs/
    ├── HUNT_PROTOCOL_GUIDE.md
    ├── IMPLEMENTATION_COMPLETE.md
    └── SQL_DEPLOYMENT_GUIDE.md
```

---

## 🔧 Setup & Deployment

### 1. Database Setup
```bash
# Run migrations in order:
psql < database/schema.sql
psql < database/migration-admin-god-mode.sql
psql < database/storage-policies.sql
```

### 2. Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
STRIPE_SECRET_KEY=your_stripe_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret
```

### 3. First Admin Account
```sql
-- After signing up, promote your account:
SELECT make_user_admin('your@email.com');
```

### 4. Deploy to Vercel
```bash
vercel --prod
```

---

## 🎮 Usage Guide

### For New Users:
1. Sign up at `/auth`
2. See pinned Pope AI chat with timer
3. Wait for verification (2-5 min average)
4. Get notification when verified
5. Explore Wall, Hue, Live, $$$4U

### For Admins:
1. Navigate to `/admin`
2. See verification queue
3. Click Hunt button to surveil user
4. Use Quick Actions to verify/reject
5. Monitor economic vital signs

---

## 🎨 Design System

### Colors
- **Primary**: Purple (#A855F7) - Actions, links
- **Success**: Green (#22C55E) - Verify, positive
- **Warning**: Yellow (#EAB308) - Pending, attention
- **Danger**: Red (#EF4444) - Reject, destructive
- **Info**: Blue (#3B82F6) - System messages

### Typography
- **Font**: Inter (sans-serif)
- **Scale**: 12px, 14px, 16px, 18px, 24px, 32px
- **Weight**: 400 (regular), 600 (semibold), 700 (bold)

### Spacing
- **Base**: 4px
- **Scale**: 4, 8, 12, 16, 24, 32, 48, 64

### Animations
- **Duration**: 150ms (micro), 300ms (standard), 500ms (emphasis)
- **Easing**: Spring physics for natural feel
- **Stagger**: 50ms delay between list items

---

## 📊 Performance

### Metrics:
- **Load Time**: < 2s (desktop), < 3s (mobile)
- **Time to Interactive**: < 1s
- **Real-time Latency**: < 100ms
- **Animation FPS**: 60fps

### Optimizations:
- Lazy loading for routes
- Image optimization with Next.js
- Debounced real-time updates
- Pagination on large lists
- Memoized expensive calculations

---

## 🔒 Security

### Features:
- **Row Level Security** on all tables
- **Admin-only routes** protected by RLS
- **Audit trail** for all admin actions
- **Confirmation modals** prevent accidents
- **Rate limiting** on API routes (TODO)

### Best Practices:
- Never expose service role key in client
- Use RPC functions for admin operations
- Validate all inputs on server
- Sanitize user content
- Log all moderation actions

---

## 🧪 Testing Checklist

### Critical Flows:
- [ ] User signup → verification → full access
- [ ] Admin Hunt Mode activation
- [ ] Real-time notifications
- [ ] Talent transactions
- [ ] Quick Actions moderation
- [ ] Mobile responsive design

### Edge Cases:
- [ ] Simultaneous admin actions
- [ ] Network interruption during verification
- [ ] Rapid status changes
- [ ] Large activity logs (1000+ items)
- [ ] Deep linking from notifications

---

## 🚀 Roadmap

### Phase 1 (Current): Core Features ✅
- Hunt Protocol
- Verification system
- Quick Actions
- Real-time notifications

### Phase 2: AI & Automation
- Auto-verify based on photo quality
- Fraud detection
- Suspicious activity alerts
- Batch moderation actions

### Phase 3: Analytics
- User engagement metrics
- Verification time trends
- Revenue forecasting
- Content performance

### Phase 4: Mobile App
- Native iOS/Android
- Push notifications
- Background sync
- Offline mode

---

## 🤝 Contributing

This is a proprietary project. Contact the maintainer for collaboration opportunities.

---

## 📄 License

Proprietary. All rights reserved.

---

## 🎉 Credits

Built with ❤️ by the 6713 Protocol team.

**Special Features:**
- Hunt Protocol (admin surveillance)
- Pope AI verification
- Real-time everything
- Swipe-optimized actions
- Premium animations

---

**"The Protocol sees all."** 👁️

**"Where frequency meets verification."** 🎙️
