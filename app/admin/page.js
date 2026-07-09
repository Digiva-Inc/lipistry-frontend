"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Users,
  HeartHandshake,
  ShoppingBag,
  CalendarDays,
  DollarSign,
  ArrowRight,
  Loader2,
  FileSpreadsheet,
  Search,
  Filter,
  TrendingUp,
  PieChart as PieChartIcon,
  Trophy,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

export default function AdminDashboard() {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [doctors, setDoctors] = useState([]);

  const [timeFilter, setTimeFilter] = useState("monthly"); // "weekly", "monthly", "yearly"
  const [activePieIndex, setActivePieIndex] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const headers = { Authorization: `Bearer ${token}` };

        const [statsRes, ordersRes, docsRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/stats`, { headers }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/orders`, { headers }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/doctors`, {
            headers,
          }),
        ]);

        if (!statsRes.ok || !ordersRes.ok || !docsRes.ok) {
          throw new Error("Failed to fetch dashboard data.");
        }

        const statsData = await statsRes.json();
        const ordersData = await ordersRes.json();
        const docsData = await docsRes.json();

        setStats(statsData.stats);
        setOrders(ordersData);
        setDoctors(docsData);
      } catch (err) {
        console.warn(err);
        toast.error("Could not load dashboard statistics.");
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      fetchData();
    }
  }, [token]);

  // Use Memo for complex calculations
  const chartData = useMemo(() => {
    if (!orders.length) return [];

    const map = new Map();
    const now = new Date();

    orders.forEach((o) => {
      if (["pending_payment", "failed_payment", "draft"].includes(o.status))
        return;

      const d = new Date(o.created_at);
      let key = "";

      if (timeFilter === "weekly") {
        // group by Date for the last 14 days
        const diffTime = Math.abs(now - d);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > 14) return;
        key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      } else if (timeFilter === "monthly") {
        // Last 12 months
        const diffMonths =
          (now.getFullYear() - d.getFullYear()) * 12 +
          now.getMonth() -
          d.getMonth();
        if (diffMonths > 12) return;
        key = d.toLocaleDateString("en-US", {
          month: "short",
          year: "2-digit",
        });
      } else if (timeFilter === "yearly") {
        key = d.getFullYear().toString();
      }

      if (!map.has(key)) {
        map.set(key, {
          name: key,
          revenue: 0,
          orders: 0,
          timestamp: d.getTime(),
        });
      }
      const entry = map.get(key);
      entry.revenue += o.total_cents / 100;
      entry.orders += 1;
    });

    return Array.from(map.values()).sort((a, b) => a.timestamp - b.timestamp);
  }, [orders, timeFilter]);

  const statusDistribution = useMemo(() => {
    const map = new Map();
    orders.forEach((o) => {
      if (["pending_payment", "failed_payment", "draft"].includes(o.status))
        return;
      const s = o.status.replace(/_/g, " ").toUpperCase();
      map.set(s, (map.get(s) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [orders]);

  const topDoctors = useMemo(() => {
    const map = new Map();
    orders.forEach((o) => {
      if (
        ["pending_payment", "failed_payment", "draft", "cancelled"].includes(
          o.status,
        )
      )
        return;
      if (!map.has(o.doctor_id)) {
        map.set(o.doctor_id, {
          id: o.doctor_id,
          name: `Dr. ${o.doctor_first_name} ${o.doctor_last_name}`,
          practice: o.doctor_practice,
          revenue: 0,
          orders: 0,
        });
      }
      const entry = map.get(o.doctor_id);
      entry.revenue += o.total_cents / 100;
      entry.orders += 1;
    });
    return Array.from(map.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [orders]);

  const recentOrdersList = orders
    .filter(
      (o) => !["pending_payment", "failed_payment", "draft"].includes(o.status),
    )
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  const formatPrice = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const formatPriceCents = (cents) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(cents / 100);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "submitted_warehouse":
        return "bg-sky-50 text-sky-700";
      case "confirmed":
        return "bg-indigo-50 text-indigo-700";
      case "delivered":
        return "bg-green-50 text-green-700";
      case "returned":
      case "return_requested":
      case "return_approved":
        return "bg-rose-50 text-rose-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const formatStatus = (status) => {
    if (!status) return "";
    if (status === "return_approved") return "Approved";
    if (status === "returned") return "Returned";
    if (status === "refunded") return "Refunded";
    if (status === "submitted_warehouse") return "Submitted";
    return status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // Status-based chart colors
  const PIE_COLORS = {
    RETURNED: "#f43f5e", // rose
    "SUBMITTED WAREHOUSE": "#0ea5e9", // sky
    DELIVERED: "#22c55e", // green
    CONFIRMED: "#6366f1", // indigo
    DEFAULT: "#f59e0b", // amber
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-black animate-spin" />
          <p className="text-slate-500 text-xs font-bold tracking-wider">
            Loading analytics engine...
          </p>
        </div>
      </div>
    );
  }

  // Get pie chart summaries (Returned vs Submitted) for footer
  const returnedCount =
    statusDistribution.find((s) => s.name === "RETURNED")?.value || 0;
  const submittedCount =
    statusDistribution.find(
      (s) => s.name === "SUBMITTED WAREHOUSE" || s.name === "CONFIRMED",
    )?.value || 0;

  return (
    <div className="space-y-6 pb-12 animate-fadeIn max-w-[1400px] mx-auto bg-[#fbfaf9]">
      <style jsx global>{`
        @keyframes cardRiseIn {
          from {
            opacity: 0;
            transform: translateY(14px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes iconPulseRing {
          0% {
            box-shadow: 0 0 0 0 rgba(0, 0, 0, 0.08);
          }
          70% {
            box-shadow: 0 0 0 8px rgba(0, 0, 0, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(0, 0, 0, 0);
          }
        }
        .stat-card {
          opacity: 0;
          animation: cardRiseIn 0.55s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .stat-card:hover .stat-icon {
          transform: scale(1.12) rotate(-6deg);
        }
        .stat-card:hover .stat-number {
          transform: translateX(2px);
        }
        .stat-icon {
          transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
          animation: iconPulseRing 2.5s ease-out 1s 1;
        }
        .stat-number {
          transition: transform 0.3s ease;
        }
      `}</style>
      {/* Page Header */}
      <div>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
          System Administration
        </p>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Analytics & Control Center
        </h1>
      </div>

      {/* Summary Cards Grid */}

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-5">
        <div
          className="stat-card group bg-white p-3 sm:p-4 rounded-2xl border-2 flex flex-col items-start gap-2 sm:gap-3 shadow-lg transition-all duration-300 hover:-translate-y-1.5 hover:shadow-md hover:shadow-blue-100 border-blue-200 cursor-default"
          style={{ animationDelay: "0ms" }}
        >
          <div className="flex items-center gap-2 sm:gap-3 w-full">
            <div className="stat-icon w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
            </div>
            <div>
              <span className="text-[8px] sm:text-[9px] text-slate-500 font-bold uppercase tracking-widest block mb-0.5">
                TOTAL REPS
              </span>
              <span className="stat-number text-lg sm:text-2xl font-black text-slate-900 leading-none block">
                {stats?.totalReps || 0}
              </span>
            </div>
          </div>
        </div>

        <div
          className="stat-card group bg-white p-3 sm:p-4 rounded-2xl border-2 flex flex-col items-start gap-2 sm:gap-3 shadow-lg transition-all duration-300 hover:-translate-y-1.5 hover:shadow-md hover:shadow-rose-100 border-rose-200 cursor-default"
          style={{ animationDelay: "80ms" }}
        >
          <div className="flex items-center gap-2 sm:gap-3 w-full">
            <div className="stat-icon w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
              <HeartHandshake className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-600" />
            </div>
            <div>
              <span className="text-[8px] sm:text-[9px] text-slate-500 font-bold uppercase tracking-widest block mb-0.5">
                TOTAL DOCTORS
              </span>
              <span className="stat-number text-lg sm:text-2xl font-black text-slate-900 leading-none block">
                {stats?.totalDoctors || 0}
              </span>
            </div>
          </div>
        </div>

        <div
          className="stat-card group bg-white p-3 sm:p-4 rounded-2xl border-2 flex flex-col items-start gap-2 sm:gap-3 shadow-lg transition-all duration-300 hover:-translate-y-1.5 hover:shadow-md hover:shadow-amber-100 border-amber-200 cursor-default"
          style={{ animationDelay: "160ms" }}
        >
          <div className="flex items-center gap-2 sm:gap-3 w-full">
            <div className="stat-icon w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
              <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600" />
            </div>
            <div>
              <span className="text-[8px] sm:text-[9px] text-slate-500 font-bold uppercase tracking-widest block mb-0.5">
                ORDERS TODAY
              </span>
              <span className="stat-number text-lg sm:text-2xl font-black text-slate-900 leading-none block">
                {stats?.ordersToday || 0}
              </span>
            </div>
          </div>
        </div>

        <div
          className="stat-card group bg-white p-3 sm:p-4 rounded-2xl border-2 flex flex-col items-start gap-2 sm:gap-3 shadow-lg transition-all duration-300 hover:-translate-y-1.5 hover:shadow-md hover:shadow-indigo-100 border-indigo-200 cursor-default"
          style={{ animationDelay: "240ms" }}
        >
          <div className="flex items-center gap-2 sm:gap-3 w-full">
            <div className="stat-icon w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
              <CalendarDays className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600" />
            </div>
            <div>
              <span className="text-[8px] sm:text-[9px] text-slate-500 font-bold uppercase tracking-widest block mb-0.5">
                ORDERS (MTH)
              </span>
              <span className="stat-number text-lg sm:text-2xl font-black text-slate-900 leading-none block">
                {stats?.ordersThisMonth || 0}
              </span>
            </div>
          </div>
        </div>

        <div
          className="stat-card group bg-white p-3 sm:p-4 rounded-2xl border-2 flex flex-col items-start gap-2 sm:gap-3 shadow-lg transition-all duration-300 hover:-translate-y-1.5 hover:shadow-md hover:shadow-green-100 border-green-200 cursor-default col-span-2 sm:col-span-1"
          style={{ animationDelay: "320ms" }}
        >
          <div className="flex items-center gap-2 sm:gap-3 w-full">
            <div className="stat-icon w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-green-50 flex items-center justify-center shrink-0">
              <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600" />
            </div>
            <div>
              <span className="text-[8px] sm:text-[9px] text-slate-500 font-bold uppercase tracking-widest block mb-0.5">
                REVENUE (MTH)
              </span>
              <span className="stat-number text-lg sm:text-2xl font-black text-slate-900 leading-none block">
                {formatPriceCents(stats?.revenueThisMonthCents || 0)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart Area */}
        <div
          className="stat-card lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col p-6 h-[400px]  transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
          style={{ animationDelay: "400ms" }}
        >
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-8">
            <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <div className="stat-icon w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
              </div>
              Global Revenue Trends
            </h2>

            <div className="relative flex w-full sm:w-auto bg-white border border-slate-200 p-0.5 rounded-lg overflow-hidden">
              <div
                className="absolute top-0.5 bottom-0.5 rounded-md bg-black transition-all duration-300 ease-out"
                style={{
                  width: `calc(${100 / 3}% - 3px)`,
                  left: `calc(${["weekly", "monthly", "yearly"].indexOf(timeFilter) * (100 / 3)}% + 2px)`,
                }}
              />
              {["weekly", "monthly", "yearly"].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setTimeFilter(filter)}
                  className={`relative z-10 flex-1 px-2 sm:px-4 py-1.5 text-[10px] sm:text-[11px] font-bold capitalize transition-colors duration-300 ${
                    timeFilter === filter
                      ? "text-white"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 w-full relative min-h-0 mb-4">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="barSingle" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#818cf8" stopOpacity={1} />
                      <stop
                        offset="100%"
                        stopColor="#6366f1"
                        stopOpacity={0.85}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: "#64748b" }}
                    dy={10}
                  />
                  <YAxis
                    yAxisId="left"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: "#64748b" }}
                    tickFormatter={(value) => `₹${value / 1000}k`}
                  />
                  <Tooltip
                    cursor={{ fill: "#f8fafc" }}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                    labelStyle={{
                      fontWeight: "bold",
                      color: "#0f172a",
                      marginBottom: "4px",
                    }}
                    formatter={(value, name) => [
                      name === "revenue" ? formatPrice(value) : value,
                      "Revenue",
                    ]}
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="revenue"
                    fill="url(#barSingle)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                    animationDuration={900}
                    animationEasing="ease-out"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-xs font-semibold">
                No data available for this timeframe.
              </div>
            )}
          </div>

          <div className="flex justify-between items-end border-t border-slate-100 pt-4 mt-auto">
            <div>
              <span className="text-[10px] font-bold text-slate-500 mb-1 block">
                This Month Revenue
              </span>
              <span className="text-xl font-extrabold text-slate-900">
                {formatPriceCents(stats?.revenueThisMonthCents || 0)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-500 mb-1 block">
                Growth
              </span>
              <span className="text-xs font-extrabold text-green-600 flex items-center gap-0.5 justify-end">
                <span className="animate-pulse">↑</span> 100%
              </span>
            </div>
          </div>
        </div>

        {/* Status Distribution Pie */}
        <div
          className="stat-card bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col p-6 h-[400px] transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
          style={{ animationDelay: "480ms" }}
        >
          <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 mb-1">
            <div className="stat-icon w-10 h-10 rounded-full bg-violet-50 flex items-center justify-center shrink-0">
              <PieChartIcon className="w-4 h-4 text-violet-600" />
            </div>
            Order Fulfillment Status
          </h2>
          <p className="text-[9px] text-slate-400 font-medium mb-6">
            Breakdown of all active and historical orders.
          </p>

          <div className="flex-1 w-full relative min-h-0 flex items-center justify-center mb-6">
            {statusDistribution.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                      animationBegin={200}
                      animationDuration={800}
                      animationEasing="ease-out"
                      onMouseEnter={(_, index) => setActivePieIndex(index)}
                      onMouseLeave={() => setActivePieIndex(null)}
                    >
                      {statusDistribution.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={PIE_COLORS[entry.name] || PIE_COLORS["DEFAULT"]}
                          style={{
                            cursor: "pointer",
                            transformOrigin: "center",
                            transform:
                              activePieIndex === index
                                ? "scale(1.045)"
                                : "scale(1)",
                            transition:
                              "transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
                            filter:
                              activePieIndex === index
                                ? "brightness(1.08)"
                                : "none",
                          }}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid #e2e8f0",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      }}
                      itemStyle={{ fontWeight: "bold", fontSize: "12px" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-black text-slate-900 leading-none">
                    {statusDistribution.reduce((sum, s) => sum + s.value, 0)}
                  </span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                    Total Orders
                  </span>
                </div>
              </>
            ) : (
              <div className="text-slate-400 text-xs font-semibold">
                No active orders
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 mt-auto">
            <div className="text-center border-r border-slate-100 transition-transform duration-300 hover:scale-105">
              <span className="text-lg font-black text-slate-900 block leading-none mb-1">
                {returnedCount}
              </span>
              <span className="text-[10px] font-bold text-rose-600">
                Returned
              </span>
            </div>
            <div className="text-center transition-transform duration-300 hover:scale-105">
              <span className="text-lg font-black text-slate-900 block leading-none mb-1">
                {submittedCount}
              </span>
              <span className="text-[10px] font-bold text-sky-600">
                Submitted
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders searchable */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col h-[400px]  transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center">
            <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <div className="stat-icon w-10 h-10 rounded-full bg-sky-50 flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-4 h-4 text-sky-600" />
              </div>
              Recent Order Auditing
            </h2>
            <Link
              href="/admin/orders"
              className="px-3 py-1 text-[10px] font-bold text-slate-600 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
            >
              View All
            </Link>
          </div>

          <div className="overflow-y-auto flex-1">
            <table className="w-full text-left text-xs">
              <thead className="bg-white sticky top-0 border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                    ORDER ID
                  </th>
                  <th className="px-5 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                    DATE
                  </th>
                  <th className="px-5 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                    DOCTOR
                  </th>
                  <th className="px-5 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                    STATUS
                  </th>
                  <th className="px-5 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-wider text-right">
                    AMOUNT
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentOrdersList.map((order, idx) => (
                  <tr
                    key={order.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-5 py-4 font-extrabold text-slate-800">
                      {order.order_number}
                    </td>
                    <td className="px-5 py-4 text-slate-600 font-semibold">
                      {new Date(order.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-5 py-4 text-slate-800 font-bold">
                      Dr. {order.doctor_first_name} {order.doctor_last_name}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider ${getStatusColor(order.status)}`}
                      >
                        {formatStatus(order.status)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right font-black text-slate-900">
                      {formatPriceCents(order.total_cents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {recentOrdersList.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-xs font-semibold">
                No recent orders found.
              </div>
            )}
          </div>
        </div>

        {/* Top Doctors Leaderboard */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col h-[400px] transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center">
            <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <div className="stat-icon w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                <Trophy className="w-4 h-4 text-amber-500" />
              </div>
              Top Performing Doctors
            </h2>
            <Link
              href="/admin/doctors"
              className="px-3 py-1 text-[10px] font-bold text-slate-600 border border-slate-200 rounded-md  transition-colors"
            >
              View All
            </Link>
          </div>

          <div className="overflow-y-auto flex-1 p-3">
            <div className="space-y-1">
              {topDoctors.map((doc, idx) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-xs font-black shrink-0">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        {doc.name}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-slate-900">
                      {formatPrice(doc.revenue)}
                    </p>
                  </div>
                </div>
              ))}
              {topDoctors.length === 0 && (
                <div className="p-8 text-center text-slate-400 text-xs font-semibold">
                  No doctors found.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
