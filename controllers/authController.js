const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { generateVerificationCode, sendVerificationEmail } = require('../utils/emailService');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// @desc    Register user
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    console.log("Registration attempt for:", email);

    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Please provide all required fields' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        success: false,
        message: 'Password must be at least 6 characters' 
      });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ 
        success: false,
        message: 'User already exists with this email' 
      });
    }

    const verificationCode = generateVerificationCode();
    const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000);

    const user = new User({
      name,
      email,
      password,
      isVerified: false,
      verificationCode,
      verificationCodeExpires,
    });

    await user.save();
    console.log("User saved successfully");

    const emailSent = await sendVerificationEmail(email, verificationCode);

    if (!emailSent) {
      console.log("Email failed to send, but user was created");
    }

    res.status(201).json({
      success: true,
      message: 'Verification code sent to your email',
      data: {
        email: user.email,
        requiresVerification: true,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Server error during registration'
    });
  }
};

// @desc    Verify email
const verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and verification code',
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.verificationCode !== code) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code',
      });
    }

    if (user.verificationCodeExpires < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired',
      });
    }

    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Email verified successfully!',
    });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during verification',
    });
  }
};

// @desc    Resend verification code
const resendVerificationCode = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email',
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email already verified',
      });
    }

    const verificationCode = generateVerificationCode();
    const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000);

    user.verificationCode = verificationCode;
    user.verificationCodeExpires = verificationCodeExpires;
    await user.save();

    await sendVerificationEmail(email, verificationCode);

    res.status(200).json({
      success: true,
      message: 'New verification code sent',
    });
  } catch (error) {
    console.error('Resend error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Login user
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Please provide email and password' 
      });
    }

    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
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
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
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
    res.status(500).json({ 
      success: false,
      message: 'Server error during login'
    });
  }
};

// @desc    Google OAuth login/signup (with email verification)
const googleAuth = async (req, res) => {
  try {
    const { credential } = req.body;

    console.log("Google auth request received");

    if (!credential) {
      return res.status(400).json({
        success: false,
        message: 'No credential provided',
      });
    }

    // Helper function to generate verification code
    const generateCode = () => {
      return Math.floor(100000 + Math.random() * 900000).toString();
    };

    // Decode the Google token
    let decoded;
    try {
      const base64Payload = credential.split('.')[1];
      const payload = Buffer.from(base64Payload, 'base64').toString('utf8');
      decoded = JSON.parse(payload);
      console.log("Decoded Google user:", decoded.email);
    } catch (decodeError) {
      console.error("Token decode error:", decodeError);
      return res.status(400).json({
        success: false,
        message: 'Invalid Google token format',
      });
    }

    if (!decoded || !decoded.email) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Google token - no email found',
      });
    }

    const { email, name, picture, sub: googleId } = decoded;

    // Check if user exists
    let user = await User.findOne({ email });

    if (!user) {
      // Generate verification code for new user
      const verificationCode = generateCode();
      const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000);

      console.log("Creating new user with verification code:", verificationCode);

      // Create new user (NOT verified yet)
      user = new User({
        name: name || email.split('@')[0],
        email: email,
        password: Math.random().toString(36).slice(-16) + 'Aa1!',
        isVerified: false,
        verificationCode: verificationCode,
        verificationCodeExpires: verificationCodeExpires,
        googleId: googleId,
        avatar: picture,
      });

      await user.save();
      console.log("User created successfully");
      
      // Send verification email
      try {
        const emailSent = await sendVerificationEmail(email, verificationCode);
        if (emailSent) {
          console.log("Verification email sent to:", email);
        } else {
          console.log("Failed to send verification email");
        }
      } catch (emailError) {
        console.log("Email service error:", emailError.message);
      }
      
      return res.status(201).json({
        success: true,
        message: 'Verification code sent to your email. Please verify your account.',
        requiresVerification: true,
        email: user.email,
      });
    } 
    
    // Existing user found
    console.log("Existing user found, checking verification status");
    
    if (!user.isVerified) {
      // User exists but not verified - send new verification code
      const verificationCode = generateCode();
      const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000);
      
      user.verificationCode = verificationCode;
      user.verificationCodeExpires = verificationCodeExpires;
      await user.save();
      
      try {
        await sendVerificationEmail(email, verificationCode);
        console.log("New verification code sent to existing user:", email);
      } catch (emailError) {
        console.log("Email sending failed:", emailError.message);
      }
      
      return res.status(401).json({
        success: false,
        message: 'Please verify your email first. A new verification code has been sent.',
        requiresVerification: true,
        email: user.email,
      });
    }
    
    // User is verified - log them in
    console.log("User verified, generating token");
    const token = generateToken(user._id);
    
    res.status(200).json({
      success: true,
      message: 'Google login successful',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: picture,
        token: token,
      },
    });
    
  } catch (error) {
    console.error('Google auth error details:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during Google authentication: ' + error.message,
    });
  }
};

// @desc    Get current user
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update user details
const updateDetails = async (req, res) => {
  try {
    const { name, email } = req.body;
    const user = await User.findById(req.user.id);
    
    if (name) user.name = name;
    if (email) user.email = email;
    await user.save();
    
    res.status(200).json({ 
      success: true, 
      data: user 
    });
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

// @desc    Change password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id).select('+password');
    
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Current password is incorrect' 
      });
    }
    
    user.password = newPassword;
    await user.save();
    
    res.status(200).json({ 
      success: true, 
      message: 'Password updated successfully' 
    });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

// ========== EXPORT ALL FUNCTIONS ==========
module.exports = {
  registerUser,
  verifyEmail,
  resendVerificationCode,
  loginUser,
  googleAuth,
  getMe,
  updateDetails,
  changePassword,
};
