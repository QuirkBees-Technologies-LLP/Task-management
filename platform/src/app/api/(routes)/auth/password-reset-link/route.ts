import { NextResponse } from 'next/server';
import clientPromise from '../../../lib/mongodb';
import { DATABASE_NAME } from '../../../config';
import { emailTemplateVariables } from '@/utils/constants';
import { sendEmail as sendEmailLib } from '@/app/api/lib/email';
import { sendEmail } from '@/utils/sendEmail';
import { getEmailTemplate } from '@/utils/emailTemplates';
import jwt from 'jsonwebtoken';
import { tokenExpiryLong } from '@/app/api/config';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { email } = body;

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const usersCollection = db.collection('users');

    // Find the user by ID
    const user = await usersCollection.findOne({ email });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Generate password reset token
    const token = jwt.sign(
      {
        email: email,
        id: user._id.toString(),
      },
      process.env.JWT_SECRET!,
      {
        expiresIn: tokenExpiryLong,
      }
    );

    const baseUrl = `${request.headers.get('origin')}`;
    const resetLink = `${baseUrl}/change-password?token=${encodeURIComponent(token)}`;

    // Use file-based email template
    const emailHtml = getEmailTemplate('password-reset', {
      name: `${user.firstName} ${user.lastName}`,
      resetLink,
    });

    // Send the password reset email
    await sendEmail(email, 'Password Reset Request', emailHtml);

    return NextResponse.json({ message: 'Email sent successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
