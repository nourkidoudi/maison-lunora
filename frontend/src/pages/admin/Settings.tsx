import { useEffect, useState } from 'react';
import api from '../../api';
import { Save, Phone, MessageCircle, DollarSign, Key } from 'lucide-react';
import { invalidateSettingsCache } from '../../hooks/useSettings';

const AdminSettings = () => {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [savedMsg, setSavedMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', new_password_confirm: '' });
  const [pwMsg, setPwMsg] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  useEffect(() => {
    api.get('/settings').then(({ data }) => setSettings(data));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings({ ...settings, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSavedMsg('');
    setError('');
    try {
      await api.put('/settings', settings);
      invalidateSettingsCache();
      setSavedMsg('Paramètres sauvegardés avec succès.');
      setTimeout(() => setSavedMsg(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwLoading(true);
    setPwMsg('');
    setPwError('');
    if (pwForm.new_password !== pwForm.new_password_confirm) {
      setPwError('Les nouveaux mots de passe ne correspondent pas.');
      setPwLoading(false);
      return;
    }
    if (pwForm.new_password.length < 6) {
      setPwError('Mot de passe minimum 6 caractères.');
      setPwLoading(false);
      return;
    }
    try {
      await api.put('/admin/password', {
        current_password: pwForm.current_password,
        new_password: pwForm.new_password
      });
      setPwMsg('Mot de passe changé avec succès.');
      setPwForm({ current_password: '', new_password: '', new_password_confirm: '' });
      setTimeout(() => setPwMsg(''), 3000);
    } catch (err: any) {
      setPwError(err.response?.data?.error || 'Erreur');
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Paramètres</h1>
        <p className="text-gray-500 mt-1">Gérez les informations de votre boutique.</p>
      </div>

      {/* Paramètres de contact */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">
        <h2 className="text-xl font-bold text-gray-800 mb-2">Informations de contact et boutique</h2>

        {savedMsg && <div className="p-4 bg-green-50 text-green-700 rounded-xl font-medium">{savedMsg}</div>}
        {error && <div className="p-4 bg-red-50 text-red-700 rounded-xl font-medium">{error}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
              <MessageCircle className="w-4 h-4 text-green-500" /> Numéro WhatsApp
            </label>
            <input
              name="whatsapp_number"
              value={settings.whatsapp_number || ''}
              onChange={handleChange}
              placeholder="216XXXXXXXXX (sans +)"
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-brand-500 focus:border-brand-500"
            />
            <p className="text-xs text-gray-400 mt-1">Format international : 216 suivi du numéro (ex: 21620123456)</p>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
              <Phone className="w-4 h-4 text-brand-500" /> Numéro de téléphone
            </label>
            <input
              name="phone_number"
              value={settings.phone_number || ''}
              onChange={handleChange}
              placeholder="+216 XX XXX XXX"
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-brand-500 focus:border-brand-500"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
              <span className="text-pink-500 text-lg leading-none">📸</span> Pseudo Instagram
            </label>
            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-brand-500">
              <span className="px-3 text-gray-400 bg-gray-50 h-full border-r">@</span>
              <input
                name="instagram_handle"
                value={settings.instagram_handle || ''}
                onChange={handleChange}
                placeholder="maisonlunora"
                className="flex-1 p-3 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
              <DollarSign className="w-4 h-4 text-amber-500" /> Frais de livraison (TND)
            </label>
            <input
              name="delivery_fee"
              type="number"
              step="0.001"
              min="0"
              value={settings.delivery_fee || ''}
              onChange={handleChange}
              placeholder="8"
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-brand-500 focus:border-brand-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-semibold px-6 py-3 rounded-xl shadow transition-colors"
        >
          <Save className="w-5 h-5" />
          {loading ? 'Sauvegarde...' : 'Sauvegarder les paramètres'}
        </button>
      </form>

      {/* Changement de mot de passe */}
      <form onSubmit={handlePasswordChange} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Key className="w-6 h-6 text-brand-500" />
          Sécurité — Changer le mot de passe
        </h2>

        {pwMsg && <div className="p-4 bg-green-50 text-green-700 rounded-xl font-medium">{pwMsg}</div>}
        {pwError && <div className="p-4 bg-red-50 text-red-700 rounded-xl font-medium">{pwError}</div>}

        <div className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Ancien mot de passe</label>
            <input
              type="password"
              value={pwForm.current_password}
              onChange={e => setPwForm({ ...pwForm, current_password: e.target.value })}
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-brand-500 focus:border-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nouveau mot de passe</label>
            <input
              type="password"
              value={pwForm.new_password}
              onChange={e => setPwForm({ ...pwForm, new_password: e.target.value })}
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-brand-500 focus:border-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirmer le nouveau mot de passe</label>
            <input
              type="password"
              value={pwForm.new_password_confirm}
              onChange={e => setPwForm({ ...pwForm, new_password_confirm: e.target.value })}
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-brand-500 focus:border-brand-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={pwLoading}
          className="inline-flex items-center gap-2 bg-gray-800 hover:bg-gray-900 disabled:opacity-50 text-white font-semibold px-6 py-3 rounded-xl shadow transition-colors"
        >
          <Key className="w-5 h-5" />
          {pwLoading ? 'Modification...' : 'Changer le mot de passe'}
        </button>
      </form>
    </div>
  );
};

export default AdminSettings;
