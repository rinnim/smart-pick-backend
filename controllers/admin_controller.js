const Admin = require("../models/admin_model");
const OTP = require("../models/otp_model");
const { getOTPEmailTemplate } = require("../utils/otp_template");
const transporter = require("../utils/transporter");
const { generateToken } = require("../utils/generate_token");
const { generateOTP } = require("../utils/generate_otp");
const { hashPassword } = require("../utils/hash_password");
const { comparePassword } = require("../utils/compare_password");

const register = async (req, res) => {
  try {
    const { firstName, lastName, username, email, password, otp, secretKey } =
      req.body;

    // Check if secret key is valid
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
    const hashedPassword = await hashPassword(password);

    // Create new admin
    const admin = await Admin.create({
      firstName: firstName,
      lastName: lastName,
      username: username,
      email: email,
      password: hashedPassword,
    });

    // Return the admin data
    return res.status(200).json({
      status: "success",
      message: "Admin registered successfully",
      data: {
        user: admin,
      },
    });
  } catch (error) {
    console.log("Error in register", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to register admin.",
      error: error.message,
    });
  }
};

// Login using username or email and password
const login = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if all required fields are provided
    if ((!username && !email) || !password) {
      return res.status(400).json({
        status: "error",
        message: "All fields are required.",
      });
    }

    // Check if the username or email is present
    const admin = await Admin.findOne({ $or: [{ email }, { username }] });
    if (!admin) {
      return res.status(401).json({
        status: "error",
        message: "Invalid Email or Username.",
      });
    }

    // Check if the password is correct
    const isPasswordCorrect = comparePassword(password, admin.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        status: "error",
        message: "Invalid Password.",
      });
    }

    // Generate JWT token
    const token = generateToken(admin);

    // Return admin data and token
    return res.status(200).json({
      status: "success",
      message: "Admin logged in successfully.",
      data: {
        user: admin,
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

// Get admin details (protected route)
const getAdminById = async (req, res) => {
  try {
    const adminId = req.user.id;

    // Find admin by ID
    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({
        status: "error",
        message: "Admin not found.",
      });
    }
    // Return admin details
    return res.status(200).json({
      status: "success",
      message: "Admin details fetched successfully.",
      data: {
        user: admin,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Failed to fetch admin details.",
      error: error.message,
    });
  }
};

// Send OTP for email verification
const sendOTPForEmailVerification = async (req, res) => {
  try {
    const { email, username, firstName } = req.body;

    // Check if all required fields are provided
    if (!email && !username) {
      return res.status(400).json({
        status: "error",
        message: "Email or username is required.",
      });
    }

    // Check if admin exists using email and username and display errors individually
    const adminExists = await Admin.findOne({ $or: [{ email }, { username }] });
    if (adminExists) {
      if (adminExists.email === email) {
        return res.status(400).json({
          status: "error",
          message: "Email already exists.",
        });
      }
      if (adminExists.username === username) {
        return res.status(400).json({
          status: "error",
          message: "Username already exists.",
        });
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

    // Return success response
    return res.status(200).json({
      status: "success",
      message: "OTP sent to your email.",
    });
  } catch (error) {
    console.log("Error in sendOTPForEmailVerification", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to send OTP.",
      error: error.message,
    });
  }
};

// Verify OTP for email verification
const verifyOTPForEmailVerification = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Check if all required fields are provided
    if (!email || !otp) {
      return res.status(400).json({
        status: "error",
        message: "Email and OTP are required.",
      });
    }

    // Find OTP document
    const otpDocument = await OTP.findOne({ email });

    if (!otpDocument || otpDocument.otp !== otp) {
      return res.status(400).json({
        status: "error",
        message: "Invalid OTP. Please try again.",
      });
    }

    // Check if OTP has expired
    if (otpDocument.expiresAt < new Date()) {
      return res
        .status(400)
        .json({ message: "OTP has expired. Please request a new one." });
    }

    // Delete the OTP document as it has been used
    await OTP.deleteOne({ _id: otpDocument._id });

    return res.status(200).json({ message: "Email verified successfully." });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};

// Send OTP for password reset
const sendOTPforPasswordReset = async (req, res) => {
  try {
    const { username, email } = req.body;

    // Check if email or username is provided
    if (!email && !username) {
      return res.status(400).json({
        status: "error",
        message: "Email or username is required.",
      });
    }

    // Find admin using email or username
    const admin = await Admin.findOne({ $or: [{ email }, { username }] });
    if (!admin) {
      return res.status(404).json({
        status: "error",
        message: "Invalid Email or Username.",
      });
    }

    // Generate OTP
    const otp = generateOTP();

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
    return res.status(200).json({
      status: "success",
      message: "OTP sent to your email.",
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Server error",
      error: error.message,
    });
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
      return res.status(400).json({
        status: "error",
        message: "Invalid Email or Username.",
      });
    }

    // Find the OTP document for this admin
    const otpDocument = await OTP.findOne({ email: admin.email });

    // console.log(otpDocument);
    if (!otpDocument || otpDocument.otp !== otp) {
      console.log("Invalid OTP", otpDocument.otp, otp);
      return res.status(400).json({
        status: "error",
        message: "Invalid OTP. Please try again.",
      });
    }

    // Check if OTP has expired
    if (otpDocument.expiresAt < new Date()) {
      console.log("OTP ExpiredAt", otpDocument.expiresAt);
      console.log("Current Date", new Date());
      return res.status(400).json({
        status: "error",
        message: "OTP has expired. Please request a new one.",
      });
    }

    // Delete the OTP document as it has been used
    await OTP.deleteOne({ _id: otpDocument._id });

    // Generate JWT token
    const token = generateToken(admin);

    // Return admin data and token
    return res.status(200).json({
      status: "success",
      message: "OTP verified successfully.",
      data: {
        user: admin,
        token: token,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Failed to verify OTP.",
      error: error.message,
    });
  }
};

// Reset password
const resetPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;

    // Check if admin exists
    const admin = await Admin.findById(req.user.id);
    if (!admin) {
      return res.status(404).json({
        status: "error",
        message: "Admin not found.",
      });
    }

    // Hash the new password
    admin.password = hashPassword(newPassword);

    // Save updated admin data
    await admin.save();

    // Return success response  
    return res.status(200).json({
      status: "success",
      message: "Password reset successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Server error",
      error: error.message,
    });
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    // Validate input
    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        status: "error",
        message: "Both old and new passwords are required.",
      });
    }

    // Check if admin exists
    const admin = await Admin.findById(req.user.id);
    if (!admin || !admin.password) {
      return res.status(400).json({
        status: "error",
        message: "Admin not found or invalid admin data.",
      });
    }

    // Check if old password is correct
    const isPasswordCorrect = comparePassword(oldPassword, admin.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({
        status: "error",
        message: "Invalid old password.",
      });
    }

    // Hash the new password
    admin.password = await hashPassword(newPassword);

    // Save updated admin data
    await admin.save();

    // Return success response
    return res.status(200).json({
      status: "success",
      message: "Password changed successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Failed to change password.",
      error: error.message,
    });
  }
};

// Update admin profile
const updateAdminProfile = async (req, res) => {
  console.log("updateAdminProfile", req.body);
  try {
    const { firstName, lastName, username, email, password } = req.body;

    // Check if admin exists
    const admin = await Admin.findById(req.user.id);
    if (!admin) {
      return res.status(404).json({
        status: "error",
        message: "Admin not found.",
      });
    }

    // Check if password is correct before allowing profile update
    if (password) {
      const isPasswordCorrect = comparePassword(password, admin.password);
      if (!isPasswordCorrect) {
        return res.status(400).json({
          status: "error",
          message: "Invalid password.",
        });
      }
    }

    // Update username if it has changed
    if (username !== admin.username) {
      // Check if username is already taken by another admin
      const existingUsername = await Admin.findOne({ username: username });
      if (existingUsername) {
        return res.status(400).json({
          status: "error",
          message: "Username is already taken.",
        });
      } else {
        admin.username = username;
      }
    }

    // Update email if it has changed
    if (email !== admin.email) {
      // Check if email is already taken by another admin
      const existingEmail = await Admin.findOne({ email: email });
      if (existingEmail) {
        return res.status(400).json({
          status: "error",
          message: "Email is already registered.",
        });
      } else {
        admin.email = email;
      }
    }

    // Update first name if it has changed
    if (firstName !== admin.firstName) {
      admin.firstName = firstName;
    }

    // Update last name if it has changed
    if (lastName !== admin.lastName) {
      admin.lastName = lastName;
    }

    // Save updated admin data
    await admin.save();

    // Return success response with updated admin data
    return res.status(200).json({
      status: "success",
      message: "Profile updated successfully",
      data: {
        user: admin,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Failed to update profile.",
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
    const isPasswordCorrect = comparePassword(password, admin.password);
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
  getAdminById,
  sendOTPforPasswordReset,
  verifyOTPforPasswordReset,
  resetPassword,
  sendOTPForEmailVerification,
  verifyOTPForEmailVerification,
  changePassword,
  updateAdminProfile,
  deleteAdmin,
};
