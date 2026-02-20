import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import clientPromise from '../../../lib/mongodb';
import { DATABASE_NAME, JWT_SECRET, tokenExpiry } from '../../../config';
import { ObjectId } from 'mongodb';

/**
 * Common Login API
 * Handles both regular users and organization admins
 * - System admins should use /api/superadmin/auth/login
 * - Organization admins and regular users use this endpoint
 * - Returns JWT with org_id if user belongs to an organization
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
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 422 });
    }

    // DEBUG: Log user data to help diagnose role issues
    console.log('Login attempt for user:', {
      email: user.email,
      role: user.role,
      org_id: user.org_id,
      isSystemAdmin: user.isSystemAdmin,
      hasRole: !!user.role,
      roleType: typeof user.role
    });

    // SECURITY: Block system admins from using this endpoint
    // They must use /api/superadmin/auth/login
    if (user.isSystemAdmin === true) {
      return NextResponse.json(
        { error: 'System admins must use the system admin login' },
        { status: 403 }
      );
    }

    // Check if the email is verified
    if (user.isTemporaryPassword) {
      return NextResponse.json(
        {
          error: 'Temporary password detected. Please reset your password to continue.',
        },
        { status: 403 }
      );
    }

    // Compare the password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 422 });
    }

    // Get the actual role from database - don't default to Regular
    // If role is missing, it's a data issue that needs to be fixed
    const userRole = user.role;
    if (!userRole) {
      console.error('WARNING: User has no role set in database:', {
        email: user.email,
        _id: user._id,
        org_id: user.org_id
      });
    }

    // Prepare JWT payload
    const tokenPayload: any = {
      id: user._id.toString(),
      user_id: user._id.toString(), // For compatibility
      email: user.email,
      role: userRole || 'Regular', // Use actual role from DB, fallback only if truly missing
      superuser: user.superuser || false,
      isSystemAdmin: false, // Never set to true for this endpoint
    };

    // Add org_id to token if user belongs to an organization
    if (user.org_id) {
      const org_id = user.org_id instanceof ObjectId 
        ? user.org_id 
        : new ObjectId(user.org_id);
      tokenPayload.org_id = org_id.toString();
    }

    // Generate a JWT token
    const token = jwt.sign(tokenPayload, JWT_SECRET, {
      expiresIn: tokenExpiry,
    });

    // Prepare user response - use actual role from database
    const userResponse: any = {
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
      isTemporaryPassword: user.isTemporaryPassword || false,
      role: userRole || 'Regular', // Return the actual role from database
    };

    // Add org_id to user response if present
    if (user.org_id) {
      const org_id = user.org_id instanceof ObjectId 
        ? user.org_id.toString()
        : user.org_id.toString();
      userResponse.org_id = org_id;
    }

    return NextResponse.json(
      {
        user: userResponse,
        token,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in login API:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
