"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import Link from "next/link";
import {
  LayoutDashboard,
  Stethoscope,
  ShoppingCart,
  User,
  LogOut,
  Sparkles,
  UserCheck
} from "lucide-react";

import { toast } from "sonner";

export default function RepLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user, clearAuth } = useAuthStore();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    // Client-side authentication and role guard
    if (!isAuthenticated) {
      router.push("/");
    } else if (user && user.role !== "rep") {
      router.push("/");
      toast.error("Unauthorized access. Sales Representative privileges required.");
    } else {
      setAuthorized(true);
    }
  }, [isAuthenticated, user, router]);

  const handleLogout = () => {
    clearAuth();
    toast.info("Signed out successfully.");
    router.push("/");
  };

  if (!authorized || !user) {
    return (
      <div className="min-h-screen bg-[#f8eff1] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-burgundy border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-650 text-sm font-bold tracking-wider">Verifying portal access...</p>
        </div>
      </div>
    );
  }

  const navLinks = [
    { name: "Dashboard", href: "/rep/dashboard", icon: LayoutDashboard },
    { name: "My Doctors", href: "/rep/doctors", icon: Stethoscope },
    { name: "Orders", href: "/rep/orders", icon: ShoppingCart },
    { name: "Account", href: "/rep/account", icon: UserCheck },
  ];

  return (
    <div className="h-screen bg-[#f8eff1] text-slate-800 flex flex-col md:flex-row relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] ambient-light-pink rounded-full pointer-events-none z-0" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] ambient-light-blue rounded-full pointer-events-none z-0" />

      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 h-screen overflow-hidden bg-white/70 backdrop-blur-md border-r border-brand-burgundy/10 p-5 shrink-0 z-30 shadow-sm sticky top-0">
        {/* Brand Logo */}
        {/* Brand Logo - Desktop */}
        <div className="flex flex-col items-center justify-center gap-2 mb-8 relative group w-full">
          <img
            src="/Logo.svg"
            alt="Lipistry Logo"
            className="h-12 w-auto object-contain mix-blend-multiply transition-transform duration-300 group-hover:scale-105"
          />

          <div className="flex items-center justify-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-rose-gold animate-pulse" />
            <p className="text-[9px] text-brand-burgundy font-extrabold tracking-[0.2em] uppercase font-display text-center">
              Rep Workspace
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="space-y-2 flex-1">
          {navLinks.map((link) => {
            const isActive = pathname.startsWith(link.href);
            const Icon = link.icon;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`
                  relative flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold tracking-wide transition-all duration-300 cursor-pointer group overflow-hidden
                  ${isActive
                    ? "bg-gradient-to-r from-brand-burgundy to-brand-burgundy-hover text-white shadow-md shadow-brand-burgundy/15"
                    : "text-slate-500 hover:bg-brand-burgundy-light/60 hover:text-brand-burgundy"
                  }
                `}
              >
                {/* Active Gold Indicator Pill */}
                {isActive && (
                  <span className="absolute left-0 top-1/4 bottom-1/4 w-1 rounded-r-md bg-brand-rose-gold" />
                )}
                <Icon className={`w-4.5 h-4.5 transition-all duration-300 ${isActive ? "text-brand-rose-gold rotate-3 scale-110" : "text-slate-400 group-hover:text-brand-burgundy group-hover:scale-110"}`} />
                <span className="relative z-10">{link.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Info & Log Out */}
        <div className="pt-4 border-t border-brand-burgundy/10 mt-auto space-y-4">
          <div className="flex items-center gap-3 px-3 py-2.5 bg-brand-burgundy-light/60 border border-brand-burgundy/5 rounded-2xl shadow-inner-sm">
            <div className="w-9 h-9 rounded-full bg-brand-burgundy-light border-2 border-brand-rose-gold/20 flex items-center justify-center shadow-sm shrink-0">
              <User className="w-4.5 h-4.5 text-brand-burgundy" />
            </div>
            <div className="truncate">
              <p className="text-xs font-black text-slate-800 truncate">{user.name}</p>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">{user.rep_number || "Sales Rep"}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold text-red-500 hover:bg-red-50 border border-transparent hover:border-red-100/50 transition-all duration-200 cursor-pointer shadow-sm-hover"
          >
            <LogOut className="w-4.5 h-4.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden z-10 relative">
        {/* Top Header - Desktop only */}
        <header className="hidden md:flex bg-white/75 backdrop-blur-md border-b border-brand-burgundy/10 px-8 py-4.5 items-center justify-between shrink-0 shadow-sm z-20">
          <div>
            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest font-display">Representative Portal</p>
            <h2 className="text-sm font-bold text-slate-700 mt-0.5">Good morning, <span className="text-brand-burgundy font-black">{user.name.split(" ")[0]}</span></h2>
          </div>

          <div className="flex items-center gap-2.5 bg-gradient-to-r from-brand-burgundy-light to-white border border-brand-burgundy/10 px-3.5 py-1.5 rounded-xl text-xs font-extrabold text-brand-burgundy shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-brand-rose-gold animate-pulse shrink-0" />
            <span className="tracking-wide uppercase text-[10px]">Active Rep</span>
          </div>
        </header>

        {/* Mobile Header */}
        <header className="md:hidden bg-white/80 backdrop-blur-md border-b border-brand-burgundy/10 px-4 py-3 flex items-center justify-between z-20 w-full shadow-sm sticky top-0">
          <div className="flex items-center gap-2">
            <img
              src="/Logo.svg"
              alt="Lipistry Logo"
              className="h-8 object-contain mix-blend-multiply"
            />
            <span className="text-[8px] font-black tracking-wider text-white bg-brand-burgundy px-2 py-0.5 rounded border border-brand-burgundy/10">REP</span>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-4.5 h-4.5" />
          </button>
        </header>

        {/* Content Children - Flowing background */}
        <main
          className="flex-1 overflow-y-auto p-4 md:p-8 bg-transparent"
          style={{ height: "calc(100vh - 73px)" }}
        >
          {children}
        </main>
      </div>

      {/* Bottom Nav - Mobile Only */}
      <nav className="md:hidden bg-white/90 backdrop-blur-md border-t border-brand-burgundy/10 px-4 py-2 flex justify-around items-center fixed bottom-0 left-0 right-0 z-50 shadow-lg">
        {navLinks.map((link) => {
          const isActive = pathname.startsWith(link.href);
          const Icon = link.icon;
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`flex flex-col items-center gap-1.5 px-3 py-1 rounded-xl transition-all duration-200 cursor-pointer ${isActive ? "text-brand-burgundy font-black scale-105" : "text-slate-400 hover:text-brand-burgundy"}`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "text-brand-burgundy" : "text-slate-400"}`} />
              <span className="text-[9px] tracking-wider uppercase font-bold">{link.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
