import { NextResponse } from 'next/server';
import { stripe } from '@/utils/stripe';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items.data.price.product', 'subscription'],
    });

    const subscription = session.subscription as any;
    const lineItem = session.line_items?.data[0];
    const price = lineItem?.price;
    const product = price?.product as any;

    // Check if this is a new signup
    const isNewSignup = session.metadata?.signupType === 'new_organization';

    return NextResponse.json({
      amount_total: session.amount_total,
      currency: session.currency,
      status: session.status,
      customer_email: session.customer_details?.email,
      planName: product?.name,
      amount: price?.unit_amount,
      interval: price?.recurring?.interval,
      trialEnd: subscription?.trial_end,
      nextBillingDate: subscription?.current_period_end,
      isNewSignup,
    });
  } catch (error: any) {
    console.error('Error retrieving session:', error);
    return NextResponse.json({ error: 'Failed to retrieve session' }, { status: 500 });
  }
}
