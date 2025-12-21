# 📸 Media Upload Setup Guide

## ✅ What Was Implemented

### 1. **Refactored Navigation** ([components/Navigation.tsx](../components/Navigation.tsx))
- ✅ Hamburger menu icon (left) that toggles a sidebar
- ✅ Sidebar contains: Hue, Wall, Live, $$$4U
- ✅ Upload button (right) for verified users
- ✅ Opens upload modal on click

### 2. **Upload Modal** ([components/UploadModal.tsx](../components/UploadModal.tsx))
- ✅ Text area for post content
- ✅ File input for images/videos
- ✅ Loading state during upload
- ✅ Error handling with user feedback
- ✅ File validation (type and size)

### 3. **Supabase Storage Integration**
- ✅ Uploads to `media` bucket
- ✅ Generates unique filenames using `userId-timestamp-random`
- ✅ Gets public URL after upload
- ✅ Inserts into `wall_messages` with media URL

## 🛠️ Required Setup in Supabase Dashboard

### Step 1: Create Storage Bucket
1. Open your Supabase project dashboard
2. Click **Storage** in the left sidebar
3. Click **"New bucket"**
4. Name it: `media`
5. Select **"Public bucket"** (so images are viewable)
6. Click **"Create bucket"**

### Step 2: Apply Storage Policies
1. Go to **SQL Editor** in Supabase
2. Run the file: [database/storage-policies.sql](storage-policies.sql)
3. This creates RLS policies:
   - ✅ Public can view/download media
   - ✅ Authenticated users can upload
   - ✅ Users can manage their own uploads
   - ✅ Admins have full access

### Step 3: Verify Setup
Check that policies were created:
```sql
SELECT policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects';
```

You should see 5 policies for the `media` bucket.

## 🎯 How It Works

### Upload Flow:
1. **User clicks Upload button** → Opens modal
2. **User types message** → Optional text content
3. **User selects file** → Image or video (max 50MB)
4. **User clicks "Post to Wall"** → Triggers upload

### Behind the Scenes:
```
1. File → supabase.storage.from('media').upload()
   ↓
2. Get public URL → getPublicUrl()
   ↓
3. Insert into wall_messages table with:
   - user_id
   - username
   - content (text + media URL)
   - message_type ('picture' or 'voice')
```

## 📋 Data Flow Example

**When you upload an image with text "Hello World":**

```javascript
// Step 1: Upload file to storage
File: cat.jpg → Storage: media/user123-1234567890-abc123.jpg

// Step 2: Get public URL
URL: https://your-project.supabase.co/storage/v1/object/public/media/user123-1234567890-abc123.jpg

// Step 3: Insert into database
wall_messages:
{
  user_id: 'user123',
  username: 'YourName',
  content: 'Hello World\nhttps://your-project.supabase.co/storage/...',
  message_type: 'picture'
}
```

## 🔒 Security Features

- ✅ Only authenticated users can upload
- ✅ File type validation (images/videos only)
- ✅ File size limit (50MB max)
- ✅ Unique filenames prevent overwrites
- ✅ RLS policies protect storage
- ✅ Users can only delete their own media

## 🚀 Testing Your Upload

1. **Start your dev server:**
   ```bash
   npm run dev
   ```

2. **Login as a verified user**

3. **Click the Upload button** (top right)

4. **Add content:**
   - Type a message (optional)
   - Select an image or video

5. **Click "Post to Wall"**

6. **Check the Wall** - Your post should appear with the media

## ⚠️ Common Issues

### "Upload failed"
- ✅ Make sure the `media` bucket exists in Supabase
- ✅ Verify the bucket is set to **Public**
- ✅ Run the storage policies SQL script

### "File too large"
- ✅ Files must be under 50MB
- ✅ Adjust the limit in UploadModal.tsx if needed

### "Not authenticated"
- ✅ Make sure you're logged in
- ✅ Check your .env.local has the correct Supabase keys

### Media doesn't display on Wall
- ✅ Update your Wall component to parse and display media URLs
- ✅ Check that the bucket is Public (not private)

## 📝 Next Steps

Update the Wall component to properly display uploaded media:
- Parse content for media URLs
- Show images with `<img>` tags
- Show videos with `<video>` tags
- Add click-to-expand functionality

Would you like me to update the Wall component to display the uploaded media?
