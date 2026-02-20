import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '../../../lib/mongodb';
import { DATABASE_NAME, JWT_SECRET, tokenExpiry } from '../../../config';
import { stripe } from '@/utils/stripe';
import jwt from 'jsonwebtoken';
import { userRolesServer } from '../../../helpers';

/**
 * POST /api/auth/login-after-payment
 * Auto-login user after successful payment for new signups
 * Verifies session was completed and creates login token
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionId, email } = body;

    if (!sessionId || !email) {
      return NextResponse.json(
        { error: 'Session ID and email are required' },
        { status: 400 }
      );
    }

    // Verify the Stripe session was completed
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (session.status !== 'complete') {
      return NextResponse.json(
        { error: 'Payment session not completed' },
        { status: 400 }
      );
    }

    // Verify this is a new signup
    if (session.metadata?.signupType !== 'new_organization') {
      return NextResponse.json(
        { error: 'This endpoint is only for new signups' },
        { status: 400 }
      );
    }

    // Verify email matches session
    if (session.customer_details?.email !== email) {
      return NextResponse.json(
        { error: 'Email does not match payment session' },
        { status: 403 }
      );
    }

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const usersCollection = db.collection('users');
    const organizationsCollection = db.collection('organizations');

    // Find user by email (should exist after webhook created it)
    const user = await usersCollection.findOne({ email });
    
    if (!user) {
      return NextResponse.json(
        { error: 'Account not found. Please wait a moment and try logging in manually.' },
        { status: 404 }
      );
    }

    // Verify user has organization (webhook should have created it)
    const org_id = user.org_id || user.organizationId;
    if (!org_id) {
      return NextResponse.json(
        { error: 'Organization not found. Please contact support.' },
        { status: 404 }
      );
    }

    // Verify organization exists and is active
    const organization = await organizationsCollection.findOne({
      _id: new ObjectId(org_id),
      deletedAt: null,
    });

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    if (organization.status !== 'active') {
      return NextResponse.json(
        { error: 'Organization is not active yet. Please wait a moment.' },
        { status: 403 }
      );
    }

    // Generate JWT token
    const tokenPayload = {
      id: user._id.toString(),
      user_id: user._id.toString(),
      email: user.email,
      role: user.role || userRolesServer.regular,
      org_id: org_id.toString(),
      superuser: user.superuser || false,
      isSystemAdmin: false,
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET!, {
      expiresIn: tokenExpiry,
    });

    return NextResponse.json(
      {
        success: true,
        token,
        user: {
          id: user._id.toString(),
          email: user.email,
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          role: user.role || userRolesServer.regular,
          org_id: org_id.toString(),
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error in login-after-payment API:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to login after payment' },
      { status: 500 }
    );
  }
}

