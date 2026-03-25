import {
  getEvaConnectionForUser,
  refreshEvaConnectionForUser
} from './evaAuth.js';

const EVA_BASE_URL = process.env.EVA_BASE_URL;

function getBaseUrl() {
  if (!EVA_BASE_URL) {
    throw new Error('EVA_BASE_URL is not set');
  }
  return EVA_BASE_URL.replace(/\/$/, '');
}

async function evaFetchForUser(userId, path) {
  let account = await getEvaConnectionForUser(userId);

  if (!account) {
    throw new Error('No EVA account connected for this user');
  }

  let response = await fetch(`${getBaseUrl()}${path}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${account.eva_access_token}`,
    },
  });

  if (response.status === 401) {
    account = await refreshEvaConnectionForUser(userId);

    response = await fetch(`${getBaseUrl()}${path}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${account.eva_access_token}`,
      },
    });
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`EVA request failed (${response.status}): ${text}`);
  }

  return response.json();
}

export async function getEvaPodDataForUser(userId, podId) {
  return evaFetchForUser(userId, `/pods/${encodeURIComponent(podId)}/data`);
}