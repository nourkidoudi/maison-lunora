import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Search, Menu, X } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useState } from 'react';

const Navbar = () => {
  const { cart, setCartOpen } = useStore();
  const cartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const navLinks = [
    { to: '/', label: 'Accueil' },
    { to: '/shop', label: 'Boutique' },
    { to: '/nouveautes', label: 'Nouveautés' },
    { to: '/promotions', label: 'Promotions' },
    { to: '/contact', label: 'Contact' },
  ];

  const [showAnnouncement, setShowAnnouncement] = useState(true);

  return (
    <>
      {/* Top Announcement Bar */}
      {showAnnouncement && (
        <div className="bg-brand-900 text-brand-100 text-xs py-2 px-4 relative z-50 border-b border-brand-800">
          <div className="container mx-auto flex items-center justify-center gap-2 text-center">
            <span className="font-medium tracking-wide">
              ✨ <strong>Livraison offerte</strong> dès 120 TND d'achat | Utilisez le code{' '}
              <span className="bg-brand-800 text-amber-300 font-bold px-1.5 py-0.5 rounded tracking-wider border border-amber-400/30">
                BIENVENUE10
              </span>{' '}
              (-10%)
            </span>
            <button
              onClick={() => setShowAnnouncement(false)}
              className="absolute right-3 text-brand-300 hover:text-white transition-colors"
              title="Fermer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      <header className="bg-white border-b border-brand-100 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(true)}
            className="text-gray-600 hover:text-brand-600 transition-colors lg:hidden"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Logo */}
          <Link to="/" className="text-2xl font-serif font-bold text-brand-900 tracking-widest hover:text-brand-700 transition-colors">
            MAISON LUNORA
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className="text-gray-600 hover:text-brand-700 transition-colors uppercase text-xs font-semibold tracking-widest relative group"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-brand-600 transition-all duration-300 group-hover:w-full" />
              </Link>
            ))}
          </nav>

          {/* Right Icons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSearchOpen(true)}
              className="text-gray-600 hover:text-brand-600 transition-colors p-1"
            >
              <Search className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCartOpen(true)}
              className="text-gray-600 hover:text-brand-600 transition-colors relative p-1"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-brand-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {cartItemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[200] flex lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="relative w-72 bg-white h-full shadow-2xl flex flex-col">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <span className="font-serif font-bold text-xl text-brand-900">MAISON LUNORA</span>
              <button onClick={() => setMobileOpen(false)}>
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <nav className="flex flex-col p-4 gap-1">
              {navLinks.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className="px-4 py-3 text-gray-700 hover:bg-brand-50 hover:text-brand-700 rounded-lg transition-colors font-medium"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="mt-auto p-4 border-t border-gray-100">
              <Link to="/admin/login" onClick={() => setMobileOpen(false)} className="text-xs text-gray-400 hover:text-brand-600 transition-colors">
                Espace Admin
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Search Overlay */}
      {searchOpen && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-24 px-4">
          <form onSubmit={handleSearch} className="bg-white rounded-2xl shadow-2xl w-full max-w-xl p-4 flex items-center gap-3">
            <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <input
              autoFocus
              type="text"
              placeholder="Rechercher un produit..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="flex-1 text-lg outline-none text-gray-800 placeholder-gray-300"
            />
            <button type="button" onClick={() => setSearchOpen(false)}>
              <X className="w-5 h-5 text-gray-400 hover:text-gray-700" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default Navbar;
