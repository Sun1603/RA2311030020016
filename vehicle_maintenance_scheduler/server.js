// Load environment variables from root .env
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const express = require('express');
const { Log, createExpressLogger } = require('../logging_middleware');
const { fetchDepots, fetchVehicles } = require('./api');
const { runScheduler } = require('./scheduler');

const app = express();
const PORT = process.env.SCHEDULER_PORT || 3001;

app.use(express.json());
app.use(createExpressLogger('backend', 'middleware'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'vehicle-maintenance-scheduler', timestamp: new Date().toISOString() });
});

// Fetch all depots
app.get('/depots', async (req, res) => {
  try {
    await Log('backend', 'info', 'route', 'GET /depots');
    const depots = await fetchDepots();
    await Log('backend', 'info', 'controller', `Returning ${depots.length} depots`);
    res.json({ success: true, count: depots.length, depots });
  } catch (error) {
    await Log('backend', 'error', 'controller', `Depots failed: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Fetch all vehicles
app.get('/vehicles', async (req, res) => {
  try {
    await Log('backend', 'info', 'route', 'GET /vehicles');
    const vehicles = await fetchVehicles();
    await Log('backend', 'info', 'controller', `Returning ${vehicles.length} vehicles`);
    res.json({ success: true, count: vehicles.length, vehicles });
  } catch (error) {
    await Log('backend', 'error', 'controller', `Vehicles failed: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Run full scheduling optimization
app.get('/schedule', async (req, res) => {
  try {
    await Log('backend', 'info', 'route', 'GET /schedule');
    const result = await runScheduler();
    await Log('backend', 'info', 'controller', `Impact: ${result.summary.totalOptimalImpact}`);
    res.json({ success: true, ...result });
  } catch (error) {
    await Log('backend', 'error', 'controller', `Schedule failed: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 404 handler
app.use((req, res) => {
  Log('backend', 'warn', 'route', `404: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ success: false, error: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Global error handler
app.use((err, req, res, next) => {
  Log('backend', 'error', 'handler', `Unhandled: ${err.message}`);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// Start server
app.listen(PORT, async () => {
  console.log(`\n  Vehicle Maintenance Scheduler running at http://localhost:${PORT}\n`);
  console.log('  Endpoints:');
  console.log(`    GET  http://localhost:${PORT}/health`);
  console.log(`    GET  http://localhost:${PORT}/depots`);
  console.log(`    GET  http://localhost:${PORT}/vehicles`);
  console.log(`    GET  http://localhost:${PORT}/schedule\n`);
  await Log('backend', 'info', 'service', `Server started on port ${PORT}`);
});
