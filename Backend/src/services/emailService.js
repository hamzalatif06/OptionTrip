import nodemailer from 'nodemailer';

const createTransporter = () =>
  nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

/**
 * Send OTP verification email
 * @param {string} email - Recipient email
 * @param {string} name  - Recipient name
 * @param {string} otp   - 6-digit OTP code
 */
export const sendOtpEmail = async (email, name, otp) => {
  const transporter = createTransporter();

  await transporter.sendMail({
    from: `"OptionTrip" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Your OptionTrip verification code',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px;background:#f9f9f9;border-radius:10px;">
        <div style="text-align:center;margin-bottom:24px;">
          <img src="https://optiontrip.com/images/newLogo.png" alt="OptionTrip" style="height:48px;" />
        </div>
        <h2 style="color:#0A539D;margin:0 0 8px;">Verify your email</h2>
        <p style="color:#555;margin:0 0 24px;">Hi ${name}, use the code below to complete your registration. It expires in <strong>10 minutes</strong>.</p>
        <div style="background:#fff;border:2px dashed #0A539D;border-radius:8px;padding:24px;text-align:center;margin-bottom:24px;">
          <span style="font-size:42px;font-weight:700;letter-spacing:16px;color:#0A539D;">${otp}</span>
        </div>
        <p style="color:#999;font-size:13px;">If you didn't create an account with OptionTrip, you can safely ignore this email.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
        <p style="color:#bbb;font-size:12px;text-align:center;">© ${new Date().getFullYear()} OptionTrip. All rights reserved.</p>
      </div>
    `,
  });
};
