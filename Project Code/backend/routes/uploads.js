// routes/uploads.js
import { Router } from 'express';
import pool from '../db.js';
import multer from 'multer';
import csv from 'csv-parser';
import { Readable } from 'stream';

const router = Router();
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE } 
});

const formatTimestamp = (raw) => {
  if (!raw || raw.includes('-')) return raw;
  return `${raw.slice(0,4)}-${raw.slice(4,6)}-${raw.slice(6,8)}T${raw.slice(9,11)}:${raw.slice(11,13)}:${raw.slice(13)}`;
};

// GET /api/uploads
router.get('/', async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM uploads ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// POST /api/uploads/csv
router.post('/csv', upload.single('file'), async (req, res, next) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const client = await pool.connect();
  const results = [];

  const stream = Readable.from(req.file.buffer.toString());
  
  stream
    .pipe(csv({ mapHeaders: ({ header }) => header.trim() }))
    .on('data', (data) => results.push(data))
    .on('end', async () => {
      try {
        if (results.length === 0) throw new Error("CSV is empty");

        const firstRow = results[0];
        const deviceType = firstRow.device_type;
        const fileTimestamp = formatTimestamp(firstRow.timestamp_iso8601);
        
        await client.query('BEGIN');


        const deviceRes = await client.query(
          "SELECT id FROM devices WHERE device_type = $1 LIMIT 1", 
          [deviceType]
        );
        
        let deviceId;
        if (deviceRes.rows.length > 0) {
          deviceId = deviceRes.rows[0].id;
        } else {
          const newDevice = await client.query(
             "INSERT INTO devices (device_type, software_version, name) VALUES ($1, $2, $3) RETURNING id",
             [deviceType, firstRow.software_version, `Auto-Created ${deviceType}`]
          );
          deviceId = newDevice.rows[0].id;
        }

        // TODO: integrate with real user id
        const DEFAULT_USER_ID = 1; 
        
        const uploadRes = await client.query(
          `INSERT INTO uploads (
            user_id, team_id, device_id, upload_name, timestamp_iso8601
          ) VALUES ($1, NULL, $2, $3, $4) RETURNING id`,
          [DEFAULT_USER_ID, deviceId, req.file.originalname, fileTimestamp]
        );
        const uploadId = uploadRes.rows[0].id;

        for (const row of results) {
            if (!row.timestamp_iso8601 || row.timestamp_iso8601.trim() === "") {
                continue;
            }
            await client.query(
            `INSERT INTO data (
              upload_id, device_id, timestamp_iso8601,
              surface_temperature_C, surface_temperature_uncertainty_C,
              air_temperature_C, air_temperature_uncertainty_C,
              relative_humidity_percent, relative_humidity_uncertainty_percent,
              barometric_pressure_hPa, barometric_pressure_uncertainty_hPa,
              altitude_uncalibrated_m, altitude_uncertainty_m,
              
              irradiance_450nm_blue_wavelength_nm, irradiance_450nm_blue_wavelength_uncertainty_nm,
              irradiance_450nm_blue_irradiance_uW_per_cm_squared, irradiance_450nm_blue_irradiance_uncertainty_uW_per_cm_squared,
              
              irradiance_500nm_cyan_wavelength_nm, irradiance_500nm_cyan_wavelength_uncertainty_nm,
              irradiance_500nm_cyan_irradiance_uW_per_cm_squared, irradiance_500nm_cyan_irradiance_uncertainty_uW_per_cm_squared,
              
              irradiance_550nm_green_wavelength_nm, irradiance_550nm_green_wavelength_uncertainty_nm,
              irradiance_550nm_green_irradiance_uW_per_cm_squared, irradiance_550nm_green_irradiance_uncertainty_uW_per_cm_squared,
              
              irradiance_570nm_yellow_wavelength_nm, irradiance_570nm_yellow_wavelength_uncertainty_nm,
              irradiance_570nm_yellow_irradiance_uW_per_cm_squared, irradiance_570nm_yellow_irradiance_uncertainty_uW_per_cm_squared,
              
              irradiance_600nm_orange_wavelength_nm, irradiance_600nm_orange_wavelength_uncertainty_nm,
              irradiance_600nm_orange_irradiance_uW_per_cm_squared, irradiance_600nm_orange_irradiance_uncertainty_uW_per_cm_squared,
              
              irradiance_650nm_red_wavelength_nm, irradiance_650nm_red_wavelength_uncertainty_nm,
              irradiance_650nm_red_irradiance_uW_per_cm_squared, irradiance_650nm_red_irradiance_uncertainty_uW_per_cm_squared,
              
              irradiance_610nm_orange_wavelength_nm, irradiance_610nm_orange_wavelength_uncertainty_nm,
              irradiance_610nm_orange_irradiance_uW_per_cm_squared, irradiance_610nm_orange_irradiance_uncertainty_uW_per_cm_squared,
              
              irradiance_680nm_near_infrared_wavelength_nm, irradiance_680nm_near_infrared_wavelength_uncertainty_nm,
              irradiance_680nm_near_infrared_irradiance_uW_per_cm_squared, irradiance_680nm_near_infrared_irradiance_uncertainty_uW_per_cm_squared,
              
              irradiance_730nm_near_infrared_wavelength_nm, irradiance_730nm_near_infrared_wavelength_uncertainty_nm,
              irradiance_730nm_near_infrared_irradiance_uW_per_cm_squared, irradiance_730nm_near_infrared_irradiance_uncertainty_uW_per_cm_squared,
              
              irradiance_760nm_near_infrared_wavelength_nm, irradiance_760nm_near_infrared_wavelength_uncertainty_nm,
              irradiance_760nm_near_infrared_irradiance_uW_per_cm_squared, irradiance_760nm_near_infrared_irradiance_uncertainty_uW_per_cm_squared,
              
              irradiance_810nm_near_infrared_wavelength_nm, irradiance_810nm_near_infrared_wavelength_uncertainty_nm,
              irradiance_810nm_near_infrared_irradiance_uW_per_cm_squared, irradiance_810nm_near_infrared_irradiance_uncertainty_uW_per_cm_squared,
              
              irradiance_860nm_near_infrared_wavelength_nm, irradiance_860nm_near_infrared_wavelength_uncertainty_nm,
              irradiance_860nm_near_infrared_irradiance_uW_per_cm_squared, irradiance_860nm_near_infrared_irradiance_uncertainty_uW_per_cm_squared,

              range_m, range_uncertainty_m
            ) VALUES (
              $1, $2, $3,
              $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
              $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25,
              $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37,
              $38, $39, $40, $41, $42, $43, $44, $45, $46, $47, $48, $49,
              $50, $51, $52, $53, $54, $55, $56, $57, $58, $59, $60, $61,
              $62, $63
            )`,
            [
              uploadId, deviceId, formatTimestamp(row.timestamp_iso8601),
              
              row.surface_temperature_C, row.surface_temperature_uncertainty_C,
              row.air_temperature_C, row.air_temperature_uncertainty_C,
              row.relative_humidity_percent, row.relative_humidity_uncertainty_percent,
              row.barometric_pressure_hPa, row.barometric_pressure_uncertainty_hPa,
              row.altitude_uncalibrated_m, row.altitude_uncertainty_m,

              row.irradiance_450nm_blue_wavelength_nm, row.irradiance_450nm_blue_wavelength_uncertainty_nm,
              row.irradiance_450nm_blue_irradiance_uW_per_cm_squared, row.irradiance_450nm_blue_irradiance_uncertainty_uW_per_cm_squared,

              row.irradiance_500nm_cyan_wavelength_nm, row.irradiance_500nm_cyan_wavelength_uncertainty_nm,
              row.irradiance_500nm_cyan_irradiance_uW_per_cm_squared, row.irradiance_500nm_cyan_irradiance_uncertainty_uW_per_cm_squared,

              row.irradiance_550nm_green_wavelength_nm, row.irradiance_550nm_green_wavelength_uncertainty_nm,
              row.irradiance_550nm_green_irradiance_uW_per_cm_squared, row.irradiance_550nm_green_irradiance_uncertainty_uW_per_cm_squared,

              row.irradiance_570nm_yellow_wavelength_nm, row.irradiance_570nm_yellow_wavelength_uncertainty_nm,
              row.irradiance_570nm_yellow_irradiance_uW_per_cm_squared, row.irradiance_570nm_yellow_irradiance_uncertainty_uW_per_cm_squared,

              row.irradiance_600nm_orange_wavelength_nm, row.irradiance_600nm_orange_wavelength_uncertainty_nm,
              row.irradiance_600nm_orange_irradiance_uW_per_cm_squared, row.irradiance_600nm_orange_irradiance_uncertainty_uW_per_cm_squared,

              row.irradiance_650nm_red_wavelength_nm, row.irradiance_650nm_red_wavelength_uncertainty_nm,
              row.irradiance_650nm_red_irradiance_uW_per_cm_squared, row.irradiance_650nm_red_irradiance_uncertainty_uW_per_cm_squared,

              row.irradiance_610nm_orange_wavelength_nm, row.irradiance_610nm_orange_wavelength_uncertainty_nm,
              row.irradiance_610nm_orange_irradiance_uW_per_cm_squared, row.irradiance_610nm_orange_irradiance_uncertainty_uW_per_cm_squared,

              row.irradiance_680nm_near_infrared_wavelength_nm, row.irradiance_680nm_near_infrared_wavelength_uncertainty_nm,
              row.irradiance_680nm_near_infrared_irradiance_uW_per_cm_squared, row.irradiance_680nm_near_infrared_irradiance_uncertainty_uW_per_cm_squared,

              row.irradiance_730nm_near_infrared_wavelength_nm, row.irradiance_730nm_near_infrared_wavelength_uncertainty_nm,
              row.irradiance_730nm_near_infrared_irradiance_uW_per_cm_squared, row.irradiance_730nm_near_infrared_irradiance_uncertainty_uW_per_cm_squared,

              row.irradiance_760nm_near_infrared_wavelength_nm, row.irradiance_760nm_near_infrared_wavelength_uncertainty_nm,
              row.irradiance_760nm_near_infrared_irradiance_uW_per_cm_squared, row.irradiance_760nm_near_infrared_irradiance_uncertainty_uW_per_cm_squared,

              row.irradiance_810nm_near_infrared_wavelength_nm, row.irradiance_810nm_near_infrared_wavelength_uncertainty_nm,
              row.irradiance_810nm_near_infrared_irradiance_uW_per_cm_squared, row.irradiance_810nm_near_infrared_irradiance_uncertainty_uW_per_cm_squared,

              row.irradiance_860nm_near_infrared_wavelength_nm, row.irradiance_860nm_near_infrared_wavelength_uncertainty_nm,
              row.irradiance_860nm_near_infrared_irradiance_uW_per_cm_squared, row.irradiance_860nm_near_infrared_irradiance_uncertainty_uW_per_cm_squared,

              row.range_m, row.range_uncertainty_m
            ]);
        }

        await client.query('COMMIT');
        res.status(201).json({ message: 'Upload success', rows: results.length });

      } catch (err) {
        await client.query('ROLLBACK');
        console.error("Upload Error:", err);
        res.status(500).json({ error: err.message });
      } finally {
        client.release();
      }
    });
});

// GET /api/uploads/:id/data
router.get('/:id/data', async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT * FROM data WHERE upload_id = $1 ORDER BY timestamp_iso8601 ASC',
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// // POST /api/uploads
// router.post('/', async (req, res, next) => {
//   const {
//     userId,
//     teamId,
//     isPublic,
//     deviceId,
//     uploadName,
//     latitude,
//     longitude,
//     locationLabel,
//     weekday,
//     timestampIso8601
//   } = req.body;

//   try {
//     const result = await pool.query(
//       `INSERT INTO uploads (
//         user_id, team_id, is_public, device_id, upload_name,
//         latitude, longitude, location_label, weekday, timestamp_iso8601
//       )
//       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
//       RETURNING *`,
//       [
//         userId,
//         teamId || null,
//         isPublic || false,
//         deviceId,
//         uploadName,
//         latitude,
//         longitude,
//         locationLabel,
//         weekday,
//         timestampIso8601
//       ]
//     );

//     res.status(201).json(result.rows[0]);
//   } catch (err) {
//     next(err);
//   }
// });

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