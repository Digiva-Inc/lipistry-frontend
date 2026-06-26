"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useAuthStore } from "../store/authStore";
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  const { user, isAuthenticated, isLoading, error, setAuth, setError, setLoading } = useAuthStore();

  const { register, handleSubmit, getValues, formState: { errors } } = useForm({
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (isAuthenticated && user) {
      router.push(user.role === "admin" ? "/admin" : "/rep/dashboard");
    }
  }, [isAuthenticated, user, router]);

  const onSubmit = async (data) => {
    if (isLoading) return; // Prevent multiple clicks

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Login failed");
        toast.error(result.error || "Failed to sign in.");
        return;
      }

      setAuth(result.token, result.user);

      toast.success(`Welcome back, ${result.user.name}!`);

      router.push(
        result.user.role === "admin"
          ? "/admin"
          : "/rep/dashboard"
      );
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please check your connection.");
      toast.error("Connection error.");
    } finally {
      // Always stop loading
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    const email = getValues("email");
    if (!email) { toast.error("Enter your email first."); setError("Enter your email address to reset your password."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast.error("Enter a valid email."); return; }
    setForgotPasswordLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/auth/forgot-password`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) }
      );
      const result = await response.json();
      if (!response.ok) { setError(result.error || "Failed to send reset link"); toast.error(result.error || "Failed."); return; }
      toast.success(result.message || "Reset link sent!");
    } catch (err) {
      setError("Connection error. Try again.");
      toast.error("Failed to send reset link.");
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;1,400&family=Inter:wght@300;400;500;600&display=swap');
        .font-playfair { font-family: 'Playfair Display', serif; }
        @keyframes lp-rise {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes lp-pop {
          from { opacity: 0; transform: scale(0.97) translateY(-4px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-rise-1 { animation: lp-rise 0.5s 0.05s both cubic-bezier(0.22,1,0.36,1); }
        .animate-rise-2 { animation: lp-rise 0.5s 0.13s both cubic-bezier(0.22,1,0.36,1); }
        .animate-rise-3 { animation: lp-rise 0.5s 0.20s both cubic-bezier(0.22,1,0.36,1); }
        .animate-rise-4 { animation: lp-rise 0.5s 0.27s both cubic-bezier(0.22,1,0.36,1); }
        .animate-rise-5 { animation: lp-rise 0.5s 0.34s both cubic-bezier(0.22,1,0.36,1); }
        .animate-error  { animation: lp-pop 0.25s cubic-bezier(0.22,1,0.36,1); }
        .lp-card-enter  { opacity: 0; transform: translateY(20px); transition: opacity 0.55s cubic-bezier(0.22,1,0.36,1), transform 0.55s cubic-bezier(0.22,1,0.36,1); }
        .lp-card-visible { opacity: 1 !important; transform: translateY(0) !important; }
        .lp-btn-arrow { transition: transform 0.2s; }
        .lp-btn:hover .lp-btn-arrow { transform: translateX(4px); }
        .lp-top-line {
          position: absolute;
          top: 0; left: 2rem; right: 2rem;
          height: 2px;
          background: linear-gradient(90deg, transparent, #700C1A 30%, #C4858F 70%, transparent);
          border-radius: 0 0 2px 2px;
        }
      `}</style>

      {/* Page — fixed full viewport, no scroll */}
      <div
        className="fixed inset-0 flex items-center justify-center bg-[#F9F6F4] overflow-hidden"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >

        {/* Ambient glow top-right */}
        <div
          className="pointer-events-none absolute -top-40 -right-40 w-[480px] h-[480px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(112,12,26,0.07) 0%, transparent 70%)" }}
        />
        {/* Ambient glow bottom-left */}
        <div
          className="pointer-events-none absolute -bottom-36 -left-36 w-[420px] h-[420px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(196,133,143,0.08) 0%, transparent 70%)" }}
        />

        {/* Card */}
        <div
          className={`lp-card-enter relative z-10 w-full max-w-[450px] mx-4 bg-white rounded-xl px-10 pt-8 pb-9 ${mounted ? "lp-card-visible" : ""}`}
          style={{ border: "1px solid rgba(112,12,26,0.08)" }}
        >
          {/* Top accent line */}
          <div className="lp-top-line" />

          {/* Logo + tag — tightly grouped */}
          <div className="animate-rise-1 flex flex-col items-center mb-3">
            <img
              src="/Logo.svg"
              alt="Lipistry"
              className="object-contain mb-2"
              style={{ width: 230, mixBlendMode: "multiply" }}
            />
            <span className="text-[9px] font-semibold tracking-[0.2em] uppercase text-[#B0939A]">
              Sales Rep Portal
            </span>
          </div>

          {/* Divider — tight gap above and below */}
          <div className="animate-rise-2 w-7 h-[1.5px] bg-[#E8D8DA] rounded mx-auto mb-3" />

          {/* Heading — snug */}
          <div className="animate-rise-2 text-center mb-6">
            <h1
              className="text-[24px] font-normal text-[#1A1014] leading-snug"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Sign in
            </h1>
          </div>

          {/* Error */}
          {error && (
            <div
              className="animate-error flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-[10px] px-3.5 py-3 mb-5"
              style={{ borderLeft: "3px solid #EF4444" }}
            >
              <svg className="shrink-0 mt-0.5 text-red-500" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span className="text-[12px] text-red-700 leading-relaxed">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>

            {/* Email Field */}
            <div className="animate-rise-3 mb-[18px]">
              <label className="block text-[11px] font-semibold tracking-[0.09em] uppercase text-[#3D2A2E] mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-200"
                  style={{ width: 15, height: 15, color: errors.email ? "#EF4444" : "#C4B0B5" }}
                />
                <input
                  type="email"
                  placeholder="name@lipistry.com"
                  className={`w-full pl-10 pr-3.5 py-3 text-[13.5px] text-[#1A1014] bg-[#FAF8F9] rounded-[11px] outline-none transition-all duration-200 placeholder:text-[#C4B0B5]
                    ${errors.email
                      ? "border-[1.5px] border-red-400 focus:shadow-[0_0_0_3.5px_rgba(239,68,68,0.10)]"
                      : "border-[1.5px] border-[#EDE0E3] hover:border-[#D4B8BC] focus:border-[#700C1A] focus:bg-white focus:shadow-[0_0_0_3.5px_rgba(112,12,26,0.09)]"
                    }`}
                  style={{ fontFamily: "'Inter', sans-serif" }}
                  {...register("email", {
                    required: "Email is required",
                    pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Enter a valid email" },
                  })}
                />
              </div>
              {errors.email && (
                <p className="text-[11px] font-medium text-red-500 mt-1.5 pl-0.5">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="animate-rise-4 mb-[18px]">
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-[11px] font-semibold tracking-[0.09em] uppercase text-[#3D2A2E]">
                  Password
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={forgotPasswordLoading}
                  className="text-[11.5px] font-medium text-[#700C1A] hover:text-[#8C1526] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  {forgotPasswordLoading ? "Sending…" : "Forgot password?"}
                </button>
              </div>
              <div className="relative">
                <Lock
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-200"
                  style={{ width: 15, height: 15, color: errors.password ? "#EF4444" : "#C4B0B5" }}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-10 py-3 text-[13.5px] text-[#1A1014] bg-[#FAF8F9] rounded-[11px] outline-none transition-all duration-200 placeholder:text-[#C4B0B5]
                    ${errors.password
                      ? "border-[1.5px] border-red-400 focus:shadow-[0_0_0_3.5px_rgba(239,68,68,0.10)]"
                      : "border-[1.5px] border-[#EDE0E3] hover:border-[#D4B8BC] focus:border-[#700C1A] focus:bg-white focus:shadow-[0_0_0_3.5px_rgba(112,12,26,0.09)]"
                    }`}
                  style={{ fontFamily: "'Inter', sans-serif" }}
                  {...register("password", { required: "Password is required" })}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#C4B0B5] hover:text-[#700C1A] transition-colors duration-200"
                >
                  {showPassword ? <EyeOff style={{ width: 15, height: 15 }} /> : <Eye style={{ width: 15, height: 15 }} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-[11px] font-medium text-red-500 mt-1.5 pl-0.5">{errors.password.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <div className="animate-rise-5 mt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="lp-btn w-full flex items-center justify-center gap-2.5 py-3.5 px-5 bg-[#700C1A] hover:bg-[#8C1526] text-[#FAF7F5] text-[13px] font-semibold tracking-[0.07em] uppercase rounded-[11px] transition-all duration-200 hover:-translate-y-[1.5px] hover:shadow-[0_8px_24px_rgba(112,12,26,0.28)] active:translate-y-0 active:shadow-none active:scale-[0.985] disabled:opacity-55 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin" style={{ width: 15, height: 15 }} />
                    <span>Signing in…</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="lp-btn-arrow" style={{ width: 15, height: 15 }} />
                  </>
                )}
              </button>
            </div>

          </form>

        </div>
      </div>
    </>
  );
}