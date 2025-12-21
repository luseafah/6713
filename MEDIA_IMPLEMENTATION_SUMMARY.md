# 📸 Media Upload Implementation - Quick Reference

## ✅ Changes Made

### 1. Database Schema
**File:** `database/schema.sql`
```sql
ALTER TABLE wall_messages ADD COLUMN media_url TEXT;
```

### 2. Upload Function
**File:** `components/UploadModal.tsx`
```typescript
// Upload to 'media' bucket
await supabase.storage.from('media').upload(fileName, file);

// Get public URL
const { data } = supabase.storage.from('media').getPublicUrl(fileName);

// Store in database
await supabase.from('wall_messages').insert({
  content: userText,
  media_url: data.publicUrl,  // ✅ Separate column
  message_type: 'picture'
});
```

### 3. Display Components

**Wall.tsx** - Inline display
```tsx
{message.media_url && (
  <img src={message.media_url} className="w-full rounded-lg" />
)}
```

**WallFeed.tsx** - Masonry grid (NEW)
```tsx
<div className="columns-2 md:columns-3 lg:columns-4 gap-4">
  <div className="break-inside-avoid">
    {/* Card content */}
  </div>
</div>
```

## 🎯 Key Implementation Points

| Aspect | Implementation |
|--------|----------------|
| **Bucket Name** | Exactly `'media'` |
| **Upload Method** | `supabase.storage.from('media').upload()` |
| **URL Method** | `supabase.storage.from('media').getPublicUrl()` |
| **DB Column** | `media_url TEXT` (separate from content) |
| **File Types** | Images: jpg, png, gif, webp / Videos: mp4, webm |
| **Size Limit** | 50MB |
| **Bucket Type** | Public (public: true) |

## 🚀 Migration Command

Run in Supabase SQL Editor:
```sql
ALTER TABLE wall_messages ADD COLUMN IF NOT EXISTS media_url TEXT;
```

Or use the migration file:
```bash
psql $DATABASE_URL -f database/migration-add-media-url.sql
```

## 🎨 Masonry Grid Classes

```tsx
columns-2       // 2 columns on mobile
md:columns-3    // 3 columns on tablet
lg:columns-4    // 4 columns on desktop
gap-4           // Space between columns
break-inside-avoid  // �� Prevents card splitting
```

## 📦 Files Modified/Created

- ✅ `database/schema.sql` - Added media_url column
- ✅ `database/migration-add-media-url.sql` - Migration script
- ✅ `components/UploadModal.tsx` - Updated to use media_url
- ✅ `components/Wall.tsx` - Added media display
- ✅ `components/WallFeed.tsx` - NEW masonry component
- ✅ `types/database.ts` - Added media_url to interface
- ✅ `MEDIA_WALL_GUIDE.md` - Full documentation

## 🧪 Test Checklist

- [ ] Upload image → check media_url in database
- [ ] Upload video → check plays with controls
- [ ] View in Wall.tsx → displays inline
- [ ] View in WallFeed.tsx → masonry grid works
- [ ] Mobile responsive → columns adjust correctly
- [ ] Public access → URLs work without login (if bucket is public)

## 🔒 Storage RLS (Already Applied)

```sql
-- Public read access
CREATE POLICY "Public Access" ON storage.objects FOR SELECT
  USING (bucket_id = 'media');

-- Authenticated upload
CREATE POLICY "Authenticated Upload" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'media' AND auth.role() = 'authenticated');
```

---

**Status:** ✅ Complete and ready to use!

**Next:** Apply migration → Test upload → Use WallFeed component
