import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/utils/stripe';
import { ObjectId } from 'mongodb';
import clientPromise from '@/app/api/lib/mongodb';
import { DATABASE_NAME, STRIPE_WEBHOOK_SECRET } from '@/app/api/config';

export async function POST(request: Request) {
  const body = await request.text();
  const signature = headers().get('Stripe-Signature') as string;

  let event: Stripe.Event;

  try {
    if (!STRIPE_WEBHOOK_SECRET) {
        throw new Error('Stripe Webhook Secret is missing');
    }
    event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
  } catch (error: any) {
    console.error('Webhook signature verification failed:', error.message);
    return NextResponse.json({ error: `Webhook Error: ${error.message}` }, { status: 400 });
  }

  const client = await clientPromise;
  const db = client.db(DATABASE_NAME);
  const subscriptionsCollection = db.collection('subscriptions');
  const organizationsCollection = db.collection('organizations');

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Retrieve the subscription details to get the plan ID (product ID)
        if (session.subscription) {
            const subscription = await stripe.subscriptions.retrieve(session.subscription as string) as any;
            
            // Update Organization status
            if (session.metadata?.orgId) {
                const orgId = new ObjectId(session.metadata.orgId);
                const isAddon = session.metadata.type === 'add-on';

                if (isAddon) {
                    const addonData = {
                        planId: new ObjectId(session.metadata.planId),
                        subscriptionId: subscription.id,
                        status: 'active',
                        purchaseDate: new Date(),
                        stripe_customer_id: session.customer as string,
                        current_period_end: new Date(subscription.current_period_end * 1000),
                    };

                    await organizationsCollection.updateOne(
                        { _id: orgId },
                        {
                            $push: { addons: addonData } as any
                        }
                    );

                } else {
                    const startDate = new Date(subscription.current_period_start * 1000);
                    const endDate = new Date(subscription.current_period_end * 1000);
                    
                    const trialEndDate = subscription.trial_end 
                        ? new Date(subscription.trial_end * 1000) 
                        : null;
    
                    const updateData: any = {
                        status: 'active', // Mark active so they can access app during trial
                        subscription_id: subscription.id,
                        stripe_customer_id: session.customer as string,
                        planStartDate: startDate,
                        planEndDate: endDate,
                        updatedAt: new Date(),
                    };
    
                    if (trialEndDate) {
                        updateData.trialEndDate = trialEndDate;
                    }
    
                    await organizationsCollection.updateOne(
                        { _id: orgId },
                        {
                            $set: updateData
                        }
                    );
                }
            }
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Upsert subscription info in 'subscriptions' collection
        await subscriptionsCollection.updateOne(
            { stripe_subscription_id: subscription.id },
            {
                $set: {
                    stripe_customer_id: subscription.customer,
                    status: subscription.status,
                    planId: subscription.items.data[0].price.id, // Price ID
                    current_period_start: new Date(subscription.current_period_start * 1000),
                    current_period_end: new Date(subscription.current_period_end * 1000),
                    cancel_at_period_end: subscription.cancel_at_period_end,
                    updatedAt: new Date(),
                },
                $setOnInsert: {
                    createdAt: new Date(),
                }
            },
            { upsert: true }
        );
        
        // Sync status with Organization
        await organizationsCollection.updateOne(
            { stripe_customer_id: subscription.customer as string },
            {
                $set: {
                    status: subscription.status,
                    planEndDate: new Date(subscription.current_period_end * 1000),
                }
            }
        );

        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;

        await subscriptionsCollection.updateOne(
            { stripe_subscription_id: subscription.id },
            { $set: { status: 'canceled', updatedAt: new Date() } }
        );

        const orgWithAddon = await organizationsCollection.findOne({
            'addons.subscriptionId': subscription.id
        });

        if (orgWithAddon) {
            await organizationsCollection.updateOne(
                { 'addons.subscriptionId': subscription.id },
                { 
                    $set: { 'addons.$.status': 'canceled' } 
                }
            );
        } else {
            await organizationsCollection.updateOne(
                { stripe_customer_id: subscription.customer as string },
                { $set: { status: 'canceled' } }
            );
        }
        break;
      }
      
      case 'invoice.payment_succeeded': {
          // Can be used to extend subscription expiry if handled manually
          // But 'customer.subscription.updated' usually handles the dates.
          break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        await organizationsCollection.updateOne(
            { stripe_customer_id: customerId },
            { $set: { status: 'past_due' } } // or unpaid
        );
        break;
      }

      default:
        console.log(`Unhandled event type ${event.type}`);
    }
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
