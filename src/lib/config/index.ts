export type TrackAction = 'mute' | 'solo';

export interface Shortcut {
  track: string;
  action: TrackAction;
}

// The resulting state of a toggle click; 'unknown' when the player's button
// exposes no aria-pressed to read.
export type ToggleState = 'on' | 'off' | 'unknown';

// Keys are KeyboardEvent.key values: a Shift-ed letter arrives as its uppercase
// form, which is how "v = mute, Shift+V = solo" works without reading e.shiftKey.
export const SHORTCUTS: Readonly<Record<string, Shortcut>> = {
  v: { track: 'Vocals', action: 'mute' },
  d: { track: 'Drums', action: 'mute' },
  b: { track: 'Bass', action: 'mute' },
  o: { track: 'Other', action: 'mute' },
  V: { track: 'Vocals', action: 'solo' },
  D: { track: 'Drums', action: 'solo' },
  B: { track: 'Bass', action: 'solo' },
  O: { track: 'Other', action: 'solo' },
};

// Moises buttons carry hashed class suffixes (controls_buttonMute__HNRvx), so
// matching is by stable substring, never by full class name.
export const ACTION_CLASS_PATTERNS: Readonly<Record<TrackAction, string>> = {
  mute: 'buttonMute',
  solo: 'buttonSolo',
};

// The player localizes the visible track label to the user's Moises UI language,
// and the row exposes no language-independent stem id (no data-*, no per-stem
// icon or aria-label — verified live on the 2026 DOM). So detection matches the
// label text against this table, case-insensitively. Each key is the canonical
// (English) stem used everywhere else (SHORTCUTS, TRACK_COLORS, the popup); the
// list is every label that stem is known to render as. Verified on the live
// player for en and pt (pt-BR/pt-PT); es carries both common spellings pending a
// live check. Add a language by extending each stem's list.
export const TRACK_LABELS: Readonly<Record<string, readonly string[]>> = {
  Vocals: ['Vocals', 'Vocais', 'Voz', 'Voces'],
  Drums: ['Drums', 'Bateria', 'Batería'],
  Bass: ['Bass', 'Baixo', 'Bajo'],
  Other: ['Other', 'Outro', 'Outros', 'Otro', 'Otros'],
};

// Track accent colors, shared by the popup cheat-sheet and the toasts. Tracks
// added to SHORTCUTS without an entry here fall back to the neutral gray.
export const TRACK_COLORS: Readonly<Record<string, string>> = {
  Vocals: '#3ee6a0',
  Drums: '#5ea0ff',
  Bass: '#c084fc',
  Other: '#fbbf24',
};

export const DEFAULT_TRACK_COLOR = '#9ca3af';

export const RETRY_ATTEMPTS = 3;
export const RETRY_DELAY_MS = 100;
export const DEBOUNCE_MS = 300;

// Opt-in feedback link shown once (dismissible) in the player. '' disables it.
export const FEEDBACK_URL: string = 'https://forms.gle/rcxd1vMkeJ7VDuE97';

// Chrome Web Store review page for this item. '' disables the review prompt.
export const REVIEW_URL: string =
  'https://chromewebstore.google.com/detail/oednmjhdohclojfahpjabgjmmegojbef/reviews';

// Successful toggles before the one-time review prompt is earned. Low enough to
// catch the intent window, high enough that the user has felt the value first.
export const REVIEW_PROMPT_AFTER = 5;
