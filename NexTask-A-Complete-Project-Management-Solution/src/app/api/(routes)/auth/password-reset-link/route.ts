import { NextResponse } from 'next/server';
import clientPromise from '../../../lib/mongodb';
import { DATABASE_NAME } from '../../../config';
import { emailTemplateVariables } from '@/utils/constants';
import { sendEmail } from '@/app/api/lib/email';
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

    // Here, you would typically generate a password reset token and send an email.
    const templatesCollection = db.collection('emailTemplates');
    const emailTemplate = await templatesCollection.findOne({
      emailType: 'password_reset',
    });

    if (!emailTemplate) {
      return NextResponse.json({ error: 'Email confirmation template not found' }, { status: 404 });
    }

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
    const inviteLink = `${baseUrl}/change-password?token=${encodeURIComponent(token)}`;

    // Replace placeholders in the email template
    const emailHtml = emailTemplate.htmlString
      .replace(emailTemplateVariables.btnLink, inviteLink)
      .replace(emailTemplateVariables.name, `${user.firstName} ${user.lastName}`);

    // Send the confirmation email
    await sendEmail({
      to: email,
      subject: emailTemplate.name ?? 'Password Reset',
      html: emailHtml,
    });

    return NextResponse.json({ message: 'Email sent successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
