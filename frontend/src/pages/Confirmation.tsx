import { useLocation, Link, Navigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';

const Confirmation = () => {
  const location = useLocation();
  const orderNumber = location.state?.orderNumber;

  if (!orderNumber) {
    return <Navigate to="/" />;
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="bg-white p-8 md:p-12 rounded-2xl shadow-xl max-w-lg w-full text-center border border-brand-100">
        <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
        <h1 className="text-3xl font-serif font-bold text-brand-900 mb-4">Merci pour votre commande !</h1>
        <p className="text-gray-600 mb-6 text-lg">
          Votre commande <span className="font-bold text-brand-600">{orderNumber}</span> a bien été enregistrée.
        </p>
        <p className="text-sm text-gray-500 mb-8">
          Notre équipe va préparer votre colis. Vous serez contacté par le livreur avant son passage. <br/>(Paiement à la livraison)
        </p>
        <Link 
          to="/shop"
          className="inline-block bg-brand-600 hover:bg-brand-700 text-white font-medium py-3 px-8 rounded-lg transition-colors"
        >
          Retour à la boutique
        </Link>
      </div>
    </div>
  );
};

export default Confirmation;
