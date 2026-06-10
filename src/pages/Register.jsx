/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext.jsx";
import { apiRequest } from "../utils/apiClient.js";
import { Mail, Lock, Eye, EyeOff, User, Hash, Building2, Users, ArrowRight } from "lucide-react";
import logo from "../assets/logo.png";
import loginBg from "../assets/login_bg.png";
import ParticlesBackground from "../components/ParticlesBackground.jsx";

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    employeeId: "",
    email: "",
    serviceLine: "",
    team: "",
    password: "",
    confirmPassword: "",
  });
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [serviceLines, setServiceLines] = useState([]);
  const [teams, setTeams] = useState([]);
  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const loadServiceLines = async () => {
      try {
        const data = await apiRequest("/api/service-lines/public");
        setServiceLines(data);
      } catch (err) {
        setFormError(err.message || "Failed to load service lines");
      }
    };

    loadServiceLines();
  }, []);

  useEffect(() => {
    if (!form.serviceLine) {
      setTeams([]);
      return;
    }

    const loadTeams = async () => {
      try {
        const data = await apiRequest(
          `/api/teams/public?serviceLine=${encodeURIComponent(form.serviceLine)}`
        );
        setTeams(data);
      } catch (err) {
        setFormError(err.message || "Failed to load teams");
      }
    };

    loadTeams();
  }, [form.serviceLine]);

  const handleChange = (key) => (event) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");
    setSuccessMessage("");
    if (form.password !== form.confirmPassword) {
      setFormError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await register({
        name: form.name,
        employeeId: form.employeeId,
        email: form.email,
        serviceLine: form.serviceLine,
        team: form.team,
        password: form.password,
        profileImage: "https://media-api.cloudy.rest/api/file/05e29ba9-96ab-402c-a15f-ef582382bda5.jpg",
      });
      navigate(`/verify-email?email=${encodeURIComponent(form.email)}`);
      setForm({
        name: "",
        employeeId: "",
        email: "",
        serviceLine: "",
        team: "",
        password: "",
        confirmPassword: "",
      });
    } catch (err) {
      setFormError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full pl-11 pr-4 py-2.5 text-sm font-medium rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 transition-all outline-none";
  const selectClass = "w-full pl-11 pr-10 py-2.5 text-sm font-medium rounded-lg text-white focus:outline-none focus:ring-4 focus:ring-emerald-500/20 transition-all appearance-none outline-none disabled:opacity-40 disabled:cursor-not-allowed";

  const glassInputStyle = {
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.15)",
  };

  const handleFocus = (e) => (e.target.style.borderColor = "rgba(16,185,129,0.6)");
  const handleBlur = (e) => (e.target.style.borderColor = "rgba(255,255,255,0.15)");

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
        style={{ background: "linear-gradient(135deg, rgba(10,26,46,0.72) 0%, rgba(12,20,37,0.80) 100%)" }}
      />

      {/* Particles */}
      <ParticlesBackground id="register-particles" />

      {/* Register card — glass effect */}
      <div className="w-full max-w-2xl animate-fade-in relative z-20">
        <div
          className="rounded-2xl overflow-hidden p-8 md:p-12"
          style={{
            background: "rgba(255, 255, 255, 0.08)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            boxShadow: "0 8px 48px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.12)",
          }}
        >
          {/* Header Section */}
          <div className="mb-10 flex flex-col md:flex-row items-center gap-6">
            <div
              className="h-16 w-16 rounded-xl flex items-center justify-center shadow-sm"
              style={{
                background: "rgba(16,185,129,0.18)",
                border: "1px solid rgba(16,185,129,0.35)",
              }}
            >
              <img src={logo} alt="Team Management Portal" className="h-9 w-9 object-contain" />
            </div>
            <div className="text-center md:text-left">
               <h1 className="text-white text-3xl font-bold tracking-tight">Team Management Portal</h1>
               <p className="text-slate-300 text-sm font-medium mt-1">
                 Create your account to start managing your projects and teams.
               </p>
            </div>
          </div>

          <form className="grid gap-6 sm:grid-cols-2" onSubmit={handleSubmit}>
            {/* Full Name */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-sm font-semibold text-slate-200 ml-0.5">Full Name</label>
              <div className="relative group">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-400 transition-colors" size={18} />
                <input
                  type="text"
                  placeholder="John Doe"
                  value={form.name}
                  onChange={handleChange("name")}
                  className={inputClass}
                  style={glassInputStyle}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  required
                />
              </div>
            </div>

            {/* Employee ID */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-200 ml-0.5">Employee ID</label>
              <div className="relative group">
                <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-400 transition-colors" size={18} />
                <input
                  type="text"
                  placeholder="e.g. 17001"
                  value={form.employeeId}
                  onChange={handleChange("employeeId")}
                  className={inputClass}
                  style={glassInputStyle}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-200 ml-0.5">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-400 transition-colors" size={18} />
                <input
                  type="email"
                  placeholder="name@company.com"
                  value={form.email}
                  onChange={handleChange("email")}
                  className={inputClass}
                  style={glassInputStyle}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  required
                />
              </div>
            </div>

            {/* Service Line */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-200 ml-0.5">Service Line</label>
              <div className="relative group">
                <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-400 transition-colors pointer-events-none" size={18} />
                <select
                  value={form.serviceLine}
                  onChange={(event) => { handleChange("serviceLine")(event); setForm((prev) => ({ ...prev, team: "" })); }}
                  className={selectClass}
                  style={glassInputStyle}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  required
                >
                  <option value="" style={{ background: "#0c1425" }}>Select Service Line</option>
                  {serviceLines.map((line) => (<option key={line._id} value={line._id} style={{ background: "#0c1425" }}>{line.name}</option>))}
                </select>
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Team */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-200 ml-0.5">Team</label>
              <div className="relative group">
                <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-400 transition-colors pointer-events-none" size={18} />
                <select
                  value={form.team}
                  onChange={handleChange("team")}
                  disabled={!form.serviceLine}
                  className={selectClass}
                  style={glassInputStyle}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  required
                >
                  <option value="" style={{ background: "#0c1425" }}>Select Team</option>
                  {teams.map((team) => (<option key={team._id} value={team._id} style={{ background: "#0c1425" }}>{team.name}</option>))}
                </select>
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-200 ml-0.5">Password</label>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-400 transition-colors" size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Create password"
                  value={form.password}
                  onChange={handleChange("password")}
                  className={inputClass}
                  style={glassInputStyle}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  required
                />
                <button type="button" onClick={() => setShowPassword((prev) => !prev)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-200 ml-0.5">Confirm Password</label>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-400 transition-colors" size={18} />
                <input
                  type={showConfirm ? "text" : "password"}
                  placeholder="Repeat password"
                  value={form.confirmPassword}
                  onChange={handleChange("confirmPassword")}
                  className={inputClass}
                  style={glassInputStyle}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  required
                />
                <button type="button" onClick={() => setShowConfirm((prev) => !prev)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors">
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {formError && (
              <div className="sm:col-span-2 p-3 rounded-lg text-red-300 text-xs font-semibold text-center animate-shake"
                style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)" }}>
                {formError}
              </div>
            )}

            <button
              type="submit"
              className="sm:col-span-2 mt-2 rounded-lg bg-emerald-600 py-3.5 text-sm font-bold text-white transition-all hover:bg-emerald-500 active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ boxShadow: "0 4px 20px rgba(16,185,129,0.35)" }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Register Account
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 pt-8 text-center" style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
            <p className="text-sm font-medium text-slate-400">
              Already have an account?{" "}
              <Link to="/login" className="text-emerald-400 hover:text-emerald-300 font-bold transition-colors ml-1">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
