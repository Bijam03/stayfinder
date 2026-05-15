import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "../config/cloudinary.js";
import crypto from "crypto";
import sendEmail from "../utils/sendEmail.js";

// ─── @desc    Register new user
// ─── @route   POST /api/auth/register
// ─── @access  Public
export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, email and password",
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already registered. Please login instead.",
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || "guest",
    });

    const token = generateToken(res, user._id);

    res.status(201).json({
      success: true,
      message: "Account created successfully! 🎉",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── @desc    Login user
// ─── @route   POST /api/auth/login
// ─── @access  Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check if user account is deactivated by admin
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account has been deactivated. Please contact support.",
      });
    }

    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = generateToken(res, user._id);

    res.status(200).json({
      success: true,
      message: `Welcome back, ${user.name}! 👋`,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── @desc    Logout user
// ─── @route   POST /api/auth/logout
// ─── @access  Private
export const logout = async (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    expires: new Date(0),
  });

  res.status(200).json({
    success: true,
    message: "Logged out successfully. Goodbye! 👋",
  });
};

// ─── @desc    Get current logged in user
// ─── @route   GET /api/auth/me
// ─── @access  Private
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        phone: user.phone,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── @desc    Update user profile (name, phone)
// ─── @route   PUT /api/auth/update-profile
// ─── @access  Private
export const updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Profile updated successfully ✅",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        phone: user.phone,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── @desc    Update user avatar photo
// ─── @route   PUT /api/auth/update-avatar
// ─── @access  Private
export const updateAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload an image file",
      });
    }

    // Find current user to check for existing avatar
    const user = await User.findById(req.user._id);

    // Delete old avatar from Cloudinary if one exists
    if (user.avatarPublicId) {
      await deleteFromCloudinary(user.avatarPublicId);
    }

    // Upload new avatar buffer to Cloudinary
    const result = await uploadToCloudinary(
      req.file.buffer,
      "stayfinder/avatars"
    );

    // Save new avatar URL and public_id to database
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        avatar: result.secure_url,
        avatarPublicId: result.public_id,
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Avatar updated successfully ✅",
      avatar: updatedUser.avatar,
    });
  } catch (error) {
    console.error("❌ Avatar upload error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};


// ─── @desc    Forgot password — send reset email
// ─── @route   POST /api/auth/forgot-password
// ─── @access  Public
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Please provide your email address",
      });
    }

    const user = await User.findOne({ email });

    // Always return success even if email not found
    // This prevents revealing which emails are registered
    if (!user) {
      return res.status(200).json({
        success: true,
        message: "If that email exists, a reset link has been sent.",
      });
    }

    // Generate a random reset token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Hash it before saving to DB (never save raw token)
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Save hashed token + expiry to user
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
    await user.save({ validateBeforeSave: false });

    // Build reset URL — points to React frontend
    const resetURL = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

    // Send email
    await sendEmail({
      to: user.email,
      subject: "StayFinder — Password Reset Request",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
          <div style="background: #f43f5e; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">🏠 StayFinder</h1>
          </div>
          <div style="background: #ffffff; padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <h2 style="color: #111827; margin-top: 0;">Reset Your Password</h2>
            <p style="color: #6b7280;">Hi ${user.name},</p>
            <p style="color: #6b7280;">
              We received a request to reset your password. Click the button below to create a new password.
            </p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${resetURL}"
                style="background: #f43f5e; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
                Reset Password
              </a>
            </div>
            <p style="color: #9ca3af; font-size: 14px;">
              ⏰ This link expires in <strong>15 minutes</strong>.
            </p>
            <p style="color: #9ca3af; font-size: 14px;">
              If you didn't request this, you can safely ignore this email.
            </p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
            <p style="color: #d1d5db; font-size: 12px; text-align: center;">
              StayFinder — Your trusted rental platform
            </p>
          </div>
        </div>
      `,
    });

    res.status(200).json({
      success: true,
      message: "Password reset link sent to your email! Check your inbox.",
    });
  } catch (error) {
    // If email fails, clear the token so user can try again
    await User.findOneAndUpdate(
      { email: req.body.email },
      {
        resetPasswordToken: undefined,
        resetPasswordExpire: undefined,
      }
    );
    res.status(500).json({
      success: false,
      message: "Email could not be sent. Please try again.",
    });
  }
};

// ─── @desc    Reset password using token
// ─── @route   PUT /api/auth/reset-password
// ─── @access  Public
export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: "Token and new password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    // Hash the token from URL to compare with DB
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // Find user with matching token that hasn't expired
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }, // token not expired
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Reset link is invalid or has expired. Please request a new one.",
      });
    }

    // Set new password — pre-save hook will hash it
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password reset successfully! You can now login.",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};