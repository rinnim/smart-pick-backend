const Admin = require("../models/admin");
const OTP = require("../models/otp");
const { getOTPEmailTemplate } = require("../utils/otp_template");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const transporter = require("../utils/transporter");

const register = async (req, res) => {
  try {
    const { firstName, lastName, username, email, password, otp, secretKey } =
      req.body;

    if (secretKey !== process.env.ADMIN_SECRET) {
      return res.status(401).json({
        status: "error",
        message: "Invalid Admin Secret.",
      });
    }

    // Verify OTP
    const otpDocument = await OTP.findOne({ email });
    if (!otpDocument || otpDocument.otp !== otp) {
      return res.status(400).json({
        status: "error",
        message: "Invalid OTP. Please try again.",
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new admin
    const admin = await Admin.create({
      firstName,
      lastName,
      username,
      email,
      password: hashedPassword,
    });

    // Return the admin data
    return res.status(200).json({
      status: "success",
      message: "Admin registered successfully",
      admin,
    });
  } catch (error) {
    console.log("Error in register", error);
    return res.status(500).json({
      status: "error",
      message: "Server error",
      error: error.message,
    });
  }
};

// Login using username or email and password
const login = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    console.log(username, email, password);

    // Check if admin exists
    const admin = await Admin.findOne({ $or: [{ email }, { username }] });
    if (!admin) {
      return res.status(401).json({
        status: "error",
        message: "Invalid credentials.",
      });
    }

    // Check if password is correct
    const isPasswordCorrect = await bcrypt.compare(password, admin.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        status: "error",
        message: "Invalid credentials.",
      });
    }

    // Generate JWT token
    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    // Return user data and token
    console.log(admin, token);
    return res.status(200).json({
      status: "success",
      message: "Login successful",
      data: { user: admin, token },
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Server error",
      error: error.message,
    });
  }
};

// Get admin details (protected route)
const getAdmin = async (req, res) => {
  try {
    const admin = await Admin.findById(req.user.id).select("-password");
    if (!admin) {
      return res.status(404).json({ message: "Admin not found." });
    }
    return res.status(200).json({ admin });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};

// Send OTP for email verification
const sendOTPForEmailVerification = async (req, res) => {
  try {
    const { email, username, firstName } = req.body;

    // Check if admin exists using email and username and display errors individually
    const adminExists = await Admin.findOne({ $or: [{ email }, { username }] });
    if (adminExists) {
      if (adminExists.email === email) {
        return res.status(400).json({ message: "Email already exists." });
      }
      if (adminExists.username === username) {
        return res.status(400).json({ message: "Username already exists." });
      }
    }
    // Generate OTP
    const otp = crypto.randomInt(100000, 999999).toString();

    // Get OTP expiration time from environment variable
    const otpExpirationTime =
      parseInt(process.env.OTP_EXPIRATION_TIME) || 300000; // default 5 minutes

    // Check if OTP exists for this email
    let existingOTP = await OTP.findOne({ email });

    if (existingOTP) {
      // Update existing OTP
      existingOTP.otp = otp;
      existingOTP.expiresAt = new Date(Date.now() + otpExpirationTime);
      await existingOTP.save();
    } else {
      // Save new OTP to database
      const newOTP = new OTP({
        email,
        otp,
        expiresAt: new Date(Date.now() + otpExpirationTime),
      });
      await newOTP.save();
    }

    // Send email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Email Verification OTP",
      html: getOTPEmailTemplate({ firstName, otp, procedure: "verify email" }),
    });

    return res.status(200).json({
      status: "success",
      message: "OTP sent to your email.",
    });
  } catch (error) {
    console.log("Error in sendOTPForEmailVerification", error);
    return res.status(500).json({
      status: "error",
      message: "Server error",
      error: error.message,
    });
  }
};

// Verify OTP for email verification
const verifyOTPForEmailVerification = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Find OTP document
    const otpDocument = await OTP.findOne({ email });

    if (!otpDocument || otpDocument.otp !== otp) {
      return res
        .status(400)
        .json({ message: "Invalid OTP. Please try again." });
    }

    // Check if OTP has expired
    if (otpDocument.expiresAt < new Date()) {
      return res
        .status(400)
        .json({ message: "OTP has expired. Please request a new one." });
    }

    // Delete the OTP document as it has been used
    // await OTP.deleteOne({ _id: otpDocument._id });

    return res.status(200).json({ message: "Email verified successfully." });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};

// Send OTP for password reset
const sendOTPforPasswordReset = async (req, res) => {
  // console.log("sendOTP");
  try {
    const { username, email } = req.body;

    if (!email && !username) {
      return res
        .status(400)
        .json({ message: "Email or username is required." });
    }

    // Check if admin exists
    const admin = await Admin.findOne({ $or: [{ email }, { username }] });
    if (!admin) {
      return res.status(404).json({ message: "Admin not found." });
    }

    // Generate OTP
    const otp = crypto.randomInt(100000, 999999).toString();

    // Get OTP expiration time from environment variable
    const otpExpirationTime =
      parseInt(process.env.OTP_EXPIRATION_TIME) || 300000; // default 5 minutes

    // Check if an OTP already exists for this admin
    let existingOTP = await OTP.findOne({ email: admin.email });

    if (existingOTP) {
      // Update existing OTP
      existingOTP.otp = otp;
      existingOTP.expiresAt = new Date(Date.now() + otpExpirationTime);
      await existingOTP.save();
    } else {
      // Create new OTP document
      const newOTP = new OTP({
        email: admin.email,
        otp: otp,
        expiresAt: new Date(Date.now() + otpExpirationTime),
      });
      await newOTP.save();
    }

    // Send email
    await transporter.sendMail({
      from: process.env.EMAIL_ADMIN,
      to: admin.email,
      subject: "Password Reset OTP",
      html: getOTPEmailTemplate({
        firstName: admin.firstName,
        otp,
        procedure: "reset password",
      }),
    });
    return res.status(200).json({ message: "OTP sent to your email." });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};

// Verify OTP and log in admin
const verifyOTPforPasswordReset = async (req, res) => {
  try {
    const { username, email, otp } = req.body;

    // Check if admin exists
    const admin = await Admin.findOne({
      $or: [{ email }, { username }],
    });

    if (!admin) {
      return res.status(400).json({ message: "Admin not found." });
    }

    // Find the OTP document for this admin
    const otpDocument = await OTP.findOne({ email: admin.email });

    // console.log(otpDocument);
    if (!otpDocument || otpDocument.otp !== otp) {
      console.log("Invalid OTP", otpDocument.otp, otp);
      return res
        .status(400)
        .json({ message: "Invalid OTP. Please try again." });
    }

    // Check if OTP has expired
    if (otpDocument.expiresAt < new Date()) {
      console.log("OTP ExpiredAt", otpDocument.expiresAt);
      console.log("Current Date", new Date());
      return res
        .status(400)
        .json({ message: "OTP has expired. Please request a new one." });
    }

    // Delete the OTP document as it has been used
    // await OTP.deleteOne({ _id: otpDocument._id });

    // Generate JWT token
    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    // Return admin data and token
    return res.status(200).json({ admin, token });
  } catch (error) {
    console.log("Error in verifyOTPforPasswordReset", error);
    return res.status(500).json({ message: "Server error", error });
  }
};

// Reset password
const resetPassword = async (req, res) => {
  try {
    console.log("newPassword", req.body);
    console.log("req.admin", req.admin);
    const { newPassword } = req.body;

    const admin = await Admin.findById(req.user.id);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found." });
    }

    // Hash the new password
    admin.password = await bcrypt.hash(newPassword, 10);

    await admin.save();

    return res.status(200).json({ message: "Password reset successfully." });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
    console.log("Error in resetPassword", error);
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    // Validate input
    if (!oldPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Both old and new passwords are required." });
    }

    const admin = await Admin.findById(req.user.id);
    if (!admin || !admin.password) {
      return res
        .status(404)
        .json({ message: "Admin not found or invalid admin data." });
    }

    // Check if old password is correct
    const isPasswordCorrect = await bcrypt.compare(oldPassword, admin.password);

    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid old password." });
    }

    // Hash the new password
    admin.password = await bcrypt.hash(newPassword, 10);

    await admin.save();

    return res.status(200).json({ message: "Password changed successfully." });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
    console.log("Error in changePassword", error);
  }
};

// Update admin profile
const updateAdminProfile = async (req, res) => {
  console.log("updateAdminProfile", req.body);
  try {
    const { firstName, lastName, username, email, password } = req.body;

    const admin = await Admin.findById(req.user.id);
    if (!admin) {
      return res.status(404).json({
        status: "error",
        message: "Admin not found.",
      });
    }

    if (password) {
      // Check if password is correct before allowing profile update
      const isPasswordCorrect = await bcrypt.compare(password, admin.password);
      if (!isPasswordCorrect) {
        return res.status(400).json({
          status: "error",
          message: "Invalid password.",
        });
      }
    }

    if (username) {
      // Check if username is already taken by another admin
      const existingUsername = await Admin.findOne({ username: username });
      if (existingUsername) {
        return res.status(400).json({ message: "Username is already taken." });
      } else {
        admin.username = username;
      }
    }

    if (email) {
      // Check if email is already taken by another admin
      const existingEmail = await Admin.findOne({ email: email });
      if (existingEmail) {
        return res
          .status(400)
          .json({ message: "Email is already registered." });
      } else {
        admin.email = email;
      }
    }

    // Update admin profile
    if (firstName) {
      admin.firstName = firstName;
    }
    if (lastName) {
      admin.lastName = lastName;
    }

    await admin.save();

    return res.status(200).json({
      status: "success",
      message: "Profile updated successfully",
      data: { user: admin },
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Server error",
      error: error.message,
    });
  }
};

// Delete admin
const deleteAdmin = async (req, res) => {
  try {
    const { password } = req.body;
    const admin = await Admin.findById(req.user.id);
    if (!admin) {
      return res.status(404).json({
        status: "error",
        message: "Admin not found.",
      });
    }

    // Check if password is correct
    const isPasswordCorrect = await bcrypt.compare(password, admin.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({
        status: "error",
        message: "Invalid password.",
      });
    }

    await Admin.deleteOne({ _id: admin._id });
    return res.status(200).json({
      status: "success",
      message: "Admin deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Server error",
      error: error.message,
    });
  }
};

module.exports = {
  register,
  login,
  getAdmin,
  sendOTPforPasswordReset,
  verifyOTPforPasswordReset,
  resetPassword,
  sendOTPForEmailVerification,
  verifyOTPForEmailVerification,
  changePassword,
  updateAdminProfile,
  deleteAdmin,
};
