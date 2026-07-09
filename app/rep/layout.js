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
  UserCheck,
  Menu,
  X,
} from "lucide-react";

import { toast } from "sonner";

export default function RepLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user, clearAuth } = useAuthStore();
  const [authorized, setAuthorized] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 text-sm font-bold tracking-wider">Verifying portal access...</p>
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
    <div className="h-screen bg-white text-slate-800 flex flex-col md:flex-row relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-black/[0.02] blur-3xl rounded-full pointer-events-none z-0" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-black/[0.02] blur-3xl rounded-full pointer-events-none z-0" />

      {/* Mobile Header */}
      <header className="md:hidden bg-white/80 backdrop-blur-md border-b border-black/10 px-4 py-3 flex items-center justify-between z-20 w-full shadow-sm sticky top-0">
        <div className="flex items-center gap-2">
          <img
            src="/Logo.svg"
            alt="Lipistry Logo"
            className="h-8 object-contain mix-blend-multiply"
          />
          <span className="text-[8px] font-black tracking-wider text-white bg-black px-2 py-0.5 rounded border border-black/10">REP</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1 text-slate-500 hover:text-black transition-colors"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Sidebar Navigation */}
      <aside
        className={`
    fixed inset-y-0 left-0
    w-64
    bg-white
    backdrop-blur-md
    border-r border-black/10
    p-5
    flex
    flex-col
    shrink-0
    shadow-sm
    z-30
    transition-transform duration-300
    md:relative
    md:translate-x-0
    h-full
    ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
  `}
      >
        {/* Brand Logo - Desktop */}
        <div className="flex flex-col items-center justify-center gap-2 mb-8 relative group w-full">
          <img
            src="/Logo.svg"
            alt="Lipistry Logo"
            className="h-12 w-auto object-contain mix-blend-multiply transition-transform duration-300 group-hover:scale-105"
          />

          <div className="flex items-center justify-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
            <p className="text-[9px] text-black font-extrabold tracking-[0.2em] uppercase font-display text-center">
              Rep Workspace
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="space-y-2 flex-1 overflow-y-auto pr-1">
          {navLinks.map((link) => {
            const isActive = pathname.startsWith(link.href);
            const Icon = link.icon;
            return (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`
                  relative flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold tracking-wide transition-all duration-300 cursor-pointer group overflow-hidden
                  ${isActive
                    ? "bg-black text-white shadow-md shadow-black/15"
                    : "text-black hover:bg-black hover:text-white"
                  }
                `}
              >
                {/* Active Indicator Pill */}
                {isActive && (
                  <span className="absolute left-0 top-1/4 bottom-1/4 w-1 rounded-r-md bg-white" />
                )}
                <Icon className={`w-4.5 h-4.5 transition-all duration-300 ${isActive ? "text-white rotate-3 scale-110" : "text-black group-hover:text-white group-hover:scale-110"}`} />
                <span className="relative z-10">{link.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Info & Log Out */}
        <div className="pt-4 border-t border-black/10 mt-auto space-y-4">
          <div className="flex items-center gap-3 px-3 py-2.5 bg-black/5 border border-black/5 rounded-2xl shadow-inner-sm">
            <div className="w-9 h-9 rounded-full bg-white border-2 border-black/20 flex items-center justify-center shadow-sm shrink-0">
              <User className="w-4.5 h-4.5 text-black" />
            </div>
            <div className="truncate">
              <p className="text-xs font-black text-slate-800 truncate">{user.name}</p>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">{user.rep_number || "Sales Rep"}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold text-black hover:bg-black hover:text-white border border-black/10 hover:border-black transition-all duration-200 cursor-pointer shadow-sm-hover"
          >
            <LogOut className="w-4.5 h-4.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header - Desktop only */}
        <header className="hidden md:flex bg-white backdrop-blur-md border-b border-black/10 px-8 py-4.5 items-center justify-between shrink-0 shadow-sm z-20">
          <div>
            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest font-display">Representative Portal</p>
            <h2 className="text-sm font-bold text-slate-700 mt-0.5">Good morning, <span className="text-black font-black">{user.name.split(" ")[0]}</span></h2>
          </div>

          <div className="flex items-center gap-2.5 bg-white border border-black/10 px-3.5 py-1.5 rounded-xl text-xs font-extrabold text-black shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-black animate-pulse shrink-0" />
            <span className="tracking-wide uppercase text-[10px]">Active Rep</span>
          </div>
        </header>

        {/* Content Children - solid white background */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 sm:px-6 sm:py-5 md:px-8 md:py-6 bg-[#fbfaf9]">
  {children}
</main>
      </div>
    </div>
  );
}