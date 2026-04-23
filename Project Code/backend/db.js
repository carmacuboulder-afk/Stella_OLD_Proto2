// db.js
import pg from 'pg';
const { Pool } = pg;

// Create connection pool for PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST || 'dpg-d7j99oqqqhas738d5l20-a',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres_stella_user',
  password: process.env.DB_PASSWORD || 'Shjo7iElI8KKAgohqH3FWxS4E0ktNiUv',
  database: process.env.DB_NAME || 'postgres_stella',
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
