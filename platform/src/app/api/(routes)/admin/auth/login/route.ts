import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import clientPromise from '../../../../lib/mongodb';
import { DATABASE_NAME, JWT_SECRET, tokenExpiry } from '../../../../config';
import { ObjectId } from 'mongodb';

/**
 * Admin Login API
 * For organization-level admins only
 * Returns JWT with: user_id, org_id, role
 * MUST NOT return isSystemAdmin
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const usersCollection = db.collection('users');

    // Find the user by email
    const user = await usersCollection.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // SECURITY: Reject system admins - they cannot login through NexTask panel
    if (user.isSystemAdmin === true) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Ensure user belongs to an organization
    if (!user.org_id) {
      return NextResponse.json(
        { error: 'User does not belong to an organization' },
        { status: 403 }
      );
    }

    // Ensure user has admin role
    if (user.role !== 'Admin') {
      return NextResponse.json(
        { error: 'Access denied. Admin role required.' },
        { status: 403 }
      );
    }

    // Convert org_id to ObjectId if it's a string
    const org_id = user.org_id instanceof ObjectId 
      ? user.org_id 
      : new ObjectId(user.org_id);

    // Generate JWT token with organization admin payload
    // Contains: user_id, org_id, role
    // MUST NOT contain isSystemAdmin
    const token = jwt.sign(
      {
        user_id: user._id.toString(),
        org_id: org_id.toString(),
        role: user.role,
      },
      JWT_SECRET!,
      {
        expiresIn: tokenExpiry,
      }
    );

    return NextResponse.json(
      {
        success: true,
        token,
        user: {
          id: user._id.toString(),
          email: user.email,
          org_id: org_id.toString(),
          role: user.role,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in admin login API:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}

