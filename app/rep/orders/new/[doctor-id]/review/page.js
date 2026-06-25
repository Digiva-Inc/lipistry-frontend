"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { 
  Loader2, 
  ArrowLeft, 
  CreditCard, 
  CheckCircle,
  Building2,
  FileText,
  Truck,
  HelpCircle
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function OrderReviewStep() {
  const router = useRouter();
  const { "doctor-id": doctorId } = useParams();
  const { token } = useAuthStore();

  const [pageLoading, setPageLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);

  const [doctor, setDoctor] = useState(null);
  const [cardInfo, setCardInfo] = useState(null);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState({});

  // Payment choice
  const [paymentChoice, setPaymentChoice] = useState("card_on_file"); // card_on_file or new_card
  const [saveCardForFuture, setSaveCardForFuture] = useState(true);

  // New card fields
  const [newCard, setNewCard] = useState({
    card_brand: "Visa",
    last4: "",
    exp_month: "12",
    exp_year: new Date().getFullYear().toString()
  });

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
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/rep/doctors/${doctorId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!docRes.ok) throw new Error("Doctor profile not found.");
        const docData = await docRes.json();
        setDoctor(docData.doctor);
        setCardInfo(docData.cardInfo);

        // Pre-select payment choice based on saved card availability
        setPaymentChoice(docData.cardInfo ? "card_on_file" : "new_card");

        // Fetch products
        const prodRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/rep/products`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!prodRes.ok) throw new Error("Catalog load failed.");
        const prodData = await prodRes.json();
        setProducts(prodData);
      } catch (err) {
        toast.error(err.message || "Failed to load checkout draft.");
        router.push(`/rep/orders/new/${doctorId}`);
      } finally {
        setPageLoading(false);
      }
    }

    if (token && doctorId) {
      loadData();
    }
  }, [token, doctorId]);

  const handleNewCardChange = (e) => {
    const { name, value } = e.target;
    setNewCard((prev) => ({ ...prev, [name]: value }));
  };

  const cartItems = Object.entries(cart).map(([productId, qty]) => {
    const product = products.find((p) => p.id === productId);
    return {
      product,
      quantity: qty,
      total: product ? product.case_price * qty : 0
    };
  });

  const orderTotal = cartItems.reduce((acc, curr) => acc + curr.total, 0);

  const handlePlaceOrder = async () => {
    if (paymentChoice === "new_card") {
      if (!/^\d{4}$/.test(newCard.last4)) {
        toast.error("Please enter a valid 4-digit representation for card digits.");
        return;
      }
    }

    setSubmitLoading(true);

    try {
      // 1. If entering a new card and opted to save, execute card registration first
      if (paymentChoice === "new_card" && saveCardForFuture) {
        const cardResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/rep/doctors/${doctorId}/card`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              card_brand: newCard.card_brand,
              last4: newCard.last4,
              exp_month: parseInt(newCard.exp_month),
              exp_year: parseInt(newCard.exp_year)
            })
          }
        );

        if (!cardResponse.ok) {
          throw new Error("Failed to configure billing details on doctor practice account.");
        }
      }

      // 2. Submit order payload to backend
      const orderResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/rep/orders`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            doctor_id: doctorId,
            payment_method: "card_on_file", // Either previously saved, or newly saved
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

      toast.success("Order placed successfully!");
      // Redirect to Confirmation screen
      router.push(`/rep/orders/${result.order_id}/confirmation`);
    } catch (err) {
      toast.error(err.message || "Failed to place order.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const formatPrice = (cents) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD"
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
          href={`/rep/orders/new/${doctorId}`}
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
        <p className="text-slate-500 text-xs mt-1 font-semibold">Inspect your wholesale items and confirm payment terms for {doctor.practice_name}.</p>
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
                      <td className="px-3 py-2.5 font-bold text-slate-800">{item.product.name}</td>
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
                <p className="text-slate-500 text-[10px] mt-0.5">Order will be submitted automatically to Lipistry Shopify wholesale backend for dispatch.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Billing & Action */}
        <div className="space-y-6">
          <div className="glass-panel p-5 rounded-2xl border border-[#ebdfe1] bg-white shadow-sm space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-brand-burgundy border-b border-[#ebdfe1]/50 pb-1.5 flex items-center gap-1.5">
              <CreditCard className="w-4.5 h-4.5" />
              <span>Billing Details</span>
            </h3>

            {/* Toggle */}
            {cardInfo && (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentChoice("card_on_file")}
                  className={`
                    py-2 rounded-xl text-[10px] font-bold border transition-all cursor-pointer
                    ${paymentChoice === "card_on_file" 
                      ? "bg-brand-burgundy-light border-brand-burgundy text-brand-burgundy" 
                      : "border-slate-200 text-slate-650 hover:bg-slate-50"
                    }
                  `}
                >
                  Saved Card
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentChoice("new_card")}
                  className={`
                    py-2 rounded-xl text-[10px] font-bold border transition-all cursor-pointer
                    ${paymentChoice === "new_card" 
                      ? "bg-brand-burgundy-light border-brand-burgundy text-brand-burgundy" 
                      : "border-slate-200 text-slate-650 hover:bg-slate-50"
                    }
                  `}
                >
                  Use New Card
                </button>
              </div>
            )}

            {paymentChoice === "card_on_file" && cardInfo ? (
              <div className="p-3 bg-slate-50 border border-[#ebdfe1] rounded-xl text-xs font-semibold leading-relaxed">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Charge Saved Card</p>
                <p className="text-slate-800 font-bold mt-1">{cardInfo.brand} ending in {cardInfo.last4}</p>
                <p className="text-slate-500 text-[10px]">Expires: {cardInfo.expiry}</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 bg-slate-50 border border-[#ebdfe1] rounded-xl space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider">Brand</label>
                      <select
                        name="card_brand"
                        value={newCard.card_brand}
                        onChange={handleNewCardChange}
                        className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-[10px] font-semibold cursor-pointer"
                      >
                        <option value="Visa">Visa</option>
                        <option value="Mastercard">Mastercard</option>
                        <option value="Amex">Amex</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider">Last 4</label>
                      <input
                        type="text"
                        name="last4"
                        maxLength={4}
                        value={newCard.last4}
                        onChange={handleNewCardChange}
                        placeholder="4242"
                        className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-[10px] font-semibold"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider">Month</label>
                      <select
                        name="exp_month"
                        value={newCard.exp_month}
                        onChange={handleNewCardChange}
                        className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-[10px] font-semibold cursor-pointer"
                      >
                        {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0")).map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider">Year</label>
                      <select
                        name="exp_year"
                        value={newCard.exp_year}
                        onChange={handleNewCardChange}
                        className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-[10px] font-semibold cursor-pointer"
                      >
                        {Array.from({ length: 10 }, (_, i) => String(new Date().getFullYear() + i)).map((y) => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Save card checkbox */}
                <label className="flex items-center gap-2 text-[10px] text-slate-650 font-bold select-none cursor-pointer">
                  <input
                    type="checkbox"
                    checked={saveCardForFuture}
                    onChange={(e) => setSaveCardForFuture(e.target.checked)}
                    className="w-3.5 h-3.5 accent-brand-burgundy rounded cursor-pointer"
                  />
                  <span>Save card details for future checkouts</span>
                </label>
              </div>
            )}

            {/* Total breakdown */}
            <div className="border-t border-[#ebdfe1]/50 pt-3 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-550">Order Total</span>
              <span className="text-brand-burgundy font-black text-base">{formatPrice(orderTotal)}</span>
            </div>

            {/* Checkout action */}
            <button
              onClick={handlePlaceOrder}
              disabled={submitLoading || orderTotal === 0}
              className="w-full py-3 bg-brand-burgundy hover:bg-brand-burgundy-hover text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              <span>Place Order</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
