import { useEffect, useState } from 'react';
import api from '../../api';
import { Package, ShoppingCart, Clock, AlertTriangle } from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    lowStock: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/admin/dashboard');
        setStats(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchStats();
  }, []);

  const statCards = [
    { title: 'Total Produits', value: stats.totalProducts, icon: Package, color: 'text-blue-500' },
    { title: 'Total Commandes', value: stats.totalOrders, icon: ShoppingCart, color: 'text-emerald-500' },
    { title: 'Commandes en attente', value: stats.pendingOrders, icon: Clock, color: 'text-amber-500' },
    { title: 'Produits stock faible', value: stats.lowStock, icon: AlertTriangle, color: 'text-red-500' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Tableau de bord</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">{stat.value}</p>
              </div>
              <div className={`p-3 bg-gray-50 rounded-lg ${stat.color}`}>
                <Icon className="w-8 h-8" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Dashboard;
