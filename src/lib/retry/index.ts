// Retries a synchronous DOM lookup until it yields a value or attempts run out.
// Resolves with null on exhaustion — callers decide how to surface the miss.
export function retryUntil<T>(fn: () => T | null, attempts: number, delayMs: number): Promise<T | null> {
  return new Promise((resolve) => {
    const tryOnce = (attempt: number): void => {
      const result = fn();
      if (result != null || attempt >= attempts) {
        resolve(result);
        return;
      }
      setTimeout(() => {
        tryOnce(attempt + 1);
      }, delayMs);
    };
    tryOnce(1);
  });
}
