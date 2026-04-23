// agap-backend/utils/emailService.js
const nodemailer = require('nodemailer');

// Create transporter with better error handling
const createTransporter = () => {
  // Check if we have Google credentials
  if (!process.env.GOOGLE_USER) {
    console.error("❌ GOOGLE_USER is not set in .env");
    return null;
  }

  // Use App Password (recommended for production)
  if (process.env.GOOGLE_APP_PASSWORD) {
    console.log("✅ Using App Password authentication");
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GOOGLE_USER,
        pass: process.env.GOOGLE_APP_PASSWORD,
      },
      // Add these to avoid timeout issues
      pool: true,
      maxConnections: 1,
      rateDelta: 1000,
      rateLimit: 5,
    });
  }
  
  // Fallback to OAuth 2.0
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    console.log("✅ Using OAuth 2.0 authentication");
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
  }

  console.error("❌ No valid email credentials found!");
  return null;
};

// Generate 6-digit verification code
const generateVerificationCode = () => {
  // Generate 6-digit code as STRING
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  console.log("Generated code (string):", code, "Type:", typeof code);
  return code;
};
// Send verification email for signup with better error handling
const sendVerificationEmail = async (toEmail, code) => {
  console.log("📧 Sending verification email to:", toEmail);
  console.log("🔑 Verification code:", code);
  
  try {
    const transporter = createTransporter();
    
    if (!transporter) {
      console.error("❌ Transporter creation failed");
      return false;
    }

    // Verify transporter connection
    await transporter.verify();
    console.log("✅ Email transporter verified");

    const mailOptions = {
      from: `"AGAP Flood Monitoring" <${process.env.GOOGLE_USER}>`,
      to: toEmail,
      subject: '🔐 Verify Your AGAP Account - Action Required',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 550px; margin: 0 auto; background: #f9fafb; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0;">
          <div style="background: linear-gradient(135deg, #1e5fa1 0%, #2d6cae 100%); padding: 30px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 32px;">AGAP</h1>
            <p style="color: rgba(255,255,255,0.9); margin-top: 8px;">Automated Geospatial Alert Platform</p>
          </div>
          <div style="padding: 32px 28px; background: white;">
            <h2 style="color: #1e293b; margin-top: 0;">Welcome to AGAP! 🎉</h2>
            <p style="color: #475569; font-size: 16px; line-height: 1.5;">
              Thank you for signing up! Please use the verification code below to complete your registration:
            </p>
            <div style="background: #f1f5f9; padding: 24px; text-align: center; margin: 24px 0; border-radius: 12px; border: 1px dashed #cbd5e1;">
              <span style="font-size: 48px; letter-spacing: 12px; font-weight: bold; color: #1e5fa1; font-family: monospace;">${code}</span>
            </div>
            <div style="background: #fef3c7; padding: 16px; border-radius: 8px; margin: 20px 0;">
              <p style="color: #92400e; margin: 0; font-size: 14px;">
                ⚠️ <strong>Important:</strong> This code expires in <strong>10 minutes</strong>
              </p>
            </div>
            <p style="color: #64748b; font-size: 14px; margin-top: 24px;">
              If you didn't create an account with AGAP, please ignore this email.
            </p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
            <p style="color: #94a3b8; font-size: 12px; text-align: center;">
              AGAP Flood Monitoring System | Philippines
            </p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Verification email sent successfully!');
    console.log('📨 Message ID:', info.messageId);
    return true;
    
  } catch (error) {
    console.error('❌ Verification email error details:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    
    if (error.code === 'EAUTH') {
      console.error('🔐 Authentication failed! Check your email credentials in .env');
      console.error('Make sure GOOGLE_APP_PASSWORD is correct (16 chars with spaces)');
    } else if (error.code === 'ESOCKET') {
      console.error('🌐 Network error! Check your internet connection');
    }
    
    return false;
  }
};

// Send reset password email
const sendResetPasswordEmail = async (toEmail, code) => {
  console.log("📧 Sending reset password email to:", toEmail);
  console.log("🔑 Reset code:", code);
  
  try {
    const transporter = createTransporter();
    
    if (!transporter) {
      console.error("❌ Transporter creation failed");
      return false;
    }

    const mailOptions = {
      from: `"AGAP Flood Monitoring" <${process.env.GOOGLE_USER}>`,
      to: toEmail,
      subject: '🔐 Reset Your AGAP Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 550px; margin: 0 auto; background: #f9fafb; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0;">
          <div style="background: linear-gradient(135deg, #1e5fa1 0%, #2d6cae 100%); padding: 30px 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">AGAP</h1>
            <p style="color: rgba(255,255,255,0.9);">Password Reset Request</p>
          </div>
          <div style="padding: 32px 28px; background: white;">
            <h2 style="color: #1e293b;">Reset Your Password</h2>
            <p style="color: #475569;">We received a request to reset your password. Use the code below:</p>
            <div style="background: #f1f5f9; padding: 24px; text-align: center; margin: 24px 0; border-radius: 12px;">
              <span style="font-size: 48px; letter-spacing: 12px; font-weight: bold; color: #1e5fa1; font-family: monospace;">${code}</span>
            </div>
            <div style="background: #fef3c7; padding: 16px; border-radius: 8px; margin: 20px 0;">
              <p style="color: #92400e; margin: 0; font-size: 14px;">
                ⚠️ This code expires in <strong>10 minutes</strong>
              </p>
            </div>
            <p style="color: #64748b; font-size: 14px;">
              If you didn't request this, please ignore this email.
            </p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Reset password email sent successfully!');
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
