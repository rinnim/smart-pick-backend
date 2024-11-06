const User = require("../models/user");
const OTP = require("../models/otp");
const { getOTPEmailTemplate } = require("../utils/otp_template");
const { generateToken } = require("../utils/generate_token");
const { comparePassword } = require("../utils/compare_password");
const { generateOTP } = require("../utils/generate_otp");
const { hashPassword } = require("../utils/hash_password");
const transporter = require("../utils/transporter");

const register = async (req, res) => {
  try {
    const { firstName, lastName, username, email, password, otp } = req.body;

    // Check if all required fields are provided
    if (!firstName || !lastName || !username || !email || !password || !otp) {
      return res.status(400).json({
        status: "error",
        message: "All fields are required.",
      });
    }

    // Validate email
    if (!email.includes("@") && !email.includes(".")) {
      return res.status(400).json({
        status: "error",
        message: "Invalid email address.",
      });
    }

    // Validate username
    if (username.length < 3) {
      return res.status(400).json({
        status: "error",
        message: "Username must be at least 3 characters long.",
      });
    }

    // Validate password
    if (password.length < 6) {
      return res.status(400).json({
        status: "error",
        message: "Password must be at least 6 characters long.",
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
    const hashedPassword = await hashPassword(password);

    // Create new user
    const user = await User.create({
      firstName: firstName,
      lastName: lastName,
      username: username,
      email: email,
      password: hashedPassword,
    });

    // Return the user data
    return res.status(200).json({
      status: "success",
      message: "User registered successfully.",
      data: { user: user },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: "error",
      message: "Failed to register user.",
      error: error.message,
    });
  }
};

// Login using username or email and password
const login = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if all required fields are provided
    if (!username && !email || !password) {
      return res.status(400).json({
        status: "error",
        message: "All fields are required.",
      });
    }

    // Check if user exists
    const user = await User.findOne({ $or: [{ email }, { username }] });
    if (!user) {
      return res.status(401).json({
        status: "error",
        message: "Invalid Username or Email.",
      });
    }

    // Check if password is correct
    const isPasswordCorrect = await comparePassword(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        status: "error",
        message: "Invalid password.",
      });
    }

    // Generate token
    const token = generateToken(user);

    // Return user data and token
    return res.status(200).json({
      status: "success",
      message: "User logged in successfully.",
      data: {
        user: user,
        token: token,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Failed to login.",
      error: error.message,
    });
  }
};

// Get user details (protected route)
const getUserById = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found.",
      });
    }
    // Return user data
    return res.status(200).json({
      status: "success",
      message: "User fetched successfully.",
      data: { user },
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Error fetching user.",
      error: error.message,
    });
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
        return res
          .status(400)
          .json({ status: "error", message: "Email already exists." });
      }
      if (userExists.username === username) {
        return res
          .status(400)
          .json({ status: "error", message: "Username already exists." });
      }
    }
    // Generate OTP
    const otp = generateOTP();

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

    return res
      .status(200)
      .json({ status: "success", message: "OTP sent to your email." });
  } catch (error) {
    return res
      .status(500)
      .json({ status: "error", message: "Server error", error });
  }
};

// Send OTP for password reset
const sendOTPforPasswordReset = async (req, res) => {
  try {
    const { username, email } = req.body;

    if (!email && !username) {
      return res
        .status(400)
        .json({ status: "error", message: "Email or username is required." });
    }

    // Check if user exists
    const user = await User.findOne({ $or: [{ email }, { username }] });
    if (!user) {
      return res
        .status(404)
        .json({ status: "error", message: "User not found." });
    }

    // Generate OTP
    const otp = generateOTP();

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
    return res
      .status(200)
      .json({ status: "success", message: "OTP sent to your email." });
  } catch (error) {
    return res
      .status(500)
      .json({ status: "error", message: "Server error", error });
  }
};

// Verify OTP and log in user
const verifyOTPforPasswordReset = async (req, res) => {
  try {
    const { username, email, otp } = req.body;

    // Check if user exists
    const user = await User.findOne({ $or: [{ email }, { username }] });
    if (!user) {
      return res.status(400).json({ message: "User not found." });
    }

    // Find the OTP document for this user
    const otpDocument = await OTP.findOne({ email: user.email });

    // Check if OTP is valid
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
    await OTP.deleteOne({ _id: otpDocument._id });

    // Generate JWT token
    const token = generateToken(user);

    // Return user data and token
    return res.status(200).json({ user, token });
  } catch (error) {
    return res
      .status(500)
      .json({ status: "error", message: "Server error", error });
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
    user.password = await hashPassword(newPassword);

    await user.save();

    return res.status(200).json({ message: "Password reset successfully." });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
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

    // Validate new password
    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ message: "New password must be at least 6 characters long." });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Check if old password is correct
    const isPasswordCorrect = await comparePassword(oldPassword, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid old password." });
    }

    // Hash the new password
    user.password = await hashPassword(newPassword);

    await user.save();

    return res.status(200).json({ message: "Password changed successfully." });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};

// Update user profile
const updateUserProfile = async (req, res) => {
  try {
    const { firstName, lastName, username, email, password } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (password) {
      // Check if password is correct before allowing profile update
      const isPasswordCorrect = await comparePassword(password, user.password);
      if (!isPasswordCorrect) {
        return res.status(400).json({ message: "Invalid password." });
      }
    }

    if (username) {
      // Check if username is already taken by another user
      const existingUsername = await User.findOne({ username: username });
      if (existingUsername) {
        return res.status(400).json({ message: "Username is already taken." });
      } else {
        user.username = username;
      }
    }

    if (email) {
      // Check if email is already taken by another user
      const existingEmail = await User.findOne({ email: email });
      if (existingEmail) {
        return res
          .status(400)
          .json({ message: "Email is already registered." });
      } else {
        user.email = email;
      }
    }

    // Update user profile
    if (firstName) {
      user.firstName = firstName;
    }
    if (lastName) {
      user.lastName = lastName;
    }

    await user.save();

    return res
      .status(200)
      .json({ user, message: "Profile updated successfully." });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};

// Delete user
const deleteUserByUser = async (req, res) => {
  try {
    const { password } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found.",
      });
    }

    // Check if password is correct
    const isPasswordCorrect = await comparePassword(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({
        status: "error",
        message: "Invalid password.",
      });
    }

    await User.deleteOne({ _id: user._id });
    return res.status(200).json({
      status: "success",
      message: "User deleted successfully.",
      user: user,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const totalUsers = await User.countDocuments();
    const totalPages = Math.ceil(totalUsers / limit);

    const users = await User.find().skip(skip).limit(limit);

    if (!users || users.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "No users found.",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Users fetched successfully.",
      data: {
        users,
        currentPage: page,
        totalPages,
        totalUsers,
        resultsPerPage: limit,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// Search users by firstName, lastName, username, email
const searchUsersByAnyField = async (req, res) => {
  try {
    const { query } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let searchQuery = {};
    if (query) {
      searchQuery = {
        $or: [
          { firstName: { $regex: query, $options: "i" } },
          { lastName: { $regex: query, $options: "i" } },
          { username: { $regex: query, $options: "i" } },
          { email: { $regex: query, $options: "i" } },
        ],
      };
    }

    // Get total count for pagination
    const totalUsers = await User.countDocuments(searchQuery);
    const totalPages = Math.ceil(totalUsers / limit);

    // Get paginated results
    const users = await User.find(searchQuery).skip(skip).limit(limit);

    if (!users || users.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "No users found.",
      });
    }

    // Add artificial delay (temporary)
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return res.status(200).json({
      status: "success",
      message: "Users fetched successfully.",
      data: {
        users,
        currentPage: page,
        totalPages,
        totalUsers,
        resultsPerPage: limit,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// Delete user by admin
const deleteUserByAdmin = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found.",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "User deleted successfully.",
      user: user,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.message,
      error: error,
    });
  }
};

module.exports = {
  register,
  login,
  getUserById,
  sendOTPforPasswordReset,
  verifyOTPforPasswordReset,
  resetPassword,
  sendOTPForEmailVerification,
  changePassword,
  updateUserProfile,
  deleteUserByUser,
  getAllUsers,
  deleteUserByAdmin,
  searchUsersByAnyField,
};
