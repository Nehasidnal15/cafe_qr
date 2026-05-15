const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.BREVO_SMTP_USER,
    pass: process.env.BREVO_SMTP_KEY
  },
  tls: {
    rejectUnauthorized: false
  },
  debug: true,
  logger: true
});



const sendOTPEmail = async (toEmail, otp) => {
  const mailOptions = {
    from: `"Cafe Management" <${process.env.BREVO_SENDER_EMAIL}>`,
    to: toEmail,
    subject: 'Password Reset OTP',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #6F4E37; text-align: center;">Cafe Management System</h2>
        <p>Hello,</p>
        <p>You requested to reset your password. Please use the OTP below to proceed:</p>
        <div style="text-align: center; margin: 30px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #6F4E37; background: #F5F5DC; padding: 10px 20px; border-radius: 5px;">${otp}</span>
        </div>
        <p>This OTP is valid for 10 minutes. If you did not request this, please ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #888; text-align: center;">&copy; ${new Date().getFullYear()} Cafe Management System. All rights reserved.</p>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
};

module.exports = { sendOTPEmail };
