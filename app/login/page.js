"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useAuthStore } from "../../store/authStore";
import { Mail, Lock, Eye, EyeOff, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);

  const {
    token,
    user,
    isAuthenticated,
    isLoading,
    error,
    setAuth,
    clearAuth,
    setError,
    setLoading,
  } = useAuthStore();

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/rep/dashboard");
      }
    }
  }, [isAuthenticated, user, router]);

  // Handle Login submission without throwing unhandled exceptions
  const onSubmit = async (data) => {
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
          body: JSON.stringify({
            email: data.email,
            password: data.password,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Login failed");
        toast.error(result.error || "Failed to sign in.");
        setLoading(false);
        return;
      }

      // Save token and user details to Zustand
      setAuth(result.token, result.user);
      toast.success(`Welcome back, ${result.user.name}!`);

      // Redirect based on role
      if (result.user.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/rep/dashboard");
      }
    } catch (err) {
      console.warn("Login request warning:", err);
      setError("Something went wrong. Please check your network connection.");
      toast.error("Failed to sign in due to a connection error.");
      setLoading(false);
    }
  };

  // Handle Forgot Password trigger without throwing unhandled exceptions
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    const email = getValues("email");

    if (!email) {
      toast.error("Please enter your email address first.");
      setError("Please enter your email address to trigger a password reset.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address.");
      setError("Please enter a valid email address.");
      return;
    }

    setForgotPasswordLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/auth/forgot-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Failed to request password reset");
        toast.error(result.error || "Failed to process password reset.");
        setForgotPasswordLoading(false);
        return;
      }

      toast.success(result.message || "Password reset link sent to your email!");
    } catch (err) {
      console.warn("Forgot password request warning:", err);
      setError("Failed to process password reset request due to a connection error.");
      toast.error("Failed to process password reset.");
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 relative min-h-screen bg-gradient-to-b from-brand-burgundy-light to-white">
      {/* Background ambient radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(112,12,26,0.02)_0%,rgba(255,255,255,0.95)_80%)] pointer-events-none z-0" />

      <div className="w-full max-w-[420px] z-10">
        {/* Brand Logo & Header */}
        <div className="flex flex-col items-center mb-8 text-center animate-fadeIn">
          {/* Official Logo Image */}
          <img
            src="/logo.png"
            alt="Lipistry Logo"
            className="w-96 object-contain mb-1 mix-blend-multiply"
          />
          <p className="text-slate-500 text-[10px] font-bold tracking-widest uppercase">
            SALES REPRESENTATIVE PORTAL
          </p>
        </div>

        {/* Login Panel */}
        <div className="glass-card rounded-2xl p-8 relative overflow-hidden border border-slate-200 shadow-xl shadow-slate-100/50">
          {/* Top panel border highlight - Burgundy */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-brand-burgundy" />

          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Sign In</h2>
            <p className="text-slate-500 text-xs mt-1">
              Enter your credentials to access your account dashboard.
            </p>
          </div>

          {/* Error Message Panel */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5 animate-fadeIn">
              <svg
                className="w-4 h-4 text-red-500 shrink-0 mt-0.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email Field */}
            <div>
              <label className="block text-slate-700 text-xs font-bold uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  placeholder="name@lipistry.com"
                  className={`w-full pl-10 pr-4 py-3 rounded-xl text-sm font-semibold glass-input ${errors.email ? "border-red-500/50 focus:border-red-500/50" : ""
                    }`}
                  {...register("email", {
                    required: "Email address is required",
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: "Please enter a valid email address",
                    },
                  })}
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-xxs mt-1.5 font-semibold ml-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-slate-700 text-xs font-bold uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-brand-burgundy hover:text-brand-burgundy-hover text-xs font-bold transition-colors duration-200 cursor-pointer"
                  disabled={forgotPasswordLoading}
                >
                  {forgotPasswordLoading ? "Sending..." : "Forgot Password?"}
                </button>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-10 py-3 rounded-xl text-sm font-semibold glass-input ${errors.password ? "border-red-500/50 focus:border-red-500/50" : ""
                    }`}
                  {...register("password", {
                    required: "Password is required",
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-650 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-xxs mt-1.5 font-semibold ml-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit Button - Burgundy Color */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3.5 px-4 bg-brand-burgundy hover:bg-brand-burgundy-hover active:scale-[0.98] text-white text-sm font-bold rounded-xl shadow-md transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <Sparkles className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer info */}
        <p className="text-slate-400 text-center text-xs mt-8 font-semibold leading-relaxed">
          Lipistry wholesale backend is powered by Shopify.
          <br />
          Payments securely encrypted and processed by Stripe.
        </p>
      </div>
    </div>
  );
}
