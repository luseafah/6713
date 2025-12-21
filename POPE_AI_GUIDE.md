# Pope AI Announcer System

## Overview
Pope AI is the divine oracle of #Earth, handling system announcements, moderation, and user interventions with gold/white ethereal aesthetics.

---

## 🛐 System Identity

### Visual Design
Pope AI messages are **centered, gold/white themed, and un-repliable**:

```tsx
// Gold gradient background
bg-gradient-to-r from-yellow-500/20 via-white/10 to-yellow-500/20

// Gold border with glow
border-2 border-yellow-500/50 shadow-lg shadow-yellow-500/20

// Centered text
text-center text-white font-medium

// Header
⚡ POPE AI ORACLE ⚡
```

### Database Setup
```sql
-- Reserved UUID for Pope AI
POPE_AI_USER_ID = '00000000-0000-0000-0000-000000000001'

-- Messages are marked as:
is_pope_ai = TRUE
message_type = 'system'
is_permanent = TRUE  -- For important announcements
```

---

## 📢 Announcement Types

### 1. Account Self-Kill Broadcast
When a user deletes their account:

```typescript
announceAccountSelfKill(displayName)
// Posts: "🛑 USER [DISPLAY_NAME] HAS SELF-KILLED THEIR ACCOUNT. REVELATION ENDED."
```

**Trigger:** POST to `/api/self-kill`  
**Permanent:** Yes  
**Implementation:** [app/api/self-kill/route.ts](../app/api/self-kill/route.ts)

### 2. COMA Entry/Exit
```typescript
announceComaEntry(displayName, reason)
// "💤 USER HAS ENTERED VOLUNTARY COMA. FREQUENCY PAUSED."
// "⚡ USER HAS BEEN PLACED IN COMA BY QUEST. PROTOCOL ENFORCED."

announceComaExit(displayName)
// "✨ USER HAS RETURNED FROM COMA. FREQUENCY RESTORED."
```

### 3. CPR Rescue
```typescript
announceCPRRescue(ghostName, rescuerName)
// "💫 RESCUER HAS PERFORMED CPR ON GHOST. LIFE RESTORED."
```

**Permanent:** Yes (miracles are eternal)

---

## 🔮 Transient Interventions

These messages appear **only to the specific user** for 3-4 seconds:

### "Ask @User" Trigger
When user tries to reply to expired message (out of 50-message buffer):

```typescript
getExpiredReplyMessage(username)
// "📡 THE ORIGINAL FREQUENCY HAS FADED. YOU MUST ASK @username DIRECTLY."
```

**Implementation:**
```tsx
<button
  onClick={() => {
    if (!isMessageInBuffer(message.id)) {
      setTransientMessage(getExpiredReplyMessage(message.username));
      setTimeout(() => setTransientMessage(''), 4000);
    } else {
      setReplyingTo(message);
    }
  }}
>
  Reply
</button>
```

### Slowmode Enforcement
When user tries to bypass 7-second slowmode:

```typescript
getSlowmodeWarning()
// "⏱️ PATIENCE IS A TALENT. WAIT FOR THE FREQUENCY TO RESET."
```

**UI Effect:**
- Input field turns red: `border-red-500/50 bg-red-900/10`
- Placeholder changes: "⏱️ Input muted..."
- Field disabled for 3 seconds
- Transient message appears

```tsx
if (slowmodeCooldown > 0) {
  setInputMuted(true);
  setTransientMessage(getSlowmodeWarning());
  setTimeout(() => {
    setInputMuted(false);
    setTransientMessage('');
  }, 3000);
  return;
}
```

---

## ⚡ Talent Economy Integration

### Slowmode Bypass (5 Talent)
Users can skip the 7-second slowmode for 5 Talent:

```tsx
<button onClick={handleSkipSlowmode}>
  <Zap size={12} />
  Skip for 5 Talent
</button>
```

**Logic:**
1. Check: `talentBalance >= 5`
2. Deduct Talent from database
3. Reset `slowmodeCooldown` to 0
4. Show confirmation: "⚡ SLOWMODE BYPASSED. FREQUENCY ACCELERATED."

**Database Update:**
```typescript
await supabase
  .from('users')
  .update({ talent_balance: talentBalance - 5 })
  .eq('id', currentUserId);
```

---

## 🎨 UI Components

### Transient Message Display
```tsx
{transientMessage && (
  <div className="flex justify-center mb-4 animate-fade-in">
    <div className="bg-gradient-to-r from-yellow-500/20 via-white/10 to-yellow-500/20 
                    border border-yellow-500/30 rounded-lg px-6 py-3 max-w-lg">
      <p className="text-center text-yellow-200 text-sm font-semibold">
        ⚡ POPE AI ⚡
      </p>
      <p className="text-center text-white text-sm mt-1">
        {transientMessage}
      </p>
    </div>
  </div>
)}
```

### Permanent Announcement
```tsx
{isPopeAI && (
  <div className="flex justify-center my-6">
    <div className="bg-gradient-to-r from-yellow-500/20 via-white/10 to-yellow-500/20 
                    border-2 border-yellow-500/50 rounded-xl px-8 py-4 max-w-2xl 
                    shadow-lg shadow-yellow-500/20">
      <div className="flex items-center justify-center gap-2 mb-2">
        <span className="text-yellow-400 text-xs font-bold tracking-wider">
          ⚡ POPE AI ORACLE ⚡
        </span>
        <span className="text-white/40 text-xs">
          {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
        </span>
      </div>
      <p className="text-center text-white font-medium text-base leading-relaxed">
        {message.content}
      </p>
      {message.is_permanent && (
        <span className="text-yellow-400/60 text-xs">
          ∞ PERMANENT RECORD
        </span>
      )}
    </div>
  </div>
)}
```

---

## 📁 File Structure

```
lib/
  popeAI.ts                    # Pope AI utility functions

app/api/
  self-kill/route.ts          # Updated with Pope AI announcement
  coma/enter/route.ts         # Add announceComaEntry()
  coma/exit/route.ts          # Add announceComaExit()
  cpr/route.ts                # Add announceCPRRescue()

components/
  WallChat.tsx                # Updated with Pope AI UI + transient messages
```

---

## 🧪 Testing

### Test Self-Kill Announcement
1. Navigate to Settings
2. Click "Self-Kill Account"
3. Confirm deletion
4. Check Wall (#Earth) for Pope AI message:
   ```
   🛑 USER YOURNAME HAS SELF-KILLED THEIR ACCOUNT. REVELATION ENDED.
   ```

### Test "Ask @User" Trigger
1. Send 51 messages to purge message #1
2. Try to reply to message #1
3. Verify transient Pope AI message appears:
   ```
   📡 THE ORIGINAL FREQUENCY HAS FADED. YOU MUST ASK @username DIRECTLY.
   ```

### Test Slowmode Enforcement
1. Send a message
2. Immediately try to send another
3. Verify:
   - Input field turns red
   - Placeholder shows "⏱️ Input muted..."
   - Transient message: "⏱️ PATIENCE IS A TALENT..."

### Test Slowmode Bypass
1. Have at least 5 Talent
2. Send a message (triggers 7s slowmode)
3. Click "Skip for 5 Talent" button
4. Verify:
   - Talent deducted (balance shows -5)
   - Slowmode countdown resets to 0
   - Confirmation message appears

---

## 🚀 Production Checklist

- [x] Pope AI utility functions created
- [x] Self-kill announcement integrated
- [x] Transient message system implemented
- [x] Slowmode bypass with Talent cost
- [x] Gold/white UI styling for Pope AI
- [x] Un-repliable Pope AI messages
- [x] "Ask @User" expired reply detection
- [x] Input field muting on slowmode violation
- [ ] COMA entry/exit announcements (TODO)
- [ ] CPR rescue announcements (TODO)
- [ ] Welcome messages for new users (TODO)

---

## 🎯 Key Benefits

1. **Moderation Automation** - Pope AI handles announcements automatically
2. **User Guidance** - Transient messages educate without cluttering chat
3. **Talent Economy** - Slowmode bypass creates immediate Talent value
4. **Visual Hierarchy** - Gold/white theme distinguishes system messages
5. **UX Polish** - Interventions feel intentional, not like errors

---

**Status:** ✅ **CORE FEATURES COMPLETE**  
**Pope AI is live and moderating #Earth!** 🛐
