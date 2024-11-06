const jwt = require("jsonwebtoken");

// Function to generate a JWT
const generateToken = (user) => {
  // Payload: Data you want to encode in the token
  const payload = {
    id: user._id, // User ID
    role: user.role, // User's role for role-based authentication
  };

  // Get token expiration time from env or use default 1 day
  const tokenExpiresIn = process.env.JWT_EXPIRES_IN || "1d";

  // Generate the token
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: tokenExpiresIn });

  return token;
};

module.exports = { generateToken };
