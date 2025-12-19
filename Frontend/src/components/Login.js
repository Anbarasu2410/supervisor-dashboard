import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
   
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }
    
    if (!email.includes('@')) {
      setError("Please enter a valid email address");
      return;
    }
    
    setError("");
    setLoading(true);

    try {
      const result = await login(email, password);
      console.log(result)
      if (result.success) {
        const userRole = result.role;
        
        if (userRole === "driver") {
          navigate("/driver/tasks");
        } else if (userRole === "worker") {
          navigate("/worker/today-trip");
        } else {
          navigate("/dashboard");
        }
      } else {
        setError(result.message || "Login failed");
      }
      
    } catch (err) {
      console.error("❌ Login error:", err);
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Driver Login</h1>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
              Email
            </label>
            <input
              type="email"
              className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-blue-500 transition-colors ${
                loading ? "bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed" : "bg-gray-50 border-gray-200 text-gray-800"
              }`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className={`w-full px-4 py-3 pr-12 border-2 rounded-lg focus:outline-none focus:border-blue-500 transition-colors ${
                  loading ? "bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed" : "bg-gray-50 border-gray-200 text-gray-800"
                }`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                placeholder="Enter your password"
              />
              <button
                type="button"
                className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full transition-colors ${
                  loading ? "text-gray-400 cursor-not-allowed" : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                }`}
                onClick={togglePasswordVisibility}
                disabled={loading}
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm text-center">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className={`w-full py-3 px-4 rounded-lg font-bold text-white transition-colors ${
              loading 
                ? "bg-blue-400 cursor-not-allowed" 
                : "bg-blue-500 hover:bg-blue-600"
            }`}
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Signing In...</span>
              </div>
            ) : (
              "Sign In"
            )}
          </button>

          <div className="flex justify-between items-center text-sm">
            <label className={`flex items-center space-x-2 ${
              loading ? "text-gray-400 cursor-not-allowed" : "text-gray-600 cursor-pointer"
            }`}>
              <input 
                type="checkbox" 
                className={`w-4 h-4 rounded ${
                  loading ? "cursor-not-allowed" : "cursor-pointer"
                }`}
                disabled={loading} 
              /> 
              <span>Remember me</span>
            </label>
            <a 
              href="/forgot-password"
              className={`font-medium transition-colors ${
                loading ? "text-gray-400 pointer-events-none" : "text-blue-500 hover:text-blue-700"
              }`}
              onClick={(e) => loading && e.preventDefault()}
            >
              Forgot password?
            </a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;