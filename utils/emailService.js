const nodemailer = require('nodemailer');

// Create OAuth 2.0 transporter
const createTransporter = () => {
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

// Send verification email
const sendVerificationEmail = async (toEmail, code) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"AGAP System" <${process.env.GOOGLE_USER}>`,
      to: toEmail,
      subject: '🔐 Verify Your AGAP Account',
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 550px; margin: 0 auto; background: #f9fafb; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
          <div style="background: linear-gradient(135deg, #1e5fa1 0%, #2d6cae 100%); padding: 30px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; letter-spacing: 2px;">AGAP</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0;">Automated Geospatial Alert Platform</p>
          </div>
          
          <div style="padding: 32px 28px; background: white;">
            <h2 style="color: #1e293b; margin-top: 0;">Welcome to AGAP! 🎉</h2>
            <p style="color: #475569; line-height: 1.6;">Please use the verification code below:</p>
            
            <div style="background: #f1f5f9; padding: 24px; text-align: center; margin: 28px 0; border-radius: 12px;">
              <span style="font-size: 42px; letter-spacing: 12px; font-weight: bold; color: #1e5fa1;">${code}</span>
            </div>
            
            <p style="color: #e74c3c; font-size: 14px;">⚠️ This code expires in 10 minutes</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Email sent to:', toEmail);
    return true;
  } catch (error) {
    console.error('❌ Email error:', error.message);
    return false;
  }
};

module.exports = {
  generateVerificationCode,
  sendVerificationEmail,
};
