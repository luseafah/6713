import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature') || '';

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }

  // Handle the event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    const userId = session.client_reference_id;
    const talents = parseInt(session.metadata?.talents || '0');
    const amountUsd = (session.amount_total || 0) / 100;

    if (!userId || !talents) {
      console.error('Missing userId or talents in webhook');
      return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    }

    try {
      // Call Supabase RPC function to credit talents
      const { data, error } = await supabase.rpc('process_talent_purchase', {
        p_user_id: userId,
        p_payment_intent_id: session.payment_intent as string,
        p_amount_usd: amountUsd,
        p_talents: talents,
      });

      if (error) throw error;

      console.log('Talents credited successfully:', data);
    } catch (err: any) {
      console.error('Error crediting talents:', err);
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
