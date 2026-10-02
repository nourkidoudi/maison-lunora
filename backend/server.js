require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'] }));
app.use(express.json());

// Serve uploaded images statically with browser caching
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: '7d',
  immutable: true,
}));

// Routes import
const { router: adminRoutes } = require('./routes/admin');
const productsRoutes = require('./routes/products');
const ordersRoutes = require('./routes/orders');
const uploadRoutes = require('./routes/upload');
const settingsRoutes = require('./routes/settings');
const couponsRoutes = require('./routes/coupons');

// Route API
app.use('/api/admin', adminRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/coupons', couponsRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Bienvenue sur l\'API de Maison Lunora' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
