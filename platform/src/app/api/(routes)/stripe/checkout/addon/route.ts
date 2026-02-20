
import { NextResponse } from 'next/server';
import { stripe } from '@/utils/stripe';
import { accessTokenKey } from '@/utils/constants';
import clientPromise from '@/app/api/lib/mongodb';
import { DATABASE_NAME } from '@/app/api/config';
import { ObjectId } from 'mongodb';
import { userRolesServer, verifyToken } from '@/app/api/helpers';

export async function POST(request: Request) {
    // 1. Verify User (Any authenticated user in an org can technically initiate, but usually Admin)
    // We enforce Admin role for billing changes
    const { decoded, error, status } = await verifyToken(request, userRolesServer.admin);
    if (error) return NextResponse.json({ error }, { status });

    try {
        const { planId, billingPeriod } = await request.json(); // billingPeriod: 'monthly' | 'yearly'

        if (!planId || !billingPeriod) {
            return NextResponse.json({ error: 'Plan ID and Billing Period are required' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db(DATABASE_NAME);
        const plansCollection = db.collection('plans');
        const organizationsCollection = db.collection('organizations');

        // 2. Fetch the Addon Plan
        const addonPlan = await plansCollection.findOne({ 
            _id: new ObjectId(planId), 
            deletedAt: null,
            status: 'active',
            type: 'add-on' // Ensure it is an add-on
        });

        if (!addonPlan) {
            return NextResponse.json({ error: 'Invalid or inactive Add-on Plan' }, { status: 404 });
        }

        // 3. Get Price ID based on billing period
        const priceId = addonPlan.stripe_price_ids?.[billingPeriod];
        if (!priceId) {
            return NextResponse.json({ error: `Price not available for ${billingPeriod} billing` }, { status: 400 });
        }

        // 4. Get User's Organization (to link session)
        // User should have org_id in decoded token or we fetch from DB
        const userId = decoded.id;
        const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });

        if (!user?.org_id) {
             return NextResponse.json({ error: 'User is not associated with an organization' }, { status: 400 });
        }
        
        const orgId = user.org_id.toString();
        const organization = await organizationsCollection.findOne({ _id: new ObjectId(orgId) });
        
        if (!organization) {
             return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
        }

        // 5. Create Stripe Checkout Session
        // Note: For Add-ons, we create a new Subscription. 
        // If we wanted to add to existing subscription, we'd use subscription items, but that's complex logic.
        // Simple approach: New Subscription for the Add-on.
        
        const origin = request.headers.get('origin');

        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            payment_method_types: ['card'],
            customer: organization.stripe_customer_id, // Provide existing customer ID if exists!
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            success_url: `${origin}/payment/success?session_id={CHECKOUT_SESSION_ID}&type=addon`,
            cancel_url: `${origin}/dashboard/settings?canceled=true`,
            metadata: {
                orgId: orgId,
                planId: planId,
                type: 'add-on', // Critical for Webhook to distinguish
            },
            // Logic: If org has customer_id, use it. If not, Stripe creates new one (but we should try to reuse)
            ...(organization.stripe_customer_id ? { customer: organization.stripe_customer_id } : {}),
             // If no customer ID, we might want to pass user email to prefill
            ...(!organization.stripe_customer_id && user.email ? { customer_email: user.email } : {}),
        });

        return NextResponse.json({ url: session.url }, { status: 200 });

    } catch (error: any) {
        console.error('Error creating addon checkout session:', error);
        return NextResponse.json({ error: 'Failed to initiate checkout' }, { status: 500 });
    }
}
