# 6713 PROTOCOL - DEFINITIVE STATE

## 🎯 Core Protocol: "First-In, First-Out"

**Attention is the most valuable currency. Speed and sensory feedback define every interaction.**

---

## 1. 67-Comment Ceiling with FIFO Auto-Delete

### Database Implementation
**File**: [database/migration-comment-ceiling.sql](database/migration-comment-ceiling.sql)

**The Rule**: Every post has a maximum of 67 comments. When comment #68 arrives, comment #1 is **permanently deleted** from the database.

**How It Works**:
- Trigger fires AFTER INSERT on `comments`, `wall_replies`, `live_comments`
- Counts current comments for parent post/message/stream
- If count > 67, deletes oldest comment by `created_at ASC`
- Updates parent's `comment_count` column (capped at 67)

**Display Logic**:
```typescript
// UI shows "67" when count >= 67
const displayCount = commentCount > 67 ? '67' : commentCount;
```

**Function**: `enforce_comment_ceiling()`
- Automatically enforces FIFO deletion
- Runs at database level (no client-side logic needed)
- Works across Hue posts, Wall messages, Live streams

**Backfill**: Run `SELECT initialize_comment_counts();` to populate existing counts

---

## 2. No Likes/Comments on Media

### Interaction Constraints
**File**: [lib/interactionProtocol.ts](lib/interactionProtocol.ts)

**The Rule**: Voice notes, pictures, and videos **cannot be liked or commented** using standard buttons. The ONLY interactions are:
- **Reply** (opens thread)
- **Talent Throw** (throws Talents at the post)

**Implementation**:
```typescript
canLike(mediaType): boolean {
  return mediaType === 'text'; // Only text posts can be liked
}

canComment(mediaType): boolean {
  return mediaType === 'text'; // Only text posts get comment button
}
```

**Component**: [components/InteractionStack.tsx](components/InteractionStack.tsx)
- `PostInteraction` component now requires `mediaType` prop
- Conditionally shows Like/Comment buttons based on media type
- Always shows Reply and Talent Throw buttons

**Visual Indicator**:
- Media posts show Reply icon (↩️) instead of Comment icon (💬)
- Talent Throw button always visible with yellow "$" icon

---

## 3. The Air-Lock (Authentication Gate)

### Strict Access Control
**File**: [components/AuthGatekeeper.tsx](components/AuthGatekeeper.tsx)

**The Rule**: **Zero access** to any app feature until user is logged in. No exceptions. No development bypasses.

**Implementation**:
- Wraps entire app in `<AuthGatekeeper>` component
- Checks session on mount via `supabase.auth.getSession()`
- Listens to auth state changes with `onAuthStateChange`
- Shows loading screen with "6713 Initializing Air-Lock..." during check
- Redirects to `<AuthPage>` if no session found

**Console Logs**:
- `🔒 Air-Lock engaged` - No session detected
- `✅ Air-Lock open for: {userId}` - Session verified
- `🚨 Fatal session error - Air-Lock engaged` - Error state

**Timeout Fallback**: If session check hangs, force Air-Lock after 3 seconds

---

## 4. Radio Dial Mute UI

### Physical Hardware Aesthetic
**File**: [components/RadioDial.tsx](components/RadioDial.tsx)

**The Experience**: The Audio Search tab doesn't look like a standard player. It looks like **high-end radio hardware**.

**Visual Components**:
- **LED Display Screen** - Green phosphor text showing verified name
  - Glow-in-the-dark effect when unmuted
  - Scanline overlay for retro CRT aesthetic
  - Verified Name + @username in mono font
  
- **Rotating Dial** - Physical radio knob with rotation animation
  - Outer ring with indicator marks (8 points at 45° intervals)
  - Rotates smoothly when audio is playing
  - Yellow indicator marks pulse in sync with audio
  
- **Mute/Unmute Button** (Center of Dial)
  - Yellow glow when unmuted
  - Gray when muted
  - Click triggers visual "snap" into place
  - Volume2 icon when unmuted, VolumeX when muted

**Controls**:
- **Play/Pause** - Round button below dial
- **Skip** - Jumps to next frequency
- **Progress Bar** - Yellow glow with protocol styling

**Verified Name Reveal**:
- Appears only when audio is unmuted
- Smooth fade-in with scale animation
- Green LED text with drop shadow glow

---

## 5. Sensory Animations & Haptic Feedback

### 13-Heart Burst on Like
**Component**: [components/LikeButton.tsx](components/LikeButton.tsx)

When user likes a post:
1. Trigger `useLikeAnimation()` hook
2. Generate 13 hearts in burst pattern (staying true to 13+ limit)
3. Each heart floats outward in different direction
4. Stagger animation delays (50ms between hearts)
5. Hearts fade out and scale down over 1.5 seconds

**Hook**: `useLikeAnimation()` from [lib/sensoryFeedback.ts](lib/sensoryFeedback.ts)

### Growing Frequency Poll Animation
**Component**: [components/PollBar.tsx](components/PollBar.tsx)

Poll bars don't jump to target percentage - they **slide smoothly**:
1. `usePollAnimation()` hook tracks display percentage
2. `animatePollGrowth()` uses ease-out cubic easing
3. Bar width animates over 800ms
4. Shimmer effect travels across bar during growth
5. Creates "frequency growing" visual effect

### Haptic Feedback Patterns

**Talent Throw**: Triple-tap vibration
```typescript
hapticTalentThrow(); // [10, 30, 50, 30, 10]ms pattern
```

**G$4U Gig Tap**: Single medium pulse
```typescript
hapticGigTap(); // [20]ms
```

**Like/Heart**: Quick double-tap
```typescript
hapticLike(); // [15, 50, 15]ms
```

**Components**:
- [components/TalentThrowButton.tsx](components/TalentThrowButton.tsx) - Talent Throw with haptic
- [components/LikeButton.tsx](components/LikeButton.tsx) - Like with 13-heart burst

---

## 6. Mobile-First Polish & Dynamic Viewport

### CSS Implementation
**File**: [app/globals.css](app/globals.css)

**Dynamic Viewport Height**:
```css
:root {
  --app-height: 100dvh; /* Accounts for mobile browser bars */
}

html, body {
  height: 100dvh;
  overflow: hidden;
}
```

**App Container Structure**:
```css
.app-container {
  height: 100dvh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.tab-content {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch; /* Smooth iOS scrolling */
  overscroll-behavior: contain; /* Prevent scroll chaining */
}
```

**Performance Optimizations**:
- **Virtual Scrolling**: Only renders visible content
- **Content Visibility**: `content-visibility: auto` for off-screen elements
- **Momentum Scrolling**: Native iOS smooth scroll with `-webkit-overflow-scrolling: touch`
- **Scroll Containment**: `overscroll-behavior: contain` prevents parent scroll

**4-Tab Navigation**:
- Fixed navigation at bottom
- Content area flexes to fill remaining space
- Only content scrolls, navigation stays fixed
- No full-page scrolling

---

## 🎨 Visual Identity Summary

| Feature | Protocol Rule | Visual Signal |
|---------|--------------|---------------|
| **Comments** | Max 67; oldest deleted | Counter stays at "67" |
| **Engagement** | Reply Only (No likes/reacts on media) | Reply Button + Talent Throw |
| **G$4U** | Persistent Gig Identifier | Yellow "+" next to name |
| **Wealth** | Admin Signals only | Forex/Crypto Chart Cards |
| **Radio** | Random 30s Audio Discovery | Physical Dial UI with Mute |
| **Likes** | 13+ ceiling | 13-heart burst animation |
| **Polls** | Smooth percentage growth | Growing frequency bar |
| **Talents** | Haptic triple-tap | Yellow pulse on throw |

---

## 📂 Files Created/Modified

### Database
- ✅ [database/migration-comment-ceiling.sql](database/migration-comment-ceiling.sql) - FIFO auto-delete trigger

### Components
- ✅ [components/InteractionStack.tsx](components/InteractionStack.tsx) - Media-aware interactions
- ✅ [components/AuthGatekeeper.tsx](components/AuthGatekeeper.tsx) - Air-Lock enforcement
- ✅ [components/RadioDial.tsx](components/RadioDial.tsx) - Physical radio UI
- ✅ [components/LikeButton.tsx](components/LikeButton.tsx) - 13-heart burst
- ✅ [components/PollBar.tsx](components/PollBar.tsx) - Growing frequency animation
- ✅ [components/TalentThrowButton.tsx](components/TalentThrowButton.tsx) - Haptic feedback

### Libraries
- ✅ [lib/interactionProtocol.ts](lib/interactionProtocol.ts) - Media interaction rules
- ✅ [lib/sensoryFeedback.ts](lib/sensoryFeedback.ts) - Haptic & animation utilities

### Styles
- ✅ [app/globals.css](app/globals.css) - Dynamic viewport, sensory animations

---

## 🚀 Implementation Checklist

### Database
- [ ] Run `migration-comment-ceiling.sql` on Supabase
- [ ] Run `SELECT initialize_comment_counts();` to backfill
- [ ] Verify trigger fires on comment INSERT

### Components
- [ ] Update all post components to pass `mediaType` prop to `PostInteraction`
- [ ] Replace standard like buttons with `<LikeButton>`
- [ ] Replace talent throw buttons with `<TalentThrowButton>`
- [ ] Add `<RadioDial>` to Audio Search tab
- [ ] Replace poll bars with `<PollBar>`

### Testing
- [ ] Post 68th comment → Verify 1st comment deleted
- [ ] Like a text post → See 13 hearts burst
- [ ] Try to like a video → Button not visible
- [ ] Throw talents → Feel haptic vibration
- [ ] Vote on poll → Watch bar grow smoothly
- [ ] Unmute Radio Dial → See verified name reveal
- [ ] Logout → Air-Lock blocks all access

---

## 🎯 Protocol Achievement: Definitive State

The 6713 Protocol is now a **high-speed, sensory environment** where:

✅ **Attention is Currency** - 67-comment FIFO ensures only relevant voices persist  
✅ **Speed Matters** - Haptic feedback provides instant tactile response  
✅ **Interactions are Intentional** - Media posts only allow meaningful engagement (Reply/Throw)  
✅ **Access is Earned** - Air-Lock enforces authentication boundary  
✅ **Visual Identity is Cohesive** - Radio dial, heart bursts, growing polls create unique UX  
✅ **Mobile-First Performance** - Dynamic viewport and virtual scrolling ensure smooth operation  

---

**"First-In, First-Out. Attention is the only currency."** - The 6713 Protocol
