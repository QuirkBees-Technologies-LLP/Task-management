import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import clientPromise from '../../../../lib/mongodb';
import { DATABASE_NAME, JWT_SECRET, tokenExpiry } from '../../../../config';

/**
 * SuperAdmin Login API
 * For system-level admins only (isSystemAdmin: true)
 * Returns JWT with: id, email, role, isSystemAdmin
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

    // SECURITY: Only allow system admins to login through this route
    if (user.isSystemAdmin !== true) {
      return NextResponse.json(
        { error: 'Access denied. System admin access required.' },
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

    // Generate JWT token with system admin payload
    const token = jwt.sign(
      {
        id: user._id.toString(),
        email: user.email,
        role: user.role || 'Admin',
        isSystemAdmin: true,
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
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          role: user.role || 'Admin',
          isSystemAdmin: true,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in superadmin login API:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}



