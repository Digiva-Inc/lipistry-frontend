"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { 
  Loader2, 
  ArrowLeft, 
  CheckCircle,
  FileText,
  Truck,
  HelpCircle,
  ShoppingBag
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";



function CheckoutForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const doctorId = searchParams.get("doctorId");
  const { token } = useAuthStore();

  const [pageLoading, setPageLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);

  const [doctor, setDoctor] = useState(null);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState({});

  useEffect(() => {
    async function loadData() {
      try {
        // Restore cart from local storage
        const stored = localStorage.getItem("lipistry_pending_order");
        if (!stored) {
          throw new Error("No pending order draft found.");
        }
        const parsed = JSON.parse(stored);
        if (parsed.doctorId !== doctorId) {
          throw new Error("Doctor mismatch in pending draft.");
        }
        setCart(parsed.cart || {});

        // Fetch Doctor details
        const docRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/rep/doctors/${doctorId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!docRes.ok) throw new Error("Doctor profile not found.");
        const docData = await docRes.json();
        setDoctor(docData.doctor);

        // Fetch products
        const prodRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/rep/products`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!prodRes.ok) throw new Error("Catalog load failed.");
        const prodData = await prodRes.json();
        setProducts(prodData);
      } catch (err) {
        toast.error(err.message || "Failed to load checkout draft.");
        router.push(`/rep/orders/new/build?doctorId=${doctorId}`);
      } finally {
        setPageLoading(false);
      }
    }

    if (token && doctorId) {
      loadData();
    }
  }, [token, doctorId]);

  const cartItems = Object.entries(cart)
    .map(([productId, qty]) => {
      const product = products.find((p) => p.id === productId);
      return {
        product,
        quantity: qty,
        total: product ? product.case_price * qty : 0
      };
    })
    .filter((item) => item.product !== undefined);

  const orderTotal = cartItems.reduce((acc, curr) => acc + curr.total, 0);

  const handlePlaceOrder = async () => {
    setSubmitLoading(true);

    try {
      // 1. Submit order payload to backend
      const orderResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/rep/orders`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            doctor_id: doctorId,
            items: cartItems.map((item) => ({
              product_id: item.product.id,
              quantity: item.quantity
            }))
          })
        }
      );

      const result = await orderResponse.json();

      if (!orderResponse.ok) {
        throw new Error(result.error || "Failed to process order.");
      }

      // Clean local storage draft upon success
      localStorage.removeItem("lipistry_pending_order");

      toast.success("Order drafted successfully. Redirecting to payment...");
      // Redirect to Payment screen
      router.push(`/rep/orders/pay?id=${result.order_id}`);
    } catch (err) {
      toast.error(err.message || "Failed to place order.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const formatPrice = (cents) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR"
    }).format(cents / 100);
  };

  if (pageLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-brand-burgundy animate-spin" />
          <p className="text-slate-555 text-xs font-bold tracking-wider">Verifying checkout draft...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn text-left">
      {/* Navigation */}
      <div>
        <Link
          href={`/rep/orders/new/build?doctorId=${doctorId}`}
          className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-brand-burgundy transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Edit Order</span>
        </Link>
      </div>

      {/* Header */}
      <div>
        <span className="text-[9px] font-black text-brand-burgundy bg-brand-burgundy-light px-2.5 py-0.5 rounded-full border border-brand-burgundy/10 uppercase tracking-wider">
          Step 3 of 3
        </span>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 mt-2">Review & Payment</h1>
        <p className="text-slate-505 text-xs mt-1 font-semibold">Inspect your wholesale items and confirm payment terms for {doctor.practice_name}.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Details Panel */}
        <div className="md:col-span-2 space-y-6">
          {/* Order Summary table */}
          <div className="glass-panel p-5 rounded-2xl border border-[#ebdfe1] bg-white shadow-sm space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-brand-burgundy border-b border-[#ebdfe1]/50 pb-1.5 flex items-center gap-1.5">
              <FileText className="w-4.5 h-4.5" />
              <span>Order Summary</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold border-b border-[#ebdfe1]">
                    <th className="px-3 py-2">Product</th>
                    <th className="px-3 py-2 text-center">Cases</th>
                    <th className="px-3 py-2 text-right">Price</th>
                    <th className="px-3 py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ebdfe1]/30">
                  {cartItems.map((item) => (
                    <tr key={item.product.id}>
                      <td className="px-3 py-2.5 font-bold text-slate-800">
                        <div className="flex items-center gap-2">
                          {(() => {
                            let firstImg = null;
                            if (item.product?.images) {
                              try {
                                const parsed = typeof item.product.images === "string" ? JSON.parse(item.product.images) : item.product.images;
                                if (Array.isArray(parsed) && parsed.length > 0) {
                                  firstImg = parsed[0];
                                }
                              } catch (e) {}
                            }
                            const baseUrl = (process.env.NEXT_PUBLIC_API_URL).replace("/api", "");
                            const imgUrl = firstImg ? (firstImg.startsWith("http") ? firstImg : `${baseUrl}${firstImg}`) : null;

                            return imgUrl ? (
                              <img 
                                src={imgUrl} 
                                alt={item.product.name} 
                                className="w-8 h-8 object-cover rounded-lg border border-slate-200 shrink-0 shadow-sm" 
                              />
                            ) : (
                              <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200 text-slate-400 shrink-0">
                                <ShoppingBag className="w-4.5 h-4.5" />
                              </div>
                            );
                          })()}
                          <span>{item.product.name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-center text-slate-900 font-extrabold">{item.quantity}</td>
                      <td className="px-3 py-2.5 text-right text-slate-700 font-bold">{formatPrice(item.product.case_price)}</td>
                      <td className="px-3 py-2.5 text-right text-slate-900 font-extrabold">{formatPrice(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Fulfillment Info */}
          <div className="glass-panel p-5 rounded-2xl border border-[#ebdfe1] bg-white shadow-sm space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-brand-burgundy border-b border-[#ebdfe1]/50 pb-1.5 flex items-center gap-1.5">
              <Truck className="w-4.5 h-4.5" />
              <span>Fulfillment Terms</span>
            </h3>
            
            <div className="flex gap-3 items-start p-3 bg-[#fbf7f8] rounded-xl border border-[#ebdfe1] text-xs leading-relaxed font-semibold">
              <HelpCircle className="w-5 h-5 text-brand-burgundy shrink-0 mt-0.5" />
              <div>
                <p className="text-slate-800 font-bold">Ship from Warehouse</p>
                <p className="text-slate-500 text-[10px] mt-0.5">Order will be submitted automatically to Lipistry wholesale backend for dispatch.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Summary & Action */}
        <div className="space-y-6">
          <div className="glass-panel p-5 rounded-2xl border border-[#ebdfe1] bg-white shadow-sm space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-brand-burgundy border-b border-[#ebdfe1]/50 pb-1.5 flex items-center gap-1.5">
              <CheckCircle className="w-4.5 h-4.5" />
              <span>Confirm & Pay</span>
            </h3>

            {/* Total breakdown */}
            <div className="pt-2 flex justify-between items-center text-xs font-black">
              <span className="text-slate-550">Order Total</span>
              <span className="text-brand-burgundy text-base tracking-tight">{formatPrice(orderTotal)}</span>
            </div>

            <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
              * Click to safely save order details and proceed to the secure payment screen.
            </p>

            {/* Checkout action */}
            <button
              onClick={handlePlaceOrder}
              disabled={submitLoading || orderTotal === 0}
              className="w-full py-3 bg-brand-burgundy hover:bg-brand-burgundy-hover text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              <span>Confirm & Proceed to Payment</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrderReviewStep() {
  return (
    <Suspense fallback={
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-brand-burgundy animate-spin" />
          <p className="text-slate-555 text-xs font-bold tracking-wider">Verifying checkout draft...</p>
        </div>
      </div>
    }>
      <CheckoutForm />
    </Suspense>
  );
}
