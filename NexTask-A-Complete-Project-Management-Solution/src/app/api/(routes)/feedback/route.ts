import { NextResponse } from 'next/server';
import { emailTemplateVariables } from '@/utils/constants';
import { verifyToken } from '../../helpers';
import { DATABASE_NAME, senderEmail } from '../../config';
import clientPromise from '../../lib/mongodb';
import { sendEmail } from '../../lib/email';
import { createNotification } from '../../lib/notification';

const MAX_FILE_SIZE_MB = 50;

export async function POST(request: Request) {
  const { decoded, error, status } = await verifyToken(request);
  if (error) return NextResponse.json({ error }, { status });

  const { id: userId } = decoded;

  try {
    const formData = await request.formData();

    const firstName = formData.get('firstName')?.toString() || '';
    const lastName = formData.get('lastName')?.toString() || '';
    const email = formData.get('email')?.toString() || '';
    const feedback = formData.get('feedback')?.toString() || '';

    const file = formData.get('attachment') as File | null;

    // Validate file size (allow all file types up to 50MB)
    if (file) {
      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > MAX_FILE_SIZE_MB) {
        return NextResponse.json({ error: 'File size exceeds 50MB limit.' }, { status: 400 });
      }
    }

    // Fetch email template (optional)
    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const templatesCollection = db.collection('emailTemplates');

    const template = await templatesCollection.findOne({
      emailType: 'feedback',
    });

    // If template exists, use it; otherwise fall back to a simple HTML email
    const html = template
      ? template.htmlString
          .replace(emailTemplateVariables.firstName, firstName)
          .replace(emailTemplateVariables.lastName, lastName)
          .replace(emailTemplateVariables.email, email)
          .replace(emailTemplateVariables.feedback, feedback)
      : `<p><strong>First Name:</strong> ${firstName}</p>
         <p><strong>Last Name:</strong> ${lastName}</p>
         <p><strong>Email:</strong> ${email}</p>
         <p><strong>Feedback:</strong><br/>${feedback}</p>`;

    const emailOptions: any = {
      to: senderEmail,
      subject: 'User Feedback',
      html,
      from: senderEmail,
    };

    // If file is present, convert it to a buffer and attach
    if (file) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      emailOptions.attachments = [
        {
          filename: file.name,
          content: buffer,
          contentType: file.type,
        },
      ];
    }

    await sendEmail(emailOptions);

    await createNotification({
      userId,
      message: 'Feedback submitted successfully',
      type: 'info',
    });

    return NextResponse.json({ message: 'Feedback submitted successfully' });
  } catch (error) {
    console.error('Feedback error:', error);
    return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 });
  }
}
