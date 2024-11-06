const crypto = require("crypto");

// Function to generate OTP
const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

module.exports = { generateOTP };
