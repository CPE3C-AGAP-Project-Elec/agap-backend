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

    const user = await User.create({
      name,
      email,
      password,
      isVerified: false,
      verificationCode,
      verificationCodeExpires,
    });

    await sendVerificationEmail(email, verificationCode);

    res.status(201).json({
      success: true,
      message: 'Verification code sent to your email',
      data: { email: user.email, requiresVerification: true },
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

    if (!email || !code) {
      return res.status(400).json({ success: false, message: 'Please provide email and verification code' });
    }

    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (user.verificationCode !== code) {
      return res.status(400).json({ success: false, message: 'Invalid verification code' });
    }

    if (user.verificationCodeExpires < new Date()) {
      return res.status(400).json({ success: false, message: 'Verification code has expired' });
    }

    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    await user.save();

    res.status(200).json({ success: true, message: 'Email verified successfully!' });

  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ success: false, message: 'Server error during verification' });
  }
};



// ================= RESEND VERIFICATION =================
const resendVerificationCode = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) return res.status(400).json({ success: false, message: 'Please provide email' });

    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

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

    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    if (!user.isVerified) {
      return res.status(401).json({
        success: false,
        message: 'Please verify your email first',
        requiresVerification: true,
        email: user.email,
      });
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' });

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

    // Generate reset code (6 digits)
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const resetCodeExpires = new Date(Date.now() + 10 * 60 * 1000);

    console.log("🔐 Generated reset code:", resetCode);
    console.log("⏰ Expires at:", resetCodeExpires);

    // Save to user
    user.resetCode = resetCode;
    user.resetCodeExpires = resetCodeExpires;
    await user.save();

    console.log("✅ Reset code saved to database");
    console.log("User ID:", user._id);
    console.log("Saved resetCode:", user.resetCode);
    console.log("Saved expires:", user.resetCodeExpires);

    // Send email
    const { sendResetPasswordEmail } = require('../utils/emailService');
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
// Password validation function
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

// @desc    Reset password with code
// @route   POST /api/auth/reset-password
// @access  Public
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

    // Validate password strength
    const { isValid, requirements } = validatePassword(newPassword);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain at least 8 characters, 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character',
        requirements: requirements,
      });
    }

    // First check if user exists
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

    // Check if code matches and is not expired
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

    // Update password
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

// @desc    Change password (when logged in)
// @route   PUT /api/auth/changepassword
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new password',
      });
    }

    // Validate password strength
    const { isValid, requirements } = validatePassword(newPassword);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain at least 8 characters, 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character',
        requirements: requirements,
      });
    }

    const user = await User.findById(req.user.id).select('+password');

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
      message: 'Password updated successfully',
    });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message,
    });
  }
};

// ================= USER =================
const getMe = async (req, res) => {
  const user = await User.findById(req.user.id);
  res.status(200).json({ success: true, data: user });
};

const updateDetails = async (req, res) => {
  const user = await User.findById(req.user.id);

  user.name = req.body.name || user.name;
  user.email = req.body.email || user.email;

  await user.save();

  res.status(200).json({ success: true, data: user });
};




// ================= EXPORT =================
module.exports = {
  registerUser,
  verifyEmail,
  resendVerificationCode,
  loginUser,
  googleAuth,
  forgotPassword,
  validatePassword,
  resetPassword,
  changePassword,
  getMe,
  updateDetails,

};
