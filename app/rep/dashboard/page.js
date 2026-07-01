<<<<<<< Updated upstream
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { 
  Loader2, 
  ShoppingCart, 
  Users, 
  TrendingUp, 
  Eye, 
  Search, 
  ChevronRight,
  Plus,
  Stethoscope,
  X,
  FileSpreadsheet
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function RepDashboard() {
  const router = useRouter();
  const { token, user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  
  // Dashboard data state
  const [stats, setStats] = useState({ doctorCount: 0, orderCount: 0, totalSalesCents: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [myDoctors, setMyDoctors] = useState([]);
  const [doctorSearch, setDoctorSearch] = useState("");

  // Details Modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetail, setOrderDetail] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  async function loadDashboardData() {
    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/rep/dashboard`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (!response.ok) {
        throw new Error("Failed to load dashboard metrics.");
      }

      const result = await response.json();
      setStats(result.stats);
      setRecentOrders(result.recentOrders);
      setMyDoctors(result.myDoctors);
    } catch (err) {
      console.warn(err);
      toast.error("Failed to sync dashboard updates.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) {
      // loadDashboardData();
    }
  }, [token]);

  // Open order details modal
  const handleOpenDetails = async (order) => {
    setSelectedOrder(order);
    setOrderDetail(null);
    setModalLoading(true);
    setDetailModalOpen(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/rep/orders/${order.id}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (!response.ok) {
        throw new Error("Failed to load order details.");
      }

      const result = await response.json();
      setOrderDetail(result);
    } catch (err) {
      toast.error("Could not load details for order.");
      setDetailModalOpen(false);
    } finally {
      setModalLoading(false);
    }
  };

  const formatPrice = (cents) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending_payment":
        return "bg-slate-50 text-slate-700 border-slate-200";
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

  // Filter doctor list locally
  const filteredDoctors = myDoctors.filter((doc) =>
    doc.practice_name.toLowerCase().includes(doctorSearch.toLowerCase()) ||
    doc.doctor_first_name.toLowerCase().includes(doctorSearch.toLowerCase()) ||
    doc.doctor_last_name.toLowerCase().includes(doctorSearch.toLowerCase()) ||
    doc.city.toLowerCase().includes(doctorSearch.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-brand-burgundy animate-spin" />
          <p className="text-slate-550 text-xs font-bold tracking-wider">Syncing rep metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Mobile-only Welcome Block */}
      <div className="md:hidden">
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Representative Portal</p>
        <h2 className="text-lg font-bold text-slate-900">Good morning, {user?.name.split(" ")[0]}</h2>
      </div>

      {/* Quick Action & Promo Card */}
      <div className="glass-panel p-6 rounded-2xl border border-[#ebdfe1] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-br from-white to-[#fdf6f7] shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 w-24 h-24 bg-brand-burgundy/5 rounded-full blur-xl pointer-events-none" />
        <div className="space-y-1.5 max-w-lg">
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <span>Ready to complete a wholesale order?</span>
          </h3>
          <p className="text-slate-500 text-xs font-medium leading-relaxed">
            Quickly submit wholesale catalog transactions, process Stripe credit cards, and push fulfillment orders directly to Shopify for packaging and dispatch.
          </p>
        </div>
        <Link
          href="/rep/orders/new"
          className="flex items-center gap-2 px-5 py-3 bg-brand-burgundy hover:bg-brand-burgundy-hover text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer shrink-0"
        >
          <ShoppingCart className="w-4.5 h-4.5" />
          <span>Place New Order</span>
        </Link>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Doctors */}
        <div className="glass-panel p-5 rounded-2xl border border-[#ebdfe1] flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">My Doctors</span>
            <span className="text-2xl font-black text-slate-900 tracking-tight">{stats.doctorCount}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-brand-burgundy-light border border-brand-burgundy/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-brand-burgundy" />
          </div>
        </div>

        {/* Total Orders */}
        <div className="glass-panel p-5 rounded-2xl border border-[#ebdfe1] flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Total Orders</span>
            <span className="text-2xl font-black text-slate-900 tracking-tight">{stats.orderCount}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-brand-burgundy-light border border-brand-burgundy/10 flex items-center justify-center">
            <ShoppingCart className="w-5 h-5 text-brand-burgundy" />
          </div>
        </div>

        {/* Total Sales */}
        <div className="glass-panel p-5 rounded-2xl border border-[#ebdfe1] flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Wholesale Revenue</span>
            <span className="text-2xl font-black text-slate-900 tracking-tight">{formatPrice(stats.totalSalesCents)}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-brand-burgundy-light border border-brand-burgundy/10 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-brand-burgundy" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Recent Orders */}
        <div className="glass-panel p-5 rounded-2xl border border-[#ebdfe1] space-y-4 shadow-sm flex flex-col">
          <div className="flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4.5 h-4.5 text-brand-burgundy" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">Recent Orders</h3>
            </div>
            <Link 
              href="/rep/orders" 
              className="text-[11px] font-bold text-brand-burgundy hover:text-brand-burgundy-hover flex items-center gap-0.5"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex-1 overflow-x-auto min-h-[300px]">
            {recentOrders.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400 font-bold py-12">
                No orders submitted yet.
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#fbf7f8] text-slate-550 font-bold border-b border-[#ebdfe1]">
                    <th className="px-4 py-2.5">Order</th>
                    <th className="px-4 py-2.5">Practice</th>
                    <th className="px-4 py-2.5">Total</th>
                    <th className="px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5 text-right">View</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ebdfe1]/30">
                  {recentOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-bold text-slate-800">{o.order_number}</td>
                      <td className="px-4 py-3 text-slate-700">
                        <div className="font-bold">{o.doctor_practice}</div>
                        <div className="text-[9px] text-slate-405">Dr. {o.doctor_first_name} {o.doctor_last_name}</div>
                      </td>
                      <td className="px-4 py-3 font-extrabold text-slate-800">{formatPrice(o.total_cents)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-extrabold border ${getStatusColor(o.status)}`}>
                          {formatStatus(o.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleOpenDetails(o)}
                          className="p-1 rounded-lg hover:bg-brand-burgundy-light text-slate-500 hover:text-brand-burgundy transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right Column: My Doctors directory */}
        <div className="glass-panel p-5 rounded-2xl border border-[#ebdfe1] space-y-4 shadow-sm flex flex-col">
          <div className="flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
              <Users className="w-4.5 h-4.5 text-brand-burgundy" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">My Doctors</h3>
            </div>
            <Link 
              href="/rep/doctors/new" 
              className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-burgundy hover:text-brand-burgundy-hover"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New</span>
            </Link>
          </div>

          {/* Search bar */}
          <div className="relative shrink-0">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search practices, doctors, or city..."
              value={doctorSearch}
              onChange={(e) => setDoctorSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl text-xs font-semibold glass-input shadow-sm"
            />
          </div>

          <div className="flex-1 overflow-x-auto min-h-[300px]">
            {filteredDoctors.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400 font-bold py-12">
                No doctor practices found.
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#fbf7f8] text-slate-550 font-bold border-b border-[#ebdfe1]">
                    <th className="px-4 py-2.5">Practice</th>
                    <th className="px-4 py-2.5">Doctor</th>
                    <th className="px-4 py-2.5">City</th>
                    <th className="px-4 py-2.5">Last Order</th>
                    <th className="px-4 py-2.5 text-right">Profile</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ebdfe1]/30">
                  {filteredDoctors.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-bold text-slate-800">{doc.practice_name}</td>
                      <td className="px-4 py-3 text-slate-700 font-bold">Dr. {doc.doctor_first_name} {doc.doctor_last_name}</td>
                      <td className="px-4 py-3 text-slate-600 font-semibold">{doc.city}, {doc.state}</td>
                      <td className="px-4 py-3 text-slate-500 font-semibold">
                        {doc.last_order_date ? (
                          new Date(doc.last_order_date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric"
                          })
                        ) : (
                          <span className="text-[10px] text-rose-500 font-bold">No orders</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/rep/doctors/detail?id=${doc.id}`}
                          className="inline-flex items-center p-1 rounded-lg hover:bg-brand-burgundy-light text-slate-500 hover:text-brand-burgundy transition-colors"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Order Details Drawer / Modal */}
      {detailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="glass-card rounded-2xl border border-[#ebdfe1] p-6 w-full max-w-2xl relative overflow-hidden flex flex-col max-h-[90vh] shadow-2xl">
            <button
              onClick={() => setDetailModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="mb-5 flex items-center gap-2 shrink-0">
              <FileSpreadsheet className="w-5 h-5 text-brand-burgundy" />
              <h2 className="text-base font-extrabold text-slate-900">Order Details: {selectedOrder?.order_number}</h2>
            </div>

            {modalLoading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 flex-1">
                <Loader2 className="w-8 h-8 text-brand-burgundy animate-spin" />
                <span className="text-slate-500 text-xs font-bold">Fetching line items...</span>
              </div>
            ) : orderDetail ? (
              <div className="space-y-6 overflow-y-auto pr-1 flex-1 text-left">
                {/* Meta blocks */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Status Card */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-[#ebdfe1]">
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Order Status</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border inline-block ${getStatusColor(orderDetail.order.status)}`}>
                      {formatStatus(orderDetail.order.status)}
                    </span>
                    {orderDetail.order.shopify_order_number && (
                      <div className="text-[9px] font-mono text-slate-500 mt-2 font-semibold">Shopify Ref: {orderDetail.order.shopify_order_number}</div>
                    )}
                  </div>

                  {/* Doctor Info */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-[#ebdfe1]">
                    <span className="text-[9px] text-slate-505 font-bold uppercase tracking-wider block mb-1">Doctor Practice</span>
                    <div className="text-xs font-bold text-slate-800">{orderDetail.order.doctor_practice}</div>
                    <div className="text-[10px] text-slate-505 font-semibold">Dr. {orderDetail.order.doctor_first_name} {orderDetail.order.doctor_last_name}</div>
                  </div>
                </div>

                {/* Delivery and Contact */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/50 p-4 rounded-xl border border-[#ebdfe1]">
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-550 uppercase tracking-wider mb-2">Practice Contacts</h4>
                    <p className="text-xs font-bold text-slate-700">Email: {orderDetail.order.doctor_email}</p>
                    <p className="text-xs font-bold text-slate-700 mt-1">Phone: {orderDetail.order.doctor_phone}</p>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-550 uppercase tracking-wider mb-2">Delivery Address</h4>
                    <p className="text-xs text-slate-700 font-semibold">{orderDetail.order.address_line1}</p>
                    {orderDetail.order.address_line2 && <p className="text-xs text-slate-700 font-semibold">{orderDetail.order.address_line2}</p>}
                    <p className="text-xs text-slate-700 font-semibold">{orderDetail.order.city}, {orderDetail.order.state} {orderDetail.order.zip}</p>
                  </div>
                </div>

                {/* Order Items Table */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-slate-505 uppercase tracking-wider">Itemized Line Items</h4>
                  <div className="border border-[#ebdfe1] rounded-xl overflow-hidden bg-white">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 font-bold border-b border-[#ebdfe1]">
                          <th className="px-4 py-2.5">Wholesale Product</th>
                          <th className="px-4 py-2.5 text-center">Qty (Cases)</th>
                          <th className="px-4 py-2.5 text-right">Case Price</th>
                          <th className="px-4 py-2.5 text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#ebdfe1]/30">
                        {orderDetail.items.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50/50">
                            <td className="px-4 py-3 text-slate-800 font-bold">{item.product_name || "Unknown Product"}</td>
                            <td className="px-4 py-3 text-center text-slate-900 font-extrabold">{item.quantity_cases}</td>
                            <td className="px-4 py-3 text-right text-slate-700 font-bold">{formatPrice(item.case_price_snapshot)}</td>
                            <td className="px-4 py-3 text-right text-slate-900 font-extrabold">{formatPrice(item.case_price_snapshot * item.quantity_cases)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Total block */}
                <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-[#ebdfe1] font-extrabold font-display">
                  <span className="text-slate-550 text-xs uppercase tracking-wider">Total Stripe Charged</span>
                  <span className="text-brand-burgundy text-lg tracking-tight">{formatPrice(orderDetail.order.total_cents)}</span>
                </div>
              </div>
            ) : null}
            
            <div className="pt-3 border-t border-[#ebdfe1] mt-auto flex justify-end shrink-0">
              <button
                onClick={() => setDetailModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-350 text-slate-650 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
=======
"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { 
  Loader2, 
  ShoppingCart, 
  Users, 
  TrendingUp, 
  Search, 
  ChevronRight,
  Plus,
  Stethoscope,
  X,
  FileSpreadsheet,
  PieChart as PieChartIcon,
  ShoppingBag,
  Clock,
  Trophy
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

export default function RepDashboard() {
  const router = useRouter();
  const { token, user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  
  // Dashboard data state
  const [stats, setStats] = useState({ doctorCount: 0, orderCount: 0, totalSalesCents: 0, pendingOrdersCount: 0 });
  const [orders, setOrders] = useState([]);
  const [doctors, setDoctors] = useState([]);

  // Filters
  const [timeFilter, setTimeFilter] = useState("monthly"); // "weekly", "monthly", "yearly"

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        
        const [dashRes, ordersRes, docsRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/rep/dashboard`, { headers }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/rep/orders`, { headers }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/rep/doctors`, { headers })
        ]);

        if (!dashRes.ok || !ordersRes.ok || !docsRes.ok) {
          throw new Error("Failed to load dashboard metrics.");
        }

        const dashResult = await dashRes.json();
        const ordersResult = await ordersRes.json();
        const docsResult = await docsRes.json();

        // Calculate pending orders
        const pendingCount = ordersResult.filter(o => 
          ['submitted_warehouse', 'confirmed'].includes(o.status)
        ).length;

        setStats({
          ...dashResult.stats,
          pendingOrdersCount: pendingCount
        });
        setOrders(ordersResult);
        setDoctors(docsResult);
      } catch (err) {
        console.warn(err);
        toast.error("Failed to sync dashboard updates.");
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      loadDashboardData();
    }
  }, [token]);

  // Use Memo for complex calculations
  const chartData = useMemo(() => {
    if (!orders.length) return [];
    
    const map = new Map();
    const now = new Date();

    orders.forEach(o => {
      if (['pending_payment', 'failed_payment', 'draft'].includes(o.status)) return;
      
      const d = new Date(o.created_at);
      let key = "";
      
      if (timeFilter === "weekly") {
        const diffTime = Math.abs(now - d);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        if (diffDays > 14) return;
        key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } else if (timeFilter === "monthly") {
        const diffMonths = (now.getFullYear() - d.getFullYear()) * 12 + now.getMonth() - d.getMonth();
        if (diffMonths > 12) return;
        key = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      } else if (timeFilter === "yearly") {
        key = d.getFullYear().toString();
      }

      if (!map.has(key)) {
        map.set(key, { name: key, revenue: 0, orders: 0, timestamp: d.getTime() });
      }
      const entry = map.get(key);
      entry.revenue += (o.total_cents / 100);
      entry.orders += 1;
    });

    return Array.from(map.values()).sort((a, b) => a.timestamp - b.timestamp);
  }, [orders, timeFilter]);

  const statusDistribution = useMemo(() => {
     const map = new Map();
     orders.forEach(o => {
        if (['pending_payment', 'failed_payment', 'draft'].includes(o.status)) return;
        const s = o.status.replace(/_/g, ' ').toUpperCase();
        map.set(s, (map.get(s) || 0) + 1);
     });
     return Array.from(map.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [orders]);

  const topDoctors = useMemo(() => {
     const map = new Map();
     orders.forEach(o => {
        if (['pending_payment', 'failed_payment', 'draft', 'cancelled'].includes(o.status)) return;
        if (!map.has(o.doctor_id)) {
           map.set(o.doctor_id, {
              id: o.doctor_id,
              name: `Dr. ${o.doctor_first_name} ${o.doctor_last_name}`,
              practice: o.doctor_practice,
              revenue: 0,
              orders: 0
           });
        }
        const entry = map.get(o.doctor_id);
        entry.revenue += (o.total_cents / 100);
        entry.orders += 1;
     });
     return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 5); // top 5
  }, [orders]);

  const recentOrdersList = orders.filter(o => 
     !['pending_payment', 'failed_payment', 'draft'].includes(o.status)
  ).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);

  const formatPrice = (cents) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(cents / 100);
  };
  
  const formatPriceDecimal = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "submitted_warehouse":
      case "confirmed":
      case "delivered":
        return "bg-green-50 text-green-700";
      case "returned":
      case "return_requested":
      case "return_approved":
        return "bg-brand-burgundy/10 text-brand-burgundy";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const formatStatus = (status) => {
    if (!status) return "";
    if (status === 'submitted_warehouse') return 'Submitted';
    if (status === 'return_approved') return 'Approved';
    if (status === 'returned') return 'Returned';
    if (status === 'refunded') return 'Refunded';
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Mockup-specific chart colors
  const PIE_COLORS = {
    'RETURNED': '#812434', // brand-burgundy
    'SUBMITTED WAREHOUSE': '#22c55e', // green
    'DELIVERED': '#22c55e',
    'CONFIRMED': '#10b981',
    'DEFAULT': '#94a3b8'
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-brand-burgundy animate-spin" />
          <p className="text-slate-550 text-xs font-bold tracking-wider">Loading rep analytics engine...</p>
        </div>
      </div>
    );
  }

  // Get pie chart summaries (Returned vs Submitted) for footer
  const returnedCount = statusDistribution.find(s => s.name === 'RETURNED')?.value || 0;
  const submittedCount = statusDistribution.find(s => s.name === 'SUBMITTED WAREHOUSE' || s.name === 'CONFIRMED')?.value || 0;

  return (
    <div className="space-y-6 pb-12 animate-fadeIn max-w-[1400px] mx-auto">

      {/* Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-brand-burgundy/10 flex items-center justify-center shrink-0">
             <ShoppingCart className="w-5 h-5 text-brand-burgundy" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">Ready to complete a wholesale order?</h3>
            <p className="text-slate-500 text-[11px] font-medium mt-0.5">
              Quickly submit wholesale catalog transactions, process Stripe credit cards, and push<br className="hidden md:block"/> fulfillment orders directly to the warehouse for packaging and dispatch.
            </p>
          </div>
        </div>
        <Link
          href="/rep/orders/new"
          className="flex items-center gap-2 px-5 py-2.5 bg-brand-burgundy hover:bg-brand-burgundy-hover text-white text-xs font-bold rounded-xl shadow-md transition-all shrink-0"
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Place New Order</span>
        </Link>
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* My Doctors */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-brand-burgundy/10 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-brand-burgundy" />
          </div>
          <div>
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest block mb-0.5">MY DOCTORS</span>
            <span className="text-2xl font-black text-slate-900 leading-none">{stats.doctorCount}</span>
            <span className="text-[10px] text-slate-400 font-medium block mt-1">Total Registered</span>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-brand-burgundy/10 flex items-center justify-center shrink-0">
            <ShoppingBag className="w-5 h-5 text-brand-burgundy" />
          </div>
          <div>
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest block mb-0.5">TOTAL ORDERS</span>
            <span className="text-2xl font-black text-slate-900 leading-none">{stats.orderCount}</span>
            <span className="text-[10px] text-slate-400 font-medium block mt-1">All Time Orders</span>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-brand-burgundy/10 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5 text-brand-burgundy" />
          </div>
          <div>
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest block mb-0.5">TOTAL REVENUE</span>
            <span className="text-2xl font-black text-slate-900 leading-none">{formatPrice(stats.totalSalesCents)}</span>
            <span className="text-[10px] text-slate-400 font-medium block mt-1">All Time Revenue</span>
          </div>
        </div>

        {/* Pending Orders */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-brand-burgundy/10 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-brand-burgundy" />
          </div>
          <div>
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest block mb-0.5">PENDING ORDERS</span>
            <span className="text-2xl font-black text-slate-900 leading-none">{stats.pendingOrdersCount}</span>
            <span className="text-[10px] text-slate-400 font-medium block mt-1">Awaiting Fulfillment</span>
          </div>
        </div>
      </div>

      {/* Middle Row Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Personal Revenue Trends Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col p-6 h-[400px]">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-brand-burgundy" />
              Personal Revenue Trends
            </h2>
            
            <div className="flex bg-white border border-slate-200 p-0.5 rounded-lg overflow-hidden">
              {['weekly', 'monthly', 'yearly'].map(filter => (
                <button
                  key={filter}
                  onClick={() => setTimeFilter(filter)}
                  className={`px-4 py-1.5 text-[11px] font-bold capitalize transition-colors ${
                    timeFilter === filter 
                      ? "bg-brand-burgundy text-white rounded-md shadow-sm" 
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
                 <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                   <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={10} />
                   <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(value) => `₹${value/1000}k`} />
                   <Tooltip 
                     cursor={{ fill: '#f8fafc' }}
                     contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                     labelStyle={{ fontWeight: 'bold', color: '#0f172a', marginBottom: '4px' }}
                     formatter={(value, name) => [name === 'revenue' ? formatPriceDecimal(value) : value, 'Revenue']}
                   />
                   <Bar yAxisId="left" dataKey="revenue" fill="#812434" radius={[4, 4, 0, 0]} maxBarSize={40} />
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
                <span className="text-[10px] font-bold text-slate-500 mb-1 block">This Month Revenue</span>
                <span className="text-xl font-extrabold text-slate-900">{formatPrice(stats.totalSalesCents)}</span>
             </div>
             <div className="text-right">
                <span className="text-[10px] font-bold text-slate-500 mb-1 block">Growth</span>
                <span className="text-xs font-extrabold text-brand-burgundy flex items-center gap-0.5 justify-end">
                   ↑ 100%
                </span>
             </div>
          </div>
        </div>

        {/* Order Fulfillment Status Pie */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col p-6 h-[400px]">
          <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 mb-1">
            <PieChartIcon className="w-4 h-4 text-brand-burgundy" />
            Order Fulfillment Status
          </h2>
          <p className="text-[9px] text-slate-400 font-medium mb-6">Breakdown of your orders currently in transit or delivered.</p>
          
          <div className="flex-1 w-full relative min-h-0 flex items-center justify-center mb-6">
             {statusDistribution.length > 0 ? (
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                   <Pie
                     data={statusDistribution}
                     cx="50%"
                     cy="50%"
                     innerRadius={65}
                     outerRadius={95}
                     paddingAngle={2}
                     dataKey="value"
                     stroke="none"
                   >
                     {statusDistribution.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={PIE_COLORS[entry.name] || PIE_COLORS['DEFAULT']} />
                     ))}
                   </Pie>
                   <Tooltip 
                     contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                     itemStyle={{ fontWeight: 'bold', fontSize: '12px' }}
                   />
                 </PieChart>
               </ResponsiveContainer>
             ) : (
                <div className="text-slate-400 text-xs font-semibold">No active orders</div>
             )}
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 mt-auto">
             <div className="text-center border-r border-slate-100">
                <span className="text-lg font-black text-slate-900 block leading-none mb-1">{returnedCount}</span>
                <span className="text-[10px] font-bold text-brand-burgundy">Returned</span>
             </div>
             <div className="text-center">
                <span className="text-lg font-black text-slate-900 block leading-none mb-1">{submittedCount}</span>
                <span className="text-[10px] font-bold text-green-600">Submitted</span>
             </div>
          </div>
        </div>
      </div>

      {/* Bottom Row Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recent Orders List */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col h-[400px]">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center">
             <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
               <FileSpreadsheet className="w-4 h-4 text-brand-burgundy" />
               Recent Orders
               <span className="text-[9px] text-slate-400 font-medium ml-2 font-normal hidden sm:inline">Your latest wholesale orders.</span>
             </h2>
             <Link href="/rep/orders" className="px-3 py-1 text-[10px] font-bold text-slate-600 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors">
                View All
             </Link>
          </div>
          
          <div className="overflow-y-auto flex-1">
            <table className="w-full text-left text-xs">
              <thead className="bg-white sticky top-0 border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-wider">ORDER ID</th>
                  <th className="px-5 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-wider">DATE</th>
                  <th className="px-5 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-wider">DOCTOR</th>
                  <th className="px-5 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-wider">STATUS</th>
                  <th className="px-5 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-wider text-right">AMOUNT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentOrdersList.map((order, idx) => (
                  <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4 font-extrabold text-slate-800">{order.order_number}</td>
                    <td className="px-5 py-4 text-slate-600 font-semibold">{new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                    <td className="px-5 py-4 text-slate-800 font-bold">Dr. {order.doctor_first_name} {order.doctor_last_name}</td>
                    <td className="px-5 py-4">
                       <span className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider ${getStatusColor(order.status)}`}>
                         {formatStatus(order.status)}
                       </span>
                    </td>
                    <td className="px-5 py-4 text-right font-black text-slate-900">{formatPrice(order.total_cents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {recentOrdersList.length === 0 && (
               <div className="p-8 text-center text-slate-400 text-xs font-semibold">No recent orders found.</div>
            )}
          </div>
        </div>

        {/* Top Doctors List */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col h-[400px]">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center">
             <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
               <Trophy className="w-4 h-4 text-brand-burgundy" />
               Top Doctors
               <span className="text-[9px] text-slate-400 font-medium ml-2 font-normal hidden sm:inline">Your top performing doctors by revenue.</span>
             </h2>
             <Link href="/rep/doctors" className="px-3 py-1 text-[10px] font-bold text-slate-600 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors">
                View All
             </Link>
          </div>
          
          <div className="overflow-y-auto flex-1 p-3">
             <div className="space-y-1">
               {topDoctors.map((doc, idx) => (
                 <div key={doc.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                    <div className="flex items-center gap-4">
                       <div className="w-8 h-8 rounded-full bg-brand-burgundy/10 text-brand-burgundy flex items-center justify-center text-xs font-black shrink-0">
                          {idx + 1}
                       </div>
                       <div>
                          <p className="text-xs font-bold text-slate-900">{doc.name}</p>
                       </div>
                    </div>
                    <div className="text-right">
                       <p className="text-xs font-black text-slate-900">{formatPriceDecimal(doc.revenue)}</p>
                    </div>
                 </div>
               ))}
               {topDoctors.length === 0 && (
                  <div className="p-8 text-center text-slate-400 text-xs font-semibold">No doctors found.</div>
               )}
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}
>>>>>>> Stashed changes
