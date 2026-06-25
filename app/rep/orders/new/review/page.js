"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { 
  Loader2, 
  ArrowLeft, 
  CreditCard, 
  CheckCircle,
  Building2,
  FileText,
  Truck,
  HelpCircle,
  ShoppingBag
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
  "pk_test_51T9hBMQ3ySlRFaIlj6lgc4yIgw2cYgV25GJGwHEqpPyW0A9t7dlgjqkFJbgOIJA3KHRLJ85ijSCkw8o3a7s9ohio00rwk4MhJ1"
);

const cardElementOptions = {
  style: {
    base: {
      fontSize: "13px",
      color: "#3f3335",
      fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
      "::placeholder": {
        color: "#a0aec0",
      },
    },
    invalid: {
      color: "#700c1a",
    },
  },
};

function CheckoutForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const doctorId = searchParams.get("doctorId");
  const { token } = useAuthStore();
  const stripe = useStripe();
  const elements = useElements();

  const [pageLoading, setPageLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);

  const [doctor, setDoctor] = useState(null);
  const [cardInfo, setCardInfo] = useState(null);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState({});

  // Payment choice
  const [paymentChoice, setPaymentChoice] = useState("card_on_file"); // card_on_file or new_card
  const [stripeFocused, setStripeFocused] = useState(false);

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
      // 1. If entering a new card, execute card registration via Stripe Elements first
      if (paymentChoice === "new_card") {
        if (!stripe || !elements) {
          throw new Error("Stripe checkout module is still loading. Please try again.");
        }

        const cardElement = elements.getElement(CardElement);
        if (!cardElement) {
          throw new Error("Please enter card details.");
        }

        // Tokenize card securely on Stripe
        const { error, paymentMethod } = await stripe.createPaymentMethod({
          type: "card",
          card: cardElement,
          billing_details: {
            name: doctor ? doctor.practice_name : "Practice Customer",
            email: doctor ? doctor.email : undefined,
          },
        });

        if (error) {
          throw new Error(error.message || "Failed to process card details with Stripe.");
        }

        // Send paymentMethod.id and parsed card details to backend
        const cardResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/rep/doctors/${doctorId}/card`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              payment_method_id: paymentMethod.id,
              card_brand: paymentMethod.card.brand,
              last4: paymentMethod.card.last4,
              exp_month: paymentMethod.card.exp_month,
              exp_year: paymentMethod.card.exp_year
            })
          }
        );

        if (!cardResponse.ok) {
          const cardErr = await cardResponse.json();
          throw new Error(cardErr.error || "Failed to configure billing details on doctor practice account.");
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
            payment_method: "card_on_file", // Uses either previously saved, or newly saved card on file
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
      router.push(`/rep/orders/confirmation?id=${result.order_id}`);
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
                            const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace("/api", "");
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
                      : "border-slate-200 text-slate-655 hover:bg-slate-50"
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
                      : "border-slate-200 text-slate-655 hover:bg-slate-50"
                    }
                  `}
                >
                  Use New Card
                </button>
              </div>
            )}

            {paymentChoice === "card_on_file" && cardInfo ? (
              <div className="p-3 bg-slate-50 border border-[#ebdfe1] rounded-xl text-xs font-semibold leading-relaxed text-left">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Charge Saved Card</p>
                <p className="text-slate-805 font-bold mt-1">{cardInfo.brand} ending in {cardInfo.last4}</p>
                <p className="text-slate-500 text-[10px]">Expires: {cardInfo.expiry}</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-4 bg-slate-50 border border-[#ebdfe1] rounded-2xl space-y-3">
                  <label className="block text-[8px] font-black text-slate-505 uppercase tracking-widest mb-1">
                    Credit or Debit Card Details
                  </label>
                  <div className={`stripe-element-container ${stripeFocused ? "focused" : ""}`}>
                    <CardElement
                      options={cardElementOptions}
                      onFocus={() => setStripeFocused(true)}
                      onBlur={() => setStripeFocused(false)}
                    />
                  </div>
                </div>

                {/* Info Text */}
                <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                  * Card details are encrypted and tokenized securely. Saving this card updates the default payment method for this practice.
                </p>
              </div>
            )}

            {/* Total breakdown */}
            <div className="border-t border-[#ebdfe1]/50 pt-3 flex justify-between items-center text-xs font-black">
              <span className="text-slate-550">Order Total</span>
              <span className="text-brand-burgundy text-base tracking-tight">{formatPrice(orderTotal)}</span>
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

export default function OrderReviewStep() {
  return (
    <Elements stripe={stripePromise}>
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
    </Elements>
  );
}
