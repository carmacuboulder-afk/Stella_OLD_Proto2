// routes/users.js
import { Router } from 'express';
import pool from '../db.js';

const router = Router();

// GET /api/users 
router.get('/', async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT id, username, email, role, created_at FROM users'
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// POST /api/users/register
router.post('/register', async (req, res, next) => {
  const { username, email, passwordHash } = req.body;

  if (!username || !email || !passwordHash) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, username, email, role, created_at`,
      [username, email, passwordHash]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Username or email already exists' });
    }
    next(err);
  }
});

export default router;