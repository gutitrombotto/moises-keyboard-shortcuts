import { describe, expect, it } from 'vitest';

import { isPlayerFrame, isPlayerUrl } from '@/lib/urls';

describe('isPlayerUrl', () => {
  it.each([
    'https://studio.moises.ai/player2/abc123',
    'https://studio1.moises.ai/player2/abc123/?shellDisabled=true',
    'https://studio.moises.ai/',
  ])('accepts the player origin %s', (url) => {
    expect(isPlayerUrl(url)).toBe(true);
  });

  it.each([
    'https://moises.ai/',
    'https://bling-bling.moises.ai/banner',
    'https://studio2.moises.ai/player2/abc',
    'http://studio.moises.ai/player2/abc',
    'https://evil.com/https://studio.moises.ai/',
  ])('rejects %s', (url) => {
    expect(isPlayerUrl(url)).toBe(false);
  });

  it('rejects undefined (tab URL not visible without host access)', () => {
    expect(isPlayerUrl(undefined)).toBe(false);
  });
});

// Only the player frame is expected to hold track controls, so only there does
// their absence mean the extension is broken (SPECS §9). Verified live on the
// 2026 player: shell = studio.moises.ai, player = studio1.moises.ai.
describe('isPlayerFrame', () => {
  it('recognizes the player iframe host', () => {
    expect(isPlayerFrame('studio1.moises.ai')).toBe(true);
  });

  it('does not treat the shell host as the player frame', () => {
    expect(isPlayerFrame('studio.moises.ai')).toBe(false);
  });

  it('rejects the ad frames that share the moises.ai site', () => {
    expect(isPlayerFrame('bling-bling.moises.ai')).toBe(false);
  });

  it('rejects look-alike hosts', () => {
    expect(isPlayerFrame('studio11.moises.ai')).toBe(false);
    expect(isPlayerFrame('studio1.moises.ai.evil.com')).toBe(false);
    expect(isPlayerFrame('')).toBe(false);
  });
});
