import pool from '../db.js';
import { getEvaConnectionForUser } from './evaAuth.js';
import { getEvaPodDataForUser } from './evaClient.js';

function toNumberOrNull(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export async function importEvaPodForUser({ userId, podId }) {
  const account = await getEvaConnectionForUser(userId);

  if (!account) {
    throw new Error('No EVA account connected for this user');
  }

  const evaPayload = await getEvaPodDataForUser(userId, podId);
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const importResult = await client.query(
      `INSERT INTO eva_pod_imports (
         user_id,
         user_eva_account_id,
         eva_pod_id,
         nickname,
         latitude,
         longitude,
         visibility,
         last_updated
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        userId,
        account.id,
        evaPayload.id,
        evaPayload.nickname || null,
        evaPayload.latitude ?? null,
        evaPayload.longitude ?? null,
        evaPayload.visibility || null,
        evaPayload.lastUpdated || null,
      ]
    );

    const evaImport = importResult.rows[0];
    const readings = Array.isArray(evaPayload.data) ? evaPayload.data : [];

    for (const item of readings) {
      const nested = item?.data || {};

      await client.query(
        `INSERT INTO eva_pod_readings (
           eva_import_id,
           eva_reading_id,
           timestamp,
           visibility,
           sensor_data_id,
           pod_data_id,
           sensor_type,
           reading_value,
           reading_units,
           reading_timestamp,
           raw_data,
           eva_created_at
         )
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [
          evaImport.id,
          item.id || null,
          item.timestamp || null,
          item.visibility || null,
          nested.sensor_data_id || null,
          nested.pod_data_id || null,
          nested.sensor_type || null,
          toNumberOrNull(nested.reading_value),
          nested.reading_units || null,
          nested.reading_timestamp || null,
          nested.raw_data ?? null,
          nested.created_at || null,
        ]
      );
    }

    await client.query('COMMIT');

    return {
      importId: evaImport.id,
      evaPodId: evaImport.eva_pod_id,
      nickname: evaImport.nickname,
      readingsImported: readings.length,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}