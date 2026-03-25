import pool from '../db.js';

const EVA_BASE_URL = process.env.EVA_BASE_URL;

function getBaseUrl() {
  if (!EVA_BASE_URL) {
    throw new Error('EVA_BASE_URL is not set');
  }
  return EVA_BASE_URL.replace(/\/$/, '');
}

export async function evaLogin(email, password) {
  const response = await fetch(`${getBaseUrl()}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`EVA login failed (${response.status}): ${text}`);
  }

  return response.json();
}

export async function evaRefresh(refreshToken) {
  const response = await fetch(`${getBaseUrl()}/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`EVA refresh failed (${response.status}): ${text}`);
  }

  return response.json();
}

export async function saveEvaConnectionForUser({
  userId,
  evaUserId,
  evaEmail,
  evaUsername,
  accessToken,
  refreshToken,
}) {
  const result = await pool.query(
    `INSERT INTO user_eva_accounts (
       user_id,
       eva_user_id,
       eva_email,
       eva_username,
       eva_access_token,
       eva_refresh_token,
       token_updated_at
     )
     VALUES ($1, $2, $3, $4, $5, $6, NOW())
     ON CONFLICT (user_id)
     DO UPDATE SET
       eva_user_id = EXCLUDED.eva_user_id,
       eva_email = EXCLUDED.eva_email,
       eva_username = EXCLUDED.eva_username,
       eva_access_token = EXCLUDED.eva_access_token,
       eva_refresh_token = EXCLUDED.eva_refresh_token,
       token_updated_at = NOW()
     RETURNING *`,
    [userId, evaUserId || null, evaEmail, evaUsername || null, accessToken || null, refreshToken]
  );

  return result.rows[0];
}

export async function getEvaConnectionForUser(userId) {
  const result = await pool.query(
    `SELECT *
     FROM user_eva_accounts
     WHERE user_id = $1`,
    [userId]
  );

  return result.rows[0] || null;
}

export async function refreshEvaConnectionForUser(userId) {
  const account = await getEvaConnectionForUser(userId);

  if (!account) {
    throw new Error('No EVA account connected for this user');
  }

  const refreshed = await evaRefresh(account.eva_refresh_token);

  const updated = await saveEvaConnectionForUser({
    userId,
    evaUserId: account.eva_user_id,
    evaEmail: account.eva_email,
    evaUsername: account.eva_username,
    accessToken: refreshed.accessToken,
    refreshToken: refreshed.refreshToken,
  });

  return updated;
}