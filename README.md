# Moises Keyboard Shortcuts

A Chrome extension that adds keyboard shortcuts to [Moises.ai](https://studio.moises.ai)'s stem player — mute or solo any track with a single keypress, no mouse needed.

## Shortcuts

### Mute

| Key | Track |
|-----|-------|
| `v` | Vocals |
| `d` | Drums |
| `b` | Bass |
| `o` | Other |

### Solo

| Key | Track |
|-----|-------|
| `Shift` + `V` | Vocals |
| `Shift` + `D` | Drums |
| `Shift` + `B` | Bass |
| `Shift` + `O` | Other |

> Shortcuts are disabled when typing in text fields or when modifier keys (`Ctrl` / `Cmd` / `Alt`) are held.

## Installation

### From the Chrome Web Store

*Coming soon* — the extension is currently pending review.

### Manual (developer mode)

1. Clone this repo
2. Open `chrome://extensions/`
3. Enable **Developer mode** (top right)
4. Click **Load unpacked** and select the repo folder
5. Open a song at `studio.moises.ai/player2/...` and press a shortcut key

## Adding more shortcuts

Edit `config.js` to add new mappings:

```js
const SHORTCUTS = {
  // Mute (lowercase)
  'v': { track: 'Vocals', action: 'mute' },
  'd': { track: 'Drums', action: 'mute' },
  'b': { track: 'Bass', action: 'mute' },
  'o': { track: 'Other', action: 'mute' },
  'x': { track: 'Piano', action: 'mute' },   // add your own

  // Solo (Shift = uppercase)
  'V': { track: 'Vocals', action: 'solo' },
  'D': { track: 'Drums', action: 'solo' },
  'B': { track: 'Bass', action: 'solo' },
  'O': { track: 'Other', action: 'solo' },
  'X': { track: 'Piano', action: 'solo' },   // add your own
};
```

Track names must match the label shown in the Moises player UI.

## Packaging

```bash
./scripts/package.sh
# Creates build/extension.zip ready for Chrome Web Store upload
```

## License

MIT
