export const PLAYER_URL = 'https://studio.moises.ai';

// Both the shell origin and the iframe origin count: the user may have either
// as the top-level tab (SPECS §3.2).
export function isPlayerUrl(url: string | undefined): boolean {
  if (url == null) {
    return false;
  }
  return /^https:\/\/studio1?\.moises\.ai\//.test(url);
}

// Two players are live at once. The iframe player renders in a
// studio1.moises.ai frame nested in the studio.moises.ai shell; the content
// script runs in both under all_frames, and only the iframe holds controls.
// The /play/:trackId player renders in the shell document itself, while the
// bare /play path is the library, which never holds controls.
//
// Verified live: iframe player on 2026-09-07 (shell zero buttons, studio1 5
// mute + 5 solo); /play/ player on 2026-11-06 (shell 5 mute + 5 solo, no
// player iframe). The shell and studio1 are same-site, so the iframe is not a
// separate debug target and the check has to be the URL.
const PLAYER_FRAME_HOST = 'studio1.moises.ai';
const SHELL_HOST = 'studio.moises.ai';
const SHELL_PLAYER_PATH = /^\/play\/[^/]+/;

// Where track controls are expected, so that their absence means the extension
// is broken rather than simply out of place.
export function isPlayerSurface(hostname: string, pathname: string): boolean {
  if (hostname === PLAYER_FRAME_HOST) {
    return true;
  }
  return hostname === SHELL_HOST && SHELL_PLAYER_PATH.test(pathname);
}
