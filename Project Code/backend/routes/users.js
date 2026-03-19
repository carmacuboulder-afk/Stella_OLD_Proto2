// routes/users.js
import { Router } from 'express';
import pool from '../db.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

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
      return res.status(401).json({ error: "not logged in"})
    }

    const result = await pool.query(
      `SELECT * FROM session_info WHERE session_id = $1 AND expires_at > NOW()`,
      [session_id]
    );
    
    if (result.rows.length < 1) {  // no session_id found
      res.clearCookie("session_id");
      return res.status(401).json({ error: "No session_id found."});
    }
    return res.status(200).json({ loggedIn: true });
  }
  catch (err) {
    console.log("status error:" + err);
    return res.status(400).json({ error: "error in /status" });
  }
});


// GET /api/users/me
router.get('/me', async (req, res, next) => {
  const session_id = req.cookies.session_id;

  if (!session_id) {
    return res.status(401).json({ error: 'Not logged in' });
  }

  try {
    const sessionResult = await pool.query(
      `SELECT user_id FROM session_info WHERE session_id = $1 AND expires_at > NOW()`,
      [session_id]
    );

    if (sessionResult.rows.length < 1) {
      res.clearCookie('session_id');
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    const user_id = sessionResult.rows[0].user_id;

    const [userResult, schoolsResult, orgsResult] = await Promise.all([
      pool.query(
        `SELECT id, username, email, role FROM users WHERE id = $1`,
        [user_id]
      ),
      pool.query(
        `SELECT s.name FROM schools s
         JOIN user_schools us ON us.school_id = s.id
         WHERE us.user_id = $1`,
        [user_id]
      ),
      pool.query(
        `SELECT o.name FROM organizations o
         JOIN user_organizations uo ON uo.organization_id = o.id
         WHERE uo.user_id = $1`,
        [user_id]
      )
    ]);

    res.json({
      ...userResult.rows[0],
      schools: schoolsResult.rows.map(r => r.name),
      orgs: orgsResult.rows.map(r => r.name)
    });
  } 
  catch (err) {
    next(err);
  }
});


// POST /api/users/login
router.post('/login', async (req, res, next) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Missing login field." });
  }

  try {
    const result = await pool.query(
      `SELECT id, username, email, role, password_hash FROM users WHERE username = $1 OR email = $1`,
      [username]
    );

    if (result.rows.length < 1) {
      return res.status(404).json({ error: "No user found." });
    }

    const found_user = result.rows[0];
    const passMatch = await bcrypt.compare(password, found_user.password_hash);

    if (passMatch) {
      const session_id = crypto.randomBytes(32).toString("hex");
      await pool.query(
        `INSERT INTO session_info (user_id, session_id, expires_at) VALUES ($1, $2, $3)`,
        [found_user.id, session_id, new Date(Date.now() + 1000 * 60 * 60 * 24)]
      );

      res.cookie("session_id", session_id, {
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24
      });

      return res.status(200).json({
        user: found_user.username,
        email: found_user.email,
        role: found_user.role,
      });
    } 
    else {
      return res.status(401).json({ error: "Username/password incorrect." });
    }
  } 
  catch (err) {
    next(err);
  }
});

// DELETE /api/users/logout
router.delete('/logout', async (req, res) => {
    try {
      const result = await pool.query(
        `DELETE FROM session_info WHERE session_id = $1`,
        [req.cookies.session_id]
      );
      res.clearCookie("session_id");

      return res.status(200).json({ loggedOut: true});
    }
    catch (err) {
      return res.status(400).json({ error: err});
    }
});


// POST /api/users/register
router.post('/register', async (req, res, next) => {
  const { username, email, password_one, password_two, schools, orgs } = req.body;

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

    // Insert orgs if provided
    if (orgs?.length) {
      for (const orgName of orgs) {
        const org = await client.query(
          `INSERT INTO organizations (name) VALUES ($1)
           ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
           RETURNING id`,
          [orgName]
        );
        await client.query(
          `INSERT INTO user_organizations (user_id, organization_id) VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
          [newUser.id, org.rows[0].id]
        );
      }
    }

    await client.query('COMMIT');
    res.status(201).json({ ...newUser, schools: schools ?? [], orgs: orgs ?? [] });
  } 
  catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Username or email already exists' });
    }
    next(err);
  } 
  finally {
    client.release();
  }
});


// POST /api/users/add/org
router.post('/add/org', async (req, res, next) => {
  const { org } = req.body;
  const session_id = req.cookies.session_id;

  if (!session_id) {
    return res.status(401).json({ error: 'Not logged in' });
  }

  if (!org) {
    return res.status(400).json({ error: 'Missing org' });
  }

  try {
    // Get user_id from session
    const sessionResult = await pool.query(
      `SELECT user_id FROM session_info WHERE session_id = $1 AND expires_at > NOW()`,
      [session_id]
    );
    
    if (sessionResult.rows.length < 1) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }
    const user_id = sessionResult.rows[0].user_id;

    const orgResult = await pool.query(
      `INSERT INTO organizations (name) VALUES ($1)
       ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [org]
    );
    await pool.query(
      `INSERT INTO user_organizations (user_id, organization_id) VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [user_id, orgResult.rows[0].id]
    );
    return res.status(200).json({ added: org });
  } 
  catch (err) {
    next(err);
  }
});

// POST /api/users/add/school
router.post('/add/school', async (req, res, next) => {
  const { school } = req.body;
  const session_id = req.cookies.session_id;

  if (!session_id) {
    return res.status(401).json({ error: 'Not logged in' });
  }

  if (!school) {
    return res.status(400).json({ error: 'Missing school' });
  }

  try {
    const sessionResult = await pool.query(
      `SELECT user_id FROM session_info WHERE session_id = $1 AND expires_at > NOW()`,
      [session_id]
    );

    if (sessionResult.rows.length < 1) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }
    const user_id = sessionResult.rows[0].user_id;

    const schoolResult = await pool.query(
      `INSERT INTO schools (name) VALUES ($1)
       ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [school]
    );
    await pool.query(
      `INSERT INTO user_schools (user_id, school_id) VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [user_id, schoolResult.rows[0].id]
    );
    return res.status(200).json({ added: school });
  } 
  catch (err) {
    next(err);
  }
});


// DELETE /api/users/remove/school
router.delete('/remove/school', async (req, res, next) => {
  const { school } = req.body;
  const session_id = req.cookies.session_id;

  if (!session_id) {
    return res.status(401).json({ error: 'Not logged in' });
  }
  
  if (!school) {
    return res.status(400).json({ error: 'Missing school' });
  }

  try {
    const sessionResult = await pool.query(
      `SELECT user_id FROM session_info WHERE session_id = $1 AND expires_at > NOW()`,
      [session_id]
    );
    if (sessionResult.rows.length < 1) {
      res.clearCookie('session_id');
      return res.status(401).json({ error: 'Invalid or expired session' });
    }
    const user_id = sessionResult.rows[0].user_id;

    await pool.query(
      `DELETE FROM user_schools
       WHERE user_id = $1 AND school_id = (
         SELECT id FROM schools WHERE name = $2
       )`,
      [user_id, school]
    );
    return res.status(200).json({ removed: school });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/users/remove/org
router.delete('/remove/org', async (req, res, next) => {
  const { org } = req.body;
  const session_id = req.cookies.session_id;

  if (!session_id) {
      return res.status(401).json({ error: 'Not logged in' });
    }

  if (!org) {
    return res.status(400).json({ error: 'Missing org' });
  }

  try {
    const sessionResult = await pool.query(
      `SELECT user_id FROM session_info WHERE session_id = $1 AND expires_at > NOW()`,
      [session_id]
    );
    if (sessionResult.rows.length < 1) {
      res.clearCookie('session_id');
      return res.status(401).json({ error: 'Invalid or expired session' });
    }
    const user_id = sessionResult.rows[0].user_id;

    await pool.query(
      `DELETE FROM user_organizations
       WHERE user_id = $1 AND organization_id = (
         SELECT id FROM organizations WHERE name = $2
       )`,
      [user_id, org]
    );
    return res.status(200).json({ removed: org });
  } 
  catch (err) {
    next(err);
  }
});


export default router;