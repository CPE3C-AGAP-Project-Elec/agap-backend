const nodemailer = require('nodemailer');

// Create transporter using OAuth 2.0 or App Password
const createTransporter = () => {
  // Use App Password if available (simpler)
  if (process.env.GOOGLE_APP_PASSWORD) {
    console.log("Using App Password authentication");
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GOOGLE_USER,
        pass: process.env.GOOGLE_APP_PASSWORD,
      },
    });
  }
  
  // Fallback to OAuth 2.0
  console.log("Using OAuth 2.0 authentication");
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: process.env.GOOGLE_USER,
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
    },
  });
};

// Generate 6-digit verification code
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send verification email for signup
const sendVerificationEmail = async (toEmail, code) => {
  console.log("📧 Sending verification email to:", toEmail);
  
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"AGAP System" <${process.env.GOOGLE_USER}>`,
      to: toEmail,
      subject: '🔐 Verify Your AGAP Account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 550px; margin: 0 auto; background: #f9fafb; border-radius: 16px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #1e5fa1 0%, #2d6cae 100%); padding: 30px 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">AGAP</h1>
            <p style="color: rgba(255,255,255,0.9);">Automated Geospatial Alert Platform</p>
          </div>
          <div style="padding: 32px 28px; background: white;">
            <h2 style="color: #1e293b;">Welcome to AGAP! 🎉</h2>
            <p style="color: #475569;">Your verification code is:</p>
            <div style="background: #f1f5f9; padding: 24px; text-align: center; margin: 20px 0; border-radius: 12px;">
              <span style="font-size: 42px; letter-spacing: 8px; font-weight: bold; color: #1e5fa1;">${code}</span>
            </div>
            <p style="color: #e74c3c; font-size: 14px;">⚠️ This code expires in 10 minutes</p>
            <p style="color: #64748b; font-size: 14px;">If you didn't request this, please ignore this email.</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Verification email sent to:', toEmail);
    return true;
  } catch (error) {
    console.error('❌ Verification email error:', error.message);
    return false;
  }
};

// Send reset password email
const sendResetPasswordEmail = async (toEmail, code) => {
  console.log("📧 Sending reset password email to:", toEmail);
  console.log("Reset code:", code);
  
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"AGAP System" <${process.env.GOOGLE_USER}>`,
      to: toEmail,
      subject: '🔐 Reset Your AGAP Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 550px; margin: 0 auto; background: #f9fafb; border-radius: 16px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #1e5fa1 0%, #2d6cae 100%); padding: 30px 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">AGAP</h1>
            <p style="color: rgba(255,255,255,0.9);">Automated Geospatial Alert Platform</p>
          </div>
          <div style="padding: 32px 28px; background: white;">
            <h2 style="color: #1e293b;">Reset Your Password</h2>
            <p style="color: #475569;">You requested to reset your password. Use the code below:</p>
            <div style="background: #f1f5f9; padding: 24px; text-align: center; margin: 20px 0; border-radius: 12px;">
              <span style="font-size: 42px; letter-spacing: 8px; font-weight: bold; color: #1e5fa1;">${code}</span>
            </div>
            <p style="color: #e74c3c; font-size: 14px;">⚠️ This code expires in 10 minutes</p>
            <p style="color: #64748b; font-size: 14px;">If you didn't request this, please ignore this email.</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Reset password email sent to:', toEmail);
    return true;
  } catch (error) {
    console.error('❌ Reset email error:', error.message);
    return false;
  }
};

module.exports = {
  generateVerificationCode,
  sendVerificationEmail,
  sendResetPasswordEmail,
};
