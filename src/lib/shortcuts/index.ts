import { SHORTCUTS } from '@/lib/config';
import type { MessageKey } from '@/lib/i18n';

export interface TrackKeys {
  track: string;
  muteKey: string;
  soloKey: string | null;
}

// One row per track, in SHORTCUTS insertion order; the solo key is looked up so
// config-only additions (e.g. Piano) appear wherever the table is rendered —
// the popup cheat-sheet and the in-page card share this, and must not drift.
export function collectTrackKeys(): TrackKeys[] {
  const entries = Object.entries(SHORTCUTS);
  const rows: TrackKeys[] = [];
  for (const [key, shortcut] of entries) {
    if (shortcut.action !== 'mute') {
      continue;
    }
    const solo = entries.find(([, s]) => s.track === shortcut.track && s.action === 'solo');
    rows.push({ track: shortcut.track, muteKey: key, soloKey: solo?.[0] ?? null });
  }
  return rows;
}

export interface NativeShortcut {
  key: string;
  labelKey: MessageKey;
}

// Keys the Moises player already binds itself. They are listed so the card is
// the whole keyboard story rather than only our half, and they must never enter
// SHORTCUTS: resolveShortcut returning null is what lets them reach the player.
// Space verified live on the 2026 player (2026-09-07): it toggles playback.
export const PLAYER_NATIVE_SHORTCUTS: readonly NativeShortcut[] = [
  { key: 'Space', labelKey: 'cheatsheetNativePlayPause' },
];
