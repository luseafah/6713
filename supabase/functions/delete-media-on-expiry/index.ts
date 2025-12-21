// Supabase Edge Function: Storage Reaper
// Automatically deletes media files when database rows are deleted
// Deploy: supabase functions deploy delete-media-on-expiry

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get unprocessed media deletion queue
    const { data: queuedMedia, error: fetchError } = await supabase
      .from('deleted_media_queue')
      .select('*')
      .eq('processed', false)
      .limit(100) // Process in batches

    if (fetchError) {
      throw new Error(`Failed to fetch queue: ${fetchError.message}`)
    }

    if (!queuedMedia || queuedMedia.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: 'No media to delete',
          deleted: 0 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    const results = {
      success: [] as string[],
      failed: [] as string[],
      total: queuedMedia.length
    }

    // Process each media file
    for (const item of queuedMedia) {
      try {
        // Extract file path from full URL
        // URL format: https://[project].supabase.co/storage/v1/object/public/media/[filepath]
        const url = new URL(item.media_url)
        const pathParts = url.pathname.split('/media/')
        
        if (pathParts.length < 2) {
          console.error('Invalid media URL format:', item.media_url)
          results.failed.push(item.media_url)
          continue
        }
        
        const filePath = pathParts[1]

        // Delete from storage bucket
        const { error: deleteError } = await supabase.storage
          .from('media')
          .remove([filePath])

        if (deleteError) {
          console.error(`Failed to delete ${filePath}:`, deleteError)
          results.failed.push(item.media_url)
        } else {
          console.log(`✓ Deleted: ${filePath}`)
          results.success.push(item.media_url)
          
          // Mark as processed
          await supabase
            .from('deleted_media_queue')
            .update({ processed: true })
            .eq('id', item.id)
        }
      } catch (err) {
        console.error(`Error processing ${item.media_url}:`, err)
        results.failed.push(item.media_url)
      }
    }

    // Clean up processed entries older than 7 days
    await supabase
      .from('deleted_media_queue')
      .delete()
      .eq('processed', true)
      .lt('deleted_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

    return new Response(
      JSON.stringify({
        message: 'Media cleanup complete',
        ...results
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Edge function error:', error)
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
