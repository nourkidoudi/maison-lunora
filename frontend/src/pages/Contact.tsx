import { useSettings } from '../hooks/useSettings';

const Contact = () => {
  const settings = useSettings();
  const WHATSAPP_NUMBER = settings.whatsapp_number;
  const INSTAGRAM_HANDLE = settings.instagram_handle;
  const PHONE_NUMBER = settings.phone_number;
  const displayWhatsapp = WHATSAPP_NUMBER.startsWith('216')
    ? WHATSAPP_NUMBER.replace('216', '+216 ')
    : WHATSAPP_NUMBER;

  return (
    <div className="container mx-auto px-4 py-16 max-w-lg">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-serif font-bold text-brand-900 mb-3">Contactez-nous</h1>
        <p className="text-gray-500">Nous sommes disponibles pour répondre à toutes vos questions.</p>
        <p className="text-xs text-amber-600 mt-3 bg-amber-50 p-2 rounded-lg">
          ⚠️ Remplacez les numéros factices par les vraies coordonnées de la boutique
        </p>
      </div>
      <div className="space-y-4">
        <a
          href={`https://wa.me/${WHATSAPP_NUMBER}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-4 bg-green-50 hover:bg-green-100 border border-green-200 p-5 rounded-2xl transition-all group"
        >
          <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white text-2xl flex-shrink-0">
            💬
          </div>
          <div>
            <p className="font-semibold text-gray-800 group-hover:text-green-700 transition-colors">WhatsApp</p>
            <p className="text-sm text-gray-500">Répondons en quelques minutes — {displayWhatsapp}</p>
          </div>
          <span className="ml-auto text-green-500">→</span>
        </a>

        <a
          href={`https://instagram.com/${INSTAGRAM_HANDLE}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-4 bg-pink-50 hover:bg-pink-100 border border-pink-200 p-5 rounded-2xl transition-all group"
        >
          <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl flex-shrink-0">
            📸
          </div>
          <div>
            <p className="font-semibold text-gray-800 group-hover:text-pink-700 transition-colors">Instagram</p>
            <p className="text-sm text-gray-500">@{INSTAGRAM_HANDLE}</p>
          </div>
          <span className="ml-auto text-pink-500">→</span>
        </a>

        <a
          href={`tel:${PHONE_NUMBER}`}
          className="flex items-center gap-4 bg-brand-50 hover:bg-brand-100 border border-brand-200 p-5 rounded-2xl transition-all group"
        >
          <div className="w-12 h-12 bg-brand-600 rounded-full flex items-center justify-center text-white text-2xl flex-shrink-0">
            📞
          </div>
          <div>
            <p className="font-semibold text-gray-800 group-hover:text-brand-700 transition-colors">Téléphone</p>
            <p className="text-sm text-gray-500">{PHONE_NUMBER}</p>
          </div>
          <span className="ml-auto text-brand-500">→</span>
        </a>
      </div>

      <div className="mt-10 bg-brand-50 rounded-2xl p-6 text-center">
        <p className="text-brand-700 font-medium">⏰ Heures de disponibilité</p>
        <p className="text-gray-500 text-sm mt-1">Lundi – Samedi : 9h00 – 20h00</p>
        <p className="text-gray-400 text-xs mt-2">Dimanche : Fermé</p>
      </div>
    </div>
  );
};

export default Contact;
