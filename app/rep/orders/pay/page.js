"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { 
  Loader2, 
  ArrowLeft, 
  CheckCircle,
  Building2,
  FileText,
  AlertCircle,
  Lock,
  QrCode,
  CreditCard,
  Clock,
  X
} from "lucide-react";
import { toast } from "sonner";

function PaymentView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const { token } = useAuthStore();

  const [pageLoading, setPageLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("stripe"); // Automatically set to stripe

  const [order, setOrder] = useState(null);
  const [doctor, setDoctor] = useState(null);

  useEffect(() => {
    async function loadData() {
      if (!id || !token) return;
      try {
        // Fetch Order details
        const orderRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/rep/orders/${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        let orderData;
        const textOrder = await orderRes.text();
        try {
          orderData = JSON.parse(textOrder);
        } catch (e) {
          console.error("Failed to parse order JSON:", textOrder);
          throw new Error("Server returned an invalid response (HTML). Please check your backend.");
        }

        if (!orderRes.ok) throw new Error(orderData?.error || "Order not found.");
        setOrder(orderData.order);

        // Fetch Doctor details
        if (orderData.order?.doctor_id) {
          const docRes = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/rep/doctors/${orderData.order.doctor_id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          if (docRes.ok) {
             const docData = await docRes.json();
             setDoctor(docData.doctor);
          }
        }
      } catch (err) {
        toast.error(err.message || "Failed to load payment details.");
        router.push("/rep/orders");
      } finally {
        setPageLoading(false);
      }
    }

    loadData();
  }, [token, id, router]);

  const handleCheckout = async () => {
    setSubmitLoading(true);

    try {
      const sessionRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/rep/orders/create-checkout-session`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            orderId: id
          })
        }
      );

      const result = await sessionRes.json();

      if (!sessionRes.ok) {
        throw new Error(result.error || "Failed to initialize checkout session.");
      }

      // Redirect browser to Stripe Hosted Checkout URL
      window.location.href = result.url;
    } catch (err) {
      toast.error(err.message || "Failed to connect to secure checkout. Please try again.");
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
          <p className="text-slate-555 text-xs font-bold tracking-wider">Loading payment details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-[#ebdfe1]/60">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push('/rep/orders')}
            className="p-2.5 rounded-xl hover:bg-white text-slate-400 hover:text-slate-700 transition-all cursor-pointer shadow-sm border border-transparent hover:border-[#ebdfe1]"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-brand-burgundy tracking-tight">Complete Payment</h1>
            <p className="text-xs font-semibold text-slate-500 mt-1 flex items-center gap-2">
              Order {order?.order_number} <span className="w-1 h-1 rounded-full bg-slate-300"></span> Pending Payment
            </p>
          </div>
        </div>
        <div className={`px-4 py-2 border rounded-lg text-xs font-bold flex items-center gap-2 ${order?.status === 'failed_payment' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
          <AlertCircle className="w-4 h-4" />
          {order?.status === 'failed_payment' ? 'Payment Cancelled' : 'Awaiting Payment'}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8">
        {/* Left Column: Order Summary */}
        <div className="space-y-6">

          {/* Payment Timeline Tracker */}
          <div className="glass-panel p-6 rounded-2xl border border-[#ebdfe1] bg-white shadow-sm space-y-4">
             <h3 className="text-sm font-extrabold text-brand-burgundy flex items-center gap-2 border-b border-[#ebdfe1]/50 pb-2">
                <Clock className="w-5 h-5" />
                Payment Status
             </h3>
             <div className="flex flex-col gap-5 relative pt-2 pb-1">
                <div className="absolute left-[15px] top-[10px] bottom-[10px] w-[2px] bg-[#ebdfe1]"></div>
                
                {/* Step 1 */}
                <div className="flex gap-4 relative z-10">
                   <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 ${order?.status === 'failed_payment' ? 'bg-red-50 border-red-500 text-red-600' : 'bg-brand-burgundy text-white border-brand-burgundy'}`}>
                      {order?.status === 'failed_payment' ? <X className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                   </div>
                   <div>
                      <h4 className={`text-xs font-bold ${order?.status === 'failed_payment' ? 'text-red-700' : 'text-slate-900'}`}>
                        {order?.status === 'failed_payment' ? 'Payment Cancelled' : 'Payment Drafted'}
                      </h4>
                      <p className="text-[10px] text-slate-500 font-medium mt-0.5">Order checkout initialized.</p>
                   </div>
                </div>

                {/* Step 2 */}
                <div className="flex gap-4 relative z-10 opacity-50">
                   <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-slate-300 flex items-center justify-center shrink-0 text-slate-400">
                      <CheckCircle className="w-4 h-4" />
                   </div>
                   <div>
                      <h4 className="text-xs font-bold text-slate-500">Order Placed & Paid</h4>
                      <p className="text-[10px] text-slate-500 font-medium mt-0.5">Pending successful payment via Stripe.</p>
                   </div>
                </div>
             </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-[#ebdfe1] bg-white shadow-sm space-y-5">
            <h3 className="text-sm font-extrabold text-brand-burgundy flex items-center gap-2 border-b border-[#ebdfe1]/50 pb-2">
              <FileText className="w-5 h-5" />
              Order Overview
            </h3>

            {doctor && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-4">
                <div className="p-2.5 bg-white rounded-lg shadow-sm">
                  <Building2 className="w-5 h-5 text-brand-burgundy" />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-800">{doctor.practice_name}</p>
                  <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
                    Dr. {doctor.doctor_first_name} {doctor.doctor_last_name}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium mt-1">
                    {doctor.address_line1}, {doctor.city}, {doctor.state}
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm font-bold text-slate-700">
                <span>Subtotal</span>
                <span>{formatPrice(order?.subtotal_cents || 0)}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-bold text-slate-700">
                <span>Shipping</span>
                <span>Free</span>
              </div>
              <div className="border-t border-[#ebdfe1]/50 pt-3 flex justify-between items-center">
                <span className="text-sm font-black text-slate-800">Total Amount Due</span>
                <span className="text-xl font-black text-brand-burgundy">{formatPrice(order?.total_cents || 0)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Checkout Action */}
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-[#ebdfe1] bg-white shadow-sm space-y-6">
            <h3 className="text-sm font-black text-slate-800 border-b border-[#ebdfe1]/50 pb-2">Complete Payment</h3>
            
            <div className="flex flex-col items-center text-center space-y-4 pt-2">
               <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center shadow-sm">
                 <Lock className="w-6 h-6" />
               </div>
               <div>
                 <h3 className="text-sm font-black text-slate-800">Secure Checkout</h3>
                 <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">
                   You will be redirected to Stripe to complete your purchase securely. Payments are processed securely via UPI through Stripe's certified payment gateway.
                 </p>
               </div>
               <button
                onClick={handleCheckout}
                disabled={submitLoading || !order}
                className="w-full py-3 bg-brand-burgundy hover:bg-brand-burgundy-hover text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                <span>Proceed to Stripe Checkout</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrderPaymentPage() {
  return (
    <Suspense fallback={
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand-burgundy animate-spin" />
      </div>
    }>
      <PaymentView />
    </Suspense>
  );
}
