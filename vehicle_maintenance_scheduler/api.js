const fetch = require('node-fetch');
const { getAuthToken } = require('../logging_middleware/auth');
const { Log } = require('../logging_middleware');

const BASE_URL = 'http://20.207.122.201/evaluation-service';

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

async function fetchDepots() {
  await Log('backend', 'info', 'service', 'Fetching depot data from evaluation service');

  const data = await authenticatedGet('/depots');

  if (!data.depots || !Array.isArray(data.depots)) {
    throw new Error('Invalid depots response: expected { depots: [...] }');
  }

  await Log(
    'backend',
    'info',
    'service',
    `Successfully fetched ${data.depots.length} depots. ` +
    `Total mechanic-hours available: ${data.depots.reduce((sum, d) => sum + d.MechanicHours, 0)}`
  );

  return data.depots;
}

async function fetchVehicles() {
  await Log('backend', 'info', 'service', 'Fetching vehicle data from evaluation service');

  const data = await authenticatedGet('/vehicles');

  if (!data.vehicles || !Array.isArray(data.vehicles)) {
    throw new Error('Invalid vehicles response: expected { vehicles: [...] }');
  }

  const totalDuration = data.vehicles.reduce((sum, v) => sum + v.Duration, 0);
  const totalImpact = data.vehicles.reduce((sum, v) => sum + v.Impact, 0);

  await Log(
    'backend',
    'info',
    'service',
    `Successfully fetched ${data.vehicles.length} vehicles. ` +
    `Total duration: ${totalDuration}h, Total impact: ${totalImpact}`
  );

  return data.vehicles;
}

module.exports = { fetchDepots, fetchVehicles, authenticatedGet };
