import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
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

/**
 * Public Signup API
 * POST /api/auth/signup
 * 
 * Creates a new organization with owner user and 15-day trial
 * Required fields: firstName, lastName, email, password, organizationName, planId
 * Optional fields: slug (auto-generated from organizationName if not provided)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, password, organizationName, slug, planId } = body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password || !organizationName || !planId) {
      return NextResponse.json(
        { error: 'All fields are required: firstName, lastName, email, password, organizationName, and planId' },
        { status: 400 }
      );
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

    // Calculate trial dates (15 days from now)
    const trialStartDate = new Date();
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 15);

    // Create owner user first (with Admin role)
    const ADMIN_ROLE = 'Admin'; // Must be exactly 'Admin'
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
    const newOrganization = {
      name: organizationName,
      slug: normalizedSlug,
      slug_history: [normalizedSlug],
      status: 'trialing', // Organization starts in trialing status
      ownerId,
      planId: new ObjectId(planId),
      planName: plan.plan_name || '',
      trialStartDate,
      trialEndDate,
      planStartDate: null, // Will be set when trial converts to paid
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

    // Update user with org_id
    try {
      await usersCollection.updateOne(
        { _id: ownerId },
        {
          $set: {
            organizationId: orgResult.insertedId,
            org_id: orgResult.insertedId,
            // Keep role as Admin - don't overwrite it
          },
        }
      );
    } catch (updateError) {
      console.error('Error updating user with organization ID:', updateError);
      // Don't fail the signup if this update fails - the org was created successfully
    }

    // Ensure organization indexes
    try {
      await ensureOrganizationIndexes();
    } catch (indexError) {
      console.warn('Error ensuring organization indexes:', indexError);
    }

    // Generate JWT token with org_id for immediate login
    const org_id = orgResult.insertedId;
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

    // Fetch and send confirmation email
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
    } catch (emailError) {
      console.error('Error sending confirmation email:', emailError);
      // Don't fail signup if email fails
    }

    // Send welcome email
    try {
      const welcomeEmailHtml = getEmailTemplate('welcome', {
        name: `${firstName} ${lastName}`,
      });
      await sendEmail(email, 'Welcome to NexTask!', welcomeEmailHtml);
    } catch (emailError) {
      console.error('Error sending welcome email:', emailError);
      // Don't fail signup if welcome email fails
    }

    // Return success with token and user/org info
    return NextResponse.json(
      {
        success: true,
        message: 'Organization and account created successfully. You can now access your dashboard.',
        token,
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
          status: 'trialing',
          trialEndDate: trialEndDate.toISOString(),
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
