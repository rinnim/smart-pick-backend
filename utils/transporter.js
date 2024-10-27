const nodemailer = require("nodemailer");

// Create a transporter using nodemailer
const transporter = nodemailer.createTransport({
  // Configure your email service here
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

module.exports = transporter;