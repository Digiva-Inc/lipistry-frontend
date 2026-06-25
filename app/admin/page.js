"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Users, 
  HeartHandshake, 
  ShoppingBag, 
  CalendarDays, 
  DollarSign, 
  ArrowRight,
  Loader2,
  FileSpreadsheet
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { toast } from "sonner";

export default function AdminDashboard() {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/admin/stats`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch dashboard stats.");
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        console.warn(err);
        toast.error("Could not load dashboard statistics.");
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      fetchStats();
    }
  }, [token]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-brand-burgundy animate-spin" />
          <p className="text-slate-500 text-xs font-bold tracking-wider">Loading dashboard summaries...</p>
        </div>
      </div>
    );
  }

  const stats = data?.stats || {
    totalReps: 0,
    totalDoctors: 0,
    ordersToday: 0,
    ordersThisMonth: 0,
    revenueThisMonthCents: 0
  };

  const recentOrders = data?.recentOrders || [];

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
      case "confirmed":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "shipped":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "out_for_delivery":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "delivered":
        return "bg-green-50 text-green-700 border-green-200";
      case "fulfilled":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "cancelled":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "failed_payment":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "return_requested":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "return_approved":
        return "bg-pink-50 text-pink-700 border-pink-200";
      case "returned":
        return "bg-teal-50 text-teal-700 border-teal-200";
      case "refunded":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default:
        return "bg-amber-50 text-amber-700 border-amber-200";
    }
  };

  const formatStatus = (status) => {
    if (!status) return "";
    if (status === 'return_approved') return 'RETURN APPROVED';
    if (status === 'returned') return 'RETURNED TO WAREHOUSE';
    if (status === 'refunded') return 'AMOUNT REFUNDED';
    return status.replace(/_/g, ' ').toUpperCase();
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">System Dashboard</h1>
        <p className="text-slate-500 text-xs mt-1 font-semibold">Real-time status overview of reps, doctors, orders, and wholesale performance.</p>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        {/* Total Reps */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-200 hover:border-brand-burgundy/60 transition-all group shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Sales Reps</span>
            <div className="p-2 rounded-xl bg-slate-50 text-slate-600 group-hover:text-brand-burgundy transition-colors">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 tracking-tight">{stats.totalReps}</p>
        </div>

        {/* Total Doctors */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-200 hover:border-brand-burgundy/60 transition-all group shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Doctors</span>
            <div className="p-2 rounded-xl bg-slate-50 text-slate-600 group-hover:text-brand-burgundy transition-colors">
              <HeartHandshake className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 tracking-tight">{stats.totalDoctors}</p>
        </div>

        {/* Orders Today */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-200 hover:border-brand-burgundy/60 transition-all group shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Orders Today</span>
            <div className="p-2 rounded-xl bg-slate-50 text-slate-600 group-hover:text-brand-burgundy transition-colors">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 tracking-tight">{stats.ordersToday}</p>
        </div>

        {/* Orders This Month */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-200 hover:border-brand-burgundy/60 transition-all group shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Orders This Month</span>
            <div className="p-2 rounded-xl bg-slate-50 text-slate-600 group-hover:text-brand-burgundy transition-colors">
              <CalendarDays className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 tracking-tight">{stats.ordersThisMonth}</p>
        </div>

        {/* Revenue This Month */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-200 hover:border-brand-burgundy/60 transition-all group col-span-1 sm:col-span-2 lg:col-span-1 shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Revenue (Month)</span>
            <div className="p-2 rounded-xl bg-brand-burgundy-light text-brand-burgundy">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-extrabold text-brand-burgundy tracking-tight">{formatPrice(stats.revenueRevenueMonthCents || stats.revenueThisMonthCents)}</p>
        </div>
      </div>

      {/* Quick Action Links */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quick Commands</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <Link
            href="/admin/reps"
            className="glass-card p-4 rounded-xl border border-slate-200 hover:border-brand-burgundy/60 flex items-center justify-between group transition-all shadow-sm"
          >
            <div>
              <h4 className="text-xs font-bold text-slate-900">Manage Sales Reps</h4>
              <p className="text-[10px] text-slate-500 mt-0.5 font-semibold">Register, modify and deactivate rep credentials.</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-burgundy group-hover:translate-x-1 transition-all" />
          </Link>

          <Link
            href="/admin/products"
            className="glass-card p-4 rounded-xl border border-slate-200 hover:border-brand-burgundy/60 flex items-center justify-between group transition-all shadow-sm"
          >
            <div>
              <h4 className="text-xs font-bold text-slate-900">Manage Products</h4>
              <p className="text-[10px] text-slate-500 mt-0.5 font-semibold">Register items, pricing, SKU codes and settings.</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-burgundy group-hover:translate-x-1 transition-all" />
          </Link>

          <Link
            href="/admin/orders"
            className="glass-card p-4 rounded-xl border border-slate-200 hover:border-brand-burgundy/60 flex items-center justify-between group transition-all shadow-sm"
          >
            <div>
              <h4 className="text-xs font-bold text-slate-900">All Orders Log</h4>
              <p className="text-[10px] text-slate-500 mt-0.5 font-semibold">View and filter comprehensive transaction histories.</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-burgundy group-hover:translate-x-1 transition-all" />
          </Link>
        </div>
      </div>

      {/* Recent Orders List */}
      <div className="glass-panel rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-6 py-5 border-b border-slate-200/50 flex items-center justify-between bg-white">
          <div>
            <h3 className="text-xs font-bold text-slate-900">Recent Portal Orders</h3>
            <p className="text-[10px] text-slate-500 mt-0.5 font-semibold">The latest orders completed by sales representatives across all territories.</p>
          </div>
          <Link
            href="/admin/orders"
            className="text-xs font-bold text-brand-burgundy hover:text-brand-burgundy-hover flex items-center gap-1.5 transition-colors"
          >
            <span>View All Orders</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto bg-white">
          {recentOrders.length === 0 ? (
            <div className="px-6 py-12 text-center text-slate-500 text-xs font-semibold">
              No orders have been submitted yet.
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <th className="px-6 py-3.5">Order #</th>
                  <th className="px-6 py-3.5">Rep</th>
                  <th className="px-6 py-3.5">Doctor / Practice</th>
                  <th className="px-6 py-3.5">Total Value</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-800">{order.order_number}</td>
                    <td className="px-6 py-4 text-slate-700 font-bold">{order.rep_name}</td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">{order.doctor_practice}</div>
                      <div className="text-[10px] text-slate-505 font-bold">Dr. {order.doctor_first_name} {order.doctor_last_name}</div>
                    </td>
                    <td className="px-6 py-4 font-extrabold text-slate-800">{formatPrice(order.total_cents)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-extrabold border ${getStatusColor(order.status)}`}>
                        {formatStatus(order.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-semibold">
                      {new Date(order.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
