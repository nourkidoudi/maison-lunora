import { X, Plus, Minus, Trash2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../hooks/useSettings';
import { getImageUrl } from '../utils/imageUrl';

const CartDrawer = () => {
  const { isCartOpen, setCartOpen, cart, updateQuantity, removeFromCart } = useStore();
  const navigate = useNavigate();
  const settings = useSettings();
  const deliveryFee = settings.delivery_fee;

  if (!isCartOpen) return null;

  const subtotal = cart.reduce((acc, item) => {
    const price = item.product.sale_price ? parseFloat(item.product.sale_price) : parseFloat(item.product.price);
    return acc + price * item.quantity;
  }, 0);

  const total = subtotal + deliveryFee;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => setCartOpen(false)}
      />
      
      {/* Drawer */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col transform transition-transform duration-300">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-serif font-semibold text-brand-900">Votre Panier</h2>
          <button 
            onClick={() => setCartOpen(false)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <p>Votre panier est vide.</p>
              <button 
                onClick={() => { setCartOpen(false); navigate('/shop'); }}
                className="mt-4 text-brand-600 hover:underline"
              >
                Continuer vos achats
              </button>
            </div>
          ) : (
            cart.map((item, idx) => (
              <div key={idx} className="flex gap-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
                <img 
                  src={getImageUrl(item.product.images?.[0])} 
                  alt={item.product.name}
                  className="w-20 h-24 object-cover rounded-lg"
                />
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-medium text-brand-900 line-clamp-1">{item.product.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {item.size} • {item.color}
                    </p>
                    <p className="text-brand-600 font-semibold mt-1">
                      {(item.product.sale_price ? parseFloat(item.product.sale_price) : parseFloat(item.product.price)).toFixed(3)} TND
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-2 py-1">
                      <button 
                        onClick={() => {
                          if (item.quantity > 1) updateQuantity(item.product.id, item.size, item.color, item.quantity - 1)
                        }}
                        className="text-gray-500 hover:text-brand-600"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                      <button 
                        onClick={() => {
                          if (item.quantity < item.product.stock) updateQuantity(item.product.id, item.size, item.color, item.quantity + 1)
                        }}
                        className={`text-gray-500 ${item.quantity < item.product.stock ? 'hover:text-brand-600' : 'opacity-40 cursor-not-allowed'}`}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <button 
                      onClick={() => removeFromCart(item.product.id, item.size, item.color)}
                      className="text-red-400 hover:text-red-600 p-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="p-6 border-t border-gray-100 bg-gray-50">
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-gray-500">
                <span>Sous-total</span>
                <span>{subtotal.toFixed(3)} TND</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Frais de livraison</span>
                <span>{deliveryFee.toFixed(3)} TND</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-brand-900 border-t border-gray-200 pt-2 mt-2">
                <span>Total</span>
                <span>{total.toFixed(3)} TND</span>
              </div>
            </div>
            <button 
              onClick={() => { setCartOpen(false); navigate('/checkout'); }}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-medium py-3 rounded-lg transition-colors shadow-lg shadow-brand-200"
            >
              Commander (Paiement à la livraison)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartDrawer;
