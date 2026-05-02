const fetch = require('node-fetch');

const AUTH_URL = 'http://20.207.122.201/evaluation-service/auth';

let cachedToken = null;
let tokenExpiresAt = 0;

async function getAuthToken() {
  const now = Date.now();

  if (cachedToken && now < tokenExpiresAt - 60000) {
    return cachedToken;
  }

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

    cachedToken = data.access_token;

    const expiresInMs = (data.expires_in || 3600) * 1000;
    tokenExpiresAt = now + expiresInMs;

    return cachedToken;
  } catch (error) {
    cachedToken = null;
    tokenExpiresAt = 0;
    throw error;
  }
}

function clearTokenCache() {
  cachedToken = null;
  tokenExpiresAt = 0;
}

module.exports = { getAuthToken, clearTokenCache };
