const LOG_PREFIX = '[Moises Keyboard]';

/* eslint-disable no-console -- the prefixed console is this extension's only
   diagnostic surface (SPECS §7); there is no UI to report through. */
export function log(...args: unknown[]): void {
  console.log(LOG_PREFIX, ...args);
}

export function logError(...args: unknown[]): void {
  console.error(LOG_PREFIX, ...args);
}
