// routes/users.js
import { Router } from 'express';
import pool from '../db.js';
import bcrypt from 'bcrypt';

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


// POST /api/users/login
router.post('/login', async (req, res, next) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Missing login field."});
  }

  try {
    const result = await pool.query(
      `SELECT username, email, role, password_hash, school, organization FROM users WHERE username = $1 OR email = $1`,
       [username]
    );
    
    if (result.rows.length < 1) {  // no users exist
      return res.status(404).json({ error: "No user found."});
    }
    else { // at least one user exists, check password of first - TODO: bad practice? must return exactly one?
      const found_user = result.rows[0];
      const passMatch = bcrypt.compare(password, found_user.password_hash);
      if (passMatch) {
        return res.status(200).json({
          user: found_user.username,
          email: found_user.email,
          role: found_user.role,
          school: found_user.school,
          org: found_user.organization
        });
      }
      else {
        return res.status(401).json({ error: "Username/password incorrect."});
      }
    }

  } 
  catch (err) {
    next(err);
  }
});


// POST /api/users/register
router.post('/register', async (req, res, next) => {
  const { username, email, password_one, password_two, school, org } = req.body;

  if (password_one != password_two) {
    return res.status(400).json({ error: 'Passwords do not match.'});
  }

  const passwordHash = await bcrypt.hash(password_one, 10);

  if (!username || !email || !passwordHash) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash, school, organization)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, username, email, role, school, organization, created_at`,
      [username, email, passwordHash, school, org]
    );

    res.status(201).json(result.rows[0]);
  } 
  catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Username or email already exists' });
    }
    next(err);
  }
});

export default router;