"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { 
  Loader2, 
  Search, 
  Eye, 
  Calendar,
  Building2,
  ListOrdered
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function RepOrders() {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  async function loadOrders() {
    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/rep/orders`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (!response.ok) {
        throw new Error("Failed to load orders history.");
      }

      const result = await response.json();
      setOrders(result);
    } catch (err) {
      console.warn(err);
      toast.error("Failed to load orders log.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) {
      loadOrders();
    }
  }, [token]);

  const formatPrice = (cents) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "paid":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "submitted_warehouse":
        return "bg-sky-50 text-sky-700 border-sky-200";
      case "fulfilled":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "cancelled":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-amber-50 text-amber-700 border-amber-200";
    }
  };

  const formatStatus = (status) => {
    return status ? status.replace(/_/g, ' ').toUpperCase() : "";
  };

  // Filter orders locally
  const filteredOrders = orders.filter((o) => {
    const matchesSearch = 
      o.order_number.toLowerCase().includes(search.toLowerCase()) ||
      o.doctor_practice.toLowerCase().includes(search.toLowerCase()) ||
      o.doctor_first_name.toLowerCase().includes(search.toLowerCase()) ||
      o.doctor_last_name.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === "all" || o.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-fadeIn text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Wholesale Orders History</h1>
          <p className="text-slate-500 text-xs mt-1 font-semibold font-sans">Track order status, inspect line items, and audit billing metrics for your territory.</p>
        </div>
        <Link
          href="/rep/orders/new"
          className="px-4 py-2.5 bg-brand-burgundy hover:bg-brand-burgundy-hover text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-[0.98]"
        >
          Place New Order
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 max-w-2xl">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
            <Search className="w-4.5 h-4.5" />
          </span>
          <input
            type="text"
            placeholder="Search by order #, practice, or doctor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs font-semibold glass-input shadow-sm"
          />
        </div>
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl text-xs font-bold glass-input border border-slate-200 cursor-pointer shadow-sm"
        >
          <option value="all">All Statuses</option>
          <option value="paid">Paid</option>
          <option value="submitted_warehouse">Submitted Warehouse</option>
          <option value="fulfilled">Fulfilled</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Table Container */}
      <div className="glass-panel rounded-2xl border border-[#ebdfe1] overflow-hidden shadow-sm bg-white">
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-6 h-6 text-brand-burgundy animate-spin" />
            <span className="text-slate-500 text-xs font-semibold">Retrieving orders ledger...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {filteredOrders.length === 0 ? (
              <div className="px-6 py-12 text-center text-slate-500 text-xs font-semibold">
                No orders found matching your configuration.
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#fbf7f8] text-slate-550 font-bold border-b border-[#ebdfe1]">
                    <th className="px-6 py-3.5">Order #</th>
                    <th className="px-6 py-3.5">Submission Date</th>
                    <th className="px-6 py-3.5">Doctor / Practice</th>
                    <th className="px-6 py-3.5">Items Snapshot</th>
                    <th className="px-6 py-3.5">Total Charged</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right font-bold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ebdfe1]/30">
                  {filteredOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900">{o.order_number}</td>
                      <td className="px-6 py-4 text-slate-650 font-semibold">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>
                            {new Date(o.created_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric"
                            })}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-800">
                        <div className="font-bold flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-brand-burgundy shrink-0" />
                          <span>{o.doctor_practice}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-semibold pl-5">Dr. {o.doctor_first_name} {o.doctor_last_name}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-700 font-semibold">
                        <div className="flex items-center gap-1.5">
                          <ListOrdered className="w-3.5 h-3.5 text-slate-400" />
                          <span>{o.total_quantity || 0} cases</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-extrabold text-slate-905">{formatPrice(o.total_cents)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-extrabold border ${getStatusColor(o.status)}`}>
                          {formatStatus(o.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/rep/orders/${o.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-205 text-slate-750 hover:bg-brand-burgundy-light hover:text-brand-burgundy font-bold transition-all cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Detail</span>
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
