const { fetchDepots, fetchVehicles } = require('./api');
const { solveKnapsack, solveForAllDepots } = require('./knapsack');
const { Log } = require('../logging_middleware');

async function runScheduler() {
  const startTime = Date.now();

  await Log(
    'backend', 'info', 'service',
    'Starting vehicle maintenance scheduler pipeline'
  );

  await Log('backend', 'info', 'service', 'Step 1/3: Fetching depot and vehicle data');

  let depots, vehicles;
  try {
    [depots, vehicles] = await Promise.all([fetchDepots(), fetchVehicles()]);
  } catch (error) {
    await Log(
      'backend', 'fatal', 'service',
      `Failed to fetch data from evaluation service: ${error.message}`
    );
    throw error;
  }

  await Log(
    'backend', 'debug', 'service',
    `Data fetched: ${depots.length} depots, ${vehicles.length} vehicles`
  );

  await Log('backend', 'info', 'service', 'Step 2/3: Running knapsack optimization for each depot');

  const schedules = [];
  for (const depot of depots) {
    const scheduleStart = Date.now();

    await Log(
      'backend', 'debug', 'service',
      `Solving knapsack for Depot ${depot.ID} (capacity: ${depot.MechanicHours}h, items: ${vehicles.length})`
    );

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

    await Log(
      'backend', 'info', 'service',
      `Depot ${depot.ID}: Selected ${result.selectedVehicles.length} vehicles, ` +
      `total impact=${result.totalImpact}, duration=${result.totalDuration}/${depot.MechanicHours}h, ` +
      `unused=${depot.MechanicHours - result.totalDuration}h (solved in ${scheduleTime}ms)`
    );
  }

  const totalOptimalImpact = schedules.reduce((sum, s) => sum + s.totalImpact, 0);
  const processingTimeMs = Date.now() - startTime;

  await Log(
    'backend', 'info', 'service',
    `Step 3/3: Scheduling complete. Total optimal impact across all depots: ${totalOptimalImpact}. ` +
    `Total processing time: ${processingTimeMs}ms`
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
