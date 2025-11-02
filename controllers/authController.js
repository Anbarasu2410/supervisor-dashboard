const jwt = require("jsonwebtoken");
const bcrypt= require("bcryptjs");
const User = require("../models/User.js");
const CompanyUser = require("../models/CompanyUser.js");
const Company = require("../models/Company.js");


const login = async (req, res) => {
  try {
    console.log("Login request body:", req.body);
    const { email, password } = req.body;

   // 1️⃣ Validate input
    if (!email || !password)
      return res.status(400).json({ message: "Email and password required" });

    // 1️⃣ Check user exists by email
    const user = await User.findOne({ email });
 console.log("user:", user);

    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: "Invalid email or password" 
      });
    }
    // 3️⃣ Check if password matches
    const validPassword = await bcrypt.compare(password, user.passwordHash);
console.log("validPassword:", validPassword);

    if (!validPassword)
      return res.status(401).json({ message: "Invalid email or password" });

    if (!user.isActive)
      return res.status(403).json({ message: "User account is inactive" });

    // 2️⃣ Get company-user mapping to verify driver role
    const companyUser = await CompanyUser.findOne({ 
      userId: user.id
    
    });
console.log("companyUser:", companyUser);

    
    if (!companyUser) {
      return res.status(403).json({ 
        success: false,
        message: "User not assigned to any company." 
      });
    }
    // 5️⃣ Define allowed roles
    const allowedRoles = [
      "boss",
      "admin",
      "manager",
      "supervisor",
      "driver",
      "worker"
    ];

    if (!allowedRoles.includes(companyUser.role)) {
      return res.status(403).json({ message: "Invalid role" });
    }

    // 3️⃣ Get company details
    const company = await Company.findOne({ id: companyUser.companyId });
    if (!company) {
      return res.status(404).json({ 
        success: false,
        message: "Company not found" 
      });
    }

console.log("company:", company);


    // 4️⃣ Generate JWT with correct structure
    const tokenPayload = {
      userId: user.id,           // Numeric user ID
      companyId: company.id,     // Numeric company ID
      role: companyUser.role,    // User role
      email: user.email          // User email
    };

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

console.log("token:", token);

console.log("response:", {
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
    });


    // 5️⃣ Return response
    return res.json({
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
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ 
      success: false,
      message: "Server error during login" 
    });
  }
};

// Simple profile function
const getProfile = (req, res) => {
  res.json({ 
    success: true,
    message: "Profile endpoint is working",
    user: req.user 
  });
};

// Simple verify token function
const verifyToken = (req, res) => {
  res.json({ 
    success: true,
    message: "Token is valid",
    user: req.user 
  });
};

// Make sure all functions are properly exported
module.exports = {
  login,
  getProfile,
  verifyToken
};
