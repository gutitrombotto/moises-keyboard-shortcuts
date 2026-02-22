# CLAUDE.md

Chrome extension that adds keyboard shortcuts to Moises.ai's stem player (studio.moises.ai/player2) for muting tracks without mouse clicks.

## File structure

- `manifest.json` — Manifest V3 config. Content script injected on `studio.moises.ai/*` at `document_idle`. No popup or background worker.
- `config.js` — Shortcut mappings (`SHORTCUTS`) and button class patterns (`ACTION_CLASS_PATTERNS`). Loaded before content.js.
- `content.js` — Keyboard listener, DOM finders, retry logic, and toast notifications. Wrapped in an IIFE.
- `icons/icon128.png` — Extension icon (128x128 PNG).

## Key technical details

- **Button detection**: Moises uses SVG icons inside buttons, not text. Buttons are identified by CSS class substrings: `buttonMute` for mute, `buttonSolo` for solo. Class names have hashed suffixes (e.g. `controls_buttonMute__HNRvx`) so we match the stable prefix.
- **Track detection**: Uses a `TreeWalker` to find a text node matching the track name (e.g. "Vocals"), then walks up the DOM to find the nearest container that has both a mute and solo button.
- **Retry logic**: If DOM elements aren't found on first try, retries up to 3 times with 100ms delay to handle late-loading elements.
- **Input safety**: Shortcuts are ignored when focus is on INPUT/TEXTAREA/SELECT/contentEditable elements, or when Ctrl/Cmd/Alt modifiers are held.

## How to test

1. `chrome://extensions/` > Developer mode > Load unpacked > select this folder
2. Open a song on `studio.moises.ai/player2/...`
3. Press V (Vocals), D (Drums), B (Bass), O (Other) to toggle mute
4. Check DevTools console for `[Moises Keyboard]` log messages

## How to extend

Add entries to `SHORTCUTS` in `config.js`:

```js
'V': { track: 'Vocals', action: 'solo' },  // Shift+V for solo
```

Supported actions: `mute`, `solo` (mapped to class patterns in `ACTION_CLASS_PATTERNS`).
