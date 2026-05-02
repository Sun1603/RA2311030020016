const fetch = require('node-fetch');
const { validateLogParams, VALID_STACKS, VALID_LEVELS, ALL_VALID_PACKAGES, VALID_PACKAGES } = require('./constants');
const { getAuthToken, clearTokenCache } = require('./auth');

const LOG_API_URL = 'http://20.207.122.201/evaluation-service/logs';

async function Log(stack, level, pkg, message) {
  const normalizedStack = String(stack).toLowerCase();
  const normalizedLevel = String(level).toLowerCase();
  const normalizedPkg = String(pkg).toLowerCase();

  const validation = validateLogParams(normalizedStack, normalizedLevel, normalizedPkg, message);
  if (!validation.valid) {
    const errorMsg = `Log validation failed: ${validation.errors.join('; ')}`;
    console.error(`[LogMiddleware] ${errorMsg}`);
    return { success: false, error: errorMsg };
  }

  const logPayload = {
    stack: normalizedStack,
    level: normalizedLevel,
    package: normalizedPkg,
    message: String(message).substring(0, 48)
  };

  try {
    const token = await getAuthToken();

    const response = await fetch(LOG_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(logPayload)
    });

    if (!response.ok) {
      if (response.status === 401) {
        clearTokenCache();
        const newToken = await getAuthToken();
        const retryResponse = await fetch(LOG_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${newToken}`
          },
          body: JSON.stringify(logPayload)
        });

        if (!retryResponse.ok) {
          const errText = await retryResponse.text();
          console.error(`[LogMiddleware] Retry failed (${retryResponse.status}): ${errText}`);
          return { success: false, error: errText };
        }

        const retryData = await retryResponse.json();
        return { success: true, logID: retryData.logID };
      }

      const errText = await response.text();
      console.error(`[LogMiddleware] Log API error (${response.status}): ${errText}`);
      return { success: false, error: errText };
    }

    const data = await response.json();

    const timestamp = new Date().toISOString();
    const levelIcon = { debug: '🔍', info: 'ℹ️', warn: '⚠️', error: '❌', fatal: '💀' };
    console.log(
      `${levelIcon[normalizedLevel] || '📝'} [${timestamp}] [${normalizedStack}/${normalizedPkg}] ` +
      `${normalizedLevel.toUpperCase()}: ${message} (logID: ${data.logID})`
    );

    return { success: true, logID: data.logID };
  } catch (error) {
    console.error(`[LogMiddleware] Failed to send log: ${error.message}`);
    return { success: false, error: error.message };
  }
}

function createExpressLogger(stack = 'backend', pkg = 'middleware') {
  return (req, res, next) => {
    const startTime = Date.now();
    const { method, originalUrl, ip } = req;

    Log(
      stack,
      'info',
      pkg,
      `Incoming ${method} ${originalUrl} from ${ip}`
    );

    const originalEnd = res.end;
    res.end = function (...args) {
      const duration = Date.now() - startTime;
      const statusCode = res.statusCode;

      let level = 'info';
      if (statusCode >= 500) level = 'error';
      else if (statusCode >= 400) level = 'warn';

      Log(
        stack,
        level,
        pkg,
        `${method} ${originalUrl} → ${statusCode} (${duration}ms)`
      );

      originalEnd.apply(res, args);
    };

    next();
  };
}

module.exports = {
  Log,
  createExpressLogger,
  constants: {
    VALID_STACKS,
    VALID_LEVELS,
    ALL_VALID_PACKAGES,
    VALID_PACKAGES
  },
  auth: {
    getAuthToken,
    clearTokenCache
  }
};
