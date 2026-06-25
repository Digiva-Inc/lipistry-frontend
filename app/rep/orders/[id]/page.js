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
  Phone
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function OrderDetail() {
  const router = useRouter();
  const { id } = useParams();
  const { token } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [orderDetail, setOrderDetail] = useState(null);

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
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn text-left">
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
                      <td className="px-3 py-2.5 font-bold text-slate-800">{item.product_name || "Unknown Product"}</td>
                      <td className="px-3 py-2.5 text-center text-slate-900 font-extrabold">{item.quantity_cases}</td>
                      <td className="px-3 py-2.5 text-right text-slate-700 font-bold">{formatPrice(item.case_price_snapshot)}</td>
                      <td className="px-3 py-2.5 text-right text-slate-900 font-extrabold">{formatPrice(item.case_price_snapshot * item.quantity_cases)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right billing and fulfillment coordinates */}
        <div className="space-y-6">
          {/* Doctor Info */}
          <div className="glass-panel p-5 rounded-2xl border border-[#ebdfe1] bg-white shadow-sm space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-brand-burgundy border-b border-[#ebdfe1]/50 pb-1.5 flex items-center gap-1.5">
              <Building2 className="w-4 h-4" />
              <span>Client Account</span>
            </h3>
            <div>
              <p className="text-xs font-bold text-slate-900">{order.doctor_practice}</p>
              <p className="text-[10px] text-slate-550 font-semibold mt-0.5">Dr. {order.doctor_first_name} {order.doctor_last_name}</p>
            </div>
            <div className="pt-2 border-t border-[#ebdfe1]/50 space-y-1 text-slate-650 text-xs font-semibold">
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

          {/* Delivery Coordinates */}
          <div className="glass-panel p-5 rounded-2xl border border-[#ebdfe1] bg-white shadow-sm space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-brand-burgundy border-b border-[#ebdfe1]/50 pb-1.5 flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              <span>Shipping Address</span>
            </h3>
            <div className="text-xs text-slate-700 font-semibold leading-relaxed">
              <p>{order.address_line1}</p>
              {order.address_line2 && <p>{order.address_line2}</p>}
              <p>{order.city}, {order.state} {order.zip}</p>
            </div>
          </div>

          {/* Shopify Reference */}
          <div className="glass-panel p-5 rounded-2xl border border-[#ebdfe1] bg-white shadow-sm space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-brand-burgundy border-b border-[#ebdfe1]/50 pb-1.5 flex items-center gap-1.5">
              <CreditCard className="w-4 h-4" />
              <span>Fulfillment Logs</span>
            </h3>
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Shopify Reference ID</div>
            <div className="p-2 bg-slate-50 border border-[#ebdfe1] rounded-xl font-mono text-xs text-slate-800 font-semibold">
              {order.shopify_order_number || "SH_Pending"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
