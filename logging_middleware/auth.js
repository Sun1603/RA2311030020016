const fetch = require('node-fetch');

const AUTH_URL = 'http://20.207.122.201/evaluation-service/auth';

// Token cache — stores the current token and its expiry time
let cachedToken = null;
let tokenExpiresAt = 0;

// Fetches a valid auth token, refreshing if expired or not yet obtained
// Requires CLIENT_ID, CLIENT_SECRET, EMAIL, NAME, ROLL_NO, ACCESS_CODE in env
async function getAuthToken() {
  const now = Date.now();

  // Return cached token if still valid (with 60s buffer before expiry)
  if (cachedToken && now < tokenExpiresAt - 60000) {
    return cachedToken;
  }

  // Check that all required env vars are present
  const requiredVars = ['CLIENT_ID', 'CLIENT_SECRET', 'EMAIL', 'NAME', 'ROLL_NO', 'ACCESS_CODE'];
  const missing = requiredVars.filter(v => !process.env[v]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables for auth: ${missing.join(', ')}. ` +
      'Please set them in your .env file.'
    );
  }

  const requestBody = {
    email: process.env.EMAIL,
    name: process.env.NAME,
    rollNo: process.env.ROLL_NO,
    accessCode: process.env.ACCESS_CODE,
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET
  };

  try {
    const response = await fetch(AUTH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Auth failed (${response.status}): ${errorText}`);
    }

    const data = await response.json();

    if (!data.access_token) {
      throw new Error('Auth response missing access_token field');
    }

    // Cache the token and set expiry (default 1 hour if not provided)
    cachedToken = data.access_token;
    const expiresInMs = (data.expires_in || 3600) * 1000;
    tokenExpiresAt = now + expiresInMs;

    return cachedToken;
  } catch (error) {
    // Reset cache on failure so next call retries fresh
    cachedToken = null;
    tokenExpiresAt = 0;
    throw error;
  }
}

// Clears the cached token, forcing a fresh fetch on next call
function clearTokenCache() {
  cachedToken = null;
  tokenExpiresAt = 0;
}

module.exports = { getAuthToken, clearTokenCache };
