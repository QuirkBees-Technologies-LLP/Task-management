import { NextResponse } from 'next/server';
import clientPromise from '../../../lib/mongodb';
import { DATABASE_NAME } from '../../../config';
import { ObjectId } from 'mongodb';
import { emailTemplateVariables } from '@/utils/constants';
import { sendEmail } from '../../../lib/email';
import { verifyToken } from '../../../helpers';
import { createNotification } from '../../../lib/notification';
import { assignTasksToUser } from '@/app/api/lib/taskController';

export async function POST(request: Request) {
  try {
    const { decoded: decodedToken, error, status } = await verifyToken(request);
    if (error) return NextResponse.json({ error }, { status });

    const { email } = decodedToken;

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const usersCollection = db.collection('users');
    const templatesCollection = db.collection('emailTemplates');

    // Find the user by email
    const user = await usersCollection.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if the email is already verified
    if (user.emailVerified) {
      return NextResponse.json({ message: 'Email is already verified' }, { status: 200 });
    }

    // Update the user's emailVerified field
    await usersCollection.updateOne(
      { _id: new ObjectId(user._id) },
      { $set: { emailVerified: true } }
    );

    // Fetch the welcome email template
    const welcomeTemplate = await templatesCollection.findOne({
      emailType: 'welcome',
    });

    if (!welcomeTemplate) {
      return NextResponse.json({ error: 'Welcome email template not found' }, { status: 404 });
    }

    // Replace placeholders in the email template
    const baseUrl = `${request.headers.get('origin')}`;
    const emailHtml = welcomeTemplate.htmlString
      .replace(emailTemplateVariables.name, `${user.firstName} ${user.lastName}`)
      .replace(emailTemplateVariables.baseUrl, baseUrl);

    // Send the welcome email
    await sendEmail({
      to: email,
      subject: welcomeTemplate.name ?? 'Welcome to Our Platform',
      html: emailHtml,
    });

    // Create a new company for the user
    const companyCollection = db.collection('companies');
    const company = await companyCollection.insertOne({
      admin: user._id,
    });

    // add company id to user
    // Update the user's emailVerified field
    await usersCollection.updateOne(
      { _id: new ObjectId(user._id) },
      { $set: { companyId: company.insertedId } }
    );

    // Assign tasks to the user
    await assignTasksToUser(user._id);

    // Send a welcome email
    await createNotification({
      message: 'Welcome to our Platform',
      userId: user._id,
      type: 'info',
      read: false,
    });

    return NextResponse.json(
      { message: 'Email verified successfully and welcome email sent' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in email verification API:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
