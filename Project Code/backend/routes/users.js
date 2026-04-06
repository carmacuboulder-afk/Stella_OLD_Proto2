// routes/users.js
import { Router } from 'express';
import pool from '../db.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { requireAuth } from '../middleware/auth.js';

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


// GET /api/users/status
router.get('/status', async (req, res) => {
  try {
    const session_id = req.cookies.session_id;
    if (!session_id) {
      return res.status(401).json({ error: 'not logged in' });
    }

    const result = await pool.query(
      `SELECT * FROM session_info WHERE session_id = $1 AND expires_at > NOW()`,
      [session_id]
    );

    if (result.rows.length < 1) {
      res.clearCookie('session_id');
      return res.status(401).json({ error: 'No session_id found.' });
    }

    return res.status(200).json({ loggedIn: true });
  } catch (err) {
    console.log('status error:' + err);
    return res.status(400).json({ error: 'error in /status' });
  }
});


// GET /api/users/me
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const [userResult, schoolsResult, orgsResult] = await Promise.all([
      pool.query(
        `SELECT id, username, email, role, owned_org_id FROM users WHERE id = $1`,
        [req.user_id]
      ),
      pool.query(
        `SELECT s.name FROM schools s
         JOIN user_schools us ON us.school_id = s.id
         WHERE us.user_id = $1`,
        [req.user_id]
      ),
      pool.query(
        `SELECT o.id, o.name FROM organizations o
         JOIN user_organizations uo ON uo.organization_id = o.id
         WHERE uo.user_id = $1 AND uo.status = 'accepted'`,
        [req.user_id]
      ),
    ]);

    res.json({
      ...userResult.rows[0],
      schools: schoolsResult.rows.map((r) => r.name),
      orgs: orgsResult.rows, // now returns { id, name } objects
    });
  } catch (err) {
    next(err);
  }
});


// POST /api/users/login
router.post('/login', async (req, res, next) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Missing login field.' });
  }

  try {
    const result = await pool.query(
      `SELECT id, username, email, role, password_hash FROM users WHERE username = $1 OR email = $1`,
      [username]
    );

    if (result.rows.length < 1) {
      return res.status(404).json({ error: 'No user found.' });
    }

    const found_user = result.rows[0];
    const passMatch = await bcrypt.compare(password, found_user.password_hash);

    if (passMatch) {
      const session_id = crypto.randomBytes(32).toString('hex');
      await pool.query(
        `INSERT INTO session_info (user_id, session_id, expires_at) VALUES ($1, $2, $3)`,
        [found_user.id, session_id, new Date(Date.now() + 1000 * 60 * 60 * 24)]
      );

      res.cookie('session_id', session_id, {
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24,
      });

      return res.status(200).json({
        user: found_user.username,
        email: found_user.email,
        role: found_user.role,
      });
    } else {
      return res.status(401).json({ error: 'Username/password incorrect.' });
    }
  } catch (err) {
    next(err);
  }
});


// DELETE /api/users/logout
router.delete('/logout', async (req, res) => {
  try {
    await pool.query(
      `DELETE FROM session_info WHERE session_id = $1`,
      [req.cookies.session_id]
    );
    res.clearCookie('session_id');
    return res.status(200).json({ loggedOut: true });
  } catch (err) {
    return res.status(400).json({ error: err });
  }
});


// POST /api/users/register
router.post('/register', async (req, res, next) => {
  const { username, email, password_one, password_two, schools } = req.body;

  if (password_one != password_two) {
    return res.status(400).json({ error: 'Passwords do not match.' });
  }

  const passwordHash = await bcrypt.hash(password_one, 10);

  if (!username || !email || !passwordHash) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const result = await client.query(
      `INSERT INTO users (username, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, username, email, role, created_at`,
      [username, email, passwordHash]
    );
    const newUser = result.rows[0];

    // Insert schools if provided
    if (schools?.length) {
      for (const schoolName of schools) {
        const school = await client.query(
          `INSERT INTO schools (name) VALUES ($1)
           ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
           RETURNING id`,
          [schoolName]
        );
        await client.query(
          `INSERT INTO user_schools (user_id, school_id) VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
          [newUser.id, school.rows[0].id]
        );
      }
    }

    await client.query('COMMIT');
    res.status(201).json({ ...newUser, schools: schools ?? [], orgs: [] });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Username or email already exists' });
    }
    next(err);
  } finally {
    client.release();
  }
});


// POST /api/users/add/school
router.post('/add/school', requireAuth, async (req, res, next) => {
  const { school } = req.body;

  if (!school) {
    return res.status(400).json({ error: 'Missing school' });
  }

  try {
    const schoolResult = await pool.query(
      `INSERT INTO schools (name) VALUES ($1)
       ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [school]
    );
    await pool.query(
      `INSERT INTO user_schools (user_id, school_id) VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [req.user_id, schoolResult.rows[0].id]
    );
    return res.status(200).json({ added: school });
  } catch (err) {
    next(err);
  }
});


// DELETE /api/users/remove/school
router.delete('/remove/school', requireAuth, async (req, res, next) => {
  const { school } = req.body;

  if (!school) {
    return res.status(400).json({ error: 'Missing school' });
  }

  try {
    await pool.query(
      `DELETE FROM user_schools
       WHERE user_id = $1 AND school_id = (
         SELECT id FROM schools WHERE name = $2
       )`,
      [req.user_id, school]
    );
    return res.status(200).json({ removed: school });
  } catch (err) {
    next(err);
  }
});


export default router;