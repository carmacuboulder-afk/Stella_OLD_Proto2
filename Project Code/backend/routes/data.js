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
    const result = await pool.query( //coalesce handles empty notes
      `SELECT d.*, COALESCE(bn.note, '') AS note
       FROM data d
       LEFT JOIN batch_notes bn
         ON bn.upload_id = d.upload_id
        AND bn.batch_number = COALESCE(NULLIF(BTRIM(d.batch_number), ''), '')
       WHERE d.upload_id = $1
       ORDER BY d.id`,
      [req.params.uploadId]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// PUT /api/data/batch-note
router.put('/batch-note', async (req, res, next) => {
  const { uploadId, batchNumber, note } = req.body;
  const normalizedBatchNumber = `${batchNumber ?? ''}`.trim();
  const storedBatchNumber = normalizedBatchNumber === 'Unspecified' ? '' : normalizedBatchNumber;

  try {
    const batchExists = await pool.query(
      `SELECT 1
       FROM data
       WHERE upload_id = $1
         AND COALESCE(NULLIF(BTRIM(batch_number), ''), '') = $2
       LIMIT 1`,
      [uploadId, storedBatchNumber]
    );

    if (batchExists.rows.length === 0) {
      return res.status(404).json({ error: 'Batch not found for this upload' });
    }

    const result = await pool.query(
      `INSERT INTO batch_notes (upload_id, batch_number, note)
       VALUES ($1, $2, $3)
       ON CONFLICT (upload_id, batch_number)
       DO UPDATE SET
         note = EXCLUDED.note,
         updated_at = NOW()
       RETURNING upload_id, batch_number, note`,
      [uploadId, storedBatchNumber, note ?? '']
    );

    res.json({
      uploadId: result.rows[0].upload_id,
      batchNumber: result.rows[0].batch_number || 'Unspecified',
      note: result.rows[0].note ?? '',
    });
  } catch (err) {
    next(err);
  }
});

export default router;
