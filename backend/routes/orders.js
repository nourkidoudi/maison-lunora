const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authMiddleware } = require('./admin');

// Générer un numéro de commande ORD-XXXX
async function generateOrderNumber() {
  const result = await pool.query('SELECT order_number FROM orders ORDER BY id DESC LIMIT 1');
  if (result.rows.length === 0) return 'ORD-1001';
  const lastNumber = result.rows[0].order_number;
  const num = parseInt(lastNumber.split('-')[1]);
  return `ORD-${num + 1}`;
}

// Créer une commande (Client)
router.post('/', async (req, res) => {
  const { customer_name, phone, governorate, delegation, address, postal_code, comment, items, coupon_code } = req.body;
  const defaultDeliveryFee = 8.00;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Récupérer les settings pour connaître le delivery_fee actuel
    const settingRes = await client.query("SELECT value FROM settings WHERE key = 'delivery_fee'");
    const delivery_fee = settingRes.rows.length > 0 ? parseFloat(settingRes.rows[0].value) || defaultDeliveryFee : defaultDeliveryFee;
    
    let subtotal = 0;
    const itemsToInsert = [];

    // Vérifier les stocks et calculer le total
    for (const item of items) {
      const productRes = await client.query('SELECT * FROM products WHERE id = $1 FOR UPDATE', [item.product_id]);
      if (productRes.rows.length === 0) throw new Error(`Produit ${item.product_id} non trouvé`);
      
      const product = productRes.rows[0];
      if (product.stock < item.quantity) throw new Error(`Stock insuffisant pour ${product.name}`);
      
      let variants = [];
      try {
        variants = typeof product.variants === 'string' ? JSON.parse(product.variants) : (product.variants || []);
      } catch (e) {
        variants = [];
      }

      if (Array.isArray(variants) && variants.length > 0) {
        // Find matching variant
        const matchingVariant = variants.find(v => 
          (!item.size || v.size === item.size || v.size === 'Unique') &&
          (!item.color || v.color === item.color || v.color === 'Unique')
        );

        if (matchingVariant) {
          if (matchingVariant.stock < item.quantity) {
            throw new Error(`Stock insuffisant pour ${product.name} (Taille : ${item.size || 'Unique'}, Couleur : ${item.color || 'Unique'})`);
          }
          matchingVariant.stock = Math.max(0, matchingVariant.stock - item.quantity);
        }
      }

      const price = product.sale_price ? parseFloat(product.sale_price) : parseFloat(product.price);
      subtotal += price * item.quantity;

      itemsToInsert.push({
        product_id: product.id,
        product_name: product.name,
        size: item.size,
        color: item.color,
        quantity: item.quantity,
        unit_price: price
      });

      // Décrémenter le stock total et mettre à jour les variantes
      await client.query(
        'UPDATE products SET stock = GREATEST(0, stock - $1), variants = $2 WHERE id = $3',
        [item.quantity, JSON.stringify(variants), product.id]
      );
    }

    // Gestion du coupon
    let coupon_discount = 0;
    let coupon_code_used = null;
    if (coupon_code) {
      const upperCode = String(coupon_code).toUpperCase().trim();
      const couponRes = await client.query(
        'SELECT * FROM coupons WHERE UPPER(code) = $1 AND is_active = true FOR UPDATE',
        [upperCode]
      );
      if (couponRes.rows.length > 0) {
        const coupon = couponRes.rows[0];
        const stillValid = !coupon.expires_at || new Date(coupon.expires_at) >= new Date();
        const notExhausted = !coupon.max_uses || coupon.times_used < coupon.max_uses;
        const minOk = subtotal >= parseFloat(coupon.min_order_amount || 0);

        if (stillValid && notExhausted && minOk) {
          // Vérification "max utilisations par client" (basée sur le téléphone = identifiant unique client)
          if (coupon.max_uses_per_customer !== undefined && coupon.max_uses_per_customer !== null && coupon.max_uses_per_customer > 0) {
            const usesByPhoneRes = await client.query(
              `SELECT COUNT(*)::int as nb FROM orders
               WHERE coupon_code = $1 AND LOWER(TRIM(phone)) = LOWER(TRIM($2))`,
              [coupon.code, phone]
            );
            const timesUsedByThisCustomer = usesByPhoneRes.rows[0].nb || 0;
            if (timesUsedByThisCustomer >= coupon.max_uses_per_customer) {
              // Refuser l'application du coupon (ignorer silencieusement)
            } else {
              if (coupon.discount_type === 'percentage') {
                coupon_discount = (subtotal * parseFloat(coupon.discount_value)) / 100;
              } else {
                coupon_discount = parseFloat(coupon.discount_value) || 0;
              }
              coupon_discount = Math.min(coupon_discount, subtotal);
              coupon_code_used = coupon.code;
              await client.query('UPDATE coupons SET times_used = times_used + 1 WHERE id = $1', [coupon.id]);
            }
          } else {
            if (coupon.discount_type === 'percentage') {
              coupon_discount = (subtotal * parseFloat(coupon.discount_value)) / 100;
            } else {
              coupon_discount = parseFloat(coupon.discount_value) || 0;
            }
            coupon_discount = Math.min(coupon_discount, subtotal);
            coupon_code_used = coupon.code;
            await client.query('UPDATE coupons SET times_used = times_used + 1 WHERE id = $1', [coupon.id]);
          }
        }
      }
    }

    const total = Math.max(0, subtotal - coupon_discount) + delivery_fee;
    const orderNumber = await generateOrderNumber();

    // Insérer la commande
    const orderRes = await client.query(
      `INSERT INTO orders (order_number, customer_name, phone, governorate, delegation, address, postal_code, comment, subtotal, coupon_code, coupon_discount, delivery_fee, total, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'Nouvelle') RETURNING *`,
      [orderNumber, customer_name, phone, governorate, delegation, address, postal_code, comment, subtotal, coupon_code_used, coupon_discount, delivery_fee, total]
    );
    const orderId = orderRes.rows[0].id;

    // Insérer les order items
    for (const item of itemsToInsert) {
      await client.query(
        'INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [orderId, item.product_id, item.product_name, item.size, item.color, item.quantity, item.unit_price]
      );
    }

    await client.query('COMMIT');
    res.json({ message: 'Commande créée avec succès', order: orderRes.rows[0] });

  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
});

// --- ROUTES ADMIN ---
// Obtenir toutes les commandes (avec items inclus)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT o.*, 
        COALESCE(
          json_agg(
            json_build_object(
              'id', oi.id,
              'product_id', oi.product_id,
              'product_name', oi.product_name,
              'size', oi.size,
              'color', oi.color,
              'quantity', oi.quantity,
              'unit_price', oi.unit_price
            )
          ) FILTER (WHERE oi.id IS NOT NULL), '[]'
        ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Obtenir une commande détaillée
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const orderRes = await pool.query('SELECT * FROM orders WHERE id = $1', [req.params.id]);
    if (orderRes.rows.length === 0) return res.status(404).json({ error: 'Commande non trouvée' });
    
    const itemsRes = await pool.query('SELECT * FROM order_items WHERE order_id = $1', [req.params.id]);
    
    const order = orderRes.rows[0];
    order.items = itemsRes.rows;
    
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Modifier le statut d'une commande
router.put('/:id/status', authMiddleware, async (req, res) => {
  const { status } = req.body;
  try {
    // Si la commande est annulée, on remet le stock
    if (status === 'Annulée') {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const items = await client.query('SELECT * FROM order_items WHERE order_id = $1', [req.params.id]);
        for (const item of items.rows) {
          const pRes = await client.query('SELECT variants FROM products WHERE id = $1', [item.product_id]);
          let variants = [];
          if (pRes.rows.length > 0) {
            try {
              variants = typeof pRes.rows[0].variants === 'string' ? JSON.parse(pRes.rows[0].variants) : (pRes.rows[0].variants || []);
            } catch (e) { variants = []; }

            if (Array.isArray(variants) && variants.length > 0) {
              const mv = variants.find(v =>
                (!item.size || v.size === item.size || v.size === 'Unique') &&
                (!item.color || v.color === item.color || v.color === 'Unique')
              );
              if (mv) mv.stock = (parseInt(mv.stock) || 0) + item.quantity;
            }
          }
          await client.query(
            'UPDATE products SET stock = stock + $1, variants = $2 WHERE id = $3',
            [item.quantity, JSON.stringify(variants), item.product_id]
          );
        }
        await client.query('UPDATE orders SET status = $1 WHERE id = $2', [status, req.params.id]);
        await client.query('COMMIT');
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      } finally {
        client.release();
      }
    } else {
      await pool.query('UPDATE orders SET status = $1 WHERE id = $2', [status, req.params.id]);
    }
    res.json({ message: 'Statut mis à jour' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
