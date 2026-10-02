import { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingBag, ChevronLeft, ChevronRight, Minus, Plus, MessageCircle, AlertCircle, CheckCircle2 } from 'lucide-react';
import api from '../api';
import { useStore, type Product, type ProductVariant } from '../store/useStore';
import { useSettings } from '../hooks/useSettings';
import { getImageUrl } from '../utils/imageUrl';

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState('');
  const [added, setAdded] = useState(false);
  const { addToCart } = useStore();
  const settings = useSettings();

  useEffect(() => {
    Promise.all([
      api.get(`/products/${id}`),
      api.get('/products')
    ]).then(([productRes, productsRes]) => {
      const p = productRes.data;
      setProduct(p);

      // Parse variants
      let vars: ProductVariant[] = [];
      try {
        vars = typeof p.variants === 'string' ? JSON.parse(p.variants) : (p.variants || []);
      } catch (e) { vars = []; }

      // Default to first available in-stock size & color
      if (p.sizes?.length > 0) {
        if (vars.length > 0) {
          const firstInStockVariant = vars.find(v => (parseInt(String(v.stock)) || 0) > 0);
          if (firstInStockVariant) {
            setSelectedSize(firstInStockVariant.size || p.sizes[0]);
            setSelectedColor(firstInStockVariant.color || p.colors?.[0] || '');
          } else {
            setSelectedSize(p.sizes[0]);
            if (p.colors?.length > 0) setSelectedColor(p.colors[0]);
          }
        } else {
          setSelectedSize(p.sizes[0]);
          if (p.colors?.length > 0) setSelectedColor(p.colors[0]);
        }
      } else if (p.colors?.length > 0) {
        setSelectedColor(p.colors[0]);
      }

      const related = productsRes.data
        .filter((rp: Product) => rp.id !== p.id && rp.category === p.category)
        .slice(0, 4);
      setRelatedProducts(related);
    }).catch(() => setProduct(null)).finally(() => setLoading(false));
  }, [id]);

  // Parse product variants safely
  const variants: ProductVariant[] = useMemo(() => {
    if (!product || !product.variants) return [];
    try {
      return typeof product.variants === 'string' ? JSON.parse(product.variants) : product.variants;
    } catch (e) {
      return [];
    }
  }, [product]);

  // Calculate available stock for a specific size
  const getSizeStock = (size: string): number => {
    if (!product) return 0;
    if (variants.length === 0) return product.stock;

    if (selectedColor) {
      const variant = variants.find(v => v.size === size && v.color === selectedColor);
      if (variant !== undefined) return parseInt(String(variant.stock)) || 0;
    }

    // Otherwise sum across all colors for this size
    const sizeVariants = variants.filter(v => v.size === size);
    if (sizeVariants.length > 0) {
      return sizeVariants.reduce((sum, v) => sum + (parseInt(String(v.stock)) || 0), 0);
    }

    return product.stock;
  };

  // Calculate available stock for a specific color
  const getColorStock = (color: string): number => {
    if (!product) return 0;
    if (variants.length === 0) return product.stock;

    if (selectedSize) {
      const variant = variants.find(v => v.size === selectedSize && v.color === color);
      if (variant !== undefined) return parseInt(String(variant.stock)) || 0;
    }

    // Otherwise sum across all sizes for this color
    const colorVariants = variants.filter(v => v.color === color);
    if (colorVariants.length > 0) {
      return colorVariants.reduce((sum, v) => sum + (parseInt(String(v.stock)) || 0), 0);
    }

    return product.stock;
  };

  // Exact stock for currently selected (size + color)
  const currentVariantStock = useMemo(() => {
    if (!product) return 0;
    if (variants.length === 0) return product.stock;

    const matching = variants.find(v =>
      (!selectedSize || v.size === selectedSize || v.size === 'Unique') &&
      (!selectedColor || v.color === selectedColor || v.color === 'Unique')
    );

    if (matching !== undefined) {
      return parseInt(String(matching.stock)) || 0;
    }

    if (selectedSize) {
      return getSizeStock(selectedSize);
    }

    return product.stock;
  }, [product, variants, selectedSize, selectedColor]);

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center text-gray-400">Chargement...</div>;
  if (!product) return <div className="min-h-[60vh] flex items-center justify-center text-gray-400">Produit non trouvé.</div>;

  const price = product.sale_price ? parseFloat(product.sale_price) : parseFloat(product.price);
  const images = product.images?.length > 0 ? product.images : ['https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&h=1067&fit=crop'];

  const isCurrentSelectionOutOfStock = currentVariantStock === 0 || product.stock === 0;

  const handleAddToCart = () => {
    if (product.sizes?.length > 0 && !selectedSize) { setError('Veuillez choisir une taille'); return; }
    if (product.colors?.length > 0 && !selectedColor) { setError('Veuillez choisir une couleur'); return; }
    if (isCurrentSelectionOutOfStock) { setError('Cette variante est actuellement en rupture de stock.'); return; }
    
    addToCart({ product, size: selectedSize || 'Unique', color: selectedColor || 'Unique', quantity: Math.min(quantity, currentVariantStock) });
    setAdded(true);
    setError('');
    setTimeout(() => setAdded(false), 2000);
  };

  const waMessage = encodeURIComponent(
    `Bonjour, je suis intéressé(e) par "${product.name}" (${price.toFixed(3)} TND)${selectedSize ? ` en taille ${selectedSize}` : ''}${selectedColor ? ` couleur ${selectedColor}` : ''}. Est-il disponible ?`
  );
  const waLink = `https://wa.me/${settings.whatsapp_number}?text=${waMessage}`;

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-8">
        <Link to="/" className="hover:text-brand-600 transition-colors">Accueil</Link>
        <span>/</span>
        <Link to="/shop" className="hover:text-brand-600 transition-colors">Boutique</Link>
        <span>/</span>
        <span className="text-gray-700">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Image Gallery */}
        <div className="flex gap-4">
          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex flex-col gap-3 w-20 flex-shrink-0">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${selectedImage === i ? 'border-brand-600' : 'border-transparent'}`}
                >
                  <img src={getImageUrl(img)} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Main Image */}
          <div className="relative flex-1 aspect-[3/4] rounded-2xl overflow-hidden bg-gray-100 shadow-lg">
            <img
              src={getImageUrl(images[selectedImage])}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setSelectedImage(i => (i - 1 + images.length) % images.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full shadow hover:bg-white transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setSelectedImage(i => (i + 1) % images.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full shadow hover:bg-white transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
            <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
              {product.sale_price && (
                <span className="bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md w-fit">
                  PROMO
                </span>
              )}
              {currentVariantStock > 0 && currentVariantStock <= 3 ? (
                <span className="bg-amber-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md animate-pulse w-fit">
                  🔥 Plus que {currentVariantStock} en stock !
                </span>
              ) : currentVariantStock > 3 ? (
                <span className="bg-emerald-600/90 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md w-fit">
                  ✓ En stock ({currentVariantStock})
                </span>
              ) : (
                <span className="bg-gray-900 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md w-fit">
                  Rupture de stock
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Product Info */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <p className="text-brand-500 text-sm uppercase tracking-wider">{product.category}</p>
            {currentVariantStock > 0 && currentVariantStock <= 3 ? (
              <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full animate-pulse">
                🔥 Dernières pièces ({currentVariantStock})
              </span>
            ) : currentVariantStock > 3 ? (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                ✓ En stock ({currentVariantStock} pièces)
              </span>
            ) : (
              <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full">
                Rupture de stock
              </span>
            )}
          </div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-brand-900 mb-4">{product.name}</h1>

          {/* Price */}
          <div className="flex items-end gap-3 mb-6">
            <span className="text-3xl font-bold text-brand-700">{price.toFixed(3)} TND</span>
            {product.sale_price && (
              <span className="text-xl text-gray-400 line-through mb-0.5">{parseFloat(product.price).toFixed(3)} TND</span>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <p className="text-gray-600 leading-relaxed mb-8 border-b border-gray-100 pb-8">{product.description}</p>
          )}

          {/* Sizes Selection with Out-of-stock check */}
          {product.sizes?.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-gray-700">
                  Taille : <span className="font-normal text-brand-600">{selectedSize}</span>
                </p>
                {selectedSize && (
                  <span className={`text-xs font-medium ${getSizeStock(selectedSize) === 0 ? 'text-red-500' : getSizeStock(selectedSize) <= 3 ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {getSizeStock(selectedSize) === 0 ? 'Épuisé' : `Stock taille : ${getSizeStock(selectedSize)}`}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2.5">
                {product.sizes.map(size => {
                  const sizeStock = getSizeStock(size);
                  const isOut = sizeStock === 0;
                  const isSelected = selectedSize === size;

                  return (
                    <button
                      key={size}
                      type="button"
                      disabled={isOut}
                      onClick={() => setSelectedSize(size)}
                      className={`relative px-4 py-2.5 rounded-xl border-2 font-semibold text-sm transition-all flex items-center gap-1.5 ${
                        isOut
                          ? 'border-gray-200 bg-gray-100 text-gray-400 opacity-50 cursor-not-allowed line-through'
                          : isSelected
                          ? 'border-brand-700 bg-brand-700 text-white shadow-md'
                          : 'border-gray-200 text-gray-700 hover:border-brand-400 bg-white'
                      }`}
                      title={isOut ? 'Taille épuisée' : `${sizeStock} disponible(s)`}
                    >
                      <span>{size}</span>
                      {isOut && <span className="text-[10px] no-underline font-normal bg-gray-200 text-gray-500 px-1 rounded">Épuisé</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Colors Selection with Out-of-stock check */}
          {product.colors?.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-gray-700">
                  Couleur : <span className="font-normal text-brand-600">{selectedColor}</span>
                </p>
                {selectedColor && (
                  <span className={`text-xs font-medium ${getColorStock(selectedColor) === 0 ? 'text-red-500' : getColorStock(selectedColor) <= 3 ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {getColorStock(selectedColor) === 0 ? 'Épuisé' : `Stock couleur : ${getColorStock(selectedColor)}`}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2.5">
                {product.colors.map(color => {
                  const colorStock = getColorStock(color);
                  const isOut = colorStock === 0;
                  const isSelected = selectedColor === color;

                  return (
                    <button
                      key={color}
                      type="button"
                      disabled={isOut}
                      onClick={() => setSelectedColor(color)}
                      className={`relative px-4 py-2.5 rounded-xl border-2 font-medium text-sm transition-all ${
                        isOut
                          ? 'border-gray-200 bg-gray-100 text-gray-400 opacity-50 cursor-not-allowed line-through'
                          : isSelected
                          ? 'border-brand-700 bg-brand-50 text-brand-800 font-bold shadow-sm'
                          : 'border-gray-200 text-gray-700 hover:border-brand-400 bg-white'
                      }`}
                      title={isOut ? 'Couleur épuisée' : `${colorStock} disponible(s)`}
                    >
                      <span>{color}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity Selector */}
          <div className="mb-6">
            <p className="text-sm font-semibold text-gray-700 mb-3">Quantité</p>
            <div className="flex items-center gap-4">
              <div className="flex items-center border border-gray-200 rounded-xl bg-white">
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  disabled={isCurrentSelectionOutOfStock || quantity <= 1}
                  className="p-3 hover:bg-gray-100 transition-colors disabled:opacity-40"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-5 font-semibold text-gray-800">{quantity}</span>
                <button
                  onClick={() => setQuantity(q => Math.min(currentVariantStock, q + 1))}
                  disabled={isCurrentSelectionOutOfStock || quantity >= currentVariantStock}
                  className="p-3 hover:bg-gray-100 transition-colors disabled:opacity-40"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Real-time feedback for selected variant */}
              {currentVariantStock > 0 && currentVariantStock <= 3 ? (
                <p className="text-sm font-bold text-amber-600 flex items-center gap-1.5 animate-pulse">
                  <span>🔥</span> Plus que {currentVariantStock} disponible{currentVariantStock > 1 ? 's' : ''} pour cette sélection !
                </p>
              ) : currentVariantStock === 0 ? (
                <p className="text-sm font-semibold text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" /> Cette taille est épuisée
                </p>
              ) : (
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> {currentVariantStock} en stock
                </p>
              )}
            </div>
          </div>

          {/* Error message */}
          {error && <p className="text-red-500 text-sm mb-3 font-medium">{error}</p>}

          {/* Add to Cart & WhatsApp buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleAddToCart}
              disabled={isCurrentSelectionOutOfStock}
              className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-xl font-semibold text-lg transition-all shadow-lg ${
                added
                  ? 'bg-green-500 text-white shadow-green-200'
                  : isCurrentSelectionOutOfStock
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                  : 'bg-brand-700 hover:bg-brand-800 text-white shadow-brand-200 hover:scale-[1.01]'
              }`}
            >
              <ShoppingBag className="w-5 h-5" />
              {added
                ? '✓ Ajouté au panier !'
                : isCurrentSelectionOutOfStock
                ? 'Taille épuisée'
                : 'Ajouter au panier'}
            </button>
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-4 px-6 rounded-xl font-semibold bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-200 transition-all hover:scale-[1.01]"
              title="Poser une question ou commander sur WhatsApp"
            >
              <MessageCircle className="w-5 h-5" /> WhatsApp
            </a>
          </div>

          {/* COD info */}
          <div className="mt-6 flex items-center gap-3 text-sm text-gray-500 bg-gray-50 p-4 rounded-xl border border-gray-100">
            <span className="text-2xl">🚚</span>
            <div>
              <p className="font-semibold text-gray-700">Livraison partout en Tunisie</p>
              <p className="text-xs">Paiement à la livraison (Espèces) — Frais : 8,000 TND</p>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="mt-20 pt-12 border-t border-gray-100">
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-brand-900 mb-8">Vous aimerez aussi</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {relatedProducts.map(rp => (
              <Link key={rp.id} to={`/product/${rp.id}`} className="group bg-white rounded-2xl overflow-hidden border border-brand-100 hover:shadow-xl transition-all">
                <div className="aspect-[3/4] relative overflow-hidden bg-gray-100">
                  <img
                    src={getImageUrl(rp.images?.[0])}
                    alt={rp.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {rp.sale_price && (
                    <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">PROMO</div>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-xs text-brand-400 mb-1">{rp.category}</p>
                  <h3 className="font-serif font-semibold text-brand-900 line-clamp-1">{rp.name}</h3>
                  <p className="text-brand-700 font-bold mt-1">
                    {(rp.sale_price ? parseFloat(rp.sale_price) : parseFloat(rp.price)).toFixed(3)} TND
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ProductDetail;
