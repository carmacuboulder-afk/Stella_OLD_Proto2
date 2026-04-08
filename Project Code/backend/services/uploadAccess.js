import pool from '../db.js';

export const normalizeOrgId = (value) => {
  if (value === undefined || value === null || value === '') return null;

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

export async function assertOrganizationMembership(userId, orgId, client = pool) {
  const normalizedOrgId = normalizeOrgId(orgId);

  if (normalizedOrgId === null) {
    return { ok: true, orgId: null };
  }

  const membershipResult = await client.query(
    `SELECT o.id, o.name
     FROM organizations o
     JOIN user_organizations uo
       ON uo.organization_id = o.id
     WHERE o.id = $1
       AND uo.user_id = $2
       AND uo.status = 'accepted'
     LIMIT 1`,
    [normalizedOrgId, userId]
  );

  if (membershipResult.rows.length === 0) {
    return { ok: false, orgId: normalizedOrgId };
  }

  return {
    ok: true,
    orgId: normalizedOrgId,
    organization: membershipResult.rows[0],
  };
}

export async function getUploadPermissionsById(uploadId, userId, client = pool) {
  const result = await client.query(
    `SELECT
       u.*,
       o.owner_user_id,
       CASE WHEN u.org_id IS NULL THEN 'user' ELSE 'organization' END AS scope_type,
       CASE WHEN u.org_id IS NULL THEN 'My Uploads' ELSE o.name END AS scope_label,
       (
         (u.org_id IS NULL AND u.user_id = $2)
         OR EXISTS (
           SELECT 1
           FROM user_organizations uo
           WHERE uo.organization_id = u.org_id
             AND uo.user_id = $2
             AND uo.status = 'accepted'
         )
       ) AS can_access,
       (u.user_id = $2) AS can_delete,
       (u.org_id IS NOT NULL AND o.owner_user_id = $2) AS can_remove_from_org
     FROM uploads u
     LEFT JOIN organizations o ON o.id = u.org_id
     WHERE u.id = $1
     LIMIT 1`,
    [uploadId, userId]
  );

  return result.rows[0] ?? null;
}

export async function getAccessibleUploadById(uploadId, userId, client = pool) {
  const upload = await getUploadPermissionsById(uploadId, userId, client);

  if (!upload?.can_access) {
    return null;
  }

  return upload;
}
