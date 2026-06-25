"use client";

import { useEffect, useState } from "react";
import { 
  Package, 
  Search, 
  Loader2, 
  X, 
  Truck, 
  CheckCircle2, 
  Clock, 
  CheckSquare, 
  Square,
  ClipboardList,
  ChevronRight,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import { useAuthStore } from "../../../store/authStore";
import { toast } from "sonner";

export default function WarehousePanel() {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("pending"); // pending, confirmed, active_shipping, completed, all

  // Detail Modal & Packing List
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [packedItems, setPackedItems] = useState({}); // mapping of item_id -> boolean

  // Shipping form modal
  const [shipModalOpen, setShipModalOpen] = useState(false);
  const [shippingOrder, setShippingOrder] = useState(null);
  const [carrier, setCarrier] = useState("FedEx");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [shipLoading, setShipLoading] = useState(false);

  // Fetch all orders
  async function fetchOrders() {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/admin/orders`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.ok) throw new Error("Failed to load orders");
      const result = await response.json();
      
      // Filter only warehouse-related orders
      const warehouseStatuses = [
        "submitted_warehouse", 
        "confirmed", 
        "shipped", 
        "out_for_delivery", 
        "delivered", 
        "cancelled",
        "return_requested",
        "return_approved",
        "returned"
      ];
      const filtered = result.filter(o => warehouseStatuses.includes(o.status));
      setOrders(filtered);
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
  }, [token]);

  // Open Details Modal & fetch items
  const handleOpenDetails = async (order) => {
    setSelectedOrder(order);
    setOrderItems([]);
    setPackedItems({});
    setModalLoading(true);
    setDetailOpen(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/admin/orders/${order.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.ok) throw new Error("Failed to load order items.");
      const data = await response.json();
      setOrderItems(data.items || []);
    } catch (err) {
      toast.error(err.message || "Failed to load order items.");
    } finally {
      setModalLoading(false);
    }
  };

  // Toggle item packing status
  const togglePackItem = (itemId) => {
    setPackedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  // Update logistics status
  const handleStatusUpdate = async (orderId, newStatus, payload = {}) => {
    const updatingToast = toast.loading(`Updating order to ${newStatus.replace('_', ' ')}...`);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/admin/orders/${orderId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            status: newStatus,
            ...payload
          })
        }
      );

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to update status.");

      toast.success(`Order status updated successfully!`, { id: updatingToast });
      fetchOrders();
      
      // Update local state if modal is open
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => ({ ...prev, status: newStatus, ...payload }));
      }
    } catch (err) {
      toast.error(err.message || "Failed to update status.", { id: updatingToast });
    }
  };

  // Confirm order
  const handleConfirmOrder = (orderId) => {
    handleStatusUpdate(orderId, "confirmed");
  };

  // Open ship dialog
  const handleOpenShipDialog = (order) => {
    setShippingOrder(order);
    setTrackingNumber("");
    setNotes("");
    setShipModalOpen(true);
  };

  // Submit ship payload
  const handleShipSubmit = async (e) => {
    e.preventDefault();
    if (!trackingNumber) {
      toast.error("Please enter a tracking number.");
      return;
    }

    setShipLoading(true);
    try {
      await handleStatusUpdate(shippingOrder.id, "shipped", {
        shipping_carrier: carrier,
        tracking_number: trackingNumber,
        tracking_notes: notes
      });
      setShipModalOpen(false);
    } finally {
      setShipLoading(false);
    }
  };

  // Filter orders based on active tab & search query
  const filteredOrders = orders.filter((order) => {
    const matchesSearch = 
      order.order_number.toLowerCase().includes(search.toLowerCase()) ||
      `${order.doctor_first_name} ${order.doctor_last_name}`.toLowerCase().includes(search.toLowerCase()) ||
      order.doctor_practice.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    switch (activeTab) {
      case "pending":
        return order.status === "submitted_warehouse";
      case "confirmed":
        return order.status === "confirmed";
      case "active_shipping":
        return order.status === "shipped" || order.status === "out_for_delivery";
      case "returns":
        return order.status === "return_requested" || order.status === "return_approved" || order.status === "returned";
      case "completed":
        return order.status === "delivered" || order.status === "cancelled";
      default:
        return true;
    }
  });

  // Calculate statistics
  const pendingCount = orders.filter(o => o.status === "submitted_warehouse").length;
  const confirmedCount = orders.filter(o => o.status === "confirmed").length;
  const transitCount = orders.filter(o => o.status === "shipped" || o.status === "out_for_delivery").length;
  const returnsCount = orders.filter(o => o.status === "return_requested" || o.status === "return_approved").length;
  const completedCount = orders.filter(o => o.status === "delivered").length;

  const formatPrice = (cents) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "submitted_warehouse":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
            <Clock className="w-3 h-3" />
            <span>PENDING CONFIRMATION</span>
          </span>
        );
      case "confirmed":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
            <Package className="w-3 h-3" />
            <span>CONFIRMED / PACKING</span>
          </span>
        );
      case "shipped":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
            <Truck className="w-3 h-3" />
            <span>SHIPPED / IN TRANSIT</span>
          </span>
        );
      case "out_for_delivery":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
            <Truck className="w-3 h-3 animate-bounce" />
            <span>OUT FOR DELIVERY</span>
          </span>
        );
      case "delivered":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="w-3 h-3" />
            <span>DELIVERED</span>
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full">
            <X className="w-3 h-3" />
            <span>CANCELLED</span>
          </span>
        );
      case "return_requested":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
            <Clock className="w-3 h-3" />
            <span>RETURN REQUESTED</span>
          </span>
        );
      case "return_approved":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-pink-700 bg-pink-50 border border-pink-200 px-2 py-0.5 rounded-full">
            <Clock className="w-3 h-3" />
            <span>RETURN APPROVED / PENDING PICKUP</span>
          </span>
        );
      case "returned":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="w-3 h-3" />
            <span>RETURN RECEIVED & RESTOCKED</span>
          </span>
        );
      default:
        return <span className="text-slate-500">{status}</span>;
    }
  };

  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace("/api", "");
    return `${baseUrl}${path}`;
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-brand-burgundy animate-spin" />
          <p className="text-slate-500 text-xs font-bold tracking-wider">Loading warehouse backlog...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">Warehouse Fulfillment Control Center</h1>
        <p className="text-slate-500 text-xs mt-1 font-semibold">Track order packaging progress, dispatch shipments with tracking numbers, and manage logs.</p>
      </div>

      {/* Stats Board */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md hover:border-slate-350 hover:-translate-y-0.5 transition-all duration-300">
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Pending Packing</span>
            <span className="text-2xl font-black text-slate-800 mt-1 block">{pendingCount}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md hover:border-slate-350 hover:-translate-y-0.5 transition-all duration-300">
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Confirmed Orders</span>
            <span className="text-2xl font-black text-slate-800 mt-1 block">{confirmedCount}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md hover:border-slate-350 hover:-translate-y-0.5 transition-all duration-300">
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">In Transit</span>
            <span className="text-2xl font-black text-slate-800 mt-1 block">{transitCount}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Truck className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md hover:border-slate-350 hover:-translate-y-0.5 transition-all duration-300">
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Completed Today</span>
            <span className="text-2xl font-black text-slate-800 mt-1 block">{completedCount}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Tabs and Search */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
        {/* Tabs */}
        <div className="flex flex-wrap gap-1 bg-slate-50 p-1 rounded-xl">
          {[
            { id: "pending", name: "Pending Confirmation", count: pendingCount },
            { id: "confirmed", name: "Confirmed / Packaging", count: confirmedCount },
            { id: "active_shipping", name: "Active Transit", count: transitCount },
            { id: "returns", name: "Returns / Pickups", count: returnsCount },
            { id: "completed", name: "Completed" },
            { id: "all", name: "All Log" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${
                activeTab === tab.id
                  ? "bg-brand-burgundy text-white shadow-md"
                  : "text-slate-500 hover:text-slate-805 hover:bg-slate-100"
              }`}
            >
              <span>{tab.name}</span>
              {tab.count !== undefined && (
                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[9px] font-black ${
                  activeTab === tab.id 
                    ? "bg-white/20 text-white" 
                    : "bg-slate-200 text-slate-700"
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search order #, practice name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl text-xs font-semibold glass-input shadow-sm focus:border-brand-burgundy transition-all"
          />
        </div>
      </div>

      {/* Orders List */}
      <div className="glass-panel rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto bg-white">
          {filteredOrders.length === 0 ? (
            <div className="px-6 py-12 text-center text-slate-550 text-xs font-semibold">
              No warehouse orders in this queue.
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <th className="px-6 py-3.5">Order Info</th>
                  <th className="px-6 py-3.5">Doctor & Practice</th>
                  <th className="px-6 py-3.5 text-center">Cases</th>
                  <th className="px-6 py-3.5">Logistics Status</th>
                  <th className="px-6 py-3.5">Tracking details</th>
                  <th className="px-6 py-3.5 text-right">Fulfillment Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/70 hover:shadow-sm transition-all duration-150">
                    <td className="px-6 py-4">
                      <div className="font-black text-slate-900">{order.order_number}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {new Date(order.created_at).toLocaleDateString()} at {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-800 font-bold">{order.doctor_practice}</div>
                      <div className="text-[10px] text-slate-500 font-medium">Dr. {order.doctor_first_name} {order.doctor_last_name}</div>
                    </td>
                    <td className="px-6 py-4 text-center text-slate-900 font-black">
                      {order.total_quantity} cases
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-6 py-4">
                      {order.tracking_number ? (
                        <div className="space-y-0.5 font-semibold text-[10px] text-slate-600">
                          <div><span className="text-slate-400 font-bold">Carrier:</span> {order.shipping_carrier}</div>
                          <div className="font-mono text-[9px]"><span className="text-slate-400 font-bold">Tracking:</span> {order.tracking_number}</div>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">No tracking info</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Quick flow action button */}
                        {order.status === "submitted_warehouse" && (
                          <button
                            onClick={() => handleConfirmOrder(order.id)}
                            className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-lg shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                          >
                            Confirm Order
                          </button>
                        )}
                        {order.status === "confirmed" && (
                          <button
                            onClick={() => handleOpenShipDialog(order)}
                            className="px-2.5 py-1.5 bg-indigo-650 hover:bg-indigo-700 text-white text-[11px] font-bold rounded-lg shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                          >
                            Ship Order
                          </button>
                        )}
                        {order.status === "shipped" && (
                          <button
                            onClick={() => handleStatusUpdate(order.id, "out_for_delivery")}
                            className="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold rounded-lg shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                          >
                            Out for Delivery
                          </button>
                        )}
                        {order.status === "out_for_delivery" && (
                          <button
                            onClick={() => handleStatusUpdate(order.id, "delivered")}
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                          >
                            Mark Delivered
                          </button>
                        )}
                        {order.status === "return_requested" && (
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => handleStatusUpdate(order.id, "return_approved")}
                              className="px-2.5 py-1.5 bg-emerald-605 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                            >
                              Approve Return
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(order.id, "delivered")}
                              className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold rounded-lg shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                        {order.status === "return_approved" && (
                          <button
                            onClick={() => handleStatusUpdate(order.id, "returned")}
                            className="px-2.5 py-1.5 bg-teal-650 hover:bg-teal-700 text-white text-[11px] font-bold rounded-lg shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                          >
                            Confirm Return Received
                          </button>
                        )}

                        <button
                          onClick={() => handleOpenDetails(order)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-slate-700 hover:bg-slate-100 hover:text-slate-900 border border-slate-200 font-bold hover:shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-sm text-[11px]"
                        >
                          <span>Pack List</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Details & Packing Checkoff Drawer/Modal */}
      {detailOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="glass-card rounded-2xl border border-slate-200 p-6 w-full max-w-xl relative overflow-y-auto max-h-[90vh] shadow-2xl flex flex-col text-left">
            <button
              onClick={() => setDetailOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="mb-4 flex items-center gap-2 shrink-0 border-b border-slate-100 pb-3">
              <ClipboardList className="w-5 h-5 text-brand-burgundy" />
              <div>
                <h2 className="text-base font-extrabold text-slate-900">
                  {selectedOrder.return_reason ? "Return Case Verification" : "Fulfillment packing list"}
                </h2>
                <p className="text-[10px] text-slate-500 font-semibold">{selectedOrder.order_number} — {selectedOrder.doctor_practice}</p>
              </div>
            </div>
 
            {modalLoading ? (
              <div className="flex h-32 items-center justify-center shrink-0">
                <Loader2 className="w-6 h-6 text-brand-burgundy animate-spin" />
              </div>
            ) : (
              <div className="space-y-4 overflow-y-auto pr-1 flex-1">
                {/* Return Details */}
                {selectedOrder.return_reason && (
                  <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-200 text-xs text-left">
                    <h4 className="text-[10px] font-bold text-purple-700 uppercase tracking-wider mb-2">Return Information</h4>
                    <div className="space-y-2">
                      <p className="font-bold text-slate-700">Reason: <span className="font-semibold text-slate-600">{selectedOrder.return_reason}</span></p>
                      <p className="font-bold text-slate-700">Description: <span className="font-semibold text-slate-600">{selectedOrder.return_description || "No description provided."}</span></p>
                      {selectedOrder.return_proof_image && (
                        <div>
                          <p className="font-bold text-slate-700 mb-1.5">Proof Image:</p>
                          {(() => {
                            const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace("/api", "");
                            const imgUrl = selectedOrder.return_proof_image.startsWith("http") 
                              ? selectedOrder.return_proof_image 
                              : `${baseUrl}${selectedOrder.return_proof_image}`;
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

                      {/* Return Actions inside the drawer */}
                      {selectedOrder.status === "return_requested" && (
                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={() => handleStatusUpdate(selectedOrder.id, "return_approved")}
                            className="flex-1 px-3 py-2 bg-emerald-650 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-xl shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                          >
                            Approve Return Request
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(selectedOrder.id, "delivered")}
                            className="flex-1 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold rounded-xl shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                          >
                            Reject Return Request
                          </button>
                        </div>
                      )}

                      {selectedOrder.status === "return_approved" && (
                        <div className="pt-2">
                          <button
                            onClick={() => handleStatusUpdate(selectedOrder.id, "returned")}
                            className="w-full px-3 py-2 bg-teal-650 hover:bg-teal-700 text-white text-[11px] font-bold rounded-xl shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                          >
                            Confirm Return Received & Restock
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Shipping info */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1">
                    {selectedOrder.return_reason ? "Return Customer Info" : "Shipping Destination"}
                  </span>
                  <span className="text-slate-800 font-black block">Dr. {selectedOrder.doctor_first_name} {selectedOrder.doctor_last_name}</span>
                  <span className="text-slate-650 block mt-0.5 font-semibold">
                    {selectedOrder.address_line1}
                    {selectedOrder.address_line2 ? `, ${selectedOrder.address_line2}` : ""}
                  </span>
                  <span className="text-slate-650 block font-semibold">{selectedOrder.city}, {selectedOrder.state} {selectedOrder.zip}</span>
                  {selectedOrder.doctor_phone && <span className="text-slate-500 block mt-1 font-medium">Phone: {selectedOrder.doctor_phone}</span>}
                </div>
 
                {/* Packing Checkoff items */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] text-slate-500 font-black uppercase tracking-wider mb-1">
                    <span>Item & Description</span>
                    <span>Quantity</span>
                  </div>
 
                  <div className="space-y-2">
                    {orderItems.map((item) => {
                      const isPacked = !!packedItems[item.id];
                      let parsedImages = [];
                      if (item.product_images) {
                        try {
                          parsedImages = typeof item.product_images === "string" ? JSON.parse(item.product_images) : item.product_images;
                        } catch (e) {}
                      }
                      const firstImg = parsedImages.length > 0 ? parsedImages[0] : null;
 
                      return (
                        <div 
                          key={item.id} 
                          onClick={() => togglePackItem(item.id)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                            isPacked 
                              ? "bg-emerald-50/50 border-emerald-250 opacity-75" 
                              : "bg-white border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {/* Checkbox Icon */}
                            <div className={isPacked ? "text-emerald-600" : "text-slate-400"}>
                              {isPacked ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                            </div>
                            
                            {/* Product Image */}
                            {firstImg ? (
                              <img 
                                src={getImageUrl(firstImg)} 
                                alt={item.product_name_snapshot} 
                                className="w-10 h-10 object-cover rounded-lg border border-slate-200"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center text-slate-400">
                                <Package className="w-5 h-5" />
                              </div>
                            )}
 
                            <div>
                              <div className={`font-bold text-slate-900 ${isPacked ? "line-through text-slate-500" : ""}`}>
                                {item.product_name_snapshot || item.product_name}
                              </div>
                              <div className="text-[10px] text-slate-455 text-slate-450 font-mono mt-0.5">
                                SKU: {item.sku_snapshot} | {item.units_per_case} units/case
                              </div>
                            </div>
                          </div>
 
                          <div className="text-right shrink-0">
                            <span className="px-2.5 py-1 bg-slate-100 rounded-lg text-xs font-black text-slate-800">
                              {item.quantity_cases} cases
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
 
                {/* Packing helper alert */}
                {selectedOrder.return_reason ? (
                  <div className="p-3 bg-purple-50 border border-purple-100 text-purple-700 text-xs font-semibold rounded-xl flex items-start gap-2">
                    <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                    <p>Verify that the physical items received match the returned quantities and item details before confirming restocking.</p>
                  </div>
                ) : (
                  <div className="p-3 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold rounded-xl flex items-start gap-2">
                    <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                    <p>Check off items in the box list as they are verified and placed in the shipment box. Make sure SKU details and case count are correct.</p>
                  </div>
                )}
              </div>
            )}
 
            <div className="pt-3 border-t border-slate-200 mt-6 flex justify-between shrink-0 items-center">
              <div>
                {/* Progress bar */}
                {orderItems.length > 0 && !selectedOrder.return_reason && (
                  <span className="text-[10px] text-slate-500 font-bold">
                    Packed: {Object.values(packedItems).filter(Boolean).length} of {orderItems.length}
                  </span>
                )}
              </div>
              <button
                onClick={() => setDetailOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-300 text-slate-650 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Close packing List
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ship Order Dialog Modal */}
      {shipModalOpen && shippingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="glass-card rounded-2xl border border-slate-200 p-6 w-full max-w-md relative shadow-2xl flex flex-col text-left">
            <button
              onClick={() => setShipModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Truck className="w-5 h-5 text-indigo-650" />
              <div>
                <h2 className="text-base font-extrabold text-slate-900">Ship Order & Add Tracking</h2>
                <p className="text-[10px] text-slate-500 font-semibold">{shippingOrder.order_number}</p>
              </div>
            </div>

            <form onSubmit={handleShipSubmit} className="space-y-4">
              <div>
                <label className="block text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wider">Shipping Carrier</label>
                <select
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl text-xs font-semibold glass-input bg-white cursor-pointer"
                >
                  <option value="FedEx">FedEx Logistics</option>
                  <option value="UPS">UPS Worldwide</option>
                  <option value="DHL">DHL Express</option>
                  <option value="USPS">USPS Priority Mail</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wider">Tracking Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 1Z999AA10123456784"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl text-xs font-semibold glass-input"
                />
              </div>

              <div>
                <label className="block text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wider">Dispatch / Handling Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Box 1 of 2. Left at shipping dock."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl text-xs font-semibold glass-input"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShipModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={shipLoading}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-brand-burgundy hover:bg-brand-burgundy-hover text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
                >
                  {shipLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>Confirm Dispatch</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
