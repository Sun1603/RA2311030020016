function solveKnapsack(vehicles, capacity) {
  const n = vehicles.length;

  if (n === 0 || capacity <= 0) {
    return {
      selectedVehicles: [],
      totalImpact: 0,
      totalDuration: 0,
      capacity
    };
  }

  const dp = Array.from({ length: n + 1 }, () =>
    new Array(capacity + 1).fill(0)
  );

  for (let i = 1; i <= n; i++) {
    const vehicle = vehicles[i - 1];
    const weight = vehicle.Duration;
    const value = vehicle.Impact;

    for (let w = 0; w <= capacity; w++) {
      dp[i][w] = dp[i - 1][w];

      if (weight <= w) {
        const includeValue = dp[i - 1][w - weight] + value;
        if (includeValue > dp[i][w]) {
          dp[i][w] = includeValue;
        }
      }
    }
  }

  const selectedVehicles = [];
  let remainingCapacity = capacity;

  for (let i = n; i > 0; i--) {
    if (dp[i][remainingCapacity] !== dp[i - 1][remainingCapacity]) {
      selectedVehicles.push(vehicles[i - 1]);
      remainingCapacity -= vehicles[i - 1].Duration;
    }
  }

  selectedVehicles.reverse();

  const totalImpact = dp[n][capacity];
  const totalDuration = selectedVehicles.reduce((sum, v) => sum + v.Duration, 0);

  return {
    selectedVehicles,
    totalImpact,
    totalDuration,
    capacity
  };
}

function solveForAllDepots(depots, vehicles) {
  return depots.map(depot => {
    const schedule = solveKnapsack(vehicles, depot.MechanicHours);
    return {
      depotId: depot.ID,
      mechanicHours: depot.MechanicHours,
      schedule
    };
  });
}

module.exports = { solveKnapsack, solveForAllDepots };
