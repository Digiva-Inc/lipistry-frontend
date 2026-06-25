"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { 
  Loader2, 
  Search, 
  Plus, 
  Stethoscope, 
  ChevronRight,
  MapPin,
  Calendar,
  Building2
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function MyDoctors() {
  const router = useRouter();
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState("");

  async function fetchDoctors() {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (search) queryParams.append("search", search);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/rep/doctors?${queryParams.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (!response.ok) {
        throw new Error("Failed to load doctor directory.");
      }

      const result = await response.json();
      setDoctors(result);
    } catch (err) {
      console.warn(err);
      toast.error("Failed to load doctors list.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) {
      fetchDoctors();
    }
  }, [token, search]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Practice Accounts Directory</h1>
          <p className="text-slate-500 text-xs mt-1 font-semibold">Manage registered medical accounts, save payment details, and launch wholesale order placement.</p>
        </div>
        <Link
          href="/rep/doctors/new"
          className="flex items-center gap-1.5 px-4 py-2.5 bg-brand-burgundy hover:bg-brand-burgundy-hover text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Doctor</span>
        </Link>
      </div>

      {/* Search Bar */}
      <div className="flex gap-4 max-w-md">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
            <Search className="w-4.5 h-4.5" />
          </span>
          <input
            type="text"
            placeholder="Search by practice name, doctor, or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs font-semibold glass-input shadow-sm"
          />
        </div>
      </div>

      {/* Directory Table */}
      <div className="glass-panel rounded-2xl border border-[#ebdfe1] overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3 bg-white">
            <Loader2 className="w-6 h-6 text-brand-burgundy animate-spin" />
            <span className="text-slate-500 text-xs font-semibold">Updating directory records...</span>
          </div>
        ) : (
          <div className="overflow-x-auto bg-white">
            {doctors.length === 0 ? (
              <div className="px-6 py-12 text-center text-slate-500 text-xs font-semibold">
                No doctors registered under your territory match your search.
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#fbf7f8] text-slate-550 font-bold border-b border-[#ebdfe1]">
                    <th className="px-6 py-3.5">Practice Name</th>
                    <th className="px-6 py-3.5">Doctor Name</th>
                    <th className="px-6 py-3.5">Location</th>
                    <th className="px-6 py-3.5">Last Order Date</th>
                    <th className="px-6 py-3.5 text-right">Profile</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ebdfe1]/30">
                  {doctors.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4.5 h-4.5 text-brand-burgundy shrink-0" />
                          <span>{doc.practice_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-800 font-bold">Dr. {doc.doctor_first_name} {doc.doctor_last_name}</td>
                      <td className="px-6 py-4 text-slate-700">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{doc.city}, {doc.state}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-650 font-semibold">
                        {doc.last_order_date ? (
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>
                              {new Date(doc.last_order_date).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full font-bold">
                            No orders placed
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/rep/doctors/detail?id=${doc.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-slate-750 hover:bg-brand-burgundy-light hover:text-brand-burgundy border border-slate-205 font-bold transition-all cursor-pointer"
                        >
                          <span>Manage</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
