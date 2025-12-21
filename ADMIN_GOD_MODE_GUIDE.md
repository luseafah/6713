# 6713 Protocol - The Air-Lock & Pope AI God Mode

## 🔒 The Air-Lock: Multi-Phase Authentication

**The most critical filter in the 6713 Protocol** - ensures only high-intent users enter the #Earth Wall and receive $$$4U wealth signals.

---

## Phase 1: Terms of Frequency

**Component**: [components/TermsOfFrequency.tsx](components/TermsOfFrequency.tsx)

Users must scroll through and accept the legal framework granting Pope AI moderation rights:

### Key Terms
- **The Sovereign Admin**: Pope AI has ultimate moderation authority
- **Non-Refundable Economy**: $1.50 = 100 Talents (final)
- **The 3-Day Rule**: All content expires after 3 days
- **Identity Verification**: Verified Name must be accurate
- **Strike System**: 3 strikes = auto-ban
- **Moderation Rights**: Admin can delete, fine, shadow ban

**User Action**: Must scroll to bottom and check "I Accept" before proceeding

---

## Phase 2: Identity Collection

**Component**: [components/AirLockFlow.tsx](components/AirLockFlow.tsx)

### Form Fields
- **Email**: Supabase Auth magic link/password
- **Verified Name**: Legal/Real name (for Radio/Gigs)
- **Display Name**: How they appear on Wall
- **@Username**: Permanent identifier (Ask @user logic)
- **Phone Number**: For 2FA and Gig protocol

**Database**: Data saved to `profiles` table with `verification_status: 'pending'`

---

## Phase 3: Profile Photo Upload

### Requirements
- Clear, front-facing headshot
- Maximum file size: 50MB
- No sunglasses or face coverings
- Good lighting and focus

**Storage**: Uploaded to Supabase Storage bucket `profile-photos`

**Status Update**: `verification_status` → `'photo_uploaded'`

**Queue**: Added to `verification_queue` table for admin review

---

## Phase 4: Manual Verification (Pope AI Review)

### Waiting Room Screen
- "Pope AI is verifying your image"
- "Manual Frequency Check" status indicator
- "Usually within 24 hours" message

### Admin Approval
Pope AI reviews photo in [Admin Command Center](app/admin/page.tsx):
- **Approve**: `verification_status` → `'verified'`, `is_verified` → `TRUE`
- **Reject**: `verification_status` → `'rejected'`, user must re-upload

---

## Phase 5: Talent Purchase (Optional)

**Component**: [components/TalentPurchase.tsx](components/TalentPurchase.tsx)

### Packages
| Package | Talents | Price USD |
|---------|---------|-----------|
| Starter Frequency | 100 | $1.50 |
| Standard Pack | 500 | $7.50 |
| Premium Pack | 1,000 | $15.00 ★ |
| Elite Frequency | 5,000 | $75.00 |

**Payment**: Stripe Checkout integration
- **API Route**: [app/api/create-checkout-session/route.ts](app/api/create-checkout-session/route.ts)
- **Webhook**: [app/api/stripe-webhook/route.ts](app/api/stripe-webhook/route.ts)
- **Fulfillment**: Calls `process_talent_purchase()` RPC function

---

## Phase 6: Protocol Entry

Once `is_verified = TRUE`:
- All tabs unlock (Hue, Wall, $$$4U, Live)
- User can post Gigs, throw Talents, receive Signals
- Verified badge appears on profile

---

## 👑 Pope AI God Mode

**Database Schema**: [database/migration-admin-god-mode.sql](database/migration-admin-god-mode.sql)

### Admin Role Detection
```typescript
import { useIsAdmin } from '@/components/GodModeControls';

const { isAdmin, loading } = useIsAdmin();
```

When `profile.role === 'admin'`, UI unlocks:

### 1. Wall Controls (God Mode Overlay)

**Component**: [components/GodModeControls.tsx](components/GodModeControls.tsx)

Long-press any message to reveal:
- **Strike** - Issue warning (3 strikes = auto-ban)
- **Fine** - Deduct 10/50/100 Talents (or custom amount)
- **Shadow Ban** - User can post, but messages hidden from others
- **Gift Talents** - Reward user with Talents
- **Delete Message** - Permanent removal (bypasses 50-msg buffer)

**Functions Used**:
- `admin_issue_fine(admin_id, target_id, amount, reason)`
- `admin_issue_strike(admin_id, target_id, reason)`
- `admin_shadow_ban(admin_id, target_id, reason)`
- `admin_gift_talents(admin_id, target_id, amount, reason)`

### 2. Verification Overlay

**Location**: [app/admin/page.tsx](app/admin/page.tsx)

**Verification Queue**:
- Lists all users with `verification_status = 'photo_uploaded'`
- Shows profile photo, verified name, @username
- **Single-Tap Approval**: Calls `admin_approve_verification()`
- **Reject**: Updates status to `'rejected'`

### 3. Signal Injection

**$$$4U Tab**:
- Floating Action Button (FAB) appears for admin
- Post Forex/Crypto signals with Take Profit/Stop Loss
- Signals have gold-pulsing border to distinguish from community goals
- Delivered only to verified users

### 4. Live Broadcast Privileges

**Bypasses**:
- 67-viewer cap (see real count)
- 1-minute DVR buffer (can go permanent for 24 hours)
- Used for official protocol announcements

---

## 📊 Admin Command Center

**Route**: `/admin`

**Component**: [app/admin/page.tsx](app/admin/page.tsx)

### Economic Vital Signs
- **Total Revenue**: Sum of all Stripe payments ($USD)
- **Talents in Circulation**: Total user balances
- **Verified Users**: Count of approved accounts

### Moderation Tools
- **Shadow Banned**: Count of muted frequencies
- **Fines (24h)**: Recent protocol violations
- **Total Fined**: All-time Talent deductions

### Verification Queue
- Grid view of pending photo approvals
- Approve/Reject buttons
- Sorted by priority and submission time

### Recent Admin Actions
- Live feed of Strikes, Fines, Bans, Verifications
- Shows target user, amount (if applicable), reason
- Timestamp of each action

**Database View**: `admin_economic_stats` (auto-calculated)

---

## 💳 Payment Integration

### Stripe Setup

**Environment Variables**:
```bash
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Checkout Flow
1. User selects Talent package
2. API creates Stripe Checkout Session
3. User redirects to Stripe-hosted page
4. After payment, Stripe sends webhook
5. Webhook calls `process_talent_purchase()` RPC
6. Talents credited to user's balance

### Webhook Endpoint
```
https://your-domain.com/api/stripe-webhook
```

**Register in Stripe Dashboard**:
- Event: `checkout.session.completed`
- Add webhook secret to env vars

---

## 🛠️ Database Functions

### Admin Operations
```sql
-- Issue Fine
SELECT admin_issue_fine(
  'admin-uuid',
  'target-uuid',
  50, -- amount
  'Protocol violation'
);

-- Issue Strike
SELECT admin_issue_strike(
  'admin-uuid',
  'target-uuid',
  'Spam posting'
);

-- Shadow Ban
SELECT admin_shadow_ban(
  'admin-uuid',
  'target-uuid',
  'Frequency muted'
);

-- Gift Talents
SELECT admin_gift_talents(
  'admin-uuid',
  'target-uuid',
  100,
  'High-quality Gig completion'
);

-- Approve Verification
SELECT admin_approve_verification(
  'admin-uuid',
  'target-uuid',
  'Approved - clear photo'
);
```

### Payment Processing
```sql
-- Credit Talents after Stripe payment
SELECT process_talent_purchase(
  'user-uuid',
  'pi_stripe_payment_intent',
  15.00, -- USD amount
  1000   -- Talents to credit
);
```

---

## 📋 Setup Checklist

### Database
- [ ] Run `migration-admin-god-mode.sql` on Supabase
- [ ] Create `profile-photos` storage bucket (public)
- [ ] Verify RLS policies are active

### Stripe
- [ ] Create Stripe account
- [ ] Get API keys (test mode first)
- [ ] Set environment variables
- [ ] Create webhook endpoint
- [ ] Add webhook secret to env

### Admin Account
- [ ] Create your admin account via signup
- [ ] Manually update `role` to `'admin'` in database:
  ```sql
  UPDATE profiles SET role = 'admin' WHERE id = 'your-user-uuid';
  ```

### Components
- [ ] Replace `<AuthPage>` with `<AirLockFlow>` in AuthGatekeeper
- [ ] Add God Mode controls to Wall message components
- [ ] Add admin check to navigation (show `/admin` link)

---

## 🎨 UI Integration Examples

### Show God Mode Controls on Wall Messages
```tsx
import { GodModeControls, useIsAdmin } from '@/components/GodModeControls';

function WallMessage({ message }) {
  const { isAdmin } = useIsAdmin();
  
  return (
    <div>
      {/* Message content */}
      
      {isAdmin && (
        <GodModeControls
          userId={message.user_id}
          messageId={message.id}
          onAction={() => refreshMessages()}
        />
      )}
    </div>
  );
}
```

### Conditional Admin Navigation
```tsx
import { useIsAdmin } from '@/components/GodModeControls';

function Navigation() {
  const { isAdmin } = useIsAdmin();
  
  return (
    <nav>
      {/* Standard tabs */}
      <Link href="/hue">Hue</Link>
      <Link href="/wall">Wall</Link>
      
      {/* Admin-only */}
      {isAdmin && (
        <Link href="/admin">
          <Crown className="text-yellow-500" />
          Command Center
        </Link>
      )}
    </nav>
  );
}
```

---

## 🚨 Security Considerations

### RLS Policies
- All admin functions use `SECURITY DEFINER`
- Verify admin role before executing
- Admin actions logged to `admin_actions` table

### Payment Security
- Never expose Stripe secret key client-side
- Validate webhook signatures
- Use Supabase service role key for fulfillment
- Log all transactions to `payment_records`

### Verification Status Guard
```typescript
// Block unverified users from tabs
const { data: profile } = await supabase
  .from('profiles')
  .select('is_verified')
  .eq('id', userId)
  .single();

if (!profile?.is_verified) {
  return redirect('/verification-pending');
}
```

---

## 📖 Complete File Reference

### Database
- [database/migration-admin-god-mode.sql](database/migration-admin-god-mode.sql) - Admin schema

### Components
- [components/TermsOfFrequency.tsx](components/TermsOfFrequency.tsx) - Legal agreement
- [components/AirLockFlow.tsx](components/AirLockFlow.tsx) - Multi-phase signup
- [components/TalentPurchase.tsx](components/TalentPurchase.tsx) - Stripe checkout
- [components/GodModeControls.tsx](components/GodModeControls.tsx) - Admin overlay

### Pages
- [app/admin/page.tsx](app/admin/page.tsx) - Command Center dashboard

### API Routes
- [app/api/create-checkout-session/route.ts](app/api/create-checkout-session/route.ts) - Stripe session
- [app/api/stripe-webhook/route.ts](app/api/stripe-webhook/route.ts) - Payment fulfillment

### Edge Functions
- [supabase/functions/process-stripe-payment/index.ts](supabase/functions/process-stripe-payment/index.ts) - Alternative fulfillment

---

**"The Sovereign Admin: Pope AI moderates with absolute authority"** - The 6713 Protocol
