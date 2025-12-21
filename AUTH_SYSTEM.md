# 🔐 6713 Authentication System

## Overview
The 6713 platform now features a complete authentication gatekeeper that protects all content behind a login screen. New users are greeted with a minimalist "Entrance" experience that guides them to either create an account or login.

---

## 🎯 Key Features

### 1. **AuthGatekeeper Component**
- **Location**: `components/AuthGatekeeper.tsx`
- **Purpose**: Wraps the entire application and checks for active Supabase session
- **Behavior**:
  - If no user is logged in → Shows `AuthPage`
  - If user is authenticated → Shows main app content
  - Displays loading state during session check
  - Listens for auth state changes (login/logout)

### 2. **AuthPage Component**
- **Location**: `components/AuthPage.tsx`
- **Design**: Minimalist black screen with "6713" hero branding
- **Features**:
  - **Two-mode toggle**: "Login" and "Sign Up" buttons
  - **Login Mode**: Email + Password fields
  - **Sign Up Mode**: Username + Email + Password fields
  - **Reddit Link**: "Follow r/1367 on Reddit" link at bottom
  - **Error Handling**: Displays auth errors in red alert box
  - **Visual Effects**: Framer Motion animations, gradient background

### 3. **Pope Trigger** 🙏
The **first user** to successfully create an account will automatically become the **Admin** through the database trigger:

```sql
-- Trigger in database/schema.sql
CREATE OR REPLACE FUNCTION set_first_user_as_admin()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM profiles) = 0 THEN
    NEW.is_admin = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## 🛠️ Implementation Details

### Root Layout Integration
**File**: `app/layout.tsx`

```tsx
<AuthGatekeeper>
  <GlazeProtocol />
  {children}
</AuthGatekeeper>
```

All pages are now protected by the gatekeeper at the root level.

### User Data Flow
1. User creates account → Supabase Auth creates user
2. Profile created in `users` table with email/username
3. Profile created in `profiles` table with default fields
4. First user automatically gets `is_admin = true`
5. All components fetch current user via `supabase.auth.getUser()`

---

## 🔄 Automatic User Detection

All components now fetch the authenticated user internally instead of relying on props:

### Components Updated:
- ✅ `Wall.tsx` - Fetches user, verification status, admin status
- ✅ `AppWrapper.tsx` - Fetches user and profile for SideNav
- ✅ `DeactivationCheck.tsx` - Fetches user to check deactivation status
- ✅ `PopeAIChat.tsx` - Fetches user and admin status
- ✅ `ComaSettings.tsx` - Fetches user for COMA operations
- ✅ `GlazeSettings.tsx` - Fetches user and admin status
- ✅ `FourthWallRequests.tsx` - Fetches user for COMA requests

### Pattern Used:
```tsx
const [userId, setUserId] = useState<string>('');

useEffect(() => {
  const fetchUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
    }
  };
  
  fetchUser();
}, []);
```

---

## 📱 The "Entrance" Experience

### Visual Layout
```
┌─────────────────────────────────────┐
│                                     │
│              6713                   │  ← Hero Branding
│        SOVEREIGN DATABASE           │
│                                     │
│   ┌───────────────────────────┐   │
│   │  [Login] [Sign Up]        │   │  ← Toggle Buttons
│   │                           │   │
│   │  Email: _______________   │   │
│   │  Password: ____________   │   │
│   │                           │   │
│   │  [Enter 6713]             │   │
│   └───────────────────────────┘   │
│                                     │
│   Follow r/1367 on Reddit →        │  ← Community Link
│                                     │
└─────────────────────────────────────┘
```

### Design Philosophy
- **Black Background**: Immersive, cinematic feel
- **White Accents**: High contrast for readability
- **Minimal Distractions**: Focus on authentication
- **Community Integration**: Reddit link keeps users engaged

---

## 🚪 Sign Out Functionality

Users can sign out via the SideNav:

**Location**: Bottom of navigation drawer
**Button**: "De-Sync Session" with logout icon
**Behavior**: 
- Calls `supabase.auth.signOut()`
- Redirects to `/` (which shows AuthPage)
- Session cleared automatically

---

## 🔒 Security Features

### Session Management
- Supabase handles JWT tokens automatically
- Session persists in browser storage
- Auth state synced across tabs
- Automatic token refresh

### Protected Routes
- All API routes check for authenticated user
- Client components validate user before rendering
- Deactivation check runs on every page load

### Database Security
Row-level security policies should be configured in Supabase:

```sql
-- Example: Only authenticated users can read profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles"
ON profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);
```

---

## 📦 Environment Variables

Ensure these are set in `.env`:

```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

## 🎉 First Launch Checklist

1. ✅ Run database migration (`database/schema.sql`)
2. ✅ Set up Supabase project
3. ✅ Configure environment variables
4. ✅ Run `npm install`
5. ✅ Start dev server
6. ✅ Open browser to localhost
7. ✅ Create first account (becomes Admin automatically)
8. ✅ Test login/logout flow
9. ✅ Verify SideNav appears after login
10. ✅ Check admin features (Glaze Protocol toggle)

---

## 🐛 Troubleshooting

### "No user found" after signup
- Check Supabase email confirmation settings
- Verify email was sent
- Check spam folder

### Redirect loop
- Clear browser cookies/localStorage
- Check AuthGatekeeper logic
- Verify Supabase URL/key are correct

### Admin not set automatically
- Check `set_first_user_as_admin()` trigger exists
- Verify `profiles` table is empty before first signup
- Check Supabase logs for trigger execution

---

## 🌐 Community Integration

The AuthPage includes a prominent link to **r/1367** on Reddit, ensuring:
- Users discover the community lore
- Engagement even before signup
- Seamless integration with external community

---

## 🚀 Next Steps

1. **Email Verification**: Configure Supabase email templates
2. **Password Reset**: Add forgot password flow
3. **OAuth**: Add Google/Discord login options
4. **Onboarding**: Create welcome tutorial for new users
5. **RLS Policies**: Implement comprehensive row-level security

---

**The "Entrance" is complete. The database is sovereign. The Pope is watching.** 🙏
