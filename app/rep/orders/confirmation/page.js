"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { 
  Loader2, 
  CheckCircle2, 
  Printer, 
  Home, 
  PlusCircle,
  FileSpreadsheet,
  Building2,
  ShoppingBag
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

function OrderConfirmationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
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
          throw new Error("Failed to load order confirmation details.");
        }

        const data = await response.json();
        setOrderDetail(data);
      } catch (err) {
        toast.error("Failed to load order receipt.");
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

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-brand-burgundy animate-spin" />
          <p className="text-slate-550 text-xs font-bold tracking-wider">Syncing confirmation details...</p>
        </div>
      </div>
    );
  }

  if (!orderDetail) {
    return (
      <div className="max-w-md mx-auto py-12 text-center text-slate-500 font-semibold text-xs">
        Confirmation receipt details could not be found.
      </div>
    );
  }

  const { order, items } = orderDetail;

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn text-left print:p-0 print:max-w-full">
      {/* Visual Header Success Badge */}
      <div className="glass-panel p-6 rounded-2xl border border-[#ebdfe1] bg-white shadow-sm flex flex-col items-center text-center space-y-3 print:border-none print:shadow-none">
        <div className="w-12 h-12 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-6 h-6 text-emerald-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Order Placed Successfully!</h1>
          <p className="text-slate-500 text-xs font-semibold mt-1">Stripe transaction completed. Order queued for Shopify wholesale warehouse fulfillment.</p>
        </div>
      </div>

      {/* Invoice receipt print body */}
      <div className="glass-panel p-6 rounded-2xl border border-[#ebdfe1] bg-white shadow-sm space-y-6 print:border-none print:shadow-none">
        {/* Top Info Grid */}
        <div className="grid grid-cols-2 gap-4 border-b border-[#ebdfe1]/50 pb-4">
          <div>
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Order Number</span>
            <span className="text-xs font-extrabold text-slate-900">{order.order_number}</span>
          </div>
          <div className="text-right">
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Order Date</span>
            <span className="text-xs font-bold text-slate-700">
              {new Date(order.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
              })}
            </span>
          </div>
        </div>

        {/* Doctor and Shopify warehouse */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <h4 className="text-[10px] font-bold text-slate-505 uppercase tracking-wider">Practice Client</h4>
            <div className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-brand-burgundy shrink-0" />
              <span>{order.doctor_practice}</span>
            </div>
            <div className="text-[10px] text-slate-650 font-bold">Dr. {order.doctor_first_name} {order.doctor_last_name}</div>
          </div>
          <div className="space-y-1">
            <h4 className="text-[10px] font-bold text-slate-505 uppercase tracking-wider">Shopify Fulfillment</h4>
            <div className="p-2 bg-brand-burgundy-light/35 border border-brand-burgundy/10 rounded-xl">
              <p className="text-[10px] font-bold text-brand-burgundy">Status: QUEUED FOR SHIPMENT</p>
              <p className="text-[9px] font-mono text-slate-505 font-bold mt-0.5">Reference: {order.shopify_order_number || "SH_Pending"}</p>
            </div>
          </div>
        </div>

        {/* Item list */}
        <div className="space-y-3">
          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <FileSpreadsheet className="w-4 h-4 text-brand-burgundy" />
            <span>Items Ordered</span>
          </h4>
          
          <div className="border border-[#ebdfe1] rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-505 font-bold border-b border-[#ebdfe1]">
                  <th className="px-3 py-2">Product</th>
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
                              className="w-8 h-8 object-cover rounded-lg border border-slate-200 shrink-0 shadow-sm print:hidden" 
                            />
                          ) : (
                            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200 text-slate-400 shrink-0 print:hidden">
                              <ShoppingBag className="w-4.5 h-4.5" />
                            </div>
                          );
                        })()}
                        <span>{item.product_name || "Product"}</span>
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

        {/* Total breakdown */}
        <div className="border-t border-[#ebdfe1]/50 pt-4 flex justify-between items-center">
          <span className="text-xs font-bold text-slate-550">Stripe Charged Total</span>
          <span className="text-brand-burgundy font-black text-base">{formatPrice(order.total_cents)}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-end print:hidden">
        <button
          onClick={() => window.print()}
          className="inline-flex justify-center items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>Print Receipt</span>
        </button>
        <Link
          href="/rep/dashboard"
          className="inline-flex justify-center items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-750 text-xs font-bold rounded-xl shadow-sm transition-all"
        >
          <Home className="w-4 h-4" />
          <span>Go to Dashboard</span>
        </Link>
        <Link
          href="/rep/orders/new"
          className="inline-flex justify-center items-center gap-1.5 px-4 py-2.5 bg-brand-burgundy hover:bg-brand-burgundy-hover text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-[0.98]"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Place Another Order</span>
        </Link>
      </div>
    </div>
  );
}

export default function OrderConfirmation() {
  return (
    <Suspense fallback={
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-brand-burgundy animate-spin" />
          <p className="text-slate-550 text-xs font-bold tracking-wider">Syncing confirmation details...</p>
        </div>
      </div>
    }>
      <OrderConfirmationContent />
    </Suspense>
  );
}
