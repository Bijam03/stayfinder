import jwt from "jsonwebtoken";
import User from "../models/User.js";

// ─── Protect Middleware ────────────────────────────────────
// Add this to any route that requires login
export const protect = async (req, res, next) => {
  let token;

  // Check for token in cookies first
  if (req.cookies.token) {
    token = req.cookies.token;
  }
  // Also check Authorization header (for mobile apps)
  else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  // If no token found, deny access
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authorized. Please login first.",
    });
  }

  try {
    // Verify the token is valid and not expired
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find the user from database using ID in token
    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User no longer exists",
      });
    }

    // Block deactivated users even if they have a valid token
    if (!req.user.isActive) {
      res.cookie("token", "", { httpOnly: true, expires: new Date(0) });
      return res.status(403).json({
        success: false,
        message: "Your account has been deactivated. Please contact support.",
      });
    }

    next(); // ✅ Token valid — allow access to the route
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token. Please login again.",
    });
  }
};

// ─── Role Middleware ───────────────────────────────────────
// Use this to restrict routes to specific roles
// Example: authorizeRoles("host") — only hosts can access
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not allowed to access this route`,
      });
    }
    next();
  };
};