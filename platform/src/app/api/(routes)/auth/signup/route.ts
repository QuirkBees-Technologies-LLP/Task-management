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
 * Creates a new organization with owner user.
 * Initiates Stripe Checkout for payment/trial.
 * Status starts as 'pending_payment'.
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
    const templatesCollection = db.collection('emailTemplates');

    // Check if user already exists
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

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Initial Trial Setup (Will be overwritten by Webhook)
    const trialStartDate = new Date();
    // Default 15 days, but real source of truth will be Stripe Webhook
    const trialEndDate = new Date(); 
    trialEndDate.setDate(trialEndDate.getDate() + 15);

    // Create owner user first (with Admin role)
    const ADMIN_ROLE = 'Admin'; 
    const ownerUser = {
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role: ADMIN_ROLE,
      superuser: false,
      isTemporaryPassword: false,
      isEmailVerified: false,
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    let ownerId: ObjectId;
    let ownerResult;

    try {
      ownerResult = await usersCollection.insertOne(ownerUser);
      ownerId = ownerResult.insertedId;
    } catch (userError: any) {
      console.error('Error creating owner user:', userError);
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 500 }
      );
    }

    // Create organization
    // Status is 'pending_payment' until Stripe Webhook activates it
    const newOrganization = {
      name: organizationName,
      slug: normalizedSlug,
      slug_history: [normalizedSlug],
      status: 'pending_payment', 
      ownerId,
      planId: new ObjectId(planId),
      planName: plan.plan_name || '',
      trialStartDate,
      trialEndDate: null, // Set by webhook
      planStartDate: null, 
      planEndDate: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    let orgResult;
    try {
      orgResult = await organizationsCollection.insertOne(newOrganization);
    } catch (orgError: any) {
      // Rollback: delete the user if org creation fails
      await usersCollection.deleteOne({ _id: ownerId });
      console.error('Error creating organization:', orgError);
      if (orgError.code === 11000) {
        return NextResponse.json(
          { error: 'Organization with this slug already exists' },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to create organization' },
        { status: 500 }
      );
    }

    const org_id = orgResult.insertedId;

    // Update user with org_id
    try {
      await usersCollection.updateOne(
        { _id: ownerId },
        {
          $set: {
            organizationId: org_id,
            org_id: org_id,
          },
        }
      );
    } catch (updateError) {
      console.error('Error updating user with organization ID:', updateError);
    }

    // Create Stripe Checkout Session
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
                metadata: {
                    orgId: org_id.toString(),
                    userId: ownerId.toString(),
                }
            },
            metadata: {
                orgId: org_id.toString(),
                userId: ownerId.toString(),
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
        // Rollback? Or allow them to retry payment? 
        // For now, let's rollback to keep state clean
        await usersCollection.deleteOne({ _id: ownerId });
        await organizationsCollection.deleteOne({ _id: org_id });
        return NextResponse.json({ error: 'Failed to initiate payment session' }, { status: 500 });
    }


    // Ensure organization indexes
    try {
      await ensureOrganizationIndexes();
    } catch (indexError) {
      console.warn('Error ensuring organization indexes:', indexError);
    }

    // Generate JWT token with org_id 
    const tokenPayload = {
      id: ownerId.toString(),
      user_id: ownerId.toString(),
      email,
      role: ADMIN_ROLE,
      org_id: org_id.toString(),
      superuser: false,
      isSystemAdmin: false,
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET!, {
      expiresIn: tokenExpiry,
    });

    // Generate email confirmation token
    const confirmationToken = jwt.sign({ email }, JWT_SECRET!, { expiresIn: '1d' });
    const confirmationLink = `${request.headers.get('origin')}/confirm-email?token=${confirmationToken}`;

    // Fetch and send confirmation email - Non-blocking
    (async () => {
        try {
          const emailTemplate = await templatesCollection.findOne({
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
          });
          
           // Send welcome email
           const welcomeEmailHtml = getEmailTemplate('welcome', {
             name: `${firstName} ${lastName}`,
           });
           await sendEmail(email, 'Welcome to NexTask!', welcomeEmailHtml);

        } catch (emailError) {
          console.error('Error sending emails (background):', emailError);
        }
    })();

    // Return success with token and checkoutUrl
    return NextResponse.json(
      {
        success: true,
        message: 'Account created. Please complete payment to activate.',
        token,
        checkoutUrl, // Frontend should redirect here
        user: {
          id: ownerId.toString(),
          email,
          firstName,
          lastName,
          role: ADMIN_ROLE,
          org_id: org_id.toString(),
        },
        organization: {
          id: org_id.toString(),
          name: organizationName,
          slug: normalizedSlug,
          status: 'pending_payment',
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error in signup API:', error);
    return NextResponse.json(
      { error: error.message || 'Something went wrong during signup' },
      { status: 500 }
    );
  }
}
