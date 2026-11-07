import { describe, expect, it } from 'vitest';

import { isPlayerSurface, isPlayerUrl } from '@/lib/urls';

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

// Only where a player is expected does a missing control mean the extension
// is broken (SPECS §9): the studio1 iframe, or the shell on /play/:trackId.
describe('isPlayerSurface', () => {
  it('recognizes the iframe player host on any path', () => {
    expect(isPlayerSurface('studio1.moises.ai', '/player2/abc123/')).toBe(true);
  });

  it('recognizes the shell when it renders the /play/ player', () => {
    expect(isPlayerSurface('studio.moises.ai', '/play/011af0b7-e934-42d8-9842-cbd3b60dd7a7')).toBe(true);
  });

  it.each(['/play', '/play/', '/player2/abc123', '/', '/library'])(
    'does not expect controls on the shell at %s',
    (pathname) => {
      expect(isPlayerSurface('studio.moises.ai', pathname)).toBe(false);
    },
  );

  it('rejects the ad frames that share the moises.ai site', () => {
    expect(isPlayerSurface('bling-bling.moises.ai', '/play/abc')).toBe(false);
  });

  it('rejects look-alike hosts', () => {
    expect(isPlayerSurface('studio11.moises.ai', '/')).toBe(false);
    expect(isPlayerSurface('studio1.moises.ai.evil.com', '/')).toBe(false);
    expect(isPlayerSurface('studio.moises.ai.evil.com', '/play/abc')).toBe(false);
    expect(isPlayerSurface('', '')).toBe(false);
  });
});
