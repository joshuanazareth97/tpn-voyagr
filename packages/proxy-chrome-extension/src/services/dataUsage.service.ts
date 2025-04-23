// Service to track data usage and speed

let bytesUp = 0;
let bytesDown = 0;
let lastUp = 0;
let lastDown = 0;
let lastTimestamp = Date.now();

/**
 * Initialize or reset the counters
 */
export const init = () => {
  bytesUp = 0;
  bytesDown = 0;
  lastUp = 0;
  lastDown = 0;
  lastTimestamp = Date.now();
};

/**
 * Add outgoing byte count
 */
export const addUp = (count: number) => {
  bytesUp += count;
};

/**
 * Add incoming byte count
 */
export const addDown = (count: number) => {
  bytesDown += count;
};

/**
 * Reset counters (alias of init)
 */
export const reset = init;

/**
 * Get total data usage in bytes
 */
export const getDataUsage = () => {
  return {
    up: bytesUp,
    down: bytesDown,
  };
};

/**
 * Compute and return current speed in bytes per second
 */
export const getSpeed = () => {
  const now = Date.now();
  const deltaTime = (now - lastTimestamp) / 1000;
  const up = (bytesUp - lastUp) / deltaTime;
  const down = (bytesDown - lastDown) / deltaTime;
  lastUp = bytesUp;
  lastDown = bytesDown;
  lastTimestamp = now;
  return { up, down };
};
