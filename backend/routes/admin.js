const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Login Admin
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM admins WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Identifiants invalides' });
    }
    const admin = result.rows[0];
    const match = await bcrypt.compare(password, admin.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Identifiants invalides' });
    }
    const token = jwt.sign({ id: admin.id, email: admin.email }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, admin: { email: admin.email } });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Middleware d'authentification
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Non autorisé' });
  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token invalide' });
    req.user = user;
    next();
  });
};

// Vérification de la session
router.get('/me', authMiddleware, (req, res) => {
  res.json({ admin: { email: req.user.email } });
});

// Changer le mot de passe admin
router.put('/password', authMiddleware, async (req, res) => {
  const { current_password, new_password } = req.body;
  if (!current_password || !new_password) {
    return res.status(400).json({ error: 'Ancien et nouveau mot de passe requis' });
  }
  if (new_password.length < 6) {
    return res.status(400).json({ error: 'Nouveau mot de passe trop court (min 6 caractères)' });
  }

  try {
    const adminRes = await pool.query('SELECT * FROM admins WHERE id = $1', [req.user.id]);
    if (adminRes.rows.length === 0) return res.status(404).json({ error: 'Admin non trouvé' });
    const admin = adminRes.rows[0];

    const match = await bcrypt.compare(current_password, admin.password_hash);
    if (!match) return res.status(401).json({ error: 'Ancien mot de passe incorrect' });

    const newHash = await bcrypt.hash(new_password, 10);
    await pool.query('UPDATE admins SET password_hash = $1 WHERE id = $2', [newHash, admin.id]);
    res.json({ message: 'Mot de passe mis à jour avec succès' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Dashboard stats
router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    const totalProducts = await pool.query('SELECT COUNT(*) FROM products');
    const totalOrders = await pool.query('SELECT COUNT(*) FROM orders');
    const pendingOrders = await pool.query('SELECT COUNT(*) FROM orders WHERE status = $1', ['Nouvelle']);
    const lowStock = await pool.query('SELECT COUNT(*) FROM products WHERE stock < 5');
    
    res.json({
      totalProducts: parseInt(totalProducts.rows[0].count),
      totalOrders: parseInt(totalOrders.rows[0].count),
      pendingOrders: parseInt(pendingOrders.rows[0].count),
      lowStock: parseInt(lowStock.rows[0].count)
    });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = { router, authMiddleware };
