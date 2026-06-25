"use client";

import { useEffect, useState } from "react";
import {
  Layers, Search, Loader2, X, Plus, Minus,
  BarChart3, AlertTriangle, CheckCircle2, TrendingUp,
  RefreshCw, Package, Filter, Clock
} from "lucide-react";
import { useAuthStore } from "../../../store/authStore";
import { toast } from "sonner";

const API = () => process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function InventoryPage() {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState("all"); // all | low | out

  // Adjust modal
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [qty, setQty] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // Global audit log tab
  const [activeTab, setActiveTab] = useState("products"); // products | audit
  const [globalLogs, setGlobalLogs] = useState([]);
  const [globalLogsLoading, setGlobalLogsLoading] = useState(false);

  async function fetchInventory() {
    setLoading(true);
    try {
      const res = await fetch(`${API()}/admin/inventory`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to load inventory");
      setProducts(await res.json());
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchGlobalLogs() {
    setGlobalLogsLoading(true);
    try {
      const res = await fetch(`${API()}/admin/inventory/logs?limit=200`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to load audit log");
      setGlobalLogs(await res.json());
    } catch (e) {
      toast.error(e.message);
    } finally {
      setGlobalLogsLoading(false);
    }
  }

  useEffect(() => { if (token) fetchInventory(); }, [token]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === "audit" && globalLogs.length === 0) fetchGlobalLogs();
  };

  const openAdjust = async (product) => {
    setSelected(product);
    setQty("");
    setNotes("");
    setLogs([]);
    setAdjustOpen(true);
    setLogsLoading(true);
    try {
      const res = await fetch(`${API()}/admin/products/${product.id}/inventory-logs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to load logs");
      const data = await res.json();
      setLogs(Array.isArray(data) ? data : (data.logs || []));
    } catch (e) {
      toast.error("Could not load product history");
    } finally {
      setLogsLoading(false);
    }
  };

  const handleAdjust = async (e) => {
    e.preventDefault();
    const change = parseInt(qty);
    if (isNaN(change) || change === 0) {
      toast.error("Enter a non-zero quantity.");
      return;
    }
    if (!notes.trim()) {
      toast.error("Please add adjustment notes.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API()}/admin/products/${selected.id}/adjust-stock`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ quantity_change: change, notes })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      toast.success("Stock adjusted successfully!");
      setAdjustOpen(false);
      fetchInventory();
      if (activeTab === "audit") fetchGlobalLogs();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;
    if (stockFilter === "out") return (p.stock_cases || 0) === 0;
    if (stockFilter === "low") return (p.stock_cases || 0) > 0 && (p.stock_cases || 0) <= 10;
    return true;
  });

  const totalCases = products.reduce((s, p) => s + (p.stock_cases || 0), 0);
  const outCount = products.filter(p => (p.stock_cases || 0) === 0).length;
  const lowCount = products.filter(p => (p.stock_cases || 0) > 0 && (p.stock_cases || 0) <= 10).length;

  const fmt = (cents) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);

  const getStockBadge = (n) => {
    if (n === 0) return <span className="inline-flex items-center gap-1 text-[10px] font-black text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full"><AlertTriangle className="w-3 h-3" />OUT OF STOCK</span>;
    if (n <= 10) return <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full"><AlertTriangle className="w-3 h-3" />LOW — {n} cases</span>;
    return <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full"><CheckCircle2 className="w-3 h-3" />{n} cases</span>;
  };

  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    return `${(API()).replace("/api", "")}${path}`;
  };

  const txTypeBadge = (type) => {
    const map = {
      manual_adjustment: { label: "Manual", cls: "bg-blue-50 text-blue-700 border-blue-200" },
      order_deduction: { label: "Order Deducted", cls: "bg-rose-50 text-rose-700 border-rose-200" },
      order_returned: { label: "Return Restocked", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
      order_cancelled: { label: "Cancellation", cls: "bg-slate-50 text-slate-600 border-slate-200" },
    };
    const d = map[type] || { label: type, cls: "bg-slate-50 text-slate-600 border-slate-200" };
    return <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border ${d.cls}`}>{d.label}</span>;
  };

  if (loading) return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 text-brand-burgundy animate-spin" />
        <p className="text-slate-500 text-xs font-bold tracking-wider">Loading inventory data...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">Inventory Management</h1>
        <p className="text-slate-500 text-xs mt-1 font-semibold">Monitor stock levels, adjust quantities, and review the full transaction audit log.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Products", value: products.length, icon: Package, color: "indigo" },
          { label: "Total Cases In Stock", value: totalCases.toLocaleString(), icon: BarChart3, color: "emerald" },
          { label: "Low Stock Items", value: lowCount, icon: TrendingUp, color: "amber" },
          { label: "Out of Stock", value: outCount, icon: AlertTriangle, color: "rose" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">{label}</span>
              <span className="text-2xl font-black text-slate-800 mt-1 block">{value}</span>
            </div>
            <div className={`w-10 h-10 rounded-xl bg-${color}-50 border border-${color}-100 flex items-center justify-center text-${color}-600`}>
              <Icon className="w-5 h-5" />
            </div>
          </div>
        ))}
      </div>

      {/* Tab Switch */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {[{ id: "products", label: "Stock Overview" }, { id: "audit", label: "Global Audit Log" }].map(t => (
          <button key={t.id} onClick={() => handleTabChange(t.id)}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeTab === t.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "products" && (
        <div className="glass-panel rounded-2xl border border-slate-200 overflow-hidden shadow-sm bg-white">
          {/* Toolbar */}
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Search product or SKU..." value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl text-xs font-semibold glass-input" />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              {[["all","All"], ["low","Low Stock"], ["out","Out of Stock"]].map(([val, lbl]) => (
                <button key={val} onClick={() => setStockFilter(val)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${stockFilter === val ? "bg-brand-burgundy text-white border-brand-burgundy" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                  {lbl}
                </button>
              ))}
              <button onClick={fetchInventory} className="ml-1 p-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer">
                <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <th className="px-6 py-3.5 w-14">Image</th>
                  <th className="px-6 py-3.5">Product</th>
                  <th className="px-6 py-3.5">SKU</th>
                  <th className="px-6 py-3.5">Case Price</th>
                  <th className="px-6 py-3.5">Units/Case</th>
                  <th className="px-6 py-3.5">Stock Level</th>
                  <th className="px-6 py-3.5">Last Updated</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} className="px-6 py-12 text-center text-slate-400 text-xs font-semibold">No products match your filter.</td></tr>
                ) : filtered.map(p => {
                  let imgs = [];
                  try { imgs = typeof p.images === "string" ? JSON.parse(p.images) : (p.images || []); } catch (e) {}
                  const img = imgs[0] ? getImageUrl(imgs[0]) : null;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors font-semibold">
                      <td className="px-6 py-4">
                        {img ? <img src={img} alt={p.name} className="w-10 h-10 object-cover rounded-lg border border-slate-200" /> :
                          <div className="w-10 h-10 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center"><Package className="w-4 h-4 text-slate-400" /></div>}
                      </td>
                      <td className="px-6 py-4 font-black text-slate-900">{p.name}</td>
                      <td className="px-6 py-4 font-mono text-slate-600">{p.sku}</td>
                      <td className="px-6 py-4 font-bold text-slate-700">{fmt(p.case_price)}</td>
                      <td className="px-6 py-4 text-slate-700">{p.units_per_case} units</td>
                      <td className="px-6 py-4">{getStockBadge(p.stock_cases || 0)}</td>
                      <td className="px-6 py-4 text-[10px] text-slate-400">
                        {p.last_transaction_at
                          ? new Date(p.last_transaction_at).toLocaleDateString()
                          : <span className="italic">Never adjusted</span>}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => openAdjust(p)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-[11px] transition-all cursor-pointer">
                          <Layers className="w-3.5 h-3.5" /> Adjust Stock
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "audit" && (
        <div className="glass-panel rounded-2xl border border-slate-200 overflow-hidden shadow-sm bg-white">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Global Inventory Audit Log</h3>
            <button onClick={fetchGlobalLogs} className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            </button>
          </div>
          {globalLogsLoading ? (
            <div className="flex h-32 items-center justify-center"><Loader2 className="w-6 h-6 text-brand-burgundy animate-spin" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                    <th className="px-6 py-3.5">Product</th>
                    <th className="px-6 py-3.5">Type</th>
                    <th className="px-6 py-3.5 text-center">Change</th>
                    <th className="px-6 py-3.5">Notes</th>
                    <th className="px-6 py-3.5">By</th>
                    <th className="px-6 py-3.5">Date & Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {globalLogs.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-xs font-semibold italic">No inventory transactions recorded yet.</td></tr>
                  ) : globalLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors font-semibold">
                      <td className="px-6 py-3">
                        <div className="font-bold text-slate-900">{log.product_name || "—"}</div>
                        <div className="text-[10px] font-mono text-slate-400">{log.product_sku}</div>
                      </td>
                      <td className="px-6 py-3">{txTypeBadge(log.transaction_type)}</td>
                      <td className="px-6 py-3 text-center">
                        <span className={`font-black text-sm ${log.quantity_change > 0 ? "text-emerald-600" : "text-rose-600"}`}>
                          {log.quantity_change > 0 ? "+" : ""}{log.quantity_change}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-slate-600 max-w-[200px] truncate">{log.notes || "—"}</td>
                      <td className="px-6 py-3 text-slate-500">{log.admin_name || "System"}</td>
                      <td className="px-6 py-3 text-[10px] text-slate-400">
                        <div>{new Date(log.created_at).toLocaleDateString()}</div>
                        <div>{new Date(log.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Adjust Stock Modal */}
      {adjustOpen && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 w-full max-w-lg relative shadow-2xl flex flex-col max-h-[90vh]">
            <button onClick={() => setAdjustOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 cursor-pointer">
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-5 pb-4 border-b border-slate-100">
              <Layers className="w-5 h-5 text-indigo-600" />
              <div>
                <h2 className="text-base font-extrabold text-slate-900">Adjust Stock</h2>
                <p className="text-[10px] text-slate-500 font-semibold">{selected.name} — SKU: {selected.sku}</p>
              </div>
            </div>

            {/* Current stock pill */}
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Current Stock</span>
                <span className="text-xl font-black text-slate-900">{selected.stock_cases || 0}</span>
                <span className="text-[10px] text-slate-500 font-semibold"> cases</span>
              </div>
              <div className="text-slate-400 font-black">→</div>
              <div className="flex-1 p-3 bg-indigo-50 rounded-xl border border-indigo-200 text-center">
                <span className="text-[9px] text-indigo-700 font-bold uppercase tracking-wider block">After Adjustment</span>
                <span className={`text-xl font-black ${((selected.stock_cases || 0) + (parseInt(qty) || 0)) < 0 ? "text-rose-600" : "text-indigo-800"}`}>
                  {Math.max(0, (selected.stock_cases || 0) + (parseInt(qty) || 0))}
                </span>
                <span className="text-[10px] text-indigo-600 font-semibold"> cases</span>
              </div>
            </div>

            <form onSubmit={handleAdjust} className="space-y-4">
              <div>
                <label className="block text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wider">Quantity Change</label>
                <div className="flex gap-2 items-center">
                  <button type="button" onClick={() => setQty(q => String((parseInt(q) || 0) - 1))}
                    className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 transition-colors cursor-pointer">
                    <Minus className="w-4 h-4" />
                  </button>
                  <input type="number" required value={qty} onChange={e => setQty(e.target.value)}
                    placeholder="e.g. 50 or -10"
                    className="flex-1 px-4 py-2 rounded-xl text-sm font-black text-center glass-input border border-slate-200" />
                  <button type="button" onClick={() => setQty(q => String((parseInt(q) || 0) + 1))}
                    className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-600 transition-colors cursor-pointer">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 font-semibold mt-1">Use positive to add, negative to subtract.</p>
              </div>

              <div>
                <label className="block text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wider">Reason / Notes <span className="text-rose-500">*</span></label>
                <input type="text" required value={notes} onChange={e => setNotes(e.target.value)}
                  placeholder="e.g. Received new shipment, corrected count..."
                  className="w-full px-4 py-2 rounded-xl text-xs font-semibold glass-input border border-slate-200" />
              </div>

              <div className="flex justify-end gap-3 pt-1">
                <button type="button" onClick={() => setAdjustOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer">Cancel</button>
                <button type="submit" disabled={saving}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-brand-burgundy hover:bg-brand-burgundy-hover text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-60">
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  Save Adjustment
                </button>
              </div>
            </form>

            {/* Product-level log history */}
            <div className="mt-5 pt-4 border-t border-slate-100 overflow-y-auto max-h-[180px]">
              <div className="flex items-center gap-1.5 mb-2">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[10px] text-slate-700 font-black uppercase tracking-wider">Product Transaction History</span>
              </div>
              {logsLoading ? <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 text-slate-400 animate-spin" /></div>
                : logs.length === 0 ? <p className="text-[10px] text-slate-400 font-semibold italic">No transactions recorded yet.</p>
                : logs.map(log => (
                  <div key={log.id} className="flex items-start justify-between gap-3 py-2 border-b border-slate-50 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-black ${log.quantity_change > 0 ? "text-emerald-600" : "text-rose-600"}`}>
                        {log.quantity_change > 0 ? "+" : ""}{log.quantity_change}
                      </span>
                      <div>
                        <div className="text-[10px] text-slate-600 font-semibold">{log.notes || "—"}</div>
                        <div className="text-[9px] text-slate-400">{log.transaction_type} {log.admin_name ? `• ${log.admin_name}` : ""}</div>
                      </div>
                    </div>
                    <span className="text-[9px] text-slate-400 shrink-0">
                      {new Date(log.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
