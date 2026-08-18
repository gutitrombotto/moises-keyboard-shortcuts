export const PLAYER_URL = 'https://studio.moises.ai';

// Both the shell origin and the iframe origin count: the user may have either
// as the top-level tab (SPECS §3.2).
export function isPlayerUrl(url: string | undefined): boolean {
  if (url == null) {
    return false;
  }
  return /^https:\/\/studio1?\.moises\.ai\//.test(url);
}
