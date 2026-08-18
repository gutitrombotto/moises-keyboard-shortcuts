# Moises Keyboard Shortcuts

**Mute or solo any track in [Moises.ai](https://studio.moises.ai)'s stem player with a single keypress — no mouse needed.**

When you're practicing with an instrument in your hands, reaching for the mouse to click a tiny mute button breaks your flow. This Chrome extension keeps your hands where they belong.

![Manifest V3](https://img.shields.io/badge/Manifest-V3-green) ![Chrome](https://img.shields.io/badge/platform-Chrome-blue) ![License](https://img.shields.io/badge/license-MIT-lightgrey)

## Shortcuts

| Key | Track  | Action | Key           | Action |
| --- | ------ | ------ | ------------- | ------ |
| `v` | Vocals | mute   | `Shift` + `V` | solo   |
| `d` | Drums  | mute   | `Shift` + `D` | solo   |
| `b` | Bass   | mute   | `Shift` + `B` | solo   |
| `o` | Other  | mute   | `Shift` + `O` | solo   |

A small toast confirms every action. Shortcuts are disabled while typing in text fields, and modifier combinations (`Ctrl`/`Cmd`/`Alt` + key) pass through untouched — `Ctrl+V` keeps pasting.

## Install

### From the Chrome Web Store

[**Moises Keyboard Shortcuts**](https://chromewebstore.google.com/detail/moises-keyboard-shortcuts/oednmjhdohclojfahpjabgjmmegojbef) — install, open a song at `studio.moises.ai/player2/...`, press a key. No setup, no configuration, no account.

### Unpacked (development build)

```bash
pnpm install
pnpm build      # produces .output/chrome-mv3
```

Load `./.output/chrome-mv3` as an unpacked extension in `chrome://extensions` (Developer mode).

## Privacy

The extension collects **nothing** and makes **zero network requests**. It runs only on the two Moises player domains and clicks the same buttons you would. See [`PRIVACY.md`](./PRIVACY.md).

## Adding more shortcuts

Add entries to `SHORTCUTS` in [`src/lib/config/index.ts`](./src/lib/config/index.ts):

```ts
x: { track: 'Piano', action: 'mute' },   // x mutes Piano
X: { track: 'Piano', action: 'solo' },   // Shift+X solos Piano
```

Track names must match the label shown in the Moises player UI.

## Development

```bash
pnpm install
pnpm dev        # WXT dev server
pnpm test       # Vitest suite (DOM fixtures + pure logic)
pnpm lint       # ESLint + Prettier check
pnpm typecheck  # tsc --noEmit
pnpm zip        # package for the Chrome Web Store (leaves the ZIP in .output/)
```

## Tech Overview

| Component | Stack                                                                       |
| --------- | --------------------------------------------------------------------------- |
| Extension | WXT · TypeScript (strict) · Manifest V3 · content script only (no UI pages) |
| Detection | TreeWalker on track labels → nearest container with mute+solo buttons       |
| Testing   | Vitest + happy-dom over saved replicas of the player DOM                    |

The player lives in a cross-origin iframe on `studio1.moises.ai`; the architecture that follows from that is documented in [`SPECS.md`](./SPECS.md).

## Project Documents

- [`SPECS.md`](./SPECS.md) — technical specification (source of truth).
- [`ROADMAP.md`](./ROADMAP.md) — phased work plan and release status.
- [`CODESTYLE.md`](./CODESTYLE.md) — code conventions.
- [`store-assets/`](./store-assets) — Chrome Web Store listing sources of truth.

## License

MIT
