import nodemailer from 'nodemailer';

/**
 * Sends an email using Nodemailer with Gmail SMTP configuration
 * 
 * @param to - The recipient's email address
 * @param subject - The subject of the email
 * @param html - The HTML content of the email
 * @returns Promise with success status
 */
export async function sendEmail(to: string, subject: string, html: string) {
  try {
    // Create transporter using environment variables
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS, // Gmail App Password
      },
    });

    const mailOptions = {
      from: process.env.SENDER_EMAIL || process.env.SMTP_USER || 'noreply@OpsDeck.com',
      to,
      subject,
      html,
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error: any) {
    console.error('Error sending email:', error);
    throw new Error(error?.message || 'Failed to send email');
  }
}

