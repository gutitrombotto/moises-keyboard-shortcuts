export const PLAYER_URL = 'https://studio.moises.ai';

// Both the shell origin and the iframe origin count: the user may have either
// as the top-level tab (SPECS §3.2).
export function isPlayerUrl(url: string | undefined): boolean {
  if (url == null) {
    return false;
  }
  return /^https:\/\/studio1?\.moises\.ai\//.test(url);
}

// The player renders in a studio1.moises.ai iframe nested in the
// studio.moises.ai shell; the content script runs in both under all_frames.
// Only the player frame is expected to hold track controls, so only there does
// their absence mean the extension is broken rather than simply out of place.
//
// Verified live on the 2026 player (2026-09-07): shell = studio.moises.ai
// (top frame, zero mute/solo buttons), player = studio1.moises.ai (5 mute + 5
// solo). The two are same-site, so the iframe shares the shell's process and
// is not a separate debug target — the check has to be the hostname.
export const PLAYER_FRAME_HOST = 'studio1.moises.ai';

export function isPlayerFrame(hostname: string): boolean {
  return hostname === PLAYER_FRAME_HOST;
}
