# Component Documentation

## Wall Component (`components/Wall.tsx`)

The main public chat interface.

### Props
- `currentUserId: string` - ID of the current user
- `isVerified: boolean` - Whether user can post messages

### Features
- Full-screen chat interface
- Real-time message polling (3s intervals)
- 7-second post cooldown with countdown
- Reaction system (capped at 13+ display)
- COMA user detection and styling
- Username click to view profile modal

### State Management
- `messages` - Array of wall messages
- `newMessage` - Current message input
- `cooldown` - Remaining cooldown seconds
- `loading` - Submit state
- `selectedProfile` - Selected user for modal

### Key Functions

#### `loadMessages()`
Fetches latest 50 messages with reaction counts.

#### `checkCooldown()`
Checks if user can post based on last post time.

#### `handleSendMessage()`
Sends message, enforces cooldown, triggers Pope AI for COMA users.

#### `handleReaction(messageId)`
Toggles like on a message.

#### `handleUsernameClick(userId, username)`
Opens COMA modal for selected user.

---

## ComaSettings Component (`components/ComaSettings.tsx`)

COMA system controls and status display.

### Props
- `userId: string` - ID of the current user

### Features
- Real-time status updates (10s polling)
- Toggle COMA on/off
- Display refills (X/3)
- Display talents balance
- Show 24h cooldown timer
- Reason selection modal (Choice/Quest)

### State Management
- `comaStatus` - Current COMA state
- `refills` - Available refills
- `talents` - Talent balance
- `cooldownHours` - Hours remaining in cooldown
- `canEnter` - Whether user can enter COMA
- `showReasonModal` - Reason selection modal state

### Key Functions

#### `loadComaStatus()`
Fetches current COMA status and economics.

#### `handleEnterComa(reason)`
Enters COMA with chosen reason, consumes refill or talents.

#### `handleExitComa()`
Exits COMA, starts 24h cooldown.

---

## ComaModal Component (`components/ComaModal.tsx`)

Profile viewer for COMA users.

### Props
- `isOpen: boolean` - Modal visibility
- `onClose: () => void` - Close handler
- `profile: Profile | null` - User profile data
- `username: string` - Display name

### Features
- Shows COMA status
- Displays reason (Choice/Quest)
- Shows user Wiki/bio
- Close button with X icon

---

## Navigation Component (`components/Navigation.tsx`)

Fixed top navigation bar.

### Features
- Fixed positioning at top
- Active link highlighting
- Links: Hue, Wall, Live, $$$4U
- Pure black background with white/10 border

### Styling
- Active: 100% opacity
- Inactive: 50% opacity
- Hover: 75% opacity

---

## API Integration

### Wall Messages API

```typescript
// Fetch messages
GET /api/wall/messages?limit=50&before=timestamp

// Send message
POST /api/wall/messages
Body: {
  user_id: string,
  content: string,
  message_type?: 'text' | 'voice' | 'picture'
}

Response: {
  message: WallMessage
}
```

### Reactions API

```typescript
// Get reaction count
GET /api/wall/reactions?message_id=uuid

Response: {
  count: number,
  display_count: string | number // "13+" if > 13
}

// Toggle reaction
POST /api/wall/reactions
Body: {
  message_id: string,
  user_id: string
}

Response: {
  action: 'added' | 'removed'
}
```

### Cooldown API

```typescript
GET /api/wall/cooldown?user_id=uuid

Response: {
  canPost: boolean,
  remainingTime: number // seconds
}
```

### COMA APIs

```typescript
// Get status
GET /api/coma/status?user_id=uuid

Response: {
  coma_status: boolean,
  coma_reason: 'Choice' | 'Quest' | null,
  coma_refills: number,
  talents: number,
  cooldown_hours: number,
  can_enter_coma: boolean
}

// Enter COMA
POST /api/coma/enter
Body: {
  user_id: string,
  reason: 'Choice' | 'Quest'
}

// Exit COMA
POST /api/coma/exit
Body: {
  user_id: string
}
```

---

## Styling Conventions

### Colors
- Background: `#000000` (pure black)
- Text: `#ffffff` (white)
- Borders: `white/10` to `white/40`
- COMA Whisper: 50% opacity, italics
- Pope AI: Red theme (`red-400`, `red-900/20`)

### Layout
- Top navigation: 64px height (`h-16`)
- Content area: `pt-16` to account for fixed nav
- Full screen: `h-screen` for Wall

### Interactive States
- Hover: Opacity changes or color shifts
- Disabled: 50% opacity, cursor-not-allowed
- Loading: Disabled state + spinner (if applicable)

---

## Error Handling

### Common Errors

#### 403 - Forbidden
User not verified or lacks permission.
```typescript
{ error: 'Only verified users can post' }
```

#### 404 - Not Found
User or resource doesn't exist.
```typescript
{ error: 'User not found' }
```

#### 429 - Too Many Requests
Cooldown violation.
```typescript
{
  error: 'Please wait before posting again',
  cooldown: 5 // remaining seconds
}
```

#### 500 - Server Error
Database or server issue.
```typescript
{ error: 'Error message from catch block' }
```

---

## Performance Considerations

### Polling Intervals
- Messages: 3 seconds
- COMA Status: 10 seconds
- Cooldown: Real-time countdown (1s intervals)

### Optimization Tips
1. Use pagination for messages (before parameter)
2. Implement React Query for caching
3. Add Supabase Realtime for live updates
4. Debounce input fields
5. Lazy load images in messages
6. Virtual scrolling for long message lists

---

## Accessibility

### Keyboard Navigation
- Enter key to send message
- Tab navigation through interactive elements
- Escape to close modals

### Screen Readers
- Semantic HTML elements
- ARIA labels for icons
- Status announcements for cooldowns

### Color Contrast
- White on black meets WCAG AAA standards
- Warning colors (red, yellow) have sufficient contrast

---

## Testing Checklist

### Wall Component
- [ ] Messages load on mount
- [ ] 7-second cooldown enforces
- [ ] Countdown displays correctly
- [ ] Send button disabled during cooldown
- [ ] COMA messages show 50% opacity
- [ ] Pope AI posts trigger for COMA users
- [ ] Reactions toggle correctly
- [ ] Count displays "13+" when > 13

### COMA Settings
- [ ] Status loads correctly
- [ ] Refills display (X/3)
- [ ] Cooldown timer counts down
- [ ] Reason modal shows on toggle
- [ ] Refill consumed on entry
- [ ] Talents deducted if no refills
- [ ] 24h cooldown starts on exit

### Navigation
- [ ] Active link highlighted
- [ ] All links functional
- [ ] Fixed position maintained
- [ ] Responsive on mobile
