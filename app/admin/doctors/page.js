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
  AlertCircle
} from "lucide-react";
import { useAuthStore } from "../../../store/authStore";
import { toast } from "sonner";

export default function AllDoctors() {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState([]);
  const [reps, setReps] = useState([]);
  const [search, setSearch] = useState("");

  // Reassignment Modal State
  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [newRepId, setNewRepId] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);

  async function fetchDoctorsAndReps() {
    try {
      const [docsResponse, repsResponse] = await Promise.all([
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/admin/doctors`,
          { headers: { Authorization: `Bearer ${token}` } }
        ),
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/admin/reps`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
      ]);

      if (!docsResponse.ok || !repsResponse.ok) {
        throw new Error("Failed to load doctor directory or representatives.");
      }

      const docsResult = await docsResponse.json();
      const repsResult = await repsResponse.json();

      setDoctors(docsResult);
      // Only show active reps for territory reassignment
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

  const handleOpenReassign = (doc) => {
    setSelectedDoctor(doc);
    setNewRepId(doc.rep_id ? doc.rep_id.toString() : "");
    setReassignModalOpen(true);
  };

  // Reassign submission
  const handleReassignSubmit = async (e) => {
    e.preventDefault();
    if (!newRepId) {
      toast.error("Please select a representative.");
      return;
    }

    setSubmitLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/admin/doctors/${selectedDoctor.id}/reassign`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ rep_id: parseInt(newRepId) })
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

  const filteredDoctors = doctors.filter(
    (doc) =>
      doc.practice_name.toLowerCase().includes(search.toLowerCase()) ||
      doc.first_name.toLowerCase().includes(search.toLowerCase()) ||
      doc.last_name.toLowerCase().includes(search.toLowerCase()) ||
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
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">Manage Practice Accounts</h1>
        <p className="text-slate-500 text-xs mt-1 font-semibold">View doctor profiles, practice addresses, and manage their assigned sales representatives.</p>
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
                  <th className="px-6 py-3.5">Created Date</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDoctors.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-extrabold text-slate-900">Dr. {doc.first_name} {doc.last_name}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5 font-bold flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-brand-burgundy shrink-0" />
                        <span>{doc.practice_name}</span>
                      </div>
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
                    <td className="px-6 py-4 text-slate-600 font-semibold">
                      {new Date(doc.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleOpenReassign(doc)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-slate-700 hover:bg-brand-burgundy-light hover:text-brand-burgundy border border-slate-200 font-bold transition-all cursor-pointer animate-fadeIn"
                      >
                        <GitMerge className="w-3.5 h-3.5 text-brand-burgundy" />
                        <span>Reassign Rep</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

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
              <GitMerge className="w-5 h-5 text-brand-burgundy" />
              <h2 className="text-base font-extrabold text-slate-900">Reassign Account Territory</h2>
            </div>
            
            <form onSubmit={handleReassignSubmit} className="space-y-4 text-left">
              <p className="text-[10px] text-slate-505 font-bold leading-relaxed">
                Choose an active sales representative to handle the medical practice account of <strong>Dr. {selectedDoctor?.first_name} {selectedDoctor?.last_name}</strong> (<strong>{selectedDoctor?.practice_name}</strong>).
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
                  className="flex items-center gap-1.5 px-4 py-2 bg-brand-burgundy hover:bg-brand-burgundy-hover text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
                >
                  {submitLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Confirm Assignment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
