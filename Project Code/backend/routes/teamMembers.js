// routes/teamMembers.js
import { Router } from 'express';
import pool from '../db.js';

const router = Router();

// GET /api/team-members/:teamId
router.get('/:teamId', async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.username, tm.is_admin, tm.joined_at
       FROM team_members tm
       JOIN users u ON u.id = tm.user_id
       WHERE tm.team_id = $1`,
      [req.params.teamId]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// POST /api/team-members/add
router.post('/add', async (req, res, next) => {
  const { teamId, userId, isAdmin } = req.body;

  if (!teamId || !userId) {
    return res.status(400).json({ error: 'Missing teamId or userId' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO team_members(team_id, user_id, is_admin)
       VALUES ($1, $2, $3)
       RETURNING team_id, user_id, is_admin, joined_at`,
      [teamId, userId, isAdmin || false]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/team-members/admin
router.patch('/admin', async (req, res, next) => {
  const { teamId, userId, isAdmin } = req.body;

  try {
    const result = await pool.query(
      `UPDATE team_members
       SET is_admin = $3
       WHERE team_id = $1 AND user_id = $2
       RETURNING team_id, user_id, is_admin`,
      [teamId, userId, isAdmin]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Membership not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/team-members/remove
router.delete('/remove', async (req, res, next) => {
  const { teamId, userId } = req.body;

  try {
    const result = await pool.query(
      `DELETE FROM team_members
       WHERE team_id = $1 AND user_id = $2`,
      [teamId, userId]
    );
    res.json({ removed: result.rowCount > 0 });
  } catch (err) {
    next(err);
  }
});

export default router;