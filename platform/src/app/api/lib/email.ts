import nodemailer from 'nodemailer';
import { senderEmail } from '../config';

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  attachments?: any[];
}

/**
 * Sends an email using Nodemailer with fallback plain text.
 *
 * @param {string} to - The recipient's email address
 * @param {string} subject - The subject of the email
 * @param {string} html - The HTML content of the email
 * @param {string} [text] - Optional plain-text version of the email
 * @param {string} [from] - Optional sender's email address
 * @param {any[]} [attachments] - Optional array of attachments
 *
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function sendEmail({ to, subject, html, text, from, attachments }: SendEmailOptions) {
  try {
    // Create transporter using environment variables for flexibility
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER, // e.g. your Gmail or company mail
        pass: process.env.SMTP_PASS, // app password or SMTP key
      },
    });

    const mailOptions = {
      from: from ?? senderEmail ?? 'default@gmail.com',
      to,
      subject,
      html,
      attachments,
    };

    await transporter.sendMail(mailOptions);

    return { success: true };
  } catch (error: any) {
    console.error('Error sending email:', error);
    return {
      success: false,
      error: error?.message || 'Unknown error occurred while sending email',
    };
  }
}
