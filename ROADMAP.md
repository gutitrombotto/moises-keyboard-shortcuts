# ROADMAP — Moises Keyboard Shortcuts

Work route derived from `SPECS.md`. Each phase ends with something demonstrable.

## Status

Updated at every phase close. ✅ merged · 🔍 in review/validation · ⬜ not started.

| Phase                              | Status        | Notes                                                                                                                                                                                                                                                                         |
| ---------------------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| v1.0–v1.3 — vanilla JS versions    | ✅ published  | v1.3 live on the CWS (item `oednmjhdohclojfahpjabgjmmegojbef`) since 2026-07-19; ~91 users, no ratings yet                                                                                                                                                                    |
| M1 — Migration to WXT + TypeScript | ✅ 2026-08-17 | Cartly-mirror stack; behavior identical to v1.3; version bumped to 1.4.0 (3-part semver)                                                                                                                                                                                      |
| M2 — Tests + CI                    | ✅ 2026-08-17 | 42 tests over player/shell DOM fixture replicas; CI = lint + typecheck + test + build                                                                                                                                                                                         |
| M3 — Docs                          | ✅ 2026-08-17 | SPECS / ROADMAP / CODESTYLE / PRIVACY / README / CLAUDE rewritten to the Cartly format                                                                                                                                                                                        |
| M4 — Store assets + tooling        | ✅ 2026-08-17 | `store-assets/` (listings en/es, 5×2 screenshots 1280×800, icon, justifications, checklist), `.mcp.json` (cws-browser), `/store-check` skill                                                                                                                                  |
| M5 — Manual validation of v1.4.0   | ✅ 2026-08-17 | v1.4.0 verified by hand against the real player — behavior parity with v1.3 confirmed. Legacy v1.3 files removed once the policy hosting was settled (`docs/privacy.html` stays: GitHub Pages serves it as the listing's policy URL)                                          |
| M6 — Popup + toast redesign        | ✅ 2026-08-17 | v1.5.0: cheat-sheet popup (contextual status, per-track colors, i18n en/es), toasts with track accent + state chip (`aria-pressed`), restyled feedback pill. [#1](https://github.com/gutitrombotto/moises-keyboard-shortcuts/pull/1), validated by hand on the real player    |
| M7 — Publish v1.5.0                | 🔍 2026-08-18 | **Submitted for review** (user-confirmed) with auto-publish on approval. Full listing normalized: EN+ES descriptions, category Productivity→Tools, 5+5 screenshots, homepage URL, single purpose + host justifications rewritten; data declaration untouched (none collected) |

## M5 — Manual validation matrix (gate for legacy removal)

On a real song at `studio.moises.ai/player2/...` with the unpacked v1.4.0 build:

- Happy path: `v/d/b/o` toggle mute, `Shift+V/D/B/O` toggle solo, confirmation toasts appear, `[Moises Keyboard]` logs in the player-frame console.
- Input safety: shortcuts dead while typing in the song search / any input; `Ctrl+V` pastes normally.
- Frame inertness: no toasts or logs from the shell frame (top-frame console).
- Errors: a made-up track in `SHORTCUTS` produces the red "track not found" toast.
- Debounce: holding `v` does not flicker the mute state.
- Feedback link: pill appears bottom-left in the player, dismissal sticks across reloads.

**Done when:** every row passes → remove the legacy files in a dedicated commit. ✅ Done 2026-08-17: `manifest.json`, `config.js`, `content.js`, `scripts/`, `icons/` and the old `docs/` listing assets removed; `docs/privacy.html` kept as the GitHub-Pages-served policy page.

## M6 — Popup + toast redesign (validation matrix)

On a real song with the unpacked v1.5.0 build, in addition to the M5 matrix:

- Popup: opens on icon click, shows green status on a player tab and gray + open-player link elsewhere; keycaps and colors render; feedback link opens the form; ES locale shows Spanish copy (`chrome://settings/languages`).
- Toasts: mute shows the red MUTE chip when muting and the struck-through chip when unmuting (if the player exposes `aria-pressed`; otherwise the neutral chip is expected); solo shows the green SOLO chip; errors show the ✕ variant.

## M7 — Publish v1.5.0

- Resolve the privacy policy URL (repo public + Pages, or external hosting) and the "Open source" claim in the listing (the linked repo is private).
- `pnpm zip` → upload via `/store-check` Phase 3; listing copy from `store-assets/listing/`, screenshots from `store-assets/screenshots/`.
- The uploaded package's `_locales` unlock the ES listing language in the dashboard (the current listing shows "Spanish (Latin America)" as its language while its copy is English — normalize: EN listing + ES listing, each from its own `.md`).
- **Done when:** item back to "Published" with 1.5.0 and both listing languages populated.

## Post-v1.5 (backlog)

- **Premium exploration (Pro tier)**: define what musicians would pay for before building any sales surface. Leading candidates, roughly by value/effort: configurable shortcuts (below), keyboard control of the player's **speed and pitch** (the practice loop: slow down → repeat), per-track **volume nudges**, **scenes/presets** ("practice mode": one key = mute vocals + solo drums), and **MIDI foot-pedal support** via WebMIDI (hands-free control while playing — strongest willingness-to-pay signal). Branding caution: monetizing under the "Moises" name invites a trademark complaint from Music.AI; a paid tier likely needs its own name ("… for Moises.ai" as descriptor).
- **Sales/landing page in Notion**: a public Notion page as the zero-maintenance marketing surface (what it does, GIF/screenshots, install CTA, changelog, Pro pitch when it exists). Cheap to stand up, no domain or Lovable project needed; revisit a real site (Cartly-style Lovable + checkout) only when there is a Pro tier to sell.
- **Configurable shortcuts**: options page to remap keys and add tracks without editing code. First real UI — adopts React + `storage` permission; revisit SPECS §2 stack table when it lands.
- **Dynamic track support**: detect whatever stems the current separation actually has (Piano, Guitar, 5+ stem plans) instead of the fixed four.
- **More actions**: volume up/down per track, pan — the player exposes sliders that the same container-detection could drive.
- **Localized in-page strings** (toasts/feedback) once there is a strings module worth having.
- **Firefox/Edge** ports (WXT makes the build trivial; the store processes are the work).
- **Fixture refresh protocol**: when Moises changes its DOM, save the real player frame HTML as the new fixture before fixing detection (every regression fix adds its page first, per CODESTYLE §Testing).
