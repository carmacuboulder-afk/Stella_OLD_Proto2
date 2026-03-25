import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import pool from './db.js';

// Import Routes
import usersRouter from './routes/users.js';
import teamsRouter from './routes/teams.js';
import teamMembersRouter from './routes/teamMembers.js';
import devicesRouter from './routes/devices.js';
import uploadsRouter from './routes/uploads.js';
import dataRouter from './routes/data.js';
import authRouter from './routes/auth.js';
import externalRouter from './routes/external.js';
import evaRouter from './routes/eva.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Allow JSON request
app.use(express.json());

// Allow our app to call this API
app.use(cors());

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
app.use('/api/teams', teamsRouter);
app.use('/api/team-members', teamMembersRouter);
app.use('/api/devices', devicesRouter);
app.use('/api/uploads', uploadsRouter);
app.use('/api/data', dataRouter);
app.use('/api/auth', authRouter);
app.use('/api/external', externalRouter);
app.use('/api/eva', evaRouter);

app.use((req, res, next) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handeling
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
