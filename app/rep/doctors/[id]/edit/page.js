"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { 
  Loader2, 
  ArrowLeft, 
  Save, 
  Building,
  MapPin,
  Mail,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", 
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", 
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", 
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", 
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
];

export default function EditDoctor() {
  const router = useRouter();
  const { id } = useParams();
  const { token } = useAuthStore();
  
  const [pageLoading, setPageLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);

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

  useEffect(() => {
    async function loadDoctor() {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/rep/doctors/${id}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        if (!response.ok) {
          throw new Error("Failed to load doctor details.");
        }

        const result = await response.json();
        setFormData({
          practice_name: result.doctor.practice_name,
          doctor_first_name: result.doctor.doctor_first_name,
          doctor_last_name: result.doctor.doctor_last_name,
          address_line1: result.doctor.address_line1,
          address_line2: result.doctor.address_line2 || "",
          city: result.doctor.city,
          state: result.doctor.state,
          zip: result.doctor.zip,
          phone: result.doctor.phone,
          email: result.doctor.email,
          notes: result.doctor.notes || ""
        });
      } catch (err) {
        toast.error("Could not retrieve doctor profile.");
        router.push("/rep/doctors");
      } finally {
        setPageLoading(false);
      }
    }

    if (token && id) {
      loadDoctor();
    }
  }, [token, id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validations
    if (!/^\d{5}$/.test(formData.zip)) {
      toast.error("ZIP Code must be exactly 5 digits.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error("Please enter a valid email format.");
      return;
    }

    setSubmitLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/rep/doctors/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(formData)
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update doctor profile.");
      }

      toast.success("Practice profile updated successfully.");
      router.push(`/rep/doctors/${id}`);
    } catch (err) {
      toast.error(err.message || "Failed to update doctor profile.");
    } finally {
      setSubmitLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-brand-burgundy animate-spin" />
          <p className="text-slate-550 text-xs font-bold tracking-wider">Retrieving practice profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2">
        <Link
          href={`/rep/doctors/${id}`}
          className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-brand-burgundy transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Profile</span>
        </Link>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">Modify Practice Profile</h1>
        <p className="text-slate-550 text-xs mt-1 font-semibold">Edit practice contact information, clinic address, and internal workspace comments.</p>
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
                className="w-full px-4 py-2.5 rounded-xl text-xs font-semibold glass-input"
              />
            </div>
            <div>
              <label className="block text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wider">Address Line 2</label>
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
                {US_STATES.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wider">ZIP Code *</label>
              <input
                type="text"
                name="zip"
                required
                maxLength={5}
                value={formData.zip}
                onChange={handleChange}
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
            className="w-full px-4 py-2.5 rounded-xl text-xs font-semibold glass-input resize-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-[#ebdfe1] flex justify-end gap-3">
          <Link
            href={`/rep/doctors/${id}`}
            className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-300 text-slate-650 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitLoading}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-brand-burgundy hover:bg-brand-burgundy-hover text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer animate-fadeIn"
          >
            {submitLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>Save Updates</span>
          </button>
        </div>
      </form>
    </div>
  );
}
