import { NextRequest, NextResponse } from 'next/server';

// Stripe payment processing disabled - not needed for admin testing
export async function POST(req: NextRequest) {
  return NextResponse.json({ error: 'Stripe integration disabled' }, { status: 501 });
}
  try {
    const { packageId, userId, talents, priceUsd } = await req.json();

    if (!packageId || !userId || !talents || !priceUsd) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${talents} Talents`,
              description: '6713 Protocol Talent Package',
              images: ['https://your-domain.com/talent-icon.png'],
            },
            unit_amount: Math.round(priceUsd * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment-cancelled`,
      client_reference_id: userId,
      metadata: {
        userId,
        packageId,
        talents: talents.toString(),
      },
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (error: any) {
    console.error('Stripe session creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
