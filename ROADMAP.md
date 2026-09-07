# ROADMAP — Moises Keyboard Shortcuts

Work route derived from `SPECS.md`. Each phase ends with something demonstrable.

## Status

Updated at every phase close. ✅ merged · 🔍 in review/validation · ⬜ not started.

| Phase                              | Status         | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ---------------------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| v1.0–v1.3 — vanilla JS versions    | ✅ published   | v1.3 live on the CWS (item `oednmjhdohclojfahpjabgjmmegojbef`) since 2026-07-19; ~91 users, no ratings yet                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| M1 — Migration to WXT + TypeScript | ✅ 2026-08-17  | Cartly-mirror stack; behavior identical to v1.3; version bumped to 1.4.0 (3-part semver)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| M2 — Tests + CI                    | ✅ 2026-08-17  | 42 tests over player/shell DOM fixture replicas; CI = lint + typecheck + test + build                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| M3 — Docs                          | ✅ 2026-08-17  | SPECS / ROADMAP / CODESTYLE / PRIVACY / README / CLAUDE rewritten to the Cartly format                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| M4 — Store assets + tooling        | ✅ 2026-08-17  | `store-assets/` (listings en/es, 5×2 screenshots 1280×800, icon, justifications, checklist), `.mcp.json` (cws-browser), `/store-check` skill                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| M5 — Manual validation of v1.4.0   | ✅ 2026-08-17  | v1.4.0 verified by hand against the real player — behavior parity with v1.3 confirmed. Legacy v1.3 files removed once the policy hosting was settled (`docs/privacy.html` stays: GitHub Pages serves it as the listing's policy URL)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| M6 — Popup + toast redesign        | ✅ 2026-08-17  | v1.5.0: cheat-sheet popup (contextual status, per-track colors, i18n en/es), toasts with track accent + state chip (`aria-pressed`), restyled feedback pill. [#1](https://github.com/gutitrombotto/moises-keyboard-shortcuts/pull/1), validated by hand on the real player                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| M7 — Publish v1.5.0                | ✅ 2026-08-18  | **Published** — approved by the CWS and auto-published (later superseded by v1.7.0). Full listing normalized: EN+ES descriptions, category Productivity→Tools, 5+5 screenshots, homepage URL, single purpose + host justifications rewritten; data declaration untouched (none collected)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| M8 — pt locale + review prompt     | ✅ 2026-08-25  | **Published 2026-08-25** as part of v1.7.0 — approved and auto-published; the public listing now renders in English + español + português (Brasil). Driven by CWS analytics: ~66% of weekly users speak Portuguese (pt-BR 50% + pt-PT 16%) yet there is no pt listing (only EN+ES), and the item has **0 ratings**. Add `_locales/pt_BR` (Brazil — tailored copy + unlocks the Brazil listing) and base `_locales/pt` (European copy; covers pt-PT and generic pt by fallback) + localize the in-page toasts/feedback strings, and add a non-nagging "rate on the Web Store" prompt after 5 successful uses. Targets the two leaks in the funnel: language coverage and social proof/churn (uninstall/install ≈ 37%)                                                                                                          |
| M9 — Localized track detection fix | ✅ 2026-08-25  | **Published 2026-08-25** in v1.7.0, verified live on the real pt player before submitting. **Critical bug found while validating M8 on the real player.** The player localizes track labels (pt: Vocais/Bateria/Baixo/Outro; the DOM has no language-independent stem id), but `findTrackTextNode` matched the English names exactly → **shortcuts silently broken for every non-English Moises UI** (≈66% pt + es of the base). Almost certainly the main driver of the 37% churn and 0 ratings, and it shipped in every version since v1.3. Fix: `TRACK_LABELS` dict (en/pt verified live, es both spellings) + case-insensitive label match in `dom-finder`; new real-DOM fixtures (`player-pt`/`player-es`). Bumps to v1.7.0 and **gates the publish** — shipping the pt listing without this would invite 1-star reviews |
| M10 — Fail loudly                  | ⬜ not started | Next up. The v1.7.0 measurement (2026-09-07) found no retention improvement even though the base is fully on 1.7.0.0, so the churn cause is still unknown. Make broken states legible — unrecognized player, failed toggle — and route them into the feedback pill, so the next reading is data instead of inference. Gates further feature work; spec + validation matrix below                                                                                                                                                                                                                                                                                                                                                                                                                                              |

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
- **Done when:** item back to "Published" with 1.5.0 and both listing languages populated. ✅ Done: v1.5.0 went live with the EN + ES listings populated.

## M8 — pt locale + review prompt

Data rationale (CWS analytics, 30 days to 2026-08-23): weekly users are Brazil 54% / Chile 31% / US 10%; by language pt-BR 50% + pt-PT 16% + es 12% (~66% Portuguese). Listing exists only in EN+ES. Ratings: **0**. Uninstall/install ≈ 37%. Two levers: language coverage and social proof.

- **pt locale**: ship `public/_locales/pt_BR` (Brazilian copy) **and** base `public/_locales/pt` (European copy), mirroring the `en`/`es` keys. `default_locale` stays `en`. Add `store-assets/listing/pt.md` (pt-BR) for the listing. Coverage, verified faithfully (see below): `pt-BR` UI → `pt_BR`; `pt-PT` UI → `pt` (fallback); bare `pt` → `pt_BR` (Chrome aliases `pt`→pt-BR); so both Portuguese markets get tailored copy and nobody falls to English. `pt_BR` is what unlocks the **Portuguese (Brazil)** listing (the 54%-of-users market); `pt` can back a Portugal listing.
  - **How locale fallback was verified:** a scripted `--lang` launcher sets `getUILanguage()` but does **not** faithfully drive extension message-locale selection (observed: `--lang=es` rendered ES while `--lang=es-ES` rendered EN, both reporting `getUILanguage()=es-ES`; `--lang=pt-BR` fell to EN). The **faithful** method on Linux is the `LANGUAGE`/`LC_*` env vars with the real Chrome binary (no `--lang`). Under it, region→base fallback works exactly as Chrome docs say: `es-419`/`es-MX`/`es-CL` → `_locales/es` (so the existing Spanish locale already covers LatAm — confirmed), and `pt-BR`/`pt-PT`/`pt` all resolve as tabulated above. Repro: `scripts` in the scratchpad load the unpacked build via `chromium.launchPersistentContext` and read `chrome.i18n.getMessage`.
- **In-page string localization**: the toasts and the feedback pill were hardcoded English (`content.ts` built `"${trackName} track not found"`; `feedback/index.ts` used `'⌨️ Shortcuts feedback'`/`'Dismiss'`). Routed through a shared `msg()` helper (`src/lib/i18n`) so es/pt users see their language, not just the popup. Toast copy interpolates the track name — track names stay as-is (they come from the player DOM); only the surrounding words are translated.
- **Review prompt**: after 5 successful toggles (persisted count), surface a one-time, dismissible "enjoying it? rate on the Web Store ★" pill linking to the CWS review URL, reusing the feedback-pill pattern and its `localStorage`-dismissed convention. Stays silent until earned and never reappears once dismissed/rated. Adds two `localStorage` keys (a use counter + a done flag) — still a UI preference the extension generates, so the "no user data collected" declaration is unchanged, but re-read hard rule 3 of `/store-check` before touching the privacy tab.
- **Done when:** the Portuguese listing(s) appear with copy populated; toasts/feedback render localized in es and pt (verified via the `LANGUAGE`-env method); the review prompt fires only after the threshold and never nags. Locale coverage (pt-BR/pt-PT/es-LatAm) already confirmed. ✅ Done 2026-08-25: v1.7.0 live, listing languages = English / español / português (Brasil).

## M10 — Fail loudly (spec + validation matrix)

The v1.7.0 measurement (2026-09-07) closed the M9 hypothesis without replacing it: the base is
fully on 1.7.0.0 and retention did not move, so **why users leave is still unknown**. M10 stops
guessing. It is not a feature — it is closing the four mouths through which a failure currently
leaves no trace, so the next reading is data instead of inference.

**The silent failures, as the code stands today:**

1. `src/entrypoints/content.ts:85` — `if (!hasTrackControls(document)) return;` is a bare return.
   The guard exists for a good reason (the script also runs in the shell frame, which would
   otherwise emit "track not found" toasts), but it **swallows the real breakage too**: if Moises
   renames the `buttonMute` class, every keypress in the player frame does nothing at all — no
   toast, no log, indistinguishable from "the extension isn't installed". Same class of bug as M9,
   one level up, still uncovered.
2. `SHORTCUTS` in `src/lib/config/index.ts` is fixed at four stems. A user on a 5+ stem plan has no
   way to learn that Piano and Guitar have no key; if that plan also renders the four under other
   labels, it falls into (3).
3. The error toast does not diagnose. `Vocals: <not found>` uses the canonical English name — a pt
   user reads "Vocais" in the player and "Vocals" in the toast. It says that something failed, not
   what, and the one datum needed to fix it (which labels the DOM _does_ carry) is thrown away.
4. `nextToggleState` returns `'unknown'` when the button exposes no `aria-pressed`, and the toast
   paints the neutral chip — which reads exactly like a successful unmute. A click that may have
   done nothing looks like success.

**What to build, in order:**

- **M10.1 — Diagnostic error toast.** The highest-yield piece. New `listDetectedTrackLabels(document)`
  in `dom-finder`: walk the elements carrying the mute-button class, climb to each container, read
  its label text node. That yields the player's real stem list. The toast becomes
  `Vocals not found. This player shows: Vocais · Bateria · Baixo · Outro · Piano` + a report link.
  **M9 would have surfaced in a day instead of a month** — the first Brazilian user pressing `v`
  would have seen the real labels on screen.
- **M10.2 — Loud failure in the player frame.** Replace the bare return with a discriminator: shell
  = `studio.moises.ai`, player = the `studio1.moises.ai` iframe. In the player frame, with a
  shortcut pressed and no controls after the probe → a loud "shortcuts unavailable on this player —
  report" toast. The shell stays inert, as it should. **Verify the discriminator against the live
  DOM before relying on it** — this is precisely the kind of assumption that caused M9.
- **M10.3 — The report link carries context.** The feedback pill is a bare Forms URL today; a user
  writes "doesn't work" and it arrives with nothing. Prefill (`?entry.XXX=`) the extension version,
  `browser.i18n.getUILanguage()`, and the detected labels, so each report arrives pre-diagnosed.
  ⚠️ The only privacy-touching part: **stem labels only** (a closed set of UI words) + version +
  language. **Never the song name, never the URL.** Re-read hard rule 3 of `/store-check` before
  touching the privacy tab — the "no user data collected" declaration can and must survive this,
  deliberately rather than by accident.
- **M10.4 — Popup as a diagnostic.** Today it is a cheat-sheet with a green/gray status. Have it
  report: player detected ✓/✗, controls detected ✓/✗, stems found, and which of them hold a key —
  so a 5-stem user sees "Piano — no shortcut" immediately. Done with `tabs.sendMessage` to the
  player frame, which already runs the content script: **no new permissions** (no `scripting`,
  which would force the listing justifications to be rewritten).
- **M10.5 — Make `'unknown'` visible**, and add fixtures: a 5+ stem player and one with the mute
  class renamed, so the loud paths are covered (CODESTYLE §Testing — save the real page first).

**Explicitly not in M10: telemetry.** It is the tempting answer and the wrong one here — it changes
the privacy declaration, drags the item back through CWS review, and at this volume (~89 weekly
users) a working report channel yields more signal than an event funnel. M10 lets the user _tell_
you what broke; it does not watch them.

**Done when:** a player with unknown labels or unknown stems produces a message that names what it
found; a player with no recognizable controls says so instead of going quiet; and either state is
one click from the feedback form with the context already attached.

## Post-v1.5 (backlog)

- ~~**Measure the effect of v1.7.0**~~ — measured 2026-09-07. **The detection hypothesis did not hold.** The rollout is not the excuse: the version chart shows the base essentially fully on 1.7.0.0 within a week of release, so whatever the fix was going to do, it has had the chance to do it. Against that, retention (net recurring users won per install) did **not** improve over the pre-release baseline, pt-BR is still the dominant language among uninstalls — well above its share of installs — and the review prompt has still produced **0 ratings**. Discovery is the one thing clearly up (impressions and listing views both grew), so the funnel leak is after the install, not before it. Caveat kept on the record: the 30-day window straddles the release (about half pre-fix), and monthly volume here is small, so this reads as “no improvement detected” rather than “the fix did nothing”. Two follow-ups, both of which hold either way: **M10 below**, and a clean re-read around 2026-09-22 once the window is fully post-fix.
- ~~**M10 — fail loudly**~~ → promoted to **M10** above (the v1.7.0 measurement made it the gate, not a someday).
- **Premium exploration (Pro tier)**: define what musicians would pay for before building any sales surface. Leading candidates, roughly by value/effort: configurable shortcuts (below), keyboard control of the player's **speed and pitch** (the practice loop: slow down → repeat), per-track **volume nudges**, **scenes/presets** ("practice mode": one key = mute vocals + solo drums), and **MIDI foot-pedal support** via WebMIDI (hands-free control while playing — strongest willingness-to-pay signal). Branding caution: monetizing under the "Moises" name invites a trademark complaint from Music.AI; a paid tier likely needs its own name ("… for Moises.ai" as descriptor).
- **Sales/landing page in Notion**: a public Notion page as the zero-maintenance marketing surface (what it does, GIF/screenshots, install CTA, changelog, Pro pitch when it exists). Cheap to stand up, no domain or Lovable project needed; revisit a real site (Cartly-style Lovable + checkout) only when there is a Pro tier to sell.
- **Configurable shortcuts**: options page to remap keys and add tracks without editing code. First real UI — adopts React + `storage` permission; revisit SPECS §2 stack table when it lands.
- **Dynamic track support**: detect whatever stems the current separation actually has (Piano, Guitar, 5+ stem plans) instead of the fixed four.
- **More actions**: volume up/down per track, pan — the player exposes sliders that the same container-detection could drive.
- ~~**Localized in-page strings** (toasts/feedback)~~ → promoted to **M8** (the analytics made it a priority, not a someday).
- **Firefox/Edge** ports (WXT makes the build trivial; the store processes are the work).
- **Fixture refresh protocol**: when Moises changes its DOM, save the real player frame HTML as the new fixture before fixing detection (every regression fix adds its page first, per CODESTYLE §Testing).
