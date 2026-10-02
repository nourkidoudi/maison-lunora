import { Outlet, Navigate, Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, LogOut, Settings, Percent } from 'lucide-react';
import { useEffect, useState } from 'react';
import api from '../../api';

const AdminLayout = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await api.get('/admin/me');
        setIsAuthenticated(true);
      } catch (err) {
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, []);

  if (isAuthenticated === null) return <div>Chargement...</div>;
  if (!isAuthenticated) return <Navigate to="/admin/login" />;

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-64 bg-brand-900 text-white flex flex-col">
        <div className="p-6">
          <h2 className="text-2xl font-serif font-bold">Maison Lunora</h2>
          <p className="text-brand-300 text-sm">Espace Admin</p>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          <Link to="/admin/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-brand-800 transition-colors">
            <LayoutDashboard className="w-5 h-5" /> Dashboard
          </Link>
          <Link to="/admin/products" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-brand-800 transition-colors">
            <Package className="w-5 h-5" /> Produits
          </Link>
          <Link to="/admin/orders" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-brand-800 transition-colors">
            <ShoppingCart className="w-5 h-5" /> Commandes
          </Link>
          <Link to="/admin/coupons" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-brand-800 transition-colors">
            <Percent className="w-5 h-5" /> Coupons
          </Link>
          <Link to="/admin/settings" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-brand-800 transition-colors">
            <Settings className="w-5 h-5" /> Paramètres
          </Link>
        </nav>
        <div className="p-4 border-t border-brand-800">
          <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-2 text-brand-200 hover:text-white transition-colors">
            <LogOut className="w-5 h-5" /> Déconnexion
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-8">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
