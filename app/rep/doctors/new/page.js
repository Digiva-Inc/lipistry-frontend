"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { 
  Loader2, 
  Stethoscope, 
  ArrowLeft, 
  Save, 
  CreditCard, 
  CheckCircle,
  Building,
  User,
  MapPin,
  Phone,
  Mail,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

const INDIA_STATES = [
  { code: "AP", name: "Andhra Pradesh" },
  { code: "AR", name: "Arunachal Pradesh" },
  { code: "AS", name: "Assam" },
  { code: "BR", name: "Bihar" },
  { code: "CG", name: "Chhattisgarh" },
  { code: "GA", name: "Goa" },
  { code: "GJ", name: "Gujarat" },
  { code: "HR", name: "Haryana" },
  { code: "HP", name: "Himachal Pradesh" },
  { code: "JH", name: "Jharkhand" },
  { code: "KA", name: "Karnataka" },
  { code: "KL", name: "Kerala" },
  { code: "MP", name: "Madhya Pradesh" },
  { code: "MH", name: "Maharashtra" },
  { code: "MN", name: "Manipur" },
  { code: "ML", name: "Meghalaya" },
  { code: "MZ", name: "Mizoram" },
  { code: "NL", name: "Nagaland" },
  { code: "OD", name: "Odisha" },
  { code: "PB", name: "Punjab" },
  { code: "RJ", name: "Rajasthan" },
  { code: "SK", name: "Sikkim" },
  { code: "TN", name: "Tamil Nadu" },
  { code: "TG", name: "Telangana" },
  { code: "TR", name: "Tripura" },
  { code: "UP", name: "Uttar Pradesh" },
  { code: "UK", name: "Uttarakhand" },
  { code: "WB", name: "West Bengal" },
  { code: "AN", name: "Andaman & Nicobar" },
  { code: "CH", name: "Chandigarh" },
  { code: "DN", name: "Dadra & Nagar Haveli & Daman & Diu" },
  { code: "DL", name: "Delhi" },
  { code: "JK", name: "Jammu & Kashmir" },
  { code: "LA", name: "Ladakh" },
  { code: "LD", name: "Lakshadweep" },
  { code: "PY", name: "Puducherry" }
];

export default function NewDoctor() {
  const router = useRouter();
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    practice_name: "",
    doctor_first_name: "",
    doctor_last_name: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    zip: "",
    phone: "",
    email: "",
    notes: ""
  });

  // Prompt states after doctor creation
  const [createdDoctorId, setCreatedDoctorId] = useState(null);
  const [promptCardModal, setPromptCardModal] = useState(false);
  const [cardLoading, setCardLoading] = useState(false);
  const [cardData, setCardData] = useState({
    card_brand: "Visa",
    last4: "",
    exp_month: "12",
    exp_year: new Date().getFullYear().toString()
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCardChange = (e) => {
    const { name, value } = e.target;
    setCardData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validations
    if (!/^\d{5,6}$/.test(formData.zip)) {
      toast.error("ZIP Code must be 5 or 6 digits.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error("Please enter a valid email format.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/rep/doctors`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(formData)
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create doctor profile.");
      }

      toast.success("Practice profile created successfully.");
      setCreatedDoctorId(result.id);
      // Trigger card on file prompt
      setPromptCardModal(true);
    } catch (err) {
      toast.error(err.message || "Failed to create doctor profile.");
    } finally {
      setLoading(false);
    }
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
        `${process.env.NEXT_PUBLIC_API_URL}/rep/doctors/${createdDoctorId}/card`,
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
        throw new Error("Failed to add credit card.");
      }

      toast.success("Credit card saved on file!");
      router.push(`/rep/doctors/detail?id=${createdDoctorId}`);
    } catch (err) {
      toast.error(err.message || "Failed to save credit card on file.");
    } finally {
      setCardLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2">
        <Link
          href="/rep/doctors"
          className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-brand-burgundy transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Directory</span>
        </Link>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">Register Practice Profile</h1>
        <p className="text-slate-500 text-xs mt-1 font-semibold">Enter practice contacts, clinic address details, and save payment methods.</p>
      </div>

      {/* Form Container */}
      <form onSubmit={handleSubmit} className="glass-panel p-6 rounded-2xl border border-[#ebdfe1] bg-white space-y-6 shadow-sm text-left">
        {/* Practice info */}
        <div className="space-y-4">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-brand-burgundy border-b border-[#ebdfe1]/50 pb-1.5 flex items-center gap-1.5">
            <Building className="w-4 h-4" />
            <span>Practice Details</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wider">Practice Name *</label>
              <input
                type="text"
                name="practice_name"
                required
                value={formData.practice_name}
                onChange={handleChange}
                placeholder="e.g. Beverly Hills Aesthetics"
                className="w-full px-4 py-2.5 rounded-xl text-xs font-semibold glass-input"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wider">First Name *</label>
                <input
                  type="text"
                  name="doctor_first_name"
                  required
                  value={formData.doctor_first_name}
                  onChange={handleChange}
                  placeholder="First name"
                  className="w-full px-4 py-2.5 rounded-xl text-xs font-semibold glass-input"
                />
              </div>
              <div>
                <label className="block text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wider">Last Name *</label>
                <input
                  type="text"
                  name="doctor_last_name"
                  required
                  value={formData.doctor_last_name}
                  onChange={handleChange}
                  placeholder="Last name"
                  className="w-full px-4 py-2.5 rounded-xl text-xs font-semibold glass-input"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="space-y-4">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-brand-burgundy border-b border-[#ebdfe1]/50 pb-1.5 flex items-center gap-1.5">
            <MapPin className="w-4 h-4" />
            <span>Office Address</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wider">Address Line 1 *</label>
              <input
                type="text"
                name="address_line1"
                required
                value={formData.address_line1}
                onChange={handleChange}
                placeholder="Street address or P.O. Box"
                className="w-full px-4 py-2.5 rounded-xl text-xs font-semibold glass-input"
              />
            </div>
            <div>
              <label className="block text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wider">Address Line 2 (Optional)</label>
              <input
                type="text"
                name="address_line2"
                value={formData.address_line2}
                onChange={handleChange}
                placeholder="Suite, unit, floor, etc."
                className="w-full px-4 py-2.5 rounded-xl text-xs font-semibold glass-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wider">City *</label>
              <input
                type="text"
                name="city"
                required
                value={formData.city}
                onChange={handleChange}
                placeholder="City"
                className="w-full px-4 py-2.5 rounded-xl text-xs font-semibold glass-input"
              />
            </div>
            <div>
              <label className="block text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wider">State *</label>
              <select
                name="state"
                required
                value={formData.state}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl text-xs font-semibold glass-input cursor-pointer"
              >
                <option value="">Select State</option>
                {INDIA_STATES.map((st) => (
                  <option key={st.code} value={st.code}>{st.name} ({st.code})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wider">ZIP / PIN Code *</label>
              <input
                type="text"
                name="zip"
                required
                maxLength={6}
                value={formData.zip}
                onChange={handleChange}
                placeholder="PIN or ZIP Code"
                className="w-full px-4 py-2.5 rounded-xl text-xs font-semibold glass-input"
              />
            </div>
          </div>
        </div>

        {/* Contacts */}
        <div className="space-y-4">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-brand-burgundy border-b border-[#ebdfe1]/50 pb-1.5 flex items-center gap-1.5">
            <Mail className="w-4 h-4" />
            <span>Contact Information</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wider">Practice Phone *</label>
              <input
                type="tel"
                name="phone"
                required
                value={formData.phone}
                onChange={handleChange}
                placeholder="Clinic phone number"
                className="w-full px-4 py-2.5 rounded-xl text-xs font-semibold glass-input"
              />
            </div>
            <div>
              <label className="block text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wider">Practice Email *</label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="Email (for receipts/orders)"
                className="w-full px-4 py-2.5 rounded-xl text-xs font-semibold glass-input"
              />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-4">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-brand-burgundy border-b border-[#ebdfe1]/50 pb-1.5 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4" />
            <span>Internal Notes (Optional)</span>
          </h3>
          <textarea
            name="notes"
            rows={3}
            value={formData.notes}
            onChange={handleChange}
            placeholder="Provide internal comments, special discounts or notes visible only to representatives."
            className="w-full px-4 py-2.5 rounded-xl text-xs font-semibold glass-input resize-none"
          />
        </div>

        {/* Action Button */}
        <div className="pt-3 border-t border-[#ebdfe1] flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-brand-burgundy hover:bg-brand-burgundy-hover text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>Save Profile</span>
          </button>
        </div>
      </form>

      {/* Credit Card Prompt Modal */}
      {promptCardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="glass-card rounded-2xl border border-[#ebdfe1] p-6 w-full max-w-sm relative overflow-hidden shadow-2xl text-left">
            <div className="mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
              <h3 className="text-sm font-extrabold text-slate-900">Practice Registered!</h3>
            </div>

            <p className="text-slate-500 text-xs font-medium leading-relaxed mb-4">
              Would you like to save a credit card on file for this practice now? This enables instant checkout during wholesale orders.
            </p>

            <form onSubmit={handleCardSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 text-[10px] font-bold mb-1 uppercase tracking-wider">Card Brand</label>
                  <select
                    name="card_brand"
                    value={cardData.card_brand}
                    onChange={handleCardChange}
                    className="w-full px-3 py-2 rounded-xl text-xs font-semibold glass-input cursor-pointer"
                  >
                    <option value="Visa">Visa</option>
                    <option value="Mastercard">Mastercard</option>
                    <option value="Amex">American Express</option>
                    <option value="Discover">Discover</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 text-[10px] font-bold mb-1 uppercase tracking-wider">Last 4 Digits</label>
                  <input
                    type="text"
                    name="last4"
                    required
                    maxLength={4}
                    value={cardData.last4}
                    onChange={handleCardChange}
                    placeholder="4242"
                    className="w-full px-3 py-2 rounded-xl text-xs font-semibold glass-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 text-[10px] font-bold mb-1 uppercase tracking-wider">Expiry Month</label>
                  <select
                    name="exp_month"
                    value={cardData.exp_month}
                    onChange={handleCardChange}
                    className="w-full px-3 py-2 rounded-xl text-xs font-semibold glass-input cursor-pointer"
                  >
                    {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0")).map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 text-[10px] font-bold mb-1 uppercase tracking-wider">Expiry Year</label>
                  <select
                    name="exp_year"
                    value={cardData.exp_year}
                    onChange={handleCardChange}
                    className="w-full px-3 py-2 rounded-xl text-xs font-semibold glass-input cursor-pointer"
                  >
                    {Array.from({ length: 10 }, (_, i) => String(new Date().getFullYear() + i)).map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-[#ebdfe1] flex justify-between gap-2">
                <button
                  type="button"
                  onClick={() => router.push(`/rep/doctors/detail?id=${createdDoctorId}`)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 border border-slate-200 transition-all cursor-pointer"
                >
                  Skip for Now
                </button>
                <button
                  type="submit"
                  disabled={cardLoading}
                  className="flex items-center gap-1.5 px-4 py-2 bg-brand-burgundy hover:bg-brand-burgundy-hover text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer animate-fadeIn"
                >
                  {cardLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CreditCard className="w-3.5 h-3.5" />}
                  <span>Save Card</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
