// Supabase Edge Function: Cleanup Expired Content
// Runs on schedule to delete expired messages and trigger media cleanup
// Deploy: supabase functions deploy cleanup-expired-content

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log('🗑️  Starting cleanup process...')

    // Call the database cleanup function
    const { data, error } = await supabase.rpc('cleanup_expired_messages')

    if (error) {
      throw new Error(`Cleanup failed: ${error.message}`)
    }

    const result = data?.[0] || { deleted_count: 0, media_urls_queued: 0 }

    console.log(`✓ Deleted ${result.deleted_count} expired messages`)
    console.log(`✓ Queued ${result.media_urls_queued} media files for deletion`)

    // Trigger media deletion edge function
    if (result.media_urls_queued > 0) {
      console.log('🔄 Triggering media deletion...')
      
      const mediaCleanupUrl = `${supabaseUrl}/functions/v1/delete-media-on-expiry`
      const mediaResponse = await fetch(mediaCleanupUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        }
      })

      const mediaResult = await mediaResponse.json()
      console.log('✓ Media cleanup result:', mediaResult)

      return new Response(
        JSON.stringify({
          message: 'Cleanup complete',
          messages_deleted: result.deleted_count,
          media_cleanup: mediaResult
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    return new Response(
      JSON.stringify({
        message: 'Cleanup complete',
        messages_deleted: result.deleted_count,
        media_queued: result.media_urls_queued
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Cleanup error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        stack: error.stack 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
