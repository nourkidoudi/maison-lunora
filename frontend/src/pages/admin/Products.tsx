import { useEffect, useState, useRef } from 'react';
import api from '../../api';
import { Plus, Pencil, Trash2, Eye, EyeOff, Upload, X, Layers, RefreshCw } from 'lucide-react';
import { getImageUrl } from '../../utils/imageUrl';
import type { ProductVariant } from '../../store/useStore';

interface Product {
  id: number;
  name: string;
  price: string;
  sale_price: string | null;
  category: string;
  images: string[];
  sizes?: string[];
  colors?: string[];
  stock: number;
  variants?: ProductVariant[];
  is_active: boolean;
}

const emptyForm = {
  name: '',
  description: '',
  price: '',
  sale_price: '',
  category: '',
  images: '',
  sizes: '',
  colors: '',
  stock: 0,
  is_active: true
};

const AdminProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchProducts = async () => {
    const { data } = await api.get('/products/admin/all');
    setProducts(data);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  // Synchronize or generate variants from sizes and colors input
  const handleGenerateVariants = () => {
    const sizeList = form.sizes ? form.sizes.split(',').map(s => s.trim()).filter(Boolean) : ['Unique'];
    const colorList = form.colors ? form.colors.split(',').map(s => s.trim()).filter(Boolean) : ['Unique'];

    const newVariants: ProductVariant[] = [];
    sizeList.forEach(s => {
      colorList.forEach(c => {
        // Keep existing stock if already present
        const existing = variants.find(v => v.size === s && v.color === c);
        newVariants.push({
          size: s,
          color: c,
          stock: existing ? existing.stock : (variants.length === 0 && form.stock > 0 ? Math.floor(form.stock / (sizeList.length * colorList.length)) : 0)
        });
      });
    });

    setVariants(newVariants);
    const sum = newVariants.reduce((acc, v) => acc + (parseInt(String(v.stock)) || 0), 0);
    if (sum > 0) setForm(prev => ({ ...prev, stock: sum }));
  };

  const handleVariantStockChange = (idx: number, newStock: number) => {
    const updated = [...variants];
    updated[idx] = { ...updated[idx], stock: Math.max(0, newStock) };
    setVariants(updated);
    const total = updated.reduce((sum, v) => sum + (parseInt(String(v.stock)) || 0), 0);
    setForm(prev => ({ ...prev, stock: total }));
  };

  const handleAddVariantRow = () => {
    setVariants(prev => [...prev, { size: 'S', color: 'Unique', stock: 1 }]);
  };

  const handleRemoveVariantRow = (idx: number) => {
    const updated = variants.filter((_, i) => i !== idx);
    setVariants(updated);
    const total = updated.reduce((sum, v) => sum + (parseInt(String(v.stock)) || 0), 0);
    setForm(prev => ({ ...prev, stock: total }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        price: parseFloat(form.price),
        sale_price: form.sale_price ? parseFloat(form.sale_price) : null,
        stock: parseInt(String(form.stock)) || 0,
        images: form.images ? form.images.split(',').map(s => s.trim()).filter(Boolean) : [],
        sizes: form.sizes ? form.sizes.split(',').map(s => s.trim()).filter(Boolean) : [],
        colors: form.colors ? form.colors.split(',').map(s => s.trim()).filter(Boolean) : [],
        variants: variants.map(v => ({
          size: v.size || 'Unique',
          color: v.color || 'Unique',
          stock: parseInt(String(v.stock)) || 0
        }))
      };

      if (editingId) {
        await api.put(`/products/${editingId}`, payload);
      } else {
        await api.post('/products', payload);
      }
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      setVariants([]);
      fetchProducts();
    } catch (err) {
      console.error('Erreur enregistrement produit:', err);
      alert('Erreur lors de la sauvegarde du produit.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (p: any) => {
    let parsedVariants: ProductVariant[] = [];
    try {
      parsedVariants = typeof p.variants === 'string' ? JSON.parse(p.variants) : (p.variants || []);
    } catch (e) {
      parsedVariants = [];
    }

    setForm({
      name: p.name,
      description: p.description || '',
      price: p.price,
      sale_price: p.sale_price || '',
      category: p.category || '',
      images: (p.images || []).join(', '),
      sizes: (p.sizes || []).join(', '),
      colors: (p.colors || []).join(', '),
      stock: p.stock,
      is_active: p.is_active
    });

    setVariants(parsedVariants);
    setEditingId(p.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) return;
    await api.delete(`/products/${id}`);
    fetchProducts();
  };

  const handleToggle = async (p: any) => {
    await api.put(`/products/${p.id}`, {
      ...p,
      images: p.images || [],
      sizes: p.sizes || [],
      colors: p.colors || [],
      variants: p.variants || [],
      is_active: !p.is_active
    });
    fetchProducts();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach(file => formData.append('images', file));
      const { data } = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const currentUrls = form.images ? form.images.split(',').map(s => s.trim()).filter(Boolean) : [];
      const newUrls = [...currentUrls, ...data.urls];
      setForm(prev => ({ ...prev, images: newUrls.join(', ') }));
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    const currentUrls = form.images ? form.images.split(',').map(s => s.trim()).filter(Boolean) : [];
    currentUrls.splice(index, 1);
    setForm(prev => ({ ...prev, images: currentUrls.join(', ') }));
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Gestion des Produits</h1>
          <p className="text-sm text-gray-500 mt-1">Créez et modifiez vos articles, prix, photos et stocks par taille.</p>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingId(null);
            setForm(emptyForm);
            setVariants([]);
          }}
          className="flex items-center gap-2 bg-brand-700 hover:bg-brand-800 text-white px-4 py-2.5 rounded-xl transition-all shadow-sm font-medium"
        >
          <Plus className="w-4 h-4" /> Ajouter un produit
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto p-6 space-y-5 border border-gray-100">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="text-xl font-bold text-gray-900">{editingId ? 'Modifier' : 'Ajouter'} un produit</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom du produit *</label>
                  <input required name="name" value={form.name} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-brand-500 focus:border-brand-500" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea name="description" value={form.description} onChange={handleChange} rows={2} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-brand-500 focus:border-brand-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prix (TND) *</label>
                  <input required type="number" step="0.01" name="price" value={form.price} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2.5" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prix promo (TND)</label>
                  <input type="number" step="0.01" name="sale_price" value={form.sale_price} onChange={handleChange} placeholder="Optionnel" className="w-full border border-gray-300 rounded-lg p-2.5" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
                  <input name="category" value={form.category} onChange={handleChange} placeholder="Ex: Robes, Hauts, Pantalons..." className="w-full border border-gray-300 rounded-lg p-2.5" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stock Total : <span className="font-bold text-brand-700">{form.stock}</span>
                  </label>
                  <input
                    type="number"
                    name="stock"
                    value={form.stock}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg p-2.5 bg-gray-50"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">Calculé automatiquement à partir des variantes.</p>
                </div>

                {/* Images Upload */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Images du produit</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="flex items-center justify-center gap-2 w-full border-2 border-dashed border-gray-300 rounded-lg p-3 hover:border-brand-400 hover:bg-brand-50 transition-colors disabled:opacity-50"
                  >
                    <Upload className="w-4 h-4 text-gray-500" />
                    <span className="text-xs text-gray-600 font-medium">{uploading ? 'Téléchargement...' : 'Télécharger des photos (JPG, PNG, WEBP)'}</span>
                  </button>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {form.images ? form.images.split(',').map(s => s.trim()).filter(Boolean).map((url, idx) => (
                      <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50 group">
                        <img
                          src={getImageUrl(url)}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )) : null}
                  </div>
                  <input name="images" value={form.images} onChange={handleChange} placeholder="URLs séparées par des virgules..." className="mt-2 w-full border border-gray-200 rounded-lg p-2 text-xs" />
                </div>

                {/* Sizes and Colors inputs */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tailles proposées</label>
                  <input name="sizes" value={form.sizes} onChange={handleChange} placeholder="Ex: S, M, L, XL" className="w-full border border-gray-300 rounded-lg p-2.5 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Couleurs proposées</label>
                  <input name="colors" value={form.colors} onChange={handleChange} placeholder="Ex: Noir, Blanc, Beige" className="w-full border border-gray-300 rounded-lg p-2.5 text-sm" />
                </div>

                {/* Stock per Variant (Size & Color) */}
                <div className="col-span-2 bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-brand-700" />
                      <h3 className="font-semibold text-sm text-gray-800">Gestion du stock par Taille & Couleur</h3>
                    </div>
                    <button
                      type="button"
                      onClick={handleGenerateVariants}
                      className="flex items-center gap-1.5 text-xs font-semibold bg-white border border-gray-300 hover:bg-brand-50 hover:text-brand-700 text-gray-700 px-3 py-1.5 rounded-lg shadow-sm transition-all"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Générer à partir des tailles/couleurs</span>
                    </button>
                  </div>

                  {variants.length === 0 ? (
                    <div className="text-center py-4 text-xs text-gray-500 bg-white rounded-lg border border-dashed border-gray-200">
                      <p>Aucune variante configurée (le stock global de {form.stock} sera utilisé).</p>
                      <button
                        type="button"
                        onClick={handleGenerateVariants}
                        className="mt-2 text-brand-600 font-semibold hover:underline"
                      >
                        Cliquez ici pour générer le tableau des stocks par taille
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="max-h-52 overflow-y-auto rounded-lg border border-gray-200 bg-white">
                        <table className="w-full text-xs">
                          <thead className="bg-gray-100 text-gray-600 font-semibold sticky top-0">
                            <tr>
                              <th className="text-left p-2.5">Taille</th>
                              <th className="text-left p-2.5">Couleur</th>
                              <th className="text-center p-2.5">Stock disponible</th>
                              <th className="text-center p-2.5 w-12">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {variants.map((v, idx) => (
                              <tr key={idx} className={v.stock === 0 ? 'bg-red-50/50' : ''}>
                                <td className="p-2">
                                  <input
                                    type="text"
                                    value={v.size}
                                    onChange={e => {
                                      const updated = [...variants];
                                      updated[idx].size = e.target.value;
                                      setVariants(updated);
                                    }}
                                    className="w-full border border-gray-200 rounded px-2 py-1 font-semibold"
                                  />
                                </td>
                                <td className="p-2">
                                  <input
                                    type="text"
                                    value={v.color}
                                    onChange={e => {
                                      const updated = [...variants];
                                      updated[idx].color = e.target.value;
                                      setVariants(updated);
                                    }}
                                    className="w-full border border-gray-200 rounded px-2 py-1"
                                  />
                                </td>
                                <td className="p-2 text-center">
                                  <input
                                    type="number"
                                    min="0"
                                    value={v.stock}
                                    onChange={e => handleVariantStockChange(idx, parseInt(e.target.value) || 0)}
                                    className={`w-20 border rounded px-2 py-1 text-center font-bold ${
                                      v.stock === 0 ? 'border-red-400 bg-red-50 text-red-600' : 'border-gray-200 text-gray-800'
                                    }`}
                                  />
                                </td>
                                <td className="p-2 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveVariantRow(idx)}
                                    className="text-gray-400 hover:text-red-500 p-1"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="flex justify-between items-center pt-1">
                        <button
                          type="button"
                          onClick={handleAddVariantRow}
                          className="text-xs text-brand-600 font-semibold hover:underline flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" /> Ajouter une variante manuellement
                        </button>
                        <span className="text-xs font-bold text-gray-700">
                          Total : <span className="text-brand-700">{form.stock} pièces</span>
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="col-span-2 flex items-center gap-2">
                  <input type="checkbox" name="is_active" id="is_active" checked={form.is_active} onChange={handleChange} />
                  <label htmlFor="is_active" className="text-sm font-medium text-gray-700">Produit visible sur la boutique</label>
                </div>
              </div>

              <div className="flex gap-3 pt-3 border-t border-gray-100">
                <button type="submit" disabled={loading} className="flex-1 bg-brand-700 hover:bg-brand-800 text-white py-2.5 rounded-xl transition-colors font-medium">
                  {loading ? 'Enregistrement...' : 'Enregistrer le produit'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl transition-colors font-medium">
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left p-4 text-sm font-medium text-gray-500">Produit</th>
              <th className="text-left p-4 text-sm font-medium text-gray-500">Catégorie</th>
              <th className="text-left p-4 text-sm font-medium text-gray-500">Prix</th>
              <th className="text-left p-4 text-sm font-medium text-gray-500">Stock</th>
              <th className="text-left p-4 text-sm font-medium text-gray-500">Statut</th>
              <th className="text-left p-4 text-sm font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {products.map(p => (
              <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={getImageUrl(p.images?.[0])}
                      alt={p.name}
                      className="w-10 h-10 rounded-lg object-cover bg-gray-100 border border-gray-200 flex-shrink-0"
                    />
                    <div>
                      <span className="font-semibold text-gray-800 block">{p.name}</span>
                      {p.sizes && p.sizes.length > 0 && (
                        <span className="text-xs text-gray-400">
                          Tailles : {p.sizes.join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="p-4 text-gray-500 text-sm">{p.category || '—'}</td>
                <td className="p-4">
                  <span className="font-semibold text-brand-700">{parseFloat(p.price).toFixed(3)} TND</span>
                  {p.sale_price && <span className="ml-2 text-xs text-red-500 font-medium">PROMO: {parseFloat(p.sale_price).toFixed(3)}</span>}
                </td>
                <td className="p-4">
                  <span className={`text-sm font-bold ${p.stock === 0 ? 'text-red-500' : p.stock <= 3 ? 'text-amber-600' : 'text-green-600'}`}>
                    {p.stock} {p.stock <= 3 && p.stock > 0 ? '🔥' : ''}
                  </span>
                </td>
                <td className="p-4">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${p.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {p.is_active ? 'Visible' : 'Masqué'}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex gap-2">
                    <button onClick={() => handleToggle(p)} className="p-1.5 text-gray-400 hover:text-blue-500 transition-colors" title={p.is_active ? 'Masquer' : 'Afficher'}>
                      {p.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button onClick={() => handleEdit(p)} className="p-1.5 text-gray-400 hover:text-amber-500 transition-colors" title="Modifier">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(p.id)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors" title="Supprimer">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {products.length === 0 && (
          <div className="py-12 text-center text-gray-400">Aucun produit pour l'instant.</div>
        )}
      </div>
    </div>
  );
};

export default AdminProducts;
