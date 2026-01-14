import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email/send';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const { name, email, phone, subject, message } = await request.json();

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Send email notification to support via SMTP
    const timestamp = new Date().toLocaleString();

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">New Contact Form Submission</h2>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
          ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
          <p><strong>Subject:</strong> ${subject}</p>
        </div>
        <div style="background-color: #fff; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h3 style="color: #666; margin-top: 0;">Message:</h3>
          <p style="white-space: pre-wrap; color: #333;">${message}</p>
        </div>
        <div style="margin-top: 20px; padding: 15px; background-color: #f0f9ff; border-left: 4px solid #3b82f6; border-radius: 4px;">
          <p style="margin: 0; color: #666; font-size: 14px;">
            <strong>Submitted at:</strong> ${timestamp}
          </p>
        </div>
      </div>
    `;

    const emailText = `
New Contact Form Submission

Name: ${name}
Email: ${email}
${phone ? `Phone: ${phone}\n` : ''}Subject: ${subject}

Message:
${message}

---
Submitted at: ${timestamp}
    `;

    await sendEmail({
      to: 'support@tenafly-tg.com',
      subject: `Contact Form: ${subject}`,
      html: emailHtml,
      text: emailText,
      replyTo: email,
    });

    console.log('✅ Contact form notification sent to support@tenafly-tg.com');

    return NextResponse.json({
      success: true,
      message: 'Contact form submitted successfully',
    });

  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
