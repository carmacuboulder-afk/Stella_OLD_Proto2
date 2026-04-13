// routes/data.js
import { Router } from 'express';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { getAccessibleUploadById } from '../services/uploadAccess.js';

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
      `SELECT
         d.*,
         (d.timestamp_iso8601 AT TIME ZONE 'UTC')::date AS batch_date,
         COALESCE(bn.note, '') AS note
       FROM data d
       LEFT JOIN batch_notes bn
         ON bn.upload_id = d.upload_id
        AND bn.batch_number = COALESCE(NULLIF(BTRIM(d.batch_number), ''), '')
        AND bn.batch_date = (d.timestamp_iso8601 AT TIME ZONE 'UTC')::date
       WHERE d.upload_id = $1
       ORDER BY d.id`,
      [req.params.uploadId]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/data/upload/:uploadId/markers
router.get('/upload/:uploadId/markers', async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT
        d.id,
        d.upload_id,
        d.device_id,
        d.latitude,
        d.longitude,
        d.timestamp_iso8601,
        u.org_id,
        o.name AS org_name,
        COALESCE(bn.batch_notes, '[]') AS batch_notes
      FROM data d
      JOIN uploads u ON u.id = d.upload_id
      LEFT JOIN organizations o ON o.id = u.org_id
      LEFT JOIN LATERAL (
        SELECT json_agg(
          jsonb_build_object(
            'batch_number', bn.batch_number,
            'batch_date', bn.batch_date,
            'note', bn.note
          )
        ) AS batch_notes
        FROM batch_notes bn
        WHERE bn.upload_id = u.id
      ) bn ON true
      WHERE d.upload_id = $1;`,
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

// PUT /api/data/batch-note
router.put('/batch-note', requireAuth, async (req, res, next) => {
  const { uploadId, batchNumber, batchDate, note } = req.body;
  const normalizedBatchNumber = `${batchNumber ?? ''}`.trim();
  const storedBatchNumber = normalizedBatchNumber === 'Unspecified' ? '' : normalizedBatchNumber;
  const storedBatchDate = `${batchDate ?? ''}`.trim();

  if (!storedBatchDate) {
    return res.status(400).json({ error: 'Batch date is required' });
  }

  try {
    const upload = await getAccessibleUploadById(uploadId, req.user_id);
    if (!upload) {
      return res.status(404).json({ error: 'Upload not found' });
    }

    const batchExists = await pool.query(
      `SELECT 1
       FROM data
       WHERE upload_id = $1
         AND COALESCE(NULLIF(BTRIM(batch_number), ''), '') = $2
         AND (timestamp_iso8601 AT TIME ZONE 'UTC')::date = $3::date
       LIMIT 1`,
      [uploadId, storedBatchNumber, storedBatchDate]
    );

    if (batchExists.rows.length === 0) {
      return res.status(404).json({ error: 'Batch not found for this upload' });
    }

    const result = await pool.query(
      `INSERT INTO batch_notes (upload_id, batch_number, batch_date, note)
       VALUES ($1, $2, $3::date, $4)
       ON CONFLICT (upload_id, batch_number, batch_date)
       DO UPDATE SET
         note = EXCLUDED.note,
         updated_at = NOW()
       RETURNING upload_id, batch_number, batch_date, note`,
      [uploadId, storedBatchNumber, storedBatchDate, note ?? '']
    );

    res.json({
      uploadId: result.rows[0].upload_id,
      batchNumber: result.rows[0].batch_number || 'Unspecified',
      batchDate: result.rows[0].batch_date,
      note: result.rows[0].note ?? '',
    });
  } catch (err) {
    next(err);
  }
});

export default router;
