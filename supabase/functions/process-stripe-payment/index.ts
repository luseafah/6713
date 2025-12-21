// Supabase Edge Function: Process Stripe Payments
// Deploy: supabase functions deploy process-stripe-payment

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@12.18.0?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  try {
    // CORS headers
    if (req.method === 'OPTIONS') {
      return new Response('ok', {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        },
      })
    }

    const { paymentIntentId, userId } = await req.json()

    if (!paymentIntentId || !userId) {
      throw new Error('Missing required parameters')
    }

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    if (paymentIntent.status !== 'succeeded') {
      throw new Error('Payment not succeeded')
    }

    // Calculate talents based on amount (divide by 1.5 cents, multiply by 100)
    const amountUsd = paymentIntent.amount / 100 // Convert cents to dollars
    const talents = Math.floor((amountUsd / 1.50) * 100)

    // Initialize Supabase client with service role key (bypasses RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Call process_talent_purchase function
    const { data, error } = await supabase.rpc('process_talent_purchase', {
      p_user_id: userId,
      p_payment_intent_id: paymentIntentId,
      p_amount_usd: amountUsd,
      p_talents: talents,
    })

    if (error) throw error

    return new Response(
      JSON.stringify({
        success: true,
        talents_credited: talents,
        new_balance: data.new_balance,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  }
})
