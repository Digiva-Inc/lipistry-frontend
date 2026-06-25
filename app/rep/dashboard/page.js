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
      loadDashboardData();
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
