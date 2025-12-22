# Wall Chat Heartbeat - Visual Reference

**Quick UI Component Guide for Designers & Developers**

---

## 1. Header: 13+ Online Indicator

```
┌─────────────────────────────────────────────────────┐
│  #Earth                         ● 13+ Online       │
│  High-velocity chat · Last 50 messages             │
└─────────────────────────────────────────────────────┘
```

**Location:** Top right of header  
**Elements:**
- Green pulsing dot (`w-2 h-2 bg-green-500 rounded-full animate-pulse`)
- Count text in mono font (`font-mono text-white/60`)
- Minimum enforced: `Math.max(onlineCount, 13)`

**Colors:**
- Dot: `#22c55e` (green-500)
- Text: `rgba(255,255,255,0.6)` (white/60)

---

## 2. Bottom: 67+ Typing Indicator

```
┌─────────────────────────────────────────────────────┐
│  ● ● ●  67+ people typing...                        │
├─────────────────────────────────────────────────────┤
│  [Text Input Area]                                  │
└─────────────────────────────────────────────────────┘
```

**Location:** Above input field, bottom of screen  
**Elements:**
- Three bouncing dots with staggered animation
- Count text: caps at 67+
- Only visible when `typingCount > 0`

**Animation:**
```css
/* Dot 1 */ animation-delay: 0ms
/* Dot 2 */ animation-delay: 150ms
/* Dot 3 */ animation-delay: 300ms
```

**Colors:**
- Dots: `rgba(255,255,255,0.4)` (white/40)
- Text: `rgba(255,255,255,0.4)` (white/40)

---

## 3. Story Slider Modal (Every 30 Messages)

```
┌─────────────────────────────────────────────────────┐
│                                              [X]    │
│              Verified Discovery                     │
│            Elite Town Square                        │
│                                                     │
│   ┌─────────────────────────────────┐             │
│   │                                  │ <           │
│   │       [Story Image/Text]        │             │
│   │                                  │             │
│   │        @username                 │ >           │
│   │        2h ago                    │             │
│   └─────────────────────────────────┘             │
│              ● ○ ○                                 │
│           Story 1 of 3                             │
└─────────────────────────────────────────────────────┘
```

**Layout:**
- Full-screen modal (`fixed inset-0`)
- Black/90 backdrop with blur (`bg-black/90 backdrop-blur-md`)
- Story card: 9:16 aspect ratio (`aspect-[9/16]`)
- Max width: 28rem (`max-w-md`)

**Navigation:**
- Left arrow: Previous story
- Right arrow: Next story
- Dots: Position indicator
- X button: Dismiss slider

**Colors:**
- Backdrop: `rgba(0,0,0,0.9)`
- Card border: `rgba(255,255,255,0.2)` (white/20)
- Card background: `gradient from-white/10 to-black/50`
- Username overlay: `gradient from-black via-black/70 to-transparent`

**Trigger:**
- Appears at message count: 30, 60, 90, 120...
- Fetches 3 random verified user stories

---

## 4. Admin Slash Button (Moderator Only)

```
┌─────────────────────────────────────────────────────┐
│  @username · 2m ago                                 │
│  This message violated guidelines              [/] │
│                                                     │
└─────────────────────────────────────────────────────┘
       Hover to see slash button →
```

**Location:** Absolute positioned, right side of message  
**Visibility:** Only visible to admins on message hover  
**Elements:**
- Red background (`bg-red-500/20`)
- Red border (`border-red-500/30`)
- Slash icon from lucide-react
- Opacity: 0 → 100 on hover

**Classes:**
```tsx
absolute -right-2 top-0 p-2 
bg-red-500/20 hover:bg-red-500/40 
border border-red-500/30 rounded-lg 
opacity-0 group-hover/message:opacity-100
```

---

## 5. Slashed Message Display

```
┌─────────────────────────────────────────────────────┐
│  @username · 5m ago                                 │
│  ~~This message violated guidelines~~               │
│  ~~Slashed by moderator~~                          │
└─────────────────────────────────────────────────────┘
```

**Text Styling:**
- Strikethrough: `line-through`
- Color: Slate Grey 400 (`text-slate-400`)
- Label: Slate Grey 500, italic (`text-slate-500 italic`)

**Colors:**
- Slashed text: `#94a3b8` (slate-400)
- Label: `#64748b` (slate-500)

**HTML Structure:**
```tsx
<p className="text-slate-400 line-through">
  {message.content}
</p>
<p className="text-xs text-slate-500 italic">
  ~~Slashed by moderator~~
  {message.slash_reason && ` - ${message.slash_reason}`}
</p>
```

---

## 6. Message States Comparison

### Normal Message
```
┌─────────────────────────────────────────────────────┐
│  @username · 2m ago                                 │
│  Hello #Earth! This is a normal message.            │
│  [Reply] [⚡ Throw Talent]                          │
└─────────────────────────────────────────────────────┘
```

### Pope AI Message
```
┌─────────────────────────────────────────────────────┐
│        ⚡ POPE AI ORACLE ⚡ · 1h ago                │
│  SYSTEM NOTIFICATION: WALL CHAT IS LIVE             │
│        ∞ PERMANENT RECORD                           │
└─────────────────────────────────────────────────────┘
```
- Yellow gradient background
- Double border
- Centered text
- Permanent badge

### Slashed Message (Admin Action)
```
┌─────────────────────────────────────────────────────┐
│  @username · 5m ago                                 │
│  ~~Inappropriate content removed~~                  │
│  ~~Slashed by moderator~~                          │
└─────────────────────────────────────────────────────┘
```
- Grey strikethrough
- Italic label
- No interactions visible

---

## Color Palette Reference

### Primary Colors
| Element | Color | Hex | Tailwind |
|---------|-------|-----|----------|
| Background | Black | `#000000` | `bg-black` |
| Text (Normal) | White | `#FFFFFF` | `text-white` |
| Text (Muted) | White 40% | `rgba(255,255,255,0.4)` | `text-white/40` |
| Text (Secondary) | White 60% | `rgba(255,255,255,0.6)` | `text-white/60` |

### Accent Colors
| Element | Color | Hex | Tailwind |
|---------|-------|-----|----------|
| Online Pulse | Green 500 | `#22c55e` | `bg-green-500` |
| Admin Slash | Red 500 | `#ef4444` | `bg-red-500/20` |
| Pope AI | Yellow 400 | `#facc15` | `text-yellow-400` |
| Username | Blue 400 | `#60a5fa` | `text-blue-400` |

### Moderation Colors
| Element | Color | Hex | Tailwind |
|---------|-------|-----|----------|
| Slashed Text | Slate 400 | `#94a3b8` | `text-slate-400` |
| Slash Label | Slate 500 | `#64748b` | `text-slate-500` |
| Slash Button | Red 500/20 | `rgba(239,68,68,0.2)` | `bg-red-500/20` |

---

## Animation Specifications

### 1. Online Pulse
```css
.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

### 2. Typing Dots Bounce
```css
.animate-bounce {
  animation: bounce 1s infinite;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-25%);
  }
}
```
**Stagger:** 0ms, 150ms, 300ms

### 3. Story Slider Fade In
```css
/* Modal appears */
transition: opacity 200ms ease-in-out;
opacity: 0 → 1
```

### 4. Slash Button Hover
```css
.group-hover\\/message\\:opacity-100 {
  transition: opacity 150ms ease-in-out;
}
```

---

## Responsive Breakpoints

### Mobile (<640px)
- Story Slider: Full width with padding
- Online count: Always visible in header
- Typing indicator: Full width

### Tablet (640px - 1024px)
- Story Slider: Max width 28rem (448px)
- Same behavior as mobile

### Desktop (>1024px)
- Story Slider: Max width 28rem, centered
- Admin slash button appears on hover only
- All features fully functional

---

## Interaction States

### Hover States
| Element | Default | Hover |
|---------|---------|-------|
| Slash Button | `bg-red-500/20` | `bg-red-500/40` |
| Story Arrow | `bg-black/50` | `bg-black/70` |
| Close Button | `bg-white/10` | `bg-white/20` |

### Focus States
All interactive elements use:
```css
focus:outline-none
focus:ring-2
focus:ring-white/20
```

### Disabled States
```css
disabled:opacity-50
disabled:cursor-not-allowed
```

---

## Z-Index Hierarchy

| Layer | Z-Index | Element |
|-------|---------|---------|
| Base | 0 | Messages, content |
| Overlay | 40 | Reply bar |
| Modal | 50 | Story Slider |
| Admin | 10 | Slash button (relative) |

---

## Accessibility Notes

### Screen Readers
- Online count: "13 plus people online"
- Typing indicator: "67 plus people typing"
- Slash button: "Slash this message, Admin action"
- Story slider: "Story 1 of 3, Verified Discovery"

### Keyboard Navigation
- Story Slider: Arrow keys to navigate
- Slash Button: Tab to focus, Enter to activate
- All buttons: Full keyboard accessibility

### Color Contrast
- All text meets WCAG AA standards
- Slashed text (slate-400 on black): 4.5:1 ratio ✅
- White text on black: 21:1 ratio ✅

---

## Implementation Checklist

Visual designers should ensure:
- [ ] Green pulse animation is smooth (2s cycle)
- [ ] Typing dots have 150ms stagger
- [ ] Story cards maintain 9:16 aspect ratio
- [ ] Slash button only visible to admins
- [ ] Slashed text has visible strikethrough
- [ ] All colors match brand palette
- [ ] Animations are performant (GPU accelerated)
- [ ] Mobile responsiveness tested

---

**Visual Reference Version:** 1.0  
**Last Updated:** December 22, 2025  
**Figma Compatibility:** All specs can be directly applied in Figma
