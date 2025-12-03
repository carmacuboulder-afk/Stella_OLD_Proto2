// routes/devices.js
import { Router } from 'express';
import pool from '../db.js';

const router = Router();

// GET /api/devices
router.get('/', async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT * FROM devices ORDER BY id'
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// POST /api/devices
router.post('/', async (req, res, next) => {
  const { deviceType, name, softwareVersion, batteryVoltage } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO devices (device_type, name, software_version, battery_voltage)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [deviceType, name, softwareVersion, batteryVoltage]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

export default router;