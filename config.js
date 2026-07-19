const SHORTCUTS = {
  'v': { track: 'Vocals', action: 'mute' },
  'd': { track: 'Drums', action: 'mute' },
  'b': { track: 'Bass', action: 'mute' },
  'o': { track: 'Other', action: 'mute' },
  'V': { track: 'Vocals', action: 'solo' },
  'D': { track: 'Drums', action: 'solo' },
  'B': { track: 'Bass', action: 'solo' },
  'O': { track: 'Other', action: 'solo' },
};

const ACTION_CLASS_PATTERNS = {
  'mute': 'buttonMute',
  'solo': 'buttonSolo',
};

// Opt-in feedback link shown once (dismissible) in the player.
// Paste your Google Form URL (or a mailto: address). Leave '' to disable.
const FEEDBACK_URL = 'https://forms.gle/rcxd1vMkeJ7VDuE97';
