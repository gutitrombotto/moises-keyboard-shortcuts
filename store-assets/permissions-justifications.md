# Chrome Web Store — Permission justifications & privacy practices

Drafts for the "Privacy practices" tab of the CWS developer dashboard. All text in English, as required by the dashboard.

## Single purpose statement

Moises Keyboard Shortcuts adds keyboard shortcuts to the Moises.ai stem player (studio.moises.ai): pressing a key mutes or solos the matching track by clicking the player's own buttons.

## Permission justifications

The extension declares **no API permissions** — no `storage`, no `scripting`, no `tabs`. Its entire access surface is two host permissions backing one content script.

### Host permission `https://studio.moises.ai/*`

The Moises stem player is reached at this origin, and the content script must run here to add keyboard shortcuts to it. Moises serves two players: the newer one (`studio.moises.ai/play/...`) renders the track list with the mute/solo buttons directly on this origin; the classic one uses this page as a shell that embeds the player in an iframe (see below).

### Host permission `https://studio1.moises.ai/*`

The classic stem player — the track list with the mute/solo buttons the extension clicks — is served **inside a cross-origin iframe on this second Moises-owned origin** (`studio1.moises.ai/player2/...`). A content script limited to the first origin never sees its track controls, so the extension needs both. This is the entire reason there are two host permissions; both belong to Moises.ai.

The content script listens for keyboard events and clicks mute/solo buttons in the page. It reads nothing beyond the track labels and button classes it needs to find those buttons, and sends nothing anywhere.

### Dashboard field "Justificación de Permiso de host" (combined, as pasted)

The extension needs host access to exactly two Moises-owned origins, because Moises currently serves two stem players. The newer player (studio.moises.ai/play/...) renders the track list with the mute/solo buttons directly on studio.moises.ai. The classic player uses studio.moises.ai only as a shell and serves the track list inside a cross-origin iframe on studio1.moises.ai, so a script limited to the first origin never sees its controls. The content script therefore runs on both origins. It listens for keyboard events and clicks the player's own mute/solo buttons. It reads nothing beyond the track labels it needs to find those buttons, injects only on these two origins, makes zero network requests, and collects no data.

## Privacy practices — draft answers

### What user data is handled?

**None.** The extension:

- makes **zero network requests** — there is no server, no analytics, no telemetry, no third-party service;
- stores nothing except a single local `localStorage` flag remembering that the user dismissed the optional in-player feedback link (the link, if clicked, opens a Google Form in a new tab — nothing is sent unless the user clicks and submits it themselves);
- has no account system and never sees who the user is or what they play.

### Dashboard checklist answers

Data types — **check none**. Google defines "handle" as "collecting, transmitting, using, or sharing user data", including local processing. The only candidate is the dismissal flag, which is not user data under any listed category (not PII, not authentication, not location, not web history, not website content — it is a UI preference the extension itself generates).

Certifications — all three can be signed: no data sold or transferred to third parties, no use unrelated to the single purpose, no creditworthiness or lending use.

**Privacy policy URL:** `https://gutitrombotto.github.io/moises-keyboard-shortcuts/privacy.html` — served via GitHub Pages from `main:/docs/privacy.html`, kept in sync with `PRIVACY.md`.

### Remote code

**No.** The extension executes no remotely hosted code — it is a single bundled content script and makes no network requests at all.
