# Backend Track — Logging Middleware & Vehicle Maintenance Scheduler

This project is built as part of a backend evaluation assignment. It has two main modules — a reusable **logging middleware** that sends structured logs to a remote service, and a **vehicle maintenance scheduler** that uses the 0/1 Knapsack algorithm to figure out the best set of vehicles to maintain at each depot.

Both modules talk to a remote evaluation API, handle authentication, and work together as a small microservice setup.

---

## Project Structure

```
├── .env                          # credentials and config (not pushed to git)
├── .gitignore
├── logging_middleware/
│   ├── auth.js                   # handles token fetching and caching
│   ├── constants.js              # valid values for stacks, levels, packages
│   ├── index.js                  # main Log() function and Express middleware
│   └── package.json
└── vehicle_maintenance_scheduler/
    ├── api.js                    # API client for fetching depots and vehicles
    ├── knapsack.js               # 0/1 knapsack solver (dynamic programming)
    ├── scheduler.js              # orchestrates the full scheduling pipeline
    ├── server.js                 # Express server with REST endpoints
    ├── test.js                   # unit tests for the knapsack algorithm
    └── package.json
```

---

## Module 1: Logging Middleware

This is a reusable logging module that sends structured log entries to the evaluation service's log collection endpoint. It validates all inputs before sending — things like stack type, severity level, and package name all have to match the allowed values the server expects.

### How it works

- `Log(stack, level, package, message)` — sends a POST request with the log data. The function is non-blocking so it doesn't slow down whatever app is using it.
- It automatically handles authentication (fetches a Bearer token and caches it).
- If the token expires or a 401 comes back, it refreshes the token and retries once.
- There's also a `createExpressLogger()` factory that returns an Express middleware — plug it into any Express app and it'll automatically log every incoming request and outgoing response.

### Allowed values

| Parameter | Allowed Values |
|-----------|---------------|
| Stack | `backend`, `frontend` |
| Level | `debug`, `info`, `warn`, `error`, `fatal` |
| Backend packages | `cache`, `controller`, `cron_job`, `db`, `domain`, `handler`, `repository`, `route`, `service` |
| Frontend packages | `api`, `component`, `hook`, `page`, `state`, `style` |
| Shared packages | `auth`, `config`, `middleware`, `utils` |

### Usage

```javascript
const { Log, createExpressLogger } = require('./logging_middleware');

// send a log
await Log('backend', 'info', 'db', 'Connected to database successfully');

// use as Express middleware
app.use(createExpressLogger('backend', 'middleware'));
```

---

## Module 2: Vehicle Maintenance Scheduler

This is an Express microservice that solves a scheduling optimization problem. Given a list of vehicle maintenance tasks (each with a duration and an impact score) and a set of depots (each with a limited number of mechanic-hours), it figures out which vehicles to schedule at each depot to maximize the total impact.

### The algorithm

I used the **0/1 Knapsack** approach with bottom-up dynamic programming. Each depot is treated as a separate knapsack — the capacity is the depot's available mechanic-hours, and each vehicle task is an item with a weight (duration) and value (impact).

- **Time complexity**: O(n × W) where n is the number of vehicles and W is the capacity
- **Space complexity**: O(n × W) for the DP table
- No external libraries used for the algorithm — it's a pure implementation

### How the pipeline works

1. Fetches all depots and their mechanic-hour budgets from the API
2. Fetches all vehicle maintenance tasks from the API
3. Runs the knapsack solver for each depot independently
4. Returns the optimal schedule with selected vehicles, total impact, and unused hours per depot

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/depots` | Fetch all depots from the evaluation service |
| GET | `/vehicles` | Fetch all vehicle tasks from the evaluation service |
| GET | `/schedule` | Run the full optimization and return results |

### Running it

```bash
# install dependencies
cd logging_middleware && npm install
cd ../vehicle_maintenance_scheduler && npm install

# run the knapsack tests
cd vehicle_maintenance_scheduler
node test.js

# start the server
node server.js
```

The server starts on port 3001 by default (configurable via `SCHEDULER_PORT` in `.env`).

### Tests

There are 8 unit tests covering the knapsack solver:

- Empty input / zero capacity edge cases
- Single item that fits / doesn't fit
- Classic knapsack problem with known optimal solution
- All items fitting within capacity
- A case where greedy by ratio would fail but DP gets it right
- Multi-depot solving

Run them with `node test.js` — no API connection needed.

---

## Setup

1. Clone the repo
2. Create a `.env` file in the root with your credentials:

```
CLIENT_ID=your_client_id
CLIENT_SECRET=your_client_secret
EMAIL=your_email
NAME=your_name
ROLL_NO=your_roll_number
ACCESS_CODE=your_access_code
SCHEDULER_PORT=3001
```

3. Install dependencies in both folders:
```bash
cd logging_middleware && npm install
cd ../vehicle_maintenance_scheduler && npm install
```

4. Start the server:
```bash
cd vehicle_maintenance_scheduler
node server.js
```

5. Hit `http://localhost:3001/schedule` to see the optimization results.

---

## Tech Stack

- **Node.js** with Express
- **node-fetch** for HTTP requests
- **dotenv** for environment variable management
- **Dynamic Programming** for the knapsack optimization (no external solver libraries)

---

Built by **Shreyangshu Das** (RA2311030020016)
