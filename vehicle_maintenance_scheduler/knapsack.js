// 0/1 Knapsack solver using bottom-up dynamic programming
// No external libraries — pure algorithmic implementation
//
// Time Complexity:  O(n × W) where n = items, W = capacity
// Space Complexity: O(n × W) for the DP table (needed for backtracking)

// Solves the 0/1 knapsack for a single depot
// vehicles: array of { TaskID, Duration, Impact }
// capacity: max mechanic-hours available
// Returns: { selectedVehicles, totalImpact, totalDuration, capacity }
function solveKnapsack(vehicles, capacity) {
  const n = vehicles.length;

  // Edge case: nothing to schedule
  if (n === 0 || capacity <= 0) {
    return {
      selectedVehicles: [],
      totalImpact: 0,
      totalDuration: 0,
      capacity
    };
  }

  // Build the DP table
  // dp[i][w] = max impact using first i vehicles with capacity w
  const dp = Array.from({ length: n + 1 }, () =>
    new Array(capacity + 1).fill(0)
  );

  for (let i = 1; i <= n; i++) {
    const vehicle = vehicles[i - 1];
    const weight = vehicle.Duration;  // duration acts as the "weight"
    const value = vehicle.Impact;     // impact acts as the "value"

    for (let w = 0; w <= capacity; w++) {
      // Option 1: skip this vehicle
      dp[i][w] = dp[i - 1][w];

      // Option 2: include this vehicle (if it fits)
      if (weight <= w) {
        const includeValue = dp[i - 1][w - weight] + value;
        if (includeValue > dp[i][w]) {
          dp[i][w] = includeValue;
        }
      }
    }
  }

  // Backtrack through the DP table to find which vehicles were selected
  const selectedVehicles = [];
  let remainingCapacity = capacity;

  for (let i = n; i > 0; i--) {
    if (dp[i][remainingCapacity] !== dp[i - 1][remainingCapacity]) {
      selectedVehicles.push(vehicles[i - 1]);
      remainingCapacity -= vehicles[i - 1].Duration;
    }
  }

  // Reverse to maintain original order
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

// Solves the knapsack independently for each depot
// Each depot gets its own optimal vehicle selection based on its budget
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
