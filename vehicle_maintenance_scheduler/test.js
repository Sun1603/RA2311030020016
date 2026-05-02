const { solveKnapsack, solveForAllDepots } = require('./knapsack');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (error) {
    console.log(`  ❌ ${name}: ${error.message}`);
    failed++;
  }
}

function assertEqual(actual, expected, label = '') {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${label} Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

console.log('\n🧪 Knapsack Algorithm Tests\n');

test('Empty vehicles list returns empty result', () => {
  const result = solveKnapsack([], 100);
  assertEqual(result.totalImpact, 0);
  assertEqual(result.selectedVehicles.length, 0);
  assertEqual(result.totalDuration, 0);
});

test('Zero capacity returns empty result', () => {
  const vehicles = [{ TaskID: 'a', Duration: 5, Impact: 10 }];
  const result = solveKnapsack(vehicles, 0);
  assertEqual(result.totalImpact, 0);
  assertEqual(result.selectedVehicles.length, 0);
});

test('Single item that fits', () => {
  const vehicles = [{ TaskID: 'a', Duration: 3, Impact: 7 }];
  const result = solveKnapsack(vehicles, 5);
  assertEqual(result.totalImpact, 7);
  assertEqual(result.selectedVehicles.length, 1);
  assertEqual(result.totalDuration, 3);
});

test('Single item that does not fit', () => {
  const vehicles = [{ TaskID: 'a', Duration: 10, Impact: 100 }];
  const result = solveKnapsack(vehicles, 5);
  assertEqual(result.totalImpact, 0);
  assertEqual(result.selectedVehicles.length, 0);
});

test('Classic knapsack — selects optimal subset', () => {
  const vehicles = [
    { TaskID: '1', Duration: 2, Impact: 3 },
    { TaskID: '2', Duration: 3, Impact: 4 },
    { TaskID: '3', Duration: 4, Impact: 5 },
    { TaskID: '4', Duration: 5, Impact: 6 }
  ];
  const result = solveKnapsack(vehicles, 5);
  assertEqual(result.totalImpact, 7);
  assertEqual(result.totalDuration, 5);
});

test('All items fit within capacity', () => {
  const vehicles = [
    { TaskID: '1', Duration: 1, Impact: 5 },
    { TaskID: '2', Duration: 2, Impact: 3 },
    { TaskID: '3', Duration: 1, Impact: 4 }
  ];
  const result = solveKnapsack(vehicles, 10);
  assertEqual(result.totalImpact, 12);
  assertEqual(result.selectedVehicles.length, 3);
  assertEqual(result.totalDuration, 4);
});

test('DP beats greedy — highest ratio item is not optimal', () => {
  const vehicles = [
    { TaskID: '1', Duration: 1, Impact: 1 },
    { TaskID: '2', Duration: 10, Impact: 9 },
    { TaskID: '3', Duration: 10, Impact: 9 }
  ];
  const result = solveKnapsack(vehicles, 20);
  assertEqual(result.totalImpact, 18);
});

test('Multi-depot solver returns correct results per depot', () => {
  const depots = [
    { ID: 1, MechanicHours: 5 },
    { ID: 2, MechanicHours: 10 }
  ];
  const vehicles = [
    { TaskID: '1', Duration: 2, Impact: 3 },
    { TaskID: '2', Duration: 3, Impact: 4 },
    { TaskID: '3', Duration: 4, Impact: 5 },
    { TaskID: '4', Duration: 5, Impact: 6 }
  ];
  const results = solveForAllDepots(depots, vehicles);
  assertEqual(results.length, 2);
  assertEqual(results[0].depotId, 1);
  assertEqual(results[0].schedule.totalImpact, 7);
  assertEqual(results[1].depotId, 2);
  assertEqual(results[1].schedule.totalImpact, 13);
});

console.log(`\n  ${passed} passed, ${failed} failed, ${passed + failed} total\n`);
process.exit(failed > 0 ? 1 : 0);
