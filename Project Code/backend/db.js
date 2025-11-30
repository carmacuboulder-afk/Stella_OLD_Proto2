// db.js
import pg from 'pg';
const { Pool } = pg;

// Create connection pool for PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'stella_user',
  password: process.env.DB_PASSWORD || 'stella',
  database: process.env.DB_NAME || 'stella_db',
  max: 10,
  idleTimeoutMillis: 30000,   // close idle clients after 30s
});

// Log Connections
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

// Log errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
  process.exit(-1); // Shutdown
});

export default pool;