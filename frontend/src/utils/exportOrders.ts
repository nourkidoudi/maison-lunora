export interface OrderItem {
  id: number;
  product_id: number | null;
  product_name: string;
  size: string | null;
  color: string | null;
  quantity: number;
  unit_price: string;
}

export interface Order {
  id: number;
  order_number: string;
  customer_name: string;
  phone: string;
  governorate: string;
  delegation: string;
  address: string;
  postal_code: string;
  comment: string;
  subtotal?: string | number;
  coupon_code?: string | null;
  coupon_discount?: string | number;
  delivery_fee?: string | number;
  total: string;
  status: string;
  created_at: string;
  items?: OrderItem[];
}

/**
 * Exports orders to CSV with UTF-8 BOM so Excel opens it with proper accents.
 */
export const exportOrdersToCSV = (orders: Order[], filename = 'commandes_maison_lunora.csv') => {
  if (!orders || orders.length === 0) {
    alert('Aucune commande à exporter.');
    return;
  }

  const headers = [
    'N° Commande',
    'Date',
    'Statut',
    'Client',
    'Téléphone',
    'Gouvernorat',
    'Délégation',
    'Adresse',
    'Code Postal',
    'Articles',
    'Nombre Articles',
    'Sous-Total (TND)',
    'Code Promo',
    'Remise Promo (TND)',
    'Frais Livraison (TND)',
    'Total COD (TND)',
    'Commentaire'
  ];

  const escapeCSV = (value: any) => {
    if (value === null || value === undefined) return '""';
    const str = String(value).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = orders.map(order => {
    const itemsSummary = (order.items || [])
      .map(it => `${it.product_name} (Qté: ${it.quantity}${it.size || it.color ? `, ${it.size || ''}/${it.color || ''}` : ''})`)
      .join(' | ');

    const totalQty = (order.items || []).reduce((sum, it) => sum + (it.quantity || 0), 0);
    const dateFormatted = new Date(order.created_at).toLocaleDateString('fr-TN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    return [
      escapeCSV(order.order_number),
      escapeCSV(dateFormatted),
      escapeCSV(order.status),
      escapeCSV(order.customer_name),
      escapeCSV(order.phone),
      escapeCSV(order.governorate),
      escapeCSV(order.delegation || ''),
      escapeCSV(order.address),
      escapeCSV(order.postal_code || ''),
      escapeCSV(itemsSummary),
      escapeCSV(totalQty),
      escapeCSV(order.subtotal ? parseFloat(String(order.subtotal)).toFixed(3) : ''),
      escapeCSV(order.coupon_code || ''),
      escapeCSV(order.coupon_discount ? parseFloat(String(order.coupon_discount)).toFixed(3) : '0.000'),
      escapeCSV(order.delivery_fee ? parseFloat(String(order.delivery_fee)).toFixed(3) : '8.000'),
      escapeCSV(parseFloat(order.total).toFixed(3)),
      escapeCSV(order.comment || '')
    ].join(';'); // Semicolon delimiter works best in Excel for French locale
  });

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Triggers a printable packing slip / delivery note for a given order.
 */
export const printPackingSlip = (order: Order, shopName = 'Maison Lunora') => {
  const printWindow = window.open('', '_blank', 'width=850,height=900');
  if (!printWindow) {
    alert('Veuillez autoriser les fenêtres pop-up pour imprimer le bon de livraison.');
    return;
  }

  const dateFormatted = new Date(order.created_at).toLocaleDateString('fr-TN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const itemsHtml = (order.items || [])
    .map(
      item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: 500;">${item.product_name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #4b5563;">${item.size || item.color ? `${item.size || '—'} / ${item.color || '—'}` : 'Unique'}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center; font-weight: 600;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">${parseFloat(item.unit_price).toFixed(3)} TND</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">${(parseFloat(item.unit_price) * item.quantity).toFixed(3)} TND</td>
      </tr>
    `
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8" />
      <title>Bon de Livraison - ${order.order_number}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          color: #1f2937;
          background: #fff;
          margin: 0;
          padding: 30px;
          line-height: 1.5;
        }
        .container {
          max-width: 780px;
          margin: 0 auto;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2px solid #854d0e;
          padding-bottom: 20px;
          margin-bottom: 25px;
        }
        .brand-title {
          font-size: 24px;
          font-weight: bold;
          letter-spacing: 2px;
          color: #713f12;
          margin: 0;
          text-transform: uppercase;
        }
        .brand-subtitle {
          font-size: 13px;
          color: #6b7280;
          margin-top: 4px;
        }
        .doc-title {
          text-align: right;
        }
        .doc-title h2 {
          margin: 0;
          font-size: 20px;
          color: #111827;
        }
        .doc-title p {
          margin: 4px 0 0;
          font-size: 13px;
          color: #6b7280;
        }
        .grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 25px;
        }
        .card {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 15px;
        }
        .card-title {
          font-size: 13px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #713f12;
          margin-bottom: 10px;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 5px;
        }
        .info-row {
          font-size: 13px;
          margin-bottom: 6px;
        }
        .info-label {
          color: #6b7280;
          display: inline-block;
          width: 95px;
        }
        .info-val {
          font-weight: 600;
          color: #111827;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
          font-size: 13px;
        }
        th {
          background: #f3f4f6;
          padding: 10px;
          text-align: left;
          font-weight: 600;
          color: #374151;
          border-bottom: 1px solid #d1d5db;
        }
        .totals {
          width: 300px;
          margin-left: auto;
          margin-bottom: 30px;
          font-size: 13px;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          padding: 6px 0;
          color: #4b5563;
        }
        .total-highlight {
          display: flex;
          justify-content: space-between;
          padding: 12px;
          background: #fefce8;
          border: 1px solid #fef08a;
          border-radius: 6px;
          font-size: 16px;
          font-weight: bold;
          color: #854d0e;
          margin-top: 8px;
        }
        .cod-badge {
          display: inline-block;
          background: #dbeafe;
          color: #1e40af;
          font-weight: bold;
          padding: 4px 10px;
          border-radius: 4px;
          font-size: 12px;
          margin-top: 5px;
        }
        .footer {
          border-top: 1px dashed #d1d5db;
          padding-top: 20px;
          font-size: 12px;
          color: #6b7280;
          display: flex;
          justify-content: space-between;
        }
        .signature-box {
          border: 1px dashed #9ca3af;
          border-radius: 6px;
          height: 60px;
          width: 220px;
          margin-top: 8px;
        }
        @media print {
          body { padding: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div>
            <h1 class="brand-title">${shopName}</h1>
            <div class="brand-subtitle">L'élégance à la tunisienne — Bon de Livraison & Reçu</div>
          </div>
          <div class="doc-title">
            <h2>COMMANDE N° ${order.order_number}</h2>
            <p>Date : ${dateFormatted}</p>
            <div class="cod-badge">💵 PAIEMENT À LA LIVRAISON (COD)</div>
          </div>
        </div>

        <div class="grid">
          <div class="card">
            <div class="card-title">Destinataire (Client)</div>
            <div class="info-row"><span class="info-label">Nom :</span> <span class="info-val">${order.customer_name}</span></div>
            <div class="info-row"><span class="info-label">Téléphone :</span> <span class="info-val" style="font-size: 15px; color: #1e40af;">${order.phone}</span></div>
            <div class="info-row"><span class="info-label">Gouvernorat :</span> <span class="info-val">${order.governorate}</span></div>
            <div class="info-row"><span class="info-label">Délégation :</span> <span class="info-val">${order.delegation || '—'}</span></div>
            <div class="info-row"><span class="info-label">Adresse :</span> <span class="info-val">${order.address}</span></div>
            ${order.postal_code ? `<div class="info-row"><span class="info-label">Code Postal :</span> <span class="info-val">${order.postal_code}</span></div>` : ''}
          </div>

          <div class="card">
            <div class="card-title">Instructions de Livraison</div>
            <div class="info-row"><span class="info-label">Transporteur :</span> <span class="info-val">Colis à livrer contre espèces</span></div>
            <div class="info-row"><span class="info-label">Statut :</span> <span class="info-val">${order.status}</span></div>
            <div class="info-row"><span class="info-label">Remarque :</span> <span class="info-val">${order.comment ? `"${order.comment}"` : 'Aucune instruction particulière.'}</span></div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Désignation de l'article</th>
              <th>Taille / Couleur</th>
              <th style="text-align: center;">Qté</th>
              <th style="text-align: right;">Prix Unitaire</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml || '<tr><td colspan="5" style="text-align: center; padding: 15px; color: #9ca3af;">Détails des articles</td></tr>'}
          </tbody>
        </table>

        <div class="totals">
          ${order.subtotal ? `<div class="total-row"><span>Sous-total articles</span><span>${parseFloat(String(order.subtotal)).toFixed(3)} TND</span></div>` : ''}
          ${order.coupon_discount && parseFloat(String(order.coupon_discount)) > 0 ? `<div class="total-row" style="color: #16a34a;"><span>Remise promo (${order.coupon_code || ''})</span><span>-${parseFloat(String(order.coupon_discount)).toFixed(3)} TND</span></div>` : ''}
          <div class="total-row"><span>Frais de livraison</span><span>${parseFloat(String(order.delivery_fee || 8)).toFixed(3)} TND</span></div>
          <div class="total-highlight">
            <span>NET À ENCAISSER (COD)</span>
            <span>${parseFloat(order.total).toFixed(3)} TND</span>
          </div>
        </div>

        <div class="footer">
          <div>
            <p style="margin: 0; font-weight: 600;">Signature du livreur :</p>
            <div class="signature-box"></div>
          </div>
          <div>
            <p style="margin: 0; font-weight: 600;">Signature & Réception client :</p>
            <div class="signature-box"></div>
          </div>
        </div>
      </div>
      <script>
        window.onload = function() {
          window.print();
        }
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
};
