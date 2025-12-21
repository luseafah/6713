# Pope AI Master Control - Complete Implementation Guide

## 🎯 Overview

This system gives you **the Master Key** to evolve the 6713 Protocol's personality without redeploying code. Dynamic messaging, user state lifecycle, and full admin control are now implemented.

---

## 📂 Files Created

### Database
- **[database/migration-dynamic-messaging.sql](database/migration-dynamic-messaging.sql)** - Complete dynamic messaging system schema

### Components
- **[components/ScriptEditor.tsx](components/ScriptEditor.tsx)** - Admin UI to edit Pope AI messages
- **[components/QuickReplyBar.tsx](components/QuickReplyBar.tsx)** - One-tap admin responses
- **[components/UserStateGuard.tsx](components/UserStateGuard.tsx)** - User lifecycle state management
- **[components/SelfKillButton.tsx](components/SelfKillButton.tsx)** - User self-termination flow
- **[components/PullToRefresh.tsx](components/PullToRefresh.tsx)** - Mobile pull-to-refresh
- **[components/Skeletons.tsx](components/Skeletons.tsx)** - Loading skeletons
- **[components/GlobalSearch.tsx](components/GlobalSearch.tsx)** - Universal search

### Hooks
- **[hooks/useDynamicMessage.ts](hooks/useDynamicMessage.ts)** - Fetch and parse dynamic messages

---

## 🗄️ Database Schema

### Tables Created

#### 1. `system_messages`
Dynamic Pope AI messages editable by admin:
```sql
- id: UUID
- trigger_id: TEXT (unique, e.g., 'on_verification_pending')
- title: TEXT
- content: TEXT
- variables: TEXT[] (placeholders like {{user_name}})
- category: TEXT (air_lock, god_mode, gig, wallet, coma, self_kill)
- is_active: BOOLEAN
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
- updated_by: UUID (admin who last edited)
```

**Seeded Messages** (18 default messages):
- Air-Lock: verification pending/approved/rejected
- Gigs: creation/completion/verification/deletion
- Wallet: purchase/throw/receive talents
- God Mode: strike/fine/shadow ban/gift
- Coma: entry/wake
- Self-Kill: initiate/shrine/complete

#### 2. `quick_replies`
One-tap admin responses for Chat/God Mode:
```sql
- id: UUID
- label: TEXT (button text, e.g., "Strike Warning")
- content: TEXT (message template with variables)
- variables: TEXT[]
- icon: TEXT (Lucide icon name)
- color: TEXT (red, yellow, green, etc.)
- sort_order: INTEGER
- is_active: BOOLEAN
```

**Seeded Quick Replies** (8 templates):
- Strike Warning
- Fine 10T / 50T
- Shadow Ban
- Gift 100T
- Wake from Coma
- Content Warning
- High Quality

#### 3. User State Extensions (profiles table)
```sql
ALTER TABLE profiles ADD:
- user_state: TEXT (new, active, coma, self_killed)
- coma_started_at: TIMESTAMPTZ
- self_kill_date: TIMESTAMPTZ
- shrine_message: TEXT (custom epitaph)
- last_activity_at: TIMESTAMPTZ
```

---

## 🔧 Database Functions

### Message Retrieval
```sql
get_system_message(p_trigger_id TEXT, p_variables JSONB)
-- Fetches message and substitutes variables
-- Returns: { title, content, category }
```

### User State Transitions
```sql
admin_enter_coma(p_user_id UUID, p_reason TEXT)
-- Admin puts user into coma state (view-only)

admin_wake_from_coma(p_user_id UUID)
-- Admin reactivates user from coma

user_self_kill(p_shrine_message TEXT)
-- User initiates 3-day shrine period before deletion
```

### Admin Message Control
```sql
admin_update_system_message(
  p_trigger_id TEXT,
  p_title TEXT,
  p_content TEXT,
  p_variables TEXT[],
  p_category TEXT
)
-- Admin updates any message content
-- Changes take effect immediately
```

---

## 🎨 Components

### 1. Script Editor (Admin Dashboard)
**Location**: `/admin` → Script Editor tab

**Features**:
- Category filter: air_lock, god_mode, gig, wallet, coma, self_kill
- Live message editing with preview
- Variable placeholder testing: `{{user_name}}`, `{{talent_balance}}`
- Activate/deactivate messages
- Real-time preview with variable substitution

**Usage**:
```tsx
import ScriptEditor from '@/components/ScriptEditor';

// In admin dashboard
<ScriptEditor />
```

### 2. Quick Reply Bar
**Location**: Admin Chat interface, God Mode controls

**Features**:
- One-tap responses (Strike, Fine, Gift, etc.)
- Variable input for custom amounts/reasons
- Color-coded buttons (red=danger, green=reward, yellow=warning)
- Haptic feedback on send

**Usage**:
```tsx
import QuickReplyBar from '@/components/QuickReplyBar';

<QuickReplyBar
  onSendReply={(content, label) => {
    // Send message to user
  }}
  targetUserId={userId}
  contextVariables={{ strike_count: 2, talent_balance: 500 }}
/>
```

### 3. User State Guard
**Purpose**: Enforces user lifecycle states throughout app

**States**:
- **new**: Air-Lock (redirect to auth)
- **active**: Full access
- **coma**: View-only (no post/reply/throw)
- **self_killed**: Shrine lock (3-day countdown)

**Usage**:
```tsx
import UserStateGuard from '@/components/UserStateGuard';

<UserStateGuard userState={profile}>
  {children}
</UserStateGuard>
```

**Hooks**:
```tsx
const { canPost, canReply, canThrow } = useUserPermissions(userState);
const canInteract = useCanInteract(userState);
```

### 4. Self-Kill Button
**Location**: User settings

**Flow**:
1. User clicks "Self-Kill Protocol"
2. Confirmation modal with warning
3. User enters shrine message (epitaph)
4. Account enters 3-day shrine period
5. After 3 days → permanent deletion

**Usage**:
```tsx
import SelfKillButton from '@/components/SelfKillButton';

<SelfKillButton userId={currentUserId} />
```

### 5. Pull-to-Refresh
**Location**: Wall, $$$4U Signals, feeds

**Features**:
- Touch gesture detection (mobile-first)
- Visual progress indicator
- Resistance curve (harder to pull as you go)
- Threshold-based trigger (80px default)
- Desktop fallback (refresh button)

**Usage**:
```tsx
import PullToRefresh, { RefreshButton } from '@/components/PullToRefresh';

// Mobile
<PullToRefresh onRefresh={async () => {
  await fetchNewMessages();
}}>
  {children}
</PullToRefresh>

// Desktop
<RefreshButton onRefresh={fetchNewMessages} />
```

### 6. Skeleton Loaders
**Purpose**: Dark-themed loading states

**Components**:
- `MessageSkeleton` - Wall messages
- `MediaCardSkeleton` - Photos/videos
- `GigCardSkeleton` - Gig cards
- `ProfileHeaderSkeleton` - Profile page
- `StoryCircleSkeleton` - Stories
- `FeedSkeleton` - Multiple messages
- `MediaGridSkeleton` - Grid of media

**Usage**:
```tsx
import { FeedSkeleton, MediaCardSkeleton } from '@/components/Skeletons';

{loading ? <FeedSkeleton count={5} /> : <Messages />}
```

### 7. Global Search
**Location**: Top bar (search icon)

**Features**:
- Modal search interface
- 6 tabs: All, Users, Gigs, Pics, Videos, Audio
- Real-time search with 300ms debounce
- Search by @username or Verified Name
- Result preview with images
- Click to navigate

**Usage**:
```tsx
import GlobalSearch from '@/components/GlobalSearch';

<TopBar>
  <GlobalSearch />
</TopBar>
```

---

## 🪝 Hooks

### useDynamicMessage
Fetch and parse system messages with variable substitution:

```tsx
import { useDynamicMessage } from '@/hooks/useDynamicMessage';

const { message, loading, error } = useDynamicMessage(
  'on_talent_throw',
  {
    talent_amount: 50,
    recipient_username: 'alice',
    user_name: 'Bob'
  }
);

// message.title: "Talent Thrown"
// message.content: "You threw 50T to @alice. Your generosity strengthens the frequency."
```

### useQuickReplies
Fetch admin quick reply templates:

```tsx
import { useQuickReplies } from '@/hooks/useDynamicMessage';

const { quickReplies, loading, sendQuickReply } = useQuickReplies();

// Send quick reply
const result = await sendQuickReply(
  replyId,
  targetUserId,
  { reason: 'Spam', strike_count: 3 }
);
```

---

## 🏛️ User State Lifecycle

| User State | Navigation Access | Interaction Ability | Admin Control |
|------------|------------------|---------------------|---------------|
| **new** | Locked in Air-Lock | None | Manual ID/Photo Approval |
| **active** | Full (Hue, Wall, $$$4U) | Full (Post, Gig, Throw) | Fine, Strike, Shadow-ban |
| **coma** | View-Only | No Post/Reply/Throw | 'Wake Up' Trigger |
| **self_killed** | Locked in Shrine | None (3-Day Lock) | Edit Shrine / Observe Timer |

### Coma State
**Triggers**:
- Admin action: `admin_enter_coma(user_id, reason)`
- Auto (optional): Inactivity for X days

**UI**:
- Purple theme
- Eye icon
- "View-Only Mode" message
- "Request Reactivation" button

**Restrictions**:
- Can browse Wall, Search, Hue
- Cannot post, reply, throw Talents, create Gigs
- All interaction buttons disabled

### Self-Kill State (Shrine)
**Flow**:
1. User clicks "Self-Kill Protocol" in settings
2. Warning modal with consequences
3. Enter shrine message (200 char max)
4. Account enters 3-day countdown
5. Profile shows Ghost icon + epitaph
6. After 3 days → permanent deletion

**UI**:
- Gray/zinc theme
- Ghost icon
- Epitaph display
- Countdown timer
- Lock icon

---

## 💬 Variable Placeholders

Available in all system messages:

### User Variables
- `{{user_name}}` - Display name
- `{{verified_name}}` - Real name (KYC)
- `{{username}}` - @handle
- `{{talent_balance}}` - Current Talent balance

### Gig Variables
- `{{gig_title}}` - Gig name
- `{{gig_budget}}` - Budget in Talents
- `{{gig_id}}` - UUID

### Action Variables
- `{{talent_amount}}` - Amount thrown/fined/gifted
- `{{recipient_username}}` - Recipient @handle
- `{{sender_username}}` - Sender @handle
- `{{strike_count}}` - Current strikes (X/3)
- `{{strike_reason}}` - Admin reason
- `{{fine_amount}}` - Fine in Talents
- `{{fine_reason}}` - Admin reason
- `{{gift_amount}}` - Gift in Talents
- `{{gift_reason}}` - Admin reason
- `{{rejection_reason}}` - Verification rejection
- `{{talents_purchased}}` - Purchased amount
- `{{inactive_days}}` - Days inactive (coma)
- `{{shrine_expiry}}` - Deletion date
- `{{shrine_message}}` - User epitaph

---

## 🎛️ Admin Controls

### Update System Message
```typescript
const { data } = await supabase.rpc('admin_update_system_message', {
  p_trigger_id: 'on_verification_pending',
  p_title: 'Verification Under Review',
  p_content: 'Welcome {{user_name}}. Your photo is being verified by Pope AI...',
});
```

### Put User in Coma
```typescript
const { data } = await supabase.rpc('admin_enter_coma', {
  p_user_id: userId,
  p_reason: 'Inactivity for 30 days',
});
```

### Wake User from Coma
```typescript
const { data } = await supabase.rpc('admin_wake_from_coma', {
  p_user_id: userId,
});
```

### Send Quick Reply
```typescript
const reply = quickReplies.find(qr => qr.label === 'Strike Warning');
const result = await sendQuickReply(
  reply.id,
  targetUserId,
  { reason: 'Inappropriate content', strike_count: 2 }
);

// Send via chat or notification system
await sendAdminMessage(targetUserId, result.content);
```

---

## 🚀 Setup Instructions

### 1. Run Database Migration
```bash
psql $DATABASE_URL -f database/migration-dynamic-messaging.sql
```

**Verify**:
```sql
SELECT * FROM system_messages LIMIT 5;
SELECT * FROM quick_replies;
SELECT user_state FROM profiles LIMIT 5;
```

### 2. Add Script Editor to Admin Dashboard
```tsx
// app/admin/page.tsx
import ScriptEditor from '@/components/ScriptEditor';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div>
      <Tabs>
        <Tab value="dashboard">Dashboard</Tab>
        <Tab value="scripts">Script Editor</Tab>
      </Tabs>

      {activeTab === 'scripts' && <ScriptEditor />}
    </div>
  );
}
```

### 3. Add User State Guard to Layout
```tsx
// app/layout.tsx
import UserStateGuard from '@/components/UserStateGuard';

export default async function RootLayout({ children }) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('user_state, coma_started_at, self_kill_date, shrine_message')
    .eq('id', userId)
    .single();

  return (
    <UserStateGuard userState={profile}>
      {children}
    </UserStateGuard>
  );
}
```

### 4. Add Pull-to-Refresh to Wall
```tsx
// app/wall/page.tsx
import PullToRefresh from '@/components/PullToRefresh';

export default function WallPage() {
  const refreshMessages = async () => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    setMessages(data);
  };

  return (
    <PullToRefresh onRefresh={refreshMessages}>
      <WallFeed messages={messages} />
    </PullToRefresh>
  );
}
```

### 5. Add Global Search to TopBar
```tsx
// components/TopBar.tsx
import GlobalSearch from '@/components/GlobalSearch';

export default function TopBar() {
  return (
    <div className="flex items-center justify-between p-4">
      <Logo />
      <GlobalSearch />
      <UserMenu />
    </div>
  );
}
```

### 6. Replace Hard-Coded Messages
**Before**:
```tsx
<div>Your verification is pending. Please wait...</div>
```

**After**:
```tsx
const { message } = useDynamicMessage('on_verification_pending', {
  user_name: profile.display_name,
});

<div>{message?.content}</div>
```

---

## 🎯 Usage Examples

### 1. Air-Lock Verification Message
```tsx
import { useDynamicMessage } from '@/hooks/useDynamicMessage';

function VerificationPending({ userName }) {
  const { message, loading } = useDynamicMessage('on_verification_pending', {
    user_name: userName,
  });

  if (loading) return <Skeleton />;

  return (
    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
      <h3 className="font-bold text-white">{message?.title}</h3>
      <p className="text-blue-300 text-sm mt-2">{message?.content}</p>
    </div>
  );
}
```

### 2. God Mode Fine Action
```tsx
import { useQuickReplies } from '@/hooks/useDynamicMessage';

function AdminControls({ targetUserId, targetUsername }) {
  const { quickReplies, sendQuickReply } = useQuickReplies();

  const handleFine = async (amount: number) => {
    // Issue fine in database
    await supabase.rpc('admin_issue_fine', {
      p_user_id: targetUserId,
      p_amount: amount,
      p_reason: 'Content violation',
    });

    // Send notification
    const reply = quickReplies.find(qr => qr.label === 'Fine 50T');
    const result = await sendQuickReply(reply.id, targetUserId, {
      reason: 'Content violation',
    });

    await sendNotification(targetUserId, result.content);
  };

  return (
    <button onClick={() => handleFine(50)}>
      Fine 50T
    </button>
  );
}
```

### 3. Gig Completion with Dynamic Message
```tsx
function GigComplete({ gigTitle }) {
  const { message } = useDynamicMessage('on_gig_completion', {
    gig_title: gigTitle,
  });

  return (
    <PopeGigClose
      gigId={gigId}
      instructionMessage={message?.content}
    />
  );
}
```

---

## 🔒 Security

### RLS Policies
- **system_messages**: Anyone can read, only admins can modify
- **quick_replies**: Admin-only (read and write)
- **User state transitions**: Admin functions check `role='admin'`

### SECURITY DEFINER Functions
All admin functions use `SECURITY DEFINER` with explicit role checks:
```sql
IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') THEN
  RAISE EXCEPTION 'Unauthorized: Admin role required';
END IF;
```

---

## 📊 Testing Checklist

- [ ] Run database migration successfully
- [ ] See 18 seeded messages in `system_messages` table
- [ ] See 8 quick replies in `quick_replies` table
- [ ] Access Script Editor in admin dashboard
- [ ] Edit a message and see live preview
- [ ] Save changes and verify updated_at timestamp
- [ ] Use `useDynamicMessage()` hook in component
- [ ] Verify variable substitution works
- [ ] Put test user in coma state
- [ ] See coma UI with view-only restrictions
- [ ] Wake user from coma
- [ ] Test self-kill flow with shrine message
- [ ] See 3-day countdown on shrine page
- [ ] Add pull-to-refresh to Wall
- [ ] Pull down on mobile and see refresh indicator
- [ ] Release to trigger refresh
- [ ] See skeleton loaders while content loads
- [ ] Open global search modal
- [ ] Search for @username
- [ ] Search for verified name
- [ ] Filter by Users/Gigs/Pics/Videos/Audio
- [ ] Click result and navigate correctly

---

## 🎉 What You've Gained

### The Master Key 🗝️
You can now:
- **Edit Pope AI's voice** without redeploying code
- **Create new automated messages** for any trigger
- **Update legal terms** dynamically
- **Change fine amounts** in Quick Replies
- **Customize welcome messages** per user type
- **Evolve the protocol** as you learn what resonates

### User Lifecycle Control 🔄
- **Coma state** for inactive or problem users (view-only)
- **Wake-up trigger** to reactivate
- **Self-kill protocol** with 3-day shrine period
- **State-based UI** that adapts to user status

### Admin Efficiency ⚡
- **One-tap responses** for common moderation actions
- **Variable-powered messages** that feel personal
- **Quick Reply bar** in chat and God Mode
- **Live message editing** with instant preview

### User Experience Polish ✨
- **Pull-to-refresh** on mobile (native feel)
- **Skeleton loaders** (no blank screens)
- **Global search** across all content types
- **Smooth animations** and transitions

---

## 📖 Full Documentation

See also:
- [ADMIN_GOD_MODE_GUIDE.md](ADMIN_GOD_MODE_GUIDE.md) - God Mode & Air-Lock
- [SEARCH_PROTOCOL_GUIDE.md](SEARCH_PROTOCOL_GUIDE.md) - Search & Audio Radio
- [GIG_PROTOCOL_GUIDE.md](GIG_PROTOCOL_GUIDE.md) - Gig system

---

**"Your name is your bond. Your words are your protocol."** - The 6713 Protocol
