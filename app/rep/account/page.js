"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { User, Mail, Tag, Phone, ShieldCheck, Sparkles, Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function RepAccount() {
  const { user, token } = useAuthStore();

  const [loading, setLoading] = useState(false);
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPasswords((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();

    if (!passwords.currentPassword || !passwords.newPassword || !passwords.confirmNewPassword) {
      toast.error("Please fill in all password fields.");
      return;
    }

    if (passwords.newPassword !== passwords.confirmNewPassword) {
      toast.error("New passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/change-password`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            currentPassword: passwords.currentPassword,
            newPassword: passwords.newPassword
          })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to change password.");
      }

      toast.success("Password updated successfully!");
      setPasswords({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: ""
      });
    } catch (err) {
      toast.error(err.message || "Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn text-left">
      {/* Profile Details Panel */}
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Representative Profile</h1>
          <p className="text-slate-500 text-xs mt-1 font-semibold">Review your territory credentials, rep identification, and contact info.</p>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-[#ebdfe1] bg-white shadow-sm space-y-6">
          {/* User Card */}
          <div className="flex items-center gap-4 border-b border-[#ebdfe1]/50 pb-5">
            <div className="w-12 h-12 rounded-full bg-brand-burgundy-light border border-brand-burgundy/10 flex items-center justify-center">
              <User className="w-6 h-6 text-brand-burgundy" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">{user.name}</h3>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold border bg-brand-burgundy-light text-brand-burgundy border-brand-burgundy/10 mt-1 uppercase tracking-wider">
                Sales Representative
              </span>
            </div>
          </div>

          {/* Info Rows */}
          <div className="space-y-4">
            <div className="flex items-center justify-between py-1 border-b border-[#ebdfe1]/10">
              <div className="flex items-center gap-2.5 text-xs text-slate-500 font-semibold">
                <Mail className="w-4.5 h-4.5 text-slate-400" />
                <span>Email Address</span>
              </div>
              <span className="text-xs font-bold text-slate-800">{user.email}</span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-[#ebdfe1]/10">
              <div className="flex items-center gap-2.5 text-xs text-slate-500 font-semibold">
                <Tag className="w-4.5 h-4.5 text-slate-400" />
                <span>Rep Number</span>
              </div>
              <span className="text-xs font-bold text-brand-burgundy font-mono">{user.rep_number || "N/A"}</span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-[#ebdfe1]/10">
              <div className="flex items-center gap-2.5 text-xs text-slate-500 font-semibold">
                <Phone className="w-4.5 h-4.5 text-slate-400" />
                <span>Phone Contact</span>
              </div>
              <span className="text-xs font-bold text-slate-800">{user.phone || "Not Configured"}</span>
            </div>

            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2.5 text-xs text-slate-500 font-semibold">
                <ShieldCheck className="w-4.5 h-4.5 text-slate-400" />
                <span>Account Status</span>
              </div>
              <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                Active
              </span>
            </div>
          </div>

          <div className="p-4 bg-brand-burgundy-light/35 border border-brand-burgundy/10 rounded-xl flex gap-3">
            <Sparkles className="w-5 h-5 text-brand-burgundy shrink-0 animate-pulse" />
            <p className="text-[10px] text-brand-burgundy font-bold leading-relaxed">
              Wholesale catalog updates sync automatically. Stripe transaction accounts are isolated per registered doctor profile.
            </p>
          </div>
        </div>
      </div>

      {/* Change Password Panel */}
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Security Credentials</h2>
          <p className="text-slate-500 text-xs mt-1 font-semibold">Change your account password below. Passwords are saved securely.</p>
        </div>

        <form onSubmit={handleUpdatePassword} className="glass-panel p-6 rounded-2xl border border-[#ebdfe1] bg-white shadow-sm space-y-4">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-brand-burgundy border-b border-[#ebdfe1]/50 pb-1.5 flex items-center gap-1.5">
            <Lock className="w-4 h-4" />
            <span>Update Password</span>
          </h3>

          <div>
            <label className="block text-slate-705 text-[10px] font-bold mb-1.5 uppercase tracking-wider">Current Password</label>
            <input
              type="password"
              name="currentPassword"
              required
              value={passwords.currentPassword}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full px-4 py-2 rounded-xl text-xs font-semibold glass-input"
            />
          </div>

          <div>
            <label className="block text-slate-705 text-[10px] font-bold mb-1.5 uppercase tracking-wider">New Password</label>
            <input
              type="password"
              name="newPassword"
              required
              value={passwords.newPassword}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full px-4 py-2 rounded-xl text-xs font-semibold glass-input"
            />
          </div>

          <div>
            <label className="block text-slate-705 text-[10px] font-bold mb-1.5 uppercase tracking-wider">Confirm New Password</label>
            <input
              type="password"
              name="confirmNewPassword"
              required
              value={passwords.confirmNewPassword}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full px-4 py-2 rounded-xl text-xs font-semibold glass-input"
            />
          </div>

          <div className="pt-3 border-t border-[#ebdfe1] flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-brand-burgundy hover:bg-brand-burgundy-hover text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                <span>Update Password</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
