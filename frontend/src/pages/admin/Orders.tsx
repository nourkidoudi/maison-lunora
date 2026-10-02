import { useEffect, useState, useMemo } from 'react';
import api from '../../api';
import {
  X,
  MapPin,
  User,
  FileText,
  Search,
  Download,
  Printer,
  MessageCircle,
  Phone,
  Filter,
  CheckCircle2,
  Clock,
  Truck,
  PackageCheck,
  Ban
} from 'lucide-react';
import { exportOrdersToCSV, printPackingSlip, type Order } from '../../utils/exportOrders';

const STATUSES = ['Nouvelle', 'Confirmée', 'Expédiée', 'Livrée', 'Annulée'] as const;

const statusConfig: Record<string, { bg: string; text: string; badge: string; icon: any }> = {
  'Nouvelle': { bg: 'bg-blue-50 text-blue-700 border-blue-200', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-800', icon: Clock },
  'Confirmée': { bg: 'bg-amber-50 text-amber-700 border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-800', icon: CheckCircle2 },
  'Expédiée': { bg: 'bg-purple-50 text-purple-700 border-purple-200', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-800', icon: Truck },
  'Livrée': { bg: 'bg-green-50 text-green-700 border-green-200', text: 'text-green-700', badge: 'bg-green-100 text-green-800', icon: PackageCheck },
  'Annulée': { bg: 'bg-red-50 text-red-700 border-red-200', text: 'text-red-700', badge: 'bg-red-100 text-red-800', icon: Ban },
};

const GOVERNORATES = [
  'Tous les gouvernorats',
  'Tunis', 'Ariana', 'Ben Arous', 'Manouba',
  'Nabeul', 'Zaghouan', 'Bizerte', 'Béja',
  'Jendouba', 'Le Kef', 'Siliana', 'Sousse',
  'Monastir', 'Mahdia', 'Sfax', 'Kairouan',
  'Kasserine', 'Sidi Bouzid', 'Gabès', 'Médenine',
  'Tataouine', 'Gafsa', 'Tozeur', 'Kebili'
];

const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [activeStatus, setActiveStatus] = useState<string>('Tous');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedGov, setSelectedGov] = useState<string>('Tous les gouvernorats');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/orders');
      setOrders(data);
    } catch (err) {
      console.error('Erreur de chargement des commandes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await api.put(`/orders/${id}/status`, { status });
      setOrders(prev => prev.map(o => (o.id === id ? { ...o, status } : o)));
      if (selectedOrder && selectedOrder.id === id) {
        setSelectedOrder(prev => (prev ? { ...prev, status } : null));
      }
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la mise à jour du statut.');
    }
  };

  const fetchOrderDetail = async (id: number) => {
    try {
      const { data } = await api.get(`/orders/${id}`);
      setSelectedOrder(data);
    } catch (err) {
      console.error(err);
    }
  };

  // Status counters for badge tabs
  const counts = useMemo(() => {
    const res: Record<string, number> = { Tous: orders.length };
    STATUSES.forEach(s => {
      res[s] = orders.filter(o => o.status === s).length;
    });
    return res;
  }, [orders]);

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // Status filter
      if (activeStatus !== 'Tous' && order.status !== activeStatus) {
        return false;
      }

      // Governorate filter
      if (selectedGov !== 'Tous les gouvernorats' && order.governorate !== selectedGov) {
        return false;
      }

      // Search query filter (Order number, Customer name, Phone, Delegation, Address)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchNumber = order.order_number.toLowerCase().includes(q);
        const matchName = order.customer_name.toLowerCase().includes(q);
        const matchPhone = order.phone.toLowerCase().includes(q);
        const matchGov = order.governorate.toLowerCase().includes(q);
        const matchDel = (order.delegation || '').toLowerCase().includes(q);
        const matchAddress = (order.address || '').toLowerCase().includes(q);
        return matchNumber || matchName || matchPhone || matchGov || matchDel || matchAddress;
      }

      return true;
    });
  }, [orders, activeStatus, selectedGov, searchQuery]);

  // Quick stats from filtered list
  const totalFilteredAmount = useMemo(() => {
    return filteredOrders
      .filter(o => o.status !== 'Annulée')
      .reduce((acc, o) => acc + parseFloat(o.total || '0'), 0);
  }, [filteredOrders]);

  // Generate pre-filled WhatsApp link for customer
  const getWhatsAppLink = (order: Order) => {
    const cleanPhone = order.phone.replace(/[^0-9]/g, '');
    const intlPhone = cleanPhone.startsWith('216') ? cleanPhone : `216${cleanPhone}`;
    const msg = encodeURIComponent(
      `Bonjour ${order.customer_name},\n\nC'est Maison Lunora. Nous confirmons la réception de votre commande *${order.order_number}* d'un montant de *${parseFloat(order.total).toFixed(3)} TND* (livraison à ${order.governorate}).\n\nConfirmez-vous la livraison de votre colis ? Merci !`
    );
    return `https://wa.me/${intlPhone}?text=${msg}`;
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Gestion des Commandes</h1>
          <p className="text-sm text-gray-500 mt-1">
            {filteredOrders.length} commande(s) affichée(s) — Total : <span className="font-semibold text-brand-800">{totalFilteredAmount.toFixed(3)} TND</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => exportOrdersToCSV(filteredOrders, `commandes_maison_lunora_${activeStatus.toLowerCase()}.csv`)}
            className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 px-4 py-2.5 rounded-xl font-medium shadow-sm transition-all hover:border-gray-300 text-sm"
            title="Exporter les commandes affichées au format Excel/CSV"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Exporter CSV ({filteredOrders.length})</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs by Status */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-gray-200 scrollbar-none">
        <button
          onClick={() => setActiveStatus('Tous')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
            activeStatus === 'Tous'
              ? 'bg-brand-900 text-white shadow-md'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <span>Tous</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${activeStatus === 'Tous' ? 'bg-brand-800 text-white' : 'bg-gray-100 text-gray-600'}`}>
            {counts['Tous'] || 0}
          </span>
        </button>

        {STATUSES.map(status => {
          const cfg = statusConfig[status];
          const Icon = cfg.icon;
          const isActive = activeStatus === status;
          return (
            <button
              key={status}
              onClick={() => setActiveStatus(status)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap border ${
                isActive
                  ? `${cfg.badge} border-transparent shadow-md font-bold`
                  : 'bg-white text-gray-600 hover:bg-gray-50 border-gray-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{status}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${isActive ? 'bg-white/80' : 'bg-gray-100 text-gray-600'}`}>
                {counts[status] || 0}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search and Secondary Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
        {/* Search input */}
        <div className="sm:col-span-2 relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par N° Commande (ORD-XXXX), Client, Téléphone, Adresse..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Governorate Filter */}
        <div className="relative">
          <Filter className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <select
            value={selectedGov}
            onChange={e => setSelectedGov(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none bg-white cursor-pointer"
          >
            {GOVERNORATES.map(gov => (
              <option key={gov} value={gov}>{gov}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px]">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wider font-semibold">
              <tr>
                <th className="text-left p-4">N° Commande</th>
                <th className="text-left p-4">Client</th>
                <th className="text-left p-4">Téléphone</th>
                <th className="text-left p-4">Région</th>
                <th className="text-left p-4">Articles</th>
                <th className="text-left p-4">Total COD</th>
                <th className="text-left p-4">Date</th>
                <th className="text-left p-4">Statut</th>
                <th className="text-center p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-400">
                    Chargement des commandes...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-400">
                    <p className="text-lg">Aucune commande trouvée</p>
                    <p className="text-xs text-gray-400 mt-1">Modifiez vos filtres ou effectuez une autre recherche.</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => {
                  const cfg = statusConfig[order.status] || { badge: 'bg-gray-100 text-gray-700' };
                  const itemsCount = (order.items || []).reduce((acc, it) => acc + (it.quantity || 0), 0);

                  return (
                    <tr
                      key={order.id}
                      onClick={() => fetchOrderDetail(order.id)}
                      className="hover:bg-amber-50/40 transition-colors cursor-pointer group"
                    >
                      {/* Order Number */}
                      <td className="p-4">
                        <span className="font-mono font-bold text-brand-800 group-hover:text-brand-600 transition-colors">
                          {order.order_number}
                        </span>
                      </td>

                      {/* Customer Name */}
                      <td className="p-4">
                        <span className="font-semibold text-gray-800">{order.customer_name}</span>
                        {order.comment && (
                          <span className="block text-xs text-amber-700 truncate max-w-[160px]" title={order.comment}>
                            💬 {order.comment}
                          </span>
                        )}
                      </td>

                      {/* Phone */}
                      <td className="p-4 text-sm">
                        <a
                          href={`tel:${order.phone}`}
                          onClick={e => e.stopPropagation()}
                          className="text-gray-600 hover:text-brand-600 hover:underline flex items-center gap-1"
                        >
                          <Phone className="w-3.5 h-3.5 text-gray-400" />
                          {order.phone}
                        </a>
                      </td>

                      {/* Governorate */}
                      <td className="p-4 text-sm text-gray-600">
                        <div className="font-medium text-gray-800">{order.governorate}</div>
                        {order.delegation && <div className="text-xs text-gray-400">{order.delegation}</div>}
                      </td>

                      {/* Items count & summary */}
                      <td className="p-4 text-sm">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          {itemsCount} article{itemsCount > 1 ? 's' : ''}
                        </span>
                      </td>

                      {/* Total */}
                      <td className="p-4">
                        <span className="font-bold text-brand-900 text-sm">
                          {parseFloat(order.total).toFixed(3)} TND
                        </span>
                        {order.coupon_code && (
                          <span className="block text-[10px] text-green-600 font-semibold">
                            Promo: {order.coupon_code}
                          </span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="p-4 text-xs text-gray-500 whitespace-nowrap">
                        {new Date(order.created_at).toLocaleDateString('fr-TN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>

                      {/* Status Dropdown */}
                      <td className="p-4" onClick={e => e.stopPropagation()}>
                        <select
                          value={order.status}
                          onChange={e => handleStatusChange(order.id, e.target.value)}
                          className={`text-xs font-semibold px-2.5 py-1.5 rounded-full border-0 cursor-pointer shadow-sm ${cfg.badge}`}
                        >
                          {STATUSES.map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </td>

                      {/* Action buttons (Print, WhatsApp) */}
                      <td className="p-4" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => printPackingSlip(order)}
                            className="p-1.5 text-gray-500 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition-colors"
                            title="Imprimer le bon de livraison"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <a
                            href={getWhatsAppLink(order)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Contacter le client sur WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-serif font-bold text-brand-900">
                      Commande {selectedOrder.order_number}
                    </h2>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${statusConfig[selectedOrder.status]?.badge || 'bg-gray-100'}`}>
                      {selectedOrder.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Passée le {new Date(selectedOrder.created_at).toLocaleDateString('fr-TN', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => printPackingSlip(selectedOrder)}
                  className="flex items-center gap-1.5 bg-brand-700 hover:bg-brand-800 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-sm transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimer le Bon</span>
                </button>
                <a
                  href={getWhatsAppLink(selectedOrder)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-sm transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp</span>
                </a>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto p-6 space-y-6 flex-1">
              {/* Client & Address Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-2xl p-5 space-y-3 border border-gray-100">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2 text-sm uppercase tracking-wider">
                    <User className="w-4 h-4 text-brand-600" /> Informations Client
                  </h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-gray-500">Nom :</span> <span className="font-semibold text-gray-800">{selectedOrder.customer_name}</span></p>
                    <p>
                      <span className="text-gray-500">Téléphone :</span>{' '}
                      <a href={`tel:${selectedOrder.phone}`} className="text-brand-600 font-semibold hover:underline">
                        {selectedOrder.phone}
                      </a>
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-2xl p-5 space-y-3 border border-gray-100">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2 text-sm uppercase tracking-wider">
                    <MapPin className="w-4 h-4 text-brand-600" /> Adresse de Livraison
                  </h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-gray-500">Gouvernorat :</span> <span className="font-semibold text-gray-800">{selectedOrder.governorate}</span></p>
                    <p><span className="text-gray-500">Délégation :</span> <span className="font-semibold text-gray-800">{selectedOrder.delegation || '—'}</span></p>
                    <p><span className="text-gray-500">Adresse :</span> <span className="font-medium text-gray-800">{selectedOrder.address}</span></p>
                    {selectedOrder.postal_code && (
                      <p><span className="text-gray-500">Code postal :</span> <span>{selectedOrder.postal_code}</span></p>
                    )}
                  </div>
                </div>
              </div>

              {/* Customer comment */}
              {selectedOrder.comment && (
                <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200">
                  <h3 className="font-semibold text-amber-800 flex items-center gap-2 text-sm mb-1">
                    <FileText className="w-4 h-4" /> Commentaire / Remarque client
                  </h3>
                  <p className="text-sm text-amber-900 font-medium">{selectedOrder.comment}</p>
                </div>
              )}

              {/* Items Table */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wider">
                  Articles Commandés
                </h3>
                <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                      <tr>
                        <th className="text-left p-3.5 font-semibold">Produit</th>
                        <th className="text-left p-3.5 font-semibold">Variante (Taille / Couleur)</th>
                        <th className="text-center p-3.5 font-semibold">Qté</th>
                        <th className="text-right p-3.5 font-semibold">Prix Unitaire</th>
                        <th className="text-right p-3.5 font-semibold">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {(selectedOrder.items || []).map(item => (
                        <tr key={item.id}>
                          <td className="p-3.5 font-medium text-gray-800">{item.product_name}</td>
                          <td className="p-3.5 text-gray-600">
                            {item.size || item.color ? `${item.size || '—'} / ${item.color || '—'}` : 'Unique'}
                          </td>
                          <td className="p-3.5 text-center font-bold text-gray-800">{item.quantity}</td>
                          <td className="p-3.5 text-right text-gray-600">{parseFloat(item.unit_price).toFixed(3)} TND</td>
                          <td className="p-3.5 text-right font-bold text-gray-800">
                            {(parseFloat(item.unit_price) * item.quantity).toFixed(3)} TND
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50/80 border-t border-gray-200 text-sm">
                      {selectedOrder.subtotal && (
                        <tr>
                          <td colSpan={4} className="p-2.5 text-right text-gray-500">Sous-total articles :</td>
                          <td className="p-2.5 text-right font-semibold text-gray-700">
                            {parseFloat(String(selectedOrder.subtotal)).toFixed(3)} TND
                          </td>
                        </tr>
                      )}
                      {selectedOrder.coupon_discount && parseFloat(String(selectedOrder.coupon_discount)) > 0 && (
                        <tr>
                          <td colSpan={4} className="p-2.5 text-right text-green-600">
                            Réduction coupon ({selectedOrder.coupon_code || ''}) :
                          </td>
                          <td className="p-2.5 text-right font-semibold text-green-600">
                            -{parseFloat(String(selectedOrder.coupon_discount)).toFixed(3)} TND
                          </td>
                        </tr>
                      )}
                      <tr>
                        <td colSpan={4} className="p-2.5 text-right text-gray-500">Frais de livraison :</td>
                        <td className="p-2.5 text-right font-semibold text-gray-700">
                          {parseFloat(String(selectedOrder.delivery_fee || 8)).toFixed(3)} TND
                        </td>
                      </tr>
                      <tr className="border-t border-gray-300 bg-amber-50/50">
                        <td colSpan={4} className="p-3.5 text-right font-bold text-gray-800 text-base">
                          Total à payer à la livraison (COD) :
                        </td>
                        <td className="p-3.5 text-right font-bold text-brand-800 text-lg">
                          {parseFloat(selectedOrder.total).toFixed(3)} TND
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Change Status in modal */}
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">
                  Mettre à jour le statut de la commande
                </label>
                <div className="flex flex-wrap gap-2">
                  {STATUSES.map(s => {
                    const isCurrent = selectedOrder.status === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => handleStatusChange(selectedOrder.id, s)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                          isCurrent
                            ? `${statusConfig[s].badge} ring-2 ring-offset-1 ring-brand-600 shadow-sm`
                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
