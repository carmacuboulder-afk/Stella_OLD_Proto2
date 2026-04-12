import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import pool from './db.js';
import cookieParser from 'cookie-parser';

// Import Routes
import usersRouter from './routes/users.js';
import devicesRouter from './routes/devices.js';
import uploadsRouter from './routes/uploads.js';
import dataRouter from './routes/data.js';
import orgsRouter from './routes/orgs.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Allow JSON requests
app.use(express.json());

// Allow our app to call this API, allows setting of cookies
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
}));
app.options("*", cors());

app.use(cookieParser());

// Log incoming HTTP requests to console
app.use(morgan('dev'));

// Health Check
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({
      ok: true,
      dbTime: result.rows[0].now,
    });
  } catch (err) {
    console.error('Health check failed:', err);
    res.status(500).json({ ok: false, error: 'Database not reachable' });
  }
});

// API Routes
app.use('/api/users', usersRouter);
app.use('/api/orgs', orgsRouter);
app.use('/api/devices', devicesRouter);
app.use('/api/uploads', uploadsRouter);
app.use('/api/data', dataRouter);

app.use((req, res, next) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
