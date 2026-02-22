# Moises Keyboard Shortcuts

Chrome extension that adds keyboard shortcuts to [Moises.ai](https://studio.moises.ai)'s stem player, so you can mute/unmute tracks without clicking.

## Shortcuts

| Key | Action |
|-----|--------|
| `V` | Toggle Vocals mute |
| `D` | Toggle Drums mute |
| `B` | Toggle Bass mute |
| `O` | Toggle Other mute |

Shortcuts are ignored when typing in text inputs or when modifier keys (Ctrl/Cmd/Alt) are held.

## Installation

1. Clone this repo
2. Open `chrome://extensions/`
3. Enable **Developer mode** (top right)
4. Click **Load unpacked** and select the repo folder
5. Open a song in `studio.moises.ai/player2/...` and press a shortcut key

## Adding more shortcuts

Edit `config.js` to add new mappings:

```js
const SHORTCUTS = {
  'v': { track: 'Vocals', action: 'mute' },
  'd': { track: 'Drums', action: 'mute' },
  'b': { track: 'Bass', action: 'mute' },
  'o': { track: 'Other', action: 'mute' },
  // Solo with Shift:
  // 'V': { track: 'Vocals', action: 'solo' },
};
```
