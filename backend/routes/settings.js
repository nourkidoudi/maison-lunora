const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authMiddleware } = require('./admin');

// GET all settings (public - for frontend)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT key, value FROM settings');
    const settings = {};
    result.rows.forEach(r => { settings[r.key] = r.value; });
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT update multiple settings (admin)
router.put('/', authMiddleware, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const entries = Object.entries(req.body);
    for (const [key, value] of entries) {
      await client.query(
        `INSERT INTO settings (key, value) VALUES ($1, $2)
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP`,
        [key, String(value)]
      );
    }
    await client.query('COMMIT');
    const result = await pool.query('SELECT key, value FROM settings');
    const settings = {};
    result.rows.forEach(r => { settings[r.key] = r.value; });
    res.json({ message: 'Paramètres mis à jour', settings });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de la mise à jour' });
  } finally {
    client.release();
  }
});

module.exports = router;
