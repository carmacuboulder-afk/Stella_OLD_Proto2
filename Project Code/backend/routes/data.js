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

// PUT /api/data/:id/coordinates
router.put('/:id/coordinates', async (req, res) => {
  const { latitude, longitude } = req.body;
  const { id } = req.params;

  try {
    await pool.query(
      'UPDATE data SET latitude = $1, longitude = $2 WHERE id = $3',
      [latitude, longitude, id]
    );
    res.status(200).json({ message: 'Coordinates updated!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;