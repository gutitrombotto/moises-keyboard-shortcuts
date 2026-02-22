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
