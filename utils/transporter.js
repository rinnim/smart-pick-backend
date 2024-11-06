const nodemailer = require("nodemailer");

// Transporter for sending emails
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Export the transporter directly, not as an object
module.exports = transporter;
