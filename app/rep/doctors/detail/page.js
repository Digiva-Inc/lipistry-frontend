"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { 
  Loader2, 
  ArrowLeft, 
  Edit, 
  ShoppingCart, 
  CreditCard, 
  Calendar, 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  FileSpreadsheet,
  Eye,
  Plus,
  X,
  Lock,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

function DoctorDetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const { token } = useAuthStore();
  
  const [loading, setLoading] = useState(true);
  const [doctor, setDoctor] = useState(null);
  const [cardInfo, setCardInfo] = useState(null);
  const [orders, setOrders] = useState([]);

  // Card update modal
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [cardLoading, setCardLoading] = useState(false);
  const [cardData, setCardData] = useState({
    card_brand: "Visa",
    last4: "",
    exp_month: "12",
    exp_year: new Date().getFullYear().toString()
  });

  // Selected Order Modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetail, setOrderDetail] = useState(null);
  const [orderModalLoading, setOrderModalLoading] = useState(false);
  const [orderModalOpen, setOrderModalOpen] = useState(false);

  async function loadDoctorData() {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/rep/doctors/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (!response.ok) {
        throw new Error("Failed to load doctor details.");
      }

      const result = await response.json();
      setDoctor(result.doctor);
      setCardInfo(result.cardInfo);
      setOrders(result.orders);
    } catch (err) {
      toast.error("Could not retrieve doctor profile.");
      router.push("/rep/doctors");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token && id) {
      loadDoctorData();
    }
  }, [token, id]);

  const handleCardChange = (e) => {
    const { name, value } = e.target;
    setCardData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCardSubmit = async (e) => {
    e.preventDefault();

    if (!/^\d{4}$/.test(cardData.last4)) {
      toast.error("Last 4 digits must be exactly 4 numbers.");
      return;
    }

    setCardLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/rep/doctors/${id}/card`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            card_brand: cardData.card_brand,
            last4: cardData.last4,
            exp_month: parseInt(cardData.exp_month),
            exp_year: parseInt(cardData.exp_year)
          })
        }
      );

      if (!response.ok) {
        throw new Error("Failed to save card on file.");
      }

      toast.success("Card on file updated successfully.");
      setCardModalOpen(false);
      loadDoctorData();
    } catch (err) {
      toast.error(err.message || "Failed to update credit card.");
    } finally {
      setCardLoading(false);
    }
  };

  // Open order details modal
  const handleOpenOrder = async (order) => {
    setSelectedOrder(order);
    setOrderDetail(null);
    setOrderModalLoading(true);
    setOrderModalOpen(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/rep/orders/${order.id}`,
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
      setOrderModalOpen(false);
    } finally {
      setOrderModalLoading(false);
    }
  };

  const verifyPayment = async (orderId) => {
    const toastId = toast.loading("Verifying payment with Stripe...");
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/rep/orders/${orderId}/verify-payment`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (!response.ok) throw new Error("Failed to verify payment");
      
      const result = await response.json();
      if (result.message === 'Order successfully verified and updated.') {
        toast.success("Payment verified successfully!", { id: toastId });
        loadDoctorData(); // Reload doctor details to update the order list
      } else {
        toast.info("Payment has not been completed yet.", { id: toastId });
      }
    } catch (err) {
      toast.error("Could not verify payment.", { id: toastId });
    }
  };

  const formatPrice = (cents) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
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
      case "failed_payment":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-amber-50 text-amber-700 border-amber-200";
    }
  };

  const formatStatus = (status) => {
    if (status === 'return_approved') return 'RETURN APPROVED';
    if (status === 'returned') return 'RETURNED TO WAREHOUSE';
    if (status === 'refunded') return 'AMOUNT REFUNDED';
    if (status === 'submitted_warehouse') return 'PAYMENT SUCCESSFUL';
    if (status === 'pending_payment') return 'AWAITING PAYMENT';
    return status ? status.replace(/_/g, ' ').toUpperCase() : "";
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-brand-burgundy animate-spin" />
          <p className="text-slate-550 text-xs font-bold tracking-wider">Loading practice detail...</p>
        </div>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <p className="text-slate-550 text-xs font-bold tracking-wider">Practice not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn text-left">
      {/* Back button */}
      <div className="flex items-center gap-2">
        <Link
          href="/rep/doctors"
          className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-brand-burgundy transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Directory</span>
        </Link>
      </div>

      {/* Main Profile Header Card */}
      <div className="glass-panel p-6 rounded-2xl border border-[#ebdfe1] bg-white shadow-sm flex flex-col md:flex-row justify-between items-start gap-4">
        <div className="space-y-4">
          <div>
            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold border bg-brand-burgundy-light text-brand-burgundy border-brand-burgundy/10 uppercase tracking-wider">
              Practice Account
            </span>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 mt-2">{doctor.practice_name}</h1>
            <p className="text-slate-700 font-bold text-xs mt-0.5">Dr. {doctor.doctor_first_name} {doctor.doctor_last_name}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            <div className="flex items-center gap-2 text-slate-650 text-xs font-semibold">
              <Mail className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{doctor.email}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-650 text-xs font-semibold">
              <Phone className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{doctor.phone}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-650 text-xs font-semibold">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{doctor.city}, {doctor.state} {doctor.zip}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 w-full md:w-auto shrink-0">
          <Link
            href={`/rep/doctors/edit?id=${doctor.id}`}
            className="flex-1 md:flex-initial inline-flex justify-center items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-sm transition-all"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Edit Profile</span>
          </Link>
          <Link
            href={`/rep/orders/new/build?doctorId=${doctor.id}`}
            className="flex-1 md:flex-initial inline-flex justify-center items-center gap-1.5 px-4 py-2.5 bg-brand-burgundy hover:bg-brand-burgundy-hover text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-[0.98]"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Place Order</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Address & Details */}
        <div className="md:col-span-1 space-y-6">
          {/* Shipping Coordinates */}
          <div className="glass-panel p-5 rounded-2xl border border-[#ebdfe1] bg-white shadow-sm space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-brand-burgundy border-b border-[#ebdfe1]/50 pb-1.5 flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              <span>Clinic Location</span>
            </h3>
            <p className="text-xs font-bold text-slate-700">{doctor.address_line1}</p>
            {doctor.address_line2 && <p className="text-xs font-bold text-slate-500">{doctor.address_line2}</p>}
            <p className="text-xs font-bold text-slate-700">{doctor.city}, {doctor.state} {doctor.zip}</p>
          </div>



          {/* Internal Notes */}
          <div className="glass-panel p-5 rounded-2xl border border-[#ebdfe1] bg-white shadow-sm space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-brand-burgundy border-b border-[#ebdfe1]/50 pb-1.5 flex items-center gap-1.5">
              <span>Internal Comments</span>
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed font-semibold">
              {doctor.notes || "No workspace comments or special discount notes added."}
            </p>
          </div>
        </div>

        {/* Right Column: Order History list */}
        <div className="md:col-span-2 glass-panel p-5 rounded-2xl border border-[#ebdfe1] bg-white shadow-sm space-y-4 flex flex-col min-h-[350px]">
          <div className="flex items-center gap-2 border-b border-[#ebdfe1]/50 pb-2.5 shrink-0">
            <ShoppingCart className="w-4.5 h-4.5 text-brand-burgundy" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">Practice Order History</h3>
          </div>

          <div className="flex-1 overflow-x-auto">
            {orders.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400 font-semibold py-12">
                No orders registered under this practice.
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#fbf7f8] text-slate-550 font-bold border-b border-[#ebdfe1]">
                    <th className="px-4 py-2.5">Order</th>
                    <th className="px-4 py-2.5">Total Charged</th>
                    <th className="px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5">Date</th>
                    <th className="px-4 py-2.5 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ebdfe1]/30">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-bold text-slate-800">{o.order_number}</td>
                      <td className="px-4 py-3 font-extrabold text-slate-800">{formatPrice(o.total_cents)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-[8px] font-extrabold border ${getStatusColor(o.status)}`}>
                            {formatStatus(o.status)}
                          </span>
                          {o.status === "pending_payment" && (
                            <button
                              onClick={() => verifyPayment(o.id)}
                              title="Verify Payment"
                              className="p-1 rounded-full text-slate-400 hover:text-brand-burgundy hover:bg-brand-burgundy-light transition-colors cursor-pointer"
                            >
                              <RefreshCw className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-550 font-semibold">
                        {new Date(o.created_at).toLocaleDateString("en-IN", {
                          month: "short",
                          day: "numeric",
                          year: "numeric"
                        })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleOpenOrder(o)}
                          className="inline-flex items-center gap-0.5 px-2 py-1 rounded-lg border border-slate-200 hover:bg-brand-burgundy-light text-slate-650 hover:text-brand-burgundy transition-all font-bold cursor-pointer"
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
        </div>
      </div>



      {/* Order Details Modal */}
      {orderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="glass-card rounded-2xl border border-[#ebdfe1] p-6 w-full max-w-2xl relative overflow-hidden flex flex-col max-h-[90vh] shadow-2xl">
            <button
              onClick={() => setOrderModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="mb-5 flex items-center gap-2 shrink-0">
              <FileSpreadsheet className="w-5 h-5 text-brand-burgundy" />
              <h2 className="text-base font-extrabold text-slate-900">Order Details: {selectedOrder?.order_number}</h2>
            </div>

            {orderModalLoading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 flex-1">
                <Loader2 className="w-8 h-8 text-brand-burgundy animate-spin" />
                <span className="text-slate-505 text-xs font-bold">Fetching line items...</span>
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
                  </div>

                  {/* Doctor Info */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-[#ebdfe1]">
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Doctor Practice</span>
                    <div className="text-xs font-bold text-slate-805">{orderDetail.order.doctor_practice}</div>
                    <div className="text-[10px] text-slate-500 font-semibold">Dr. {orderDetail.order.doctor_first_name} {orderDetail.order.doctor_last_name}</div>
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
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Itemized Line Items</h4>
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
                <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-[#ebdfe1] font-extrabold">
                  <span className="text-slate-550 text-xs uppercase tracking-wider">Total Stripe Charged</span>
                  <span className="text-brand-burgundy text-lg tracking-tight">{formatPrice(orderDetail.order.total_cents)}</span>
                </div>
              </div>
            ) : null}
            
            <div className="pt-3 border-t border-[#ebdfe1] mt-auto flex justify-end shrink-0">
              <button
                onClick={() => setOrderModalOpen(false)}
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

export default function DoctorDetail() {
  return (
    <Suspense fallback={
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-brand-burgundy animate-spin" />
          <p className="text-slate-550 text-xs font-bold tracking-wider">Loading practice detail...</p>
        </div>
      </div>
    }>
      <DoctorDetailContent />
    </Suspense>
  );
}
