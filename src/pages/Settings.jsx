/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable no-unused-vars */
import { useEffect, useState } from "react";
import {
  User,
  Shield,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Edit3,
  Eye,
  EyeOff,
  AlertTriangle,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { apiRequest } from "../utils/apiClient.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { invalidateProfileData } from "../lib/queryInvalidation.js";

const roleLabels = {
  SUPER_ADMIN: "Super Admin",
  PROJECT_MANAGER: "Project Manager",
  TEAM_LEADER: "Team Leader",
  MEMBER: "Member",
};

const Settings = () => {
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("profile");
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({
    name: "",
    officeEmail: "",
    phone: "",
    dateOfBirth: "",
    presentAddress: "",
    permanentAddress: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [securityError, setSecurityError] = useState("");
  const [securityLoading, setSecurityLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [maintenanceEnabled, setMaintenanceEnabled] = useState(false);

  const {
    data: meData,
    isLoading: loadingQuery,
    error: queryError,
  } = useQuery({
    queryKey: ["user", "me"],
    queryFn: () => apiRequest("/api/users/me"),
  });

  useEffect(() => {
    if (meData) {
      const resolved =
        meData?.user || meData?.data?.user || meData?.data || meData;
      setProfile(resolved);
      setForm({
        name: resolved?.name || "",
        officeEmail: resolved?.officeEmail || "",
        phone: resolved?.phone || "",
        dateOfBirth: resolved?.dateOfBirth
          ? new Date(resolved.dateOfBirth).toISOString().slice(0, 10)
          : "",
        presentAddress: resolved?.presentAddress || "",
        permanentAddress: resolved?.permanentAddress || "",
      });
      setLoading(false);
    }
  }, [meData]);

  useEffect(() => {
    if (queryError) {
      setError(queryError.message || "Failed to load profile");
      setLoading(false);
    }
  }, [queryError]);

  const isSuperAdmin = (profile?.role || user?.role) === "SUPER_ADMIN";

  const { data: maintenanceData, isLoading: maintenanceLoading } = useQuery({
    queryKey: ["app-settings", "maintenance"],
    queryFn: () => apiRequest("/api/app-settings/maintenance"),
    enabled: isSuperAdmin,
  });

  useEffect(() => {
    if (maintenanceData && typeof maintenanceData.enabled === "boolean") {
      setMaintenanceEnabled(maintenanceData.enabled);
    }
  }, [maintenanceData]);

  const handleChange = (key) => (event) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
  };

  const saveProfileMutation = useMutation({
    mutationFn: (payload) =>
      apiRequest("/api/users/me", {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(["user", "me"], data);
      invalidateProfileData(queryClient);
    },
  });

  const handleSave = async () => {
    setError("");
    setSuccess("");
    try {
      const payload = Object.fromEntries(
        Object.entries(form).filter(([, value]) => value !== ""),
      );
      if (payload.dateOfBirth === "") {
        delete payload.dateOfBirth;
      }
      const data = await saveProfileMutation.mutateAsync(payload);
      const resolved = data?.user || data?.data?.user || data?.data || data;
      setProfile(resolved);
      setSuccess("Profile updated successfully");
    } catch (err) {
      setError(err.message || "Failed to update profile");
    }
  };

  const handleChangePassword = async () => {
    setSecurityError("");
    if (currentPassword.length < 6) {
      setSecurityError("Current password is required");
      return;
    }
    if (newPassword.length < 6) {
      setSecurityError("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setSecurityError("Passwords do not match");
      return;
    }
    setSecurityLoading(true);
    try {
      await apiRequest("/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify({
          oldPassword: currentPassword,
          newPassword,
        }),
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password changed successfully!");
    } catch (err) {
      setSecurityError(err.message || "Failed to change password");
    } finally {
      setSecurityLoading(false);
    }
  };

  const roleLabel = roleLabels[profile?.role] || profile?.role || "";

  const handleProfileImageChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError("");
    setSuccess("");
    setUploadingImage(true);
    try {
      const apiKey = import.meta.env.VITE_IMAGEBB_API_KEY;
      if (!apiKey) {
        throw new Error("Image upload key is missing");
      }
      const formData = new FormData();
      formData.append("image", file);
      const uploadRes = await fetch(
        `https://api.imgbb.com/1/upload?key=${apiKey}`,
        {
          method: "POST",
          body: formData,
        },
      );
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok || !uploadData?.success) {
        throw new Error(uploadData?.error?.message || "Failed to upload image");
      }
      const imageUrl = uploadData?.data?.url || uploadData?.data?.display_url;
      if (!imageUrl) {
        throw new Error("Upload succeeded but no image URL returned");
      }
      const updated = await saveProfileMutation.mutateAsync({
        profileImage: imageUrl,
      });
      const resolved =
        updated?.user || updated?.data?.user || updated?.data || updated;
      setProfile(resolved);
      setSuccess("Profile image updated successfully");
      await refreshUser();
    } catch (err) {
      setError(err.message || "Failed to upload image");
    } finally {
      setUploadingImage(false);
      event.target.value = "";
    }
  };

  return (
    <div className="min-h-screen p-6 md:p-8 animate-fade-in">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* ─── Sidebar ─── */}
          <div className="w-full lg:w-87.5 bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden lg:sticky lg:top-8">
            {/* Profile Header */}
            <div className="bg-slate-50 p-8 text-center border-b border-slate-100">
              <div className="relative inline-block mb-6">
                <div className="w-24 h-24 rounded-2xl bg-emerald-600 shadow-lg shadow-emerald-600/20 flex items-center justify-center text-3xl font-bold text-white overflow-hidden">
                  {profile?.profileImage || user?.profileImage ? (
                    <img
                      src={profile?.profileImage || user?.profileImage}
                      alt={profile?.name || user?.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    profile?.name?.slice(0, 1)?.toUpperCase() || "U"
                  )}
                  {uploadingImage && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60">
                      <div className="h-7 w-7 border-2 border-white/80 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                <label className="absolute -bottom-2 -right-2 bg-slate-900 text-white p-2 rounded-lg shadow-lg border-2 border-white transition-transform hover:scale-110 cursor-pointer">
                  <Edit3 size={16} />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleProfileImageChange}
                    disabled={uploadingImage}
                  />
                </label>
              </div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                {profile?.name || user?.name || "User"}
              </h2>
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-1 text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                <Shield size={12} />
                {roleLabel}
              </div>
            </div>

            <div className="px-6 pt-8">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Employee ID
                  </span>
                  <span className="text-xs font-bold text-slate-900">
                    {profile?.employeeId || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Assigned Team
                  </span>
                  <span className="text-xs font-bold text-slate-900">
                    {profile?.team?.name || "None"}
                  </span>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="p-6 space-y-2">
              <button
                onClick={() => setActiveTab("profile")}
                className={`flex w-full items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                  activeTab === "profile"
                    ? "bg-slate-900 text-white shadow-md shadow-slate-900/10"
                    : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                <User size={18} />
                Profile Information
              </button>
              <button
                onClick={() => setActiveTab("security")}
                className={`flex w-full items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                  activeTab === "security"
                    ? "bg-slate-900 text-white shadow-md shadow-slate-900/10"
                    : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                <Shield size={18} />
                Account Security
              </button>
              {isSuperAdmin && (
                <button
                  onClick={() => setActiveTab("maintenance")}
                  className={`flex w-full items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                    activeTab === "maintenance"
                      ? "bg-slate-900 text-white shadow-md shadow-slate-900/10"
                      : "text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  <AlertTriangle size={18} />
                  Maintenance
                </button>
              )}
            </div>
          </div>

          {/* ─── Main Content ─── */}
          <div className="flex-1 w-full">
            {activeTab === "profile" && (
              <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h3 className="text-lg font-bold text-slate-900">
                    Personal Details
                  </h3>
                  <button
                    onClick={handleSave}
                    disabled={saveProfileMutation.isPending}
                    className="flex items-center justify-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl hover:bg-emerald-700 transition-all font-bold text-sm shadow-sm disabled:opacity-50 active:scale-95"
                  >
                    <Edit3 size={16} />
                    {saveProfileMutation.isPending
                      ? "Saving..."
                      : "Save Changes"}
                  </button>
                </div>

                <div className="p-8">
                  {loading ? (
                    <div className="flex flex-col items-center py-12 gap-3">
                      <div className="h-8 w-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Loading profile...
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 ml-1">
                          Full Name
                        </label>
                        <input
                          value={form.name}
                          onChange={handleChange("name")}
                          className="w-full px-4 py-2.5 text-sm font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
                          placeholder="John Doe"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 ml-1">
                          Login Email (Read Only)
                        </label>
                        <input
                          value={profile?.email || ""}
                          disabled
                          className="w-full px-4 py-2.5 text-sm font-semibold bg-slate-100 border border-slate-200 rounded-xl text-slate-400 cursor-not-allowed outline-none"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 ml-1">
                          Office Email
                        </label>
                        <input
                          value={form.officeEmail}
                          onChange={handleChange("officeEmail")}
                          className="w-full px-4 py-2.5 text-sm font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
                          placeholder="john@company.com"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 ml-1">
                          Date of Birth
                        </label>
                        <input
                          type="date"
                          value={form.dateOfBirth}
                          onChange={handleChange("dateOfBirth")}
                          className="w-full px-4 py-2.5 text-sm font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 ml-1">
                          Phone Number
                        </label>
                        <input
                          value={form.phone}
                          onChange={handleChange("phone")}
                          className="w-full px-4 py-2.5 text-sm font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
                          placeholder="+1 000 000 0000"
                        />
                      </div>

                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-xs font-bold text-slate-500 ml-1">
                          Current Address
                        </label>
                        <input
                          value={form.presentAddress}
                          onChange={handleChange("presentAddress")}
                          className="w-full px-4 py-2.5 text-sm font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
                          placeholder="Enter current address"
                        />
                      </div>

                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-xs font-bold text-slate-500 ml-1">
                          Permanent Address
                        </label>
                        <input
                          value={form.permanentAddress}
                          onChange={handleChange("permanentAddress")}
                          className="w-full px-4 py-2.5 text-sm font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
                          placeholder="Enter permanent address"
                        />
                      </div>
                    </div>
                  )}

                  {error && (
                    <div className="mt-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-bold text-center">
                      {error}
                    </div>
                  )}
                  {success && (
                    <div className="mt-6 p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs font-bold text-center">
                      {success}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "security" && (
              <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-100">
                  <h3 className="text-lg font-bold text-slate-900">
                    Account Security
                  </h3>
                  <p className="text-xs font-bold text-slate-400 mt-0.5">
                    Manage your password and authentication
                  </p>
                </div>

                <div className="p-8 space-y-8">
                  <div className="grid gap-6">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 ml-1">
                        Current Password
                      </label>
                      <div className="relative">
                        <input
                          type={showCurrentPassword ? "text" : "password"}
                          value={currentPassword}
                          onChange={(event) =>
                            setCurrentPassword(event.target.value)
                          }
                          className="w-full px-4 py-2.5 pr-12 text-sm font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
                          placeholder="Enter current password"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowCurrentPassword((prev) => !prev)
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                          aria-label={
                            showCurrentPassword
                              ? "Hide current password"
                              : "Show current password"
                          }
                        >
                          {showCurrentPassword ? (
                            <EyeOff size={18} />
                          ) : (
                            <Eye size={18} />
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 ml-1">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(event) =>
                            setNewPassword(event.target.value)
                          }
                          className="w-full px-4 py-2.5 pr-12 text-sm font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
                          placeholder="Enter new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword((prev) => !prev)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                          aria-label={
                            showNewPassword
                              ? "Hide new password"
                              : "Show new password"
                          }
                        >
                          {showNewPassword ? (
                            <EyeOff size={18} />
                          ) : (
                            <Eye size={18} />
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 ml-1">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(event) =>
                            setConfirmPassword(event.target.value)
                          }
                          className="w-full px-4 py-2.5 pr-12 text-sm font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
                          placeholder="Repeat new password"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword((prev) => !prev)
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                          aria-label={
                            showConfirmPassword
                              ? "Hide confirm password"
                              : "Show confirm password"
                          }
                        >
                          {showConfirmPassword ? (
                            <EyeOff size={18} />
                          ) : (
                            <Eye size={18} />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {securityError && (
                    <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-bold text-center">
                      {securityError}
                    </div>
                  )}

                  <button
                    onClick={handleChangePassword}
                    className="w-full rounded-xl bg-emerald-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-700 active:scale-[0.98]"
                    disabled={securityLoading}
                  >
                    {securityLoading ? "Updating..." : "Change Password"}
                  </button>
                </div>
              </div>
            )}

            {activeTab === "maintenance" && isSuperAdmin && (
              <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-100">
                  <h3 className="text-lg font-bold text-slate-900">Maintenance Mode</h3>
                  <p className="text-xs font-bold text-slate-400 mt-0.5">
                    Production site will show maintenance screen when enabled.
                  </p>
                </div>
                <div className="p-8 space-y-6">
                  <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
                    <div>
                      <p className="text-sm font-bold text-slate-900">Site Maintenance</p>
                      <p className="text-xs text-slate-500">
                        Local server stays active. Live site shows maintenance screen.
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={maintenanceLoading}
                      onClick={async () => {
                        try {
                          const nextValue = !maintenanceEnabled;
                          await apiRequest("/api/app-settings/maintenance", {
                            method: "PATCH",
                            body: JSON.stringify({ enabled: nextValue }),
                          });
                          setMaintenanceEnabled(nextValue);
                          toast.success(
                            nextValue
                              ? "Maintenance mode enabled"
                              : "Maintenance mode disabled"
                          );
                        } catch (err) {
                          toast.error(err.message || "Failed to update maintenance mode");
                        }
                      }}
                      className={`inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        maintenanceEnabled
                          ? "bg-rose-600 text-white hover:bg-rose-700"
                          : "bg-emerald-600 text-white hover:bg-emerald-700"
                      }`}
                    >
                      {maintenanceEnabled ? "Turn Off" : "Turn On"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
