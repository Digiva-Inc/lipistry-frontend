"use client";

import { useEffect, useState } from "react";
import { 
  Users, 
  UserPlus, 
  Key, 
  Edit, 
  Loader2, 
  Search, 
  X, 
  User, 
  Mail, 
  FileKey,
  Phone,
  CheckCircle,
  XCircle
} from "lucide-react";
import { useAuthStore } from "../../../store/authStore";
import { toast } from "sonner";

export default function ManageReps() {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [reps, setReps] = useState([]);
  const [search, setSearch] = useState("");

  // Modals state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [selectedRep, setSelectedRep] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    rep_number: "",
    phone: "",
    password: "",
    active: 1
  });
  
  const [newPassword, setNewPassword] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);

  async function fetchReps() {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/reps`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (!response.ok) {
        throw new Error("Failed to load representatives.");
      }

      const result = await response.json();
      setReps(result);
    } catch (err) {
      console.warn(err);
      toast.error("Failed to load representatives.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) {
      fetchReps();
    }
  }, [token]);

  const handleOpenAdd = () => {
    setFormData({ name: "", email: "", rep_number: "", phone: "", password: "", active: 1 });
    setAddModalOpen(true);
  };

  const handleOpenEdit = (rep) => {
    setSelectedRep(rep);
    setFormData({
      name: rep.name,
      email: rep.email,
      rep_number: rep.rep_number,
      phone: rep.phone || "",
      active: rep.active
    });
    setEditModalOpen(true);
  };

  const handleOpenReset = (rep) => {
    setSelectedRep(rep);
    setNewPassword("");
    setResetModalOpen(true);
  };

  // Create rep submission
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/reps`,
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
        throw new Error(result.error || "Failed to add representative.");
      }

      toast.success(result.message || "Representative created successfully.");
      setAddModalOpen(false);
      fetchReps();
    } catch (err) {
      toast.error(err.message || "Failed to create representative.");
    } finally {
      setSubmitLoading(false);
    }
  };

  // Edit rep submission
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/reps/${selectedRep.id}`,
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
        throw new Error(result.error || "Failed to update representative.");
      }

      toast.success(result.message || "Representative updated successfully.");
      setEditModalOpen(false);
      fetchReps();
    } catch (err) {
      toast.error(err.message || "Failed to update representative.");
    } finally {
      setSubmitLoading(false);
    }
  };

  // Password reset submission
  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (newPassword.trim().length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }
    setSubmitLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/reps/${selectedRep.id}/reset-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ password: newPassword })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to reset password.");
      }

      toast.success(result.message || "Representative password reset successfully.");
      setResetModalOpen(false);
    } catch (err) {
      toast.error(err.message || "Failed to reset password.");
    } finally {
      setSubmitLoading(false);
    }
  };

  // Filter reps list by search query
  const filteredReps = reps.filter(
    (rep) =>
      rep.name.toLowerCase().includes(search.toLowerCase()) ||
      rep.email.toLowerCase().includes(search.toLowerCase()) ||
      rep.rep_number.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-brand-burgundy animate-spin" />
          <p className="text-slate-500 text-xs font-bold tracking-wider">Loading sales reps directory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Manage Sales Representatives</h1>
          <p className="text-slate-500 text-xs mt-1 font-semibold">Register new reps, modify accounts, and deactivate active listings.</p>
        </div>
        <button
  onClick={handleOpenAdd}
  className="flex items-center gap-2 px-4 py-2.5 bg-black hover:bg-neutral-800 active:scale-[0.98] text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
>
  <UserPlus className="w-4 h-4" />
  <span>Add New Rep</span>
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
            placeholder="Search by name, email, or rep ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
        className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs font-semibold glass-input"
        />
        </div>
      </div>

      {/* Reps Table */}
      <div className="glass-panel rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto bg-white">
          {filteredReps.length === 0 ? (
            <div className="px-6 py-12 text-center text-slate-500 text-xs font-semibold">
              No sales representatives found matching the search.
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <th className="px-6 py-3.5">Name</th>
                  <th className="px-6 py-3.5">Rep ID</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-center">Doctors</th>
                  <th className="px-6 py-3.5 text-center">Orders</th>
                  <th className="px-6 py-3.5">Created Date</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReps.map((rep) => (
                  <tr key={rep.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{rep.name}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5 font-semibold">{rep.email}</div>
                      {rep.phone && <div className="text-[10px] text-slate-500 font-semibold">{rep.phone}</div>}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-800">{rep.rep_number}</td>
                    <td className="px-6 py-4">
                      {rep.active ? (
                        <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          <CheckCircle className="w-2.5 h-2.5" />
                          <span>ACTIVE</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full">
                          <XCircle className="w-2.5 h-2.5" />
                          <span>INACTIVE</span>
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center font-extrabold text-slate-800">{rep.doctor_count}</td>
                    <td className="px-6 py-4 text-center font-extrabold text-slate-800">{rep.order_count}</td>
                    <td className="px-6 py-4 text-slate-600 font-semibold">
                      {new Date(rep.created_at).toLocaleDateString("en-IN", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => handleOpenEdit(rep)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-slate-700 hover:bg-brand-burgundy-light hover:text-brand-burgundy border border-slate-200 font-bold transition-all cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5 text-slate-800" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleOpenReset(rep)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-slate-700 hover:bg-brand-burgundy-light hover:text-brand-burgundy border border-slate-200 font-bold transition-all cursor-pointer"
                      >
                        <Key className="w-3.5 h-3.5 text-slate-800" />
                        <span>Reset PW</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Rep Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="glass-card rounded-2xl border border-slate-200 p-6 w-full max-w-md relative overflow-hidden shadow-2xl">
            <button
              onClick={() => setAddModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="mb-5 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-black" />
              <h2 className="text-base font-extrabold text-slate-900">Add New Representative</h2>
            </div>
            
            <form onSubmit={handleAddSubmit} className="space-y-4 text-left">
              <div>
                <label className="block text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wider">Full Name</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="John Smith"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-9 pr-4 py-2 rounded-xl text-xs font-semibold glass-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wider">Email Address</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    required
                    placeholder="jsmith@lipistry.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-9 pr-4 py-2 rounded-xl text-xs font-semibold glass-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wider">Rep ID Number</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                      <FileKey className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="REP-00099"
                      value={formData.rep_number}
                      onChange={(e) => setFormData({ ...formData, rep_number: e.target.value })}
                      className="w-full pl-9 pr-4 py-2 rounded-xl text-xs font-semibold glass-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wider">Phone (Optional)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                      <Phone className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      placeholder="1-800-555-0199"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full pl-9 pr-4 py-2 rounded-xl text-xs font-semibold glass-input"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wider">Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <Key className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-9 pr-4 py-2 rounded-xl text-xs font-semibold glass-input"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
              <button
  type="submit"
  disabled={submitLoading}
  className="flex items-center gap-1.5 px-4 py-2 bg-black hover:bg-neutral-800 active:scale-[0.98] text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
>
  {submitLoading ? (
    <Loader2 className="w-3.5 h-3.5 animate-spin" />
  ) : null}

  <span>Create Rep</span>
</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Rep Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="glass-card rounded-2xl border border-slate-200 p-6 w-full max-w-md relative overflow-hidden shadow-2xl">
            <button
              onClick={() => setEditModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="mb-5 flex items-center gap-2">
              <Edit className="w-5 h-5 text-black" />
              <h2 className="text-base font-extrabold text-slate-900">Edit Representative Details</h2>
            </div>
            
            <form onSubmit={handleEditSubmit} className="space-y-4 text-left">
              <div>
                <label className="block text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wider">Full Name</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-9 pr-4 py-2 rounded-xl text-xs font-semibold glass-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wider">Email Address</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-9 pr-4 py-2 rounded-xl text-xs font-semibold glass-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wider">Rep ID Number</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                      <FileKey className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      required
                      value={formData.rep_number}
                      onChange={(e) => setFormData({ ...formData, rep_number: e.target.value })}
                      className="w-full pl-9 pr-4 py-2 rounded-xl text-xs font-semibold glass-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wider">Phone</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                      <Phone className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full pl-9 pr-4 py-2 rounded-xl text-xs font-semibold glass-input"
                    />
                  </div>
                </div>
              </div>

              {/* Status Toggle */}
              <div className="p-3 bg-brand-burgundy-light/60 rounded-xl border border-brand-burgundy/10 flex items-center justify-between">
                <div>
                  <label className="block text-xs font-bold text-slate-900">Active Status</label>
                  <span className="text-[10px] text-slate-500 font-semibold">Deactivated reps are blocked from logging in.</span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.active === 1 || formData.active === true}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked ? 1 : 0 })}
                  className="w-4 h-4 rounded text-brand-burgundy focus:ring-brand-burgundy bg-white border-slate-300 cursor-pointer"
                />
              </div>

              <div className="pt-3 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
               <button
  type="submit"
  disabled={submitLoading}
  className="flex items-center gap-1.5 px-4 py-2 bg-black hover:bg-gray-800 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
>
  {submitLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
  <span>Save Changes</span>
</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="glass-card rounded-2xl border border-slate-200 p-6 w-full max-w-sm relative overflow-hidden shadow-2xl">
            <button
              onClick={() => setResetModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="mb-5 flex items-center gap-2">
              <Key className="w-5 h-5 text-black" />
              <h2 className="text-base font-extrabold text-slate-900">Reset Representative Password</h2>
            </div>
            
            <form onSubmit={handleResetSubmit} className="space-y-4 text-left">
              <p className="text-[10px] text-slate-505 font-bold leading-relaxed">
                Resetting password for <strong>{selectedRep?.name}</strong>. Enter a new password below (minimum 6 characters).
              </p>

              <div>
                <label className="block text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wider">New Password</label>
                <input
                  type="password"
                  required
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl text-xs font-semibold glass-input"
                />
              </div>

              <div className="pt-3 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setResetModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
             <button
  type="submit"
  disabled={submitLoading}
  className="flex items-center gap-1.5 px-4 py-2 bg-black hover:bg-gray-800 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
>
  {submitLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
  <span>Reset Password</span>
</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
