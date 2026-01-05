import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import clientPromise from '../../../lib/mongodb';
import { DATABASE_NAME, JWT_SECRET, tokenExpiry } from '../../../config';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const usersCollection = db.collection('users');

    // Find the user by email
    const user = await usersCollection.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 422 });
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

    // Check if the email is verified for first time signed in users
    if (!user.emailVerified && !user.companyId) {
      return NextResponse.json(
        {
          error: 'Email not verified. Please check your email and verify your account',
        },
        { status: 403 }
      );
    }

    // Compare the password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 422 });
    }

    // Generate a JWT token
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
        superuser: user.superuser,
      },
      JWT_SECRET,
      {
        expiresIn: tokenExpiry,
      }
    );

    return NextResponse.json(
      {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          isTemporaryPassword: user.isTemporaryPassword,
          role: user.role,
        },
        token,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in login API:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
