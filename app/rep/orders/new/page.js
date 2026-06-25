"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { 
  Loader2, 
  ArrowLeft, 
  UserPlus, 
  Building2, 
  Search,
  ChevronRight
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function SelectDoctorStep() {
  const router = useRouter();
  const { token } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadDoctors() {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/rep/doctors`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        if (!response.ok) {
          throw new Error("Failed to load doctor list.");
        }

        const data = await response.json();
        setDoctors(data);
      } catch (err) {
        toast.error("Failed to load your doctor directory.");
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      loadDoctors();
    }
  }, [token]);

  const filteredDoctors = doctors.filter((d) =>
    d.practice_name.toLowerCase().includes(search.toLowerCase()) ||
    `${d.doctor_first_name} ${d.doctor_last_name}`.toLowerCase().includes(search.toLowerCase()) ||
    d.city.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-md mx-auto space-y-6 animate-fadeIn text-left">
      {/* Back link */}
      <div>
        <Link
          href="/rep/dashboard"
          className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-brand-burgundy transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      {/* Header */}
      <div>
        <span className="text-[9px] font-black text-brand-burgundy bg-brand-burgundy-light px-2.5 py-0.5 rounded-full border border-brand-burgundy/10 uppercase tracking-wider">
          Step 1 of 3
        </span>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 mt-2">Select Practice Profile</h1>
        <p className="text-slate-500 text-xs mt-1 font-semibold">Select the doctor practice account for which you want to submit a wholesale order.</p>
      </div>

      {/* Search and List */}
      <div className="glass-panel p-5 rounded-2xl border border-[#ebdfe1] bg-white shadow-sm space-y-4">
        {/* Search */}
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search practice, doctor, or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl text-xs font-semibold glass-input shadow-sm"
          />
        </div>

        {loading ? (
          <div className="py-8 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 text-brand-burgundy animate-spin" />
            <span className="text-slate-500 text-[10px] font-semibold">Syncing doctor accounts...</span>
          </div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {filteredDoctors.length === 0 ? (
              <div className="py-6 text-center text-slate-400 text-xs font-semibold">
                No matching doctors found.
              </div>
            ) : (
              filteredDoctors.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => router.push(`/rep/orders/new/build?doctorId=${doc.id}`)}
                  className="w-full p-3 text-left rounded-xl border border-slate-200 hover:border-brand-burgundy hover:bg-slate-50/50 transition-all flex justify-between items-center group cursor-pointer"
                >
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-brand-burgundy shrink-0" />
                      <span>{doc.practice_name}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-semibold pl-5">
                      Dr. {doc.doctor_first_name} {doc.doctor_last_name} ({doc.city}, {doc.state})
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-brand-burgundy transition-colors shrink-0" />
                </button>
              ))
            )}
          </div>
        )}

        {/* Create new link */}
        <div className="pt-3 border-t border-[#ebdfe1]/50 text-center">
          <Link
            href="/rep/doctors/new"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-burgundy hover:text-brand-burgundy-hover transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>Register New Doctor Practice</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
