"use client";

import { useEffect, useState } from "react";
import { 
  ShoppingBag, 
  Plus, 
  Edit, 
  Loader2, 
  Search, 
  X, 
  DollarSign, 
  Tag, 
  Layers, 
  CheckCircle,
  XCircle,
  FileCode2
} from "lucide-react";
import { useAuthStore } from "../../../store/authStore";
import { toast } from "sonner";

export default function ManageProducts() {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");

  // Modals state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Form states (with price represented as string to allow standard decimal typing)
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    case_price: "", // In dollars, e.g. "144.00"
    units_per_case: "",
    description: "",
    shopify_product_id: "",
    shopify_variant_id: "",
    active: 1
  });
  
  const [submitLoading, setSubmitLoading] = useState(false);

  async function fetchProducts() {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/admin/products`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (!response.ok) {
        throw new Error("Failed to load products.");
      }

      const result = await response.json();
      setProducts(result);
    } catch (err) {
      console.warn(err);
      toast.error("Failed to load products catalog.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) {
      fetchProducts();
    }
  }, [token]);

  const handleOpenAdd = () => {
    setFormData({
      name: "",
      sku: "",
      case_price: "",
      units_per_case: "",
      description: "",
      shopify_product_id: "",
      shopify_variant_id: "",
      active: 1
    });
    setAddModalOpen(true);
  };

  const handleOpenEdit = (prod) => {
    setSelectedProduct(prod);
    setFormData({
      name: prod.name,
      sku: prod.sku,
      case_price: (prod.case_price / 100).toFixed(2), // Convert cents to dollars string
      units_per_case: prod.units_per_case.toString(),
      description: prod.description || "",
      shopify_product_id: prod.shopify_product_id || "",
      shopify_variant_id: prod.shopify_variant_id || "",
      active: prod.active
    });
    setEditModalOpen(true);
  };

  // Create product submission
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    
    // Parse case price to cents (multiply by 100)
    const priceCents = Math.round(parseFloat(formData.case_price) * 100);
    if (isNaN(priceCents) || priceCents <= 0) {
      toast.error("Please enter a valid case price.");
      return;
    }

    setSubmitLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/admin/products`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            ...formData,
            case_price: priceCents,
            units_per_case: parseInt(formData.units_per_case)
          })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to add product.");
      }

      toast.success(result.message || "Product added to catalog successfully.");
      setAddModalOpen(false);
      fetchProducts();
    } catch (err) {
      toast.error(err.message || "Failed to create product.");
    } finally {
      setSubmitLoading(false);
    }
  };

  // Edit product submission
  const handleEditSubmit = async (e) => {
    e.preventDefault();

    const priceCents = Math.round(parseFloat(formData.case_price) * 100);
    if (isNaN(priceCents) || priceCents <= 0) {
      toast.error("Please enter a valid case price.");
      return;
    }

    setSubmitLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/admin/products/${selectedProduct.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            ...formData,
            case_price: priceCents,
            units_per_case: parseInt(formData.units_per_case)
          })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update product.");
      }

      toast.success(result.message || "Product details updated successfully.");
      setEditModalOpen(false);
      fetchProducts();
    } catch (err) {
      toast.error(err.message || "Failed to update product.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const filteredProducts = products.filter(
    (prod) =>
      prod.name.toLowerCase().includes(search.toLowerCase()) ||
      prod.sku.toLowerCase().includes(search.toLowerCase())
  );

  const formatPrice = (cents) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-brand-burgundy animate-spin" />
          <p className="text-slate-500 text-xs font-bold tracking-wider">Loading product catalog...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Wholesale Product Catalog</h1>
          <p className="text-slate-500 text-xs mt-1 font-semibold">Manage active product variants, set prices, and update Shopify Sync IDs.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-burgundy hover:bg-brand-burgundy-hover active:scale-[0.98] text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Product</span>
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
            placeholder="Search products by name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs font-semibold glass-input shadow-sm"
          />
        </div>
      </div>

      {/* Products Table */}
      <div className="glass-panel rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto bg-white">
          {filteredProducts.length === 0 ? (
            <div className="px-6 py-12 text-center text-slate-500 text-xs font-semibold">
              No products found matching the search.
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <th className="px-6 py-3.5">Product Name</th>
                  <th className="px-6 py-3.5">SKU Code</th>
                  <th className="px-6 py-3.5">Case Price</th>
                  <th className="px-6 py-3.5 text-center">Units / Case</th>
                  <th className="px-6 py-3.5">Shopify ID / Variant ID</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((prod) => (
                  <tr key={prod.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{prod.name}</div>
                      {prod.description && (
                        <div className="text-[10px] text-slate-550 mt-0.5 max-w-xs truncate font-semibold">{prod.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-700">{prod.sku}</td>
                    <td className="px-6 py-4 font-extrabold text-slate-800">{formatPrice(prod.case_price)}</td>
                    <td className="px-6 py-4 text-center font-bold text-slate-800">{prod.units_per_case}</td>
                    <td className="px-6 py-4">
                      {prod.shopify_product_id ? (
                        <div className="space-y-0.5 font-mono text-[9px] text-slate-500 font-semibold">
                          <div>P: {prod.shopify_product_id}</div>
                          <div>V: {prod.shopify_variant_id}</div>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-bold italic">Not synced</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {prod.active ? (
                        <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          <CheckCircle className="w-2.5 h-2.5" />
                          <span>ACTIVE</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-slate-505 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full">
                          <XCircle className="w-2.5 h-2.5" />
                          <span>INACTIVE</span>
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleOpenEdit(prod)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-slate-700 hover:bg-brand-burgundy-light hover:text-brand-burgundy border border-slate-200 font-bold transition-all cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5 text-brand-burgundy" />
                        <span>Edit</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Product Modal */}
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
              <ShoppingBag className="w-5 h-5 text-brand-burgundy" />
              <h2 className="text-base font-extrabold text-slate-900">Add New Product Variant</h2>
            </div>
            
            <form onSubmit={handleAddSubmit} className="space-y-4 text-left">
              <div>
                <label className="block text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wider">Product Name</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <Tag className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="Lipistry Lip Balm — Coral"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-9 pr-4 py-2 rounded-xl text-xs font-semibold glass-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wider">SKU Code</label>
                  <input
                    type="text"
                    required
                    placeholder="LIP-CORAL-05"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl text-xs font-semibold glass-input"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wider">Units per Case</label>
                  <input
                    type="number"
                    required
                    placeholder="12"
                    value={formData.units_per_case}
                    onChange={(e) => setFormData({ ...formData, units_per_case: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl text-xs font-semibold glass-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wider">Case Price (USD)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 font-bold text-xs">$</span>
                  <input
                    type="text"
                    required
                    placeholder="144.00"
                    value={formData.case_price}
                    onChange={(e) => setFormData({ ...formData, case_price: e.target.value })}
                    className="w-full pl-7 pr-4 py-2 rounded-xl text-xs font-semibold glass-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wider">Description (Optional)</label>
                <textarea
                  placeholder="Describe the product variant..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 rounded-xl text-xs font-semibold glass-input resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wider">Shopify Product ID (Optional)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                      <FileCode2 className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      placeholder="prod_12345"
                      value={formData.shopify_product_id}
                      onChange={(e) => setFormData({ ...formData, shopify_product_id: e.target.value })}
                      className="w-full pl-9 pr-4 py-2 rounded-xl text-xs font-semibold glass-input font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wider">Shopify Variant ID (Optional)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                      <Layers className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      placeholder="var_98765"
                      value={formData.shopify_variant_id}
                      onChange={(e) => setFormData({ ...formData, shopify_variant_id: e.target.value })}
                      className="w-full pl-9 pr-4 py-2 rounded-xl text-xs font-semibold glass-input font-mono"
                    />
                  </div>
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
                  className="flex items-center gap-1.5 px-4 py-2 bg-brand-burgundy hover:bg-brand-burgundy-hover text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
                >
                  {submitLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Create Product</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
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
              <Edit className="w-5 h-5 text-brand-burgundy" />
              <h2 className="text-base font-extrabold text-slate-900">Edit Product Details</h2>
            </div>
            
            <form onSubmit={handleEditSubmit} className="space-y-4 text-left">
              <div>
                <label className="block text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wider">Product Name</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <Tag className="w-4 h-4" />
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wider">SKU Code</label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl text-xs font-semibold glass-input"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wider">Units per Case</label>
                  <input
                    type="number"
                    required
                    value={formData.units_per_case}
                    onChange={(e) => setFormData({ ...formData, units_per_case: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl text-xs font-semibold glass-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wider">Case Price (USD)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 font-bold text-xs">$</span>
                  <input
                    type="text"
                    required
                    value={formData.case_price}
                    onChange={(e) => setFormData({ ...formData, case_price: e.target.value })}
                    className="w-full pl-7 pr-4 py-2 rounded-xl text-xs font-semibold glass-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wider">Description (Optional)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 rounded-xl text-xs font-semibold glass-input resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wider">Shopify Product ID (Optional)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                      <FileCode2 className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      value={formData.shopify_product_id}
                      onChange={(e) => setFormData({ ...formData, shopify_product_id: e.target.value })}
                      className="w-full pl-9 pr-4 py-2 rounded-xl text-xs font-semibold glass-input font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wider">Shopify Variant ID (Optional)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                      <Layers className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      value={formData.shopify_variant_id}
                      onChange={(e) => setFormData({ ...formData, shopify_variant_id: e.target.value })}
                      className="w-full pl-9 pr-4 py-2 rounded-xl text-xs font-semibold glass-input font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Status Toggle */}
              <div className="p-3 bg-brand-burgundy-light/60 rounded-xl border border-brand-burgundy/10 flex items-center justify-between">
                <div>
                  <label className="block text-xs font-bold text-slate-900">Active Status</label>
                  <span className="text-[10px] text-slate-500 font-semibold">Inactive products are immediately hidden from representatives.</span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.active === 1 || formData.active === true}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked ? 1 : 0 })}
                  className="w-4 h-4 rounded text-brand-burgundy focus:ring-brand-burgundy bg-white border-slate-350 cursor-pointer"
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
                  className="flex items-center gap-1.5 px-4 py-2 bg-brand-burgundy hover:bg-brand-burgundy-hover text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
                >
                  {submitLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
