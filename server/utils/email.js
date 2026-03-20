import nodemailer from 'nodemailer';

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  console.log('[email] Creating transporter lazily...');
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn('[email] Credentials missing from environment.');
    return null;
  }

  try {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });
    console.log('[email] Transporter created.');
    return transporter;
  } catch (err) {
    console.error('[email] Creation failed:', err.message);
    return null;
  }
};

export const sendOTP = async (to, otp) => {
  console.log(`[email] Preparing to send OTP for: ${to}`);
  const mailTransporter = getTransporter();

  if (!mailTransporter) {
    console.warn('[email] Skipping real email – falling back to console log.');
    console.log(`[DEV OVERRIDE] Sent OTP ${otp} to ${to}`);
    return { success: true };
  }

  const mailOptions = {
    from: `"Spider-Verse Quest" <${process.env.GMAIL_USER}>`,
    to: to,
    subject: `Your Spider-Verse Entry Code: ${otp}`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #fff; background-color: #050510; border-radius: 10px; text-align: center; max-width: 500px; margin: 0 auto; border: 1px solid #21262D;">
        <h1 style="color: #DC143C; margin-bottom: 5px;">🕷️ Spider-Verse Access</h1>
        <p style="font-size: 16px; color: #E6EDF3;">A portal to the multiverse is opening.</p>
        <p style="font-size: 16px; color: #E6EDF3;">Use the following unique code to enter:</p>
        <div style="background-color: #161B22; border: 1px solid #DC143C; padding: 15px; border-radius: 8px; margin: 25px 0;">
          <h2 style="font-size: 32px; letter-spacing: 5px; margin: 0; color: #FF4466;">${otp}</h2>
        </div>
        <p style="font-size: 12px; color: #8B949E;">This code expires in 5 minutes <br>and can only be used once.</p>
        <hr style="border-color: #21262D; margin: 20px 0;">
        <p style="font-size: 10px; color: #8B949E;">If you didn't request this code, simply ignore this transmission.</p>
      </div>
    `
  };

  try {
    console.log('[email] Dispatching email...');
    await mailTransporter.sendMail(mailOptions);
    console.log('[email] Dispatch successful.');
    return { success: true };
  } catch (error) {
    console.error('[email] Dispatch failed:', error.message);
    return { success: false, error: error.message };
  }
};
