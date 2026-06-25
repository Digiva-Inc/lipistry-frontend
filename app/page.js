"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../store/authStore";
import { Loader2 } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    // Determine target page based on authentication status and user roles
    if (!isAuthenticated) {
      router.push("/login");
    } else if (user) {
      if (user.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/rep/dashboard");
      }
    } else {
      router.push("/login");
    }
  }, [isAuthenticated, user, router]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-slate-950">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-pink-500" />
        <p className="text-slate-400 text-sm font-medium tracking-wide">
          Loading Lipistry Portal...
        </p>
      </div>
    </div>
  );
}
