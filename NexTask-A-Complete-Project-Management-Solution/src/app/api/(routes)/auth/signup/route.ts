import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import clientPromise from '../../../lib/mongodb';
import { DATABASE_NAME, JWT_SECRET } from '../../../config';
import { EMAIL_CONFIRMATION_TEXT, emailTemplateVariables } from '@/utils/constants';
import { sendEmail } from '../../../lib/email';
import { userRolesServer } from '@/app/api/helpers';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, password } = body;

    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const usersCollection = db.collection('users');
    const templatesCollection = db.collection('emailTemplates');

    // Check if the user already exists
    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert the new user
    const result = await usersCollection.insertOne({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      createdAt: new Date(),
      superuser: false,
      role: userRolesServer.regular,
      emailVerified: false,
    });

    // Generate a JWT token for email confirmation
    const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: '1d' }); // Token expires in 1 day
    const confirmationLink = `${request.headers.get('origin')}/confirm-email?token=${token}`;

    // Fetch the email confirmation template
    const emailTemplate = await templatesCollection.findOne({
      emailType: 'emailConfirm',
    });

    let emailHtml = '';

    if (!emailTemplate) {
      // Fallback to default template if not found in DB
      console.error('Email template for confirmation not found');
      emailHtml = EMAIL_CONFIRMATION_TEXT.replace(
        emailTemplateVariables.firstName,
        firstName
      ).replace(emailTemplateVariables.btnLink, confirmationLink);
    } else {
      // Replace placeholders in the email template
      emailHtml = emailTemplate?.htmlString
        .replace(emailTemplateVariables.firstName, firstName)
        .replace(emailTemplateVariables.btnLink, confirmationLink);
    }

    // Send the confirmation email
    await sendEmail({
      to: email,
      subject: emailTemplate?.name ?? 'Confirm Your Email',
      html: emailHtml,
    });

    return NextResponse.json(
      {
        message: 'User registered successfully. Please check your email to confirm your account.',
        userId: result.insertedId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in signup API:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
