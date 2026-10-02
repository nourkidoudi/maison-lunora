import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import api from '../api';
import { DELIVERY_FEE as DEFAULT_DELIVERY_FEE } from '../constants';
import { Tag, CheckCircle2, XCircle } from 'lucide-react';

const Checkout = () => {
  const { cart, clearCart } = useStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deliveryFee, setDeliveryFee] = useState<number>(DEFAULT_DELIVERY_FEE);

  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{code: string, description: string, discount: number} | null>(null);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  useEffect(() => {
    api.get('/settings').then(({ data }) => {
      if (data.delivery_fee) setDeliveryFee(parseFloat(data.delivery_fee) || DEFAULT_DELIVERY_FEE);
    }).catch(() => {});
  }, []);

  const [formData, setFormData] = useState({
    customer_name: '',
    phone: '',
    governorate: 'Tunis',
    delegation: '',
    address: '',
    postal_code: '',
    comment: ''
  });

  const subtotal = cart.reduce((acc, item) => {
    const price = item.product.sale_price ? parseFloat(item.product.sale_price) : parseFloat(item.product.price);
    return acc + price * item.quantity;
  }, 0);
  const total = subtotal - (appliedCoupon?.discount || 0) + deliveryFee;

  if (cart.length === 0) {
    navigate('/shop');
    return null;
  }

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    setCouponError('');
    try {
      const { data } = await api.post('/coupons/apply', { code: couponInput, subtotal, phone: formData.phone });
      setAppliedCoupon({
        code: data.coupon.code,
        description: data.coupon.description || `Coupon ${data.coupon.code}`,
        discount: data.discount
      });
    } catch (err: any) {
      setCouponError(err.response?.data?.error || 'Code invalide');
      setAppliedCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        ...formData,
        items: cart.map(item => ({
          product_id: item.product.id,
          size: item.size,
          color: item.color,
          quantity: item.quantity
        })),
        coupon_code: appliedCoupon?.code || undefined
      };
      
      const { data } = await api.post('/orders', payload);
      clearCart();
      navigate('/confirmation', { state: { orderNumber: data.order.order_number } });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <h1 className="text-3xl font-serif font-bold text-brand-900 mb-8">Finaliser la commande</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div>
          <h2 className="text-xl font-medium mb-4">Informations de livraison</h2>
          {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">{error}</div>}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom et Prénom *</label>
              <input required type="text" name="customer_name" onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-brand-500 focus:border-brand-500" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone (8 chiffres) *</label>
              <input required pattern="[0-9]{8}" type="tel" name="phone" onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-brand-500 focus:border-brand-500" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gouvernorat *</label>
                <select required name="governorate" onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-brand-500 focus:border-brand-500">
                  <option value="Tunis">Tunis</option>
                  <option value="Ariana">Ariana</option>
                  <option value="Ben Arous">Ben Arous</option>
                  <option value="Manouba">Manouba</option>
                  <option value="Nabeul">Nabeul</option>
                  <option value="Zaghouan">Zaghouan</option>
                  <option value="Bizerte">Bizerte</option>
                  <option value="Sousse">Sousse</option>
                  <option value="Monastir">Monastir</option>
                  <option value="Mahdia">Mahdia</option>
                  <option value="Sfax">Sfax</option>
                  <option value="Kairouan">Kairouan</option>
                  <option value="Kasserine">Kasserine</option>
                  <option value="Sidi Bouzid">Sidi Bouzid</option>
                  <option value="Gafsa">Gafsa</option>
                  <option value="Tozeur">Tozeur</option>
                  <option value="Kebili">Kebili</option>
                  <option value="Gabès">Gabès</option>
                  <option value="Médenine">Médenine</option>
                  <option value="Tataouine">Tataouine</option>
                  <option value="Jendouba">Jendouba</option>
                  <option value="Le Kef">Le Kef</option>
                  <option value="Siliana">Siliana</option>
                  <option value="Béja">Béja</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Délégation *</label>
                <input required type="text" name="delegation" onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-brand-500 focus:border-brand-500" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Adresse complète *</label>
              <input required type="text" name="address" onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-brand-500 focus:border-brand-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Code postal</label>
              <input type="text" name="postal_code" onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-brand-500 focus:border-brand-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Commentaire (optionnel)</label>
              <textarea name="comment" onChange={handleChange} rows={3} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-brand-500 focus:border-brand-500"></textarea>
            </div>

            <div className="bg-blue-50 text-blue-800 p-4 rounded-lg mt-6 text-sm flex gap-3 items-center">
              <span className="text-xl">🚚</span>
              Le paiement se fera en espèces à la livraison.
            </div>

            <button disabled={loading} type="submit" className="w-full bg-brand-600 hover:bg-brand-700 text-white font-medium py-3 rounded-lg transition-colors mt-6 disabled:opacity-50">
              {loading ? 'Traitement...' : `Confirmer la commande (${total.toFixed(3)} TND)`}
            </button>
          </form>
        </div>

        <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 h-fit sticky top-24">
          <h2 className="text-xl font-medium mb-6">Résumé de la commande</h2>
          <div className="space-y-4 mb-6">
            {cart.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs text-gray-600">{item.quantity}</span>
                  <div>
                    <p className="font-medium text-brand-900">{item.product.name}</p>
                    <p className="text-gray-500 text-xs">{item.size} • {item.color}</p>
                  </div>
                </div>
                <span className="font-medium">
                  {((item.product.sale_price ? parseFloat(item.product.sale_price) : parseFloat(item.product.price)) * item.quantity).toFixed(3)} TND
                </span>
              </div>
            ))}
          </div>

          {/* Coupon */}
          <div className="mb-6">
            {!appliedCoupon ? (
              <form onSubmit={handleApplyCoupon} className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Tag className="w-4 h-4" /> Code promo
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={e => setCouponInput(e.target.value)}
                    placeholder="Ex: BIENVENUE10"
                    style={{ textTransform: 'uppercase' }}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-brand-500 focus:border-brand-500 uppercase"
                  />
                  <button
                    type="submit"
                    disabled={couponLoading || !couponInput.trim()}
                    className="bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                  >
                    {couponLoading ? '...' : 'OK'}
                  </button>
                </div>
                {couponError && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <XCircle className="w-3 h-3" /> {couponError}
                  </p>
                )}
              </form>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-green-700 font-semibold text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    {appliedCoupon.code}
                  </div>
                  <button
                    type="button"
                    onClick={removeCoupon}
                    className="text-red-400 hover:text-red-600 transition-colors"
                    title="Retirer"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
                {appliedCoupon.description && (
                  <p className="text-xs text-green-600">{appliedCoupon.description}</p>
                )}
                <p className="text-xs text-green-700 font-medium">
                  -{appliedCoupon.discount.toFixed(3)} TND déduits
                </p>
              </div>
            )}
          </div>
          
          <div className="border-t border-gray-200 pt-4 space-y-2">
            <div className="flex justify-between text-gray-600">
              <span>Sous-total</span>
              <span>{subtotal.toFixed(3)} TND</span>
            </div>
            {appliedCoupon && (
              <div className="flex justify-between text-green-600">
                <span>Réduction coupon ({appliedCoupon.code})</span>
                <span>-{appliedCoupon.discount.toFixed(3)} TND</span>
              </div>
            )}
            <div className="flex justify-between text-gray-600">
              <span>Frais de livraison</span>
              <span>{deliveryFee.toFixed(3)} TND</span>
            </div>
            <div className="flex justify-between text-xl font-bold text-brand-900 pt-4 border-t border-gray-200 mt-4">
              <span>Total</span>
              <span>{total.toFixed(3)} TND</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
