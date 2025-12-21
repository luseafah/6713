# 🗑️ Genesis Cleanup - Quick Start

## ⏰ Expiration Rules

| Type | Expires | Example |
|------|---------|---------|
| **Story** | 24 hours | "Just posted this!" |
| **Wall Post** | 3 days | "My thoughts on..." |
| **Pope AI** | Never | System messages |
| **Verification** | Never | ID checks |

---

## 🚀 Setup (3 Steps)

### 1. Apply Migration
```bash
# In Supabase SQL Editor
psql $DATABASE_URL -f database/migration-ephemeral.sql
```

### 2. Deploy Edge Functions
```bash
supabase functions deploy cleanup-expired-content
supabase functions deploy delete-media-on-expiry
```

### 3. Schedule Cron Job
```sql
-- Runs daily at 3 AM
SELECT cron.schedule(
  'cleanup-expired-content',
  '0 3 * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT.supabase.co/functions/v1/cleanup-expired-content',
    headers := '{"Authorization": "Bearer YOUR_SERVICE_KEY"}'
  );
  $$
);
```

---

## 🎯 How It Works

### Auto-Expiration Trigger
```sql
-- Automatically sets expires_at on insert
Stories → created_at + 24 hours
Wall → created_at + 3 days
Pope AI → NULL (permanent)
```

### Media Cleanup Flow
```
1. Message expires → Deleted from database
2. Trigger queues media_url for deletion
3. Edge function deletes file from storage
4. Queue marked as processed
```

---

## 🧪 Quick Test

```sql
-- Create a test post that expires in 1 minute
INSERT INTO wall_messages (user_id, username, content, expires_at)
VALUES (
  (SELECT id FROM users LIMIT 1),
  'TestUser',
  'This expires in 1 minute',
  NOW() + INTERVAL '1 minute'
);

-- Wait 1 minute, then run cleanup
SELECT * FROM cleanup_expired_messages();

-- Check if deleted
SELECT COUNT(*) FROM wall_messages WHERE content = 'This expires in 1 minute';
-- Should return 0
```

---

## 📊 Check Status

```sql
-- View expiring content
SELECT 
  post_type,
  COUNT(*) as count,
  MIN(expires_at) as next_expiry
FROM wall_messages
WHERE expires_at IS NOT NULL
GROUP BY post_type;

-- Check deletion queue
SELECT COUNT(*) FROM deleted_media_queue WHERE processed = FALSE;
```

---

## 🔧 Manual Operations

### Force Cleanup Now
```sql
SELECT * FROM cleanup_expired_messages();
```

### Delete Specific Media
```sql
INSERT INTO deleted_media_queue (media_url)
VALUES ('https://your-url.com/file.jpg');

-- Then trigger edge function
```

### Mark Content as Permanent
```sql
UPDATE wall_messages 
SET is_permanent = TRUE 
WHERE id = 'YOUR_MESSAGE_ID';
```

---

## 💰 Cost Benefits

**Before Cleanup:**
- 10GB storage = $0.20/month
- Old content viewed = bandwidth costs

**After Cleanup:**
- <1GB storage = $0.02/month
- Only fresh content = 90% savings

---

## 🎮 Live Stream DVR

### 30-Minute Buffer
- Viewers can rewind up to 30 minutes
- Old segments auto-delete
- Stream ends → all segments purged

### Implementation
```sql
-- Auto-delete segments older than 30 minutes
DELETE FROM stream_segments
WHERE created_at < NOW() - INTERVAL '30 minutes';
```

---

## ⚠️ Important Notes

✅ **Permanent Content:**
- Pope AI messages
- System notifications
- ID verifications
- Coma status logs

✅ **Ephemeral Content:**
- User stories (24h)
- Wall posts (3 days)
- Media files (when post deleted)
- Live stream segments (30min buffer)

---

## 🐛 Troubleshooting

**Problem:** Messages not expiring
```sql
-- Check trigger
SELECT * FROM pg_trigger WHERE tgname = 'trigger_set_message_expiry';
```

**Problem:** Media not deleting
```sql
-- Check queue
SELECT * FROM deleted_media_queue WHERE processed = FALSE;

-- Trigger manually
-- Visit: https://YOUR_PROJECT.supabase.co/functions/v1/delete-media-on-expiry
```

**Problem:** Cron not running
```sql
-- Check logs
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'cleanup-expired-content')
ORDER BY start_time DESC;
```

---

## 📚 Full Documentation

- **[GENESIS_CLEANUP_GUIDE.md](GENESIS_CLEANUP_GUIDE.md)** - Complete guide
- **[migration-ephemeral.sql](database/migration-ephemeral.sql)** - Database migration
- **Edge Functions:** `supabase/functions/`

---

**Status:** ✅ Ready to use
**Cost Savings:** ~90%
**Engagement:** FOMO effect active

🗑️ **Keep it fresh, keep it clean!**
