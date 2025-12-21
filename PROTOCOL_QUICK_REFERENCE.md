# 6713 Protocol - Core Implementation Quick Reference

## 🚨 FIFO Comment Ceiling (67 Comments Max)

### Database Setup
```bash
psql $DATABASE_URL -f database/migration-comment-ceiling.sql
```

### Usage
```sql
-- Automatically enforced via triggers
-- When comment #68 is posted, comment #1 is deleted

-- Get display count (capped at 67)
SELECT get_comment_count_display('post-uuid', 'post');

-- Backfill existing counts
SELECT initialize_comment_counts();
```

### UI Display
```typescript
const displayCount = commentCount > 67 ? '67' : commentCount;
```

---

## 🚫 No Likes/Comments on Media

### Check Interactions
```typescript
import { canLike, canComment } from '@/lib/interactionProtocol';

const showLike = canLike(mediaType); // false for voice/image/video
const showComment = canComment(mediaType); // false for voice/image/video
```

### PostInteraction Component
```tsx
<PostInteraction
  mediaType="video" // Required: 'voice' | 'image' | 'video' | 'text'
  onReply={() => {}} // NEW: For media posts
  onTalentThrow={() => {}} // NEW: Always available
  // ... other props
/>
```

---

## 🔒 Air-Lock (Authentication Gate)

### Already Applied
- Wraps entire app in `layout.tsx`
- No action needed - enforced automatically
- Shows `AuthPage` if no session

### Testing
```bash
# Logout to test Air-Lock
# Visit any route → Should redirect to login
```

---

## 📻 Radio Dial UI

### Integration
```tsx
import RadioDial from '@/components/RadioDial';

<RadioDial
  isPlaying={true}
  isMuted={false}
  verifiedName="John Smith"
  username="jsmith"
  progress={45} // 0-100
  onToggleMute={() => {}}
  onTogglePlay={() => {}}
  onSkip={() => {}}
/>
```

---

## 💓 13-Heart Burst Animation

### Like Button with Animation
```tsx
import LikeButton from '@/components/LikeButton';

<LikeButton
  isLiked={false}
  likeCount={8}
  displayCount="8" // or "13+" when > 13
  onLike={() => {}}
/>
```

---

## 📊 Growing Frequency Poll

### Poll Bar Component
```tsx
import { PollContainer } from '@/components/PollBar';

<PollContainer
  question="Which feature first?"
  options={[
    { id: '1', text: 'Voice Notes', votes: 45 },
    { id: '2', text: 'Live Streams', votes: 32 },
  ]}
  totalVotes={77}
  userVote="1"
  onVote={(optionId) => {}}
/>
```

---

## 💰 Talent Throw with Haptic

### Talent Throw Button
```tsx
import TalentThrowButton from '@/components/TalentThrowButton';

<TalentThrowButton
  onThrow={() => {
    // Handle talent throw logic
  }}
  disabled={false}
/>
```

### Manual Haptic Trigger
```typescript
import { hapticTalentThrow, hapticGigTap, hapticLike } from '@/lib/sensoryFeedback';

hapticTalentThrow(); // Triple-tap vibration
hapticGigTap(); // Single pulse
hapticLike(); // Double-tap
```

---

## 📱 Mobile-First Viewport

### App Container Structure
```tsx
<div className="app-container">
  {/* Fixed Navigation */}
  <Navigation />
  
  {/* Scrollable Content */}
  <div className="tab-content">
    {children}
  </div>
</div>
```

### CSS Classes Available
- `.app-container` - 100dvh container
- `.tab-content` - Scrollable content area
- `.seamless-scroll` - Smooth scrolling
- `.virtual-scroll` - Performance optimization

---

## 🎨 Animation Classes

### Sensory Animations
```css
.animate-float-up       /* 13-heart burst */
.animate-shimmer        /* Poll shimmer effect */
.animate-haptic         /* Haptic pulse ring */
```

### Protocol Animations (Existing)
```css
.glaze-animate         /* Glaze shimmer */
.crown-pulse           /* Admin crown pulse */
.flicker-border        /* Gig yellow-red flicker */
.live-border           /* Live stream red pulse */
.animate-coin-burst    /* Talent throw burst */
```

---

## 🧪 Testing Commands

### Database
```bash
# Run comment ceiling migration
psql $DATABASE_URL -f database/migration-comment-ceiling.sql

# Test FIFO deletion
psql $DATABASE_URL -c "
  -- Insert 68 comments to one post
  -- Verify 1st comment is deleted
"
```

### Component Testing
```bash
npm run dev

# Test interactions:
# 1. Try to like a video post → No like button
# 2. Like a text post → See 13 hearts burst
# 3. Throw talents → Feel haptic vibration
# 4. Vote on poll → Watch bar grow
# 5. Unmute Radio Dial → See verified name
# 6. Logout → Air-Lock blocks access
```

---

## 📊 Protocol Limits Reference

```typescript
import { PROTOCOL_LIMITS } from '@/lib/interactionProtocol';

PROTOCOL_LIMITS.COMMENT_CEILING  // 67
PROTOCOL_LIMITS.LIKE_CEILING     // 13
PROTOCOL_LIMITS.VIEWER_CEILING   // 67
```

---

## 🔧 Common Patterns

### Display Capped Counts
```typescript
import { formatCommentCount, formatLikeCount } from '@/lib/interactionProtocol';

const displayComments = formatCommentCount(68); // "67"
const displayLikes = formatLikeCount(20); // "13+"
```

### Check Media Interaction Rules
```typescript
import { isMediaOnlyReply, getAllowedInteractions } from '@/lib/interactionProtocol';

if (isMediaOnlyReply('video')) {
  // Show only Reply and Talent Throw
}

const allowed = getAllowedInteractions('image'); // ['reply', 'talent_throw']
```

---

## 📖 Full Documentation

- [PROTOCOL_DEFINITIVE_STATE.md](PROTOCOL_DEFINITIVE_STATE.md) - Complete protocol guide
- [NOTIFICATION_ENGINE_GUIDE.md](NOTIFICATION_ENGINE_GUIDE.md) - Notification system
- [SEARCH_PROTOCOL_GUIDE.md](SEARCH_PROTOCOL_GUIDE.md) - Search & Audio Radio
- [GIG_PROTOCOL_GUIDE.md](GIG_PROTOCOL_GUIDE.md) - G$4U Gig system

---

**"First-In, First-Out. Attention is the only currency."** - The 6713 Protocol
