import { NextResponse } from 'next/server';
import { stripe } from '@/utils/stripe';
import { verifyToken, requireOrgIdFromToken, userRolesServer } from '../../../helpers';
import clientPromise from '@/app/api/lib/mongodb';
import { DATABASE_NAME } from '@/app/api/config';
import { ObjectId } from 'mongodb';

export async function GET(request: Request) {
  const { decoded, error, status } = await verifyToken(request);
  if (error) return NextResponse.json({ error }, { status });

  try {
    const org_id = requireOrgIdFromToken(decoded);
    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const organizationsCollection = db.collection('organizations');

    const organization = await organizationsCollection.findOne({ _id: new ObjectId(org_id) });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    if (!organization.subscription_id) {
       return NextResponse.json({ status: 'inactive', message: 'No active subscription found' });
    }

    const subscription = await stripe.subscriptions.retrieve(organization.subscription_id, {
      expand: ['items.data.price.product'],
    }) as any;

    const price = subscription.items.data[0].price;
    const product = price.product;

    return NextResponse.json({
      id: subscription.id,
      status: subscription.status,
      planName: product.name,
      amount: price.unit_amount,
      currency: price.currency,
      interval: price.recurring?.interval,
      currentPeriodEnd: subscription.current_period_end,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      trialEnd: subscription.trial_end,
    });

  } catch (error: any) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json({ error: 'Failed to fetch subscription details' }, { status: 500 });
  }
}

// Cancel Subscription (at period end)
export async function DELETE(request: Request) {
    const { decoded, error, status } = await verifyToken(request, userRolesServer.admin);
    if (error) return NextResponse.json({ error }, { status });

    try {
        const org_id = requireOrgIdFromToken(decoded);
        const url = new URL(request.url);
        const targetSubscriptionId = url.searchParams.get('subscriptionId');

        const client = await clientPromise;
        const db = client.db(DATABASE_NAME);
        const organizationsCollection = db.collection('organizations');

        const organization = await organizationsCollection.findOne({ _id: new ObjectId(org_id) });

        if (!organization) {
             return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
        }

        let subscriptionIdToCancel = targetSubscriptionId;

        if (!subscriptionIdToCancel) {
            subscriptionIdToCancel = organization.subscription_id;
        }

        if (!subscriptionIdToCancel) {
             return NextResponse.json({ error: 'No active subscription found to cancel' }, { status: 404 });
        }

        const isMain = organization.subscription_id === subscriptionIdToCancel;
        const isAddon = organization.addons?.some((a: any) => a.subscriptionId === subscriptionIdToCancel);

        if (!isMain && !isAddon) {
             return NextResponse.json({ error: 'Subscription not found or does not belong to organization' }, { status: 403 });
        }

        const subscription = await stripe.subscriptions.update(subscriptionIdToCancel, {
            cancel_at_period_end: true,
        }) as any;

        return NextResponse.json({ 
            message: 'Subscription scheduled for cancellation',
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            currentPeriodEnd: subscription.current_period_end 
        });

    } catch (error: any) {
        console.error('Error canceling subscription:', error);
        return NextResponse.json({ error: 'Failed to cancel subscription' }, { status: 500 });
    }
}

// Resume Subscription
export async function PUT(request: Request) {
    const { decoded, error, status } = await verifyToken(request, userRolesServer.admin);
    if (error) return NextResponse.json({ error }, { status });

    try {
        const org_id = requireOrgIdFromToken(decoded);
        const client = await clientPromise;
        const db = client.db(DATABASE_NAME);
        const organizationsCollection = db.collection('organizations');

        const organization = await organizationsCollection.findOne({ _id: new ObjectId(org_id) });

        if (!organization || !organization.subscription_id) {
             return NextResponse.json({ error: 'No active subscription found to resume' }, { status: 404 });
        }

        const subscription = await stripe.subscriptions.update(organization.subscription_id, {
            cancel_at_period_end: false,
        }) as any;

        return NextResponse.json({ 
            message: 'Subscription resumed',
            cancelAtPeriodEnd: subscription.cancel_at_period_end 
        });

    } catch (error: any) {
        console.error('Error resuming subscription:', error);
        return NextResponse.json({ error: 'Failed to resume subscription' }, { status: 500 });
    }
}
