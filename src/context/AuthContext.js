// src/context/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from "react";
import api from "../services/api"; // ✅ Use centralized axios instance

// Create the Context
const AuthContext = createContext();

// Hook for easy access in components
export const useAuth = () => useContext(AuthContext);

// Provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔐 Load user on page refresh
  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
    }

    setLoading(false);
  }, []);

  // 🟢 Login function
  const login = async (email, password) => {
    try {
      // ✅ Use API instance with .env-based baseURL
      const res = await api.post("/auth/login", { email, password });
      const { token, user } = res.data;

      // Save to localStorage
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      // Update axios default header
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      // Update context state
      setUser(user);

      return { success: true, role: user.role };
    } catch (err) {
      console.error("Login failed:", err.response?.data || err.message);
      return {
        success: false,
        message: err.response?.data?.message || "Login failed",
      };
    }
  };

  // 🔴 Logout function
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    delete api.defaults.headers.common["Authorization"];
    setUser(null);
  };

  // Expose context values
  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
