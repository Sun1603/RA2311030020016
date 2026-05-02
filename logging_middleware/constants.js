const VALID_STACKS = ['backend', 'frontend'];

const VALID_LEVELS = ['debug', 'info', 'warn', 'error', 'fatal'];

const BACKEND_PACKAGES = [
  'cache',
  'controller',
  'cron_job',
  'db',
  'domain',
  'handler',
  'repository',
  'route',
  'service'
];

const FRONTEND_PACKAGES = [
  'api',
  'component',
  'hook',
  'page',
  'state',
  'style'
];

const SHARED_PACKAGES = [
  'auth',
  'config',
  'middleware',
  'utils'
];

const VALID_PACKAGES = {
  backend: [...BACKEND_PACKAGES, ...SHARED_PACKAGES],
  frontend: [...FRONTEND_PACKAGES, ...SHARED_PACKAGES]
};

const ALL_VALID_PACKAGES = [
  ...new Set([...BACKEND_PACKAGES, ...FRONTEND_PACKAGES, ...SHARED_PACKAGES])
];

function validateLogParams(stack, level, pkg, message) {
  const errors = [];

  if (!stack || typeof stack !== 'string') {
    errors.push('stack is required and must be a string');
  } else if (!VALID_STACKS.includes(stack.toLowerCase())) {
    errors.push(`Invalid stack "${stack}". Allowed: ${VALID_STACKS.join(', ')}`);
  }

  if (!level || typeof level !== 'string') {
    errors.push('level is required and must be a string');
  } else if (!VALID_LEVELS.includes(level.toLowerCase())) {
    errors.push(`Invalid level "${level}". Allowed: ${VALID_LEVELS.join(', ')}`);
  }

  if (!pkg || typeof pkg !== 'string') {
    errors.push('package is required and must be a string');
  } else {
    const normalizedStack = stack ? stack.toLowerCase() : '';
    const allowedPackages = VALID_PACKAGES[normalizedStack] || ALL_VALID_PACKAGES;
    if (!allowedPackages.includes(pkg.toLowerCase())) {
      errors.push(
        `Invalid package "${pkg}" for stack "${normalizedStack}". Allowed: ${allowedPackages.join(', ')}`
      );
    }
  }

  if (!message || typeof message !== 'string') {
    errors.push('message is required and must be a string');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

module.exports = {
  VALID_STACKS,
  VALID_LEVELS,
  BACKEND_PACKAGES,
  FRONTEND_PACKAGES,
  SHARED_PACKAGES,
  VALID_PACKAGES,
  ALL_VALID_PACKAGES,
  validateLogParams
};
