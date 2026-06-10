import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { apiRequest } from "../utils/apiClient.js";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadMe = async () => {
    try {
      const data = await apiRequest("/api/auth/me");
      const normalizedUser = {
        ...data.user,
        _id: data.user?._id || data.user?.id,
      };
      setUser(normalizedUser);
    } catch (err) {
      localStorage.removeItem("auth_token");
      setUser(null);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      setLoading(false);
      return;
    }

    loadMe().finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const handleInactive = (event) => {
      const message =
        event?.detail?.message ||
        "Account inactive. Please contact project manager or team leader.";
      localStorage.removeItem("auth_token");
      setUser(null);
      setError(message);
      toast.error(message);
    };

    window.addEventListener("auth:inactive", handleInactive);
    return () => window.removeEventListener("auth:inactive", handleInactive);
  }, []);

  const login = async (email, password) => {
    setError("");
    const data = await apiRequest("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem("auth_token", data.token);
    const normalizedUser = {
      ...data.user,
      _id: data.user?._id || data.user?.id,
    };
    setUser(normalizedUser);
    if (!normalizedUser.employeeId) {
      await loadMe();
    }
    return data;
  };

  const register = async (payload) => {
    setError("");
    return apiRequest("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  };

  const verifyEmail = async (token) => {
    setError("");
    return apiRequest(`/api/auth/verify-email?token=${encodeURIComponent(token)}`);
  };

  const logout = () => {
    localStorage.removeItem("auth_token");
    setUser(null);
  };

  const refreshUser = async () => {
    await loadMe();
  };

  const value = useMemo(
    () => ({ user, loading, error, setError, login, register, logout, verifyEmail, refreshUser }),
    [user, loading, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
