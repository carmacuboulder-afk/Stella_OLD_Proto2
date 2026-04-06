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
  if (!raw) return new Date().toISOString();
  raw = raw.trim();
  
  // Already in ISO format with dashes
  if (raw.includes('-') && raw.includes('T')) return raw;
  
  // Format: YYYYMMDDTHHMMSSZ (e.g., 20950514T131041Z)
  const match = raw.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z?$/);
  if (match) {
    const [, year, month, day, hour, min, sec] = match;
    return `${year}-${month}-${day}T${hour}:${min}:${sec}Z`;
  }
  
  // Fallback to current time if format not recognized
  console.warn('Unrecognized timestamp format:', raw);
  return new Date().toISOString();
};

const formatBatchDate = (rawTimestamp) => formatTimestamp(rawTimestamp).slice(0, 10);

const summarizeBatchDateWarnings = (rows) => {
  const batchDates = new Map();

  rows.forEach((row) => {
    const timestamp = row.timestamp_iso8601?.trim();
    const batchNumber = parseBatch(row.batch_number ?? row.batch);

    if (!timestamp || !batchNumber) return;

    if (!batchDates.has(batchNumber)) {
      batchDates.set(batchNumber, new Set());
    }

    batchDates.get(batchNumber).add(formatBatchDate(timestamp));
  });

  return Array.from(batchDates.entries())
    .filter(([, dates]) => dates.size > 1)
    .sort(([batchA], [batchB]) => {
      const aNum = Number(batchA);
      const bNum = Number(batchB);
      const aIsNumeric = Number.isFinite(aNum);
      const bIsNumeric = Number.isFinite(bNum);

      if (aIsNumeric && bIsNumeric) return aNum - bNum;
      if (aIsNumeric) return -1;
      if (bIsNumeric) return 1;
      return batchA.localeCompare(batchB, undefined, { numeric: true, sensitivity: 'base' });
    })
    .map(([batchNumber, dates]) => ({
      batchNumber,
      dates: Array.from(dates).sort(),
    }));
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

// GET /api/uploads/public
router.get('/public', async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT * FROM uploads
       WHERE is_public = true
       ORDER BY created_at DESC`
    );

    res.json(result.rows);
  } 
  catch(err) {
    alert("Could not fetch public STELLA data.");
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
        const batchWarnings = summarizeBatchDateWarnings(results);
        
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

              range_m, range_uncertainty_m, batch_number
            ) VALUES (
              $1, $2, $3,
              $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
              $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25,
              $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37,
              $38, $39, $40, $41, $42, $43, $44, $45, $46, $47, $48, $49,
              $50, $51, $52, $53, $54, $55, $56, $57, $58, $59, $60, $61,
              $62, $63, $64
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

              row.range_m, row.range_uncertainty_m, row.batch_number || row.batch || null
            ]);
        }

        await client.query('COMMIT');
        res.status(201).json({
          message: 'Upload success',
          rows: results.length,
          batchWarnings,
        });

      } catch (err) {
        await client.query('ROLLBACK');
        console.error("Upload Error:", err);
        res.status(500).json({ error: err.message });
      } finally {
        client.release();
      }
    });
});

// Helper to safely parse floats
const parseVal = (val) => {
  if (val === undefined || val === null || val === '--' || val === '') return null;
  const parsed = parseFloat(val);
  return isNaN(parsed) ? null : parsed;
};

const parseBatch = (val) => {
  if (val === undefined || val === null) return null;
  const normalized = `${val}`.trim();
  if (normalized === '' || normalized === '--') return null;
  return normalized;
};

// POST /api/uploads/live/start - Start a new live session
router.post('/live/start', async (req, res, next) => {
  const { device_type, software_version } = req.body;

  if (!device_type || !software_version) {
    return res.status(400).json({ error: 'Missing device_type or software_version' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Find or create device
    let deviceId;
    const deviceRes = await client.query(
      "SELECT id FROM devices WHERE device_type = $1 AND software_version = $2 LIMIT 1",
      [device_type, software_version]
    );

    if (deviceRes.rows.length > 0) {
      deviceId = deviceRes.rows[0].id;
    } else {
      const newDevice = await client.query(
        "INSERT INTO devices (device_type, software_version, name) VALUES ($1, $2, $3) RETURNING id",
        [device_type, software_version, `Live ${device_type}`]
      );
      deviceId = newDevice.rows[0].id;
    }

    // Create upload session
    const DEFAULT_USER_ID = 1;
    const timestamp = new Date().toISOString();
    const uploadName = `Live Session - ${new Date().toLocaleString()}`;

    const uploadRes = await client.query(
      `INSERT INTO uploads (
        user_id, device_id, upload_name, timestamp_iso8601
      ) VALUES ($1, $2, $3, $4) RETURNING id`,
      [DEFAULT_USER_ID, deviceId, uploadName, timestamp]
    );

    await client.query('COMMIT');
    res.status(201).json({ 
      sessionId: uploadRes.rows[0].id, 
      deviceId,
      message: 'Live session started' 
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error("Live session start error:", err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// POST /api/uploads/live/data - Add data to existing session
router.post('/live/data', async (req, res, next) => {
  const { sessionId, deviceId, ...liveData } = req.body;

  if (!sessionId || !deviceId) {
    return res.status(400).json({ error: 'Missing sessionId or deviceId' });
  }

  try {
    const timestamp = new Date().toISOString();

    const dataRow = {
      upload_id: sessionId,
      device_id: deviceId,
      timestamp_iso8601: timestamp,
      batch_number: parseBatch(liveData.batch_number ?? liveData.batch),
      
      // Environmental sensors
      surface_temperature_C: parseVal(liveData.surface_temp),
      air_temperature_C: parseVal(liveData.air_temp),
      relative_humidity_percent: parseVal(liveData.rel_humidity),
      barometric_pressure_hPa: parseVal(liveData.barometric_pressure),
      altitude_uncalibrated_m: parseVal(liveData.altitude),
      range_m: parseVal(liveData.range),
      
      // Visible light spectrum
      irradiance_450nm_blue_irradiance_uW_per_cm_squared: parseVal(liveData.v450),
      irradiance_500nm_cyan_irradiance_uW_per_cm_squared: parseVal(liveData.b500),
      irradiance_550nm_green_irradiance_uW_per_cm_squared: parseVal(liveData.g550),
      irradiance_570nm_yellow_irradiance_uW_per_cm_squared: parseVal(liveData.y570),
      irradiance_600nm_orange_irradiance_uW_per_cm_squared: parseVal(liveData.o600),
      irradiance_650nm_red_irradiance_uW_per_cm_squared: parseVal(liveData.r650),
      
      // Near-infrared spectrum
      irradiance_610nm_orange_irradiance_uW_per_cm_squared: parseVal(liveData['610']),
      irradiance_680nm_near_infrared_irradiance_uW_per_cm_squared: parseVal(liveData['680']),
      irradiance_730nm_near_infrared_irradiance_uW_per_cm_squared: parseVal(liveData['730']),
      irradiance_760nm_near_infrared_irradiance_uW_per_cm_squared: parseVal(liveData['760']),
      irradiance_810nm_near_infrared_irradiance_uW_per_cm_squared: parseVal(liveData['810']),
      irradiance_860nm_near_infrared_irradiance_uW_per_cm_squared: parseVal(liveData['860']),
    };

    // Insert data
    const columns = Object.keys(dataRow);
    const values = Object.values(dataRow);
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');

    await pool.query(
      `INSERT INTO data (${columns.join(', ')}) VALUES (${placeholders})`,
      values
    );

    res.status(201).json({ message: 'Data point saved' });

  } catch (err) {
    console.error("Live data error:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/uploads/live/end - End a live session (optional, for cleanup)
router.post('/live/end', async (req, res, next) => {
  const { sessionId } = req.body;

  if (!sessionId) {
    return res.status(400).json({ error: 'Missing sessionId' });
  }

  try {
    // Update the upload name to include end time and data count
    const countRes = await pool.query(
      'SELECT COUNT(*) as count FROM data WHERE upload_id = $1',
      [sessionId]
    );
    
    const dataPoints = countRes.rows[0].count;
    const endTime = new Date().toLocaleString();
    
    await pool.query(
      'UPDATE uploads SET upload_name = upload_name || $1 WHERE id = $2',
      [` (${dataPoints} points, ended ${endTime})`, sessionId]
    );

    res.status(200).json({ message: 'Session ended', dataPoints });

  } catch (err) {
    console.error("Live session end error:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/uploads/:id/data
router.get('/:id/data', async (req, res, next) => {
  try {
    const result = await pool.query(
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
       ORDER BY d.timestamp_iso8601 ASC`,
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

// GET /api/uploads/user/:userId
router.get('/user/:userId', async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT * FROM uploads WHERE user_id = $1 ORDER BY created_at DESC',
      [req.params.userId]
    );

    res.json(result.rows || []);
  } catch (err) {
    console.error("Error fetching uploads by user:", err);
    next(err);
  }
});


export default router;
