const User = require('../models/User');
const jwt = require('jsonwebtoken');
const {
  generateVerificationCode,
  sendVerificationEmail,
  sendResetPasswordEmail
} = require('../utils/emailService');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// ================= REGISTER =================
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    console.log("========================================");
    console.log("REGISTRATION");
    console.log("Email:", email);
    console.log("========================================");

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const verificationCode = generateVerificationCode();
    const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000);

    console.log("Generated code:", verificationCode);
    console.log("Code type:", typeof verificationCode);
    console.log("Expires:", verificationCodeExpires);

    const user = await User.create({
      name,
      email,
      password,
      isVerified: false,
      verificationCode: verificationCode,
      verificationCodeExpires,
    });

    console.log("User created. Stored code type:", typeof user.verificationCode);

    // Send email
    const emailSent = await sendVerificationEmail(email, verificationCode);
    
    if (!emailSent) {
      console.error("Failed to send email");
    }

    res.status(201).json({
      success: true,
      message: 'Verification code sent to your email',
      data: { 
        email: user.email, 
        requiresVerification: true,
        debug_code: process.env.NODE_ENV === 'development' ? verificationCode : undefined
      },
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
};

// ================= VERIFY EMAIL =================
const verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;

    console.log("========================================");
    console.log("VERIFY EMAIL REQUEST");
    console.log("Email:", email);
    console.log("Code received:", code);
    console.log("Code type:", typeof code);
    console.log("========================================");

    if (!email || !code) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide email and verification code' 
      });
    }

    const user = await User.findOne({ email })
      .select('+verificationCode +verificationCodeExpires');

    if (!user) {
      console.log("❌ User not found:", email);
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    console.log("User found:", user.email);
    console.log("Stored code in DB:", user.verificationCode);
    console.log("Stored code type:", typeof user.verificationCode);
    console.log("Expires at:", user.verificationCodeExpires);
    console.log("Current time:", new Date());

    if (user.isVerified) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email already verified. Please login.' 
      });
    }

    if (!user.verificationCode) {
      return res.status(400).json({ 
        success: false, 
        message: 'No verification code found. Please request a new one.' 
      });
    }

    // Convert both to string for comparison
    const storedCode = String(user.verificationCode);
    const providedCode = String(code);

    console.log("Comparing:", storedCode, "===", providedCode);

    if (storedCode !== providedCode) {
      console.log("❌ Code mismatch!");
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid verification code' 
      });
    }

    if (user.verificationCodeExpires < new Date()) {
      console.log("❌ Code expired!");
      return res.status(400).json({ 
        success: false, 
        message: 'Verification code has expired. Please request a new one.' 
      });
    }

    console.log("✅ Code is valid! Verifying user...");

    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    await user.save();

    console.log("✅ User verified successfully!");

    res.status(200).json({ 
      success: true, 
      message: 'Email verified successfully!' 
    });

  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during verification' 
    });
  }
};

// ================= RESEND VERIFICATION =================
const resendVerificationCode = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide email' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'Email already verified' });
    }

    const verificationCode = generateVerificationCode();
    const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000);

    user.verificationCode = verificationCode;
    user.verificationCodeExpires = verificationCodeExpires;
    await user.save();

    await sendVerificationEmail(email, verificationCode);

    res.status(200).json({ success: true, message: 'New verification code sent' });

  } catch (error) {
    console.error('Resend error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ================= LOGIN =================
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.isVerified) {
      return res.status(401).json({
        success: false,
        message: 'Please verify your email first',
        requiresVerification: true,
        email: user.email,
      });
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
};

// ================= GOOGLE AUTH =================
const googleAuth = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ success: false, message: 'No credential provided' });
    }

    const decoded = jwt.decode(credential);

    if (!decoded || !decoded.email) {
      return res.status(400).json({ success: false, message: 'Invalid Google token' });
    }

    const { email, name, picture, sub: googleId } = decoded;

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name: name || email.split('@')[0],
        email,
        password: Math.random().toString(36).slice(-16),
        isVerified: true,
        googleId,
        avatar: picture,
      });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Google login successful',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        token,
      },
    });

  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ success: false, message: 'Server error during Google authentication' });
  }
};

// ================= FORGOT PASSWORD =================
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    console.log("=========================================");
    console.log("FORGOT PASSWORD REQUEST");
    console.log("Email:", email);
    console.log("=========================================");

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email address',
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      console.log("❌ User not found:", email);
      return res.status(200).json({
        success: true,
        message: 'If your email is registered, you will receive a password reset code.',
      });
    }

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const resetCodeExpires = new Date(Date.now() + 10 * 60 * 1000);

    console.log("🔐 Generated reset code:", resetCode);
    console.log("⏰ Expires at:", resetCodeExpires);

    user.resetCode = resetCode;
    user.resetCodeExpires = resetCodeExpires;
    await user.save();

    console.log("✅ Reset code saved to database");
    console.log("User ID:", user._id);
    console.log("Saved resetCode:", user.resetCode);
    console.log("Saved expires:", user.resetCodeExpires);

    await sendResetPasswordEmail(email, resetCode);

    console.log("=========================================");
    console.log("✅ Reset code sent successfully!");
    console.log("=========================================");

    res.status(200).json({
      success: true,
      message: 'If your email is registered, you will receive a password reset code.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message,
    });
  }
};

// ================= RESET PASSWORD =================
const resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    console.log("=========================================");
    console.log("RESET PASSWORD REQUEST");
    console.log("Email:", email);
    console.log("Code provided:", code);
    console.log("=========================================");

    if (!email || !code || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email, reset code, and new password',
      });
    }

    const { isValid, requirements } = validatePassword(newPassword);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain at least 8 characters, 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character',
        requirements: requirements,
      });
    }

    const userExists = await User.findOne({ email });
    if (!userExists) {
      console.log("❌ User not found:", email);
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset code',
      });
    }

    console.log("User found:", userExists.email);
    console.log("Stored resetCode:", userExists.resetCode);
    console.log("Stored expires:", userExists.resetCodeExpires);
    console.log("Current time:", new Date());
    console.log("Code provided:", code);

    if (!userExists.resetCode || userExists.resetCode !== code) {
      console.log("❌ Code mismatch!");
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset code',
      });
    }

    if (userExists.resetCodeExpires < new Date()) {
      console.log("❌ Code expired!");
      return res.status(400).json({
        success: false,
        message: 'Reset code has expired. Please request a new one.',
      });
    }

    console.log("✅ Code is valid!");

    userExists.password = newPassword;
    userExists.resetCode = undefined;
    userExists.resetCodeExpires = undefined;
    await userExists.save();

    console.log("✅ Password reset successfully for:", email);

    res.status(200).json({
      success: true,
      message: 'Password reset successfully! You can now login with your new password.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message,
    });
  }
};

// ================= CHANGE PASSWORD =================
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new password'
      });
    }

    const { isValid, requirements } = validatePassword(newPassword);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain at least 8 characters, 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character',
        requirements: requirements,
      });
    }
    
    const user = await User.findById(userId).select('+password');
    
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }
    
    user.password = newPassword;
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
    
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while changing password'
    });
  }
};

// ================= DELETE ACCOUNT =================
const deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    
    console.log("========================================");
    console.log("DELETE ACCOUNT REQUEST");
    console.log("User ID:", userId);
    console.log("========================================");
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    console.log("Deleting user:", user.email);
    
    await User.findByIdAndDelete(userId);
    
    console.log("✅ User deleted successfully");
    
    res.status(200).json({
      success: true,
      message: 'Account deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting account'
    });
  }
};

// ================= PASSWORD VALIDATION =================
const validatePassword = (password) => {
  const requirements = {
    minLength: password.length >= 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
  };

  const isValid = requirements.minLength && requirements.hasUpperCase &&
    requirements.hasLowerCase && requirements.hasNumber &&
    requirements.hasSpecialChar;

  return { isValid, requirements };
};

// ================= USER PROFILE =================
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updateDetails = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;

    await user.save();

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error('Update details error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ================= EXPORT =================
module.exports = {
  registerUser,
  verifyEmail,
  resendVerificationCode,
  loginUser,
  googleAuth,
  forgotPassword,
  resetPassword,
  changePassword,
  deleteAccount,
  getMe,
  updateDetails,
};
