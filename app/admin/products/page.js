"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  FileCode2,
  Eye
} from "lucide-react";
import { useAuthStore } from "../../../store/authStore";
import { toast } from "sonner";

export default function ManageProducts() {
  const router = useRouter();
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");

  // Modals state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Form states (with price represented as string to allow standard decimal typing)
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    case_price: "", // In dollars, e.g. "144.00"
    units_per_case: "",
    description: "",
    active: 1
  });

  const [uploadedImages, setUploadedImages] = useState([]);
  const [submitLoading, setSubmitLoading] = useState(false);

  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    const baseUrl = (process.env.NEXT_PUBLIC_API_URL).replace("/api", "");
    return `${baseUrl}${path}`;
  };

  async function fetchProducts() {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/products`,
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
      active: 1
    });
    setUploadedImages([]);
    setAddModalOpen(true);
  };

  const handleOpenView = (prod) => {
    setSelectedProduct(prod);
    setViewModalOpen(true);
  };

  const handleOpenEdit = (prod) => {
    setSelectedProduct(prod);
    setFormData({
      name: prod.name,
      sku: prod.sku,
      case_price: (prod.case_price / 100).toFixed(2), // Convert cents to dollars string
      units_per_case: prod.units_per_case.toString(),
      description: prod.description || "",
      active: prod.active
    });
    
    // Parse images array
    let parsedImages = [];
    if (prod.images) {
      try {
        parsedImages = typeof prod.images === "string" ? JSON.parse(prod.images) : prod.images;
      } catch (e) {
        parsedImages = [];
      }
    }
    setUploadedImages(Array.isArray(parsedImages) ? parsedImages : []);
    setEditModalOpen(true);
  };

  // Image Upload handler
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const uploadFormData = new FormData();
    files.forEach((file) => {
      uploadFormData.append("files", file);
    });

    const uploadToast = toast.loading("Uploading images...");

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/products/upload`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: uploadFormData
        }
      );

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to upload images.");
      }

      setUploadedImages((prev) => [...prev, ...result.urls]);
      toast.success("Images uploaded successfully!", { id: uploadToast });
    } catch (err) {
      toast.error(err.message || "Failed to upload images.", { id: uploadToast });
    }
  };

  const handleRemoveImage = (indexToRemove) => {
    setUploadedImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
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
        `${process.env.NEXT_PUBLIC_API_URL}/admin/products`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            ...formData,
            case_price: priceCents,
            units_per_case: parseInt(formData.units_per_case),
            images: uploadedImages
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
        `${process.env.NEXT_PUBLIC_API_URL}/admin/products/${selectedProduct.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            ...formData,
            case_price: priceCents,
            units_per_case: parseInt(formData.units_per_case),
            images: uploadedImages
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

  // Redirect to Inventory page for stock management
  const handleOpenAdjustStock = (prod) => {
    router.push("/admin/inventory");
  };


  const filteredProducts = products.filter(
    (prod) =>
      prod.name.toLowerCase().includes(search.toLowerCase()) ||
      prod.sku.toLowerCase().includes(search.toLowerCase())
  );

  const formatPrice = (cents) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
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
          <p className="text-slate-500 text-xs mt-1 font-semibold">Manage active product variants and set prices.</p>
        </div>
       <button
  onClick={handleOpenAdd}
  className="flex items-center gap-2 px-4 py-2.5 bg-black hover:bg-neutral-800 active:scale-[0.98] text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
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
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs font-semibold glass-input shadow-sm border border-gray-300 focus:outline-none focus:ring-0 focus:ring-transparent focus:border-black focus:shadow-none"
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
                <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 text-[10px] uppercase tracking-wider whitespace-nowrap">
                  <th className="px-6 py-3.5 w-16">Image</th>
                  <th className="px-6 py-3.5">Product Name</th>
                  <th className="px-6 py-3.5">SKU Code</th>
                  <th className="px-6 py-3.5">Case Price</th>
                  <th className="px-6 py-3.5 text-center">Units / Case</th>
                  <th className="px-6 py-3.5 text-center">Available Stock</th>
                  <th className="px-6 py-3.5 text-center">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((prod) => {
                  let imgUrl = null;
                  if (prod.images) {
                    try {
                      const parsed = typeof prod.images === "string" ? JSON.parse(prod.images) : prod.images;
                      if (Array.isArray(parsed) && parsed.length > 0) {
                        imgUrl = parsed[0];
                      }
                    } catch (e) {}
                  }

                  return (
                    <tr key={prod.id} className="hover:bg-slate-50/50 transition-colors align-middle">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {imgUrl ? (
                          <a 
                            href={getImageUrl(imgUrl)} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="block cursor-pointer hover:opacity-80 transition-opacity w-10 h-10"
                          >
                            <img 
                              src={getImageUrl(imgUrl)} 
                              alt={prod.name} 
                              className="w-10 h-10 object-cover rounded-lg border border-slate-200 shadow-sm" 
                            />
                          </a>
                        ) : (
                          <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200 text-slate-400">
                            <ShoppingBag className="w-5 h-5" />
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-extrabold text-slate-900 text-xs">{prod.name}</div>
                        {prod.description && (
                          <div className="text-[10px] text-slate-500 mt-0.5 max-w-xs truncate font-medium">{prod.description}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 font-mono text-[10px] font-bold text-slate-600 bg-slate-50 border border-slate-200 rounded">
                          {prod.sku}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-black text-slate-900 whitespace-nowrap">{formatPrice(prod.case_price)}</td>
                      <td className="px-6 py-4 text-center font-bold text-slate-700 whitespace-nowrap">{prod.units_per_case}</td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                          (prod.stock_cases || 0) > 10
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : (prod.stock_cases || 0) > 0
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-rose-50 text-rose-700 border-rose-200"
                        }`}>
                          {prod.stock_cases !== undefined ? prod.stock_cases : 0} cases
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        {prod.active ? (
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
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenAdjustStock(prod)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-slate-700 bg-indigo-50/50 hover:bg-indigo-100 hover:text-indigo-700 border border-indigo-100 font-bold transition-all cursor-pointer shadow-sm text-[11px]"
                          >
                            <Layers className="w-3.5 h-3.5 text-indigo-650" />
                            <span>Stock</span>
                          </button>
                          <button
                            onClick={() => handleOpenView(prod)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-slate-700 hover:bg-slate-100 border border-slate-200 font-bold transition-all cursor-pointer shadow-sm"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-500" />
                            <span>View</span>
                          </button>
                          <button
                            onClick={() => handleOpenEdit(prod)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-slate-700 hover:bg-brand-burgundy-light hover:text-brand-burgundy border border-slate-200 font-bold transition-all cursor-pointer shadow-sm"
                          >
                            <Edit className="w-3.5 h-3.5 text-slate-900" />
                            <span>Edit</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Product Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="glass-card rounded-2xl border border-slate-205 p-6 w-full max-w-lg relative overflow-y-auto max-h-[90vh] shadow-2xl">
            <button
              onClick={() => setAddModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="mb-5 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-black" />
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

              {/* Product Images Uploader */}
              <div>
                <label className="block text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wider">Product Images</label>
                <div className="space-y-3">
                  {uploadedImages.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 border border-slate-200 p-2.5 rounded-xl bg-slate-50">
                      {uploadedImages.map((imgUrl, idx) => (
                        <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 bg-white">
                          <a href={getImageUrl(imgUrl)} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                            <img src={getImageUrl(imgUrl)} alt="Preview" className="w-full h-full object-cover hover:opacity-85 transition-opacity cursor-pointer" />
                          </a>
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            className="absolute top-1 right-1 p-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded-full transition-colors cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100/50 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-4 pb-4">
                        <Plus className="w-6 h-6 text-slate-400 mb-1" />
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Upload Product Images (Multiple)</p>
                        <p className="text-[9px] text-slate-400 font-medium mt-0.5">PNG, JPG, JPEG up to 5MB</p>
                      </div>
                      <input 
                        type="file" 
                        multiple 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleImageUpload} 
                      />
                    </label>
                  </div>
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

              <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
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
  className="flex items-center gap-1.5 px-4 py-2.5 bg-black hover:bg-neutral-800 active:scale-[0.98] text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
>
  {submitLoading ? (
    <Loader2 className="w-3.5 h-3.5 animate-spin" />
  ) : null}

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
          <div className="glass-card rounded-2xl border border-slate-205 p-6 w-full max-w-lg relative overflow-y-auto max-h-[90vh] shadow-2xl">
            <button
              onClick={() => setEditModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="mb-5 flex items-center gap-2">
              <Edit className="w-5 h-5 text-black" />
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

              {/* Product Images Uploader */}
              <div>
                <label className="block text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wider">Product Images</label>
                <div className="space-y-3">
                  {uploadedImages.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 border border-slate-202 p-2.5 rounded-xl bg-slate-55">
                      {uploadedImages.map((imgUrl, idx) => (
                        <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 bg-white">
                          <a href={getImageUrl(imgUrl)} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                            <img src={getImageUrl(imgUrl)} alt="Preview" className="w-full h-full object-cover hover:opacity-85 transition-opacity cursor-pointer" />
                          </a>
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            className="absolute top-1 right-1 p-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded-full transition-colors cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100/50 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-4 pb-4">
                        <Plus className="w-6 h-6 text-slate-400 mb-1" />
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Upload Product Images (Multiple)</p>
                        <p className="text-[9px] text-slate-400 font-medium mt-0.5">PNG, JPG, JPEG up to 5MB</p>
                      </div>
                      <input 
                        type="file" 
                        multiple 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleImageUpload} 
                      />
                    </label>
                  </div>
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

              <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
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
  className="flex items-center gap-1.5 px-4 py-2.5 bg-black hover:bg-gray-800 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
>
  {submitLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
  <span>Save Changes</span>
</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Product Modal */}
      {viewModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="glass-card rounded-2xl border border-slate-200 p-6 w-full max-w-xl relative overflow-y-auto max-h-[90vh] shadow-2xl flex flex-col">
            <button
              onClick={() => setViewModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="mb-5 flex items-center gap-2 shrink-0">
              <Eye className="w-5 h-5 text-black" />
              <h2 className="text-base font-extrabold text-slate-900">Product Details</h2>
            </div>

            <div className="space-y-6 overflow-y-auto pr-1 flex-1 text-left">
              <div>
                <h3 className="text-sm font-black text-slate-800">{selectedProduct.name}</h3>
                {selectedProduct.description && (
                  <p className="text-xs text-slate-500 font-semibold mt-1 leading-relaxed whitespace-pre-line">{selectedProduct.description}</p>
                )}
              </div>

              {/* Product Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1">SKU Code</span>
                  <span className="text-xs font-bold text-slate-800">{selectedProduct.sku}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Status</span>
                  {selectedProduct.active ? (
                    <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full mt-1">
                      <CheckCircle className="w-2.5 h-2.5" />
                      <span>ACTIVE</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-slate-505 bg-slate-55 border border-slate-200 px-2 py-0.5 rounded-full mt-1">
                      <XCircle className="w-2.5 h-2.5" />
                      <span>INACTIVE</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Price Details */}
              <div className="grid grid-cols-3 gap-4 bg-brand-burgundy-light/35 p-4 rounded-xl border border-brand-burgundy/10">
                <div>
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Case Price</span>
                  <span className="text-brand-burgundy font-black text-xs block mt-0.5">{formatPrice(selectedProduct.case_price)}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Units / Case</span>
                  <span className="text-slate-800 font-extrabold text-xs block mt-0.5">{selectedProduct.units_per_case}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Unit Cost</span>
                  <span className="text-slate-800 font-extrabold text-xs block mt-0.5">
                    {formatPrice(Math.round(selectedProduct.case_price / selectedProduct.units_per_case))}
                  </span>
                </div>
              </div>
              {/* Local Inventory Stock */}
              <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                <span className="text-[9px] text-emerald-800 font-bold uppercase tracking-wider block mb-1">Available Stock</span>
                <span className="text-xs font-black text-emerald-850 block mt-0.5">{selectedProduct.stock_cases !== undefined ? selectedProduct.stock_cases : 0} cases</span>
              </div>

              {/* Image Gallery */}
              <div className="space-y-3">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Product Images Gallery</span>
                {(() => {
                  let images = [];
                  if (selectedProduct.images) {
                    try {
                      images = typeof selectedProduct.images === "string" ? JSON.parse(selectedProduct.images) : selectedProduct.images;
                    } catch (e) {}
                  }
                  if (!Array.isArray(images) || images.length === 0) {
                    return (
                      <div className="p-8 text-center text-xs font-semibold text-slate-450 border border-dashed border-slate-300 rounded-xl bg-slate-50">
                        No images uploaded for this product.
                      </div>
                    );
                  }
                  return (
                    <div className="grid grid-cols-3 gap-3">
                      {images.map((img, idx) => (
                        <a 
                          key={idx} 
                          href={getImageUrl(img)} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="group relative aspect-square rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-white hover:border-brand-burgundy/50 hover:shadow-md transition-all duration-200 cursor-pointer"
                        >
                          <img 
                            src={getImageUrl(img)} 
                            alt={`${selectedProduct.name} ${idx + 1}`} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-[9px] text-white font-bold bg-black/50 px-2 py-1 rounded-full">Open Original</span>
                          </div>
                        </a>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 mt-6 flex justify-end shrink-0">
              <button
                onClick={() => setViewModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-300 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

