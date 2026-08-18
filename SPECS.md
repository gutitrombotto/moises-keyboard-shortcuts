# SPECS — Moises Keyboard Shortcuts (Chrome Extension)

Technical specification. Source of truth for architecture, DOM detection, keyboard behavior, and functional scope.

## 1. Product Summary

Moises Keyboard Shortcuts is a B2C Chrome extension (Manifest V3) that adds keyboard shortcuts to [Moises.ai](https://studio.moises.ai)'s stem player: mute or solo any of the four standard stems (Vocals, Drums, Bass, Other) with a single keypress, so musicians practicing with an instrument in their hands never reach for the mouse.

**Value proposition:**

- **Zero friction**: no popup, no options page, no account. Install it, open a song, press a key.
- **Privacy-absolute**: no data collected, and the extension performs **zero network requests**. It is a content script that reads and clicks the page it runs on, nothing else.

**Supported platform (v1.4):** Chrome desktop. The extension runs only on `studio.moises.ai` and `studio1.moises.ai`.

**Repository:** private, `github.com/gutitrombotto/moises-keyboard-shortcuts`. Workflow: **PR-based with `main`** — CI (lint + typecheck + test + build) must pass before merge. Details in `CODESTYLE.md` §Git.

**Published:** Chrome Web Store item `oednmjhdohclojfahpjabgjmmegojbef`, account gutitrombotto@gmail.com. Store operations are specified in `.claude/skills/store-check/SKILL.md`; listing sources of truth live in `store-assets/`.

## 2. Tech Stack

| Layer               | Choice                  | Rationale                                                                  |
| ------------------- | ----------------------- | -------------------------------------------------------------------------- |
| Extension framework | **WXT**                 | Best-maintained MV3 framework: manifest generation, HMR, store packaging   |
| Language            | **TypeScript (strict)** | The DOM-detection contracts are the core of the product                    |
| UI                  | **None**                | No popup/options/background; the toast and feedback link are built in-page |
| Persistence         | **None**                | The only stored byte is a `localStorage` feedback-link dismissal flag      |
| Testing             | **Vitest + happy-dom**  | DOM finders are tested against saved replicas of the real player DOM       |

No React, Tailwind, or state library: there is no UI surface to justify them. If a real UI appears (e.g. a shortcut-configuration options page, see ROADMAP), it adopts Cartly's React stack.

### 2.1 Project structure

WXT conventions (`entrypoints/` is framework-mandated). This tree is normative — `CODESTYLE.md` enforces it.

```
moises-keyboard-shortcuts/
├── wxt.config.ts                    # manifest per §3.1
├── package.json / tsconfig.json / .prettierrc / eslint.config.js
├── .github/workflows/ci.yml         # lint + typecheck + test + build
├── .mcp.json                        # cws-browser MCP server for store operations
├── .claude/skills/store-check/      # CWS audit & publish protocol
├── public/
│   ├── icon/                        # 16/32/48/128 PNG
│   └── _locales/{en,es}/messages.json
├── src/
│   ├── entrypoints/
│   │   └── content.ts               # keydown orchestration; composes lib modules
│   └── lib/
│       ├── config/index.ts          # SHORTCUTS, ACTION_CLASS_PATTERNS, timing constants
│       ├── keyboard/index.ts        # §5: shortcut resolution + input safety (pure)
│       ├── dom-finder/index.ts      # §4: track/button detection + frame guard (pure DOM)
│       ├── retry/index.ts           # retryUntil helper
│       ├── debounce/index.ts        # per-key trigger gate
│       ├── toast/index.ts           # §7 in-page notifications
│       ├── feedback/index.ts        # §7 opt-in feedback link
│       └── logger/index.ts          # prefixed console wrapper
├── store-assets/                    # CWS listing sources of truth
└── tests/
    ├── dom/
    │   └── fixtures/                # player.html (studio1 frame) + shell.html replicas
    ├── keyboard/
    ├── debounce/
    └── retry/
```

Legacy v1.3 files (`manifest.json`, `config.js`, `content.js`, `docs/`, `scripts/`) remain in the tree until the migrated build is validated by hand against the real player; they are then removed in their own commit (ROADMAP).

## 3. Platform & Permissions Model

### 3.1 Manifest

- `content_scripts`: one script, `matches: ["https://studio.moises.ai/*", "https://studio1.moises.ai/*"]`, `run_at: document_idle`, `all_frames: true`.
- `host_permissions`: the same two origins — the extension's entire access surface.
- `default_locale: en`; `name`/`description` localized via `public/_locales` (en, es).
- No `permissions`, no background service worker, no action popup.

### 3.2 Iframe architecture (why `all_frames`)

The page at `studio.moises.ai/player2/<id>` is only a **shell**: the actual stem player is served inside a **cross-origin iframe on `studio1.moises.ai`** (`/player2/<id>/?shellDisabled=true`). The track controls and the keyboard focus live inside that iframe, so a top-frame-only injection sees nothing. This is why the manifest matches both origins and sets `all_frames: true` — the script must run _inside_ the player frame. The shell page also embeds unrelated `bling-bling.moises.ai` ad/paywall iframes, which match no pattern and are never injected.

### 3.3 Frame-inert guard

With `all_frames`, the script also loads in the shell frame. Before acting on any shortcut, the handler checks `hasTrackControls()` (a `[class*="buttonMute"]` probe) and stays inert in frames without track controls — otherwise every keypress on the shell would emit a false "track not found" toast (§9).

## 4. DOM Detection Engine

Moises renders SVG-icon buttons with CSS-module class names whose suffixes are hashed per build (`controls_buttonMute__HNRvx`). Nothing in the DOM is a stable id, so detection anchors on two invariants: **stable class-name prefixes** and **visible track labels**.

### 4.1 Track detection

A `TreeWalker` over text nodes finds the node whose trimmed `textContent` **exactly equals** the track name (`Vocals`, `Drums`, `Bass`, `Other`). Exact match keeps aria-labels ("Mute Vocals") and subtitles from matching. From that node, the finder climbs at most 15 ancestors to the nearest element containing **both** a mute and a solo button — that pairing identifies a track row. The climb bound stops a lookup from escaping to a shared ancestor (the whole track list) when a row is malformed.

The **Smart Metronome** row shares the control button classes but has its own label, so anchoring on the track name keeps it out of every lookup.

### 4.2 Button matching

Within the track container, buttons are matched by `className.includes(pattern)` with the stable prefixes from `ACTION_CLASS_PATTERNS`: `buttonMute` for mute, `buttonSolo` for solo. The match is a substring on purpose — the hashed suffix changes with Moises deploys, the prefix has not.

### 4.3 Retry

The player mounts tracks lazily. Each DOM lookup (text node → container → button) runs through `retryUntil(fn, 3, 100)`: up to 3 attempts, 100 ms apart, resolving `null` on exhaustion. Misses surface per the taxonomy in §9.

### 4.4 Debounce

A trigger for the same `track:action` pair within **300 ms** of the last accepted one is dropped. This prevents mute/unmute flicker from key auto-repeat and double taps. The window is measured from the last **accepted** trigger, so holding a key does not lock the gate shut forever.

## 5. Keyboard Model

Shortcut resolution is a pure lookup on `KeyboardEvent.key`: a Shift-ed letter arrives as its uppercase form, which is how mute/solo share a physical key without reading `shiftKey`.

| Key | Track  | Action | Key (Shift) | Action |
| --- | ------ | ------ | ----------- | ------ |
| `v` | Vocals | mute   | `V`         | solo   |
| `d` | Drums  | mute   | `D`         | solo   |
| `b` | Bass   | mute   | `B`         | solo   |
| `o` | Other  | mute   | `O`         | solo   |

**Input safety (BR-1):**

- Keypresses are ignored while focus is on `INPUT`, `TEXTAREA`, `SELECT`, or any `contentEditable` element.
- Keypresses with Ctrl/Cmd/Alt held pass through untouched, so `Ctrl+V` keeps pasting.
- `preventDefault()` is called only after a shortcut fully resolves (mapped key, player frame, debounce passed) — unmapped keys are never swallowed.

Adding a shortcut is a config-only change: a new entry in `SHORTCUTS` (`config/index.ts`) whose track name matches the label in the player UI.

## 6. Business Rules

- **BR-1 — Input safety**: per §5. Covered by unit tests.
- **BR-2 — Frame inertness**: in a frame without track controls the extension produces no toasts, no logs per keypress, and no `preventDefault`. Covered by fixture tests on the shell replica.
- **BR-3 — Exact track match**: a track lookup matches only the exact visible label; the Smart Metronome row is never operated on. Covered by fixture tests.
- **BR-4 — Every failure is visible**: any lookup miss after retries produces an error toast naming the track and stage (§9), never a silent no-op — a musician mid-practice must know the keypress did nothing.
- **BR-5 — Zero network**: the extension performs no fetch/XHR/beacon of any kind. The feedback link (§7) only opens a URL in a new tab when clicked.

## 7. In-Page UI

No extension pages; both surfaces are injected into the player frame:

- **Toast** — fixed top-right notification, auto-dismissed after 1.5 s (0.3 s fade). Dark for confirmations ("Vocals mute toggled"), red for errors (§9). One toast at a time; a new one replaces the current.
- **Feedback link** — opt-in, dismissible "⌨️ Shortcuts feedback" pill (bottom-left) linking to a Google Form. Shown only in the frame with track controls, once the player has mounted (probe: 10 × 500 ms). Dismissal persists in `localStorage` (`moises-kb-feedback-dismissed`); storage failures in sandboxed frames fail open. Disabled by setting `FEEDBACK_URL` to `''`.
- **Console log** — every action and failure is logged with the `[Moises Keyboard]` prefix; this is the only diagnostic surface.

## 8. Localization

Manifest name/description come from `public/_locales/{en,es}/messages.json` (`default_locale: en`). The extension name stays untranslated in both locales — the brand is what users search. In-page strings (toasts, feedback link) are English-only in v1.4: they are 3-word status confirmations, not UI copy worth a strings module yet.

## 9. Error / Toast Taxonomy

Every failure path is a logged error plus a red toast; there are no typed exceptions because no failure crosses a module boundary — each miss resolves `null` and is surfaced at the orchestration layer (`content.ts`).

| Failure                              | Detected by                 | Console (`[Moises Keyboard]`)                      | Toast (red)                         |
| ------------------------------------ | --------------------------- | -------------------------------------------------- | ----------------------------------- |
| Track label absent after retries     | `findTrackTextNode` → null  | `Track "<track>" not found after retries`          | `<track> track not found`           |
| No ancestor with mute+solo buttons   | `findTrackContainer` → null | `Could not find track container for "<track>"`     | `<track> container not found`       |
| Button class pattern matches nothing | `findActionButton` → null   | `<action> button not found in "<track>" container` | `<track> <action> button not found` |

Success path: console `<track> <action> toggled` + dark toast with the same text.

A "track not found" toast on a real player frame is the product's breakage signal: it means Moises renamed a track label or rehashed beyond the class prefixes (§4), and `ACTION_CLASS_PATTERNS`/fixtures need updating.

## 10. Out of Scope (v1.4) / Deferred

- Configurable shortcuts (options page UI) — would introduce the React stack and `storage` permission.
- Dynamic track discovery (Piano, Guitar, multi-stem separations) beyond config-file edits.
- Other players (player v1, mobile web) and other browsers (Firefox, Edge).
- Localized in-page strings (toasts).
