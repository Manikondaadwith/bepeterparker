import nodemailer from 'nodemailer';

// Configure the email transporter using Gmail
// Requires an App Password for Gmail (2-Step Verification)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

export const sendOTP = async (to, otp) => {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn('⚠️ Email credentials not configured. OTP generated but NOT explicitly sent via email.');
    console.warn(`[DEV OVERRIDE] Sent OTP ${otp} to ${to}`);
    // In dev mode or without configured email, we succeed silently so the user can see it in terminal
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
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Failed to send OTP email:', error);
    return { success: false, error: error.message };
  }
};
