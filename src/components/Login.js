import React, { useState } from "react";
import api from "../api";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      console.log("🔄 Attempting login...");
      const res = await api.post("/auth/login", { email, password });
      
      console.log("✅ Login successful:", res.data);
      
      // Store token and user data
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      
      console.log("🔐 Token stored, redirecting...");
      
      // FIX: Redirect to the correct driver tasks route
      setTimeout(() => {
        window.location.href = "/driver/tasks";
      }, 500);
      
    } catch (err) {
      console.error("❌ Login error:", err);
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="login-container" style={styles.container}>
      <div style={styles.card}>
        {/* Header Section */}
        <div style={styles.header}>
          <h1 style={styles.title}>Driver Login</h1>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              style={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <div style={styles.passwordContainer}>
              <input
                type={showPassword ? "text" : "password"}
                style={styles.passwordInput}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
              <button
                type="button"
                style={styles.eyeButton}
                onClick={togglePasswordVisibility}
                disabled={loading}
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
          </div>

          {error && (
            <div style={styles.error}>
              {error}
            </div>
          )}

          {/* Divider Line */}
          <div style={styles.divider}></div>

          <button 
            type="submit" 
            style={{
              ...styles.button,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
            disabled={loading}
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>

          <div style={styles.footer}>
            <label style={styles.rememberMe}>
              <input type="checkbox" style={styles.checkbox} disabled={loading} /> 
              <span style={styles.rememberText}>Remember me</span>
            </label>
            <a href="#" style={styles.forgotLink}>Forgot password?</a>
          </div>
        </form>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    height: "100vh",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    fontFamily: "Arial, sans-serif",
  },
  card: {
    width: 380, // Slightly reduced width
    padding: 25, // Reduced from 30px
    borderRadius: 12,
    background: "white",
    boxShadow: "0 8px 25px rgba(0,0,0,0.15)",
  },
  header: {
    textAlign: "center",
    marginBottom: 15, // Reduced from 20px
  },
  title: { 
    color: "#333",
    fontSize: "24px", // Reduced from 28px
    fontWeight: "bold",
    margin: 0,
    padding: 0,
  },
  field: { 
    marginBottom: 12, // Reduced from 15px
    display: "flex", 
    flexDirection: "column" 
  },
  label: {
    marginBottom: 4, // Reduced from 5px
    fontWeight: "600",
    color: "#333",
    fontSize: "13px", // Reduced from 14px
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  input: {
    padding: "10px", // Reduced from 12px
    border: "2px solid #e1e1e1",
    borderRadius: "6px",
    fontSize: "15px",
    outline: "none",
    transition: "border-color 0.3s",
    backgroundColor: "#fafafa",
  },
  passwordContainer: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  passwordInput: {
    padding: "10px 40px 10px 10px", // Reduced padding
    border: "2px solid #e1e1e1",
    borderRadius: "6px",
    fontSize: "15px",
    width: "100%",
    outline: "none",
    transition: "border-color 0.3s",
    backgroundColor: "#fafafa",
  },
  eyeButton: {
    position: "absolute",
    right: "10px", // Reduced from 12px
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "15px", // Reduced from 16px
    padding: "0",
    width: "22px", // Reduced from 24px
    height: "22px", // Reduced from 24px
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.6,
    transition: "opacity 0.3s",
    borderRadius: "50%",
  },
  divider: {
    height: "1px",
    background: "#e1e1e1",
    margin: "6px 0", // Reduced from 8px
  },
  button: {
    width: "100%",
    padding: "10px", // Reduced from 12px
    backgroundColor: "#007bff",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "15px", // Reduced from 16px
    fontWeight: "bold",
    transition: "background-color 0.3s",
    marginBottom: "8px", // Reduced from 10px
  },
  footer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "13px", // Reduced from 14px
  },
  rememberMe: {
    display: "flex",
    alignItems: "center",
    gap: "5px", // Reduced from 6px
    cursor: "pointer",
    color: "#666",
  },
  checkbox: {
    margin: 0,
    width: "14px", // Reduced from 16px
    height: "14px", // Reduced from 16px
  },
  rememberText: {
    fontSize: "13px", // Reduced from 14px
    color: "#666",
  },
  forgotLink: {
    fontSize: "13px", // Reduced from 14px
    color: "#007bff",
    textDecoration: "none",
    fontWeight: "500",
  },
  error: {
    color: "red", 
    fontSize: "13px", // Reduced from 14px
    padding: "6px", // Reduced from 8px
    background: "#ffe6e6", 
    borderRadius: "4px",
    marginBottom: "4px", // Reduced from 5px
    textAlign: "center",
    border: "1px solid #ffcccc",
  },
};

export default Login;