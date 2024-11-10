const jwt = require("jsonwebtoken");
const Admin = require("../models/admin_model");

const authenticateJWT = (req, res, next) => {
  try {
    const token = req.header("Authorization").replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({
        status: "error",
        message: "No token, authorization denied.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    console.log(req.user);
    next();
  } catch (error) {
    res.status(401).json({ status: "error", message: "Token is not valid" });
  }
};

const checkRole = (role) => {
  return async (req, res, next) => {
    try {
      if (role == "admin") {
        const admin = await Admin.findById(req.user._id);
        if (!admin) {
          return res
            .status(403)
            .json({ status: "error", message: "Forbidden" });
        }
      } else if (role == "user") {
        const user = await User.findById(req.user._id);
        if (!user) {
          return res
            .status(403)
            .json({ status: "error", message: "Forbidden" });
        }
      } else {
        return res.status(403).json({ status: "error", message: "Forbidden" });
      }
      next();
    } catch (error) {
      return res.status(500).json({ status: "error", message: "Server error" });
    }
  };
};

module.exports = { authenticateJWT, checkRole };
