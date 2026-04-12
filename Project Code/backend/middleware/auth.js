// middleware/auth.js
import pool from '../db.js';

/**
 * requireAuth
 * Validates the session cookie and attaches req.user_id to the request.
 * Returns 401 if not logged in or session is invalid/expired.
 */
export async function requireAuth(req, res, next) {
  const session_id = req.cookies.session_id;

  if (!session_id) {
    return res.status(401).json({ error: 'Not logged in' });
  }

  try {
    const result = await pool.query(
      `SELECT user_id FROM session_info WHERE session_id = $1 AND expires_at > NOW()`,
      [session_id]
    );

    if (result.rows.length < 1) {
      res.clearCookie('session_id');
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    req.user_id = result.rows[0].user_id;
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * requireAdmin
 * Must be used AFTER requireAuth.
 * Returns 403 if the authenticated user does not have the 'admin' role.
 */
export async function requireAdmin(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT role FROM users WHERE id = $1`,
      [req.user_id]
    );

    if (result.rows.length < 1 || result.rows[0].role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: admin access required' });
    }

    next();
  } catch (err) {
    next(err);
  }
}

/**
 * requireOrgOwner
 * Must be used AFTER requireAuth.
 * Expects req.params.id to be the org id.
 * Returns 403 if the authenticated user is not the owner of the org.
 */
export async function requireOrgOwner(req, res, next) {
  const org_id = req.params.id;

  try {
    const result = await pool.query(
      `SELECT id FROM organizations WHERE id = $1 AND owner_user_id = $2`,
      [org_id, req.user_id]
    );

    if (result.rows.length < 1) {
      return res.status(403).json({ error: 'Forbidden: you do not own this organization' });
    }

    next();
  } 
  catch (err) {
    next(err);
  }
}