import { Router } from 'express';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import {
  evaLogin,
  saveEvaConnectionForUser,
  getEvaConnectionForUser
} from '../services/evaAuth.js';
import { importEvaPodForUser } from '../services/evaImportService.js';
const router = Router();

router.use(authenticateToken);

// POST /api/eva/connect
router.post('/connect', async (req, res, next) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: 'EVA email and password are required' });
  }

  try {
    const evaAuth = await evaLogin(email, password);

    const saved = await saveEvaConnectionForUser({
      userId: req.user.id,
      evaUserId: evaAuth.user?.id || null,
      evaEmail: evaAuth.user?.email || email,
      evaUsername: evaAuth.user?.username || null,
      accessToken: evaAuth.accessToken,
      refreshToken: evaAuth.refreshToken,
    });

    res.status(201).json({
      message: 'EVA account connected successfully',
      connection: {
        id: saved.id,
        eva_email: saved.eva_email,
        eva_username: saved.eva_username,
        created_at: saved.created_at,
        token_updated_at: saved.token_updated_at,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/eva/connection
router.get('/connection', async (req, res, next) => {
  try {
    const account = await getEvaConnectionForUser(req.user.id);

    if (!account) {
      return res.status(404).json({ error: 'No EVA account connected' });
    }

    res.json({
      id: account.id,
      eva_user_id: account.eva_user_id,
      eva_email: account.eva_email,
      eva_username: account.eva_username,
      token_updated_at: account.token_updated_at,
      created_at: account.created_at,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/eva/import/pods/:podId
router.post('/import/pods/:podId', async (req, res, next) => {
  const { podId } = req.params;

  if (!podId) {
    return res.status(400).json({ error: 'Missing podId' });
  }

  try {
    const result = await importEvaPodForUser({
      userId: req.user.id,
      podId,
    });

    res.status(201).json({
      message: 'EVA pod imported successfully',
      importId: result.importId,
      evaPodId: result.evaPodId,
      nickname: result.nickname,
      readingsImported: result.readingsImported,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/eva/imports
router.get('/imports', async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT *
       FROM eva_pod_imports
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/eva/imports/:id/readings
router.get('/imports/:id/readings', async (req, res, next) => {
  try {
    const ownerCheck = await pool.query(
      `SELECT id
       FROM eva_pod_imports
       WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );

    if (ownerCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Import not found' });
    }

    const result = await pool.query(
      `SELECT *
       FROM eva_pod_readings
       WHERE eva_import_id = $1
       ORDER BY reading_timestamp ASC, id ASC`,
      [req.params.id]
    );

    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

export default router;