# 🎯 Media Upload Implementation - Action Checklist

## Step 1: Apply Database Migration ⚡

Run this SQL in your Supabase SQL Editor:

```sql
-- Add media_url column to wall_messages table
ALTER TABLE wall_messages ADD COLUMN IF NOT EXISTS media_url TEXT;
```

**Verify it worked:**
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'wall_messages' 
ORDER BY ordinal_position;
```

You should see `media_url` with type `text` in the results.

---

## Step 2: Verify Storage Bucket Setup ✅

1. Go to Supabase Dashboard → Storage
2. Confirm bucket named **`media`** exists
3. Check that bucket is **Public** (toggle should be ON)
4. Go to Policies tab and verify RLS policies are applied

**Expected Policies:**
- ✅ "Public Access" - SELECT for all users
- ✅ "Authenticated Upload" - INSERT for authenticated users
- ✅ "Users Delete Own" - DELETE for file owners

---

## Step 3: Test Upload Functionality 🧪

1. **Open your app** and navigate to the Wall
2. **Click the upload/+ button** to open UploadModal
3. **Select an image** (jpg, png, gif, or webp)
4. **Add optional text** message
5. **Click "Post to Wall"**

**Expected Result:**
- ✅ Upload completes without errors
- ✅ Message appears on the wall with image
- ✅ Image loads and displays correctly

---

## Step 4: Verify Database Entry 📊

In Supabase → Table Editor → wall_messages:

Check the latest row has:
- ✅ `content` = your text message
- ✅ `media_url` = a URL like `https://[project].supabase.co/storage/v1/object/public/media/[filename]`
- ✅ `message_type` = 'picture' (or 'voice' for video)

**Test the URL:**
- Copy the `media_url` value
- Paste it in a new browser tab
- Image should display directly

---

## Step 5: Test Video Upload 🎥

1. **Repeat Step 3** but select a video file (mp4 or webm)
2. **Post to wall**

**Expected Result:**
- ✅ Video appears with playback controls
- ✅ Can play/pause/seek through video
- ✅ `message_type` in database = 'voice'

---

## Step 6: Use the Masonry Grid Component 🎨

**Option A: Replace existing Wall**

In `app/wall/page.tsx`:
```tsx
import WallFeed from '@/components/WallFeed';

export default function WallPage() {
  return <WallFeed />;
}
```

**Option B: Create new page**

Create `app/gallery/page.tsx`:
```tsx
import WallFeed from '@/components/WallFeed';

export default function GalleryPage() {
  return (
    <div className="min-h-screen bg-black">
      <h1 className="text-4xl font-bold text-white text-center py-8">
        Media Gallery
      </h1>
      <WallFeed />
    </div>
  );
}
```

**Test the masonry grid:**
- ✅ Cards arrange in columns (2 on mobile, 3 on tablet, 4 on desktop)
- ✅ No weird gaps or card splitting
- ✅ Images maintain aspect ratio
- ✅ Hover effects work
- ✅ Auto-refreshes every 3 seconds

---

## Step 7: Mobile Testing 📱

**Test on different screen sizes:**

1. **Open browser DevTools** (F12)
2. **Enable device toolbar** (Ctrl+Shift+M or Cmd+Shift+M)
3. **Test these breakpoints:**
   - Mobile (375px) → 2 columns
   - Tablet (768px) → 3 columns
   - Desktop (1024px) → 4 columns

**Expected Results:**
- ✅ Layout adjusts smoothly
- ✅ Images scale properly
- ✅ No horizontal scrolling
- ✅ Upload modal is responsive

---

## Step 8: Edge Cases Testing 🔍

### Test 1: Text-only post
- [ ] Post without selecting a file
- [ ] Verify `media_url` is NULL in database
- [ ] Verify post displays correctly (no broken image)

### Test 2: Large file
- [ ] Try uploading a 60MB file
- [ ] Should show error: "File size must be less than 50MB"

### Test 3: Invalid file type
- [ ] Try uploading a .txt or .pdf file
- [ ] Should show error: "Please select a valid image or video file"

### Test 4: No content
- [ ] Try posting with neither text nor file
- [ ] Submit button should be disabled

### Test 5: Long text
- [ ] Post a very long message (1000+ characters)
- [ ] Verify text displays properly without breaking layout

---

## Step 9: Performance Check ⚡

1. **Upload multiple images** (5-10)
2. **Check page load time**
3. **Verify images lazy load** (only load when scrolling into view)
4. **Check network tab** for image optimization

**Expected Results:**
- ✅ Images load progressively
- ✅ No layout shift as images load
- ✅ Page stays responsive with many images

---

## Step 10: Clean Up & Document 📝

- [ ] Remove any test posts from database (optional)
- [ ] Update your project README with media upload instructions
- [ ] Add link to MEDIA_WALL_GUIDE.md in main README
- [ ] Commit all changes to git

```bash
git add .
git commit -m "feat: Add media upload with masonry grid display"
git push
```

---

## 🐛 Troubleshooting

### Upload fails with "Bucket not found"
**Solution:** Create the 'media' bucket in Supabase Dashboard

### Images don't display
**Solution:** 
1. Check bucket is public
2. Verify RLS policies allow SELECT
3. Test the media_url directly in browser

### Masonry grid has gaps
**Solution:** Ensure `break-inside-avoid` class is on each card

### Upload button disabled
**Solution:** You need either text content OR a file selected (or both)

### Videos won't play
**Solution:** 
1. Check file format (mp4/webm only)
2. Ensure `controls` attribute is on `<video>` tag
3. Verify video file isn't corrupted

---

## ✅ Success Criteria

You're done when:
- [x] Database has `media_url` column
- [x] Can upload images and videos
- [x] Media displays in Wall.tsx
- [x] WallFeed.tsx shows masonry grid
- [x] Mobile responsive works
- [x] No console errors
- [x] All edge cases handled

---

## 📚 Reference Documents

- **Full Guide:** [MEDIA_WALL_GUIDE.md](MEDIA_WALL_GUIDE.md)
- **Quick Reference:** [MEDIA_IMPLEMENTATION_SUMMARY.md](MEDIA_IMPLEMENTATION_SUMMARY.md)
- **Original Guide:** [database/MEDIA_UPLOAD_GUIDE.md](database/MEDIA_UPLOAD_GUIDE.md)

---

**Questions or issues?** Check the troubleshooting section above or review the full guide.

**Happy uploading! 🎉📸**
