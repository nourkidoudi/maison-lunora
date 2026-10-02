const pool = require('./db');

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Migration des tables en cours...');

    // Orders table columns
    await client.query(`
      ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(50),
      ADD COLUMN IF NOT EXISTS coupon_discount DECIMAL(10, 2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS delivery_fee DECIMAL(10, 2) NOT NULL DEFAULT 8.00;
    `);

    // Products table columns
    await client.query(`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS sale_price DECIMAL(10, 2),
      ADD COLUMN IF NOT EXISTS category VARCHAR(255),
      ADD COLUMN IF NOT EXISTS images JSONB,
      ADD COLUMN IF NOT EXISTS sizes JSONB,
      ADD COLUMN IF NOT EXISTS colors JSONB,
      ADD COLUMN IF NOT EXISTS stock INTEGER NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
    `);

    // Settings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id SERIAL PRIMARY KEY,
        key VARCHAR(100) UNIQUE NOT NULL,
        value TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Coupons table
    await client.query(`
      CREATE TABLE IF NOT EXISTS coupons (
        id SERIAL PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL,
        description TEXT,
        discount_type VARCHAR(20) NOT NULL DEFAULT 'percentage',
        discount_value DECIMAL(10, 2) NOT NULL,
        min_order_amount DECIMAL(10, 2) DEFAULT 0,
        max_uses INTEGER,
        times_used INTEGER NOT NULL DEFAULT 0,
        max_uses_per_customer INTEGER DEFAULT 1,
        is_active BOOLEAN DEFAULT true,
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('Migration terminée avec succès !');
    process.exit(0);
  } catch (err) {
    console.error('Erreur lors de la migration :', err);
    process.exit(1);
  } finally {
    client.release();
  }
}

migrate();
