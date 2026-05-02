const { fetchDepots, fetchVehicles } = require('./api');
const { solveKnapsack, solveForAllDepots } = require('./knapsack');
const { Log } = require('../logging_middleware');

// Runs the full scheduling pipeline:
// 1. Fetch depots and vehicles from the evaluation API
// 2. Solve the 0/1 knapsack for each depot
// 3. Return the complete schedule with summary stats
async function runScheduler() {
  const startTime = Date.now();

  await Log('backend', 'info', 'service', 'Starting scheduler pipeline');

  // Step 1: Fetch data from both endpoints in parallel
  await Log('backend', 'info', 'service', 'Fetching depot and vehicle data');

  let depots, vehicles;
  try {
    [depots, vehicles] = await Promise.all([fetchDepots(), fetchVehicles()]);
  } catch (error) {
    await Log('backend', 'fatal', 'service', `Data fetch failed: ${error.message}`);
    throw error;
  }

  await Log('backend', 'debug', 'service', `Got ${depots.length} depots, ${vehicles.length} vehicles`);

  // Step 2: Solve knapsack for each depot
  await Log('backend', 'info', 'service', 'Running knapsack optimization');

  const schedules = [];
  for (const depot of depots) {
    const scheduleStart = Date.now();

    await Log('backend', 'debug', 'service', `Solving for Depot ${depot.ID}`);

    const result = solveKnapsack(vehicles, depot.MechanicHours);
    const scheduleTime = Date.now() - scheduleStart;

    schedules.push({
      depotId: depot.ID,
      mechanicHours: depot.MechanicHours,
      selectedVehicles: result.selectedVehicles,
      totalImpact: result.totalImpact,
      totalDuration: result.totalDuration,
      unusedHours: depot.MechanicHours - result.totalDuration,
      vehicleCount: result.selectedVehicles.length,
      processingTimeMs: scheduleTime
    });

    await Log('backend', 'info', 'service',
      `Depot ${depot.ID}: impact=${result.totalImpact}`
    );
  }

  // Step 3: Build summary
  const totalOptimalImpact = schedules.reduce((sum, s) => sum + s.totalImpact, 0);
  const processingTimeMs = Date.now() - startTime;

  await Log('backend', 'info', 'service',
    `Done. Total impact: ${totalOptimalImpact}`
  );

  return {
    depots,
    vehicles,
    schedules,
    summary: {
      totalDepots: depots.length,
      totalVehicles: vehicles.length,
      totalOptimalImpact,
      processingTimeMs
    }
  };
}

module.exports = { runScheduler };
