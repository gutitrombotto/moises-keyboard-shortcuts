import { describe, expect, it } from 'vitest';

import { isPlayerUrl } from '@/lib/urls';

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
