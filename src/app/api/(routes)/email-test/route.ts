import { NextResponse } from 'next/server';
import { sendEmail } from '@/utils/sendEmail';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address format' },
        { status: 400 }
      );
    }

    // Send test email
    await sendEmail(
      email,
      'Test Email from OpsDeck',
      '<h1>Email Working</h1><p>This is a test email from OpsDeck. If you received this, your email configuration is working correctly!</p>'
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Test email sent successfully',
        email
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error sending test email:', error);
    return NextResponse.json(
      {
        error: 'Failed to send test email',
        details: error.message
      },
      { status: 500 }
    );
  }
}

