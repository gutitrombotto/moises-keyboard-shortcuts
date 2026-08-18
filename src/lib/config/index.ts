export type TrackAction = 'mute' | 'solo';

export interface Shortcut {
  track: string;
  action: TrackAction;
}

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

export const RETRY_ATTEMPTS = 3;
export const RETRY_DELAY_MS = 100;
export const DEBOUNCE_MS = 300;

// Opt-in feedback link shown once (dismissible) in the player. '' disables it.
export const FEEDBACK_URL: string = 'https://forms.gle/rcxd1vMkeJ7VDuE97';
