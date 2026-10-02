import { Link } from 'react-router-dom';
import { Home, ShoppingBag } from 'lucide-react';

const NotFound = () => (
  <div className="min-h-[70vh] flex items-center justify-center p-4">
    <div className="text-center max-w-md">
      <p className="text-8xl md:text-9xl font-serif font-bold text-brand-200 mb-4">404</p>
      <h1 className="text-3xl font-serif font-bold text-brand-900 mb-4">Page introuvable</h1>
      <p className="text-gray-500 mb-8">
        La page que vous recherchez n'existe pas ou a été déplacée.
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-6 py-3 rounded-full font-medium transition-colors"
        >
          <Home className="w-4 h-4" /> Accueil
        </Link>
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 border-2 border-brand-200 text-brand-700 px-6 py-3 rounded-full font-medium hover:bg-brand-50 transition-colors"
        >
          <ShoppingBag className="w-4 h-4" /> Boutique
        </Link>
      </div>
    </div>
  </div>
);

export default NotFound;
