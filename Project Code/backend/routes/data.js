// routes/data.js
import { Router } from 'express';
import pool from '../db.js';

const router = Router();

// POST /api/data
router.post('/', async (req, res, next) => {
  const data = req.body; 

  const columns = Object.keys(data);
  const values = Object.values(data);
  const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');

  try {
    const result = await pool.query(
      `INSERT INTO data (${columns.join(', ')})
       VALUES (${placeholders})
       RETURNING *`,
      values
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// GET /api/data/upload/:uploadId
router.get('/upload/:uploadId', async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT *
       FROM data
       WHERE upload_id = $1
       ORDER BY id`,
      [req.params.uploadId]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// PUT /api/data/:id/note
router.put('/:id/note', async (req, res, next) => {
  const { note } = req.body;

  try {
    const result = await pool.query(
      `UPDATE data
       SET note = $1
       WHERE id = $2
       RETURNING id, note`,
      [note ?? '', req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Data point not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

export default router;
