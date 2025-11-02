import jwt from "jsonwebtoken";
import User from "../models/User.js";
import CompanyUser from "../models/CompanyUser.js";

/**
 * Verify JWT Token Middleware
 * This middleware checks if a valid JWT token is provided and extracts user information
 */
export const verifyToken = async (req, res, next) => {
  try {
    // Check if Authorization header exists and has Bearer token

    const authHeader = req.headers.authorization;
    console.log("🔐 Authorization header:", authHeader);
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ 
        success: false,
        message: "No token provided" 
      });
    }

    // Extract token from "Bearer <token>"
    const token = authHeader.split(" ")[1];
    console.log("🔐 Extracted token:", token);
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: "Invalid token format" 
      });
    }

    // Verify the JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("🔐 Decoded token:", decoded);

    // Find user by numeric ID (from your JWT payload)
    const user = await User.findOne({ id: decoded.userId });
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: "User not found" 
      });
    }
    console.log("🔐 User found:", user);
    // Check if user is active
    if (!user.isActive) {
        console.log("🚫 Inactive user:", user.id);
      return res.status(401).json({ 
        success: false,
        message: "User account is inactive" 
      });
    }

    // Verify user has driver role in CompanyUser collection
    const companyUser = await CompanyUser.findOne({ 
      userId: decoded.userId,
      role: "driver" 
    });

    if (!companyUser) {
      return res.status(403).json({ 
        success: false,
        message: "Access denied. User is not registered as a driver." 
      });
    }
             console.log("🔐 Company user verified:", companyUser);
    // Attach user information to request object for use in subsequent middleware/controllers
    req.user = {
      userId: decoded.userId,        // Numeric user ID
      companyId: decoded.companyId,  // Numeric company ID  
      role: decoded.role,            // User role (driver)
      email: user.email,             // User email
      name: user.name               // User name
    };

    console.log("✅ Token verified for user:", req.user);
    next();

  } catch (err) {
    console.error("❌ Token verification error:", err);

    // Handle specific JWT errors
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ 
        success: false,
        message: "Token expired" 
      });
    }

    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ 
        success: false,
        message: "Invalid token" 
      });
    }

    // Generic error response
    return res.status(500).json({ 
      success: false,
      message: "Token verification failed",
      error: err.message 
    });
  }
};

/**
 * Role-based Authorization Middleware
 * This middleware checks if the user has the required role to access the route
 */
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    // Check if user exists (should be attached by verifyToken middleware)
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        message: "Authentication required" 
      });
    }

    // Check if user role is in the allowed roles list
    if (!allowedRoles.includes(req.user.role)) {
      console.log(`🚫 Access denied. User role: ${req.user.role}, Allowed: ${allowedRoles}`);
      return res.status(403).json({ 
        success: false,
        message: `Access denied. Required roles: ${allowedRoles.join(", ")}` 
      });
    }

    console.log(`✅ Role authorized: ${req.user.role}`);
    next();
  };
};

/**
 * Optional: Simple token verification without database check
 * Use for less sensitive routes
 */
export const verifyTokenOptional = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    }
    
    next();
  } catch (error) {
    // Continue without user info if token is invalid
    next();
  }
};