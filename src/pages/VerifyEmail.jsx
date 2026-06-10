import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router";
import { apiRequest } from "../utils/apiClient.js";
import { ShieldCheck, ArrowRight, ArrowLeft, RefreshCcw } from "lucide-react";
import logo from "../assets/logo.png";

const VerifyEmail = () => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const inputRefs = useRef([]);

  const email = new URLSearchParams(location.search).get("email") || "";

  useEffect(() => {
    if (!email) {
      navigate("/login");
    }
  }, [email, navigate]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }

    // Auto submit if all fields are filled
    if (newOtp.every((digit) => digit !== "")) {
      setTimeout(() => triggerSubmit(newOtp.join("")), 100);
    }
  };

  const handleKeyDown = (index, event) => {
    if (event.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (event) => {
    event.preventDefault();
    const data = event.clipboardData.getData("text").slice(0, 6);
    if (!/^\d+$/.test(data)) return;

    const newOtp = [...otp];
    data.split("").forEach((char, index) => {
      if (index < 6) newOtp[index] = char;
    });
    setOtp(newOtp);

    // Focus last filled or next empty
    const nextIndex = Math.min(data.length, 5);
    inputRefs.current[nextIndex].focus();

    if (data.length === 6) {
      triggerSubmit(data);
    }
  };

  const triggerSubmit = async (code) => {
    if (loading) return;
    setError("");
    setLoading(true);
    try {
      await apiRequest("/api/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({ email, otp: code, purpose: "verify-email" }),
      });
      navigate("/login");
    } catch (err) {
      setError(err.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const code = otp.join("");
    if (code.length !== 6) {
      setError("Please enter all 6 digits");
      return;
    }
    triggerSubmit(code);
  };

  const handleResend = async () => {
    setResending(true);
    setError("");
    try {
      await apiRequest("/api/auth/resend-otp", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      alert("Verification code resent successfully!");
    } catch (err) {
      setError(err.message || "Failed to resend code");
    } finally {
      setResending(false);
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
            <h1 className="text-slate-900 text-2xl font-bold tracking-tight mb-2">Verify Your Email</h1>
            <p className="text-slate-500 text-sm font-medium">
              We've sent a 6-digit verification code to <span className="text-slate-900 font-bold">{email}</span>
            </p>
          </div>

          <form className="space-y-8" onSubmit={handleSubmit}>
            <div className="flex justify-between gap-2">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className="w-12 h-14 text-center text-xl font-bold bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none"
                />
              ))}
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-xs font-semibold text-center animate-shake">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <button
                type="submit"
                className="w-full rounded-lg bg-emerald-600 py-3.5 text-sm font-bold text-white shadow-sm shadow-emerald-500/20 transition-all hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    Verify Email
                    <ArrowRight size={18} />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-slate-500 hover:text-emerald-600 transition-colors disabled:opacity-50"
              >
                <RefreshCcw size={16} className={resending ? "animate-spin" : ""} />
                {resending ? "Resending..." : "Resend verification code"}
              </button>
            </div>
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

export default VerifyEmail;
