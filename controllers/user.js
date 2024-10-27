const User = require("../models/user");
const OTP = require("../models/otp");
const { getOTPEmailTemplate } = require("../utils/otp_template");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const transporter = require("../utils/transporter");

const register = async (req, res) => {
  try {
    const { firstName, lastName, username, email, password } = req.body;

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = await User.create({
      firstName,
      lastName,
      username,
      email,
      password: hashedPassword,
    });

    // Return the user data
    res.status(200).json({ message: "User registered successfully", user });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Login using username or email and password
const login = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    // console.log(username, email, password);

    // Check if user exists
    const user = await User.findOne({ $or: [{ email }, { username }] });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    // Check if password is correct
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    // Return user data and token
    console.log(user, token);
    res.status(200).json({ user, token });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Get user details (protected route)
const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Send OTP for email verification
const sendOTPForEmailVerification = async (req, res) => {
  try {
    const { email, username, firstName } = req.body;

    // Check if user exists using email and username and display errors individually
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      if (userExists.email === email) {
        return res.status(400).json({ message: "Email already exists." });
      }
      if (userExists.username === username) {
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

    res.status(200).json({ message: "OTP sent to your email." });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
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

    res.status(200).json({ message: "Email verified successfully." });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
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

    // Check if user exists
    const user = await User.findOne({ $or: [{ email }, { username }] });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Generate OTP
    const otp = crypto.randomInt(100000, 999999).toString();

    // Get OTP expiration time from environment variable
    const otpExpirationTime =
      parseInt(process.env.OTP_EXPIRATION_TIME) || 300000; // default 5 minutes

    // Check if an OTP already exists for this user
    let existingOTP = await OTP.findOne({ email: user.email });

    if (existingOTP) {
      // Update existing OTP
      existingOTP.otp = otp;
      existingOTP.expiresAt = new Date(Date.now() + otpExpirationTime);
      await existingOTP.save();
    } else {
      // Create new OTP document
      const newOTP = new OTP({
        email: user.email,
        otp: otp,
        expiresAt: new Date(Date.now() + otpExpirationTime),
      });
      await newOTP.save();
    }

    // Send email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Password Reset OTP",
      html: getOTPEmailTemplate({
        firstName: user.firstName,
        otp,
        procedure: "reset password",
      }),
    });
    res.status(200).json({ message: "OTP sent to your email." });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Verify OTP and log in user
const verifyOTPforPasswordReset = async (req, res) => {
  try {
    const { username, email, otp } = req.body;

    // Check if user exists
    const user = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (!user) {
      return res.status(400).json({ message: "User not found." });
    }

    // Find the OTP document for this user
    const otpDocument = await OTP.findOne({ email: user.email });

    // console.log(otpDocument);
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

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    // Return user data and token
    res.status(200).json({ user, token });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Reset password
const resetPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Hash the new password
    user.password = await bcrypt.hash(newPassword, 10);

    await user.save();

    res.status(200).json({ message: "Password reset successfully." });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

module.exports = {
  register,
  login,
  getUser,
  sendOTPforPasswordReset,
  verifyOTPforPasswordReset,
  resetPassword,
  sendOTPForEmailVerification,
  verifyOTPForEmailVerification,
};
