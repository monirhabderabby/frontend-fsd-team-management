/* eslint-disable no-unused-vars */
import { Link, useNavigate } from "react-router";
import { useState } from "react";
import { apiRequest } from "../utils/apiClient.js";
import { Mail, KeyRound, ArrowRight, ArrowLeft } from "lucide-react";
import logo from "../assets/logo.png";
import loginBg from "../assets/login_bg.png";
import ParticlesBackground from "../components/ParticlesBackground.jsx";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await apiRequest("/api/auth/request-password-reset", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      navigate(`/reset-password?email=${encodeURIComponent(email)}`);
    } catch (err) {
      setError(err.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden"
      style={{
        backgroundImage: `url(${loginBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Dark overlay */}
      <div
        className="absolute inset-0 z-0"
        style={{ background: "linear-gradient(135deg, rgba(7,22,11,0.76) 0%, rgba(1,82,22,0.84) 58%, rgba(255,195,0,0.18) 100%)" }}
      />

      {/* Particles */}
      <ParticlesBackground id="forgot-particles" />

      {/* Card — glass effect */}
      <div className="w-full max-w-105 animate-fade-in relative z-20">
        <div
          className="rounded-2xl overflow-hidden p-8 md:p-10"
          style={{
            background: "rgba(7, 22, 11, 0.78)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            boxShadow: "0 8px 48px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.12)",
          }}
        >
          {/* Header Section */}
          <div className="mb-10 text-center">
            <div
              className="inline-flex items-center justify-center h-16 w-16 rounded-xl mb-6"
              style={{
                background: "rgba(255,195,0,0.16)",
                border: "1px solid rgba(255,195,0,0.38)",
              }}
            >
              <img src={logo} alt="Team Management Portal" className="h-9 w-9 object-contain" />
            </div>
            <h1 className="text-white text-2xl font-bold tracking-tight mb-2">Forgot Password</h1>
            <p className="text-slate-300 text-sm font-medium">
              Enter your email address to receive a password reset link.
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-200 ml-0.5">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-400 transition-colors" size={18} />
                <input
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 text-sm font-medium rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 transition-all outline-none"
                  style={{
                    background: "rgba(255,255,255,0.07)",
                    border: "1px solid rgba(255,255,255,0.15)",
                  }}
                  onFocus={e => (e.target.style.borderColor = "rgba(1,162,42,0.75)")}
                  onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.15)")}
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg text-red-300 text-xs font-semibold text-center animate-shake"
                style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)" }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full rounded-lg bg-emerald-600 py-3 text-sm font-bold text-white transition-all hover:bg-emerald-500 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ boxShadow: "0 4px 20px rgba(1,162,42,0.35)" }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sending Link...
                </>
              ) : (
                <>
                  Send Reset Link
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 text-center" style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
            <Link to="/login" className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-emerald-400 transition-colors">
              <ArrowLeft size={16} />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
