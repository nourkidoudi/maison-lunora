const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authMiddleware } = require('./admin');

// Validate and apply a coupon (public, checkout usage)
router.post('/apply', async (req, res) => {
  const { code, subtotal, phone } = req.body;
  if (!code) return res.status(400).json({ error: 'Code requis' });
  if (subtotal === undefined || subtotal === null) return res.status(400).json({ error: 'Sous-total requis' });

  try {
    const upperCode = String(code).toUpperCase().trim();
    const result = await pool.query(
      'SELECT * FROM coupons WHERE UPPER(code) = $1 AND is_active = true',
      [upperCode]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Code promo invalide' });
    }

    const coupon = result.rows[0];

    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return res.status(400).json({ error: 'Code promo expiré' });
    }

    if (coupon.max_uses && coupon.times_used >= coupon.max_uses) {
      return res.status(400).json({ error: 'Code promo épuisé' });
    }

    const sub = parseFloat(subtotal) || 0;
    const minAmount = parseFloat(coupon.min_order_amount) || 0;
    if (sub < minAmount) {
      return res.status(400).json({ error: `Panier minimum requis : ${minAmount.toFixed(3)} TND` });
    }

    // Vérification max utilisations par client (basé sur numéro de téléphone)
    if (phone && coupon.max_uses_per_customer !== undefined && coupon.max_uses_per_customer !== null && coupon.max_uses_per_customer > 0) {
      const usesRes = await pool.query(
        `SELECT COUNT(*)::int as nb FROM orders
         WHERE coupon_code = $1 AND LOWER(TRIM(phone)) = LOWER(TRIM($2))`,
        [coupon.code, phone]
      );
      const timesUsed = usesRes.rows[0].nb || 0;
      if (timesUsed >= coupon.max_uses_per_customer) {
        return res.status(400).json({
          error: `Vous avez déjà utilisé ce coupon ${coupon.max_uses_per_customer} fois (limite atteinte pour votre numéro)`
        });
      }
    }

    let discount = 0;
    if (coupon.discount_type === 'percentage') {
      discount = (sub * parseFloat(coupon.discount_value)) / 100;
    } else {
      discount = parseFloat(coupon.discount_value) || 0;
    }
    discount = Math.min(discount, sub);

    res.json({
      coupon: {
        id: coupon.id,
        code: coupon.code,
        description: coupon.description || '',
        discount_type: coupon.discount_type,
        discount_value: parseFloat(coupon.discount_value)
      },
      discount
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// --- ADMIN ROUTES ---

// GET all coupons (admin)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM coupons ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET single coupon (admin)
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM coupons WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Coupon non trouvé' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST create coupon (admin)
router.post('/', authMiddleware, async (req, res) => {
  const {
    code, description, discount_type, discount_value, min_order_amount,
    max_uses, max_uses_per_customer, is_active, expires_at
  } = req.body;

  if (!code || !discount_type || discount_value === undefined || discount_value === null) {
    return res.status(400).json({ error: 'Champs requis manquants' });
  }

  try {
    const upperCode = String(code).toUpperCase().trim();
    const result = await pool.query(
      `INSERT INTO coupons (code, description, discount_type, discount_value, min_order_amount, max_uses, max_uses_per_customer, is_active, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        upperCode,
        description || '',
        discount_type || 'percentage',
        parseFloat(discount_value),
        parseFloat(min_order_amount || 0),
        max_uses ? parseInt(max_uses) : null,
        parseInt(max_uses_per_customer || 1),
        is_active !== undefined ? is_active : true,
        expires_at || null
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Ce code coupon existe déjà' });
    }
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de la création' });
  }
});

// PUT update coupon (admin)
router.put('/:id', authMiddleware, async (req, res) => {
  const {
    code, description, discount_type, discount_value, min_order_amount,
    max_uses, max_uses_per_customer, is_active, expires_at, reset_uses
  } = req.body;

  try {
    const current = await pool.query('SELECT * FROM coupons WHERE id = $1', [req.params.id]);
    if (current.rows.length === 0) return res.status(404).json({ error: 'Coupon non trouvé' });
    const c = current.rows[0];

    const result = await pool.query(
      `UPDATE coupons SET
        code = $1, description = $2, discount_type = $3, discount_value = $4,
        min_order_amount = $5, max_uses = $6, max_uses_per_customer = $7, is_active = $8, expires_at = $9,
        times_used = CASE WHEN $10 = true THEN 0 ELSE times_used END
       WHERE id = $11 RETURNING *`,
      [
        code ? String(code).toUpperCase().trim() : c.code,
        description !== undefined ? description : c.description,
        discount_type || c.discount_type,
        discount_value !== undefined ? parseFloat(discount_value) : c.discount_value,
        min_order_amount !== undefined ? parseFloat(min_order_amount) : c.min_order_amount,
        max_uses !== undefined ? (max_uses ? parseInt(max_uses) : null) : c.max_uses,
        max_uses_per_customer !== undefined ? parseInt(max_uses_per_customer) : c.max_uses_per_customer,
        is_active !== undefined ? is_active : c.is_active,
        expires_at !== undefined ? (expires_at || null) : c.expires_at,
        reset_uses === true,
        req.params.id
      ]
    );
    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Ce code coupon existe déjà' });
    }
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de la modification' });
  }
});

// DELETE coupon (admin)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM coupons WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Coupon non trouvé' });
    res.json({ message: 'Coupon supprimé' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
