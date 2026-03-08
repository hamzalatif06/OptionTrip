import nodemailer from 'nodemailer';

const RECIPIENT = process.env.CONTACT_EMAIL || 'optiontripcom@gmail.com';

// Create Gmail SMTP transporter (uses App Password — no OAuth needed)
const createTransporter = () =>
  nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,  // Gmail App Password (16-char, no spaces)
    },
  });

export const sendContactMessage = async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
    return res.status(400).json({ success: false, message: 'All fields are required.' });
  }

  // Basic email format check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ success: false, message: 'Invalid email address.' });
  }

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error('[Contact] SMTP_USER or SMTP_PASS not configured in .env');
    return res.status(500).json({ success: false, message: 'Email service not configured.' });
  }

  try {
    const transporter = createTransporter();

    // Email to OptionTrip inbox
    await transporter.sendMail({
      from: `"OptionTrip Contact" <${process.env.SMTP_USER}>`,
      to: RECIPIENT,
      replyTo: `"${name}" <${email}>`,
      subject: `[Contact] ${subject}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9f9f9;border-radius:10px;overflow:hidden;">
          <div style="background:linear-gradient(135deg,#0A539D,#029e9d);padding:28px 32px;">
            <h2 style="color:#fff;margin:0;font-size:22px;">New Contact Message</h2>
            <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:14px;">OptionTrip Contact Form</p>
          </div>
          <div style="padding:28px 32px;background:#fff;">
            <table style="width:100%;border-collapse:collapse;">
              <tr>
                <td style="padding:8px 0;font-weight:600;color:#555;width:90px;">Name</td>
                <td style="padding:8px 0;color:#1e293b;">${name}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;font-weight:600;color:#555;">Email</td>
                <td style="padding:8px 0;"><a href="mailto:${email}" style="color:#0A539D;">${email}</a></td>
              </tr>
              <tr>
                <td style="padding:8px 0;font-weight:600;color:#555;">Subject</td>
                <td style="padding:8px 0;color:#1e293b;">${subject}</td>
              </tr>
            </table>
            <hr style="border:none;border-top:1px solid #eee;margin:20px 0;"/>
            <h4 style="color:#555;margin:0 0 10px;">Message</h4>
            <p style="color:#1e293b;line-height:1.7;white-space:pre-wrap;margin:0;">${message}</p>
          </div>
          <div style="padding:16px 32px;background:#f4f6f8;text-align:center;">
            <p style="color:#94a3b8;font-size:12px;margin:0;">Sent via OptionTrip contact form · Reply directly to this email to respond</p>
          </div>
        </div>
      `,
    });

    // Auto-reply to the sender
    await transporter.sendMail({
      from: `"OptionTrip" <${process.env.SMTP_USER}>`,
      to: `"${name}" <${email}>`,
      subject: `We received your message — ${subject}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:linear-gradient(135deg,#0A539D,#029e9d);padding:28px 32px;border-radius:10px 10px 0 0;">
            <h2 style="color:#fff;margin:0;">Thank you, ${name}!</h2>
            <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:14px;">We've received your message and will reply soon.</p>
          </div>
          <div style="padding:28px 32px;background:#fff;border-radius:0 0 10px 10px;border:1px solid #eee;">
            <p style="color:#1e293b;line-height:1.7;">Hi <strong>${name}</strong>,</p>
            <p style="color:#1e293b;line-height:1.7;">
              Thanks for reaching out to OptionTrip! We've received your message about
              <strong>"${subject}"</strong> and our team will get back to you as soon as possible.
            </p>
            <p style="color:#64748b;font-size:13px;">Your message:</p>
            <blockquote style="border-left:3px solid #029e9d;margin:0;padding:10px 16px;color:#475569;font-style:italic;">${message}</blockquote>
            <hr style="border:none;border-top:1px solid #eee;margin:24px 0;"/>
            <p style="color:#1e293b;margin:0;">Best regards,<br/><strong>The OptionTrip Team</strong></p>
          </div>
        </div>
      `,
    });

    return res.status(200).json({ success: true, message: 'Message sent successfully!' });
  } catch (error) {
    console.error('[Contact] Email send error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to send message. Please try again.' });
  }
};
