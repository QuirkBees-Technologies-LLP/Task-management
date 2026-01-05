import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import clientPromise from '../../../../lib/mongodb';
import { DATABASE_NAME, JWT_SECRET, tokenExpiry } from '../../../../config';
import { addCorsHeaders } from '../../../../helpers';

/**
 * SuperAdmin Login API
 * For system-level / master admins only
 * Returns JWT with: user_id, isSystemAdmin: true
 * MUST NOT contain org_id
 */
export async function POST(request: Request) {
  try {
    // Get origin for CORS
    const origin = request.headers.get('origin');

    // Check Content-Type header
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return addCorsHeaders(
        NextResponse.json(
          { error: 'Content-Type must be application/json' },
          { status: 400 }
        ),
        origin
      );
    }

    // Parse JSON body with error handling
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return addCorsHeaders(
        NextResponse.json(
          { error: 'Invalid JSON in request body. Expected: { "email": "...", "password": "..." }' },
          { status: 400 }
        ),
        origin
      );
    }

    const { email, password } = body;

    if (!email || !password) {
      return addCorsHeaders(
        NextResponse.json(
          { error: 'Email and password are required' },
          { status: 400 }
        ),
        origin
      );
    }

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const usersCollection = db.collection('users');

    // Find the user by email
    const user = await usersCollection.findOne({ email });
    if (!user) {
      return addCorsHeaders(
        NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        ),
        origin
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return addCorsHeaders(
        NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        ),
        origin
      );
    }

    // SECURITY: Ensure user is a system admin
    if (user.isSystemAdmin !== true) {
      return addCorsHeaders(
        NextResponse.json(
          { error: 'Access denied. System admin privileges required.' },
          { status: 403 }
        ),
        origin
      );
    }

    // Generate JWT token with system admin payload
    // Contains: user_id, isSystemAdmin: true
    // MUST NOT contain org_id
    const token = jwt.sign(
      {
        user_id: user._id.toString(),
        isSystemAdmin: true,
      },
      JWT_SECRET!,
      {
        expiresIn: tokenExpiry,
      }
    );

    return addCorsHeaders(
      NextResponse.json(
        {
          success: true,
          token,
          user: {
            id: user._id.toString(),
            email: user.email,
          },
        },
        { status: 200 }
      ),
      origin
    );
  } catch (error: any) {
    console.error('Error in superadmin login API:', error);
    
    const origin = request.headers.get('origin');
    
    // Provide more specific error messages
    if (error instanceof SyntaxError || error.message?.includes('JSON')) {
      return addCorsHeaders(
        NextResponse.json(
          { 
            error: 'Invalid request format. Expected JSON: { "email": "string", "password": "string" }',
            details: error.message 
          },
          { status: 400 }
        ),
        origin
      );
    }
    
    return addCorsHeaders(
      NextResponse.json(
        { error: 'Something went wrong', details: error.message },
        { status: 500 }
      ),
      origin
    );
  }
}


