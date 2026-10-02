import { useEffect, useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ShoppingBag, Filter, X } from 'lucide-react';
import api from '../api';
import { useStore, type Product } from '../store/useStore';
import { getImageUrl } from '../utils/imageUrl';

const CATEGORIES = ['Toutes', 'Robes', 'Hauts', 'Pantalons', 'Accessoires'];

const ShopPage = ({ filter }: { filter?: string }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [searchParams] = useSearchParams();
  const { addToCart } = useStore();

  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'Toutes');
  const [priceMax, setPriceMax] = useState(500);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [onlyInStock, setOnlyInStock] = useState(false);

  useEffect(() => {
    api.get('/products').then(({ data }) => setProducts(data)).finally(() => setLoading(false));
  }, []);

  const allSizes = useMemo(() => [...new Set(products.flatMap(p => p.sizes || []))], [products]);
  const allColors = useMemo(() => [...new Set(products.flatMap(p => p.colors || []))], [products]);

  const filtered = useMemo(() => {
    return products.filter(p => {
      const price = p.sale_price ? parseFloat(p.sale_price) : parseFloat(p.price);
      if (filter === 'new') {
        const created = new Date(p.created_at as any);
        const now = new Date();
        const diffDays = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
        if (diffDays > 30) return false;
      }
      if (filter === 'promo' && !p.sale_price) return false;
      if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (selectedCategory !== 'Toutes' && p.category !== selectedCategory) return false;
      if (price > priceMax) return false;
      if (selectedSize && !p.sizes?.includes(selectedSize)) return false;
      if (selectedColor && !p.colors?.includes(selectedColor)) return false;
      if (onlyInStock && p.stock === 0) return false;
      return true;
    });
  }, [products, filter, search, selectedCategory, priceMax, selectedSize, selectedColor, onlyInStock]);

  const clearFilters = () => {
    setSearch(''); setSelectedCategory('Toutes'); setPriceMax(500);
    setSelectedSize(''); setSelectedColor(''); setOnlyInStock(false);
  };

  const hasFilters = search || selectedCategory !== 'Toutes' || priceMax < 500 || selectedSize || selectedColor || onlyInStock;

  return (
    <div className="container mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-brand-900">Boutique</h1>
          <p className="text-gray-400 mt-1">{filtered.length} produit{filtered.length !== 1 ? 's' : ''} trouvé{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-3">
          {/* Search */}
          <input
            type="text"
            placeholder="Rechercher..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 w-48"
          />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 border border-gray-200 rounded-lg px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
          >
            <Filter className="w-4 h-4" /> Filtres
            {hasFilters && <span className="bg-brand-600 text-white w-4 h-4 rounded-full text-xs flex items-center justify-center">!</span>}
          </button>
          {hasFilters && (
            <button onClick={clearFilters} className="flex items-center gap-1 text-sm text-red-400 hover:text-red-600 transition-colors">
              <X className="w-4 h-4" /> Réinitialiser
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-8">
        {/* Filter Sidebar */}
        {showFilters && (
          <aside className="w-64 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-8 sticky top-24">
              {/* Categories */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Catégorie</h3>
                <div className="space-y-1">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedCategory === cat ? 'bg-brand-600 text-white font-medium' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Prix max : <span className="text-brand-600">{priceMax} TND</span></h3>
                <input
                  type="range" min={0} max={500} step={10}
                  value={priceMax} onChange={e => setPriceMax(Number(e.target.value))}
                  className="w-full accent-brand-600"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>0 TND</span><span>500 TND</span>
                </div>
              </div>

              {/* Sizes */}
              {allSizes.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3">Taille</h3>
                  <div className="flex flex-wrap gap-2">
                    {allSizes.map(s => (
                      <button
                        key={s}
                        onClick={() => setSelectedSize(selectedSize === s ? '' : s)}
                        className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${selectedSize === s ? 'border-brand-600 bg-brand-600 text-white' : 'border-gray-200 text-gray-600 hover:border-brand-400'}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Colors */}
              {allColors.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3">Couleur</h3>
                  <div className="flex flex-wrap gap-2">
                    {allColors.map(c => (
                      <button
                        key={c}
                        onClick={() => setSelectedColor(selectedColor === c ? '' : c)}
                        className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${selectedColor === c ? 'border-brand-600 bg-brand-50 text-brand-700 font-medium' : 'border-gray-200 text-gray-600 hover:border-brand-400'}`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* In Stock */}
              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox" checked={onlyInStock}
                    onChange={e => setOnlyInStock(e.target.checked)}
                    className="w-4 h-4 accent-brand-600"
                  />
                  <span className="text-sm text-gray-700">En stock seulement</span>
                </label>
              </div>
            </div>
          </aside>
        )}

        {/* Product Grid */}
        <div className="flex-1">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-gray-100 rounded-2xl aspect-[3/4] animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-gray-400">
              <p className="text-xl mb-4">Aucun produit trouvé.</p>
              <button onClick={clearFilters} className="text-brand-600 hover:underline">Réinitialiser les filtres</button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filtered.map(product => (
                <div key={product.id} className="group flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-brand-100">
                  <div className="aspect-[3/4] relative overflow-hidden bg-gray-100">
                    <img
                      src={getImageUrl(product.images?.[0])}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
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
                      onClick={() => addToCart({ product, size: product.sizes?.[0] || 'Unique', color: product.colors?.[0] || 'Unique', quantity: 1 })}
                      disabled={product.stock === 0}
                      className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white text-brand-800 py-2 px-4 rounded-full text-xs font-semibold shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center gap-2 whitespace-nowrap hover:bg-brand-600 hover:text-white disabled:hidden"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" /> Ajouter au panier
                    </button>
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <p className="text-xs text-brand-400 mb-1">{product.category}</p>
                    <Link to={`/product/${product.id}`}>
                      <h3 className="font-serif font-semibold text-brand-900 line-clamp-1 hover:text-brand-600 transition-colors">{product.name}</h3>
                    </Link>
                    <div className="mt-auto pt-3 flex items-center gap-2">
                      {product.sale_price ? (
                        <>
                          <span className="text-brand-700 font-bold">{parseFloat(product.sale_price).toFixed(3)} TND</span>
                          <span className="text-gray-400 line-through text-sm">{parseFloat(product.price).toFixed(3)}</span>
                        </>
                      ) : (
                        <span className="text-brand-700 font-bold">{parseFloat(product.price).toFixed(3)} TND</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShopPage;
