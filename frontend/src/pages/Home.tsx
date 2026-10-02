import { Link } from 'react-router-dom';
import { Truck, CreditCard, Shield, ArrowRight, Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import api from '../api';
import { useStore, type Product } from '../store/useStore';
import { ShoppingBag } from 'lucide-react';
import { getImageUrl } from '../utils/imageUrl';

const Home = () => {
  const [newProducts, setNewProducts] = useState<Product[]>([]);
  const [promoProducts, setPromoProducts] = useState<Product[]>([]);
  const { addToCart } = useStore();

  useEffect(() => {
    api.get('/products').then(({ data }) => {
      setNewProducts(data.slice(0, 4));
      setPromoProducts(data.filter((p: Product) => p.sale_price).slice(0, 4));
    });
  }, []);

  const addQuickCart = (product: Product) => {
    addToCart({
      product,
      size: product.sizes[0] || 'Unique',
      color: product.colors[0] || 'Unique',
      quantity: 1
    });
  };

  return (
    <div>
      {/* ===== HERO BANNER ===== */}
      <section className="relative min-h-[90vh] flex items-center bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-600/20 rounded-full translate-x-1/2 -translate-y-1/2 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-500/20 rounded-full -translate-x-1/2 translate-y-1/2 blur-3xl" />

        <div className="container mx-auto px-6 py-20 relative z-10">
          <div className="max-w-2xl">
            <p className="text-brand-300 uppercase tracking-[0.3em] text-sm font-medium mb-6 animate-pulse">
              ✦ Nouvelle Collection 2024
            </p>
            <h1 className="text-5xl md:text-7xl font-serif font-bold text-white leading-tight mb-6">
              L'élégance<br />
              <span className="italic text-brand-300">à votre mesure</span>
            </h1>
            <p className="text-brand-200 text-lg md:text-xl mb-10 leading-relaxed max-w-lg">
              Des vêtements conçus pour la femme tunisienne moderne — alliant raffinement, confort et style contemporain.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/shop"
                className="inline-flex items-center gap-3 bg-white text-brand-900 px-8 py-4 rounded-full font-semibold text-lg hover:bg-brand-50 transition-all shadow-xl shadow-black/20 hover:scale-105"
              >
                Découvrir la collection <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/promotions"
                className="inline-flex items-center gap-3 border-2 border-brand-300 text-brand-100 px-8 py-4 rounded-full font-semibold text-lg hover:bg-white/10 transition-all"
              >
                Voir les promos
              </Link>
            </div>
          </div>
        </div>

        {/* Scrolldown indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-brand-300 animate-bounce">
          <div className="w-px h-12 bg-gradient-to-b from-transparent to-brand-300" />
        </div>
      </section>

      {/* ===== REASSURANCE BADGES ===== */}
      <section className="bg-white border-y border-brand-100 py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-6 md:gap-12">
            <div className="flex items-center gap-3 text-gray-700">
              <div className="bg-brand-100 p-2.5 rounded-full">
                <Truck className="w-5 h-5 text-brand-600" />
              </div>
              <div>
                <p className="font-semibold text-sm">Livraison rapide</p>
                <p className="text-xs text-gray-400">Partout en Tunisie</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-gray-700">
              <div className="bg-brand-100 p-2.5 rounded-full">
                <CreditCard className="w-5 h-5 text-brand-600" />
              </div>
              <div>
                <p className="font-semibold text-sm">Paiement à la livraison</p>
                <p className="text-xs text-gray-400">Cash on Delivery</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-gray-700">
              <div className="bg-brand-100 p-2.5 rounded-full">
                <Shield className="w-5 h-5 text-brand-600" />
              </div>
              <div>
                <p className="font-semibold text-sm">Qualité garantie</p>
                <p className="text-xs text-gray-400">Vêtements sélectionnés</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-gray-700">
              <div className="bg-brand-100 p-2.5 rounded-full">
                <Star className="w-5 h-5 text-brand-600" />
              </div>
              <div>
                <p className="font-semibold text-sm">Style exclusif</p>
                <p className="text-xs text-gray-400">Collection unique</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CATEGORIES ===== */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <p className="text-brand-500 uppercase tracking-widest text-sm mb-2">Explorer par catégorie</p>
          <h2 className="text-4xl font-serif font-bold text-brand-900">Nos Collections</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: 'Robes', emoji: '👗', color: 'from-pink-100 to-rose-200' },
            { name: 'Hauts', emoji: '👚', color: 'from-amber-100 to-orange-200' },
            { name: 'Pantalons', emoji: '👖', color: 'from-blue-100 to-indigo-200' },
            { name: 'Accessoires', emoji: '👜', color: 'from-emerald-100 to-teal-200' },
          ].map((cat) => (
            <Link
              key={cat.name}
              to={`/shop?category=${cat.name}`}
              className={`bg-gradient-to-br ${cat.color} p-8 rounded-2xl text-center hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer`}
            >
              <div className="text-5xl mb-3">{cat.emoji}</div>
              <p className="font-serif font-semibold text-gray-800 text-lg">{cat.name}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ===== NEW ARRIVALS ===== */}
      {newProducts.length > 0 && (
        <section className="bg-brand-50 py-20">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-end mb-12">
              <div>
                <p className="text-brand-500 uppercase tracking-widest text-sm mb-2">Vient d'arriver</p>
                <h2 className="text-4xl font-serif font-bold text-brand-900">Nouveautés</h2>
              </div>
              <Link to="/nouveautes" className="text-brand-600 hover:text-brand-800 font-medium flex items-center gap-2 transition-colors">
                Voir tout <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {newProducts.map(product => (
                <ProductCard key={product.id} product={product} onAddToCart={addQuickCart} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== PROMOTIONS ===== */}
      {promoProducts.length > 0 && (
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-end mb-12">
              <div>
                <p className="text-brand-500 uppercase tracking-widest text-sm mb-2">Prix réduits</p>
                <h2 className="text-4xl font-serif font-bold text-brand-900">Promotions</h2>
              </div>
              <Link to="/promotions" className="text-brand-600 hover:text-brand-800 font-medium flex items-center gap-2 transition-colors">
                Voir tout <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {promoProducts.map(product => (
                <ProductCard key={product.id} product={product} onAddToCart={addQuickCart} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== COD BANNER ===== */}
      <section className="bg-brand-900 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="text-5xl mb-6">🚚</div>
          <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">Paiement à la livraison</h2>
          <p className="text-brand-200 text-lg mb-8 max-w-xl mx-auto">
            Commandez en toute confiance. Vous payez uniquement quand vous recevez votre colis, en espèces, à votre porte.
          </p>
          <div className="flex justify-center gap-8 text-brand-300 text-sm">
            <div className="flex flex-col items-center gap-2">
              <span className="text-2xl">1</span>
              <span>Commandez en ligne</span>
            </div>
            <div className="w-px bg-brand-700 mx-2" />
            <div className="flex flex-col items-center gap-2">
              <span className="text-2xl">2</span>
              <span>On vous livre</span>
            </div>
            <div className="w-px bg-brand-700 mx-2" />
            <div className="flex flex-col items-center gap-2">
              <span className="text-2xl">3</span>
              <span>Vous payez à la réception</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

interface ProductCardProps {
  product: Product;
  onAddToCart: (p: Product) => void;
}

const ProductCard = ({ product, onAddToCart }: ProductCardProps) => (
  <div className="group relative flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-brand-100">
    <div className="aspect-[3/4] relative overflow-hidden bg-gray-100">
      <img
        src={getImageUrl(product.images?.[0])}
        alt={product.name}
        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
      />
      <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
        {product.sale_price && (
          <span className="bg-red-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-sm w-fit">
            PROMO
          </span>
        )}
        {product.stock > 0 && product.stock <= 3 ? (
          <span className="bg-amber-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm animate-pulse w-fit">
            🔥 Plus que {product.stock} !
          </span>
        ) : product.stock > 3 ? (
          <span className="bg-emerald-600/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm w-fit">
            ✓ En stock ({product.stock})
          </span>
        ) : null}
      </div>
      {product.stock === 0 && (
        <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center z-20">
          <span className="bg-gray-900 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-md">
            Rupture de stock
          </span>
        </div>
      )}
      <button
        onClick={() => onAddToCart(product)}
        disabled={product.stock === 0}
        className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white text-brand-800 py-2 px-4 rounded-full text-xs font-semibold shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center gap-2 whitespace-nowrap hover:bg-brand-600 hover:text-white disabled:hidden"
      >
        <ShoppingBag className="w-3.5 h-3.5" /> Ajouter au panier
      </button>
    </div>
    <div className="p-4">
      <p className="text-xs text-brand-400 mb-1">{product.category}</p>
      <Link to={`/product/${product.id}`}>
        <h3 className="font-serif font-semibold text-brand-900 line-clamp-1 hover:text-brand-600 transition-colors">{product.name}</h3>
      </Link>
      <div className="mt-2 flex items-center gap-2">
        {product.sale_price ? (
          <>
            <span className="text-brand-700 font-bold">{parseFloat(product.sale_price).toFixed(3)} TND</span>
            <span className="text-gray-400 line-through text-sm">{parseFloat(product.price).toFixed(3)} TND</span>
          </>
        ) : (
          <span className="text-brand-700 font-bold">{parseFloat(product.price).toFixed(3)} TND</span>
        )}
      </div>
    </div>
  </div>
);

export default Home;
