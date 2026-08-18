# ROADMAP — Moises Keyboard Shortcuts

Work route derived from `SPECS.md`. Each phase ends with something demonstrable.

## Status

Updated at every phase close. ✅ merged · 🔍 in review/validation · ⬜ not started.

| Phase                              | Status        | Notes                                                                                                                                                                                                                         |
| ---------------------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| v1.0–v1.3 — vanilla JS versions    | ✅ published  | v1.3 live on the CWS (item `oednmjhdohclojfahpjabgjmmegojbef`) since 2026-07-19; ~91 users, no ratings yet                                                                                                                    |
| M1 — Migration to WXT + TypeScript | ✅ 2026-08-17 | Cartly-mirror stack; behavior identical to v1.3; version bumped to 1.4.0 (3-part semver)                                                                                                                                      |
| M2 — Tests + CI                    | ✅ 2026-08-17 | 42 tests over player/shell DOM fixture replicas; CI = lint + typecheck + test + build                                                                                                                                         |
| M3 — Docs                          | ✅ 2026-08-17 | SPECS / ROADMAP / CODESTYLE / PRIVACY / README / CLAUDE rewritten to the Cartly format                                                                                                                                        |
| M4 — Store assets + tooling        | ✅ 2026-08-17 | `store-assets/` (listings en/es, 5×2 screenshots 1280×800, icon, justifications, checklist), `.mcp.json` (cws-browser), `/store-check` skill                                                                                  |
| M5 — Manual validation of v1.4.0   | ✅ 2026-08-17 | v1.4.0 verified by hand against the real player — behavior parity with v1.3 confirmed. Legacy-file removal deferred until the privacy-policy hosting is decided (the live policy URL points at `docs/privacy.html`)           |
| M6 — Popup + toast redesign        | 🔍            | v1.5.0: cheat-sheet popup (contextual status, per-track colors, i18n en/es), toasts with track accent + state chip (`aria-pressed`), restyled feedback pill. PR pending validation on the real player                         |
| M7 — Publish v1.5.0                | ⬜            | Via `/store-check`; **submission only with explicit user confirmation**. The store jumps 1.3 → 1.5.0 (1.4.0 was never uploaded). Blocker: the declared privacy policy URL 404s (repo is private, no GitHub Pages) — fix first |

## M5 — Manual validation matrix (gate for legacy removal)

On a real song at `studio.moises.ai/player2/...` with the unpacked v1.4.0 build:

- Happy path: `v/d/b/o` toggle mute, `Shift+V/D/B/O` toggle solo, confirmation toasts appear, `[Moises Keyboard]` logs in the player-frame console.
- Input safety: shortcuts dead while typing in the song search / any input; `Ctrl+V` pastes normally.
- Frame inertness: no toasts or logs from the shell frame (top-frame console).
- Errors: a made-up track in `SHORTCUTS` produces the red "track not found" toast.
- Debounce: holding `v` does not flicker the mute state.
- Feedback link: pill appears bottom-left in the player, dismissal sticks across reloads.

**Done when:** every row passes → remove `manifest.json`, `config.js`, `content.js`, `docs/`, `scripts/package.sh` in a dedicated commit (decide the privacy-policy hosting first — the live listing links `docs/privacy.html` via a GitHub Pages URL that is currently broken).

## M6 — Publish v1.4.0

- Resolve the privacy policy URL (repo public + Pages, or external hosting) and the "Open source" claim in the listing (the linked repo is private).
- `pnpm zip` → upload via `/store-check` Phase 3; listing copy from `store-assets/listing/`, screenshots from `store-assets/screenshots/`.
- The uploaded package's `_locales` unlock the ES listing language in the dashboard (the current listing shows "Spanish (Latin America)" as its language while its copy is English — normalize: EN listing + ES listing, each from its own `.md`).
- **Done when:** item back to "Published" with 1.4.0 and both listing languages populated.

## Post-v1.4 (backlog)

- **Configurable shortcuts**: options page to remap keys and add tracks without editing code. First real UI — adopts React + `storage` permission; revisit SPECS §2 stack table when it lands.
- **Dynamic track support**: detect whatever stems the current separation actually has (Piano, Guitar, 5+ stem plans) instead of the fixed four.
- **More actions**: volume up/down per track, pan — the player exposes sliders that the same container-detection could drive.
- **Localized in-page strings** (toasts/feedback) once there is a strings module worth having.
- **Firefox/Edge** ports (WXT makes the build trivial; the store processes are the work).
- **Fixture refresh protocol**: when Moises changes its DOM, save the real player frame HTML as the new fixture before fixing detection (every regression fix adds its page first, per CODESTYLE §Testing).
