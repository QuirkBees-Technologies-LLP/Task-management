import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import clientPromise from '../../../lib/mongodb';
import { DATABASE_NAME, JWT_SECRET, tokenExpiry } from '../../../config';
import { EMAIL_CONFIRMATION_TEXT, emailTemplateVariables } from '@/utils/constants';
import { sendEmail as sendEmailLib } from '../../../lib/email';
import { sendEmail } from '@/utils/sendEmail';
import { getEmailTemplate } from '@/utils/emailTemplates';
import { userRolesServer } from '@/app/api/helpers';
import { validateSlug, normalizeSlug, ensureOrganizationIndexes } from '../../../lib/organizations';
import { stripe } from '@/utils/stripe';

/**
 * Public Signup API
 * POST /api/auth/signup
 * 
 * Validates signup data and creates Stripe Checkout session.
 * Organization and user are created ONLY after successful payment (via webhook).
 * Signup data is stored in Stripe checkout session metadata.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, password, organizationName, slug, planId, billingPeriod } = body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password || !organizationName || !planId || !billingPeriod) {
      return NextResponse.json(
        { error: 'All fields are required: firstName, lastName, email, password, organizationName, planId, and billingPeriod' },
        { status: 400 }
      );
    }

    // Validate billingPeriod
    if (!['monthly', 'yearly'].includes(billingPeriod)) {
        return NextResponse.json({ error: 'Invalid billing period. Must be "monthly" or "yearly"' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Validate organization name length
    if (organizationName.length < 2 || organizationName.length > 100) {
      return NextResponse.json(
        { error: 'Organization name must be between 2 and 100 characters' },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Validate planId format
    if (!ObjectId.isValid(planId)) {
      return NextResponse.json({ error: 'Invalid planId format' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const usersCollection = db.collection('users');
    const organizationsCollection = db.collection('organizations');
    const plansCollection = db.collection('plans');

    // Check if user already exists (before creating checkout)
    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
    }

    // Validate plan exists and is active
    const plan = await plansCollection.findOne({
      _id: new ObjectId(planId),
      status: 'active',
      deletedAt: null,
    });

    if (!plan) {
      return NextResponse.json(
        { error: 'Plan not found or inactive. Please select a valid plan.' },
        { status: 400 }
      );
    }

    // Get Stripe Price ID
    // @ts-ignore
    const stripePriceId = plan.stripe_price_ids?.[billingPeriod];
    if (!stripePriceId) {
        return NextResponse.json(
            { error: `Price not found for ${billingPeriod} billing.` },
            { status: 400 }
        );
    }

    // Generate or normalize slug
    let normalizedSlug: string;
    if (slug) {
      normalizedSlug = normalizeSlug(slug);
      if (!validateSlug(normalizedSlug)) {
        return NextResponse.json(
          { error: 'Slug must contain only lowercase letters, numbers, and hyphens (max 50 characters)' },
          { status: 400 }
        );
      }
    } else {
      // Auto-generate slug from organization name
      normalizedSlug = normalizeSlug(organizationName);
      if (!normalizedSlug) {
        // Fallback if normalization results in empty string
        normalizedSlug = `org-${Date.now()}`;
      }
    }

    // Check if slug already exists
    const existingOrg = await organizationsCollection.findOne({
      slug: normalizedSlug,
      deletedAt: null,
    });
    if (existingOrg) {
      return NextResponse.json(
        { error: 'Organization with this name/slug already exists. Please choose a different name.' },
        { status: 400 }
      );
    }

    // Hash the password (will be stored in metadata, but hashed for security)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create Stripe Checkout Session with signup data in metadata
    // Organization and user will be created in webhook after payment succeeds
    let checkoutUrl = '';
    try {
        const origin = request.headers.get('origin') || 'http://localhost:3000'; // Fallback
        
        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            customer_email: email,
            line_items: [
                {
                    price: stripePriceId,
                    quantity: 1,
                },
            ],
            subscription_data: {
                trial_period_days: 15, // Enforce 15-day trial
            },
            // Store all signup data in metadata for webhook to create org/user
            metadata: {
                signupType: 'new_organization',
                firstName: firstName,
                lastName: lastName,
                email: email,
                password: hashedPassword, // Hashed password stored in metadata
                organizationName: organizationName,
                slug: normalizedSlug,
                planId: planId,
                planName: plan.plan_name || '',
                billingPeriod: billingPeriod,
            },
            success_url: `${origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/payment/failed`,
        });
        
        if (session.url) {
            checkoutUrl = session.url;
        } else {
            throw new Error("Failed to generate checkout URL");
        }

    } catch (stripeError: any) {
        console.error("Stripe Checkout Error:", stripeError);
        return NextResponse.json({ error: 'Failed to initiate payment session' }, { status: 500 });
    }


    // Return checkout URL only - no token, no user/org data
    // Organization and user will be created after payment succeeds
    return NextResponse.json(
      {
        success: true,
        message: 'Please complete payment to create your account.',
        checkoutUrl, // Frontend should redirect here immediately
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error in signup API:', error);
    return NextResponse.json(
      { error: error.message || 'Something went wrong during signup' },
      { status: 500 }
    );
  }
}
