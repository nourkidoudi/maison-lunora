import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-brand-900 text-brand-100 py-12">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h3 className="text-xl font-serif font-bold mb-4">MAISON LUNORA</h3>
          <p className="text-brand-200 text-sm leading-relaxed max-w-sm">
            L'élégance à la tunisienne. Des vêtements conçus pour vous sublimer au quotidien.
          </p>
        </div>
        <div>
          <h4 className="font-medium mb-4 uppercase tracking-wider text-sm">Liens Utiles</h4>
          <ul className="space-y-2 text-sm text-brand-200">
            <li><Link to="/" className="hover:text-white transition-colors">Accueil</Link></li>
            <li><Link to="/shop" className="hover:text-white transition-colors">Boutique</Link></li>
            <li><Link to="/contact" className="hover:text-white transition-colors">Contactez-nous</Link></li>
            <li><Link to="/promotions" className="hover:text-white transition-colors">Promotions</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-medium mb-4 uppercase tracking-wider text-sm">Informations</h4>
          <ul className="space-y-2 text-sm text-brand-200">
            <li>Paiement à la livraison</li>
            <li>Livraison sur toute la Tunisie</li>
            <li>Frais de livraison : 8,000 TND</li>
            <li>Retour sous 7 jours</li>
          </ul>
        </div>
      </div>
      <div className="container mx-auto px-4 mt-8 pt-8 border-t border-brand-800 text-center text-sm text-brand-300">
        &copy; {new Date().getFullYear()} Maison Lunora. Tous droits réservés.
      </div>
    </footer>
  );
};

export default Footer;
