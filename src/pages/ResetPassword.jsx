/* eslint-disable no-unused-vars */
import { useNavigate, useSearchParams, Link } from "react-router";
import { useState } from "react";
import { apiRequest } from "../utils/apiClient.js";
import { Lock, Eye, EyeOff, ShieldCheck, ArrowRight, ArrowLeft } from "lucide-react";
import logo from "../assets/logo.png";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const email = searchParams.get("email") || "";

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    if (otp.trim().length !== 6) {
      setError("Enter 6 digit OTP");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await apiRequest("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ email, otp, password }),
      });
      navigate("/login");
    } catch (err) {
      setError(err.message || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-110 animate-fade-in">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden p-8 md:p-10">
          {/* Header Section */}
          <div className="mb-10 text-center">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-xl bg-emerald-50 border border-emerald-100 mb-6">
              <img src={logo} alt="Team Management Portal" className="h-9 w-9 object-contain" />
            </div>
            <h1 className="text-slate-900 text-2xl font-bold tracking-tight mb-2">Reset Password</h1>
            <p className="text-slate-500 text-sm font-medium">
              Enter the OTP sent to <span className="text-slate-900 font-bold">{email}</span> and create your new password.
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* OTP */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 ml-0.5">OTP Code</label>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" size={18} />
                <input
                  type="text"
                  placeholder="6-digit OTP"
                  value={otp}
                  onChange={(event) => setOtp(event.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 text-sm font-medium bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 ml-0.5">New Password</label>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full pl-11 pr-11 py-2.5 text-sm font-medium bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none"
                  required
                />
                <button type="button" onClick={() => setShowPassword((prev) => !prev)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 ml-0.5">Confirm Password</label>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" size={18} />
                <input
                  type={showConfirm ? "text" : "password"}
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="w-full pl-11 pr-11 py-2.5 text-sm font-medium bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none"
                  required
                />
                <button type="button" onClick={() => setShowConfirm((prev) => !prev)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-xs font-semibold text-center animate-shake">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full rounded-lg bg-emerald-600 py-3 text-sm font-bold text-white shadow-sm shadow-emerald-500/20 transition-all hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Resetting...
                </>
              ) : (
                <>
                  Reset Password
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <Link to="/login" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-emerald-600 transition-colors">
              <ArrowLeft size={16} />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
