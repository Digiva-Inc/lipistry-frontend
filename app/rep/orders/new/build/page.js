"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { 
  Loader2, 
  ArrowLeft, 
  ShoppingCart, 
  Plus, 
  Minus,
  Building2,
  ChevronRight,
  ShoppingBag
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

function BuildOrderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const doctorId = searchParams.get("doctorId");
  const { token } = useAuthStore();

  const [pageLoading, setPageLoading] = useState(true);
  const [doctor, setDoctor] = useState(null);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState({});

  useEffect(() => {
    async function loadData() {
      try {
        // 1. Fetch Doctor
        const docRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/rep/doctors/${doctorId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!docRes.ok) throw new Error("Doctor not found.");
        const docData = await docRes.json();
        setDoctor(docData.doctor);

        // 2. Fetch Products
        const prodRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/rep/products`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!prodRes.ok) throw new Error("Failed to load products catalog.");
        const prodData = await prodRes.json();
        setProducts(prodData);

        // Restore pending cart from local storage if exists and matches this doctor
        const stored = localStorage.getItem("lipistry_pending_order");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.doctorId === doctorId) {
            setCart(parsed.cart || {});
          }
        }
      } catch (err) {
        toast.error("Could not sync order configuration.");
        router.push("/rep/orders/new");
      } finally {
        setPageLoading(false);
      }
    }

    if (token && doctorId) {
      loadData();
    }
  }, [token, doctorId]);

  const updateQuantity = (productId, delta) => {
    setCart((prev) => {
      const current = prev[productId] || 0;
      const next = current + delta;
      if (next <= 0) {
        const copy = { ...prev };
        delete copy[productId];
        return copy;
      }
      return { ...prev, [productId]: next };
    });
  };

  const handleContinue = () => {
    if (Object.keys(cart).length === 0) {
      toast.error("Please add at least one wholesale product to your order.");
      return;
    }

    // Save to local storage
    localStorage.setItem("lipistry_pending_order", JSON.stringify({
      doctorId,
      cart
    }));

    router.push(`/rep/orders/new/review?doctorId=${doctorId}`);
  };

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

  const subtotal = cartItems.reduce((acc, curr) => acc + curr.total, 0);

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
          <p className="text-slate-550 text-xs font-bold tracking-wider">Syncing wholesale catalog...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn text-left">
      {/* Navigation */}
      <div>
        <Link
          href="/rep/orders/new"
          className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-brand-burgundy transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Select Doctor</span>
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-[#ebdfe1] shadow-sm">
        <div className="space-y-1">
          <span className="text-[9px] font-black text-brand-burgundy bg-brand-burgundy-light px-2.5 py-0.5 rounded-full border border-brand-burgundy/10 uppercase tracking-wider">
            Step 2 of 3
          </span>
          <h1 className="text-lg font-bold text-slate-900 mt-1">Build Wholesale Order</h1>
          <div className="flex items-center gap-1.5 text-xs text-slate-650 font-bold">
            <Building2 className="w-4 h-4 text-brand-burgundy shrink-0" />
            <span>{doctor.practice_name} (Dr. {doctor.doctor_first_name} {doctor.doctor_last_name})</span>
          </div>
        </div>
        
        {/* Subtotal Display */}
        <div className="bg-[#fbf7f8] px-4 py-2.5 rounded-xl border border-[#ebdfe1] text-right shrink-0">
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Subtotal</div>
          <div className="text-base font-black text-brand-burgundy mt-0.5">{formatPrice(subtotal)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products catalog list */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-brand-burgundy border-b border-[#ebdfe1]/50 pb-1.5 flex items-center gap-1.5">
            <ShoppingCart className="w-4.5 h-4.5" />
            <span>Wholesale Case Catalog</span>
          </h3>

          <div className="space-y-3">
            {products.map((prod) => {
              const qty = cart[prod.id] || 0;
              return (
                <div key={prod.id} className="p-4 bg-white rounded-2xl border border-[#ebdfe1] shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-center gap-3">
                    {(() => {
                      let firstImg = null;
                      if (prod.images) {
                        try {
                          const parsed = typeof prod.images === "string" ? JSON.parse(prod.images) : prod.images;
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
                          alt={prod.name} 
                          className="w-12 h-12 object-cover rounded-xl border border-slate-200 shrink-0 shadow-sm" 
                        />
                      ) : (
                        <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center border border-slate-200 text-slate-400 shrink-0">
                          <ShoppingBag className="w-6 h-6" />
                        </div>
                      );
                    })()}
                    
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-slate-900">{prod.name}</h4>
                      <div className="flex gap-2 text-[10px] text-slate-500 font-semibold">
                        <span>SKU: {prod.sku}</span>
                        <span>•</span>
                        <span>{prod.units_per_case} units/case</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                    <span className="text-xs font-extrabold text-slate-805">{formatPrice(prod.case_price)} / case</span>
                    
                    <div className="flex items-center gap-2 border border-slate-205 rounded-lg p-1 bg-slate-50">
                      <button
                        type="button"
                        onClick={() => updateQuantity(prod.id, -1)}
                        className="p-1 rounded-md hover:bg-slate-200 transition-colors text-slate-500 cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs font-black text-slate-900 w-6 text-center">{qty}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(prod.id, 1)}
                        className="p-1 rounded-md hover:bg-slate-200 transition-colors text-slate-500 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar Summary & Review */}
        <div className="space-y-6">
          <div className="glass-panel p-5 rounded-2xl border border-[#ebdfe1] bg-white shadow-sm space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-brand-burgundy border-b border-[#ebdfe1]/50 pb-1.5">
              <span>Order Summary</span>
            </h3>

            {cartItems.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400 font-semibold border-b border-[#ebdfe1]/30">
                Cart is empty. Select case quantities.
              </div>
            ) : (
              <div className="space-y-3 max-h-48 overflow-y-auto pr-1 border-b border-[#ebdfe1]/30 pb-3">
                {cartItems.map((item) => (
                  <div key={item.product.id} className="flex justify-between text-xs font-semibold">
                    <div className="truncate max-w-[150px] text-slate-700">
                      {item.product.name} <span className="font-extrabold text-brand-burgundy">x{item.quantity}</span>
                    </div>
                    <span className="font-bold text-slate-900">{formatPrice(item.total)}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between items-center text-xs font-black">
              <span className="text-slate-550">Subtotal</span>
              <span className="text-brand-burgundy text-base tracking-tight">{formatPrice(subtotal)}</span>
            </div>

            <button
              onClick={handleContinue}
              disabled={subtotal === 0}
              className="w-full py-3 bg-brand-burgundy hover:bg-brand-burgundy-hover text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>Continue to Review</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BuildOrderStep() {
  return (
    <Suspense fallback={
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-brand-burgundy animate-spin" />
          <p className="text-slate-555 text-xs font-bold tracking-wider">Syncing wholesale catalog...</p>
        </div>
      </div>
    }>
      <BuildOrderContent />
    </Suspense>
  );
}
