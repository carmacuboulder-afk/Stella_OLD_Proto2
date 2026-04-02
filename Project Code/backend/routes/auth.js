import { Router } from 'express';
import bcrypt from 'bcrypt';
import pool from '../db.js';
import { signAccessToken } from '../utils/jwt.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// POST /api/auth/login
// Used to issue JWTs for external API access from an existing STELLA user account
router.post('/login', async (req, res, next) => {
  const { username, email, password } = req.body || {};
  const loginValue = username || email;

  if (!loginValue || !password) {
    return res.status(400).json({ error: 'username/email and password are required' });
  }

  try {
    const result = await pool.query(
      `SELECT id, username, email, password_hash
       FROM users
       WHERE username = $1 OR email = $1
       LIMIT 1`,
      [loginValue]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const userRow = result.rows[0];
    const passwordOk = await bcrypt.compare(password, userRow.password_hash);

    if (!passwordOk) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = {
      id: userRow.id,
      username: userRow.username,
      email: userRow.email,
    };

    const token = signAccessToken(user);

    return res.json({
      token,
      user,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, username, email, created_at
       FROM users
       WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

export default router;