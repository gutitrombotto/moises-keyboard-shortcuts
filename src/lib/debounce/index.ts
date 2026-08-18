export interface TriggerDebouncer {
  shouldTrigger(key: string, now: number): boolean;
}

// Per-key trigger gate: repeats of the same key within windowMs are dropped,
// preventing mute/unmute flicker from key auto-repeat or double taps.
export function createTriggerDebouncer(windowMs: number): TriggerDebouncer {
  const lastTrigger = new Map<string, number>();
  return {
    shouldTrigger(key: string, now: number): boolean {
      const last = lastTrigger.get(key);
      if (last != null && now - last < windowMs) {
        return false;
      }
      lastTrigger.set(key, now);
      return true;
    },
  };
}
