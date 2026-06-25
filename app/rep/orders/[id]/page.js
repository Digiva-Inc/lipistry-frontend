"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { 
  Loader2, 
  ArrowLeft, 
  FileSpreadsheet, 
  Building2, 
  MapPin, 
  Calendar,
  CreditCard,
  Mail,
  Phone,
  ShoppingBag,
  Package,
  Truck,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Clock,
  Sparkles,
  Check
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function OrderDetail() {
  const router = useRouter();
  const { id } = useParams();
  const { token } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [orderDetail, setOrderDetail] = useState(null);

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

  // Return Modal states
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returnReason, setReturnReason] = useState("Damaged Goods");
  const [returnDesc, setReturnDesc] = useState("");
  const [proofFile, setProofFile] = useState(null);
  const [submittingReturn, setSubmittingReturn] = useState(false);

  useEffect(() => {
    async function loadOrder() {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/rep/orders/${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!response.ok) {
          throw new Error("Failed to load order detail.");
        }

        const data = await response.json();
        setOrderDetail(data);
      } catch (err) {
        toast.error("Failed to load order details.");
        router.push("/rep/orders");
      } finally {
        setLoading(false);
      }
    }

    if (token && id) {
      loadOrder();
    }
  }, [token, id]);

  const formatPrice = (cents) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD"
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
    if (status === "return_approved") return "RETURN APPROVED";
    if (status === "returned") return "RETURNED TO WAREHOUSE";
    if (status === "refunded") return "AMOUNT REFUNDED";
    return status.replace(/_/g, " ").toUpperCase();
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setProofFile(e.target.files[0]);
    }
  };

  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    if (!proofFile) {
      toast.error("Please upload a proof of image.");
      return;
    }

    setSubmittingReturn(true);
    try {
      const formData = new FormData();
      formData.append("reason", returnReason);
      formData.append("description", returnDesc);
      formData.append("file", proofFile);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/rep/orders/${id}/return`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: formData
        }
      );

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to submit return request.");
      }

      toast.success("Return request submitted successfully!");
      setReturnModalOpen(false);

      // Reload order details
      const detailRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/rep/orders/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (detailRes.ok) {
        const data = await detailRes.json();
        setOrderDetail(data);
      }
    } catch (err) {
      toast.error(err.message || "Failed to submit return.");
    } finally {
      setSubmittingReturn(false);
    }
  };

  const formatFullDateTime = (ts) => {
    if (!ts) return "";
    const d = new Date(ts);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    }) + " at " + d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    });
  };

  const getTimelineSteps = () => {
    if (!orderDetail || !orderDetail.order) return [];
    const { order } = orderDetail;
    const steps = [];
    
    // Step 1: Placed
    steps.push({
      key: "paid",
      title: "Order Placed & Paid",
      description: "Wholesale order successfully created and Stripe payment authorization completed.",
      timestamp: order.created_at,
      isActive: true,
      icon: CreditCard,
    });

    // Step 2: Submitted to Warehouse
    const submittedActive = ["submitted_warehouse", "confirmed", "shipped", "out_for_delivery", "delivered", "return_requested", "returned"].includes(order.status);
    steps.push({
      key: "submitted_warehouse",
      title: "Submitted to Warehouse",
      description: "Order details pushed to the wholesale fulfillment department.",
      timestamp: order.status === "submitted_warehouse" 
        ? (order.updated_at || order.created_at)
        : (submittedActive ? new Date(new Date(order.created_at).getTime() + 15 * 60 * 1000) : null),
      isActive: submittedActive,
      icon: Building2,
    });

    // Step 3: Confirmed
    const confirmedActive = ["confirmed", "shipped", "out_for_delivery", "delivered", "return_requested", "returned"].includes(order.status);
    steps.push({
      key: "confirmed",
      title: "Order Confirmed",
      description: "Warehouse staff confirmed stock availability and prepared the items.",
      timestamp: order.status === "confirmed"
        ? (order.updated_at || order.created_at)
        : (confirmedActive ? new Date(new Date(order.created_at).getTime() + 45 * 60 * 1000) : null),
      isActive: confirmedActive,
      icon: FileSpreadsheet,
    });

    // Step 4: Shipped
    const shippedActive = ["shipped", "out_for_delivery", "delivered", "return_requested", "returned"].includes(order.status);
    steps.push({
      key: "shipped",
      title: "Shipped",
      description: order.shipping_carrier && order.tracking_number
        ? `Package handed over to carrier: ${order.shipping_carrier} (Tracking: ${order.tracking_number})`
        : "Package handed over to shipping carrier.",
      timestamp: order.shipped_at,
      isActive: shippedActive,
      icon: Truck,
    });

    // Step 5: Out for Delivery
    const outActive = ["out_for_delivery", "delivered", "return_requested", "returned"].includes(order.status);
    steps.push({
      key: "out_for_delivery",
      title: "Out for Delivery",
      description: "Package is with the local courier for final stretch delivery.",
      timestamp: order.status === "out_for_delivery"
        ? (order.updated_at || order.shipped_at)
        : (outActive && order.shipped_at ? new Date(new Date(order.shipped_at).getTime() + 3 * 60 * 60 * 1000) : null),
      isActive: outActive,
      icon: Truck,
    });

    // Step 6: Delivered
    const deliveredActive = ["delivered", "return_requested", "returned"].includes(order.status);
    steps.push({
      key: "delivered",
      title: "Delivered",
      description: "Wholesale order delivered successfully to the practice shipping address.",
      timestamp: order.delivered_at,
      isActive: deliveredActive,
      icon: CheckCircle2,
    });

    // Step 7: Return Requested (Conditional)
    if (order.return_reason || ["return_requested", "return_approved", "returned", "refunded"].includes(order.status)) {
      const retReqActive = ["return_requested", "return_approved", "returned", "refunded"].includes(order.status);
      steps.push({
        key: "return_requested",
        title: "Return Requested",
        description: `Return claim submitted: "${order.return_reason || 'Unknown reason'}"`,
        timestamp: order.return_requested_at || order.updated_at,
        isActive: retReqActive,
        icon: RefreshCw,
      });
    }

    // Step 8: Return Approved (Conditional)
    if (["return_approved", "returned", "refunded"].includes(order.status)) {
      const retAppActive = ["return_approved", "returned", "refunded"].includes(order.status);
      steps.push({
        key: "return_approved",
        title: "Return Approved",
        description: "Return request approved. Awaiting product pick up by warehouse.",
        timestamp: order.updated_at,
        isActive: retAppActive,
        icon: FileSpreadsheet,
      });
    }

    // Step 9: Returned to Warehouse (Conditional)
    if (["returned", "refunded"].includes(order.status)) {
      const returnedActive = ["returned", "refunded"].includes(order.status);
      steps.push({
        key: "returned",
        title: "Returned to Warehouse",
        description: "Products physically received and restocked by warehouse staff.",
        timestamp: order.return_processed_at || order.updated_at,
        isActive: returnedActive,
        icon: Package,
      });
    }

    // Step 10: Refunded (Conditional)
    if (order.status === "refunded") {
      steps.push({
        key: "refunded",
        title: "Refund Processed",
        description: `Refund successfully processed via Stripe.`,
        timestamp: order.updated_at,
        isActive: true,
        icon: Sparkles,
      });
    }

    // Special case: Cancelled (Conditional)
    if (order.status === "cancelled") {
      steps.push({
        key: "cancelled",
        title: "Order Cancelled",
        description: "This order was cancelled and voided.",
        timestamp: order.updated_at || order.created_at,
        isActive: true,
        isCancelled: true,
        icon: XCircle,
      });
    }

    return steps;
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-brand-burgundy animate-spin" />
          <p className="text-slate-550 text-xs font-bold tracking-wider">Syncing order details...</p>
        </div>
      </div>
    );
  }

  if (!orderDetail) {
    return (
      <div className="max-w-md mx-auto py-12 text-center text-slate-550 font-bold text-xs">
        Order not found.
      </div>
    );
  }

  const { order, items } = orderDetail;

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fadeIn text-left">
      {/* Back button */}
      <div>
        <Link
          href="/rep/orders"
          className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-brand-burgundy transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Order Log</span>
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-[#ebdfe1] shadow-sm">
        <div className="space-y-1">
          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold border ${getStatusColor(order.status)}`}>
            {formatStatus(order.status)}
          </span>
          <h1 className="text-lg font-bold text-slate-900 mt-2">Order {order.order_number}</h1>
          <div className="flex items-center gap-1 text-slate-500 text-xs font-semibold">
            <Calendar className="w-4.5 h-4.5 text-slate-400 shrink-0" />
            <span>
              {new Date(order.created_at).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric"
              })}
            </span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Total Stripe Charged</span>
          <span className="text-brand-burgundy text-lg font-black">{formatPrice(order.total_cents)}</span>
        </div>
      </div>

      {/* Grid Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left main info */}
        <div className="md:col-span-2 space-y-6">
          {/* Order items list */}
          <div className="glass-panel p-5 rounded-2xl border border-[#ebdfe1] bg-white shadow-sm space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-brand-burgundy border-b border-[#ebdfe1]/50 pb-1.5 flex items-center gap-1.5">
              <FileSpreadsheet className="w-4.5 h-4.5" />
              <span>Line Item Breakdown</span>
            </h3>

            <div className="border border-[#ebdfe1] rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold border-b border-[#ebdfe1]">
                    <th className="px-3 py-2">Product Name</th>
                    <th className="px-3 py-2 text-center">Cases</th>
                    <th className="px-3 py-2 text-right">Price</th>
                    <th className="px-3 py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ebdfe1]/30">
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-3 py-2.5 font-bold text-slate-800">
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
                      <td className="px-3 py-2.5 text-center text-slate-900 font-extrabold">{item.quantity_cases}</td>
                      <td className="px-3 py-2.5 text-right text-slate-700 font-bold">{formatPrice(item.case_price_snapshot)}</td>
                      <td className="px-3 py-2.5 text-right text-slate-900 font-extrabold">{formatPrice(item.case_price_snapshot * item.quantity_cases)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Order Timeline */}
          <div className="glass-panel p-5 rounded-2xl border border-[#ebdfe1] bg-white shadow-sm space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-brand-burgundy border-b border-[#ebdfe1]/50 pb-1.5 flex items-center gap-1.5">
              <Clock className="w-4.5 h-4.5" />
              <span>Order Journey & History</span>
            </h3>
            
            <div className="relative pl-8 ml-3 mt-4 space-y-6">
              {/* Vertical line connecting steps */}
              <div className="absolute top-2 bottom-2 left-[11px] w-0.5 bg-[#ebdfe1]" />
              
              {getTimelineSteps().map((step, idx) => {
                const StepIcon = step.icon || Check;
                const isCancelledStep = step.isCancelled;
                
                return (
                  <div key={idx} className="relative flex items-start gap-4 animate-fadeIn">
                    {/* Circle icon */}
                    <div 
                      className={`absolute left-[-29px] top-0.5 w-6 h-6 rounded-full flex items-center justify-center border-2 z-10 transition-all duration-300 ${
                        step.isActive 
                          ? isCancelledStep
                            ? "bg-rose-50 border-rose-400 text-rose-600"
                            : "bg-emerald-500 border-emerald-500 text-white" 
                          : "bg-white border-slate-200 text-slate-350"
                      }`}
                    >
                      <StepIcon className="w-3.5 h-3.5 stroke-[2.5]" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                        <h4 className={`text-xs font-extrabold ${step.isActive ? "text-slate-900" : "text-slate-400"}`}>
                          {step.title}
                        </h4>
                        {step.timestamp && (
                          <span className="text-[10px] text-slate-400 font-bold bg-slate-50 border border-slate-100 px-1.5 py-0.2 rounded-full">
                            {formatFullDateTime(step.timestamp)}
                          </span>
                        )}
                      </div>
                      <p className={`text-xs ${step.isActive ? "text-slate-600 font-medium" : "text-slate-350 font-medium"}`}>
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right billing and fulfillment coordinates */}
        <div className="space-y-6">
          {/* Return Policy & Actions */}
          <div className="glass-panel p-5 rounded-2xl border border-[#ebdfe1] bg-white shadow-sm space-y-3 text-xs">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-brand-burgundy border-b border-[#ebdfe1]/50 pb-1.5 flex items-center gap-1.5">
              <CreditCard className="w-4 h-4" />
              <span>Returns & Policy</span>
            </h3>
            {(() => {
              const referenceDate = order.delivered_at ? new Date(order.delivered_at) : new Date(order.created_at);
              const diffTime = Math.abs(new Date() - referenceDate);
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              const eligible = order.status === 'delivered' && diffDays <= 7;

              if (order.status === 'returned') {
                return (
                  <div className="space-y-2.5">
                    <div className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border inline-block ${getStatusColor(order.status)}`}>
                      {formatStatus(order.status)}
                    </div>
                    {order.return_reason && (
                      <>
                        <p className="font-bold text-slate-700">Reason: <span className="font-semibold text-slate-600">{order.return_reason}</span></p>
                        <p className="font-bold text-slate-700">Description: <span className="font-semibold text-slate-600">{order.return_description}</span></p>
                      </>
                    )}
                    {order.return_requested_at && (
                      <p className="font-bold text-slate-700">Requested: <span className="font-semibold text-slate-600">{new Date(order.return_requested_at).toLocaleDateString()}</span></p>
                    )}
                    {order.return_processed_at && (
                      <p className="font-bold text-slate-700">Processed: <span className="font-semibold text-slate-600">{new Date(order.return_processed_at).toLocaleDateString()}</span></p>
                    )}
                    {order.return_proof_image && (
                      <div>
                        <p className="font-bold text-slate-700 mb-1">Proof Image:</p>
                        {(() => {
                          const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace("/api", "");
                          const imgUrl = order.return_proof_image.startsWith("http") 
                            ? order.return_proof_image 
                            : `${baseUrl}${order.return_proof_image}`;
                          return (
                            <a href={imgUrl} target="_blank" rel="noopener noreferrer" className="inline-block">
                              <img 
                                src={imgUrl} 
                                alt="Return Proof" 
                                className="w-full max-w-[150px] h-24 object-cover rounded-xl border border-purple-200 shadow-sm" 
                              />
                            </a>
                          );
                        })()}
                      </div>
                    )}

                    <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 font-semibold space-y-1 text-left">
                      <p className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wide">💰 Refund Confirmed</p>
                      <p className="text-[11px]">
                        Refund of {formatPrice(order.total_cents)} has been credited back to:
                      </p>
                      <p className="text-xs font-extrabold text-slate-800 bg-white/70 px-2 py-1 rounded border border-emerald-100 mt-1 inline-block">
                        {getRefundCardDetails(order.stripe_customer_id) || "Stripe Card on File"}
                      </p>
                      <p className="text-[9px] font-mono text-emerald-750 mt-1">Ref ID: {order.stripe_charge_id || "ch_mock_refund"}</p>
                    </div>
                  </div>
                );
              }

              if (order.return_reason) {
                return (
                  <div className="space-y-2.5">
                    <div className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border inline-block ${getStatusColor(order.status)}`}>
                      {formatStatus(order.status)}
                    </div>
                    <p className="font-bold text-slate-700">Reason: <span className="font-semibold text-slate-600">{order.return_reason}</span></p>
                    <p className="font-bold text-slate-700">Description: <span className="font-semibold text-slate-600">{order.return_description}</span></p>
                    {order.return_requested_at && (
                      <p className="font-bold text-slate-700">Requested: <span className="font-semibold text-slate-600">{new Date(order.return_requested_at).toLocaleDateString()}</span></p>
                    )}
                    {order.return_processed_at && (
                      <p className="font-bold text-slate-700">Processed: <span className="font-semibold text-slate-600">{new Date(order.return_processed_at).toLocaleDateString()}</span></p>
                    )}
                    {order.return_proof_image && (
                      <div>
                        <p className="font-bold text-slate-700 mb-1">Proof Image:</p>
                        {(() => {
                          const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace("/api", "");
                          const imgUrl = order.return_proof_image.startsWith("http") 
                            ? order.return_proof_image 
                            : `${baseUrl}${order.return_proof_image}`;
                          return (
                            <a href={imgUrl} target="_blank" rel="noopener noreferrer" className="inline-block">
                              <img 
                                src={imgUrl} 
                                alt="Return Proof" 
                                className="w-full max-w-[150px] h-24 object-cover rounded-xl border border-purple-200 shadow-sm" 
                              />
                            </a>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                );
              }

              if (eligible) {
                return (
                  <div className="space-y-3">
                    <p className="text-slate-600 font-semibold leading-relaxed">This order was delivered recently and is eligible for our 7-day return policy. Click below to submit a return request with image proof.</p>
                    <button
                      onClick={() => setReturnModalOpen(true)}
                      className="w-full py-2 bg-brand-burgundy hover:bg-brand-burgundy-dark text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                    >
                      Request Return
                    </button>
                  </div>
                );
              }

              return (
                <p className="text-slate-550 font-semibold italic">
                  {order.status === 'delivered' 
                    ? "Return policy window (7 days from delivery) has expired."
                    : "Returns are only eligible for delivered orders within 7 days."}
                </p>
              );
            })()}
          </div>

          {/* Logistics & Tracking Info */}
          {(order.tracking_number || order.shipping_carrier || order.shipped_at || order.delivered_at) && (
            <div className="glass-panel p-5 rounded-2xl border border-[#ebdfe1] bg-white shadow-sm space-y-3 text-xs">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-brand-burgundy border-b border-[#ebdfe1]/50 pb-1.5 flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-brand-burgundy" />
                <span>Logistics & Tracking</span>
              </h3>
              <div className="space-y-2">
                <p className="font-bold text-slate-700">Carrier: <span className="font-semibold text-slate-600">{order.shipping_carrier || "N/A"}</span></p>
                <p className="font-bold text-slate-700">Tracking Code: <span className="font-semibold text-slate-600 font-mono bg-slate-50 border border-[#ebdfe1] px-1.5 py-0.5 rounded">{order.tracking_number || "N/A"}</span></p>
                {order.tracking_notes && (
                  <p className="font-bold text-slate-750">Notes: <span className="font-semibold text-slate-600">{order.tracking_notes}</span></p>
                )}
              </div>
            </div>
          )}

          {/* Doctor & Delivery Profile */}
          <div className="glass-panel p-5 rounded-2xl border border-[#ebdfe1] bg-white shadow-sm space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-brand-burgundy border-b border-[#ebdfe1]/50 pb-1.5 flex items-center gap-1.5">
              <Building2 className="w-4 h-4" />
              <span>Practice & Delivery Details</span>
            </h3>
            
            {/* Doctor Info */}
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Client Profile</span>
              <p className="text-xs font-bold text-slate-900">{order.doctor_practice}</p>
              <p className="text-[10px] text-slate-550 font-semibold mt-0.5">Dr. {order.doctor_first_name} {order.doctor_last_name}</p>
              
              <div className="pt-2 space-y-1 text-slate-650 text-xs font-semibold">
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{order.doctor_email}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{order.doctor_phone}</span>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="pt-4 border-t border-[#ebdfe1]/50 space-y-1.5">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Shipping Address</span>
              <div className="text-xs text-slate-700 font-semibold leading-relaxed">
                <p>{order.address_line1}</p>
                {order.address_line2 && <p>{order.address_line2}</p>}
                <p>{order.city}, {order.state} {order.zip}</p>
              </div>
            </div>

            {/* Shopify Reference */}
            <div className="pt-4 border-t border-[#ebdfe1]/50 space-y-1.5">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Shopify Reference ID</span>
              <div className="p-2 bg-slate-50 border border-[#ebdfe1] rounded-xl font-mono text-xs text-slate-800 font-semibold inline-block">
                {order.shopify_order_number || "SH_Pending"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Return Form Modal */}
      {returnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="glass-card rounded-2xl border border-slate-200 p-6 w-full max-w-md relative overflow-hidden flex flex-col shadow-2xl bg-white text-left">
            <button
              onClick={() => setReturnModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="mb-4">
              <h2 className="text-base font-extrabold text-slate-900">Request Order Return</h2>
              <p className="text-slate-500 text-xs mt-1 font-semibold">Please select a reason, describe the issue, and upload image proof for verification.</p>
            </div>

            <form onSubmit={handleReturnSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Return Reason</label>
                <select
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs font-semibold glass-input cursor-pointer"
                >
                  <option value="Damaged Goods">Damaged Goods</option>
                  <option value="Incorrect Item">Incorrect Item</option>
                  <option value="Shortage">Shortage</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Detailed Description</label>
                <textarea
                  rows={3}
                  placeholder="Describe why you want to return this product..."
                  value={returnDesc}
                  onChange={(e) => setReturnDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs font-semibold glass-input"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Proof of Return Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-brand-burgundy-light file:text-brand-burgundy hover:file:bg-brand-burgundy-light/80 cursor-pointer"
                  required
                />
                {proofFile && (
                  <p className="text-[10px] text-slate-500 mt-1 font-semibold font-mono">Selected: {proofFile.name}</p>
                )}
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setReturnModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-300 text-slate-650 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReturn}
                  className="px-4 py-2 bg-brand-burgundy hover:bg-brand-burgundy-dark text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {submittingReturn ? "Submitting..." : "Submit Return"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
