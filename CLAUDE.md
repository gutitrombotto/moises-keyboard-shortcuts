# CLAUDE.md

Chrome extension that adds keyboard shortcuts to Moises.ai's stem player (studio.moises.ai/player2) for muting and soloing tracks without mouse clicks.

## File structure

- `manifest.json` — Manifest V3 config. Content script injected on `studio.moises.ai/*` at `document_idle`. No popup or background worker.
- `config.js` — Shortcut mappings (`SHORTCUTS`) and button class patterns (`ACTION_CLASS_PATTERNS`). Loaded before content.js.
- `content.js` — Keyboard listener, DOM finders, retry logic, and toast notifications. Wrapped in an IIFE.
- `icons/icon128.png` — Extension icon (128x128 PNG).

## Key technical details

- **Button detection**: Moises uses SVG icons inside buttons, not text. Buttons are identified by CSS class substrings: `buttonMute` for mute, `buttonSolo` for solo. Class names have hashed suffixes (e.g. `controls_buttonMute__HNRvx`) so we match the stable prefix.
- **Track detection**: Uses a `TreeWalker` to find a text node matching the track name (e.g. "Vocals"), then walks up the DOM to find the nearest container that has both a mute and solo button.
- **Retry logic**: A `retryUntil(fn, attempts, delay)` helper retries DOM lookups up to 3 times with 100ms delay to handle late-loading elements.
- **Debounce**: Rapid keypresses on the same track+action are ignored if within 300ms of the last trigger, preventing mute/unmute flicker.
- **Input safety**: Shortcuts are ignored when focus is on INPUT/TEXTAREA/SELECT/contentEditable elements, or when Ctrl/Cmd/Alt modifiers are held.

## How to test

1. `chrome://extensions/` > Developer mode > Load unpacked > select this folder
2. Open a song on `studio.moises.ai/player2/...`
3. Press v (Vocals), d (Drums), b (Bass), o (Other) to toggle mute
4. Press Shift+V (Vocals), Shift+D (Drums), Shift+B (Bass), Shift+O (Other) to toggle solo
5. Check DevTools console for `[Moises Keyboard]` log messages

## How to extend

Add entries to `SHORTCUTS` in `config.js`:

```js
'x': { track: 'Piano', action: 'mute' },   // x for Piano mute
'X': { track: 'Piano', action: 'solo' },    // Shift+X for Piano solo
```

Supported actions: `mute`, `solo` (mapped to class patterns in `ACTION_CLASS_PATTERNS`).
