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
      router.push("/login");
    } else if (user && user.role !== "rep") {
      router.push("/login");
      toast.error("Unauthorized access. Sales Representative privileges required.");
    } else {
      setAuthorized(true);
    }
  }, [isAuthenticated, user, router]);

  const handleLogout = () => {
    clearAuth();
    toast.info("Signed out successfully.");
    router.push("/login");
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
    <div className="min-h-screen bg-[#f8eff1] text-slate-800 flex flex-col md:flex-row relative pb-16 md:pb-0 overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] ambient-light-pink rounded-full pointer-events-none z-0" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] ambient-light-blue rounded-full pointer-events-none z-0" />

      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-[#ebdfe1] p-5 shrink-0 z-30 shadow-sm h-screen sticky top-0">
        {/* Brand Logo */}
        <div className="flex flex-col items-start gap-1 mb-8">
          <img 
            src="/logo.jpg" 
            alt="Lipistry Logo" 
            className="h-10 object-contain mix-blend-multiply" 
          />
          <p className="text-[9px] text-brand-burgundy font-bold tracking-widest uppercase mt-1">Rep Workspace</p>
        </div>

        {/* Navigation Tabs */}
        <nav className="space-y-1.5 flex-1">
          {navLinks.map((link) => {
            const isActive = pathname.startsWith(link.href);
            const Icon = link.icon;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold tracking-wide transition-all duration-205 cursor-pointer group
                  ${isActive 
                    ? "bg-brand-burgundy-light text-brand-burgundy border-l-2 border-brand-burgundy shadow-sm" 
                    : "text-slate-500 hover:bg-brand-burgundy-light/40 hover:text-slate-800"
                  }
                `}
              >
                <Icon className={`w-4.5 h-4.5 transition-colors ${isActive ? "text-brand-burgundy" : "text-slate-400 group-hover:text-slate-650"}`} />
                <span>{link.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Info & Log Out */}
        <div className="pt-4 border-t border-[#ebdfe1] mt-auto space-y-3.5">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-brand-burgundy-light border border-brand-burgundy/10 flex items-center justify-center">
              <User className="w-4 h-4 text-brand-burgundy" />
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-slate-800 truncate">{user.name}</p>
              <p className="text-[9px] text-slate-500 font-semibold tracking-wider">{user.rep_number || "Sales Rep"}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold text-red-500 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all cursor-pointer"
          >
            <LogOut className="w-4.5 h-4.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen z-10 relative">
        {/* Top Header - Desktop only */}
        <header className="hidden md:flex bg-white border-b border-[#ebdfe1] px-8 py-4 items-center justify-between shrink-0 shadow-sm z-20">
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Representative Portal</p>
            <h2 className="text-sm font-bold text-slate-700">Good morning, <span className="text-slate-900 font-bold">{user.name.split(" ")[0]}</span></h2>
          </div>
          
          <div className="flex items-center gap-3 bg-brand-burgundy-light border border-brand-burgundy/10 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-brand-burgundy shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-brand-burgundy animate-pulse" />
            <span>Active Rep</span>
          </div>
        </header>

        {/* Mobile Header */}
        <header className="md:hidden bg-white/95 backdrop-blur-md border-b border-[#ebdfe1] px-4 py-3 flex items-center justify-between z-20 w-full shadow-sm sticky top-0">
          <div className="flex items-center gap-2">
            <img 
              src="/logo.jpg" 
              alt="Lipistry Logo" 
              className="h-8 object-contain mix-blend-multiply" 
            />
            <span className="text-[9px] font-bold tracking-wider text-brand-burgundy bg-brand-burgundy-light px-2 py-0.5 rounded border border-brand-burgundy/10">REP</span>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-4.5 h-4.5" />
          </button>
        </header>

        {/* Content Children - Flowing background */}
        <main className="flex-1 p-4 md:p-8 bg-transparent">
          {children}
        </main>
      </div>

      {/* Bottom Nav - Mobile Only */}
      <nav className="md:hidden bg-white border-t border-[#ebdfe1] px-4 py-2 flex justify-around items-center fixed bottom-0 left-0 right-0 z-50 shadow-lg">
        {navLinks.map((link) => {
          const isActive = pathname.startsWith(link.href);
          const Icon = link.icon;
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors cursor-pointer ${isActive ? "text-brand-burgundy font-bold" : "text-slate-400"}`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[9px] tracking-wide">{link.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
