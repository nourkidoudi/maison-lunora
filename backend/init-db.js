const fs = require('fs');
const path = require('path');
const pool = require('./db');
const bcrypt = require('bcrypt');

async function initDB() {
  const client = await pool.connect();
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    console.log('Création des tables...');
    await client.query(schemaSql);
    console.log('Tables créées avec succès.');

    // Create default admin if not exists
    const adminCheck = await client.query('SELECT * FROM admins WHERE email = $1', ['admin@maisonlunora.tn']);
    if (adminCheck.rows.length === 0) {
      console.log('Création de l\'administrateur par défaut...');
      const passwordHash = await bcrypt.hash('admin123', 10);
      await client.query(
        'INSERT INTO admins (email, password_hash) VALUES ($1, $2)',
        ['admin@maisonlunora.tn', passwordHash]
      );
      console.log('Administrateur créé : admin@maisonlunora.tn / admin123');
    }

    // Seed some products
    const productCheck = await client.query('SELECT * FROM products LIMIT 1');
    if (productCheck.rows.length === 0) {
        console.log('Ajout de produits de test...');
        const products = [
            {
                name: 'Robe d\'été florale',
                description: 'Magnifique robe légère avec des motifs floraux. Parfaite pour la saison estivale.',
                price: 89.90,
                sale_price: 69.90,
                category: 'Robes',
                images: JSON.stringify(['https://images.unsplash.com/photo-1515347619362-72fb8f3d6dbf?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80']),
                sizes: JSON.stringify(['S', 'M', 'L']),
                colors: JSON.stringify(['Rose', 'Blanc']),
                stock: 15
            },
            {
                name: 'Chemise en lin beige',
                description: 'Chemise élégante 100% lin. Coupe droite.',
                price: 55.00,
                sale_price: null,
                category: 'Hauts',
                images: JSON.stringify(['https://images.unsplash.com/photo-1596755094514-f87e34085b2c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80']),
                sizes: JSON.stringify(['M', 'L', 'XL']),
                colors: JSON.stringify(['Beige']),
                stock: 8
            }
        ];

        for (const p of products) {
            await client.query(
                'INSERT INTO products (name, description, price, sale_price, category, images, sizes, colors, stock) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
                [p.name, p.description, p.price, p.sale_price, p.category, p.images, p.sizes, p.colors, p.stock]
            );
        }
        console.log('Produits ajoutés.');
    }

    // Seed default settings
    const settingsCheck = await client.query('SELECT COUNT(*) FROM settings');
    if (parseInt(settingsCheck.rows[0].count) === 0) {
        console.log('Ajout des paramètres par défaut...');
        const defaultSettings = [
            ['whatsapp_number', '21600000000'],
            ['phone_number', '+21600000000'],
            ['instagram_handle', 'maisonlunora'],
            ['delivery_fee', '8'],
            ['shop_name', 'Maison Lunora'],
            ['shop_description', 'L\'élégance à votre mesure']
        ];
        for (const [key, value] of defaultSettings) {
            await client.query(
                'INSERT INTO settings (key, value) VALUES ($1, $2)',
                [key, value]
            );
        }
        console.log('Paramètres ajoutés.');
    }

    // Seed default coupons
    const couponsCheck = await client.query('SELECT COUNT(*) FROM coupons');
    if (parseInt(couponsCheck.rows[0].count) === 0) {
        console.log('Ajout des coupons par défaut...');
        const coupons = [
            {
                code: 'BIENVENUE10',
                description: '10% de réduction sur votre première commande',
                discount_type: 'percentage',
                discount_value: 10,
                min_order_amount: 50,
                max_uses: 100,
                max_uses_per_customer: 1,
                expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ')
            },
            {
                code: 'FIDELITE20',
                description: '20 TND offerts dès 150 TND d\'achat',
                discount_type: 'fixed',
                discount_value: 20,
                min_order_amount: 150,
                max_uses: 50,
                max_uses_per_customer: 3,
                expires_at: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ')
            }
        ];
        for (const c of coupons) {
            await client.query(
                `INSERT INTO coupons (code, description, discount_type, discount_value, min_order_amount, max_uses, max_uses_per_customer, expires_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [c.code, c.description, c.discount_type, c.discount_value, c.min_order_amount, c.max_uses, c.max_uses_per_customer, c.expires_at]
            );
        }
        console.log('Coupons ajoutés : BIENVENUE10, FIDELITE20');
    }

    console.log('Initialisation de la base de données terminée.');
  } catch (err) {
    console.error('Erreur lors de l\'initialisation de la base de données', err);
  } finally {
    client.release();
    pool.end();
  }
}

initDB();
