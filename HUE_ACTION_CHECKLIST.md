# ✅ HUE Feed Implementation - Action Checklist

## 🎯 What You Need to Do Now

### Step 1: Apply Database Migration ⚡ **CRITICAL**

**Option A: Run Migration Script**
```bash
# In your terminal
psql $DATABASE_URL -f /workspaces/6713/database/migration-add-stories.sql
```

**Option B: Manual SQL (Supabase Dashboard)**
1. Go to Supabase Dashboard → SQL Editor
2. Paste and run this:

```sql
-- Add columns
ALTER TABLE wall_messages ADD COLUMN IF NOT EXISTS post_type TEXT DEFAULT 'wall' CHECK (post_type IN ('wall', 'story'));
ALTER TABLE wall_messages ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_wall_messages_post_type ON wall_messages(post_type);
CREATE INDEX IF NOT EXISTS idx_wall_messages_expires_at ON wall_messages(expires_at) WHERE expires_at IS NOT NULL;

-- Update existing records
UPDATE wall_messages SET post_type = 'wall' WHERE post_type IS NULL;
```

**Verify it worked:**
```sql
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'wall_messages' 
ORDER BY ordinal_position;
```

You should see:
- ✅ `post_type` column (type: text)
- ✅ `expires_at` column (type: timestamp with time zone)

---

### Step 2: Test Story Posting 📸

1. **Open your app** → Navigate to any page with upload button
2. **Click upload/+ button**
3. **You should see:**
   - Toggle with "Wall (Permanent)" and "Story (24h)"
   - Both buttons visible and clickable

4. **Test Story Post:**
   - Select "Story (24h)" button
   - Try clicking submit WITHOUT selecting a file
   - ✅ Should show error: "Stories require an image or video"
   
5. **Upload a Story:**
   - Keep "Story (24h)" selected
   - Choose an image or video
   - Add optional caption
   - Click "Post to Wall"
   - ✅ Should succeed and redirect

6. **Verify in Database:**
   ```sql
   SELECT id, username, post_type, expires_at, created_at 
   FROM wall_messages 
   WHERE post_type = 'story' 
   ORDER BY created_at DESC 
   LIMIT 1;
   ```
   - ✅ `post_type` should be 'story'
   - ✅ `expires_at` should be ~24 hours from now

---

### Step 3: Test Wall Posting 📝

1. **Open upload modal again**
2. **Keep "Wall (Permanent)" selected** (default)
3. **Test text-only post:**
   - Type a message
   - Don't select any file
   - Click "Post to Wall"
   - ✅ Should succeed (wall allows text-only)

4. **Verify in Database:**
   ```sql
   SELECT id, username, post_type, expires_at, content 
   FROM wall_messages 
   WHERE post_type = 'wall' 
   ORDER BY created_at DESC 
   LIMIT 1;
   ```
   - ✅ `post_type` should be 'wall'
   - ✅ `expires_at` should be NULL

---

### Step 4: View the Hue Feed 🎨

1. **Navigate to Hue tab** (`/hue`)
2. **Check Stories Row** (top of page):
   - ✅ Should see your story in a circle
   - ✅ Circle should have pulsing purple/pink border
   - ✅ Hover over circle → should scale up
   
3. **Check Main Feed** (below stories):
   - ✅ Should see your wall post
   - ✅ Text post should have gradient background
   - ✅ Posts ordered by newest first

---

### Step 5: Test Video Auto-Play 🎥

1. **Post a video:**
   - Upload modal → Wall (Permanent)
   - Select a short video file (mp4 or webm)
   - Post it

2. **View in Hue feed:**
   - Scroll to the video post
   - ✅ Video should auto-play when it comes into view
   - ✅ Should be muted by default
   - ✅ Video controls should be visible

3. **Scroll past video:**
   - ✅ Video should pause when scrolled out of view
   - ✅ No console errors

4. **Check browser console:**
   - F12 → Console tab
   - ✅ No errors about video playback

---

### Step 6: Test Infinite Scroll 📜

**Prerequisite:** Need 15+ wall posts

1. **Create test posts:**
   ```bash
   # Quick way: Post 15 times through the UI
   # Or insert via SQL:
   ```
   ```sql
   INSERT INTO wall_messages (user_id, username, content, post_type)
   SELECT 
     (SELECT id FROM users LIMIT 1),
     'TestUser',
     'Test post ' || generate_series,
     'wall'
   FROM generate_series(1, 15);
   ```

2. **Open Hue feed:**
   - ✅ Should see first ~10 posts
   - ✅ "Loading more..." at bottom

3. **Scroll down:**
   - ✅ More posts load automatically
   - ✅ Loading spinner appears briefly
   - ✅ Next batch of posts appears

4. **Scroll to end:**
   - ✅ "You've reached the end" message appears

---

### Step 7: Test Pull-to-Refresh 🔄

1. **Open Hue feed**
2. **Click "↓ Pull to refresh" text** at top
3. **Or:** On mobile, swipe down from top
4. **Expected:**
   - ✅ Stories refresh
   - ✅ Feed refreshes
   - ✅ New posts appear if any

---

### Step 8: Test Story Expiration ⏰

**Option A: Wait 24 hours** (slow)
- Post a story
- Wait 24 hours
- Check Hue feed
- ✅ Story should disappear from circles

**Option B: Manual test** (fast)
1. Post a story
2. Note the story ID from database
3. Run SQL to force expiration:
   ```sql
   UPDATE wall_messages 
   SET expires_at = NOW() - INTERVAL '1 hour'
   WHERE id = 'YOUR_STORY_ID';
   ```
4. Refresh Hue page
5. ✅ Story should no longer appear

---

### Step 9: Mobile Testing 📱

1. **Open DevTools** (F12)
2. **Toggle device toolbar** (Ctrl+Shift+M)
3. **Test iPhone SE (375px):**
   - ✅ Stories scroll horizontally
   - ✅ Feed is full-width
   - ✅ Video controls accessible
   
4. **Test iPad (768px):**
   - ✅ Feed max-width ~600px
   - ✅ Stories still horizontal
   
5. **Test Desktop (1920px):**
   - ✅ Feed max-width ~700px
   - ✅ Content centered

---

### Step 10: Performance Check ⚡

1. **Open Network tab** (F12 → Network)
2. **Refresh Hue page**
3. **Check initial load:**
   - ✅ Stories query: Should be fast (<50ms)
   - ✅ Feed query: Should be fast (<100ms)
   - ✅ Images: Should lazy load (only when scrolled into view)

4. **Scroll feed:**
   - ✅ Videos load only when near viewport
   - ✅ No massive data transfers
   - ✅ Smooth scrolling (no jank)

5. **Check console:**
   - ✅ No errors
   - ✅ No warnings

---

## 🎯 Success Criteria

You're done when ALL of these are true:

- [ ] Database has `post_type` and `expires_at` columns
- [ ] Upload modal shows Wall/Story toggle
- [ ] Can post stories with media (required)
- [ ] Can post wall posts with/without media
- [ ] Stories appear in circles at top
- [ ] Stories have pulsing border effect
- [ ] Wall posts appear in main feed
- [ ] Videos auto-play when scrolled into view
- [ ] Videos pause when scrolled away
- [ ] Infinite scroll loads more posts
- [ ] "You've reached the end" shows at end
- [ ] Pull to refresh works
- [ ] Stories expire after 24 hours
- [ ] Mobile responsive (test 375px, 768px, 1920px)
- [ ] No console errors
- [ ] Smooth performance

---

## 🐛 If Something Goes Wrong

### Upload Modal Not Showing Toggle
**Check:** File was edited correctly
```bash
grep -n "postType" /workspaces/6713/components/UploadModal.tsx
```
Should show multiple matches including `setPostType`

### Stories Not Appearing
**Check:** Migration ran successfully
```sql
SELECT * FROM wall_messages WHERE post_type = 'story';
```
**Check:** Story hasn't expired
```sql
SELECT id, expires_at, expires_at > NOW() as is_active 
FROM wall_messages 
WHERE post_type = 'story';
```

### Videos Not Auto-Playing
**Check:** Browser console for errors
**Try:** Manually unmute video (browsers block muted autoplay)
**Verify:** Video element has `muted` and `playsInline` attributes

### Infinite Scroll Not Working
**Check:** Sentinel element exists
```bash
grep -n "observerRef" /workspaces/6713/app/hue/page.tsx
```
**Check:** hasMore is true
- Open React DevTools
- Find Hue component
- Check `hasMore` state

### Database Column Missing
**Re-run migration:**
```sql
ALTER TABLE wall_messages ADD COLUMN post_type TEXT DEFAULT 'wall';
ALTER TABLE wall_messages ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;
```

---

## 📊 Quick Database Checks

### Count Stories
```sql
SELECT COUNT(*) FROM wall_messages WHERE post_type = 'story';
```

### Count Active Stories
```sql
SELECT COUNT(*) FROM wall_messages 
WHERE post_type = 'story' AND expires_at > NOW();
```

### Count Wall Posts
```sql
SELECT COUNT(*) FROM wall_messages WHERE post_type = 'wall';
```

### View Recent Posts
```sql
SELECT 
  username, 
  post_type, 
  SUBSTRING(content, 1, 50) as preview,
  created_at,
  expires_at
FROM wall_messages 
ORDER BY created_at DESC 
LIMIT 10;
```

---

## 🎉 When You're Done

Congratulations! You now have:
- ✅ Instagram/TikTok-style Stories
- ✅ Infinite scroll feed
- ✅ Auto-playing videos
- ✅ Mixed content types
- ✅ Mobile responsive design
- ✅ Pull-to-refresh
- ✅ 24-hour story expiration

**Next steps:**
1. Share with users
2. Monitor engagement
3. Optimize "For You" algorithm
4. Add story viewer modal
5. Build analytics dashboard

---

## 📚 Documentation Reference

- **Full Guide:** [HUE_IMPLEMENTATION_GUIDE.md](HUE_IMPLEMENTATION_GUIDE.md)
- **Quick Ref:** [HUE_QUICK_REFERENCE.md](HUE_QUICK_REFERENCE.md)
- **Architecture:** [HUE_ARCHITECTURE.md](HUE_ARCHITECTURE.md)
- **Summary:** [HUE_COMPLETE_SUMMARY.md](HUE_COMPLETE_SUMMARY.md)

---

**Need help?** Check the troubleshooting section above or review the full implementation guide.

**Ready to build more?** Check out the "Future Enhancements" section in the implementation guide!

🚀 **Happy building!**
