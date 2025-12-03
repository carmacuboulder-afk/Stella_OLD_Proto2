// routes/teams.js
import { Router } from 'express';
import pool from '../db.js';

const router = Router();

// GET /api/teams
router.get('/', async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT id, name, description, owner_user_id, created_at FROM teams'
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// POST /api/teams
router.post('/', async (req, res, next) => {
  const { name, description, ownerUserId } = req.body;

  if (!name || !ownerUserId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO teams (name, description, owner_user_id)
       VALUES ($1, $2, $3)
       RETURNING id, name, description, owner_user_id, created_at`,
      [name, description || null, ownerUserId]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// GET /api/teams/:id 
router.get('/:id', async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT * FROM teams WHERE id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Team not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

export default router;