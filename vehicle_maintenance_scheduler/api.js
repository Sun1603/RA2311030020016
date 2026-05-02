const fetch = require('node-fetch');
const { getAuthToken } = require('../logging_middleware/auth');
const { Log } = require('../logging_middleware');

const BASE_URL = 'http://20.207.122.201/evaluation-service';

// Makes an authenticated GET request to the evaluation service
async function authenticatedGet(endpoint) {
  const url = `${BASE_URL}${endpoint}`;

  try {
    const token = await getAuthToken();

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GET ${endpoint} failed (${response.status}): ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    await Log('backend', 'error', 'service', `API call failed for ${endpoint}: ${error.message}`);
    throw error;
  }
}

// Fetches all depots — each has an ID and a MechanicHours budget
async function fetchDepots() {
  await Log('backend', 'info', 'service', 'Fetching depot data');

  const data = await authenticatedGet('/depots');

  if (!data.depots || !Array.isArray(data.depots)) {
    throw new Error('Invalid depots response: expected { depots: [...] }');
  }

  await Log(
    'backend', 'info', 'service',
    `Fetched ${data.depots.length} depots`
  );

  return data.depots;
}

// Fetches all vehicle maintenance tasks — each has TaskID, Duration, Impact
async function fetchVehicles() {
  await Log('backend', 'info', 'service', 'Fetching vehicle data');

  const data = await authenticatedGet('/vehicles');

  if (!data.vehicles || !Array.isArray(data.vehicles)) {
    throw new Error('Invalid vehicles response: expected { vehicles: [...] }');
  }

  const totalDuration = data.vehicles.reduce((sum, v) => sum + v.Duration, 0);
  const totalImpact = data.vehicles.reduce((sum, v) => sum + v.Impact, 0);

  await Log(
    'backend', 'info', 'service',
    `Fetched ${data.vehicles.length} vehicles`
  );

  return data.vehicles;
}

module.exports = { fetchDepots, fetchVehicles, authenticatedGet };
