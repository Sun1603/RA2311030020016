require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const express = require('express');
const { Log, createExpressLogger } = require('../logging_middleware');
const { fetchDepots, fetchVehicles } = require('./api');
const { runScheduler } = require('./scheduler');

const app = express();
const PORT = process.env.SCHEDULER_PORT || 3001;

app.use(express.json());

app.use(createExpressLogger('backend', 'middleware'));

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'vehicle-maintenance-scheduler',
    timestamp: new Date().toISOString()
  });
});

app.get('/depots', async (req, res) => {
  try {
    await Log('backend', 'info', 'route', 'GET /depots — Fetching all depot data');
    const depots = await fetchDepots();

    await Log(
      'backend', 'info', 'controller',
      `Returning ${depots.length} depots to client`
    );

    res.json({
      success: true,
      count: depots.length,
      depots
    });
  } catch (error) {
    await Log(
      'backend', 'error', 'controller',
      `Failed to fetch depots: ${error.message}`
    );
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/vehicles', async (req, res) => {
  try {
    await Log('backend', 'info', 'route', 'GET /vehicles — Fetching all vehicle data');
    const vehicles = await fetchVehicles();

    await Log(
      'backend', 'info', 'controller',
      `Returning ${vehicles.length} vehicles to client`
    );

    res.json({
      success: true,
      count: vehicles.length,
      vehicles
    });
  } catch (error) {
    await Log(
      'backend', 'error', 'controller',
      `Failed to fetch vehicles: ${error.message}`
    );
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/schedule', async (req, res) => {
  try {
    await Log(
      'backend', 'info', 'route',
      'GET /schedule — Starting full scheduling optimization'
    );

    const result = await runScheduler();

    await Log(
      'backend', 'info', 'controller',
      `Schedule computed successfully. ${result.summary.totalDepots} depots, ` +
      `${result.summary.totalVehicles} vehicles, ` +
      `optimal impact: ${result.summary.totalOptimalImpact}, ` +
      `processing time: ${result.summary.processingTimeMs}ms`
    );

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    await Log(
      'backend', 'error', 'controller',
      `Scheduling pipeline failed: ${error.message}`
    );
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.use((req, res) => {
  Log(
    'backend', 'warn', 'route',
    `404 Not Found: ${req.method} ${req.originalUrl}`
  );
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

app.use((err, req, res, next) => {
  Log(
    'backend', 'error', 'handler',
    `Unhandled error in ${req.method} ${req.originalUrl}: ${err.message}`
  );
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

app.listen(PORT, async () => {
  console.log(`\n  🚗 Vehicle Maintenance Scheduler running at http://localhost:${PORT}\n`);
  console.log('  Available endpoints:');
  console.log(`    GET  http://localhost:${PORT}/health`);
  console.log(`    GET  http://localhost:${PORT}/depots`);
  console.log(`    GET  http://localhost:${PORT}/vehicles`);
  console.log(`    GET  http://localhost:${PORT}/schedule\n`);

  await Log(
    'backend', 'info', 'service',
    `Vehicle Maintenance Scheduler started on port ${PORT}`
  );
});
