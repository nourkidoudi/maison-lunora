const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: parseInt(process.env.DB_POOL_MAX || '20', 10), // Max concurrent connections
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 5000, // Return an error after 5 seconds if connection could not be established
});

// Do not kill the whole process on temporary idle error
pool.on('error', (err) => {
  console.error('Erreur temporaire sur une connexion PostgreSQL inactive :', err.message);
});

module.exports = pool;

