import { Router } from 'express';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

const DATA_SELECT = `
  d.id,
  d.upload_id,
  d.device_id,

  d.surface_temperature_c,
  d.surface_temperature_uncertainty_c,
  d.air_temperature_c,
  d.air_temperature_uncertainty_c,
  d.relative_humidity_percent,
  d.relative_humidity_uncertainty_percent,
  d.barometric_pressure_hpa,
  d.barometric_pressure_uncertainty_hpa,
  d.altitude_uncalibrated_m,
  d.altitude_uncertainty_m,

  d.irradiance_450nm_blue_wavelength_nm,
  d.irradiance_450nm_blue_wavelength_uncertainty_nm,
  d.irradiance_450nm_blue_irradiance_uW_per_cm_squared,
  d.irradiance_450nm_blue_irradiance_uncertainty_uW_per_cm_squared,

  d.irradiance_500nm_cyan_wavelength_nm,
  d.irradiance_500nm_cyan_wavelength_uncertainty_nm,
  d.irradiance_500nm_cyan_irradiance_uW_per_cm_squared,
  d.irradiance_500nm_cyan_irradiance_uncertainty_uW_per_cm_squared,

  d.irradiance_550nm_green_wavelength_nm,
  d.irradiance_550nm_green_wavelength_uncertainty_nm,
  d.irradiance_550nm_green_irradiance_uW_per_cm_squared,
  d.irradiance_550nm_green_irradiance_uncertainty_uW_per_cm_squared,

  d.irradiance_570nm_yellow_wavelength_nm,
  d.irradiance_570nm_yellow_wavelength_uncertainty_nm,
  d.irradiance_570nm_yellow_irradiance_uW_per_cm_squared,
  d.irradiance_570nm_yellow_irradiance_uncertainty_uW_per_cm_squared,

  d.irradiance_600nm_orange_wavelength_nm,
  d.irradiance_600nm_orange_wavelength_uncertainty_nm,
  d.irradiance_600nm_orange_irradiance_uW_per_cm_squared,
  d.irradiance_600nm_orange_irradiance_uncertainty_uW_per_cm_squared,

  d.irradiance_650nm_red_wavelength_nm,
  d.irradiance_650nm_red_wavelength_uncertainty_nm,
  d.irradiance_650nm_red_irradiance_uW_per_cm_squared,
  d.irradiance_650nm_red_irradiance_uncertainty_uW_per_cm_squared,

  d.irradiance_610nm_orange_wavelength_nm,
  d.irradiance_610nm_orange_wavelength_uncertainty_nm,
  d.irradiance_610nm_orange_irradiance_uW_per_cm_squared,
  d.irradiance_610nm_orange_irradiance_uncertainty_uW_per_cm_squared,

  d.irradiance_680nm_near_infrared_wavelength_nm,
  d.irradiance_680nm_near_infrared_wavelength_uncertainty_nm,
  d.irradiance_680nm_near_infrared_irradiance_uW_per_cm_squared,
  d.irradiance_680nm_near_infrared_irradiance_uncertainty_uW_per_cm_squared,

  d.irradiance_730nm_near_infrared_wavelength_nm,
  d.irradiance_730nm_near_infrared_wavelength_uncertainty_nm,
  d.irradiance_730nm_near_infrared_irradiance_uW_per_cm_squared,
  d.irradiance_730nm_near_infrared_irradiance_uncertainty_uW_per_cm_squared,

  d.irradiance_760nm_near_infrared_wavelength_nm,
  d.irradiance_760nm_near_infrared_wavelength_uncertainty_nm,
  d.irradiance_760nm_near_infrared_irradiance_uW_per_cm_squared,
  d.irradiance_760nm_near_infrared_irradiance_uncertainty_uW_per_cm_squared,

  d.irradiance_810nm_near_infrared_wavelength_nm,
  d.irradiance_810nm_near_infrared_wavelength_uncertainty_nm,
  d.irradiance_810nm_near_infrared_irradiance_uW_per_cm_squared,
  d.irradiance_810nm_near_infrared_irradiance_uncertainty_uW_per_cm_squared,

  d.irradiance_860nm_near_infrared_wavelength_nm,
  d.irradiance_860nm_near_infrared_wavelength_uncertainty_nm,
  d.irradiance_860nm_near_infrared_irradiance_uW_per_cm_squared,
  d.irradiance_860nm_near_infrared_irradiance_uncertainty_uW_per_cm_squared,

  d.range_m,
  d.range_uncertainty_m,
  d.created_at,
  d.timestamp_iso8601
`;

// GET /api/external/devices
router.get('/devices', async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT
         id,
         device_type,
         name,
         software_version,
         created_at,
         battery_voltage
       FROM devices
       ORDER BY id`
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/external/devices/:id
router.get('/devices/:id', async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT
         id,
         device_type,
         name,
         software_version,
         created_at,
         battery_voltage
       FROM devices
       WHERE id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Device not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// GET /api/external/uploads
router.get('/uploads', async (req, res, next) => {
  const { userId, teamId, deviceId, limit = 100, offset = 0 } = req.query;

  const values = [];
  const where = [];

  if (userId) {
    values.push(userId);
    where.push(`u.user_id = $${values.length}`);
  }
  if (teamId) {
    values.push(teamId);
    where.push(`u.team_id = $${values.length}`);
  }
  if (deviceId) {
    values.push(deviceId);
    where.push(`u.device_id = $${values.length}`);
  }

  values.push(Number(limit));
  const limitPos = values.length;
  values.push(Number(offset));
  const offsetPos = values.length;

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

  try {
    const result = await pool.query(
      `SELECT
         u.id,
         u.user_id,
         u.team_id,
         u.is_public,
         u.device_id,
         u.upload_name,
         u.latitude,
         u.longitude,
         u.location_label,
         u.weekday,
         u.timestamp_iso8601,
         u.created_at
       FROM uploads u
       ${whereClause}
       ORDER BY u.timestamp_iso8601 DESC
       LIMIT $${limitPos}
       OFFSET $${offsetPos}`,
      values
    );

    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/external/uploads/:id
router.get('/uploads/:id', async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT
         id,
         user_id,
         team_id,
         is_public,
         device_id,
         upload_name,
         latitude,
         longitude,
         location_label,
         weekday,
         timestamp_iso8601,
         created_at
       FROM uploads
       WHERE id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Upload not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// GET /api/external/data
router.get('/data', async (req, res, next) => {
  const {
    uploadId,
    deviceId,
    from,
    to,
    limit = 100,
    offset = 0,
  } = req.query;

  const values = [];
  const where = [];

  if (uploadId) {
    values.push(uploadId);
    where.push(`d.upload_id = $${values.length}`);
  }
  if (deviceId) {
    values.push(deviceId);
    where.push(`d.device_id = $${values.length}`);
  }
  if (from) {
    values.push(from);
    where.push(`d.timestamp_iso8601 >= $${values.length}`);
  }
  if (to) {
    values.push(to);
    where.push(`d.timestamp_iso8601 <= $${values.length}`);
  }

  values.push(Number(limit));
  const limitPos = values.length;
  values.push(Number(offset));
  const offsetPos = values.length;

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

  try {
    const result = await pool.query(
      `SELECT ${DATA_SELECT}
       FROM data d
       ${whereClause}
       ORDER BY d.timestamp_iso8601 DESC
       LIMIT $${limitPos}
       OFFSET $${offsetPos}`,
      values
    );

    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/external/data/:id
router.get('/data/:id', async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT ${DATA_SELECT}
       FROM data d
       WHERE d.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Data row not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// GET /api/external/uploads/:id/data
router.get('/uploads/:id/data', async (req, res, next) => {
  const { from, to, limit = 500, offset = 0 } = req.query;

  const values = [req.params.id];
  const where = [`d.upload_id = $1`];

  if (from) {
    values.push(from);
    where.push(`d.timestamp_iso8601 >= $${values.length}`);
  }
  if (to) {
    values.push(to);
    where.push(`d.timestamp_iso8601 <= $${values.length}`);
  }

  values.push(Number(limit));
  const limitPos = values.length;
  values.push(Number(offset));
  const offsetPos = values.length;

  try {
    const result = await pool.query(
      `SELECT ${DATA_SELECT}
       FROM data d
       WHERE ${where.join(' AND ')}
       ORDER BY d.timestamp_iso8601 ASC
       LIMIT $${limitPos}
       OFFSET $${offsetPos}`,
      values
    );

    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/external/devices/:id/data
router.get('/devices/:id/data', async (req, res, next) => {
  const { from, to, limit = 500, offset = 0 } = req.query;

  const values = [req.params.id];
  const where = [`d.device_id = $1`];

  if (from) {
    values.push(from);
    where.push(`d.timestamp_iso8601 >= $${values.length}`);
  }
  if (to) {
    values.push(to);
    where.push(`d.timestamp_iso8601 <= $${values.length}`);
  }

  values.push(Number(limit));
  const limitPos = values.length;
  values.push(Number(offset));
  const offsetPos = values.length;

  try {
    const result = await pool.query(
      `SELECT ${DATA_SELECT}
       FROM data d
       WHERE ${where.join(' AND ')}
       ORDER BY d.timestamp_iso8601 ASC
       LIMIT $${limitPos}
       OFFSET $${offsetPos}`,
      values
    );

    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/external/uploads/:id/full
router.get('/uploads/:id/full', async (req, res, next) => {
  try {
    const uploadResult = await pool.query(
      `SELECT
         u.id,
         u.user_id,
         u.team_id,
         u.is_public,
         u.device_id,
         u.upload_name,
         u.latitude,
         u.longitude,
         u.location_label,
         u.weekday,
         u.timestamp_iso8601,
         u.created_at
       FROM uploads u
       WHERE u.id = $1`,
      [req.params.id]
    );

    if (uploadResult.rows.length === 0) {
      return res.status(404).json({ error: 'Upload not found' });
    }

    const deviceResult = await pool.query(
      `SELECT
         id,
         device_type,
         name,
         software_version,
         created_at,
         battery_voltage
       FROM devices
       WHERE id = $1`,
      [uploadResult.rows[0].device_id]
    );

    const dataResult = await pool.query(
      `SELECT ${DATA_SELECT}
       FROM data d
       WHERE d.upload_id = $1
       ORDER BY d.timestamp_iso8601 ASC`,
      [req.params.id]
    );

    res.json({
      upload: uploadResult.rows[0],
      device: deviceResult.rows[0] || null,
      data: dataResult.rows,
    });
  } catch (err) {
    next(err);
  }
});

export default router;