import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import CompanyUser from "../models/CompanyUser.js";
import Company from "../models/Company.js";

/**
 * LOGIN CONTROLLER
 */
export const login = async (req, res) => {
  try {
    console.log("Login request body:", req.body);
    const { email, password } = req.body;

    // 1️⃣ Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // 2️⃣ Find user by email
    const user = await User.findOne({ email });
    console.log("user:", user);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // 3️⃣ Check password
    const validPassword = await bcrypt.compare(password, user.passwordHash);
    console.log("validPassword:", validPassword);

    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // 4️⃣ Check active status
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "User account is inactive",
      });
    }

    // 5️⃣ Find company-user mapping (based on numeric `userId`)
    const companyUser = await CompanyUser.findOne({ userId: user.id });
    console.log("companyUser:", companyUser);

    if (!companyUser) {
      return res.status(403).json({
        success: false,
        message: "User not assigned to any company.",
      });
    }

    // 6️⃣ Validate allowed roles
    const allowedRoles = ["boss", "admin", "manager", "supervisor", "driver", "worker"];
    if (!allowedRoles.includes(companyUser.role)) {
      return res.status(403).json({
        success: false,
        message: "Invalid role",
      });
    }

    // 7️⃣ Find company (by numeric companyId)
    const company = await Company.findOne({ id: companyUser.companyId });
    console.log("company:", company);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    // 8️⃣ Generate JWT
    const tokenPayload = {
      userId: user.id,          // numeric user id
      companyId: company.id,    // numeric company id
      role: companyUser.role,
      email: user.email,
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: "24h" });

    // 9️⃣ Build response
    const response = {
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: companyUser.role,
        company: {
          id: company.id,
          name: company.name,
          tenant_code: company.tenant_code,
        },
      },
    };

    console.log("response:", response);
    return res.json(response);
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error during login",
    });
  }
};

/**
 * PROFILE CONTROLLER
 */
export const getProfile = (req, res) => {
  return res.json({
    success: true,
    message: "Profile endpoint is working",
    user: req.user,
  });
};

/**
 * VERIFY TOKEN CONTROLLER
 */
export const verifyToken = (req, res) => {
  return res.json({
    success: true,
    message: "Token is valid",
    user: req.user,
  });
};
