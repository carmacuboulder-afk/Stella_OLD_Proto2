// routes/orgs.js
import { Router } from 'express';
import pool from '../db.js';
import { requireAuth, requireOrgOwner } from '../middleware/auth.js';

const router = Router();

// Apply requireAuth to all org routes
router.use(requireAuth);


// POST /api/orgs/create
router.post('/create', async (req, res, next) => {
  const { name, description } = req.body;

  if (!name?.trim()) {
    return res.status(400).json({ error: 'Organization name is required' });
  }

  try {
    // Check user doesn't already own an org
    const existingOrg = await pool.query(
      `SELECT id FROM organizations WHERE owner_user_id = $1`,
      [req.user_id]
    );
    if (existingOrg.rows.length > 0) {
      return res.status(409).json({ error: 'You already own an organization' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const orgResult = await client.query(
        `INSERT INTO organizations (name, description, owner_user_id)
         VALUES ($1, $2, $3)
         RETURNING id, name, description, owner_user_id, created_at`,
        [name.trim(), description?.trim() || null, req.user_id]
      );
      const newOrg = orgResult.rows[0];

      // Set owned_org_id on the user
      await client.query(
        `UPDATE users SET owned_org_id = $1 WHERE id = $2`,
        [newOrg.id, req.user_id]
      );

      // Owner is automatically an accepted member
      await client.query(
        `INSERT INTO user_organizations (user_id, organization_id, status, joined_at)
         VALUES ($1, $2, 'accepted', NOW())`,
        [req.user_id, newOrg.id]
      );

      await client.query('COMMIT');
      return res.status(201).json(newOrg);
    } catch (err) {
      await client.query('ROLLBACK');
      if (err.code === '23505') {
        return res.status(409).json({ error: 'Organization name already exists' });
      }
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    next(err);
  }
});


// GET /api/orgs/search?name=
router.get('/search', async (req, res, next) => {
  const { name } = req.query;

  if (!name?.trim()) {
    return res.status(400).json({ error: 'Search query required' });
  }

  try {
    const result = await pool.query(
      `SELECT o.id, o.name, o.description,
              u.username AS owner_username,
              COUNT(CASE WHEN uo.status = 'accepted' THEN 1 END) AS member_count
       FROM organizations o
       LEFT JOIN users u ON u.id = o.owner_user_id
       LEFT JOIN user_organizations uo ON uo.organization_id = o.id
       WHERE o.name ILIKE $1
       AND o.id NOT IN (
         SELECT organization_id FROM user_organizations
         WHERE user_id = $2
       )
       GROUP BY o.id, u.username
       LIMIT 10`,
      [`%${name.trim()}%`, req.user_id]
    );
    return res.status(200).json(result.rows);
  } catch (err) {
    next(err);
  }
});


// GET /api/orgs/:id
router.get('/:id', async (req, res, next) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT o.id, o.name, o.description, o.created_at,
              u.username AS owner_username
       FROM organizations o
       LEFT JOIN users u ON u.id = o.owner_user_id
       WHERE o.id = $1`,
      [id]
    );

    if (result.rows.length < 1) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    return res.status(200).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});


// GET /api/orgs/:id/manage  (owner only)
router.get('/:id/manage', requireOrgOwner, async (req, res, next) => {
  const { id } = req.params;

  try {
    const [orgResult, membersResult, pendingResult] = await Promise.all([
      pool.query(
        `SELECT id, name, description, created_at, owner_user_id FROM organizations WHERE id = $1`,
        [id]
      ),
      pool.query(
        `SELECT u.id, u.username, u.email, uo.joined_at
         FROM users u
         JOIN user_organizations uo ON uo.user_id = u.id
         WHERE uo.organization_id = $1 AND uo.status = 'accepted'
         ORDER BY uo.joined_at ASC`,
        [id]
      ),
      pool.query(
        `SELECT u.id, u.username, u.email, uo.requested_at
         FROM users u
         JOIN user_organizations uo ON uo.user_id = u.id
         WHERE uo.organization_id = $1 AND uo.status = 'pending'
         ORDER BY uo.requested_at ASC`,
        [id]
      ),
    ]);

    return res.status(200).json({
      org: orgResult.rows[0],
      members: membersResult.rows,
      pending: pendingResult.rows,
    });
  } catch (err) {
    next(err);
  }
});


// POST /api/orgs/:id/request
router.post('/:id/request', async (req, res, next) => {
  const { id } = req.params;

  try {
    const orgResult = await pool.query(
      `SELECT id, owner_user_id FROM organizations WHERE id = $1`,
      [id]
    );
    if (orgResult.rows.length < 1) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    // Owner cannot request to join their own org
    if (orgResult.rows[0].owner_user_id === req.user_id) {
      return res.status(400).json({ error: 'You are the owner of this organization' });
    }

    // Check for existing request or membership
    const existing = await pool.query(
      `SELECT status FROM user_organizations
       WHERE user_id = $1 AND organization_id = $2`,
      [req.user_id, id]
    );
    if (existing.rows.length > 0) {
      const status = existing.rows[0].status;
      return res.status(409).json({
        error: status === 'accepted'
          ? 'You are already a member of this organization'
          : 'You already have a pending request for this organization',
      });
    }

    await pool.query(
      `INSERT INTO user_organizations (user_id, organization_id, status)
       VALUES ($1, $2, 'pending')`,
      [req.user_id, id]
    );

    return res.status(200).json({ message: 'Join request sent' });
  } catch (err) {
    next(err);
  }
});


// POST /api/orgs/:id/accept/:userId  (owner only)
router.post('/:id/accept/:userId', requireOrgOwner, async (req, res, next) => {
  const { id, userId } = req.params;

  try {
    const result = await pool.query(
      `UPDATE user_organizations
       SET status = 'accepted', joined_at = NOW()
       WHERE user_id = $1 AND organization_id = $2 AND status = 'pending'
       RETURNING *`,
      [userId, id]
    );

    if (result.rows.length < 1) {
      return res.status(404).json({ error: 'No pending request found for this user' });
    }

    return res.status(200).json({ message: 'Request accepted' });
  } catch (err) {
    next(err);
  }
});


// POST /api/orgs/:id/deny/:userId  (owner only)
router.post('/:id/deny/:userId', requireOrgOwner, async (req, res, next) => {
  const { id, userId } = req.params;

  try {
    const result = await pool.query(
      `DELETE FROM user_organizations
       WHERE user_id = $1 AND organization_id = $2 AND status = 'pending'
       RETURNING *`,
      [userId, id]
    );

    if (result.rows.length < 1) {
      return res.status(404).json({ error: 'No pending request found for this user' });
    }

    return res.status(200).json({ message: 'Request denied' });
  } catch (err) {
    next(err);
  }
});


// DELETE /api/orgs/:id/remove/:userId  (owner only)
router.delete('/:id/remove/:userId', requireOrgOwner, async (req, res, next) => {
  const { id, userId } = req.params;

  // Owner cannot remove themselves
  if (parseInt(userId) === req.user_id) {
    return res.status(400).json({
      error: 'Owner cannot remove themselves. Transfer ownership or delete the org instead.',
    });
  }

  try {
    const result = await pool.query(
      `DELETE FROM user_organizations
       WHERE user_id = $1 AND organization_id = $2 AND status = 'accepted'
       RETURNING *`,
      [userId, id]
    );

    if (result.rows.length < 1) {
      return res.status(404).json({ error: 'Member not found' });
    }

    return res.status(200).json({ message: 'Member removed' });
  } catch (err) {
    next(err);
  }
});


// PUT /api/orgs/:id/edit  (owner only)
router.put('/:id/edit', requireOrgOwner, async (req, res, next) => {
  const { id } = req.params;
  const { name, description } = req.body;

  if (!name?.trim()) {
    return res.status(400).json({ error: 'Organization name is required' });
  }

  try {
    const result = await pool.query(
      `UPDATE organizations SET name = $1, description = $2
       WHERE id = $3
       RETURNING id, name, description`,
      [name.trim(), description?.trim() || null, id]
    );

    return res.status(200).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Organization name already exists' });
    }
    next(err);
  }
});


// PUT /api/orgs/:id/transfer/:userId  (owner only)
router.put('/:id/transfer/:userId', requireOrgOwner, async (req, res, next) => {
  const { id, userId } = req.params;

  try {
    // New owner must be an accepted member
    const memberCheck = await pool.query(
      `SELECT user_id FROM user_organizations
       WHERE user_id = $1 AND organization_id = $2 AND status = 'accepted'`,
      [userId, id]
    );
    if (memberCheck.rows.length < 1) {
      return res.status(400).json({ error: 'User is not an accepted member of this organization' });
    }

    // New owner must not already own an org
    const ownerCheck = await pool.query(
      `SELECT owned_org_id FROM users WHERE id = $1`,
      [userId]
    );
    if (ownerCheck.rows[0].owned_org_id !== null) {
      return res.status(409).json({ error: 'That user already owns an organization' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      await client.query(
        `UPDATE organizations SET owner_user_id = $1 WHERE id = $2`,
        [userId, id]
      );
      await client.query(
        `UPDATE users SET owned_org_id = NULL WHERE id = $1`,
        [req.user_id]
      );
      await client.query(
        `UPDATE users SET owned_org_id = $1 WHERE id = $2`,
        [id, userId]
      );

      await client.query('COMMIT');
      return res.status(200).json({ message: 'Ownership transferred' });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    next(err);
  }
});


// DELETE /api/orgs/:id  (owner only)
router.delete('/:id', requireOrgOwner, async (req, res, next) => {
  const { id } = req.params;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      `UPDATE users SET owned_org_id = NULL WHERE id = $1`,
      [req.user_id]
    );
    // ON DELETE CASCADE handles user_organizations cleanup
    await client.query(`DELETE FROM organizations WHERE id = $1`, [id]);

    await client.query('COMMIT');
    return res.status(200).json({ message: 'Organization deleted' });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});


export default router;