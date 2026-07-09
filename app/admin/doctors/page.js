"use client";

import { useEffect, useState } from "react";
import { 
  HeartHandshake, 
  Search, 
  Loader2, 
  X, 
  GitMerge, 
  User, 
  Building2, 
  Mail, 
  Phone,
  CheckCircle,
  AlertCircle,
  UserPlus,
  Edit,
  CreditCard,
  Building,
  MapPin,
  Save
} from "lucide-react";
import { useAuthStore } from "../../../store/authStore";
import { toast } from "sonner";

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

export default function AllDoctors() {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState([]);
  const [reps, setReps] = useState([]);
  const [search, setSearch] = useState("");

  // Modals state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [cardModalOpen, setCardModalOpen] = useState(false);

  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [newRepId, setNewRepId] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [cardLoading, setCardLoading] = useState(false);

  // Form states for Add/Edit
  const [formData, setFormData] = useState({
    rep_id: "",
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
    notes: "",
    active: 1
  });

  // Credit Card Form State
  const [cardData, setCardData] = useState({
    card_brand: "Visa",
    last4: "",
    exp_month: "12",
    exp_year: new Date().getFullYear().toString()
  });

  async function fetchDoctorsAndReps() {
    try {
      const [docsResponse, repsResponse] = await Promise.all([
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/admin/doctors`,
          { headers: { Authorization: `Bearer ${token}` } }
        ),
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/admin/reps`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
      ]);

      if (!docsResponse.ok || !repsResponse.ok) {
        throw new Error("Failed to load doctor directory or representatives.");
      }

      const docsResult = await docsResponse.json();
      const repsResult = await repsResponse.json();

      setDoctors(docsResult);
      // Active reps list
      setReps(repsResult.filter(r => r.active === 1 || r.active === true));
    } catch (err) {
      console.warn(err);
      toast.error("Failed to load doctors list.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) {
      fetchDoctorsAndReps();
    }
  }, [token]);

  // Open Handlers
  const handleOpenAdd = () => {
    setFormData({
      rep_id: reps.length > 0 ? reps[0].id.toString() : "",
      practice_name: "",
      doctor_first_name: "",
      doctor_last_name: "",
      address_line1: "",
      address_line2: "",
      city: "",
      state: "GJ", // Gujarat as default
      zip: "",
      phone: "",
      email: "",
      notes: "",
      active: 1
    });
    setAddModalOpen(true);
  };

  const handleOpenEdit = (doc) => {
    setSelectedDoctor(doc);
    setFormData({
      rep_id: doc.rep_id ? doc.rep_id.toString() : "",
      practice_name: doc.practice_name,
      doctor_first_name: doc.doctor_first_name,
      doctor_last_name: doc.doctor_last_name,
      address_line1: doc.address_line1,
      address_line2: doc.address_line2 || "",
      city: doc.city,
      state: doc.state,
      zip: doc.zip,
      phone: doc.phone,
      email: doc.email,
      notes: doc.notes || "",
      active: doc.active === 1 || doc.active === true ? 1 : 0
    });
    setEditModalOpen(true);
  };

  const handleOpenReassign = (doc) => {
    setSelectedDoctor(doc);
    setNewRepId(doc.rep_id ? doc.rep_id.toString() : "");
    setReassignModalOpen(true);
  };

  const handleOpenCard = (doc) => {
    setSelectedDoctor(doc);
    setCardData({
      card_brand: "Visa",
      last4: "",
      exp_month: "12",
      exp_year: new Date().getFullYear().toString()
    });
    setCardModalOpen(true);
  };

  // Submit Handlers
  const handleAddSubmit = async (e) => {
    e.preventDefault();

    if (!formData.rep_id) {
      toast.error("Please assign a Sales Representative.");
      return;
    }
    if (!/^\d{5,6}$/.test(formData.zip)) {
      toast.error("ZIP Code must be 5 or 6 numeric digits.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error("Please enter a valid email format.");
      return;
    }

    setSubmitLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/doctors`,
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

      toast.success("Doctor practice profile registered successfully!");
      setAddModalOpen(false);
      fetchDoctorsAndReps();
    } catch (err) {
      toast.error(err.message || "Failed to create doctor profile.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();

    if (!formData.rep_id) {
      toast.error("Please assign a Sales Representative.");
      return;
    }
    if (!/^\d{5,6}$/.test(formData.zip)) {
      toast.error("ZIP Code must be 5 or 6 numeric digits.");
      return;
    }

    setSubmitLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/doctors/${selectedDoctor.id}`,
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

      toast.success("Doctor practice profile updated successfully!");
      setEditModalOpen(false);
      fetchDoctorsAndReps();
    } catch (err) {
      toast.error(err.message || "Failed to update doctor profile.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleReassignSubmit = async (e) => {
    e.preventDefault();
    if (!newRepId) {
      toast.error("Please select a representative.");
      return;
    }

    setSubmitLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/doctors/${selectedDoctor.id}/reassign`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ rep_id: newRepId })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to reassign representative.");
      }

      toast.success(result.message || "Representative reassigned successfully.");
      setReassignModalOpen(false);
      fetchDoctorsAndReps();
    } catch (err) {
      toast.error(err.message || "Failed to reassign representative.");
    } finally {
      setSubmitLoading(false);
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
        `${process.env.NEXT_PUBLIC_API_URL}/admin/doctors/${selectedDoctor.id}/card`,
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

      toast.success("Credit card saved on file successfully!");
      setCardModalOpen(false);
      fetchDoctorsAndReps();
    } catch (err) {
      toast.error(err.message || "Failed to save credit card on file.");
    } finally {
      setCardLoading(false);
    }
  };

  const filteredDoctors = doctors.filter(
    (doc) =>
      doc.practice_name.toLowerCase().includes(search.toLowerCase()) ||
      doc.doctor_first_name.toLowerCase().includes(search.toLowerCase()) ||
      doc.doctor_last_name.toLowerCase().includes(search.toLowerCase()) ||
      (doc.rep_name && doc.rep_name.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-brand-burgundy animate-spin" />
          <p className="text-slate-550 text-xs font-bold tracking-wider">Loading doctors directory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Manage Practice Accounts</h1>
          <p className="text-slate-500 text-xs mt-1 font-semibold">View doctor profiles, practice addresses, and manage their assigned sales representatives.</p>
        </div>
      <button
  onClick={handleOpenAdd}
  className="flex items-center gap-2 px-4 py-2.5 bg-black hover:bg-neutral-800 active:scale-[0.98] text-white text-xs font-bold rounded-xl shadow-md transition-all duration-200 cursor-pointer"
>
  <UserPlus className="w-4 h-4" />
  <span>Add Doctor</span>
</button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex gap-4 max-w-md">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
            <Search className="w-4.5 h-4.5" />
          </span>
          <input
            type="text"
            placeholder="Search by doctor name, practice, or rep..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs font-semibold glass-input shadow-sm"
          />
        </div>
      </div>

      {/* Doctors Table */}
      <div className="glass-panel rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto bg-white">
          {filteredDoctors.length === 0 ? (
            <div className="px-6 py-12 text-center text-slate-500 text-xs font-semibold">
              No practice accounts found matching search.
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-550 font-bold border-b border-slate-200">
                  <th className="px-6 py-3.5">Doctor & Practice</th>
                  <th className="px-6 py-3.5">Contacts</th>
                  <th className="px-6 py-3.5">Office Address</th>
                  <th className="px-6 py-3.5">Assigned Rep</th>
                  <th className="px-6 py-3.5">Billing Card</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDoctors.map((doc) => {
                  let cardInfo = null;
                  if (doc.stripe_customer_id && doc.stripe_customer_id.startsWith('{')) {
                    try {
                      cardInfo = JSON.parse(doc.stripe_customer_id);
                    } catch (e) {}
                  }
                  return (
                    <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-extrabold text-slate-900">Dr. {doc.doctor_first_name} {doc.doctor_last_name}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5 font-bold flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-brand-burgundy shrink-0" />
                          <span>{doc.practice_name}</span>
                        </div>
                        {!doc.active && (
                          <span className="inline-flex items-center gap-0.5 mt-1 px-1.5 py-0.2 rounded text-[8px] font-black bg-rose-50 text-rose-700 border border-rose-200 uppercase">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 space-y-0.5 font-medium">
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{doc.email}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{doc.phone}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-700">
                        <div className="font-semibold">{doc.address_line1}</div>
                        {doc.address_line2 && <div className="text-[10px] text-slate-500 font-semibold">{doc.address_line2}</div>}
                        <div className="text-[10px] text-slate-500 font-semibold">{doc.city}, {doc.state} {doc.zip}</div>
                      </td>
                      <td className="px-6 py-4">
                        {doc.rep_name ? (
                          <div>
                            <div className="font-bold text-slate-800">{doc.rep_name}</div>
                            <div className="text-[10px] text-slate-500 font-semibold">Rep ID: {doc.rep_number}</div>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                            <AlertCircle className="w-2.5 h-2.5" />
                            <span>UNASSIGNED</span>
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {cardInfo ? (
                          <div className="flex items-center gap-1.5 text-slate-750 font-bold">
                            <CreditCard className="w-4 h-4 text-brand-burgundy" />
                            <span>{cardInfo.brand} •••• {cardInfo.last4}</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-semibold italic">No Card Saved</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => handleOpenEdit(doc)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-slate-700 hover:bg-brand-burgundy-light hover:text-brand-burgundy border border-slate-200 font-bold transition-all cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5 text-black" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleOpenCard(doc)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-slate-700 hover:bg-brand-burgundy-light hover:text-brand-burgundy border border-slate-200 font-bold transition-all cursor-pointer"
                        >
                          <CreditCard className="w-3.5 h-3.5 text-black" />
                          <span>Card</span>
                        </button>
                        <button
                          onClick={() => handleOpenReassign(doc)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-slate-700 hover:bg-brand-burgundy-light hover:text-brand-burgundy border border-slate-200 font-bold transition-all cursor-pointer"
                        >
                          <GitMerge className="w-3.5 h-3.5 text-black" />
                          <span>Reassign</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add / Edit Doctor Modal */}
      {(addModalOpen || editModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="glass-card rounded-2xl border border-slate-200 p-6 w-full max-w-xl relative overflow-hidden shadow-2xl">
            <button
              onClick={() => { setAddModalOpen(false); setEditModalOpen(false); }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="mb-5 flex items-center gap-2">
              <Building className="w-5 h-5 text-black" />
              <h2 className="text-base font-extrabold text-slate-900">
                {addModalOpen ? "Register Practice Profile" : "Edit Practice Details"}
              </h2>
            </div>
            
            <form onSubmit={addModalOpen ? handleAddSubmit : handleEditSubmit} className="space-y-4 text-left">
              {/* Territory Sales Rep Selection */}
              <div>
                <label className="block text-slate-705 text-[10px] font-bold mb-1.5 uppercase tracking-wider">Territory Sales Representative</label>
                <select
                  required
                  value={formData.rep_id}
                  onChange={(e) => setFormData({ ...formData, rep_id: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl text-xs font-semibold glass-input cursor-pointer"
                >
                  <option value="">-- Assign sales rep --</option>
                  {reps.map((rep) => (
                    <option key={rep.id} value={rep.id}>
                      {rep.name} ({rep.rep_number})
                    </option>
                  ))}
                </select>
              </div>

              {/* Practice Name */}
              <div>
                <label className="block text-slate-750 text-[10px] font-bold mb-1.5 uppercase tracking-wider">Practice Name</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <Building2 className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="Grand Avenue Dental or Clinic Name"
                    value={formData.practice_name}
                    onChange={(e) => setFormData({ ...formData, practice_name: e.target.value })}
                    className="w-full pl-9 pr-4 py-2 rounded-xl text-xs font-semibold glass-input"
                  />
                </div>
              </div>

              {/* Doctor Name grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-750 text-[10px] font-bold mb-1.5 uppercase tracking-wider">Doctor First Name</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                      <User className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="Jane"
                      value={formData.doctor_first_name}
                      onChange={(e) => setFormData({ ...formData, doctor_first_name: e.target.value })}
                      className="w-full pl-9 pr-4 py-2 rounded-xl text-xs font-semibold glass-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-750 text-[10px] font-bold mb-1.5 uppercase tracking-wider">Doctor Last Name</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                      <User className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="Doe"
                      value={formData.doctor_last_name}
                      onChange={(e) => setFormData({ ...formData, doctor_last_name: e.target.value })}
                      className="w-full pl-9 pr-4 py-2 rounded-xl text-xs font-semibold glass-input"
                    />
                  </div>
                </div>
              </div>

              {/* Address info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-750 text-[10px] font-bold mb-1.5 uppercase tracking-wider">Address Line 1</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                      <MapPin className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="123 Main St"
                      value={formData.address_line1}
                      onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
                      className="w-full pl-9 pr-4 py-2 rounded-xl text-xs font-semibold glass-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-750 text-[10px] font-bold mb-1.5 uppercase tracking-wider">Address Line 2 (Optional)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                      <MapPin className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      placeholder="Suite 400"
                      value={formData.address_line2}
                      onChange={(e) => setFormData({ ...formData, address_line2: e.target.value })}
                      className="w-full pl-9 pr-4 py-2 rounded-xl text-xs font-semibold glass-input"
                    />
                  </div>
                </div>
              </div>

              {/* City State Zip Grid */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-750 text-[10px] font-bold mb-1.5 uppercase tracking-wider">City</label>
                  <input
                    type="text"
                    required
                    placeholder="Miami"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl text-xs font-semibold glass-input"
                  />
                </div>

                <div>
                  <label className="block text-slate-750 text-[10px] font-bold mb-1.5 uppercase tracking-wider">State</label>
                  <select
                    required
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl text-xs font-semibold glass-input cursor-pointer"
                  >
                    <option value="">-- State --</option>
                    {INDIA_STATES.map((st) => (
                      <option key={st.code} value={st.code}>{st.name} ({st.code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-750 text-[10px] font-bold mb-1.5 uppercase tracking-wider">ZIP / PIN Code</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="e.g. 380009"
                    value={formData.zip}
                    onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl text-xs font-semibold glass-input"
                  />
                </div>
              </div>

              {/* Contact info grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-750 text-[10px] font-bold mb-1.5 uppercase tracking-wider">Phone</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                      <Phone className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="305-555-0182"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full pl-9 pr-4 py-2 rounded-xl text-xs font-semibold glass-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-750 text-[10px] font-bold mb-1.5 uppercase tracking-wider">Email Address</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input
                      type="email"
                      required
                      placeholder="practice@email.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-9 pr-4 py-2 rounded-xl text-xs font-semibold glass-input"
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-slate-750 text-[10px] font-bold mb-1.5 uppercase tracking-wider">Internal Notes (Optional)</label>
                <textarea
                  placeholder="Additional clinic information..."
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl text-xs font-semibold glass-input resize-none"
                />
              </div>

              {/* Active Toggle (Edit Mode Only) */}
              {editModalOpen && (
                <div className="p-3 bg-brand-burgundy-light/60 rounded-xl border border-brand-burgundy/10 flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-bold text-slate-900">Active Status</label>
                    <span className="text-[10px] text-slate-500 font-semibold font-mono">Deactivated practices are excluded from sales catalog orders.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.active === 1}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked ? 1 : 0 })}
                    className="w-4 h-4 rounded text-brand-burgundy focus:ring-brand-burgundy bg-white border-slate-300 cursor-pointer"
                  />
                </div>
              )}

              <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setAddModalOpen(false); setEditModalOpen(false); }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
  type="submit"
  disabled={submitLoading}
  className="flex items-center gap-1.5 px-4 py-2.5 bg-black hover:bg-neutral-800 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
>
  {submitLoading ? (
    <Loader2 className="w-3.5 h-3.5 animate-spin" />
  ) : (
    <Save className="w-3.5 h-3.5" />
  )}
  <span>{addModalOpen ? "Register Profile" : "Save Changes"}</span>
</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reassign Rep Modal */}
      {reassignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="glass-card rounded-2xl border border-slate-200 p-6 w-full max-w-sm relative overflow-hidden shadow-2xl">
            <button
              onClick={() => setReassignModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="mb-5 flex items-center gap-2">
              <GitMerge className="w-5 h-5 text-black" />
              <h2 className="text-base font-extrabold text-slate-900">Reassign Account Territory</h2>
            </div>
            
            <form onSubmit={handleReassignSubmit} className="space-y-4 text-left">
              <p className="text-[10px] text-slate-505 font-bold leading-relaxed">
                Choose an active sales representative to handle the medical practice account of <strong>Dr. {selectedDoctor?.doctor_first_name} {selectedDoctor?.doctor_last_name}</strong> (<strong>{selectedDoctor?.practice_name}</strong>).
              </p>

              <div>
                <label className="block text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wider">Select Sales Representative</label>
                <select
                  required
                  value={newRepId}
                  onChange={(e) => setNewRepId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl text-xs font-semibold glass-input cursor-pointer"
                >
                  <option value="">-- Choose active rep --</option>
                  {reps.map((rep) => (
                    <option key={rep.id} value={rep.id}>
                      {rep.name} ({rep.rep_number})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setReassignModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-300 text-slate-650 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
               <button
  type="submit"
  disabled={submitLoading}
  className="flex items-center gap-1.5 px-4 py-2 bg-black hover:bg-gray-800 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
>
  {submitLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
  <span>Confirm Assignment</span>
</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Credit Card Modal */}
      {cardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="glass-card rounded-2xl border border-slate-200 p-6 w-full max-w-sm relative overflow-hidden shadow-2xl">
            <button
              onClick={() => setCardModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="mb-5 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-black" />
              <h2 className="text-base font-extrabold text-slate-900">Manage Card on File</h2>
            </div>
            
            <form onSubmit={handleCardSubmit} className="space-y-4 text-left">
              <p className="text-[10px] text-slate-505 font-bold leading-relaxed">
                Configure a mock Stripe credit card token on file for <strong>Dr. {selectedDoctor?.doctor_first_name} {selectedDoctor?.doctor_last_name}</strong>.
              </p>

              <div>
                <label className="block text-slate-705 text-[10px] font-bold mb-1.5 uppercase tracking-wider">Card Brand</label>
                <select
                  required
                  value={cardData.card_brand}
                  onChange={(e) => setCardData({ ...cardData, card_brand: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl text-xs font-semibold glass-input cursor-pointer"
                >
                  <option value="Visa">Visa</option>
                  <option value="Mastercard">Mastercard</option>
                  <option value="American Express">American Express</option>
                  <option value="Discover">Discover</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-705 text-[10px] font-bold mb-1.5 uppercase tracking-wider">Last 4 Digits</label>
                <input
                  type="text"
                  required
                  maxLength={4}
                  placeholder="4242"
                  value={cardData.last4}
                  onChange={(e) => setCardData({ ...cardData, last4: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl text-xs font-semibold glass-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-705 text-[10px] font-bold mb-1.5 uppercase tracking-wider">Exp Month</label>
                  <select
                    required
                    value={cardData.exp_month}
                    onChange={(e) => setCardData({ ...cardData, exp_month: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl text-xs font-semibold glass-input cursor-pointer"
                  >
                    {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0")).map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-705 text-[10px] font-bold mb-1.5 uppercase tracking-wider">Exp Year</label>
                  <select
                    required
                    value={cardData.exp_year}
                    onChange={(e) => setCardData({ ...cardData, exp_year: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl text-xs font-semibold glass-input cursor-pointer"
                  >
                    {Array.from({ length: 10 }, (_, i) => String(new Date().getFullYear() + i)).map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCardModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 text-slate-650 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
               <button
  type="submit"
  disabled={cardLoading}
  className="flex items-center gap-1.5 px-4 py-2 bg-black hover:bg-gray-800 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
>
  {cardLoading ? (
    <Loader2 className="w-3.5 h-3.5 animate-spin" />
  ) : (
    <Save className="w-3.5 h-3.5" />
  )}
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
