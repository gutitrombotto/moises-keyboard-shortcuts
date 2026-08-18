import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { retryUntil } from '@/lib/retry';

const ATTEMPTS = 3;
const DELAY_MS = 100;

describe('retryUntil', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('resolves immediately when the first attempt succeeds', async () => {
    const fn = vi.fn(() => 'found');
    const result = await retryUntil(fn, ATTEMPTS, DELAY_MS);
    expect(result).toBe('found');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries with the configured delay until the lookup succeeds', async () => {
    const fn = vi.fn().mockReturnValueOnce(null).mockReturnValueOnce(null).mockReturnValue('found');
    const promise = retryUntil<string>(fn, ATTEMPTS, DELAY_MS);
    await vi.advanceTimersByTimeAsync(DELAY_MS * 2);
    expect(await promise).toBe('found');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('resolves null after exhausting all attempts', async () => {
    const fn = vi.fn(() => null);
    const promise = retryUntil(fn, ATTEMPTS, DELAY_MS);
    await vi.advanceTimersByTimeAsync(DELAY_MS * (ATTEMPTS - 1));
    expect(await promise).toBeNull();
    expect(fn).toHaveBeenCalledTimes(ATTEMPTS);
  });

  it('never calls the lookup again after success', async () => {
    const fn = vi.fn().mockReturnValueOnce(null).mockReturnValue('found');
    const promise = retryUntil<string>(fn, ATTEMPTS, DELAY_MS);
    await vi.advanceTimersByTimeAsync(DELAY_MS * ATTEMPTS);
    expect(await promise).toBe('found');
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
