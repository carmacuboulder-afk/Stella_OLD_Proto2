// routes/uploads.js
import { Router } from 'express';
import pool from '../db.js';

const router = Router();

// GET /api/uploads
router.get('/', async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM uploads ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// POST /api/uploads
router.post('/', async (req, res, next) => {
  const {
    userId,
    teamId,
    isPublic,
    deviceId,
    uploadName,
    latitude,
    longitude,
    locationLabel,
    weekday,
    timestampIso8601
  } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO uploads (
        user_id, team_id, is_public, device_id, upload_name,
        latitude, longitude, location_label, weekday, timestamp_iso8601
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *`,
      [
        userId,
        teamId || null,
        isPublic || false,
        deviceId,
        uploadName,
        latitude,
        longitude,
        locationLabel,
        weekday,
        timestampIso8601
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// GET /api/uploads/:id
router.get('/:id', async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT * FROM uploads WHERE id = $1',
      [req.params.id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

export default router;