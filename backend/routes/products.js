const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authMiddleware } = require('./admin');

// Obtenir tous les produits (Public)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products WHERE is_active = true ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Obtenir un produit (Public)
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products WHERE id = $1 AND is_active = true', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Produit non trouvé' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// --- ROUTES ADMIN ---
// Obtenir tous les produits y compris masqués
router.get('/admin/all', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Créer un produit
router.post('/', authMiddleware, async (req, res) => {
  const { name, description, price, sale_price, category, images, sizes, colors, stock, variants, is_active } = req.body;
  
  // Calculate total stock from variants if variants are provided
  let calculatedStock = parseInt(stock) || 0;
  if (Array.isArray(variants) && variants.length > 0) {
    calculatedStock = variants.reduce((sum, v) => sum + (parseInt(v.stock) || 0), 0);
  }

  try {
    const result = await pool.query(
      'INSERT INTO products (name, description, price, sale_price, category, images, sizes, colors, stock, variants, is_active) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *',
      [name, description, price, sale_price, category, JSON.stringify(images || []), JSON.stringify(sizes || []), JSON.stringify(colors || []), calculatedStock, JSON.stringify(variants || []), is_active !== undefined ? is_active : true]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erreur création produit:', err);
    res.status(500).json({ error: 'Erreur lors de la création du produit' });
  }
});

// Modifier un produit
router.put('/:id', authMiddleware, async (req, res) => {
  const { name, description, price, sale_price, category, images, sizes, colors, stock, variants, is_active } = req.body;
  
  // Calculate total stock from variants if variants are provided
  let calculatedStock = parseInt(stock) || 0;
  if (Array.isArray(variants) && variants.length > 0) {
    calculatedStock = variants.reduce((sum, v) => sum + (parseInt(v.stock) || 0), 0);
  }

  try {
    const result = await pool.query(
      'UPDATE products SET name=$1, description=$2, price=$3, sale_price=$4, category=$5, images=$6, sizes=$7, colors=$8, stock=$9, variants=$10, is_active=$11 WHERE id=$12 RETURNING *',
      [name, description, price, sale_price, category, JSON.stringify(images || []), JSON.stringify(sizes || []), JSON.stringify(colors || []), calculatedStock, JSON.stringify(variants || []), is_active, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Produit non trouvé' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erreur modification produit:', err);
    res.status(500).json({ error: 'Erreur lors de la modification' });
  }
});

// Supprimer un produit
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await pool.query('DELETE FROM products WHERE id = $1', [req.params.id]);
    res.json({ message: 'Produit supprimé' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
});

module.exports = router;
