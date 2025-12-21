# 🗑️ Genesis Cleanup - Ephemeral Architecture

## Overview

The 6713 Protocol now features automatic content expiration to control costs, increase engagement, and maintain privacy.

---

## ⏰ Expiration Rules

| Content Type | Lifespan | Reason |
|-------------|----------|--------|
| **Stories** | 24 hours | FOMO effect, daily engagement |
| **Wall Posts** | 3 days (72 hours) | Fresh content cycle |
| **Pope AI Messages** | Permanent | Protocol history |
| **System Messages** | Permanent | Critical data |
| **ID Verifications** | Permanent | Account security |
| **Coma Links** | Permanent | User state tracking |

---

## 🏗️ Architecture

### 1. Database Triggers (Automatic)

**Expiry Assignment:**
```sql
-- Automatically set expires_at on insert
CREATE TRIGGER trigger_set_message_expiry
  BEFORE INSERT OR UPDATE ON wall_messages
  FOR EACH ROW
  EXECUTE FUNCTION set_message_expiry();
```

**Logic:**
- Stories → `created_at + 24 hours`
- Wall posts → `created_at + 3 days`
- Pope AI / System → `NULL` (never expires)

**Media Queue:**
```sql
-- Queue media files for deletion when message is deleted
CREATE TRIGGER trigger_queue_media_deletion
  AFTER DELETE ON wall_messages
  FOR EACH ROW
  EXECUTE FUNCTION queue_media_deletion();
```

### 2. Cleanup Functions

**Manual Cleanup:**
```sql
-- Call this to delete expired messages
SELECT * FROM cleanup_expired_messages();
```

**Returns:**
- `deleted_count` - Number of messages removed
- `media_urls_queued` - Number of files queued for deletion

### 3. Edge Functions (Automated)

**Two-Stage Process:**

#### Stage 1: Delete Expired Messages
```bash
# Runs daily via cron
supabase functions invoke cleanup-expired-content
```

#### Stage 2: Delete Media Files
```bash
# Triggered automatically or manually
supabase functions invoke delete-media-on-expiry
```

---

## 📦 Implementation Steps

### Step 1: Apply Database Migration

```bash
# Run in Supabase SQL Editor
psql $DATABASE_URL -f database/migration-ephemeral.sql
```

Or copy the contents of [migration-ephemeral.sql](../database/migration-ephemeral.sql) to Supabase Dashboard.

### Step 2: Deploy Edge Functions

```bash
# Install Supabase CLI if needed
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref YOUR_PROJECT_ID

# Deploy functions
supabase functions deploy cleanup-expired-content
supabase functions deploy delete-media-on-expiry
```

### Step 3: Set Up Cron Job

In Supabase Dashboard → Database → Cron Jobs:

```sql
-- Run cleanup daily at 3 AM UTC
SELECT cron.schedule(
  'cleanup-expired-content',
  '0 3 * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT.supabase.co/functions/v1/cleanup-expired-content',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    )
  );
  $$
);
```

### Step 4: Verify Setup

```sql
-- Check triggers exist
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE event_object_table = 'wall_messages';

-- Check expiry distribution
SELECT 
  post_type,
  is_permanent,
  COUNT(*) as count,
  AVG(EXTRACT(EPOCH FROM (expires_at - created_at))/3600)::INTEGER as avg_hours_until_expiry
FROM wall_messages
GROUP BY post_type, is_permanent;
```

---

## 🎮 Usage

### Creating Content

**Normal Wall Post (3-day expiry):**
```typescript
await supabase.from('wall_messages').insert({
  content: 'My post',
  post_type: 'wall'
  // expires_at is auto-set to NOW() + 3 days
});
```

**Story (24-hour expiry):**
```typescript
await supabase.from('wall_messages').insert({
  content: 'My story',
  post_type: 'story',
  media_url: 'https://...'
  // expires_at is auto-set to NOW() + 24 hours
});
```

**Permanent Content:**
```typescript
await supabase.from('wall_messages').insert({
  content: 'Pope AI message',
  is_permanent: true
  // expires_at is NULL
});
```

### Manual Cleanup

```sql
-- Delete expired messages now
SELECT * FROM cleanup_expired_messages();

-- View queued media deletions
SELECT * FROM deleted_media_queue WHERE processed = FALSE;
```

### Check Expiring Content

```sql
-- Content expiring in next 24 hours
SELECT id, username, content, expires_at
FROM wall_messages
WHERE expires_at BETWEEN NOW() AND NOW() + INTERVAL '24 hours'
ORDER BY expires_at ASC;

-- Already expired (ready for cleanup)
SELECT COUNT(*) as expired_count
FROM wall_messages
WHERE expires_at < NOW() AND is_permanent = FALSE;
```

---

## 🎙️ Live Stream DVR Rules

### 30-Minute Buffer Implementation

**Database Structure:**
```sql
CREATE TABLE live_streams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  is_live BOOLEAN DEFAULT TRUE,
  stream_key TEXT UNIQUE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  
  -- DVR settings
  dvr_window_minutes INTEGER DEFAULT 30,
  auto_delete_on_end BOOLEAN DEFAULT TRUE
);

-- Segments table for HLS chunks
CREATE TABLE stream_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id UUID REFERENCES live_streams(id) ON DELETE CASCADE,
  segment_url TEXT NOT NULL,
  duration_seconds INTEGER,
  sequence_number INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Auto-delete segments older than 30 minutes
CREATE INDEX idx_stream_segments_cleanup 
ON stream_segments(stream_id, created_at)
WHERE created_at < NOW() - INTERVAL '30 minutes';
```

**Cleanup Trigger:**
```sql
-- Delete old segments when new ones are added
CREATE OR REPLACE FUNCTION cleanup_old_segments()
RETURNS TRIGGER AS $$
BEGIN
  -- Keep only last 30 minutes of segments
  DELETE FROM stream_segments
  WHERE stream_id = NEW.stream_id
    AND created_at < NOW() - INTERVAL '30 minutes';
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_cleanup_old_segments
  AFTER INSERT ON stream_segments
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_old_segments();
```

**Stream End Cleanup:**
```sql
CREATE OR REPLACE FUNCTION cleanup_stream_on_end()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_live = FALSE AND OLD.is_live = TRUE THEN
    -- Stream just ended, queue all segments for deletion
    INSERT INTO deleted_media_queue (media_url)
    SELECT segment_url FROM stream_segments
    WHERE stream_id = NEW.id;
    
    -- Delete segment records
    DELETE FROM stream_segments WHERE stream_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_cleanup_stream_on_end
  AFTER UPDATE ON live_streams
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_stream_on_end();
```

### Client-Side Implementation

```typescript
// LiveStream component with 30-minute DVR
import Hls from 'hls.js';

const LivePlayer = ({ streamUrl }: { streamUrl: string }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  
  useEffect(() => {
    if (!videoRef.current) return;
    
    const hls = new Hls({
      // Only keep 30 minutes of segments
      maxBufferLength: 30 * 60, // 30 minutes in seconds
      maxMaxBufferLength: 30 * 60,
      
      // Aggressive cleanup
      backBufferLength: 30 * 60,
      
      // Start from live edge
      liveSyncDuration: 3,
      liveMaxLatencyDuration: 10
    });
    
    hls.loadSource(streamUrl);
    hls.attachMedia(videoRef.current);
    
    return () => hls.destroy();
  }, [streamUrl]);
  
  return (
    <video 
      ref={videoRef}
      controls
      className="w-full"
      playsInline
    />
  );
};
```

---

## 💰 Cost Impact

### Before (No Expiration)
- **Storage:** 10GB of old posts = ~$0.20/month
- **Bandwidth:** Users viewing old content = $0.10/GB
- **Database:** Millions of rows = slow queries

### After (Ephemeral)
- **Storage:** <1GB active content = ~$0.02/month
- **Bandwidth:** Only fresh content viewed = minimal
- **Database:** Fast queries, small footprint

**Estimated Savings:** ~90% reduction in storage costs

---

## 📊 Engagement Benefits

### FOMO Effect
- **24-hour stories** → Users check daily
- **3-day wall posts** → Fresh feed constantly
- **Live 30-min DVR** → Must watch live

### Metrics to Track
```sql
-- Daily active users (should increase)
SELECT DATE(created_at) as date, COUNT(DISTINCT user_id) as dau
FROM wall_messages
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY date
ORDER BY date DESC;

-- Post frequency (should increase with FOMO)
SELECT DATE(created_at) as date, COUNT(*) as posts_per_day
FROM wall_messages
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY date
ORDER BY date DESC;

-- Engagement velocity (views per hour of freshness)
SELECT 
  EXTRACT(HOUR FROM NOW() - created_at) as hours_old,
  AVG(reaction_count) as avg_reactions
FROM wall_messages
WHERE created_at > NOW() - INTERVAL '3 days'
GROUP BY hours_old
ORDER BY hours_old;
```

---

## 🐛 Troubleshooting

### Messages Not Expiring
```sql
-- Check if trigger is active
SELECT * FROM pg_trigger WHERE tgname = 'trigger_set_message_expiry';

-- Manually update expires_at for existing posts
UPDATE wall_messages 
SET expires_at = created_at + INTERVAL '3 days'
WHERE post_type = 'wall' AND expires_at IS NULL AND is_permanent = FALSE;
```

### Media Not Deleting
```sql
-- Check deletion queue
SELECT * FROM deleted_media_queue WHERE processed = FALSE;

-- Manually trigger media deletion
SELECT net.http_post(
  url := 'https://YOUR_PROJECT.supabase.co/functions/v1/delete-media-on-expiry',
  headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'
);
```

### Cron Job Not Running
```sql
-- Check cron job status
SELECT * FROM cron.job WHERE jobname = 'cleanup-expired-content';

-- Check cron job logs
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'cleanup-expired-content')
ORDER BY start_time DESC LIMIT 10;
```

---

## ✅ Verification Checklist

- [ ] Migration applied successfully
- [ ] Triggers created (check `pg_trigger`)
- [ ] Edge functions deployed
- [ ] Cron job scheduled
- [ ] Test story expires after 24h
- [ ] Test wall post expires after 3 days
- [ ] Test Pope AI messages stay permanent
- [ ] Media deletion queue working
- [ ] Storage bucket size decreasing

---

## 🚀 Next Steps

1. **Monitor Storage Usage:** Track bucket size daily
2. **Optimize Cron Schedule:** Adjust based on traffic patterns
3. **Add Analytics:** Track engagement before/after expiration
4. **User Notifications:** "Your post expires in 1 hour"
5. **Premium Option:** "Save posts forever" upgrade

---

**Status:** Production-ready ephemeral architecture
**Cost Savings:** ~90% reduction
**Engagement Boost:** FOMO effect active

🗑️ **Genesis Cleanup is live!**
