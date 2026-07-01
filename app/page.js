"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useAuthStore } from "../store/authStore";
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowRight, ShieldCheck, BarChart3, Users, Sun, Moon } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState("light");
  

  const { user, isAuthenticated, isLoading, error, setAuth, setError, setLoading } = useAuthStore();

  const { register, handleSubmit, getValues, formState: { errors } } = useForm({
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    // setMounted(true);
    const savedTheme = localStorage.getItem("login-theme") || "light";
    // setTheme(savedTheme);
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("login-theme", theme);
    }
  }, [theme, mounted]);

  useEffect(() => {
    if (mounted && isAuthenticated && user) {
      router.push(user.role === "admin" ? "/admin" : "/rep/dashboard");
    }
  }, [mounted, isAuthenticated, user, router]);

  // Prevent flash of login screen if we are already authenticated or still hydrating
  if (!mounted || (isAuthenticated && user)) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#F9F6F4]">
        <Loader2 className="w-8 h-8 text-brand-burgundy animate-spin" />
      </div>
    );
  }

  const onSubmit = async (data) => {
    if (isLoading) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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
      router.push(result.user.role === "admin" ? "/admin" : "/rep/dashboard");
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please check your connection.");
      toast.error("Connection error.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    const email = getValues("email");
    if (!email) {
      toast.error("Enter your email first.");
      setError("Enter your email address to reset your password.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Enter a valid email.");
      return;
    }
    setForgotPasswordLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/forgot-password`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) }
      );
      const result = await response.json();
      if (!response.ok) {
        setError(result.error || "Failed to send reset link");
        toast.error(result.error || "Failed.");
        return;
      }
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
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600&family=Inter:wght@400;500;600;700&display=swap');

        .lp-page {
          font-family: 'Inter', sans-serif;
          background: #f7f4f2;
          transition: background 0.25s ease;
        }

        .lp-page.dark {
          background: #17131c;
        }

        .lp-title { font-family: 'Playfair Display', serif; }

        .lp-card {
          width: 900px;
          height: 600px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.08);
          transition: background 0.25s ease;
        }

        .lp-page.dark .lp-card {
          background: #211b28;
          box-shadow: 0 20px 60px rgba(0,0,0,0.4);
        }

        .lp-input {
          transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease;
        }

        .lp-input:focus {
          border-color: #111;
          box-shadow: 0 0 0 4px rgba(0,0,0,0.05);
        }

        .lp-product {
          max-width: none;
          object-fit: contain;
          filter: drop-shadow(0 18px 18px rgba(0,0,0,0.16));
        }

        .product-showcase {
          height: 235px;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          gap: 0;
          margin-top: 8px;
          margin-bottom: 8px;
        }

        .lp-left {
          background: #fbfaf9;
          transition: background 0.25s ease;
        }

        .lp-page.dark .lp-left {
          background: #000000;
        }

        .lp-right {
          background: #ffffff;
          transition: background 0.25s ease;
        }

        .lp-page.dark .lp-right {
          background: #000000;
        }

        .lp-page.dark .lp-title,
        .lp-page.dark h1,
        .lp-page.dark h2,
        .lp-page.dark label {
          color: #ffffff;
        }

        .lp-page.dark p {
          color: #c9c3d1;
        }

        .lp-page.dark .lp-feature-card p.text-black {
          color: #ffffff;
        }

        .lp-page.dark .lp-feature-card p.text-gray-500 {
          color: #a59cad;
        }

        .lp-page.dark .lp-input {
          background: #2b2433;
          border-color: #3b3344;
          color: #ffffff;
        }

        .lp-page.dark .lp-input::placeholder {
          color: #a59cad;
        }

        .lp-page.dark .lp-input:focus {
          border-color: #ffffff;
          box-shadow: 0 0 0 4px rgba(255,255,255,0.08);
        }

        .lp-page.dark .lp-feature-card {
          background: #2b2433;
          border-color: #3b3344;
        }

        .lp-page.dark .lp-feature-card .border-x {
          border-color: #3b3344;
        }

        .lp-page.dark .lp-theme-btn {
          background: #2b2433;
          border-color: #3b3344;
          color: #ffffff;
        }

        .lp-page.dark svg {
          color: #ffffff;
        }

        .lp-page.dark .text-gray-400,
        .lp-page.dark .text-gray-500,
        .lp-page.dark .text-gray-600,
        .lp-page.dark .text-gray-700 {
          color: #c9c3d1;
        }

        .lp-page.dark .border-gray-200,
        .lp-page.dark .border-gray-100 {
          border-color: #3b3344;
        }

      /* =========================
   RESPONSIVE DESIGN
========================= */

/* Laptop small / tablet landscape */
@media (max-width: 1024px) {
  .lp-page {
    overflow-y: auto;
    padding: 18px;
  }

  .lp-card {
    width: 100%;
    max-width: 880px;
    height: 600px;
  }
}

/* Tablet */
@media (max-width: 900px) {
  .lp-page {
    overflow-y: auto;
    padding: 18px;
  }

  .lp-card {
    width: 100%;
    max-width: 540px;
    height: auto;
    min-height: auto;
    grid-template-columns: 1fr;
  }

  .lp-left {
    display: none;
  }

  .lp-right {
    min-height: 600px;
    padding: 70px 34px 34px;
  }
}

/* Mobile */
@media (max-width: 600px) {
  .lp-page {
    padding: 12px;
    align-items: flex-start;
  }

  .lp-card {
    width: 100%;
    max-width: 100%;
    border-radius: 16px;
  }

  .lp-right {
    min-height: calc(100vh - 24px);
    padding: 68px 22px 26px;
  }

  .lp-theme-btn {
    right: 20px;
    top: 20px;
  }

  .lp-right > div {
    max-width: 100%;
  }
}

/* Small mobile */
@media (max-width: 380px) {
  .lp-right {
    padding: 64px 16px 22px;
  }

  .lp-title {
    font-size: 24px !important;
  }

  .lp-input {
    height: 42px;
  }
}
      `}</style>

      <div className={`lp-page ${theme} min-h-screen w-full overflow-hidden flex items-center justify-center px-4 py-5`}>
        <div className="lp-card bg-white rounded-[20px] overflow-hidden grid grid-cols-2">

          {/* LEFT SIDE */}
          <div className="lp-left relative flex flex-col px-6 pt-7 pb-5 overflow-hidden">
            <div className="absolute left-0 top-0 h-full w-full opacity-80 bg-[radial-gradient(circle_at_15%_20%,#f2e8e3_0%,transparent_35%)]" />

            <div className="relative z-10 text-center shrink-0">
              <img
                src={theme === "dark" ? "/logo_1.png" : "/Logo.svg"}
                alt="Lipistry MD"
                className="mx-auto w-[260px] object-contain mb-2"
              />

              <div className="w-[44px] h-px bg-[#e6d7d5] mx-auto mb-1 relative">
                <span className="absolute left-1/2 top-1/2 w-1 h-1 bg-black rounded-full -translate-x-1/2 -translate-y-1/2" />
              </div>

              <h1 className="lp-title text-[23px] leading-[1.18] text-[#171717] mb-2">
                Beauty in Every Detail,<br />
                Excellence in Every Step.
              </h1>

              <p className="text-[11px] leading-5 text-[#222] max-w-[320px] mx-auto">
                Manage your business, grow your sales<br />
                and stay connected with Lipistry MD.
              </p>
            </div>

            {/* <div className="relative z-10 product-showcase shrink-0">
              <img src="/cap.png" alt="Box" className="lp-product w-[50px] -mr-[0px]" />
              <img src="/1.png" alt="Lipstick" className="lp-product w-[30px] -ml-[11px]" />
              <img src="/cap.png" alt="Box" className="lp-product w-[50px] -mr-[5px]" />
              <img src="/2.png" alt="Lipstick" className="lp-product w-[30px] -ml-[6px]" />
              <img src="/cap.png" alt="Box" className="lp-product w-[50px] -mr-[11px]" />
              <img src="/3.png" alt="Lipstick" className="lp-product w-[30px] -ml-[2px]" />
            </div> */}
{/* Product showcase: 3 lipstick + box groups, evenly spaced */}
   <div className="relative z-10 mb-10 flex shrink-0 items-end justify-center gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="relative flex items-end">
              <img
                src="/cap.png"
                alt="Lipistry MD box"
                className="relative z-0 w-[50px]"
              />
              <img
                src={`/${n}.png`}
                alt="Lipistry MD lipstick"
                className="relative z-10 -ml-[14px] w-[30px]"
              />
            </div>
          ))}
        </div>
            <div className="lp-feature-card relative z-10 bg-white rounded-xl px-4 py-3 grid grid-cols-3 gap-3 shadow-sm border border-gray-100 shrink-0">
              <div className="flex gap-2 items-start">
                <ShieldCheck size={18} className="shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-black">Secure & Reliable</p>
                  <p className="text-[9px] text-gray-800 mt-1 leading-3">Your data is safe with us.</p>
                </div>
              </div>

              <div className="flex gap-2 items-start border-x border-gray-200 px-3">
                <BarChart3 size={18} className="shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-black">Real-time Insights</p>
                  <p className="text-[9px] text-gray-800 mt-1 leading-3">Track performance in real-time.</p>
                </div>
              </div>

              <div className="flex gap-2 items-start">
                <Users size={18} className="shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-black">Business Growth</p>
                  <p className="text-[9px] text-gray-800 mt-1 leading-3">Tools to help you achieve more.</p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="lp-right relative flex items-center justify-center px-7 py-6 overflow-hidden">
            <button
              type="button"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className="lp-theme-btn absolute right-7 top-7 flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 text-[10px] font-semibold text-gray-700"
            >
              {theme === "light" ? <Sun size={13} /> : <Moon size={13} />}
              {theme === "light" ? "Light Mode" : "Dark Mode"}
            </button>

            <div className="w-full max-w-[360px] pt-3">
              <div className="text-center mb-6">
                <p className="text-[10px] tracking-[0.25em] font-bold text-gray-700 uppercase mb-4">
                  Welcome Back
                </p>

                <h2 className="lp-title text-[27px] text-[#111] mb-2 leading-tight">
                  Sign In to Your Account
                </h2>

                <p className="text-[12px] text-gray-500">
                  Enter your credentials to access your dashboard
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3 text-xs text-red-700">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="mb-4">
                  <label className="block text-[10px] font-bold text-gray-700 mb-2 uppercase">
                    Username
                  </label>

                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                    <input
                      type="email"
                      placeholder="Enter your username"
                      className="lp-input w-full h-[43px] pl-11 pr-4 rounded-lg border border-gray-200 outline-none text-xs text-gray-800"
                      {...register("email", {
                        required: "Email is required",
                        pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Enter a valid email" },
                      })}
                    />
                  </div>

                  {errors.email && <p className="text-[10px] text-red-500 mt-1">{errors.email.message}</p>}
                </div>

                <div className="mb-4">
                  <label className="block text-[10px] font-bold text-gray-700 mb-2 uppercase">
                    Password
                  </label>

                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      className="lp-input w-full h-[43px] pl-11 pr-11 rounded-lg border border-gray-200 outline-none text-xs text-gray-800"
                      {...register("password", { required: "Password is required" })}
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {errors.password && <p className="text-[10px] text-red-500 mt-1">{errors.password.message}</p>}
                </div>

                <div className="flex items-center justify-between mb-5">
                  <label className="flex items-center gap-2 text-[10px] text-gray-700">
                    <input type="checkbox" defaultChecked className="accent-black" />
                    Remember me
                  </label>

                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={forgotPasswordLoading}
                    className="text-[10px] font-semibold text-gray-700 underline disabled:opacity-50"
                  >
                    {forgotPasswordLoading ? "Sending..." : "Forgot Password?"}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="lp-btn w-full h-[46px] bg-black hover:bg-[#111] text-white rounded-lg flex items-center justify-center gap-3 font-bold text-xs transition disabled:opacity-60"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      Signing In...
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="lp-btn-arrow" size={16} />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 flex items-center gap-5">
                <div className="h-px bg-gray-200 flex-1" />
                <span className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-xs text-gray-600">
                  or
                </span>
                <div className="h-px bg-gray-200 flex-1" />
              </div>

              <div className="text-center mt-4">
                <p className="text-[10px] text-gray-500 flex justify-center items-center gap-2">
                  <ShieldCheck size={13} />
                  Secure • Trusted • Encrypted
                </p>

                <p className="text-[10px] text-gray-400 mt-3">
                  © 2026 Lipistry MD. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}