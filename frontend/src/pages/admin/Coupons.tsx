import { useEffect, useState } from 'react';
import api from '../../api';
import { Plus, Pencil, Trash2, Tag, Percent, Wallet, RotateCcw } from 'lucide-react';

interface Coupon {
  id: number;
  code: string;
  description: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: string;
  min_order_amount: string;
  max_uses: number | null;
  times_used: number;
  max_uses_per_customer: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

const emptyForm = {
  code: '',
  description: '',
  discount_type: 'percentage' as 'percentage' | 'fixed',
  discount_value: '',
  min_order_amount: '',
  max_uses: '',
  max_uses_per_customer: '1',
  is_active: true,
  expires_at: '',
  reset_uses: false
};

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchCoupons = async () => {
    const { data } = await api.get('/coupons');
    setCoupons(data);
  };

  useEffect(() => { fetchCoupons(); }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (c: Coupon) => {
    setEditingId(c.id);
    setForm({
      code: c.code,
      description: c.description || '',
      discount_type: c.discount_type,
      discount_value: String(c.discount_value),
      min_order_amount: String(c.min_order_amount || 0),
      max_uses: c.max_uses !== null ? String(c.max_uses) : '',
      max_uses_per_customer: String(c.max_uses_per_customer || 1),
      is_active: c.is_active,
      expires_at: c.expires_at ? new Date(c.expires_at).toISOString().slice(0, 16) : '',
      reset_uses: false
    });
    setShowForm(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const target = e.target as any;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    setForm({ ...form, [target.name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    setErr('');
    try {
      if (editingId) {
        await api.put(`/coupons/${editingId}`, form);
        setMsg('Coupon modifié avec succès.');
      } else {
        await api.post('/coupons', form);
        setMsg('Coupon créé avec succès.');
      }
      fetchCoupons();
      setShowForm(false);
      setForm(emptyForm);
      setTimeout(() => setMsg(''), 3000);
    } catch (e: any) {
      setErr(e.response?.data?.error || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer ce coupon ?')) return;
    await api.delete(`/coupons/${id}`);
    fetchCoupons();
  };

  const toggleActive = async (c: Coupon) => {
    await api.put(`/coupons/${c.id}`, { ...c, is_active: !c.is_active });
    fetchCoupons();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Coupons & Promotions</h1>
          <p className="text-gray-500 mt-1">Gérez les codes de réduction de votre boutique.</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold px-5 py-3 rounded-xl shadow-lg transition-colors"
        >
          <Plus className="w-5 h-5" /> Nouveau coupon
        </button>
      </div>

      {msg && <div className="p-4 bg-green-50 text-green-700 rounded-xl font-medium">{msg}</div>}
      {err && <div className="p-4 bg-red-50 text-red-700 rounded-xl font-medium">{err}</div>}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">
          <h2 className="text-xl font-bold text-gray-800">{editingId ? 'Modifier le coupon' : 'Créer un nouveau coupon'}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Code coupon <span className="text-red-500">*</span>
              </label>
              <input
                required
                name="code"
                value={form.code}
                onChange={handleChange}
                placeholder="BIENVENUE10"
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-brand-500 focus:border-brand-500 uppercase"
                style={{ textTransform: 'uppercase' }}
              />
              <p className="text-xs text-gray-400 mt-1">Ex: BIENVENUE10, FIDELITE20</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Type de réduction <span className="text-red-500">*</span>
              </label>
              <select
                required
                name="discount_type"
                value={form.discount_type}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-brand-500 focus:border-brand-500"
              >
                <option value="percentage">Pourcentage (%)</option>
                <option value="fixed">Montant fixe (TND)</option>
              </select>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                {form.discount_type === 'percentage' ? <Percent className="w-4 h-4" /> : <Wallet className="w-4 h-4" />}
                Valeur de réduction <span className="text-red-500">*</span>
              </label>
              <input
                required
                name="discount_value"
                type="number"
                min={form.discount_type === 'percentage' ? 0 : 0}
                max={form.discount_type === 'percentage' ? 100 : undefined}
                step={form.discount_type === 'percentage' ? 1 : 0.001}
                value={form.discount_value}
                onChange={handleChange}
                placeholder={form.discount_type === 'percentage' ? '10' : '20'}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-brand-500 focus:border-brand-500"
              />
              <p className="text-xs text-gray-400 mt-1">
                {form.discount_type === 'percentage' ? 'Pourcentage: 0-100' : 'Montant en TND'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Panier minimum (TND)
              </label>
              <input
                name="min_order_amount"
                type="number"
                min="0"
                step="0.001"
                value={form.min_order_amount}
                onChange={handleChange}
                placeholder="0 pour désactiver"
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-brand-500 focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Utilisations max total
              </label>
              <input
                name="max_uses"
                type="number"
                min="0"
                value={form.max_uses}
                onChange={handleChange}
                placeholder="Laisser vide pour illimité"
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-brand-500 focus:border-brand-500"
              />
              <p className="text-xs text-gray-400 mt-1">Ex: 100 → 100 commandes max</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Utilisations max / client
              </label>
              <input
                name="max_uses_per_customer"
                type="number"
                min="1"
                value={form.max_uses_per_customer}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-brand-500 focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Date d'expiration
              </label>
              <input
                name="expires_at"
                type="datetime-local"
                value={form.expires_at}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-brand-500 focus:border-brand-500"
              />
              <p className="text-xs text-gray-400 mt-1">Laisser vide pour pas d'expiration</p>
            </div>

            <div className="flex items-end gap-4">
              <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg w-full cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={form.is_active}
                  onChange={handleChange}
                  className="w-5 h-5 text-brand-600 rounded"
                />
                <span className="font-medium text-gray-700">Activé</span>
              </label>
              {editingId && (
                <label className="flex items-center gap-2 p-3 border border-amber-200 bg-amber-50 rounded-lg w-full cursor-pointer hover:bg-amber-100">
                  <RotateCcw className="w-4 h-4 text-amber-600" />
                  <input
                    type="checkbox"
                    name="reset_uses"
                    checked={form.reset_uses}
                    onChange={handleChange}
                    className="w-5 h-5 text-amber-600 rounded"
                  />
                  <span className="font-medium text-amber-700 text-sm">Reset utilisations</span>
                </label>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Description (facultative)
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={2}
                placeholder="Ex: 10% de réduction sur votre première commande"
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-brand-500 focus:border-brand-500"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-semibold px-6 py-3 rounded-xl shadow transition-colors"
            >
              <Tag className="w-5 h-5" />
              {loading ? 'Enregistrement...' : (editingId ? 'Enregistrer' : 'Créer le coupon')}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-6 py-3 rounded-xl font-medium border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
          </div>
        </form>
      )}

      {/* Liste coupons */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500 tracking-wider">
              <tr>
                <th className="text-left p-4 font-semibold">Code</th>
                <th className="text-left p-4 font-semibold">Réduction</th>
                <th className="text-left p-4 font-semibold">Min. Panier</th>
                <th className="text-left p-4 font-semibold">Utilisations</th>
                <th className="text-left p-4 font-semibold">Expire</th>
                <th className="text-left p-4 font-semibold">Statut</th>
                <th className="text-left p-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {coupons.map(c => {
                const pct = c.max_uses ? (c.times_used / c.max_uses) * 100 : 0;
                const expired = c.expires_at && new Date(c.expires_at) < new Date();
                return (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <div className="font-mono font-bold text-brand-700 tracking-wide uppercase">{c.code}</div>
                      {c.description && <p className="text-xs text-gray-400 mt-1 line-clamp-1">{c.description}</p>}
                    </td>
                    <td className="p-4 font-semibold text-gray-800">
                      {c.discount_type === 'percentage' ? `${parseFloat(c.discount_value).toFixed(0)}%` : `${parseFloat(c.discount_value).toFixed(3)} TND`}
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      {parseFloat(c.min_order_amount || '0') > 0 ? `${parseFloat(c.min_order_amount).toFixed(3)} TND` : '—'}
                    </td>
                    <td className="p-4 min-w-[160px]">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-700">{c.times_used}</span>
                        {c.max_uses !== null && (
                          <>
                            <span className="text-gray-400">/ {c.max_uses}</span>
                            <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-brand-500"
                                style={{ width: `${Math.min(pct, 100)}%` }}
                              />
                            </div>
                          </>
                        )}
                        {c.max_uses === null && <span className="text-xs text-gray-400">illimité</span>}
                      </div>
                    </td>
                    <td className="p-4 text-sm">
                      {c.expires_at ? (
                        expired ? (
                          <span className="text-red-500 font-medium">Expiré</span>
                        ) : (
                          <span className="text-gray-600">
                            {new Date(c.expires_at).toLocaleDateString('fr-TN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                          </span>
                        )
                      ) : <span className="text-gray-400">Jamais</span>}
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => toggleActive(c)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-full transition-colors ${
                          !c.is_active ? 'bg-gray-100 text-gray-500' :
                          expired ? 'bg-red-100 text-red-600' :
                          'bg-green-100 text-green-700'
                        }`}
                      >
                        {c.is_active ? (expired ? 'Expiré' : 'Actif') : 'Désactivé'}
                      </button>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEdit(c)}
                          className="p-2 text-gray-500 hover:bg-brand-50 hover:text-brand-600 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {coupons.length === 0 && (
          <div className="py-16 text-center text-gray-400">
            <Tag className="w-12 h-12 mx-auto mb-3 opacity-50" />
            Aucun coupon pour le moment. Cliquez sur "Nouveau coupon" pour en créer un.
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCoupons;
