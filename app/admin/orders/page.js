"use client";

import { useEffect, useState } from "react";
import { 
  FileSpreadsheet, 
  Search, 
  Loader2, 
  X, 
  Calendar, 
  Filter, 
  Download, 
  Eye,
  DollarSign,
  User,
  HeartHandshake,
  Activity,
  ShoppingBag,
  Pencil
} from "lucide-react";
import { useAuthStore } from "../../../store/authStore";
import { toast } from "sonner";

export default function AllOrders() {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);

  const getRefundCardDetails = (stripeCustomerId) => {
    if (!stripeCustomerId) return null;
    if (stripeCustomerId.startsWith("{")) {
      try {
        const card = JSON.parse(stripeCustomerId);
        return `${card.brand || "Credit Card"} ending in ${card.last4 || "xxxx"}`;
      } catch (e) {
        return null;
      }
    }
    return null;
  };
  
  // Filters data
  const [reps, setReps] = useState([]);
  const [doctors, setDoctors] = useState([]);

  // Active filters
  const [filterRep, setFilterRep] = useState("");
  const [filterDoctor, setFilterDoctor] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Details Modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetail, setOrderDetail] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // State for updating status
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [carrier, setCarrier] = useState("");
  const [trackingNo, setTrackingNo] = useState("");
  const [notes, setNotes] = useState("");

  // Quick Status Edit Modal states
  const [quickStatusModalOpen, setQuickStatusModalOpen] = useState(false);
  const [quickOrder, setQuickOrder] = useState(null);
  const [quickStatus, setQuickStatus] = useState("");
  const [quickCarrier, setQuickCarrier] = useState("");
  const [quickTrackingNo, setQuickTrackingNo] = useState("");
  const [quickNotes, setQuickNotes] = useState("");
  const [quickUpdating, setQuickUpdating] = useState(false);

  // Load reps and doctors for dropdowns
  useEffect(() => {
    async function loadFilterOptions() {
      try {
        const [repsRes, docsRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/admin/reps`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/admin/doctors`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        if (repsRes.ok) {
          const repsData = await repsRes.json();
          setReps(repsData);
        }
        if (docsRes.ok) {
          const docsData = await docsRes.json();
          setDoctors(docsData);
        }
      } catch (err) {
        console.warn("Could not load filters:", err);
      }
    }

    if (token) {
      loadFilterOptions();
    }
  }, [token]);

  // Load orders (and trigger when filters change)
  async function fetchOrders() {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (filterRep) queryParams.append("rep_id", filterRep);
      if (filterDoctor) queryParams.append("doctor_id", filterDoctor);
      if (filterStatus) queryParams.append("status", filterStatus);
      if (startDate) queryParams.append("start_date", startDate);
      if (endDate) queryParams.append("end_date", endDate);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/admin/orders?${queryParams.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (!response.ok) {
        throw new Error("Failed to load orders.");
      }

      const result = await response.json();
      setOrders(result);
    } catch (err) {
      console.warn(err);
      toast.error("Failed to load orders list.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) {
      fetchOrders();
    }
  }, [token, filterRep, filterDoctor, filterStatus, startDate, endDate]);

  // Open order details modal
  const handleOpenDetails = async (order) => {
    setSelectedOrder(order);
    setOrderDetail(null);
    setModalLoading(true);
    setDetailModalOpen(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/admin/orders/${order.id}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (!response.ok) {
        throw new Error("Failed to load order details.");
      }

      const result = await response.json();
      setOrderDetail(result);
      setNewStatus(result.order.status);
      setCarrier(result.order.shipping_carrier || "");
      setTrackingNo(result.order.tracking_number || "");
      setNotes(result.order.tracking_notes || "");
    } catch (err) {
      toast.error("Could not load details for order.");
      setDetailModalOpen(false);
    } finally {
      setModalLoading(false);
    }
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    setUpdatingStatus(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/admin/orders/${orderDetail.order.id}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            status: newStatus,
            shipping_carrier: carrier,
            tracking_number: trackingNo,
            tracking_notes: notes
          })
        }
      );

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to update order status.");
      }

      toast.success("Order status updated successfully!");
      
      const detailRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/admin/orders/${orderDetail.order.id}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      if (detailRes.ok) {
        const detailData = await detailRes.json();
        setOrderDetail(detailData);
      }
      fetchOrders();
    } catch (err) {
      toast.error(err.message || "Failed to update order.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleProcessReturn = async (approved) => {
    setUpdatingStatus(true);
    const targetStatus = approved ? 'return_approved' : 'delivered';
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/admin/orders/${orderDetail.order.id}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            status: targetStatus
          })
        }
      );

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to process return.");
      }

      toast.success(approved ? "Return request approved!" : "Return request rejected.");
      
      const detailRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/admin/orders/${orderDetail.order.id}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      if (detailRes.ok) {
        const detailData = await detailRes.json();
        setOrderDetail(detailData);
        setNewStatus(detailData.order.status);
      }
      fetchOrders();
    } catch (err) {
      toast.error(err.message || "Failed to process return.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleRefundOrder = async () => {
    setUpdatingStatus(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/admin/orders/${orderDetail.order.id}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            status: "refunded"
          })
        }
      );

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to process refund.");
      }

      toast.success("Refund processed successfully!");
      
      const detailRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/admin/orders/${orderDetail.order.id}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      if (detailRes.ok) {
        const detailData = await detailRes.json();
        setOrderDetail(detailData);
        setNewStatus(detailData.order.status);
      }
      fetchOrders();
    } catch (err) {
      toast.error(err.message || "Failed to process refund.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleOpenQuickStatus = (order) => {
    setQuickOrder(order);
    setQuickStatus(order.status);
    setQuickCarrier(order.shipping_carrier || "");
    setQuickTrackingNo(order.tracking_number || "");
    setQuickNotes(order.tracking_notes || "");
    setQuickStatusModalOpen(true);
  };

  const handleSaveQuickStatus = async (e) => {
    e.preventDefault();
    setQuickUpdating(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/admin/orders/${quickOrder.id}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            status: quickStatus,
            shipping_carrier: quickCarrier,
            tracking_number: quickTrackingNo,
            tracking_notes: quickNotes
          })
        }
      );

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to update order status.");
      }

      toast.success("Order status updated successfully!");
      setQuickStatusModalOpen(false);
      fetchOrders();
    } catch (err) {
      toast.error(err.message || "Failed to update order status.");
    } finally {
      setQuickUpdating(false);
    }
  };

  const handleProcessQuickReturn = async (approved) => {
    setQuickUpdating(true);
    const targetStatus = approved ? 'returned' : 'delivered';
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/admin/orders/${quickOrder.id}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            status: targetStatus
          })
        }
      );

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to process return.");
      }

      toast.success(approved ? "Return approved & refunded!" : "Return request rejected.");
      setQuickStatusModalOpen(false);
      fetchOrders();
    } catch (err) {
      toast.error(err.message || "Failed to process return.");
    } finally {
      setQuickUpdating(false);
    }
  };

  // Export orders to CSV
  const handleExportCSV = () => {
    if (orders.length === 0) {
      toast.info("No orders to export.");
      return;
    }

    const headers = [
      "Order Number",
      "Representative",
      "Practice Name",
      "Doctor Name",
      "Total (USD)",
      "Status",
      "Created At",
      "Shopify Order ID"
    ];

    const rows = orders.map((o) => [
      o.order_number,
      o.rep_name,
      o.doctor_practice,
      `Dr. ${o.doctor_first_name} ${o.doctor_last_name}`,
      (o.total_cents / 100).toFixed(2),
      o.status.toUpperCase(),
      new Date(o.created_at).toISOString(),
      o.shopify_order_id || "N/A"
    ]);

    const csvContent = 
      "data:text/csv;charset=utf-8," + 
      [headers.join(","), ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `lipistry_orders_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV export downloaded successfully!");
  };

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
      case "cancelled":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "failed_payment":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "return_requested":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "return_approved":
        return "bg-pink-50 text-pink-700 border-pink-200";
      case "returned":
        return "bg-teal-50 text-teal-750 border-teal-200";
      case "refunded":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default:
        return "bg-amber-50 text-amber-700 border-amber-200";
    }
  };

  const formatStatus = (status) => {
    if (!status) return "";
    if (status === 'returned') return 'RETURNED TO WAREHOUSE';
    if (status === 'refunded') return 'AMOUNT REFUNDED';
    return status.replace(/_/g, ' ').toUpperCase();
  };

  const clearFilters = () => {
    setFilterRep("");
    setFilterDoctor("");
    setFilterStatus("");
    setStartDate("");
    setEndDate("");
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">System Orders Log</h1>
          <p className="text-slate-500 text-xs mt-1 font-semibold">Review wholesale orders, filter logs, and export records for accounting purposes.</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 active:scale-[0.98] text-slate-700 text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
        >
          <Download className="w-4 h-4 text-brand-burgundy" />
          <span>Export to CSV</span>
        </button>
      </div>

      {/* Advanced Filter Panel */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-200 space-y-4 shadow-sm">
        <div className="flex items-center gap-2 text-slate-750 font-bold text-xs">
          <Filter className="w-4.5 h-4.5 text-brand-burgundy" />
          <span>Filter Order History</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          {/* Rep Select */}
          <div>
            <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">Sales Rep</label>
            <select
              value={filterRep}
              onChange={(e) => setFilterRep(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs font-semibold glass-input cursor-pointer"
            >
              <option value="">All Representatives</option>
              {reps.map((rep) => (
                <option key={rep.id} value={rep.id}>{rep.name}</option>
              ))}
            </select>
          </div>

          {/* Doctor Select */}
          <div>
            <label className="block text-slate-505 text-[10px] font-bold uppercase tracking-wider mb-1.5">Doctor Practice</label>
            <select
              value={filterDoctor}
              onChange={(e) => setFilterDoctor(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs font-semibold glass-input cursor-pointer"
            >
              <option value="">All Practices</option>
              {doctors.map((doc) => (
                <option key={doc.id} value={doc.id}>{doc.practice_name}</option>
              ))}
            </select>
          </div>

          {/* Status Select */}
          <div>
            <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">Order Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs font-semibold glass-input cursor-pointer"
              >
                <option value="">All Statuses</option>
                <option value="pending_payment">PENDING PAYMENT</option>
                <option value="paid">PAID (PENDING SYNC)</option>
                <option value="submitted_warehouse">SUBMITTED TO WAREHOUSE</option>
                <option value="confirmed">CONFIRMED</option>
                <option value="shipped">SHIPPED</option>
                <option value="out_for_delivery">OUT FOR DELIVERY</option>
                <option value="delivered">DELIVERED</option>
                <option value="cancelled">CANCELLED</option>
                <option value="return_requested">RETURN REQUESTED</option>
                <option value="returned">RETURNED</option>
              </select>
          </div>

          {/* From Date */}
          <div>
            <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs font-semibold glass-input cursor-pointer"
            />
          </div>

          {/* To Date */}
          <div>
            <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs font-semibold glass-input cursor-pointer"
            />
          </div>
        </div>

        <div className="flex justify-between items-center pt-2">
          <p className="text-[10px] text-slate-500 font-bold">Showing {orders.length} orders matching criteria.</p>
          <button
            onClick={clearFilters}
            className="text-xs font-bold text-slate-550 hover:text-brand-burgundy transition-colors cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="glass-panel rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3 bg-white">
            <Loader2 className="w-6 h-6 text-brand-burgundy animate-spin" />
            <span className="text-slate-500 text-xs font-semibold">Updating orders index...</span>
          </div>
        ) : (
          <div className="overflow-x-auto bg-white">
            {orders.length === 0 ? (
              <div className="px-6 py-12 text-center text-slate-505 text-xs font-semibold">
                No orders match your search parameters.
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-550 font-bold border-b border-slate-200">
                    <th className="px-6 py-3.5">Order Number</th>
                    <th className="px-6 py-3.5">Rep Name</th>
                    <th className="px-6 py-3.5">Doctor / Practice</th>
                    <th className="px-6 py-3.5">Total Paid</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5">Date</th>
                    <th className="px-6 py-3.5 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-800">{o.order_number}</td>
                      <td className="px-6 py-4 text-slate-700 font-bold">{o.rep_name}</td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-800">{o.doctor_practice}</div>
                        <div className="text-[10px] text-slate-500 font-semibold">Dr. {o.doctor_first_name} {o.doctor_last_name}</div>
                      </td>
                      <td className="px-6 py-4 font-extrabold text-slate-800">{formatPrice(o.total_cents)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-extrabold border ${getStatusColor(o.status)}`}>
                          {formatStatus(o.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-semibold">
                        {new Date(o.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleOpenDetails(o)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-slate-700 hover:bg-brand-burgundy-light hover:text-brand-burgundy border border-slate-200 font-bold transition-all cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-brand-burgundy" />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Order Details Drawer / Modal */}
      {detailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="glass-card rounded-2xl border border-slate-200 p-6 w-full max-w-2xl relative overflow-hidden flex flex-col max-h-[90vh] shadow-2xl">
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Status Card */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Order Status</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border inline-block ${getStatusColor(orderDetail.order.status)}`}>
                      {formatStatus(orderDetail.order.status)}
                    </span>
                    {orderDetail.order.shopify_order_id && (
                      <div className="text-[9px] font-mono text-slate-500 mt-2 font-semibold">ID: {orderDetail.order.shopify_order_id}</div>
                    )}
                  </div>

                  {/* Representative Info */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[9px] text-slate-505 font-bold uppercase tracking-wider block mb-1">Sales Representative</span>
                    <div className="text-xs font-bold text-slate-800">{orderDetail.order.rep_name}</div>
                    <div className="text-[10px] text-slate-505 font-semibold">{orderDetail.order.rep_email}</div>
                  </div>

                  {/* Doctor Info */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[9px] text-slate-505 font-bold uppercase tracking-wider block mb-1">Doctor Practice</span>
                    <div className="text-xs font-bold text-slate-800">{orderDetail.order.doctor_practice}</div>
                    <div className="text-[10px] text-slate-505 font-semibold">Dr. {orderDetail.order.doctor_first_name} {orderDetail.order.doctor_last_name}</div>
                  </div>
                </div>

                {/* Delivery and Contact */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Practice Contacts</h4>
                    <p className="text-xs font-bold text-slate-700">Email: {orderDetail.order.doctor_email}</p>
                    <p className="text-xs font-bold text-slate-700 mt-1">Phone: {orderDetail.order.doctor_phone}</p>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Delivery Address</h4>
                    <p className="text-xs text-slate-700 font-semibold">{orderDetail.order.address_line1}</p>
                    {orderDetail.order.address_line2 && <p className="text-xs text-slate-700 font-semibold">{orderDetail.order.address_line2}</p>}
                    <p className="text-xs text-slate-700 font-semibold">{orderDetail.order.city}, {orderDetail.order.state} {orderDetail.order.zip}</p>
                  </div>
                </div>

                {/* Fulfillment & Shipping Info */}
                {(orderDetail.order.tracking_number || orderDetail.order.shipping_carrier || orderDetail.order.shipped_at || orderDetail.order.delivered_at) && (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Fulfillment & Shipping Info</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="font-bold text-slate-700">Carrier: <span className="font-semibold text-slate-600">{orderDetail.order.shipping_carrier || "N/A"}</span></p>
                        <p className="font-bold text-slate-700 mt-1">Tracking Number: <span className="font-semibold text-slate-600">{orderDetail.order.tracking_number || "N/A"}</span></p>
                      </div>
                      <div>
                        {orderDetail.order.shipped_at && (
                          <p className="font-bold text-slate-700">Shipped: <span className="font-semibold text-slate-600">{new Date(orderDetail.order.shipped_at).toLocaleString()}</span></p>
                        )}
                        {orderDetail.order.delivered_at && (
                          <p className="font-bold text-slate-700 mt-1">Delivered: <span className="font-semibold text-slate-600">{new Date(orderDetail.order.delivered_at).toLocaleString()}</span></p>
                        )}
                      </div>
                    </div>
                    {orderDetail.order.tracking_notes && (
                      <p className="font-bold text-slate-700 mt-2">Notes: <span className="font-semibold text-slate-600">{orderDetail.order.tracking_notes}</span></p>
                    )}
                  </div>
                )}

                {/* Return Details */}
                {orderDetail.order.return_reason && (
                  <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-200 text-xs">
                    <h4 className="text-[10px] font-bold text-purple-700 uppercase tracking-wider mb-2">Return Details</h4>
                    <div className="space-y-2">
                      <p className="font-bold text-slate-700">Reason: <span className="font-semibold text-slate-600">{orderDetail.order.return_reason}</span></p>
                      <p className="font-bold text-slate-700">Description: <span className="font-semibold text-slate-600">{orderDetail.order.return_description}</span></p>
                      {orderDetail.order.return_requested_at && (
                        <p className="font-bold text-slate-700">Requested At: <span className="font-semibold text-slate-600">{new Date(orderDetail.order.return_requested_at).toLocaleString()}</span></p>
                      )}
                      {orderDetail.order.return_processed_at && (
                        <p className="font-bold text-slate-700">Processed At: <span className="font-semibold text-slate-600">{new Date(orderDetail.order.return_processed_at).toLocaleString()}</span></p>
                      )}
                      {orderDetail.order.return_proof_image && (
                        <div>
                          <p className="font-bold text-slate-700 mb-1.5">Proof Image:</p>
                          {(() => {
                            const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace("/api", "");
                            const imgUrl = orderDetail.order.return_proof_image.startsWith("http") 
                              ? orderDetail.order.return_proof_image 
                              : `${baseUrl}${orderDetail.order.return_proof_image}`;
                            return (
                              <a href={imgUrl} target="_blank" rel="noopener noreferrer" className="inline-block">
                                <img 
                                  src={imgUrl} 
                                  alt="Return Proof" 
                                  className="w-32 h-32 object-cover rounded-xl border border-purple-200 shadow-sm hover:opacity-90 transition-opacity" 
                                />
                              </a>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Refund Confirmation Banner */}
                {orderDetail.order.status === 'refunded' && (
                  <div className="bg-emerald-50/85 p-4 rounded-xl border border-emerald-200 text-xs">
                    <h4 className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <span>💰</span>
                      <span>Refund Confirmed</span>
                    </h4>
                    <div className="space-y-1.5 text-emerald-900 font-semibold">
                      <p>
                        A total refund of <span className="font-extrabold text-emerald-950">{formatPrice(orderDetail.order.total_cents)}</span> was successfully issued to the practice card on file:
                      </p>
                      <div className="p-2 bg-white/80 rounded-lg border border-emerald-200 inline-block my-1">
                        <p className="font-bold text-slate-800 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          <span>
                            {(() => {
                              const card = getRefundCardDetails(orderDetail.order.stripe_customer_id);
                              return card ? card : "Stripe Card on File";
                            })()}
                          </span>
                        </p>
                      </div>
                      <p className="text-[10px] text-emerald-700 font-mono">
                        Refund Reference: {orderDetail.order.stripe_charge_id ? `re_${orderDetail.order.stripe_charge_id.replace('ch_', '')}` : "re_mock_refund_success"}
                      </p>
                    </div>
                  </div>
                )}

                {/* Warehouse Fulfillment Control */}
                <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">Warehouse Fulfillment Control</h4>
                  
                  {orderDetail.order.status === 'return_requested' ? (
                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-slate-600">A return has been requested for this order. Please review the proof of image and description above before taking action.</p>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          disabled={updatingStatus}
                          onClick={() => handleProcessReturn(true)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
                        >
                          {updatingStatus ? "Processing..." : "Approve Return Request"}
                        </button>
                        <button
                          type="button"
                          disabled={updatingStatus}
                          onClick={() => handleProcessReturn(false)}
                          className="px-4 py-2 bg-rose-650 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
                        >
                          {updatingStatus ? "Processing..." : "Reject Return Request"}
                        </button>
                      </div>
                    </div>
                  ) : orderDetail.order.status === 'return_approved' ? (
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 font-semibold">
                      <p>Return request has been approved. Awaiting product collection/received confirmation from warehouse.</p>
                    </div>
                  ) : orderDetail.order.status === 'returned' ? (
                    <div className="space-y-3">
                      <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 font-semibold">
                        <p>Returned product has been physically received and restocked by the warehouse. You can now issue the Stripe refund to the doctor's payment card.</p>
                      </div>
                      <button
                        type="button"
                        disabled={updatingStatus}
                        onClick={handleRefundOrder}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
                      >
                        {updatingStatus ? "Processing..." : "Issue Stripe Refund & Close"}
                      </button>
                    </div>
                  ) : orderDetail.order.status === 'refunded' ? (
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-250 text-xs text-emerald-900 font-semibold">
                      <p>Refund completed. This return case is fully processed and closed.</p>
                    </div>
                  ) : (
                    <form onSubmit={handleUpdateStatus} className="space-y-3 text-xs">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Fulfillment Status</label>
                          <select
                            value={newStatus}
                            onChange={(e) => setNewStatus(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl text-xs font-semibold glass-input cursor-pointer"
                          >
                            <option value="submitted_warehouse">SUBMITTED TO WAREHOUSE</option>
                            <option value="confirmed">CONFIRMED</option>
                            <option value="shipped">SHIPPED</option>
                            <option value="out_for_delivery">OUT FOR DELIVERY</option>
                            <option value="delivered">DELIVERED</option>
                            <option value="cancelled">CANCELLED</option>
                            {orderDetail.order.status === 'return_approved' && (
                              <option value="return_approved">RETURN APPROVED</option>
                            )}
                            {orderDetail.order.status === 'returned' && (
                              <option value="returned">RETURNED</option>
                            )}
                            {orderDetail.order.status === 'refunded' && (
                              <option value="refunded">REFUNDED</option>
                            )}
                          </select>
                        </div>
                        
                        {(newStatus === 'shipped' || newStatus === 'out_for_delivery') && (
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Shipping Carrier</label>
                            <input
                              type="text"
                              placeholder="e.g. FedEx, UPS"
                              value={carrier}
                              onChange={(e) => setCarrier(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl text-xs font-semibold glass-input"
                            />
                          </div>
                        )}
                      </div>

                      {(newStatus === 'shipped' || newStatus === 'out_for_delivery') && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Tracking Number</label>
                            <input
                              type="text"
                              placeholder="e.g. 1234567890"
                              value={trackingNo}
                              onChange={(e) => setTrackingNo(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl text-xs font-semibold glass-input"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Tracking Notes</label>
                            <input
                              type="text"
                              placeholder="e.g. Left at side door"
                              value={notes}
                              onChange={(e) => setNotes(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl text-xs font-semibold glass-input"
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex justify-end pt-1">
                        <button
                          type="submit"
                          disabled={updatingStatus}
                          className="px-4 py-2 bg-brand-burgundy text-white hover:bg-brand-burgundy-dark rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
                        >
                          {updatingStatus ? "Updating..." : "Update Status"}
                        </button>
                      </div>
                    </form>
                  )}
                </div>

                {/* Order Items Table */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-slate-505 uppercase tracking-wider">Itemized Line Items</h4>
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                          <th className="px-4 py-2.5">Wholesale Product</th>
                          <th className="px-4 py-2.5 text-center">Qty (Cases)</th>
                          <th className="px-4 py-2.5 text-right">Case Price</th>
                          <th className="px-4 py-2.5 text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {orderDetail.items.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50/50">
                            <td className="px-4 py-3 text-slate-800 font-bold">
                              <div className="flex items-center gap-2">
                                {(() => {
                                  let firstImg = null;
                                  if (item.product_images) {
                                    try {
                                      const parsed = typeof item.product_images === "string" ? JSON.parse(item.product_images) : item.product_images;
                                      if (Array.isArray(parsed) && parsed.length > 0) {
                                        firstImg = parsed[0];
                                      }
                                    } catch (e) {}
                                  }
                                  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace("/api", "");
                                  const imgUrl = firstImg ? (firstImg.startsWith("http") ? firstImg : `${baseUrl}${firstImg}`) : null;

                                  return imgUrl ? (
                                    <img 
                                      src={imgUrl} 
                                      alt={item.product_name} 
                                      className="w-8 h-8 object-cover rounded-lg border border-slate-200 shrink-0 shadow-sm" 
                                    />
                                  ) : (
                                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200 text-slate-400 shrink-0">
                                      <ShoppingBag className="w-4.5 h-4.5" />
                                    </div>
                                  );
                                })()}
                                <span>{item.product_name || "Unknown Product"}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center text-slate-900 font-extrabold">{item.quantity}</td>
                            <td className="px-4 py-3 text-right text-slate-700 font-bold">{formatPrice(item.price_cents)}</td>
                            <td className="px-4 py-3 text-right text-slate-900 font-extrabold">{formatPrice(item.price_cents * item.quantity)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Total block */}
                <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-200 font-extrabold">
                  <span className="text-slate-550 text-xs uppercase tracking-wider">Grand Total (Stripe Charged)</span>
                  <span className="text-brand-burgundy text-lg tracking-tight">{formatPrice(orderDetail.order.total_cents)}</span>
                </div>
              </div>
            ) : null}
            
            <div className="pt-3 border-t border-slate-200 mt-auto flex justify-end shrink-0">
              <button
                onClick={() => setDetailModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-300 text-slate-650 hover:bg-slate-50 transition-colors cursor-pointer"
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
