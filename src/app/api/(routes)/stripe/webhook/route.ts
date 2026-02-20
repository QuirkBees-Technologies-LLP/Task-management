import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/utils/stripe';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import clientPromise from '@/app/api/lib/mongodb';
import { DATABASE_NAME, STRIPE_WEBHOOK_SECRET, JWT_SECRET, tokenExpiryLong, senderEmail } from '@/app/api/config';
import { sendEmail as sendEmailLib } from '@/app/api/lib/email';
import { sendEmail } from '@/utils/sendEmail';
import { getEmailTemplate } from '@/utils/emailTemplates';
import { EMAIL_CONFIRMATION_TEXT, emailTemplateVariables } from '@/utils/constants';
import { userRolesServer } from '@/app/api/helpers';
import { ensureOrganizationIndexes } from '@/app/api/lib/organizations';

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
  const usersCollection = db.collection('users');
  const emailTemplatesCollection = db.collection('emailTemplates');

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Retrieve the subscription details to get the plan ID (product ID)
        if (session.subscription) {
            const subscription = await stripe.subscriptions.retrieve(session.subscription as string) as any;
            
            // Check if this is a new organization signup (data stored in metadata)
            if (session.metadata?.signupType === 'new_organization') {
                // Create organization and user from metadata
                const {
                    firstName,
                    lastName,
                    email,
                    password, // Already hashed from signup
                    organizationName,
                    slug,
                    planId,
                    planName,
                } = session.metadata;

                const ADMIN_ROLE = 'Admin';
                const startDate = new Date(subscription.current_period_start * 1000);
                const endDate = new Date(subscription.current_period_end * 1000);
                const trialEndDate = subscription.trial_end 
                    ? new Date(subscription.trial_end * 1000) 
                    : null;

                // Create owner user first
                const ownerUser = {
                    firstName,
                    lastName,
                    email,
                    password, // Already hashed
                    role: ADMIN_ROLE,
                    superuser: false,
                    isTemporaryPassword: false,
                    isEmailVerified: false,
                    emailVerified: false,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };

                let ownerId: ObjectId;
                try {
                    const ownerResult = await usersCollection.insertOne(ownerUser);
                    ownerId = ownerResult.insertedId;
                } catch (userError: any) {
                    console.error('Error creating owner user in webhook:', userError);
                    // Don't throw - log error for manual review
                    break;
                }

                // Create organization with active status
                const newOrganization = {
                    name: organizationName,
                    slug,
                    slug_history: [slug],
                    status: 'active', // Active immediately after payment
                    ownerId,
                    planId: new ObjectId(planId),
                    planName: planName || '',
                    subscription_id: subscription.id,
                    stripe_customer_id: session.customer as string,
                    planStartDate: startDate,
                    planEndDate: endDate,
                    trialStartDate: new Date(),
                    trialEndDate: trialEndDate,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    deletedAt: null,
                };

                let orgId: ObjectId;
                try {
                    const orgResult = await organizationsCollection.insertOne(newOrganization);
                    orgId = orgResult.insertedId;
                } catch (orgError: any) {
                    console.error('Error creating organization in webhook:', orgError);
                    // Rollback: delete user if org creation fails
                    await usersCollection.deleteOne({ _id: ownerId });
                    break;
                }

                // Update user with org_id
                try {
                    await usersCollection.updateOne(
                        { _id: ownerId },
                        {
                            $set: {
                                organizationId: orgId,
                                org_id: orgId,
                            },
                        }
                    );
                } catch (updateError) {
                    console.error('Error updating user with organization ID in webhook:', updateError);
                }

                // Ensure organization indexes
                try {
                    await ensureOrganizationIndexes();
                } catch (indexError) {
                    console.warn('Error ensuring organization indexes in webhook:', indexError);
                }

                // Send welcome and confirmation emails (non-blocking)
                (async () => {
                    try {
                        const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
                        
                        // Generate email confirmation token
                        const confirmationToken = jwt.sign({ email }, JWT_SECRET!, { expiresIn: '1d' });
                        const confirmationLink = `${origin}/confirm-email?token=${confirmationToken}`;

                        // Send confirmation email
                        const emailTemplate = await emailTemplatesCollection.findOne({
                            emailType: 'emailConfirm',
                        });

                        let emailHtml = '';
                        if (!emailTemplate) {
                            emailHtml = EMAIL_CONFIRMATION_TEXT.replace(
                                emailTemplateVariables.firstName,
                                firstName
                            ).replace(emailTemplateVariables.btnLink, confirmationLink);
                        } else {
                            emailHtml = emailTemplate.htmlString
                                .replace(emailTemplateVariables.firstName, firstName)
                                .replace(emailTemplateVariables.btnLink, confirmationLink);
                        }

                        await sendEmailLib({
                            to: email,
                            subject: emailTemplate?.name ?? 'Confirm Your Email',
                            html: emailHtml,
                            from: senderEmail ?? 'default@gmail.com',
                        });

                        // Send welcome email
                        const welcomeEmailHtml = getEmailTemplate('welcome', {
                            name: `${firstName} ${lastName}`,
                        });
                        await sendEmail(email, 'Welcome to OpsDeck!', welcomeEmailHtml);

                    } catch (emailError) {
                        console.error('Error sending emails in webhook (background):', emailError);
                    }
                })();

            } else if (session.metadata?.orgId) {
                // Existing organization flow (addon or update)
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
                        status: 'active',
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
