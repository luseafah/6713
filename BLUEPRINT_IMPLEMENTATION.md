# 6713 Blueprint Implementation Checklist

This document maps each requirement from the 6713 blueprint to its implementation.

## ✅ 1. Verification & Gating

### View Access: Everyone can read the Wall
**Implementation**: [components/Wall.tsx](components/Wall.tsx)
- Wall component renders for all users
- Messages visible without authentication check
- No gating on message display

### Post Access: Only is_verified === true users can send messages
**Implementation**: [app/api/wall/messages/route.ts](app/api/wall/messages/route.ts) (Lines 28-36)
```typescript
if (!user.is_verified) {
  return NextResponse.json(
    { error: 'Only verified users can post' },
    { status: 403 }
  );
}
```
- Server-side validation on POST
- Client-side UI disable: [components/Wall.tsx](components/Wall.tsx) (Lines 172-176)

### COMA Users: Can 'Whisper' on the Wall with distinct visuals
**Implementation**: [components/Wall.tsx](components/Wall.tsx) (Lines 133-137)
```typescript
className={`${
  message.is_coma_whisper ? 'opacity-50 italic' : ''
}`}
```
- 50% opacity via Tailwind `opacity-50`
- Italics via `italic` class
- Stored in database: [app/api/wall/messages/route.ts](app/api/wall/messages/route.ts) (Line 55)

---

## ✅ 2. The 7-Second Slow Mode

### Client-side cooldown
**Implementation**: [components/Wall.tsx](components/Wall.tsx) (Lines 22-23, 28-46)
- State: `const [cooldown, setCooldown] = useState(0);`
- Countdown timer with 1-second intervals
- UI updates in real-time

### Server-side cooldown
**Implementation**: [app/api/wall/messages/route.ts](app/api/wall/messages/route.ts) (Lines 38-53)
```typescript
if (timeSinceLastPost < 7) {
  const remainingTime = Math.ceil(7 - timeSinceLastPost);
  return NextResponse.json(
    { error: 'Please wait before posting again', cooldown: remainingTime },
    { status: 429 }
  );
}
```
- Validates time since last post
- Returns 429 status with remaining time
- Updates `post_cooldowns` table

### UI Feedback: "Breathe... [X]s"
**Implementation**: [components/Wall.tsx](components/Wall.tsx) (Line 182)
```typescript
placeholder={cooldown > 0 ? `Breathe... ${cooldown}s` : "What's on your mind?"}
```
- Dynamic placeholder text
- Shows countdown during cooldown

### Disable Send button
**Implementation**: [components/Wall.tsx](components/Wall.tsx) (Lines 186-189)
```typescript
disabled={cooldown > 0 || loading || !newMessage.trim()}
```
- Button disabled during cooldown
- Visual feedback with `disabled:opacity-50`

---

## ✅ 3. Interaction Rules

### The 13+ Cap on Reactions
**Implementation**: [app/api/wall/reactions/route.ts](app/api/wall/reactions/route.ts) (Lines 55-58)
```typescript
return NextResponse.json({ 
  count: reactions.length,
  display_count: reactions.length > 13 ? '13+' : reactions.length 
});
```
- Actual count stored normally
- Display logic caps at "13+"
- UI: [components/Wall.tsx](components/Wall.tsx) (Lines 155-159)

### Pope AI Integration
**Implementation**: [app/api/wall/messages/route.ts](app/api/wall/messages/route.ts) (Lines 75-84)
```typescript
if (isComaWhisper) {
  await supabaseAdmin
    .from('wall_messages')
    .insert({
      user_id: 'pope-ai',
      username: 'Pope AI',
      content: `@everyone advice @${user.username} in coma status to log off`,
      message_type: 'system',
      is_pope_ai: true,
    });
}
```
- Auto-posts after COMA user message
- Special styling: [components/Wall.tsx](components/Wall.tsx) (Lines 137-139)

---

## ✅ 4. UI Requirements

### Full-screen chat interface
**Implementation**: [components/Wall.tsx](components/Wall.tsx) (Line 117)
```typescript
<div className="flex flex-col h-screen bg-black">
```
- Uses `h-screen` for full viewport height
- Flex column layout for messages + input

### Pure black background (#000) with white text
**Implementation**: 
- Global: [app/globals.css](app/globals.css) (Lines 5-8)
- Component: [components/Wall.tsx](components/Wall.tsx) (Line 117)
- Tailwind: [tailwind.config.ts](tailwind.config.ts) (Lines 11-14)

### Fixed top navigation
**Implementation**: [components/Navigation.tsx](components/Navigation.tsx) (Line 16)
```typescript
<nav className="fixed top-0 left-0 right-0 z-50 bg-black border-b border-white/10">
```
- Fixed positioning with z-index 50
- Content padding: [app/wall/page.tsx](app/wall/page.tsx) (Line 15)

---

## ✅ 5. Wall 'Whisper' Logic

### Visuals: 50% opacity and italics
**Implementation**: [components/Wall.tsx](components/Wall.tsx) (Lines 133-137)
```typescript
className={`${
  message.is_coma_whisper ? 'opacity-50 italic' : ''
}`}
```

### System Trigger: Pope AI auto-post
**Implementation**: [app/api/wall/messages/route.ts](app/api/wall/messages/route.ts) (Lines 75-84)
- Triggers immediately after COMA user post
- Posts: `@everyone advice @[username] in coma status to log off`

### Interaction: Clicking username opens modal
**Implementation**: [components/Wall.tsx](components/Wall.tsx) (Lines 101-113, 142-147)
```typescript
const handleUsernameClick = async (userId: string, username: string) => {
  // Fetches profile and COMA data
  setSelectedProfile({ profile: profileData, username });
}
```
- Modal: [components/ComaModal.tsx](components/ComaModal.tsx)
- Shows Reason (Choice/Quest) and Wiki

---

## ✅ 6. COMA Entry Ritual (The Choice)

### Mandatory button selection: "Choice" or "Quest"
**Implementation**: [components/ComaSettings.tsx](components/ComaSettings.tsx) (Lines 167-187)
```typescript
<button onClick={() => handleEnterComa('Choice')}>Choice</button>
<button onClick={() => handleEnterComa('Quest')}>Quest</button>
```
- Modal shown on COMA toggle
- Cannot enter without selection

### Store reason in profiles table
**Implementation**: [app/api/coma/enter/route.ts](app/api/coma/enter/route.ts) (Lines 67-77)
```typescript
.update({
  coma_status: true,
  coma_reason: reason, // 'Choice' or 'Quest'
  ...
})
```
- Stored in `profiles.coma_reason`
- Displayed on Wall and Profile modal

---

## ✅ 7. COMA Refill & Talent Economy

### Free Tier: 3 free refills
**Implementation**: [database/schema.sql](database/schema.sql) (Line 19)
```sql
coma_refills INTEGER DEFAULT 3,
```
- Default value in database schema

### Regeneration: 1 refill per 24 hours
**Implementation**: 
- Trigger: [database/schema.sql](database/schema.sql) (Lines 60-76)
- API logic: [app/api/coma/status/route.ts](app/api/coma/status/route.ts) (Lines 30-42)
```typescript
if (hoursPassed >= 24 && refills < 3) {
  const refillsToAdd = Math.floor(hoursPassed / 24);
  refills = Math.min(3, refills + refillsToAdd);
}
```

### Talent Cost: 50 Talents if refills at 0
**Implementation**: [app/api/coma/enter/route.ts](app/api/coma/enter/route.ts) (Lines 54-64)
```typescript
if (refills > 0) {
  refills -= 1; // Use refill
} else if (talents >= 50) {
  talents -= 50; // Pay with talents
} else {
  return NextResponse.json({ error: 'Insufficient refills or talents' }, { status: 403 });
}
```

### Cooldown: 24-hour timer after exit
**Implementation**: [app/api/coma/enter/route.ts](app/api/coma/enter/route.ts) (Lines 33-43)
```typescript
if (profile.coma_exited_at) {
  const hoursSinceExit = (Date.now() - exitTime) / (1000 * 60 * 60);
  if (hoursSinceExit < 24) {
    const hoursRemaining = Math.ceil(24 - hoursSinceExit);
    return NextResponse.json({ error: 'Cannot enter COMA yet', cooldownHours: hoursRemaining }, { status: 429 });
  }
}
```
- Exit timestamp: [app/api/coma/exit/route.ts](app/api/coma/exit/route.ts) (Lines 31-36)

---

## ✅ 8. UI & State

### Display refill count (e.g., "Refills: 2/3")
**Implementation**: [components/ComaSettings.tsx](components/ComaSettings.tsx) (Lines 105-111)
```typescript
<div>
  <p className="text-white font-medium">Refills</p>
  <p className="text-white/60 text-sm">{refills} / 3</p>
  <p className="text-white/40 text-xs mt-1">Regenerates 1 per 24 hours</p>
</div>
```

### Show 24h cooldown countdown
**Implementation**: [components/ComaSettings.tsx](components/ComaSettings.tsx) (Lines 125-134)
```typescript
{cooldownHours > 0 && !comaStatus && (
  <div className="flex items-start gap-2 bg-yellow-900/20 border border-yellow-500/30 rounded p-3">
    <p className="text-yellow-400 text-sm font-medium">Cooldown Active</p>
    <p className="text-yellow-400/80 text-xs">
      {Math.floor(cooldownHours)}h {Math.floor((cooldownHours % 1) * 60)}m remaining
    </p>
  </div>
)}
```
- Hours and minutes display
- Warning styling

---

## Summary

All 8 major requirements from the 6713 blueprint have been implemented:

1. ✅ Verification & Gating (view all, post verified, COMA whisper)
2. ✅ 7-Second Slow Mode (client + server, UI feedback)
3. ✅ Interaction Rules (13+ cap, Pope AI)
4. ✅ UI Requirements (full-screen, black background, fixed nav)
5. ✅ Wall Whisper Logic (visuals, Pope AI trigger, modal)
6. ✅ COMA Entry Ritual (Choice/Quest selection)
7. ✅ COMA Refill Economy (3 free, regeneration, talent cost, cooldown)
8. ✅ UI & State (refill display, cooldown countdown)

All features are fully functional and follow the exact specifications provided in the blueprint.
